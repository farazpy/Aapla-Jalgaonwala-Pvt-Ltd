import { SettingsRepository } from '../repositories/SettingsRepository';
import { CouponRepository } from '../repositories/CouponRepository';
import { PartnerRepository } from '../repositories/PartnerRepository';
import {
  sendEmail,
  generateOrderConfirmationEmailHtml,
  generateAdminNewOrderAlertEmailHtml
} from './mailer';
import { sendTelegramAlert, formatOrderTelegramAlert } from './telegram';

/**
 * Dispatches customer confirmation email, admin alert email, instant Telegram alert,
 * coupon counter increment, and woman partner referral commission.
 */
export async function dispatchOrderConfirmationNotifications(order: any): Promise<void> {
  if (!order) return;

  try {
    const siteSettings = await SettingsRepository.get();

    // 1. Send customer confirmation email
    if (order.customer?.email) {
      sendEmail({
        to: order.customer.email,
        subject: `Order Confirmed #${order.orderNumber} | ${siteSettings.storeName || 'Aapla Jalgaonwala'}`,
        html: generateOrderConfirmationEmailHtml(order, siteSettings)
      }).catch(err => console.warn('[Order] Customer email notification error:', err));
    }

    // 2. Send admin alert email
    const adminEmail =
      siteSettings.adminNotificationEmail ||
      siteSettings.contactEmail ||
      process.env.ADMIN_NOTIFICATION_EMAIL ||
      'aaplajalgaonwala@gmail.com';

    if (adminEmail) {
      sendEmail({
        to: adminEmail,
        subject: `🚨 [New Order] #${order.orderNumber} - ₹${order.totalAmount} (${order.paymentMethod || 'Razorpay'}) from ${order.customer?.name || 'Customer'}`,
        html: generateAdminNewOrderAlertEmailHtml(order, siteSettings)
      }).catch(err => console.warn('[Order] Admin email notification error:', err));
    }

    // 3. Send instant Telegram alert with full customer, address, items & payment breakdown
    if (siteSettings.enableTelegramAlerts !== false && siteSettings.telegramBotToken && siteSettings.telegramChatId) {
      const telegramText = formatOrderTelegramAlert(order, siteSettings);
      sendTelegramAlert(telegramText).catch(err => console.warn('[Order] Telegram alert error:', err));
    }

    // 4. Increment coupon usage counter
    if (order.couponCode) {
      CouponRepository.incrementUsage(order.couponCode).catch(err =>
        console.warn('[Order] Coupon usage increment warning:', err)
      );
    }

    // 5. Record partner referral
    const partnerCode = order.referralPartnerCode || order.partnerCode || order.referralCode;
    if (partnerCode) {
      PartnerRepository.recordOrderReferral({
        partnerCode,
        orderId: order.id,
        orderNumber: order.orderNumber,
        orderTotal: order.totalAmount,
        customerName: order.customer?.name || 'Customer',
        customerCity: order.shippingAddress?.city || 'Maharashtra'
      }).then(ref => {
        if (ref) {
          console.log(`[PartnerReferral] Linked order #${order.orderNumber} to partner ${partnerCode} (Commission: ₹${ref.partnerCommission})`);
        }
      }).catch(err => console.warn('[PartnerReferral] Error recording referral:', err));
    }
  } catch (err) {
    console.warn('[Order Notification Dispatch] Error:', err);
  }
}
