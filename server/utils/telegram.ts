import { SettingsRepository } from '../repositories/SettingsRepository';

export interface TelegramResult {
  success: boolean;
  message?: string;
  error?: string;
  debugReason?: string;
  troubleshooting?: string;
  telegramResponse?: {
    ok: boolean;
    error_code?: number;
    description?: string;
    result?: any;
    [key: string]: any;
  };
}

/**
 * Escapes characters that have special meaning in Telegram HTML parse mode.
 */
export function escapeTelegramHtml(str: any): string {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Formats a rich, comprehensive Telegram alert for new orders.
 * Includes complete customer details, full delivery address, itemized breakdown, and payment info.
 */
export function formatOrderTelegramAlert(order: any, settings?: any): string {
  const storeName = settings?.storeName || 'Aapla Jalgaonwala';
  const orderNumber = order.orderNumber || order.id || 'N/A';

  // Format Order Date & Time in IST
  let orderTimeStr = '';
  try {
    const d = order.createdAt ? new Date(order.createdAt) : new Date();
    orderTimeStr = d.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }) + ' IST';
  } catch (_) {
    orderTimeStr = new Date().toISOString();
  }

  // Customer Profile Information
  const customerName = (
    order.customer?.name ||
    order.shippingAddress?.fullName ||
    order.shippingAddress?.name ||
    'Valued Customer'
  ).trim();

  const customerPhone = (
    order.customer?.phone ||
    order.shippingAddress?.phone ||
    'Not provided'
  ).trim();

  const customerEmail = (
    order.customer?.email ||
    order.shippingAddress?.email ||
    'Not provided'
  ).trim();

  // Full Delivery Address Breakdown
  const addr = order.shippingAddress || {};
  const addressLines: string[] = [];
  
  if (addr.addressLine1) {
    addressLines.push(`House/Street: <b>${escapeTelegramHtml(addr.addressLine1.trim())}</b>`);
  }
  if (addr.addressLine2) {
    addressLines.push(`Area/Society: <b>${escapeTelegramHtml(addr.addressLine2.trim())}</b>`);
  }
  if (addr.landmark) {
    addressLines.push(`Landmark: <b>${escapeTelegramHtml(addr.landmark.trim())}</b>`);
  }

  const cityStatePin: string[] = [];
  if (addr.city) cityStatePin.push(addr.city.trim());
  if (addr.state) cityStatePin.push(addr.state.trim());
  if (addr.pincode) cityStatePin.push(`PIN: ${addr.pincode.trim()}`);
  
  if (cityStatePin.length > 0) {
    addressLines.push(`Location: <b>${escapeTelegramHtml(cityStatePin.join(', '))}</b>`);
  }

  const fullAddressBlock = addressLines.length > 0
    ? addressLines.map(line => `  📍 ${line}`).join('\n')
    : '  📍 <i>No complete physical address recorded</i>';

  // Ordered Items Breakdown
  const items = Array.isArray(order.items) ? order.items : [];
  const itemsFormatted = items.map((item: any, idx: number) => {
    const name = item.productName || item.name || 'Product Item';
    const variant = item.variantInfo ? ` (${item.variantInfo})` : '';
    const qty = Number(item.quantity) || 1;
    const price = Number(item.price) || 0;
    const lineTotal = qty * price;
    return `  <b>${idx + 1}. ${escapeTelegramHtml(name)}</b>${escapeTelegramHtml(variant)}\n     ↳ <b>${qty}</b> pcs × ₹${price} = <b>₹${lineTotal}</b>`;
  }).join('\n');

  // Pricing & Calculations
  const subtotal = Number(order.subtotal) || items.reduce((sum: number, it: any) => sum + (Number(it.price || 0) * Number(it.quantity || 1)), 0);
  const discount = Number(order.discount) || 0;
  const couponCode = order.couponCode ? String(order.couponCode).trim() : '';
  const shippingFee = Number(order.shippingFee) || 0;
  const totalAmount = Number(order.totalAmount) || Math.max(0, subtotal - discount + shippingFee);

  // Payment Breakdown & Status Logic
  const paymentMethod = String(order.paymentMethod || 'COD').toUpperCase();
  const isCod = paymentMethod.includes('COD') || paymentMethod.includes('CASH');
  const paymentStatus = String(order.paymentStatus || (isCod ? 'Pending' : 'Paid'));

  let paymentSection = '';
  if (isCod) {
    const advanceFeePaid = Number(order.codAdvanceFeePaid || order.paymentDetails?.advanceFeePaid || 0);
    const remainingBalance = order.codRemainingBalance !== undefined
      ? Number(order.codRemainingBalance)
      : (advanceFeePaid > 0 ? Math.max(0, totalAmount - advanceFeePaid) : totalAmount);

    if (advanceFeePaid > 0) {
      paymentSection =
        `💳 <b>Payment Mode:</b> <b>Cash on Delivery (COD)</b>\n` +
        `⏳ <b>Payment Status:</b> <b>Partial Online Advance Paid</b>\n` +
        `   • Online Advance Collected: <b>₹${advanceFeePaid}</b>\n` +
        `   • ⚠️ <b>Pending Balance to Collect at Doorstep:</b> <b>₹${remainingBalance}</b>`;
    } else {
      paymentSection =
        `💳 <b>Payment Mode:</b> <b>Cash on Delivery (COD)</b>\n` +
        `⏳ <b>Payment Status:</b> <b>Pending Payment on Delivery</b>\n` +
        `   • ⚠️ <b>Total Cash to Collect at Doorstep:</b> <b>₹${remainingBalance}</b>`;
    }
  } else {
    // Online Prepaid (Razorpay / UPI / NetBanking / Cards)
    const transactionId = order.paymentDetails?.transactionId || order.paymentDetails?.razorpayPaymentId || 'Prepaid';
    const isPaid = paymentStatus.toLowerCase().includes('paid') || paymentStatus.toLowerCase().includes('confirmed');

    paymentSection =
      `💳 <b>Payment Mode:</b> <b>Prepaid Online (${escapeTelegramHtml(order.paymentMethod || 'Razorpay')})</b>\n` +
      `✅ <b>Payment Status:</b> <b>${isPaid ? 'PAID ONLINE (100% Captured)' : escapeTelegramHtml(paymentStatus)}</b>\n` +
      `   • Payment Reference: <code>${escapeTelegramHtml(transactionId)}</code>`;
  }

  // Summary of Pricing Lines
  const billLines: string[] = [
    `  • Items Subtotal: ₹${subtotal}`
  ];
  if (discount > 0) {
    billLines.push(`  • Discount Applied: -₹${discount}${couponCode ? ` (Code: <code>${escapeTelegramHtml(couponCode)}</code>)` : ''}`);
  }
  billLines.push(`  • Shipping / Delivery: ${shippingFee === 0 ? '<b>FREE</b>' : `₹${shippingFee}`}`);
  billLines.push(`  • <b>Grand Total Amount:</b> <b>₹${totalAmount}</b>`);

  // Customer Notes
  const notesText = order.notes && String(order.notes).trim()
    ? `\n\n📝 <b>Customer Instructions / Notes:</b>\n<i>${escapeTelegramHtml(String(order.notes).trim())}</i>`
    : '';

  return (
    `🛍️ <b>NEW ORDER PLACED #${escapeTelegramHtml(orderNumber)}</b>\n` +
    `🏪 <b>Store:</b> ${escapeTelegramHtml(storeName)}\n` +
    `⏰ <b>Date & Time:</b> ${escapeTelegramHtml(orderTimeStr)}\n` +
    `━━━━━━━━━━━━━━━━━━━━━\n` +
    `👤 <b>CUSTOMER INFORMATION</b>\n` +
    `  • <b>Name:</b> ${escapeTelegramHtml(customerName)}\n` +
    `  • <b>Phone:</b> <a href="tel:${escapeTelegramHtml(customerPhone)}">${escapeTelegramHtml(customerPhone)}</a>\n` +
    `  • <b>Email:</b> ${escapeTelegramHtml(customerEmail)}\n\n` +
    `📍 <b>FULL DELIVERY ADDRESS</b>\n` +
    `${fullAddressBlock}\n\n` +
    `📦 <b>ORDERED ITEMS (${items.length})</b>\n` +
    `${itemsFormatted || '  <i>No items listed</i>'}\n\n` +
    `💰 <b>BILL SUMMARY</b>\n` +
    `${billLines.join('\n')}\n\n` +
    `💵 <b>PAYMENT DETAILS</b>\n` +
    `${paymentSection}` +
    `${notesText}\n` +
    `━━━━━━━━━━━━━━━━━━━━━\n` +
    `📦 <i>Fulfill this order from Admin Dashboard > Orders.</i>`
  );
}

export async function sendTelegramAlertDetailed(
  message: string,
  options?: { botToken?: string; chatId?: string }
): Promise<TelegramResult> {
  try {
    const settings = await SettingsRepository.get();

    const botToken = (options?.botToken || settings.telegramBotToken || '').trim();
    const chatId = (options?.chatId || settings.telegramChatId || '').trim();
    const enabled = options?.botToken ? true : (settings.enableTelegramAlerts !== false);

    if (!enabled) {
      return {
        success: false,
        error: 'Telegram Notifications are currently disabled.',
        debugReason: 'Alerts toggle is switched OFF in store settings.',
        troubleshooting: 'Enable "Telegram Instant Order Alerts" in Admin Branding & Settings.'
      };
    }

    if (!botToken) {
      return {
        success: false,
        error: 'Telegram Bot Token is missing.',
        debugReason: 'No bot token supplied or saved.',
        troubleshooting: 'Obtain a bot token from @BotFather on Telegram and enter it in Admin Settings.'
      };
    }

    if (!chatId) {
      return {
        success: false,
        error: 'Telegram Chat ID is missing.',
        debugReason: 'No chat ID supplied or saved.',
        troubleshooting: 'Get your Chat ID by messaging @userinfobot or adding your bot to a Telegram channel/group.'
      };
    }

    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
        disable_web_page_preview: false
      })
    });

    const json: any = await res.json().catch(e => ({
      ok: false,
      error_code: res.status,
      description: `Failed to parse Telegram API JSON response: ${e.message}`
    }));

    if (json.ok) {
      console.log('[Telegram Alert] Message sent successfully to chat:', chatId);
      return {
        success: true,
        message: 'Telegram alert delivered successfully!',
        telegramResponse: json
      };
    }

    // Handle Telegram API failure with specific diagnostic hints
    console.warn('[Telegram Alert] Telegram API error response:', json);
    const errorCode = json.error_code || res.status;
    const description = json.description || 'Unknown Telegram Error';

    let debugReason = `Telegram API returned error ${errorCode}: "${description}"`;
    let troubleshooting = 'Verify Bot Token and Chat ID.';

    if (description.includes('chat not found')) {
      debugReason = `Chat ID "${chatId}" was not found by Telegram.`;
      troubleshooting = `1. Search for your bot on Telegram and tap 'START' or send it a message first.\n2. If using a Telegram Group/Channel, add the bot as a member/admin to the group.\n3. Make sure the Chat ID format is correct (e.g., numeric ID like 123456789 or @channelusername).`;
    } else if (description.includes('Unauthorized') || errorCode === 401) {
      debugReason = `Bot Token "${botToken.substring(0, 8)}..." was rejected by Telegram as Unauthorized.`;
      troubleshooting = `Check your Bot Token in @BotFather on Telegram. Re-copy the HTTP API Token carefully with no extra spaces.`;
    } else if (description.includes('bot was blocked by the user')) {
      debugReason = `The bot was blocked by the Telegram user/chat owner.`;
      troubleshooting = `Open Telegram, search for your bot, and tap 'UNBLOCK' / restart the conversation with the bot.`;
    } else if (description.includes('group chat was upgraded to a supergroup')) {
      const supergroupId = json.parameters?.migrate_to_chat_id;
      debugReason = `Group chat was upgraded to a Telegram Supergroup.`;
      troubleshooting = supergroupId
        ? `Update your Chat ID setting to the new Supergroup ID: ${supergroupId}`
        : `Check your group settings and retrieve the new Chat ID starting with -100.`;
    } else if (description.includes('not enough rights') || description.includes('have no rights')) {
      debugReason = `Bot lacks admin rights in the target Telegram Channel/Group.`;
      troubleshooting = `Promote your bot to Administrator in the Telegram group or channel permissions.`;
    }

    return {
      success: false,
      error: `Telegram Error (${errorCode}): ${description}`,
      debugReason,
      troubleshooting,
      telegramResponse: json
    };

  } catch (err: any) {
    console.error('[Telegram Alert] Exception while sending telegram alert:', err);
    return {
      success: false,
      error: `Server Network Exception: ${err.message || String(err)}`,
      debugReason: 'Failed to connect to https://api.telegram.org from server.',
      troubleshooting: 'Check internet connectivity or server firewall rules.'
    };
  }
}

export async function sendTelegramAlert(message: string, options?: { botToken?: string; chatId?: string }): Promise<boolean> {
  const result = await sendTelegramAlertDetailed(message, options);
  return result.success;
}
