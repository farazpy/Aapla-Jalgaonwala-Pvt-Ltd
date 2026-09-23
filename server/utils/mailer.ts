import nodemailer from 'nodemailer';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content?: Buffer | string;
    path?: string;
    contentType?: string;
  }>;
}

let transporter: nodemailer.Transporter | null = null;

export async function getTransporter(): Promise<nodemailer.Transporter | null> {
  let host = process.env.SMTP_HOST || process.env.EMAIL_HOST || process.env.MAIL_HOST || process.env.SMTP_SERVER;
  let port = Number(process.env.SMTP_PORT || process.env.EMAIL_PORT || process.env.MAIL_PORT || 587);
  let user = process.env.SMTP_USER || process.env.SMTP_USERNAME || process.env.EMAIL_USER || process.env.EMAIL_USERNAME || process.env.MAIL_USERNAME || process.env.MAIL_USER;
  let pass = process.env.SMTP_PASS || process.env.SMTP_PASSWORD || process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD || process.env.MAIL_PASSWORD || process.env.MAIL_PASS;
  let secure = port === 465 || String(process.env.SMTP_SECURE || process.env.EMAIL_SECURE).toLowerCase() === 'true';

  try {
    const { SettingsRepository } = await import('../repositories/SettingsRepository');
    const settings = await SettingsRepository.get();
    if (settings.smtpHost) host = settings.smtpHost;
    if (settings.smtpPort) port = Number(settings.smtpPort);
    if (settings.smtpUser) user = settings.smtpUser;
    if (settings.smtpPass) pass = settings.smtpPass;
    if (port === 465) secure = true;
  } catch (err) {
    // Ignore error
  }

  if (host && user && pass) {
    host = host.trim();
    user = user.trim();
    pass = pass.trim();
    port = Number(port) || 587;
    secure = port === 465 || secure === true;

    try {
      const transportOptions: any = {
        host,
        port,
        secure,
        auth: { user, pass },
        tls: {
          rejectUnauthorized: false
        }
      };

      if (host.toLowerCase().includes('gmail.com')) {
        transportOptions.service = 'gmail';
      }

      return nodemailer.createTransport(transportOptions);
    } catch (e) {
      console.warn('[Mailer] Failed to create SMTP transporter:', e);
      return null;
    }
  }

  return null;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  let settings: any = null;
  try {
    const { SettingsRepository } = await import('../repositories/SettingsRepository');
    settings = await SettingsRepository.get();
    if (settings.enableEmailAlerts === false) {
      console.log('[Mailer] Email alerts explicitly disabled in site settings.');
      return false;
    }
  } catch (err) {}

  const host = process.env.SMTP_HOST || process.env.EMAIL_HOST || process.env.MAIL_HOST || settings?.smtpHost;
  const user = process.env.SMTP_USER || process.env.SMTP_USERNAME || process.env.EMAIL_USER || settings?.smtpUser;
  const fromName = settings?.smtpFromName || settings?.storeName || 'Aapla Jalgaonwala';

  let rawFromEmail = process.env.SMTP_FROM || process.env.EMAIL_FROM || '';
  if (!rawFromEmail.trim()) {
    if (settings?.smtpFromEmail && settings.smtpFromEmail.trim()) {
      rawFromEmail = settings.smtpFromEmail.trim();
    } else if (user && user.includes('@')) {
      rawFromEmail = user.trim();
    } else {
      rawFromEmail = 'info@aaplajalgaonwala.com';
    }
  }

  // Clean the raw email to ensure we get just the email address (e.g. from "Name <email@domain.com>")
  const emailMatch = rawFromEmail.match(/<([^>]+)>/);
  const cleanEmail = emailMatch ? emailMatch[1].trim() : rawFromEmail.trim();

  // Create formatted fromAddress with double quotes around the sender name
  const fromAddress = `"${fromName}" <${cleanEmail}>`;

  const mailTransporter = await getTransporter();

  if (!mailTransporter) {
    console.log(`[Mailer (Logged/Dev)] Email to: ${options.to} | Subject: "${options.subject}" (Host: ${host ? 'set' : 'none'}, User: ${user ? 'set' : 'none'})`);
    return true;
  }

  try {
    const info = await mailTransporter.sendMail({
      from: fromAddress,
      to: options.to,
      subject: options.subject,
      text: options.text || options.html.replace(/<[^>]*>?/gm, ''),
      html: options.html,
      attachments: options.attachments
    });
    console.log(`[Mailer] ✅ Successfully dispatched email to ${options.to} [MessageId: ${info.messageId}] Subject: "${options.subject}"`);
    return true;
  } catch (error: any) {
    console.error(`[Mailer] ❌ Error sending email to ${options.to} via SMTP:`, error?.message || error);
    return false;
  }
}

export function generateOrderConfirmationEmailHtml(order: any, settings?: any): string {
  const storeName = settings?.storeName || 'Aapla Jalgaonwala';
  const logoUrl = settings?.appLogo?.trim();
  const tagline = settings?.tagline || 'आपला जळगाववाला — Authentic Jalgaon Taste in Every Bite';

  const itemsHtml = (order.items || [])
    .map(
      (item: any) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eeeeee;">${item.productName} (${item.variantInfo || 'Standard'})</td>
        <td style="padding: 10px; border-bottom: 1px solid #eeeeee; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eeeeee; text-align: right;">₹${item.price * item.quantity}</td>
      </tr>
    `
    )
    .join('');

  return `
    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e5e7eb;">
      <div style="background: #9B111E; padding: 24px; text-align: center; color: #ffffff;">
        ${logoUrl ? `<div style="margin-bottom: 10px;"><img src="${logoUrl}" alt="${storeName}" style="max-height: 56px; max-width: 220px; object-fit: contain; border-radius: 8px; border: 2px solid #fde68a; background: #ffffff; padding: 4px; display: inline-block;" /></div>` : ''}
        <h1 style="margin: 0; font-size: 24px; font-weight: bold; letter-spacing: -0.5px; color: #ffffff;">${storeName}</h1>
        <p style="margin: 4px 0 0 0; font-size: 13px; color: #fde68a;">${tagline}</p>
      </div>
      
      <div style="padding: 24px;">
        <h2 style="font-size: 18px; color: #111827; margin-top: 0;">Order Confirmed! #${order.orderNumber}</h2>
        <p style="font-size: 14px; color: #4b5563; line-height: 1.5;">
          Namaskar <strong>${order.customer?.name || 'Customer'}</strong>,<br>
          Thank you for choosing ${storeName}! We have received your order and are carefully preparing your fresh Khandeshi snacks and masalas.
        </p>

        <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 13px;">
          <thead>
            <tr style="background: #FAF6ED; color: #9B111E;">
              <th style="padding: 10px; text-align: left;">Item</th>
              <th style="padding: 10px; text-align: center;">Qty</th>
              <th style="padding: 10px; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="2" style="padding: 8px 10px; text-align: right; font-weight: bold; color: #4b5563;">Subtotal:</td>
              <td style="padding: 8px 10px; text-align: right; font-weight: bold;">₹${order.subtotal}</td>
            </tr>
            ${
              order.discount > 0
                ? `<tr>
              <td colspan="2" style="padding: 8px 10px; text-align: right; font-weight: bold; color: #059669;">Discount:</td>
              <td style="padding: 8px 10px; text-align: right; font-weight: bold; color: #059669;">-₹${order.discount}</td>
            </tr>`
                : ''
            }
            <tr>
              <td colspan="2" style="padding: 8px 10px; text-align: right; font-weight: bold; color: #4b5563;">Shipping:</td>
              <td style="padding: 8px 10px; text-align: right; font-weight: bold;">${order.shippingFee === 0 ? 'FREE' : `₹${order.shippingFee}`}</td>
            </tr>
            <tr style="border-top: 2px solid #9B111E;">
              <td colspan="2" style="padding: 12px 10px; text-align: right; font-size: 16px; font-weight: bold; color: #9B111E;">Grand Total:</td>
              <td style="padding: 12px 10px; text-align: right; font-size: 16px; font-weight: bold; color: #9B111E;">₹${order.totalAmount}</td>
            </tr>
          </tfoot>
        </table>

        <div style="background: #FAF6ED; border-radius: 12px; padding: 16px; margin-top: 24px; font-size: 13px; color: #4b5563;">
          <h4 style="margin: 0 0 8px 0; color: #9B111E; font-size: 14px;">Delivery Address:</h4>
          <p style="margin: 0; line-height: 1.5;">
            <strong>${order.shippingAddress?.fullName || order.customer?.name}</strong><br>
            ${order.shippingAddress?.addressLine1 || ''}<br>
            ${order.shippingAddress?.addressLine2 ? `${order.shippingAddress.addressLine2}<br>` : ''}
            ${order.shippingAddress?.city || ''}, ${order.shippingAddress?.state || ''} - ${order.shippingAddress?.pincode || ''}<br>
            Phone: ${order.customer?.phone || ''}
          </p>
        </div>

        <p style="font-size: 12px; color: #6b7280; margin-top: 24px; text-align: center;">
          Need help? Reply to this email or contact us at ${settings?.contactPhone || '+91 70574 46409'}.
        </p>
      </div>
      
      <div style="background: #f3f4f6; padding: 16px; text-align: center; font-size: 11px; color: #9ca3af;">
        © ${new Date().getFullYear()} ${storeName}. All rights reserved. Jalgaon, Maharashtra, India.
      </div>
    </div>
  `;
}

export function generateAdminNewOrderAlertEmailHtml(order: any, settings?: any): string {
  const storeName = settings?.storeName || 'Aapla Jalgaonwala';
  const logoUrl = settings?.appLogo?.trim();

  const itemsHtml = (order.items || [])
    .map(
      (item: any) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eeeeee;">${item.productName} (${item.variantInfo || 'Standard'})</td>
        <td style="padding: 10px; border-bottom: 1px solid #eeeeee; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eeeeee; text-align: right;">₹${item.price * item.quantity}</td>
      </tr>
    `
    )
    .join('');

  return `
    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e5e7eb;">
      <div style="background: #1c1917; padding: 24px; text-align: center; color: #ffffff;">
        ${logoUrl ? `<div style="margin-bottom: 10px;"><img src="${logoUrl}" alt="${storeName}" style="max-height: 52px; max-width: 200px; object-fit: contain; border-radius: 8px; border: 2px solid #9B111E; background: #ffffff; padding: 4px; display: inline-block;" /></div>` : ''}
        <span style="background: #9B111E; color: #ffffff; font-size: 11px; font-weight: bold; padding: 4px 10px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px;">🚨 New Order Received</span>
        <h1 style="margin: 12px 0 0 0; font-size: 24px; font-weight: bold;">Order #${order.orderNumber}</h1>
        <p style="margin: 4px 0 0 0; font-size: 13px; color: #d6d3d1;">Total Value: <strong style="color: #4ade80;">₹${order.totalAmount}</strong> • Payment: <strong>${order.paymentMethod || 'COD'}</strong></p>
      </div>
      
      <div style="padding: 24px;">
        <h3 style="font-size: 16px; color: #111827; margin-top: 0;">Customer Information:</h3>
        <p style="font-size: 13px; color: #4b5563; line-height: 1.6; background: #fafaf9; padding: 12px 16px; border-radius: 10px; border: 1px solid #e7e5e4;">
          <strong>Name:</strong> ${order.customer?.name || order.shippingAddress?.fullName || 'N/A'}<br>
          <strong>Phone:</strong> <a href="tel:${order.customer?.phone}" style="color: #9B111E; text-decoration: none; font-weight: bold;">${order.customer?.phone || 'N/A'}</a><br>
          <strong>Email:</strong> ${order.customer?.email || 'N/A'}<br>
          <strong>Shipping Address:</strong> ${order.shippingAddress?.addressLine1 || ''} ${order.shippingAddress?.addressLine2 || ''}, ${order.shippingAddress?.city || ''}, ${order.shippingAddress?.state || ''} - ${order.shippingAddress?.pincode || ''}
        </p>

        <h3 style="font-size: 15px; color: #111827; margin-top: 20px;">Ordered Items:</h3>
        <table style="width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 13px;">
          <thead>
            <tr style="background: #FAF6ED; color: #9B111E;">
              <th style="padding: 8px 10px; text-align: left;">Item</th>
              <th style="padding: 8px 10px; text-align: center;">Qty</th>
              <th style="padding: 8px 10px; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="2" style="padding: 8px 10px; text-align: right; font-weight: bold; color: #4b5563;">Grand Total:</td>
              <td style="padding: 8px 10px; text-align: right; font-size: 15px; font-weight: bold; color: #9B111E;">₹${order.totalAmount}</td>
            </tr>
          </tfoot>
        </table>

        <div style="margin-top: 24px; text-align: center;">
          <a href="/admin/orders" style="display: inline-block; background: #9B111E; color: #ffffff; padding: 12px 24px; border-radius: 10px; font-weight: bold; font-size: 13px; text-decoration: none;">
            View Order in Admin Panel →
          </a>
        </div>
      </div>
      
      <div style="background: #f3f4f6; padding: 14px; text-align: center; font-size: 11px; color: #9ca3af;">
        Notification sent automatically to store administrator • ${storeName}
      </div>
    </div>
  `;
}

export function generateOrderShippedEmailHtml(order: any, settings?: any): string {
  const storeName = settings?.storeName || 'Aapla Jalgaonwala';
  const logoUrl = settings?.appLogo?.trim();
  const tagline = settings?.tagline || 'आपला जळगाववाला — Authentic Jalgaon Taste in Every Bite';
  const courierName = order.courierName || 'DTDC';
  const awbNumber = order.awbNumber || '';
  const trackingUrl = order.trackingUrl || (awbNumber ? `https://track.dtdc.com/ctrk-web-war/track/search?reqType=tracking&awbNo=${awbNumber}` : 'https://www.dtdc.in/tracking.asp');

  const itemsHtml = (order.items || [])
    .map(
      (item: any) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eeeeee;">${item.productName} (${item.variantInfo || 'Standard'})</td>
        <td style="padding: 10px; border-bottom: 1px solid #eeeeee; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eeeeee; text-align: right;">₹${item.price * item.quantity}</td>
      </tr>
    `
    )
    .join('');

  return `
    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e5e7eb;">
      <div style="background: #9B111E; padding: 24px; text-align: center; color: #ffffff;">
        ${logoUrl ? `<div style="margin-bottom: 10px;"><img src="${logoUrl}" alt="${storeName}" style="max-height: 56px; max-width: 220px; object-fit: contain; border-radius: 8px; border: 2px solid #fde68a; background: #ffffff; padding: 4px; display: inline-block;" /></div>` : ''}
        <h1 style="margin: 0; font-size: 24px; font-weight: bold; letter-spacing: -0.5px; color: #ffffff;">${storeName}</h1>
        <p style="margin: 4px 0 0 0; font-size: 13px; color: #fde68a;">${tagline}</p>
      </div>
      
      <div style="padding: 24px;">
        <div style="display: inline-block; background: #EDE9FE; border: 1px solid #8B5CF6; color: #5B21B6; font-size: 12px; font-weight: bold; padding: 6px 14px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 16px;">
          🚚 Order Shipped
        </div>

        <h2 style="font-size: 20px; color: #111827; margin-top: 0; font-weight: 800;">Your Order is On Its Way! 📦</h2>
        <p style="font-size: 14px; color: #4b5563; line-height: 1.6;">
          Namaskar <strong>${order.customer?.name || 'Customer'}</strong>,<br>
          Exciting news! Your authentic Khandeshi snacks from <strong>${storeName}</strong> have been packed fresh and handed over to our courier partner <strong>${courierName}</strong>.
        </p>

        <!-- Dedicated Tracking Card -->
        <div style="background: #FAF6ED; border-radius: 14px; padding: 20px; margin: 22px 0; border: 1.5px solid #F59E0B; text-align: center;">
          <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; color: #92400E; display: block; margin-bottom: 4px;">
            Live Courier Tracking
          </span>
          <div style="font-size: 22px; font-weight: 900; color: #9B111E; letter-spacing: 1px; margin: 6px 0;">
            ${awbNumber ? awbNumber : 'In Transit'}
          </div>
          <p style="font-size: 12px; color: #78350F; margin: 0 0 14px 0;">
            Courier Partner: <strong>${courierName}</strong>
          </p>

          <a href="${trackingUrl}" target="_blank" style="display: inline-block; background: #9B111E; color: #ffffff; padding: 12px 28px; border-radius: 10px; font-weight: 800; font-size: 14px; text-decoration: none; box-shadow: 0 4px 12px rgba(155, 17, 30, 0.25);">
            🔍 Track Your Package Live &rarr;
          </a>
          
          <div style="font-size: 11px; color: #92400E; margin-top: 10px;">
            You can also track this order anytime directly in your <a href="/account" style="color: #9B111E; font-weight: bold; text-decoration: underline;">User Account Dashboard</a>.
          </div>
        </div>

        <div style="background: #fafaf9; border-radius: 12px; padding: 16px; margin: 20px 0; border: 1px solid #e7e5e4; font-size: 13px; color: #4b5563;">
          <h4 style="margin: 0 0 8px 0; color: #9B111E; font-size: 14px;">Shipping Summary:</h4>
          <p style="margin: 0; line-height: 1.6;">
            <strong>Order Number:</strong> #${order.orderNumber}<br>
            <strong>Total Amount:</strong> ₹${order.totalAmount} (${order.paymentMethod || 'COD'})<br>
            <strong>Delivery Address:</strong> ${order.shippingAddress?.fullName || order.customer?.name || ''}, ${order.shippingAddress?.addressLine1 || ''}, ${order.shippingAddress?.city || ''}, ${order.shippingAddress?.state || ''} - ${order.shippingAddress?.pincode || ''}<br>
            <strong>Contact Phone:</strong> ${order.customer?.phone || ''}
          </p>
        </div>

        <h3 style="font-size: 15px; color: #111827; margin-top: 20px;">Order Items:</h3>
        <table style="width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 13px;">
          <thead>
            <tr style="background: #FAF6ED; color: #9B111E;">
              <th style="padding: 8px 10px; text-align: left;">Item</th>
              <th style="padding: 8px 10px; text-align: center;">Qty</th>
              <th style="padding: 8px 10px; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <p style="font-size: 12px; color: #6b7280; margin-top: 24px; text-align: center;">
          Need assistance with your delivery? Contact our team at ${settings?.contactPhone || '+91 70574 46409'} or email ${settings?.contactEmail || 'info@aaplajalgaonwala.com'}.
        </p>
      </div>
      
      <div style="background: #f3f4f6; padding: 16px; text-align: center; font-size: 11px; color: #9ca3af;">
        © ${new Date().getFullYear()} ${storeName}. All rights reserved.
      </div>
    </div>
  `;
}

export function generateOrderStatusUpdateEmailHtml(order: any, newStatus: string, settings?: any): string {
  const statusKey = String(newStatus || '').toLowerCase();
  if (statusKey === 'shipped' || (order.awbNumber && statusKey !== 'delivered' && statusKey !== 'cancelled')) {
    return generateOrderShippedEmailHtml(order, settings);
  }

  const storeName = settings?.storeName || 'Aapla Jalgaonwala';
  const logoUrl = settings?.appLogo?.trim();
  const tagline = settings?.tagline || 'आपला जळगाववाला — Authentic Jalgaon Taste in Every Bite';

  let badgeBg = '#FEF3C7';
  let badgeColor = '#92400E';
  let badgeBorder = '#F59E0B';
  let statusMessage = `Your order status has been updated to <strong>${newStatus}</strong>.`;

  if (statusKey === 'processing' || statusKey === 'confirmed') {
    badgeBg = '#DBEAFE';
    badgeColor = '#1E40AF';
    badgeBorder = '#3B82F6';
    statusMessage = 'Great news! Your fresh Khandeshi snacks and delicacies are currently being prepared, packed, and processed.';
  } else if (statusKey === 'shipped' || statusKey === 'out for delivery') {
    badgeBg = '#EDE9FE';
    badgeColor = '#5B21B6';
    badgeBorder = '#8B5CF6';
    statusMessage = 'Your package is on its way! Our delivery partner is bringing your fresh Jalgaon treats straight to your doorstep.';
  } else if (statusKey === 'delivered' || statusKey === 'completed') {
    badgeBg = '#D1FAE5';
    badgeColor = '#065F46';
    badgeBorder = '#10B981';
    statusMessage = 'Your order has been successfully delivered! We hope you thoroughly enjoy the authentic Khandeshi crunch.';
  } else if (statusKey === 'cancelled') {
    badgeBg = '#FEE2E2';
    badgeColor = '#991B1B';
    badgeBorder = '#EF4444';
    statusMessage = 'Your order status has been updated to Cancelled. If you have any questions or need a refund, please contact customer support.';
  }

  const itemsHtml = (order.items || [])
    .map(
      (item: any) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eeeeee;">${item.productName} (${item.variantInfo || 'Standard'})</td>
        <td style="padding: 10px; border-bottom: 1px solid #eeeeee; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eeeeee; text-align: right;">₹${item.price * item.quantity}</td>
      </tr>
    `
    )
    .join('');

  return `
    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e5e7eb;">
      <div style="background: #9B111E; padding: 24px; text-align: center; color: #ffffff;">
        ${logoUrl ? `<div style="margin-bottom: 10px;"><img src="${logoUrl}" alt="${storeName}" style="max-height: 56px; max-width: 220px; object-fit: contain; border-radius: 8px; border: 2px solid #fde68a; background: #ffffff; padding: 4px; display: inline-block;" /></div>` : ''}
        <h1 style="margin: 0; font-size: 24px; font-weight: bold; letter-spacing: -0.5px; color: #ffffff;">${storeName}</h1>
        <p style="margin: 4px 0 0 0; font-size: 13px; color: #fde68a;">${tagline}</p>
      </div>
      
      <div style="padding: 24px;">
        <div style="display: inline-block; background: ${badgeBg}; border: 1px solid ${badgeBorder}; color: ${badgeColor}; font-size: 12px; font-weight: bold; padding: 6px 14px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 16px;">
          Order Status: ${newStatus}
        </div>

        <h2 style="font-size: 18px; color: #111827; margin-top: 0;">Order #${order.orderNumber} Update</h2>
        <p style="font-size: 14px; color: #4b5563; line-height: 1.6;">
          Namaskar <strong>${order.customer?.name || 'Customer'}</strong>,<br>
          ${statusMessage}
        </p>

        <div style="background: #fafaf9; border-radius: 12px; padding: 16px; margin: 20px 0; border: 1px solid #e7e5e4; font-size: 13px; color: #4b5563;">
          <h4 style="margin: 0 0 8px 0; color: #9B111E; font-size: 14px;">Order Overview:</h4>
          <p style="margin: 0; line-height: 1.6;">
            <strong>Order Number:</strong> #${order.orderNumber}<br>
            <strong>Total Amount:</strong> ₹${order.totalAmount} (${order.paymentMethod || 'COD'})<br>
            <strong>Shipping Address:</strong> ${order.shippingAddress?.addressLine1 || ''}, ${order.shippingAddress?.city || ''}, ${order.shippingAddress?.state || ''} - ${order.shippingAddress?.pincode || ''}
          </p>
          ${order.awbNumber ? `
          <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e7e5e4;">
            <strong>Tracking Number (AWB):</strong> ${order.awbNumber}<br>
            <strong>Courier:</strong> ${order.courierName || 'DTDC'}<br>
            <a href="${order.trackingUrl || `https://track.dtdc.com/ctrk-web-war/track/search?reqType=tracking&awbNo=${order.awbNumber}`}" target="_blank" style="display: inline-block; margin-top: 8px; color: #9B111E; font-weight: bold; text-decoration: none;">Track on ${order.courierName || 'DTDC'} website &rarr;</a>
          </div>
          ` : ''}
        </div>

        <h3 style="font-size: 15px; color: #111827; margin-top: 20px;">Order Items:</h3>
        <table style="width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 13px;">
          <thead>
            <tr style="background: #FAF6ED; color: #9B111E;">
              <th style="padding: 8px 10px; text-align: left;">Item</th>
              <th style="padding: 8px 10px; text-align: center;">Qty</th>
              <th style="padding: 8px 10px; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <p style="font-size: 12px; color: #6b7280; margin-top: 24px; text-align: center;">
          Have questions regarding your order? Contact us via Call / WhatsApp at ${settings?.contactPhone || '+91 70574 46409'}.
        </p>
      </div>
      
      <div style="background: #f3f4f6; padding: 16px; text-align: center; font-size: 11px; color: #9ca3af;">
        © ${new Date().getFullYear()} ${storeName}. All rights reserved.
      </div>
    </div>
  `;
}

export function generateStockNotificationConfirmationEmailHtml(productName: string, email: string): string {
  return `
    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e5e7eb;">
      <div style="background: #9B111E; padding: 24px; text-align: center; color: #ffffff;">
        <h1 style="margin: 0; font-size: 22px; font-weight: bold;">Aapla Jalgaonwala</h1>
        <p style="margin: 4px 0 0 0; font-size: 13px; color: #fde68a;">आपला जळगाववाला — Authentic Jalgaon Taste in Every Bite</p>
      </div>
      <div style="padding: 28px; color: #374151;">
        <div style="display: inline-block; background: #FEF3C7; border: 1px solid #F59E0B; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; color: #92400E; margin-bottom: 16px;">
          🔔 Stock Alert Subscription Confirmed
        </div>
        <h2 style="font-size: 18px; color: #111827; margin-top: 0; font-weight: 800;">Namaskar!</h2>
        <p style="font-size: 14px; line-height: 1.6; color: #4b5563;">
          We have registered your request for <strong>${productName}</strong>. As soon as our fresh batch is handcrafted and packed, you will be the first to receive an instant email notification!
        </p>
        <div style="background: #FAF6ED; border-left: 4px solid #D9531E; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; font-size: 13px; color: #78350F; font-weight: 600;">
            <strong>Product Requested:</strong> ${productName}<br>
            <strong>Notification Email:</strong> ${email}
          </p>
        </div>
        <p style="font-size: 13px; color: #6b7280; line-height: 1.5;">
          Thank you for loving authentic Khandeshi snacks! Feel free to explore our other fresh banana chip flavours and namkeen while you wait.
        </p>
      </div>
      <div style="background: #f9fafb; padding: 16px; text-align: center; font-size: 12px; color: #9ca3af; border-t: 1px solid #f3f4f6;">
        Aapla Jalgaonwala • Freshly Made Snacks from Jalgaon, Maharashtra
      </div>
    </div>
  `;
}

export function generateBackInStockEmailHtml(productName: string, productUrl: string, price: number, image?: string): string {
  return `
    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e5e7eb;">
      <div style="background: #9B111E; padding: 24px; text-align: center; color: #ffffff;">
        <h1 style="margin: 0; font-size: 22px; font-weight: bold;">Aapla Jalgaonwala</h1>
        <p style="margin: 4px 0 0 0; font-size: 13px; color: #fde68a;">आपला जळगाववाला — Fresh Stock Ready!</p>
      </div>
      <div style="padding: 28px; color: #374151;">
        <div style="display: inline-block; background: #D1FAE5; border: 1px solid #10B981; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; color: #065F46; margin-bottom: 16px;">
          🎉 Good News — Back in Stock!
        </div>
        <h2 style="font-size: 20px; color: #111827; margin-top: 0; font-weight: 800;">${productName} is Ready to Order!</h2>
        <p style="font-size: 14px; line-height: 1.6; color: #4b5563;">
          Great news! The product you were waiting for, <strong>${productName}</strong>, is fresh out of our kitchen and now available for immediate delivery!
        </p>
        
        ${image ? `
          <div style="text-align: center; margin: 20px 0;">
            <img src="${image}" alt="${productName}" style="max-width: 240px; border-radius: 12px; border: 1px solid #e5e7eb; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);" />
          </div>
        ` : ''}

        <div style="background: #FFFBEB; border: 1px solid #FCD34D; padding: 16px; border-radius: 12px; text-align: center; margin: 20px 0;">
          <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold; color: #92400E;">Price: ₹${price}</p>
          <p style="margin: 0; font-size: 12px; color: #B45309;">Handcrafted, crisp, and 100% authentic Khandeshi recipe.</p>
        </div>

        <div style="text-align: center; margin: 28px 0;">
          <a href="${productUrl}" style="display: inline-block; background: #9B111E; color: #ffffff; padding: 14px 28px; border-radius: 12px; font-weight: bold; font-size: 14px; text-decoration: none; box-shadow: 0 4px 10px rgba(155, 17, 30, 0.3);">
            Order ${productName} Now →
          </a>
        </div>
      </div>
      <div style="background: #f9fafb; padding: 16px; text-align: center; font-size: 12px; color: #9ca3af; border-t: 1px solid #f3f4f6;">
        Aapla Jalgaonwala • Jalgaon, Maharashtra
      </div>
    </div>
  `;
}

export function generatePartnerRegistrationAdminAlertEmailHtml(partner: any, settings?: any): string {
  const storeName = settings?.storeName || 'Aapla Jalgaonwala';
  return `
    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e5e7eb;">
      <div style="background: #9B111E; padding: 24px; text-align: center; color: #ffffff;">
        <span style="background: #fde68a; color: #9B111E; font-size: 11px; font-weight: bold; padding: 4px 12px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px;">🌸 Women Business Partner Program</span>
        <h1 style="margin: 12px 0 0 0; font-size: 22px; font-weight: bold;">New Partner Application</h1>
        <p style="margin: 4px 0 0 0; font-size: 13px; color: #fde68a;">Partner Code: <strong>${partner.partnerCode}</strong></p>
      </div>
      
      <div style="padding: 24px; color: #374151;">
        <h3 style="font-size: 15px; color: #111827; margin-top: 0; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">Applicant Details</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 10px;">
          <tr>
            <td style="padding: 6px 0; color: #6b7280; width: 140px;"><strong>Full Name:</strong></td>
            <td style="padding: 6px 0; font-weight: bold; color: #111827;">${partner.fullName}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #6b7280;"><strong>Mobile / WhatsApp:</strong></td>
            <td style="padding: 6px 0;"><a href="tel:${partner.phone}" style="color: #9B111E; text-decoration: none; font-weight: bold;">${partner.phone}</a></td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #6b7280;"><strong>Email Address:</strong></td>
            <td style="padding: 6px 0;"><a href="mailto:${partner.email}" style="color: #9B111E; text-decoration: none;">${partner.email}</a></td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #6b7280;"><strong>City & State:</strong></td>
            <td style="padding: 6px 0; color: #111827;">${partner.city}, ${partner.state || 'Maharashtra'}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #6b7280;"><strong>Social Media:</strong></td>
            <td style="padding: 6px 0; color: #111827;">${partner.socialPlatform || 'General'}: <strong>${partner.socialHandle || 'N/A'}</strong></td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #6b7280;"><strong>Aadhaar / PAN:</strong></td>
            <td style="padding: 6px 0; color: #111827;">${partner.aadhaarPanNumber || 'Submitted'}</td>
          </tr>
        </table>

        <h3 style="font-size: 15px; color: #111827; margin-top: 20px; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">Bank & Payout Details</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 10px; background: #fafaf9; padding: 12px; border-radius: 8px;">
          <tr>
            <td style="padding: 6px 8px; color: #6b7280; width: 140px;"><strong>Account Name:</strong></td>
            <td style="padding: 6px 8px; font-weight: bold; color: #111827;">${partner.bankAccountName || partner.fullName}</td>
          </tr>
          <tr>
            <td style="padding: 6px 8px; color: #6b7280;"><strong>Bank Name:</strong></td>
            <td style="padding: 6px 8px; color: #111827;">${partner.bankName || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding: 6px 8px; color: #6b7280;"><strong>Account Number:</strong></td>
            <td style="padding: 6px 8px; color: #111827; font-family: monospace;">${partner.bankAccountNumber || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding: 6px 8px; color: #6b7280;"><strong>IFSC Code:</strong></td>
            <td style="padding: 6px 8px; color: #111827; font-family: monospace;">${partner.ifscCode || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding: 6px 8px; color: #6b7280;"><strong>UPI ID:</strong></td>
            <td style="padding: 6px 8px; color: #059669; font-weight: bold;">${partner.upiId || 'N/A'}</td>
          </tr>
        </table>

        <div style="margin-top: 24px; text-align: center;">
          <a href="/admin/partners" style="display: inline-block; background: #9B111E; color: #ffffff; padding: 12px 24px; border-radius: 10px; font-weight: bold; font-size: 13px; text-decoration: none;">
            Open Partner Management Panel →
          </a>
        </div>
      </div>
      
      <div style="background: #f3f4f6; padding: 14px; text-align: center; font-size: 11px; color: #9ca3af;">
        Automated alert for ${storeName} Admin Team
      </div>
    </div>
  `;
}

export function generatePartnerPendingRegistrationEmailHtml(partner: any, settings?: any): string {
  const storeName = settings?.storeName || 'Aapla Jalgaonwala';
  const supportPhone = settings?.contactPhone || '+91 70574 46409';
  const logoUrl = settings?.appLogo?.trim();

  return `
    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e5e7eb; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
      <div style="background: #9B111E; padding: 28px 24px; text-align: center; color: #ffffff;">
        ${logoUrl ? `<div style="margin-bottom: 12px;"><img src="${logoUrl}" alt="${storeName}" style="max-height: 52px; max-width: 200px; object-fit: contain; border-radius: 8px; border: 2px solid #fde68a; background: #ffffff; padding: 4px; display: inline-block;" /></div>` : ''}
        <span style="background: #fde68a; color: #9B111E; font-size: 11px; font-weight: bold; padding: 4px 14px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px;">🌸 Application Received • Pending Approval</span>
        <h1 style="margin: 12px 0 0 0; font-size: 22px; font-weight: bold; color: #ffffff;">You have been registered!</h1>
        <p style="margin: 6px 0 0 0; font-size: 14px; color: #fde68a;">Your application is under review and will be approved shortly</p>
      </div>

      <div style="padding: 28px 24px; color: #374151;">
        <p style="font-size: 14px; line-height: 1.6; color: #4b5563; margin-top: 0;">
          Namaskar <strong>${partner.fullName}</strong>,<br>
          Thank you for registering with the <strong>${storeName} Women Business Partner Program</strong>! We have successfully received your partner registration details and payout profile.
        </p>

        <div style="background: #FFFBEB; border: 1.5px solid #FCD34D; padding: 18px 20px; border-radius: 12px; margin: 20px 0;">
          <div style="display: flex; align-items: center; margin-bottom: 8px;">
            <span style="background: #F59E0B; color: #ffffff; font-size: 11px; font-weight: bold; padding: 3px 10px; border-radius: 12px; text-transform: uppercase;">Status: Pending Approval</span>
          </div>
          <p style="margin: 0; font-size: 13px; color: #92400E; line-height: 1.5;">
            Our partner onboarding team is currently verifying your submitted details. <strong>You will be approved shortly.</strong> As soon as your account is approved, you will receive an official activation email containing your live 12% commission referral link and discount codes!
          </p>
        </div>

        <h3 style="font-size: 15px; color: #111827; margin: 20px 0 10px 0; border-bottom: 1px solid #f3f4f6; padding-bottom: 6px;">Your Registration Summary</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 18px;">
          <tr>
            <td style="padding: 6px 0; color: #6b7280; width: 140px;"><strong>Partner Code:</strong></td>
            <td style="padding: 6px 0; font-weight: bold; font-family: monospace; color: #9B111E; font-size: 14px;">${partner.partnerCode}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #6b7280;"><strong>Applicant Name:</strong></td>
            <td style="padding: 6px 0; font-weight: bold; color: #111827;">${partner.fullName}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #6b7280;"><strong>City & State:</strong></td>
            <td style="padding: 6px 0; color: #111827;">${partner.city}, ${partner.state || 'Maharashtra'}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #6b7280;"><strong>Mobile / WhatsApp:</strong></td>
            <td style="padding: 6px 0; color: #111827;">${partner.phone}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #6b7280;"><strong>Earnings Rate:</strong></td>
            <td style="padding: 6px 0; color: #059669; font-weight: bold;">12% Net Commission (Sunday Bank Payouts)</td>
          </tr>
        </table>

        <h3 style="font-size: 15px; color: #111827; margin: 20px 0 10px 0;">What happens next?</h3>
        <ol style="font-size: 13px; line-height: 1.8; color: #4b5563; padding-left: 20px; margin: 0;">
          <li><strong>Team Verification:</strong> Our team reviews your registered details within a short turnaround.</li>
          <li><strong>Approval Confirmation:</strong> You will receive an instant approval notification with your active portal access.</li>
          <li><strong>Start Sharing & Earning:</strong> You can start sharing your link on WhatsApp status, Instagram, and local community groups to earn 12% on every customer purchase!</li>
        </ol>

        <div style="background: #FAF6ED; border-radius: 12px; padding: 16px; margin-top: 24px; font-size: 13px; color: #4b5563;">
          <h4 style="margin: 0 0 6px 0; color: #9B111E; font-size: 13px; font-weight: bold;">Need Quick Onboarding Help?</h4>
          <p style="margin: 0; line-height: 1.5; font-size: 12px;">
            Have questions about your application or need fast-track approval? Message our Partner Desk on WhatsApp: <strong><a href="https://wa.me/917057446409" style="color: #059669; font-weight: bold; text-decoration: none;">${supportPhone}</a></strong>
          </p>
        </div>

        <div style="margin-top: 24px; text-align: center;">
          <a href="http://aaplajalgaonwala.com/partner-analytics" style="display: inline-block; background: #9B111E; color: #ffffff; padding: 12px 28px; border-radius: 10px; font-weight: bold; font-size: 13px; text-decoration: none;">
            Check Partner Portal Status →
          </a>
        </div>
      </div>
      
      <div style="background: #f3f4f6; padding: 16px; text-align: center; font-size: 11px; color: #9ca3af;">
        © ${new Date().getFullYear()} ${storeName}. All rights reserved. Jalgaon, Maharashtra.
      </div>
    </div>
  `;
}

export function generatePartnerApprovedEmailHtml(partner: any, referralUrl: string, settings?: any): string {
  const storeName = settings?.storeName || 'Aapla Jalgaonwala';
  const supportPhone = settings?.contactPhone || '+91 70574 46409';
  const logoUrl = settings?.appLogo?.trim();

  return `
    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e5e7eb; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
      <div style="background: #9B111E; padding: 28px 24px; text-align: center; color: #ffffff;">
        ${logoUrl ? `<div style="margin-bottom: 12px;"><img src="${logoUrl}" alt="${storeName}" style="max-height: 52px; max-width: 200px; object-fit: contain; border-radius: 8px; border: 2px solid #fde68a; background: #ffffff; padding: 4px; display: inline-block;" /></div>` : ''}
        <span style="background: #fde68a; color: #9B111E; font-size: 11px; font-weight: bold; padding: 4px 14px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px;">🎉 You're Approved • Account Active</span>
        <h1 style="margin: 12px 0 0 0; font-size: 24px; font-weight: bold; color: #ffffff;">Congratulations, ${partner.fullName}!</h1>
        <p style="margin: 6px 0 0 0; font-size: 14px; color: #fde68a;">You are officially an Approved Women Business Partner</p>
      </div>

      <div style="padding: 28px 24px; color: #374151;">
        <p style="font-size: 14px; line-height: 1.6; color: #4b5563; margin-top: 0;">
          Namaskar <strong>${partner.fullName}</strong>,<br>
          We are delighted to inform you that your application for the <strong>${storeName} Women Business Partner Program</strong> has been officially <strong>APPROVED & ACTIVATED</strong>!
        </p>

        <div style="background: #FFFBEB; border: 2px dashed #D9531E; padding: 20px; border-radius: 12px; margin: 20px 0; text-align: center;">
          <p style="margin: 0 0 6px 0; font-size: 12px; text-transform: uppercase; font-weight: bold; color: #92400E;">Your Unique Partner Referral Code</p>
          <div style="font-size: 26px; font-weight: 800; color: #9B111E; letter-spacing: 2px;">${partner.partnerCode}</div>
          
          <p style="margin: 14px 0 6px 0; font-size: 12px; color: #78350F; font-weight: 600;">Your Direct Customer Referral Link (Gives 4% OFF + Earns you 12%):</p>
          <div style="background: #ffffff; border: 1px solid #fcd34d; padding: 10px 14px; border-radius: 8px; font-size: 13px; font-family: monospace; color: #1e3a8a; word-break: break-all;">
            ${referralUrl}
          </div>
        </div>

        <h3 style="font-size: 16px; color: #111827; margin: 24px 0 12px 0;">3 Quick Steps to Start Earning:</h3>
        <ol style="font-size: 13px; line-height: 1.8; color: #4b5563; padding-left: 20px; margin: 0;">
          <li><strong>Copy & Share:</strong> Share your unique link on WhatsApp Status, Instagram Bio/Stories, Facebook & with your friends and family.</li>
          <li><strong>Customers Order:</strong> When customers open your link, they get an exclusive <strong>4% instant discount</strong> on our 10 authentic Banana Chips flavours and Khandeshi snacks.</li>
          <li><strong>Weekly Sunday Payout:</strong> You earn <strong>12% commission</strong> on every order, transferred directly to your bank account or UPI every Sunday!</li>
        </ol>

        <div style="background: #FAF6ED; border-radius: 12px; padding: 16px; margin-top: 24px; font-size: 13px; color: #4b5563;">
          <h4 style="margin: 0 0 6px 0; color: #9B111E; font-size: 14px; font-weight: bold;">Marketing Kit & Promo Media:</h4>
          <p style="margin: 0; line-height: 1.5; font-size: 12px;">
            Access ready-to-post Marathi & Hindi WhatsApp stories, reels, product photos, and captions directly in your Partner Analytics Portal. For dedicated assistance, WhatsApp us at <strong><a href="https://wa.me/917057446409" style="color: #059669; font-weight: bold; text-decoration: none;">${supportPhone}</a></strong>.
          </p>
        </div>

        <div style="margin-top: 24px; text-align: center;">
          <a href="http://aaplajalgaonwala.com/partner-analytics" style="display: inline-block; background: #9B111E; color: #ffffff; padding: 12px 28px; border-radius: 10px; font-weight: bold; font-size: 14px; text-decoration: none;">
            Open Your Live Partner Dashboard →
          </a>
        </div>
      </div>
      
      <div style="background: #f3f4f6; padding: 16px; text-align: center; font-size: 11px; color: #9ca3af;">
        © ${new Date().getFullYear()} ${storeName}. All rights reserved. Jalgaon, Maharashtra.
      </div>
    </div>
  `;
}

export function generatePartnerWelcomeEmailHtml(partner: any, referralUrl: string, settings?: any): string {
  return generatePartnerApprovedEmailHtml(partner, referralUrl, settings);
}

export function generateOTPEmailHtml(otp: string, recipientName: string, settings?: any): string {
  const storeName = settings?.storeName || 'Aapla Jalgaonwala';
  const logoUrl = settings?.appLogo?.trim();

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Password Reset OTP - ${storeName}</title>
    </head>
    <body style="font-family: Arial, sans-serif; background-color: #FAFAF8; margin: 0; padding: 20px; color: #1c1917;">
      <div style="max-width: 520px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e7e5e4; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        <div style="text-align: center; margin-bottom: 24px;">
          ${logoUrl ? `<img src="${logoUrl}" alt="${storeName}" style="max-height: 48px; margin-bottom: 12px;">` : ''}
          <h1 style="font-size: 22px; font-weight: 800; color: #9B111E; margin: 0;">${storeName}</h1>
          <p style="font-size: 12px; color: #78716c; margin-top: 4px;">Password Reset Security Verification</p>
        </div>

        <div style="background-color: #FAF6ED; border: 1px solid #fef3c7; border-radius: 14px; padding: 24px; margin-bottom: 24px; text-align: center;">
          <p style="font-size: 14px; margin: 0 0 12px 0; color: #44403c;">Hello <strong>${recipientName}</strong>,</p>
          <p style="font-size: 13px; margin: 0 0 16px 0; color: #57534e;">Use the following 6-digit One-Time Password (OTP) to reset your account password. This code is valid for <strong>10 minutes</strong>.</p>
          
          <div style="display: inline-block; background-color: #9B111E; color: #ffffff; font-size: 32px; font-weight: 900; letter-spacing: 8px; padding: 14px 32px; border-radius: 12px; margin: 8px 0; box-shadow: 0 2px 8px rgba(155,17,30,0.2);">
            ${otp}
          </div>
        </div>

        <p style="font-size: 12px; color: #78716c; line-height: 1.5; margin-bottom: 20px;">
          If you did not request a password reset, please ignore this email or contact our support team if you have security concerns.
        </p>

        <div style="border-top: 1px solid #f5f5f4; pt: 16px; text-align: center; font-size: 11px; color: #a8a29e;">
          &copy; ${new Date().getFullYear()} ${storeName}. All rights reserved.<br/>
          Authentic Jalgaon Taste in Every Bite.
        </div>
      </div>
    </body>
    </html>
  `;
}

export function generatePartnerPaymentReceivedEmailHtml(partner: any, settlement: any, settings?: any): string {
  const storeName = settings?.storeName || 'Aapla Jalgaonwala';
  const logoUrl = settings?.appLogo?.trim();
  const tagline = settings?.tagline || 'आपला जळगाववाला — Authentic Jalgaon Taste in Every Bite';

  return `
    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e5e7eb; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
      <div style="background: #9B111E; padding: 28px 24px; text-align: center; color: #ffffff;">
        ${logoUrl ? `<div style="margin-bottom: 12px;"><img src="${logoUrl}" alt="${storeName}" style="max-height: 56px; max-width: 220px; object-fit: contain; border-radius: 8px; border: 2px solid #fde68a; background: #ffffff; padding: 4px; display: inline-block;" /></div>` : ''}
        <h1 style="margin: 0; font-size: 22px; font-weight: bold; letter-spacing: -0.5px; color: #ffffff;">${storeName}</h1>
        <p style="margin: 4px 0 0 0; font-size: 12px; color: #fde68a; font-weight: 500;">${tagline}</p>
      </div>
      
      <div style="padding: 24px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="display: inline-block; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 50%; padding: 12px; margin-bottom: 8px;">
            <span style="font-size: 28px; line-height: 1;">🌸</span>
          </div>
          <h2 style="font-size: 20px; color: #065f46; margin: 0; font-weight: 800;">Commission Payment Settled!</h2>
          <p style="font-size: 13px; color: #6b7280; margin: 4px 0 0 0;">Weekly Payout Successfully Completed</p>
        </div>

        <p style="font-size: 14px; color: #374151; line-height: 1.6;">
          Dear <strong>${partner.fullName || partner.name || 'Partner'}</strong> (Partner Code: <strong>${partner.partnerCode}</strong>),<br>
          We are pleased to inform you that your commission payout for <strong>${settlement.settlementWeek}</strong> has been successfully processed and transferred. Thank you for your outstanding dedication and efforts in representing the authentic taste of Jalgaon!
        </p>

        <div style="background: #fafaf9; border: 1px solid #e7e5e4; border-radius: 12px; padding: 18px; margin: 20px 0;">
          <h3 style="margin: 0 0 12px 0; font-size: 14px; color: #9B111E; text-transform: uppercase; letter-spacing: 0.5px; font-weight: bold; border-bottom: 1px solid #e7e5e4; padding-bottom: 6px;">Payout Details</h3>
          
          <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
            <tr>
              <td style="padding: 6px 0; color: #6b7280;">Payout Amount:</td>
              <td style="padding: 6px 0; text-align: right; font-weight: bold; font-size: 16px; color: #059669;">₹${settlement.amount}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #6b7280;">Payment Method:</td>
              <td style="padding: 6px 0; text-align: right; font-weight: 600; color: #374151;">${settlement.paymentMethod || 'Bank Transfer'}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #6b7280;">Transferred To:</td>
              <td style="padding: 6px 0; text-align: right; font-weight: 600; color: #374151;">${settlement.accountOrUpi || 'Saved Account'}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #6b7280;">Reference ID / Txn:</td>
              <td style="padding: 6px 0; text-align: right; font-family: monospace; font-size: 12px; color: #4b5563;">${settlement.transactionReference || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #6b7280;">Referred Orders:</td>
              <td style="padding: 6px 0; text-align: right; font-weight: 600; color: #374151;">${settlement.ordersCount || 0} Orders</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #6b7280;">Settlement Date:</td>
              <td style="padding: 6px 0; text-align: right; color: #4b5563;">${settlement.settlementDate || new Date().toISOString().split('T')[0]}</td>
            </tr>
          </table>
        </div>

        <div style="background: #FAF6ED; border-radius: 12px; padding: 16px; margin-top: 10px; font-size: 13px; color: #78350f; border: 1px solid #fef3c7;">
          <h4 style="margin: 0 0 4px 0; font-weight: bold;">Note:</h4>
          <p style="margin: 0; line-height: 1.4; font-size: 12px;">
            ${settlement.notes || 'Weekly Sunday Settlement for Aapla Jalgaonwala Women Business Partner.'}
          </p>
        </div>

        <div style="margin-top: 24px; text-align: center; border-top: 1px solid #f3f4f6; padding-top: 20px;">
          <p style="font-size: 13px; color: #4b5563; font-weight: 500;">
            Keep up the fantastic work! Every status share on WhatsApp, Instagram, or Facebook story brings you closer to your financial goals.
          </p>
          <a href="${process.env.APP_URL || 'https://aaplajalgaonwala.com'}/partner-program" style="display: inline-block; background: #9B111E; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; font-size: 13px; margin-top: 10px;">
            Go to Partner Dashboard
          </a>
        </div>

        <p style="font-size: 12px; color: #6b7280; margin-top: 24px; text-align: center;">
          Need help? Reply to this email or contact us at ${settings?.contactPhone || '+91 70574 46409'}.
        </p>
      </div>
      
      <div style="background: #f3f4f6; padding: 16px; text-align: center; font-size: 11px; color: #9ca3af;">
        © ${new Date().getFullYear()} ${storeName}. All rights reserved. Jalgaon, Maharashtra, India.
      </div>
    </div>
  `;
}

export async function sendPartnerPaymentReceivedEmail(partner: any, settlement: any): Promise<boolean> {
  if (!partner || !partner.email) {
    console.warn('[Mailer] Cannot send partner settlement email: partner email is missing.');
    return false;
  }

  try {
    const { SettingsRepository } = await import('../repositories/SettingsRepository');
    const settings = await SettingsRepository.get();
    const storeName = settings?.storeName || 'Aapla Jalgaonwala';

    const subject = `🌸 Payout Received: ₹${settlement.amount} Settled - ${storeName} Partner Program`;
    const html = generatePartnerPaymentReceivedEmailHtml(partner, settlement, settings);

    return await sendEmail({
      to: partner.email,
      subject,
      html
    });
  } catch (err: any) {
    console.error('[Mailer] Failed to send partner payment received email:', err?.message || err);
    return false;
  }
}

export function generatePartnerWhatsAppCommissionEmailHtml(partner: any, details: any, settings?: any): string {
  const storeName = settings?.storeName || 'Aapla Jalgaonwala';
  const logoUrl = settings?.appLogo?.trim();
  const tagline = settings?.tagline || 'आपला जळगाववाला — Authentic Jalgaon Taste in Every Bite';
  const commissionAmount = Number(details?.amount || 0).toLocaleString('en-IN');
  const orderTotal = Number(details?.orderTotal || 0);
  const pendingCommission = Number(details?.newPendingCommission || 0).toLocaleString('en-IN');
  const isPaid = Boolean(details?.markAsPaid);

  return `
    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e5e7eb; box-shadow: 0 4px 16px rgba(0,0,0,0.06);">
      <!-- Header -->
      <div style="background: #9B111E; padding: 28px 24px; text-align: center; color: #ffffff;">
        ${logoUrl ? `<div style="margin-bottom: 12px;"><img src="${logoUrl}" alt="${storeName}" style="max-height: 56px; max-width: 220px; object-fit: contain; border-radius: 8px; border: 2px solid #fde68a; background: #ffffff; padding: 4px; display: inline-block;" /></div>` : ''}
        <h1 style="margin: 0; font-size: 22px; font-weight: bold; letter-spacing: -0.5px; color: #ffffff;">${storeName}</h1>
        <p style="margin: 4px 0 0 0; font-size: 12px; color: #fde68a; font-weight: 500;">${tagline}</p>
      </div>

      <!-- Content Area -->
      <div style="padding: 26px 24px;">
        <div style="text-align: center; margin-bottom: 22px;">
          <div style="display: inline-block; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 50%; padding: 14px; margin-bottom: 10px;">
            <span style="font-size: 32px; line-height: 1;">💬</span>
          </div>
          <h2 style="font-size: 20px; color: #065f46; margin: 0; font-weight: 800;">WhatsApp Order Commission Credited!</h2>
          <p style="font-size: 13px; color: #4b5563; margin: 5px 0 0 0;">New earnings credited to your Women Partner account</p>
        </div>

        <p style="font-size: 14px; color: #374151; line-height: 1.6; margin-bottom: 20px;">
          Dear <strong>${partner.fullName || partner.name || 'Partner'}</strong> (Partner Code: <strong>${partner.partnerCode}</strong>),<br>
          Great news! An order placed through <strong>WhatsApp</strong> has been successfully registered and your commission of <strong style="color: #059669; font-size: 16px;">₹${commissionAmount}</strong> has been credited to your partner account by the store admin.
        </p>

        <!-- Order & Commission Details Card -->
        <div style="background: #fafaf9; border: 1px solid #e7e5e4; border-radius: 12px; padding: 20px; margin: 20px 0;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e7e5e4; padding-bottom: 10px; margin-bottom: 14px;">
            <h3 style="margin: 0; font-size: 13px; color: #9B111E; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 800;">Order & Commission Summary</h3>
            <span style="display: inline-block; background: #ecfdf5; color: #065f46; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 9999px; border: 1px solid #a7f3d0;">
              ${isPaid ? 'Instant Settled' : 'Pending Weekly Payout'}
            </span>
          </div>

          <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
            <tr>
              <td style="padding: 7px 0; color: #6b7280;">Order Channel:</td>
              <td style="padding: 7px 0; text-align: right; font-weight: 700; color: #166534;">WhatsApp Order</td>
            </tr>
            <tr>
              <td style="padding: 7px 0; color: #6b7280;">Order Reference:</td>
              <td style="padding: 7px 0; text-align: right; font-family: monospace; font-size: 13px; font-weight: 700; color: #1c1917;">${details?.orderNumber || 'WA-ORDER'}</td>
            </tr>
            ${details?.customerName ? `
            <tr>
              <td style="padding: 7px 0; color: #6b7280;">Customer:</td>
              <td style="padding: 7px 0; text-align: right; font-weight: 600; color: #374151;">${details.customerName} ${details.customerCity ? `(${details.customerCity})` : ''}</td>
            </tr>` : ''}
            ${orderTotal > 0 ? `
            <tr>
              <td style="padding: 7px 0; color: #6b7280;">WhatsApp Order Value:</td>
              <td style="padding: 7px 0; text-align: right; font-weight: 600; color: #374151;">₹${orderTotal.toLocaleString('en-IN')}</td>
            </tr>` : ''}
            <tr>
              <td style="padding: 8px 0; color: #111827; font-weight: 700; border-top: 1px dashed #d6d3d1;">Commission Credited:</td>
              <td style="padding: 8px 0; text-align: right; font-weight: 800; font-size: 17px; color: #059669; border-top: 1px dashed #d6d3d1;">+ ₹${commissionAmount}</td>
            </tr>
            ${!isPaid ? `
            <tr>
              <td style="padding: 7px 0; color: #6b7280;">Total Pending Balance:</td>
              <td style="padding: 7px 0; text-align: right; font-weight: 700; color: #9B111E;">₹${pendingCommission}</td>
            </tr>` : `
            <tr>
              <td style="padding: 7px 0; color: #6b7280;">Payout Method:</td>
              <td style="padding: 7px 0; text-align: right; font-weight: 600; color: #374151;">${details.paymentMethod || 'Direct Transfer / UPI'}</td>
            </tr>`}
          </table>
        </div>

        ${details?.notes ? `
        <div style="background: #FAF6ED; border-radius: 12px; padding: 14px 16px; margin: 16px 0; font-size: 13px; color: #78350f; border: 1px solid #fef3c7;">
          <p style="margin: 0; font-size: 12px; line-height: 1.5;">
            <strong>Admin Note:</strong> ${details.notes}
          </p>
        </div>` : ''}

        <!-- Payout Schedule Notice -->
        ${!isPaid ? `
        <div style="background: #f0fdf4; border-radius: 12px; padding: 14px 16px; margin: 16px 0; font-size: 12px; color: #166534; border: 1px solid #bbf7d0;">
          <p style="margin: 0; line-height: 1.5;">
            💡 <strong>Weekly Payout Note:</strong> Your pending commission will be transferred to your registered bank account / UPI on our scheduled <strong>Sunday Weekly Settlement</strong>.
          </p>
        </div>` : ''}

        <!-- Call to Action -->
        <div style="margin-top: 24px; text-align: center; border-top: 1px solid #f3f4f6; padding-top: 22px;">
          <p style="font-size: 13px; color: #4b5563; font-weight: 500; margin-bottom: 12px;">
            Thank you for bringing authentic Jalgaon delicacies to more homes! Track your total earnings anytime on your dashboard:
          </p>
          <a href="${process.env.APP_URL || 'https://aaplajalgaonwala.com'}/partner-analytics" style="display: inline-block; background: #9B111E; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; font-size: 13px; box-shadow: 0 2px 6px rgba(155, 17, 30, 0.25);">
            Open Partner Analytics & Dashboard
          </a>
        </div>

        <p style="font-size: 12px; color: #6b7280; margin-top: 24px; text-align: center;">
          Have questions about this commission? Contact admin directly via WhatsApp or reply to this email at ${settings?.contactPhone || '+91 70574 46409'}.
        </p>
      </div>

      <!-- Footer -->
      <div style="background: #f3f4f6; padding: 16px; text-align: center; font-size: 11px; color: #9ca3af;">
        © ${new Date().getFullYear()} ${storeName}. All rights reserved. Jalgaon, Maharashtra, India.
      </div>
    </div>
  `;
}

export async function sendPartnerWhatsAppCommissionEmail(partner: any, details: any): Promise<boolean> {
  if (!partner || !partner.email) {
    console.warn('[Mailer] Cannot send WhatsApp commission email: partner email is missing.');
    return false;
  }

  try {
    const { SettingsRepository } = await import('../repositories/SettingsRepository');
    const settings = await SettingsRepository.get();
    const storeName = settings?.storeName || 'Aapla Jalgaonwala';

    const commissionFormatted = Number(details?.amount || 0).toLocaleString('en-IN');
    const subject = `💬 WhatsApp Order Commission Credited: ₹${commissionFormatted} - ${storeName}`;
    const html = generatePartnerWhatsAppCommissionEmailHtml(partner, details, settings);

    return await sendEmail({
      to: partner.email,
      subject,
      html
    });
  } catch (err: any) {
    console.error('[Mailer] Failed to send partner WhatsApp commission email:', err?.message || err);
    return false;
  }
}

export function generatePartnerOrderTransferredEmailHtml(partner: any, details: any, settings?: any): string {
  const storeName = settings?.storeName || 'Aapla Jalgaonwala';
  const primaryColor = settings?.primaryColor || '#9B111E';
  const partnerName = partner?.fullName ? formatDisplayName(partner.fullName, partner.partnerCode) : 'Woman Business Partner';
  const commissionAmount = Number(details?.commissionAmount || details?.amount || 0);
  const commissionFormatted = commissionAmount.toLocaleString('en-IN');
  const orderTotalFormatted = Number(details?.orderTotal || 0).toLocaleString('en-IN');
  const pendingFormatted = Number(details?.newPendingCommission || partner?.pendingCommission || 0).toLocaleString('en-IN');
  const orderNumber = details?.orderNumber || 'N/A';
  const customerName = details?.customerName || 'Customer';
  const customerCity = details?.customerCity || partner?.city || 'Maharashtra';
  const reason = details?.reason || '';

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 620px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
      <!-- Header Banner -->
      <div style="background: linear-gradient(135deg, ${primaryColor} 0%, #780016 100%); color: #ffffff; padding: 28px 24px; text-align: center;">
        <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 0.5px;">${storeName}</h1>
        <p style="margin: 6px 0 0; font-size: 13px; opacity: 0.9; font-weight: 500;">
          Woman Business Partner Program | महिला उद्योजिका मंच
        </p>
      </div>

      <!-- Main Body -->
      <div style="padding: 28px 24px; color: #1f2937;">
        <div style="text-align: center; margin-bottom: 20px;">
          <span style="display: inline-block; background: #ecfdf5; border: 1px solid #a7f3d0; color: #065f46; font-weight: 800; font-size: 12px; padding: 6px 16px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.5px;">
            🎉 Order & Commission Credited to Your Account
          </span>
        </div>

        <p style="font-size: 16px; line-height: 1.6; margin: 0 0 16px;">
          नमस्ते <strong>${partnerName}</strong> जी,
        </p>

        <p style="font-size: 14px; line-height: 1.6; color: #4b5563; margin: 0 0 20px;">
          आनंदाची बातमी! ऑर्डर <strong>#${orderNumber}</strong> आपल्या खात्यावर यशस्वीपणे हस्तांतरित करण्यात आली आहे आणि तिचे कमिशन थेट आपल्या खात्यात जोडले गेले आहे.
        </p>

        <!-- Big Highlight Box -->
        <div style="background: #f0fdf4; border: 1.5px dashed #86efac; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
          <div style="font-size: 12px; color: #166534; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">
            Referral Commission Credited / मिळणारे कमिशन
          </div>
          <div style="font-size: 32px; font-weight: 900; color: #15803d; line-height: 1.2;">
            +₹${commissionFormatted}
          </div>
          <div style="font-size: 11px; color: #166534; font-weight: 600; margin-top: 6px;">
            Partner Referral Code: <strong>${partner.partnerCode}</strong>
          </div>
        </div>

        <!-- Details Table -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px;">
          <tbody>
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="padding: 10px 0; color: #6b7280; font-weight: 500;">Order Reference:</td>
              <td style="padding: 10px 0; text-align: right; font-weight: 700; color: #111827;">#${orderNumber}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="padding: 10px 0; color: #6b7280; font-weight: 500;">Customer Name:</td>
              <td style="padding: 10px 0; text-align: right; font-weight: 700; color: #111827;">${customerName} (${customerCity})</td>
            </tr>
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="padding: 10px 0; color: #6b7280; font-weight: 500;">Order Total Amount:</td>
              <td style="padding: 10px 0; text-align: right; font-weight: 700; color: #111827;">₹${orderTotalFormatted}</td>
            </tr>
            ${reason ? `
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="padding: 10px 0; color: #6b7280; font-weight: 500;">Transfer Note:</td>
              <td style="padding: 10px 0; text-align: right; font-weight: 600; color: #374151;">${reason}</td>
            </tr>
            ` : ''}
            <tr style="background: #fafaf9;">
              <td style="padding: 12px 8px; color: #111827; font-weight: 700;">New Pending Payout:</td>
              <td style="padding: 12px 8px; text-align: right; font-weight: 900; color: ${primaryColor}; font-size: 15px;">
                ₹${pendingFormatted}
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Sunday Payout Reminder -->
        <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px; padding: 14px; margin-bottom: 20px;">
          <p style="margin: 0; font-size: 12px; color: #1e40af; line-height: 1.5;">
            🗓️ <strong>Weekly Sunday Payouts:</strong> हे कमिशन दर रविवारी थेट आपल्या नोंदणीकृत UPI ID किंवा बँक खात्यात आपोआप जमा केले जाईल.
          </p>
        </div>

        <p style="font-size: 13px; color: #6b7280; line-height: 1.5; margin: 0;">
          आपल्या व्यवसायाचा विस्तार करत राहा. आपल्यासोबत जोडल्याबद्दल मनःपूर्वक धन्यवाद!
          <br>
          <strong>${storeName} Team</strong>
        </p>
      </div>

      <!-- Footer -->
      <div style="background: #f3f4f6; padding: 16px; text-align: center; font-size: 11px; color: #9ca3af;">
        © ${new Date().getFullYear()} ${storeName}. All rights reserved. Jalgaon, Maharashtra, India.
      </div>
    </div>
  `;
}

export async function sendPartnerOrderTransferredEmail(partner: any, details: any): Promise<boolean> {
  if (!partner || !partner.email) {
    console.warn('[Mailer] Cannot send order transferred email: partner email is missing.');
    return false;
  }

  try {
    const { SettingsRepository } = await import('../repositories/SettingsRepository');
    const settings = await SettingsRepository.get();
    const storeName = settings?.storeName || 'Aapla Jalgaonwala';

    const commissionFormatted = Number(details?.commissionAmount || details?.amount || 0).toLocaleString('en-IN');
    const subject = `🎉 Order #${details?.orderNumber || ''} Commission (₹${commissionFormatted}) Assigned to Your Partner Account | ${storeName}`;
    const html = generatePartnerOrderTransferredEmailHtml(partner, details, settings);

    return await sendEmail({
      to: partner.email,
      subject,
      html
    });
  } catch (err: any) {
    console.error('[Mailer] Failed to send partner order transferred email:', err?.message || err);
    return false;
  }
}


