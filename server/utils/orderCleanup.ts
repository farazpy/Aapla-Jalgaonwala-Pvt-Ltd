import { OrderRepository } from '../repositories/OrderRepository';
import { SettingsRepository } from '../repositories/SettingsRepository';
import { dispatchOrderConfirmationNotifications } from './orderNotifications';
import Razorpay from 'razorpay';

let razorpayClient: any = null;
let lastKeyId = '';
let lastKeySecret = '';

async function getRazorpayClient(): Promise<any> {
  try {
    const siteSettings = await SettingsRepository.get();
    const keyId = (siteSettings.razorpayKeyId || '').trim() || process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = (siteSettings.razorpayKeySecret || '').trim() || process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret || keyId.length < 8) {
      return null;
    }

    if (!razorpayClient || keyId !== lastKeyId || keySecret !== lastKeySecret) {
      razorpayClient = new (Razorpay as any)({
        key_id: keyId,
        key_secret: keySecret
      });
      lastKeyId = keyId;
      lastKeySecret = keySecret;
    }

    return razorpayClient;
  } catch (err) {
    console.error('[Order Reconciler] Failed to initialize Razorpay client:', err);
    return null;
  }
}

/**
 * Periodically syncs recent Razorpay payments (last 25 payments) with the orders database.
 * If any payment is 'captured' on Razorpay:
 * 1. Finds the corresponding order (by notes.orderId, receipt, or payment transaction ID).
 * 2. If the order is 'Pending', 'Payment Pending', 'Cancelled', or 'Payment Failed', updates it to 'Confirmed' & 'Paid'.
 * 3. Dispatches Telegram, customer email, and admin email alerts immediately.
 * 4. If the order was accidentally deleted previously or missing, automatically reconstructs it so it appears in Admin!
 */
export async function syncRecentRazorpayPayments(): Promise<{ reconciledCount: number; recoveredCount: number }> {
  let reconciledCount = 0;
  let recoveredCount = 0;

  try {
    const rzp = await getRazorpayClient();
    if (!rzp) {
      return { reconciledCount: 0, recoveredCount: 0 };
    }

    // Fetch recent 25 payments from Razorpay
    const paymentsList = await rzp.payments.all({ count: 25 }).catch((err: any) => {
      console.warn('[Order Reconciler] Razorpay fetch payments warning:', err?.message || err);
      return null;
    });

    if (!paymentsList || !Array.isArray(paymentsList.items)) {
      return { reconciledCount: 0, recoveredCount: 0 };
    }

    const allOrders = await OrderRepository.getAll(true);

    for (const payment of paymentsList.items) {
      // Only care about captured payments
      if (payment.status !== 'captured') {
        continue;
      }

      const paymentId = payment.id;
      const razorpayOrderId = payment.order_id;
      const notesOrderId = payment.notes?.orderId || payment.notes?.order_id;
      const receiptNumber = payment.notes?.receipt || payment.description?.match(/AJW-\d+-\d+/)?.[0];
      const isCodAdvance = payment.notes?.isCodAdvance === 'true';
      const advanceFee = Number(payment.notes?.advanceFee || 0);
      const remainingBalance = Number(payment.notes?.remainingBalance || 0);
      const isTestMode = payment.notes?.isTestMode === 'true';

      // Find matching order in DB
      let matchedOrder = allOrders.find(o => 
        (notesOrderId && o.id === notesOrderId) ||
        (receiptNumber && o.orderNumber === receiptNumber) ||
        (o.paymentDetails?.transactionId === paymentId) ||
        (razorpayOrderId && o.paymentDetails?.razorpayOrderId === razorpayOrderId)
      );

      if (matchedOrder) {
        const isAlreadyPaid = matchedOrder.paymentStatus === 'Paid' || (isCodAdvance && matchedOrder.paymentStatus === 'Partial Paid');
        const isConfirmed = matchedOrder.status === 'Confirmed' || matchedOrder.status === 'Processing' || matchedOrder.status === 'Shipped' || matchedOrder.status === 'Delivered';

        if (!isAlreadyPaid || !isConfirmed) {
          console.log(`[Order Reconciler] Found paid order that needs confirmation: #${matchedOrder.orderNumber} (Payment: ${paymentId})`);

          const updates: any = {
            status: 'Confirmed',
            paymentStatus: isCodAdvance ? 'Partial Paid' : 'Paid',
            paymentMethod: isCodAdvance ? 'COD' : 'Razorpay',
            paymentDetails: {
              ...(matchedOrder.paymentDetails || {}),
              method: isCodAdvance ? 'COD Deposit (Razorpay)' : 'Razorpay',
              transactionId: paymentId,
              razorpayOrderId: razorpayOrderId,
              advanceFeePaid: isCodAdvance ? advanceFee : undefined,
              remainingBalance: isCodAdvance ? remainingBalance : 0,
              paidAt: new Date(payment.created_at * 1000).toISOString(),
              upiVpa: payment.vpa || payment.upi?.vpa,
              rrn: payment.acquirer_data?.rrn
            }
          };

          if (isCodAdvance) {
            updates.codAdvanceFeePaid = advanceFee;
            updates.codRemainingBalance = remainingBalance;
          }

          const updated = await OrderRepository.update(matchedOrder.id, updates);
          if (updated) {
            await dispatchOrderConfirmationNotifications(updated);
            reconciledCount++;
            console.log(`[Order Reconciler] Successfully confirmed and dispatched alerts for order #${updated.orderNumber}`);
          }
        }
      } else if (notesOrderId || receiptNumber) {
        // Order was deleted or never reached the DB, but payment was captured!
        console.log(`[Order Reconciler] CRITICAL: Captured payment ${paymentId} has NO order in database! Reconstructing order #${receiptNumber || notesOrderId}...`);

        const orderNum = receiptNumber || `AJW-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;
        const customerName = payment.description?.replace(/^(Full Payment for Order|COD Advance Deposit for Order)\s*/i, '').trim() || 
          (payment.email ? payment.email.split('@')[0].replace(/\./g, ' ') : 'Valued Customer');
        const customerEmail = payment.email || '';
        const customerPhone = (payment.contact || '').replace(/\D/g, '').slice(-10);
        const paidAmount = Number(payment.amount) / 100;

        const reconstructedOrder = await OrderRepository.create({
          id: notesOrderId || `ord_${Date.now()}_rec`,
          orderNumber: orderNum,
          customer: {
            name: customerName,
            email: customerEmail,
            phone: customerPhone
          },
          shippingAddress: {
            fullName: customerName,
            phone: customerPhone,
            email: customerEmail,
            addressLine1: 'Customer Address (Payment Received via UPI/Razorpay)',
            city: 'Maharashtra',
            state: 'Maharashtra',
            pincode: '425001'
          },
          items: [
            {
              id: `item_rec_${Date.now()}`,
              productId: 'online_order',
              productName: `Aapla Jalgaonwala Order Items (${orderNum})`,
              quantity: 1,
              price: paidAmount,
              profit: 20
            }
          ],
          subtotal: paidAmount,
          discount: 0,
          shippingFee: 0,
          totalAmount: paidAmount,
          status: 'Confirmed',
          paymentStatus: isCodAdvance ? 'Partial Paid' : 'Paid',
          paymentMethod: isCodAdvance ? 'COD' : 'Razorpay',
          paymentDetails: {
            method: isCodAdvance ? 'COD Deposit (Razorpay)' : 'Razorpay',
            transactionId: paymentId,
            razorpayOrderId: razorpayOrderId,
            advanceFeePaid: isCodAdvance ? advanceFee : undefined,
            remainingBalance: isCodAdvance ? remainingBalance : 0,
            paidAt: new Date(payment.created_at * 1000).toISOString(),
            upiVpa: payment.vpa || payment.upi?.vpa,
            rrn: payment.acquirer_data?.rrn
          },
          notes: `[Auto-Reconstructed from Razorpay Payment ${paymentId}] UPI VPA: ${payment.vpa || payment.upi?.vpa || 'N/A'}, RRN: ${payment.acquirer_data?.rrn || 'N/A'}`
        });

        if (reconstructedOrder) {
          await dispatchOrderConfirmationNotifications(reconstructedOrder);
          recoveredCount++;
          console.log(`[Order Reconciler] Successfully recovered missing order #${reconstructedOrder.orderNumber} (ID: ${reconstructedOrder.id}) and sent notifications.`);
        }
      }
    }
  } catch (error) {
    console.error('[Order Reconciler] Error syncing payments:', error);
  }

  return { reconciledCount, recoveredCount };
}

/**
 * Periodically reviews pending orders:
 * - Reconciles any orders that might have been paid.
 * - For orders older than 24 hours that are genuinely unpaid, updates them to 'Payment Failed' (does NOT hard-delete!).
 * - HARD DELETION IS PERMANENTLY REMOVED to protect customer transactions and order audit history.
 */
export async function cleanupPendingOrders() {
  try {
    // 1. Run payment synchronization first
    await syncRecentRazorpayPayments();

    // 2. Mark genuinely abandoned orders (>24 hours) as 'Payment Failed' without deleting
    const orders = await OrderRepository.getAll(true);
    const now = Date.now();
    const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

    let expiredCount = 0;

    for (const order of orders) {
      if (order.status === 'Pending' || order.status === 'Payment Pending') {
        const createdTime = new Date(order.createdAt).getTime();

        if (now - createdTime > TWENTY_FOUR_HOURS_MS) {
          const isPaid = order.paymentStatus === 'Paid';
          const isPartialPaid = order.paymentStatus === 'Partial Paid';

          if (!isPaid && !isPartialPaid) {
            console.log(`[Order Cleanup] Marking abandoned checkout session as Payment Failed: ${order.orderNumber} (ID: ${order.id})`);
            await OrderRepository.update(order.id, {
              status: 'Payment Failed',
              paymentStatus: 'Failed',
              notes: (order.notes ? `${order.notes} | ` : '') + 'Abandoned checkout session expired after 24 hours without payment'
            });
            expiredCount++;
          }
        }
      }
    }

    if (expiredCount > 0) {
      console.log(`[Order Cleanup] Marked ${expiredCount} abandoned orders as Payment Failed.`);
    }
  } catch (error) {
    console.error('[Order Cleanup] Error cleaning up pending orders:', error);
  }
}

/**
 * Initializes the background interval for reconciling and cleaning up pending orders.
 * Checks every 2 minutes to keep the system responsive and ensure no paid order is ever lost.
 */
export function initOrderCleanupJob() {
  console.log('[Order Reconciler & Cleanup] Initializing background payment reconciliation and order safeguard job...');

  // Run initial sync after a short delay (10 seconds)
  setTimeout(() => {
    cleanupPendingOrders().catch(err => {
      console.error('[Order Cleanup] Error running initial sync job:', err);
    });
  }, 10000);

  // Run every 2 minutes
  setInterval(() => {
    cleanupPendingOrders().catch(err => {
      console.error('[Order Cleanup] Error running scheduled sync job:', err);
    });
  }, 2 * 60 * 1000);
}
