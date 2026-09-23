import { jsPDF } from 'jspdf';
import { Order } from '../../types';

function toSafeText(str: string, fallback = ''): string {
  if (!str) return fallback;
  // Convert Devanagari numerals ०-९ to 0-9
  const devanagariDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
  let s = str;
  devanagariDigits.forEach((d, i) => {
    s = s.replaceAll(d, String(i));
  });

  // Check if string contains Devanagari / Indic Unicode characters
  // Standard Helvetica core font in jsPDF corrupts multi-byte UTF-8 into broken glyphs
  const hasNonLatin = /[^\x20-\x7E\u00A0-\u00FF]/.test(s);
  if (hasNonLatin) {
    const cleaned = s.replace(/[^\x20-\x7E\u00A0-\u00FF]/g, ' ').replace(/\s+/g, ' ').trim();
    return cleaned || fallback || s;
  }

  return s.trim();
}

export function generateInvoicePdfBuffer(order: Order): Buffer {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const isCancelled = 
    (order.status || '').toLowerCase() === 'cancelled' || 
    (order.paymentStatus || '').toLowerCase() === 'failed' || 
    (order.paymentStatus || '').toLowerCase() === 'cancelled';

  // Header Banner
  if (isCancelled) {
    doc.setFillColor(185, 28, 28); // Darker Red for cancelled
  } else {
    doc.setFillColor(155, 17, 30); // #9B111E
  }
  doc.rect(0, 0, 210, 35, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('AAPLA JALGAONWALA FOOD PRODUCTS', 15, 16);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(
    isCancelled 
      ? 'Authentic Jalgaon Taste | CANCELLED ORDER (VOID)' 
      : 'Authentic Jalgaon Taste in Every Bite | Khandeshi Food Specialists', 
    15, 
    23
  );
  doc.setFontSize(8);
  doc.text('FSSAI Lic: 21523068001749 | GSTIN: 27AAKCA1234F1Z5 | Phone: +91 70574 46409', 15, 29);

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(isCancelled ? 'CANCELLED' : 'TAX INVOICE', 195, 18, { align: 'right' });
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`INV-${order.orderNumber}`, 195, 25, { align: 'right' });
  doc.text(new Date(order.createdAt).toLocaleDateString('en-IN'), 195, 30, { align: 'right' });

  // Invoice Details & Customer Info
  doc.setTextColor(31, 41, 55); // #1F2937
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Sold By (Seller):', 15, 46);
  doc.text('Billed & Shipped To:', 110, 46);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Aapla Jalgaonwala Food Products', 15, 52);
  doc.text('Gat No. 124, NH-6 Jalgaon Highway', 15, 57);
  doc.text('Jalgaon, Maharashtra - 425001', 15, 62);
  doc.text('info@aaplajalgaonwala.com', 15, 67);

  const customerName = toSafeText(order.shippingAddress?.fullName || order.customer?.name || order.customerName || 'Valued Customer');
  const customerPhone = toSafeText(order.shippingAddress?.phone || order.customer?.phone || order.customerPhone || 'N/A');
  const customerEmail = toSafeText(order.customerEmail || order.customer?.email || 'N/A');

  doc.text(customerName, 110, 52);
  doc.text(toSafeText(order.shippingAddress?.addressLine1 || '', 'Customer Address'), 110, 57);
  const cityLine = toSafeText(`${order.shippingAddress?.city || ''}, ${order.shippingAddress?.state || ''} - ${order.shippingAddress?.pincode || ''}`);
  doc.text(cityLine, 110, 62);
  doc.text(`Ph: ${customerPhone} | ${customerEmail}`, 110, 67);

  // Order Details Strip
  doc.setFillColor(245, 245, 244);
  doc.rect(15, 74, 180, 8, 'F');
  doc.setDrawColor(229, 231, 235);
  doc.rect(15, 74, 180, 8, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(`Order: #${order.orderNumber}`, 18, 79.5);
  doc.text(`Payment: ${order.paymentMethod.toUpperCase()}`, 75, 79.5);
  doc.text(`Payment Status: ${order.paymentStatus.toUpperCase()}`, 125, 79.5);
  doc.text(`Status: ${order.status.toUpperCase()}`, 172, 79.5);

  // Items Table Header
  const tableStartY = 85;
  doc.setFillColor(250, 246, 237); // #FAF6ED
  doc.rect(15, tableStartY, 180, 8, 'F');
  doc.setDrawColor(229, 231, 235);
  doc.line(15, tableStartY + 8, 195, tableStartY + 8);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(155, 17, 30);
  doc.text('Item Description', 18, tableStartY + 5.5);
  doc.text('Variant', 105, tableStartY + 5.5);
  doc.text('Qty', 140, tableStartY + 5.5);
  doc.text('Rate', 160, tableStartY + 5.5);
  doc.text('Amount', 180, tableStartY + 5.5);

  // Items Table Rows
  let curY = tableStartY + 14;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(31, 41, 55);

  order.items.forEach((item) => {
    doc.text(item.productName.substring(0, 45), 18, curY);
    doc.text(item.variantInfo || 'Standard', 105, curY);
    doc.text(item.quantity.toString(), 142, curY);
    doc.text(`₹${item.price}`, 160, curY);
    doc.text(`₹${item.price * item.quantity}`, 180, curY);
    doc.setDrawColor(243, 244, 246);
    doc.line(15, curY + 2, 195, curY + 2);
    curY += 8;
  });

  // Calculate subtotal, discount, grand total, paid and remaining cash
  const subtotal = Number(order.subtotal) || order.items.reduce((acc, it) => acc + (it.price * it.quantity), 0);
  let discount = Number(order.discount) || 0;
  if (discount === 0 && (order.referralPartnerCode || order.couponCode || (order.notes && /Discount from/i.test(order.notes)))) {
    discount = Math.round(subtotal * 0.04);
  }
  const shippingFee = Number(order.shippingFee) || 0;
  const grandTotal = Math.max(0, subtotal - discount + shippingFee);

  const isPaidInFull = (order.paymentStatus || '').toLowerCase() === 'paid';
  const advancePaid = Number(order.codAdvanceFeePaid) || 0;
  const isCod = (order.paymentMethod || '').toLowerCase() === 'cod';

  let paidAmount = 0;
  let remainingCash = 0;

  if (isPaidInFull) {
    paidAmount = grandTotal;
    remainingCash = 0;
  } else if (isCod) {
    paidAmount = advancePaid;
    remainingCash = advancePaid > 0
      ? Math.max(0, grandTotal - advancePaid)
      : (order.codRemainingBalance !== undefined && order.codRemainingBalance > 0 ? Number(order.codRemainingBalance) : grandTotal);
  } else {
    paidAmount = 0;
    remainingCash = grandTotal;
  }

  // Summary Totals
  curY += 6;
  doc.setDrawColor(209, 213, 219);
  doc.line(125, curY, 195, curY);
  curY += 6;

  doc.setFont('helvetica', 'normal');
  doc.text('Subtotal:', 130, curY);
  doc.text(`₹${subtotal}`, 180, curY);
  curY += 6;

  if (discount > 0) {
    doc.setTextColor(5, 150, 105);
    const discLabel = order.referralPartnerCode ? 'Partner Disc (4%):' : (order.couponCode ? `Coupon (${order.couponCode}):` : 'Discount (4%):');
    doc.text(discLabel, 130, curY);
    doc.text(`-₹${discount}`, 180, curY);
    doc.setTextColor(31, 41, 55);
    curY += 6;
  }

  doc.text('Shipping Fee:', 130, curY);
  doc.text(shippingFee === 0 ? 'FREE' : `₹${shippingFee}`, 180, curY);
  curY += 8;

  // Grand Total Line
  doc.setFillColor(155, 17, 30);
  doc.rect(125, curY - 5, 70, 8.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('GRAND TOTAL:', 128, curY + 1);
  doc.text(`₹${grandTotal}`, 175, curY + 1);
  curY += 12;

  // Order Paid Line
  doc.setFillColor(240, 253, 244);
  doc.rect(125, curY - 4, 70, 7, 'F');
  doc.setTextColor(22, 101, 52);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('Order Paid Online:', 128, curY + 1);
  doc.text(`₹${paidAmount}`, 175, curY + 1);
  curY += 9;

  // Remaining Cash to Collect Line
  if (remainingCash > 0) {
    doc.setFillColor(254, 243, 199);
    doc.rect(125, curY - 4, 70, 8, 'F');
    doc.setTextColor(180, 83, 9);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('Cash to Collect (COD):', 128, curY + 1.5);
    doc.setFontSize(9.5);
    doc.text(`₹${remainingCash}`, 175, curY + 1.5);
  } else {
    doc.setFillColor(243, 244, 246);
    doc.rect(125, curY - 4, 70, 7, 'F');
    doc.setTextColor(75, 85, 99);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('Cash to Collect:', 128, curY + 1);
    doc.text('₹0 (Paid in Full)', 162, curY + 1);
  }

  // Footer Note
  doc.setTextColor(156, 163, 175);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Thank you for ordering with Aapla Jalgaonwala. This is a computer-generated tax invoice.', 15, 275);
  doc.text('Jalgaon Head Office: NH-6 Jalgaon Highway, Maharashtra - 425001 | info@aaplajalgaonwala.com | +91 70574 46409', 15, 280);

  const arrayBuffer = doc.output('arraybuffer');
  return Buffer.from(arrayBuffer);
}
