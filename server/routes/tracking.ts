import express, { Request, Response } from 'express';
import fetch from 'node-fetch';
import { OrderRepository } from '../repositories/OrderRepository';
import { SettingsRepository } from '../repositories/SettingsRepository';
import { UserRepository } from '../repositories/UserRepository';
import { PartnerRepository } from '../repositories/PartnerRepository';
import {
  sendEmail,
  generateOrderStatusUpdateEmailHtml,
  generateOrderShippedEmailHtml
} from '../utils/mailer';
import { sendTelegramAlert } from '../utils/telegram';

export const trackingRouter = express.Router();

/**
 * Helper to format DTDC date strings (e.g. '01082026' -> '01 Aug 2026' or '01/08/2026')
 */
export function formatDtdcDate(rawDate?: string): string {
  if (!rawDate || typeof rawDate !== 'string') return '';
  const clean = rawDate.trim();
  if (clean.length === 8 && /^\d{8}$/.test(clean)) {
    const day = clean.substring(0, 2);
    const monthIndex = parseInt(clean.substring(2, 4), 10) - 1;
    const year = clean.substring(4, 8);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthName = months[monthIndex] || clean.substring(2, 4);
    return `${day} ${monthName} ${year}`;
  }
  return clean;
}

/**
 * Helper to format DTDC time strings (e.g. '2059' -> '20:59' or '20:37:59' -> '20:37')
 */
export function formatDtdcTime(rawTime?: string): string {
  if (!rawTime || typeof rawTime !== 'string') return '';
  const clean = rawTime.trim();
  if (clean.length === 4 && /^\d{4}$/.test(clean)) {
    return `${clean.substring(0, 2)}:${clean.substring(2, 4)}`;
  }
  if (clean.length >= 5 && clean.includes(':')) {
    return clean.substring(0, 5);
  }
  return clean;
}

/**
 * Fetches tracking details directly from DTDC REST API
 */
export async function fetchDtdcShipmentDetails(awb: string): Promise<any> {
  const cleanAwb = (awb || '').trim();
  if (!cleanAwb) {
    return {
      success: false,
      status: 'INVALID_AWB',
      error: 'Empty consignment or AWB number provided.',
      shipment: null,
      tracking: [],
      coordinates: []
    };
  }

  const payload = {
    TrkType: 'cnno',
    strcnno: cleanAwb,
    addtnlDtl: 'Y'
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch('https://blktracksvc.dtdc.com/dtdc-api/rest/JSONCnTrk/getTrackDetails', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'API-key': '8b513c582da0d1c16ab6a83bde78be',
        'x-access-token': 'PL4367_trk_json:5c27265012a84bdcf22c8986f8b6a02a'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        success: false,
        status: `HTTP_${response.status}`,
        error: `DTDC server responded with status ${response.status}`,
        shipment: null,
        tracking: [],
        coordinates: []
      };
    }

    const data: any = await response.json();

    const header = data.trackHeader || null;

    // If header is missing or empty, handle not found / failed response cleanly
    if (!header || Object.keys(header).length === 0 || !header.strShipmentNo) {
      let errorMsg = 'No tracking data found for this consignment number.';
      if (Array.isArray(data.errorDetails) && data.errorDetails.length > 0) {
        errorMsg = data.errorDetails.map((e: any) => e.strError || e.value).filter(Boolean).join('; ');
      }
      return {
        success: false,
        status: data.status || 'FAILED',
        error: errorMsg,
        shipment: null,
        tracking: [],
        coordinates: []
      };
    }

  const rawStatus = String(header.strStatus || '').trim();
  const rawBookingDate = header.strBookedDate || '';
  const rawBookingTime = header.strBookedTime || '';
  const rawStatusDate = header.strStatusTransOn || '';
  const rawStatusTime = header.strStatusTransTime || '';
  const rawExpectedDelivery = header.strExpectedDeliveryDate || '';
  const rawRevExpectedDelivery = header.strRevExpectedDeliveryDate || '';

  const shipment = {
    awb: header.strShipmentNo || cleanAwb,
    reference_number: header.strRefNo || '',
    cn_type: header.strCNType || '',
    cn_type_code: header.strCNTypeCode || '',
    customer_code: header.strCNActCustCode || '',
    customer_name: header.strCNTypeName || '',
    product: header.strCNProduct || 'STANDARD',
    mode: header.strMode || null,
    cod_fod: header.strCNProdCODFOD || '',
    origin: header.strOrigin || '',
    destination: header.strDestination || '',
    booking_date: rawBookingDate,
    booking_time: rawBookingTime,
    pieces: header.strPieces || '1',
    weight: header.strWeight || null,
    weight_unit: header.strWeightUnit || null,
    status: rawStatus || 'In Transit',
    status_date: rawStatusDate,
    status_time: rawStatusTime,
    status_code: header.strStatusRelCode || '',
    remarks: header.strRemarks || '',
    attempts: header.strNoOfAttempts || '',
    rto_number: header.strRtoNumber || '',
    complaint_number: header.strComplaintNo || '',
    expected_delivery_date: rawExpectedDelivery,
    revised_expected_delivery_date: rawRevExpectedDelivery,
    // Formatted helper fields for UI rendering
    formatted_booking_date: formatDtdcDate(rawBookingDate),
    formatted_booking_time: formatDtdcTime(rawBookingTime),
    formatted_expected_delivery_date: formatDtdcDate(rawExpectedDelivery || rawRevExpectedDelivery),
    formatted_status_date: formatDtdcDate(rawStatusDate),
    formatted_status_time: formatDtdcTime(rawStatusTime)
  };

  const rawEvents = Array.isArray(data.trackDetails) ? data.trackDetails : [];
  const trackingEvents = rawEvents.map((event: any) => {
    const latStr = (event.strLatitude || '').trim();
    const lngStr = (event.strLongitude || '').trim();
    const lat = latStr && !isNaN(Number(latStr)) ? parseFloat(latStr) : null;
    const lng = lngStr && !isNaN(Number(lngStr)) ? parseFloat(lngStr) : null;

    const rawDate = event.strActionDate || '';
    const rawTime = event.strActionTime || '';

    return {
      code: event.strCode || '',
      action: event.strAction || 'In Transit',
      manifest_number: event.strManifestNo || '',
      origin: event.strOrigin || '',
      destination: event.strDestination || '',
      origin_code: event.strOriginCode || '',
      destination_code: event.strDestinationCode || '',
      date: rawDate,
      time: rawTime,
      formatted_date: formatDtdcDate(rawDate),
      formatted_time: formatDtdcTime(rawTime),
      remarks: (event.sTrRemarks || event.strRemarks || '').trim(),
      latitude: event.strLatitude || '',
      longitude: event.strLongitude || '',
      receiver_contact_updated: event.strReceiverContactUpdated || null,
      receiver_contact_updated_date: event.strReceiverContactUpdatedDate || null,
      receiver: event.strCode === 'DLV' ? (event.sTrRemarks || event.strRemarks || null) : null,
      otp_used: event.strSCDOTP || null,
      hasCoordinates: lat !== null && lng !== null && lat !== 0 && lng !== 0
    };
  });

  // Extract coordinates for map pins
  const coordinatesList = trackingEvents
    .filter((e: any) => e.hasCoordinates)
    .map((e: any) => ({
      latitude: Number(e.latitude),
      longitude: Number(e.longitude),
      label: e.action || 'Checkpoint',
      location: e.origin || e.destination || '',
      date: `${e.formatted_date || formatDtdcDate(e.date)} ${e.formatted_time || formatDtdcTime(e.time)}`.trim(),
      remarks: e.remarks === '0.00' ? '' : (e.remarks || ''),
      isDelivered: e.code === 'DLV' || String(e.action).toLowerCase().includes('delivered'),
      isOutForDelivery: e.code === 'OUTDLV' || String(e.action).toLowerCase().includes('out for delivery')
    }));

  return {
    success: true,
    status: data.status || 'SUCCESS',
    shipment,
    tracking: trackingEvents,
    coordinates: coordinatesList,
    rawResponse: {
      statusCode: data.statusCode,
      statusFlag: data.statusFlag,
      status: data.status,
      version: data.version,
      trackHeader: header,
      trackDetails: rawEvents
    }
  };
  } catch (networkError: any) {
    return {
      success: false,
      status: 'NETWORK_ERROR',
      error: networkError.message || 'Unable to communicate with DTDC tracking service',
      shipment: null,
      tracking: [],
      coordinates: []
    };
  }
}

/**
 * Maps DTDC shipment and events to internal Order Status
 */
export function mapDtdcToInternalStatus(dtdcStatus: string, events: any[] = []): string {
  const statusStr = String(dtdcStatus || '').toLowerCase();
  
  // Check events first for definitive flags
  const hasDeliveredEvent = events.some(e => e.code === 'DLV' || String(e.action).toLowerCase() === 'delivered');
  if (hasDeliveredEvent || statusStr === 'delivered' || statusStr.includes('delivered')) {
    return 'Delivered';
  }

  const hasOutForDelivery = events.some(e => e.code === 'OUTDLV' || String(e.action).toLowerCase().includes('out for delivery'));
  if (hasOutForDelivery || statusStr.includes('out for delivery') || statusStr.includes('outfordelivery')) {
    return 'Out for Delivery';
  }

  if (statusStr.includes('rto') || statusStr.includes('return') || statusStr.includes('cancelled')) {
    return 'Cancelled';
  }

  if (statusStr.includes('in transit') || statusStr.includes('booked') || statusStr.includes('dispatched') || events.length > 0) {
    return 'Shipped';
  }

  return 'Shipped';
}

/**
 * Synchronizes an order's status and dispatches customer notification when changed
 */
export async function syncOrderWithDtdcTracking(order: any, dtdcResult: any): Promise<{
  order: any;
  updated: boolean;
  oldStatus: string;
  newStatus: string;
  emailSent: boolean;
}> {
  const currentStatus = order.status || 'Pending';
  const mappedStatus = mapDtdcToInternalStatus(dtdcResult.shipment?.status, dtdcResult.tracking);
  
  let updated = false;
  let emailSent = false;

  const normalizeStatus = (s: string) => s.toLowerCase().replace(/[\s_-]/g, '');
  const isStatusDifferent = normalizeStatus(currentStatus) !== normalizeStatus(mappedStatus);

  // Status progression check: Don't downgrade 'Delivered'
  const isDeliveredDowngrade = normalizeStatus(currentStatus) === 'delivered' && normalizeStatus(mappedStatus) !== 'delivered';

  if (isStatusDifferent && !isDeliveredDowngrade) {
    console.log(`[Tracking Sync] Updating Order #${order.orderNumber}: ${currentStatus} -> ${mappedStatus} (DTDC: ${dtdcResult.shipment?.status})`);
    
    const updatedOrder = await OrderRepository.update(order.id, {
      status: mappedStatus,
      courierName: 'DTDC Express',
      trackingUrl: `https://track.dtdc.com/ctrk-web-war/track/search?reqType=tracking&awbNo=${order.awbNumber}`
    });

    updated = true;

    // Sync referral commission status if linked to a partner
    PartnerRepository.syncOrderStatusToReferral(order.orderNumber, mappedStatus).catch(err =>
      console.warn(`[Tracking Partner Sync] Failed to sync referral for #${order.orderNumber}:`, err)
    );

    // Retrieve recipient email
    let rawEmail = 
      updatedOrder?.customer?.email || 
      updatedOrder?.shippingAddress?.email || 
      order.customer?.email || 
      order.shippingAddress?.email;

    let recipientEmail = rawEmail ? String(rawEmail).trim().toLowerCase() : '';

    if (!recipientEmail && (order.customer?.id || updatedOrder?.customer?.id)) {
      try {
        const uId = updatedOrder?.customer?.id || order.customer?.id;
        const usr = await UserRepository.getById(uId);
        if (usr?.email) recipientEmail = usr.email.trim().toLowerCase();
      } catch (_) {}
    }

    if (recipientEmail) {
      try {
        const siteSettings = await SettingsRepository.get();
        let subject = `Order #${order.orderNumber} Status Update: ${mappedStatus} | ${siteSettings.storeName || 'Aapla Jalgaonwala'}`;
        
        if (mappedStatus === 'Delivered') {
          subject = `🎉 Your Order #${order.orderNumber} Has Been Delivered! | ${siteSettings.storeName || 'Aapla Jalgaonwala'}`;
        } else if (mappedStatus === 'Out for Delivery') {
          subject = `🚚 Your Order #${order.orderNumber} is Out for Delivery! | ${siteSettings.storeName || 'Aapla Jalgaonwala'}`;
        } else if (mappedStatus === 'Shipped') {
          subject = `📦 Your Order #${order.orderNumber} Has Been Shipped! | ${siteSettings.storeName || 'Aapla Jalgaonwala'}`;
        }

        const html = mappedStatus === 'Shipped'
          ? generateOrderShippedEmailHtml(updatedOrder || order, siteSettings)
          : generateOrderStatusUpdateEmailHtml(updatedOrder || order, mappedStatus, siteSettings);

        emailSent = await sendEmail({
          to: recipientEmail,
          subject,
          html
        });
        console.log(`[Tracking Sync] Customer update email sent to ${recipientEmail}: ${emailSent ? 'SUCCESS' : 'FAILED'}`);
      } catch (mailErr) {
        console.warn(`[Tracking Sync] Failed sending email notification for #${order.orderNumber}:`, mailErr);
      }
    }

    // Send Telegram Alert on milestone
    if (mappedStatus === 'Delivered' || mappedStatus === 'Out for Delivery') {
      sendTelegramAlert(`🚚 <b>DTDC Delivery Milestone</b>\nOrder: <b>#${order.orderNumber}</b>\nStatus: <b>${mappedStatus}</b>\nAWB: <code>${order.awbNumber}</code>\nCustomer: ${order.customer?.name || order.shippingAddress?.fullName || 'N/A'}`).catch(() => {});
    }

    return {
      order: updatedOrder || order,
      updated,
      oldStatus: currentStatus,
      newStatus: mappedStatus,
      emailSent
    };
  }

  return {
    order,
    updated: false,
    oldStatus: currentStatus,
    newStatus: currentStatus,
    emailSent: false
  };
}

export interface DtdcValidationResult {
  isValid: boolean;
  error?: string;
  awbNumber: string;
  details?: {
    shipmentNo?: string;
    origin?: string;
    destination?: string;
    status?: string;
    bookedDate?: string;
    expectedDelivery?: string;
  };
}

/**
 * Strictly validates a DTDC tracking / consignment number before adding to an order.
 * Verifies format (8-15 alphanumeric) and live DTDC tracking status.
 */
export async function validateDtdcTracking(awb: string): Promise<DtdcValidationResult> {
  const cleanAwb = (awb || '').trim().toUpperCase();

  if (!cleanAwb) {
    return {
      isValid: false,
      error: 'Please enter a DTDC tracking number.',
      awbNumber: cleanAwb
    };
  }

  // Format validation: DTDC consignment numbers are between 8 and 15 alphanumeric characters
  if (cleanAwb.length < 8 || cleanAwb.length > 15) {
    return {
      isValid: false,
      error: `Invalid DTDC tracking format. Consignment number must be between 8 and 15 alphanumeric characters (entered ${cleanAwb.length}).`,
      awbNumber: cleanAwb
    };
  }

  if (!/^[A-Z0-9]+$/.test(cleanAwb)) {
    return {
      isValid: false,
      error: 'Invalid DTDC tracking format. Only letters and numbers are permitted (no symbols or spaces).',
      awbNumber: cleanAwb
    };
  }

  // Live check with DTDC tracking service
  try {
    const payload = {
      TrkType: 'cnno',
      strcnno: cleanAwb,
      addtnlDtl: 'Y'
    };

    const response = await fetch('https://blktracksvc.dtdc.com/dtdc-api/rest/JSONCnTrk/getTrackDetails', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'API-key': '8b513c582da0d1c16ab6a83bde78be',
        'x-access-token': 'PL4367_trk_json:5c27265012a84bdcf22c8986f8b6a02a'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      return {
        isValid: false,
        error: `DTDC verification service returned HTTP ${response.status}. Please check tracking number and try again.`,
        awbNumber: cleanAwb
      };
    }

    const data: any = await response.json();

    const isSuccess = (data.statusFlag === true || data.statusFlag === 'true' || data.status === 'SUCCESS') && !!data.trackHeader?.strShipmentNo;

    if (!isSuccess) {
      let rawError = 'Consignment not found on DTDC tracking network.';
      if (Array.isArray(data.errorDetails) && data.errorDetails.length > 0) {
        rawError = data.errorDetails.map((e: any) => e.strError || e.value).filter(Boolean).join('; ');
      }
      return {
        isValid: false,
        error: `Invalid DTDC tracking number: ${rawError}`,
        awbNumber: cleanAwb
      };
    }

    const header = data.trackHeader || {};
    return {
      isValid: true,
      awbNumber: header.strShipmentNo || cleanAwb,
      details: {
        shipmentNo: header.strShipmentNo || cleanAwb,
        origin: header.strOrigin || 'JALGAON',
        destination: header.strDestination || '',
        status: header.strStatus || 'In Transit',
        bookedDate: formatDtdcDate(header.strBookedDate),
        expectedDelivery: formatDtdcDate(header.strExpectedDeliveryDate || header.strRevExpectedDeliveryDate)
      }
    };
  } catch (err: any) {
    return {
      isValid: false,
      error: `DTDC tracking validation error: ${err.message || 'Unable to connect to DTDC server.'}`,
      awbNumber: cleanAwb
    };
  }
}

/**
 * ----------------------------------------------------
 * 0. AWB VALIDATION ROUTE (PRE-CHECK BEFORE ASSIGNING)
 * ----------------------------------------------------
 * GET /api/tracking/validate/:awb
 * POST /api/tracking/validate
 */
trackingRouter.get('/validate/:awb', async (req: Request, res: Response) => {
  try {
    const { awb } = req.params;
    const result = await validateDtdcTracking(awb);
    if (!result.isValid) {
      return res.status(400).json({ success: false, ...result });
    }
    return res.json({ success: true, ...result });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

trackingRouter.post('/validate', async (req: Request, res: Response) => {
  try {
    const awb = req.body?.awb || req.body?.awbNumber;
    const result = await validateDtdcTracking(awb);
    if (!result.isValid) {
      return res.status(400).json({ success: false, ...result });
    }
    return res.json({ success: true, ...result });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * ----------------------------------------------------
 * 1. SINGLE AWB TRACKING ROUTE
 * ----------------------------------------------------
 * GET /api/tracking/:awb
 */
trackingRouter.get('/:awb', async (req: Request, res: Response) => {
  try {
    const { awb } = req.params;
    
    if (!awb || awb.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'AWB number is required' });
    }

    const dtdcData = await fetchDtdcShipmentDetails(awb);

    // Look for matching order in our system to keep data synchronized in real-time
    let orderSyncInfo: any = null;
    try {
      const orders = await OrderRepository.getAll();
      const cleanAwb = awb.trim().toLowerCase();
      const matchedOrder = orders.find(o => o.awbNumber && o.awbNumber.trim().toLowerCase() === cleanAwb);
      
      if (matchedOrder) {
        const syncResult = await syncOrderWithDtdcTracking(matchedOrder, dtdcData);
        orderSyncInfo = {
          orderId: matchedOrder.id,
          orderNumber: matchedOrder.orderNumber,
          oldStatus: syncResult.oldStatus,
          newStatus: syncResult.newStatus,
          updated: syncResult.updated,
          emailSent: syncResult.emailSent
        };
      }
    } catch (dbErr) {
      console.warn('[Tracking API] Order auto-sync notice:', dbErr);
    }

    const mappedStatus = mapDtdcToInternalStatus(dtdcData.shipment?.status, dtdcData.tracking);

    return res.json({
      ...dtdcData,
      mappedStatus,
      orderSync: orderSyncInfo
    });

  } catch (error: any) {
    console.error('[Tracking API] Error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Failed to fetch tracking details from courier' });
  }
});

/**
 * ----------------------------------------------------
 * 2. CRON JOB ENDPOINT TO CHECK ALL ACTIVE ORDERS
 * ----------------------------------------------------
 * GET /api/tracking/cron/sync-all
 * POST /api/tracking/cron/sync-all
 *
 * Checks all non-delivered orders that have an AWB number,
 * queries DTDC, updates their statuses in DB, and emails customers!
 */
export async function handleCronTrackingSync(req: Request, res: Response) {
  const startTime = Date.now();
  console.log('[Tracking Cron] 🔄 Running hourly courier tracking synchronization...');

  try {
    const orders = await OrderRepository.getAll();
    
    // Filter active orders that have an AWB number and are not yet Delivered / Cancelled
    const activeDispatchedOrders = orders.filter((order) => {
      const s = (order.status || '').toLowerCase();
      const hasAwb = order.awbNumber && order.awbNumber.trim().length > 0;
      return hasAwb && s !== 'delivered' && s !== 'cancelled' && s !== 'refunded';
    });

    console.log(`[Tracking Cron] Found ${activeDispatchedOrders.length} active dispatched orders to verify.`);

    const results: any[] = [];
    let updatedCount = 0;
    let emailsSentCount = 0;

    for (const order of activeDispatchedOrders) {
      try {
        const awb = order.awbNumber!.trim();
        const dtdcData = await fetchDtdcShipmentDetails(awb);

        if (dtdcData.success && dtdcData.shipment) {
          const syncResult = await syncOrderWithDtdcTracking(order, dtdcData);
          if (syncResult.updated) {
            updatedCount++;
            if (syncResult.emailSent) emailsSentCount++;
          }

          results.push({
            orderNumber: order.orderNumber,
            awbNumber: awb,
            oldStatus: syncResult.oldStatus,
            newStatus: syncResult.newStatus,
            dtdcStatus: dtdcData.shipment.status,
            latestLocation: dtdcData.shipment.destination || dtdcData.shipment.origin,
            expectedDelivery: dtdcData.shipment.expected_delivery_date,
            statusUpdated: syncResult.updated,
            emailDispatched: syncResult.emailSent
          });
        } else {
          results.push({
            orderNumber: order.orderNumber,
            awbNumber: awb,
            statusUpdated: false,
            note: dtdcData.error || 'No tracking events found at DTDC portal yet'
          });
        }
      } catch (singleErr: any) {
        results.push({
          orderNumber: order.orderNumber,
          awbNumber: order.awbNumber,
          statusUpdated: false,
          error: singleErr.message || 'Tracking verification skipped'
        });
      }
    }

    const durationMs = Date.now() - startTime;
    console.log(`[Tracking Cron] ✅ Sync completed in ${durationMs}ms. Checked: ${activeDispatchedOrders.length}, Updated: ${updatedCount}, Emails: ${emailsSentCount}`);

    return res.json({
      success: true,
      message: `DTDC courier tracking sync completed successfully in ${durationMs}ms`,
      timestamp: new Date().toISOString(),
      cronInterval: 'Hourly',
      totalActiveOrdersChecked: activeDispatchedOrders.length,
      totalOrdersUpdated: updatedCount,
      totalEmailsDispatched: emailsSentCount,
      results
    });
  } catch (error: any) {
    console.error('[Tracking Cron] Fatal error during tracking cron execution:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Tracking cronjob failed',
      timestamp: new Date().toISOString()
    });
  }
}

// Register Cron Endpoint aliases
trackingRouter.get('/cron/sync-all', handleCronTrackingSync);
trackingRouter.post('/cron/sync-all', handleCronTrackingSync);
trackingRouter.get('/cron/sync', handleCronTrackingSync);
trackingRouter.post('/cron/sync', handleCronTrackingSync);

