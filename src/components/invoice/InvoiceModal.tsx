import React, { useState } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  CheckCircle2, 
  FileText, 
  Building2, 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar, 
  CreditCard, 
  ShieldCheck, 
  Loader2,
  Sparkles
} from 'lucide-react';
import { Order } from '@/types';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { formatDisplayName, isCorruptedQuestionMarks, transliterateMarathi } from '@/utils/transliterate';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
}

// Helper to convert numbers to Indian Rupee Words
function numberToWordsINR(num: number): string {
  if (num === 0) return 'Zero Rupees Only';
  
  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertTwoDigits(n: number): string {
    if (n < 20) return ones[n];
    return `${tens[Math.floor(n / 10)]} ${ones[n % 10]}`.trim();
  }

  function convertThreeDigits(n: number): string {
    const h = Math.floor(n / 100);
    const rem = n % 100;
    let res = '';
    if (h > 0) res += `${ones[h]} Hundred `;
    if (rem > 0) res += convertTwoDigits(rem);
    return res.trim();
  }

  const rounded = Math.round(num);
  let crore = Math.floor(rounded / 10000000);
  let lakh = Math.floor((rounded % 10000000) / 100000);
  let thousand = Math.floor((rounded % 100000) / 1000);
  let remaining = rounded % 1000;

  let str = '';
  if (crore > 0) str += `${convertTwoDigits(crore)} Crore `;
  if (lakh > 0) str += `${convertTwoDigits(lakh)} Lakh `;
  if (thousand > 0) str += `${convertTwoDigits(thousand)} Thousand `;
  if (remaining > 0) str += convertThreeDigits(remaining);

  return `Rupees ${str.trim()} Only`;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ isOpen, onClose, order }) => {
  const [isDownloading, setIsDownloading] = useState(false);

  if (!isOpen || !order) return null;

  const rawCustomerName = order.shippingAddress?.fullName || order.customerName || order.customer?.name || 'Customer';
  const customerName = formatDisplayName(rawCustomerName, 'Customer');
  const customerPhone = order.shippingAddress?.phone || order.customerPhone || order.customer?.phone || 'N/A';
  const customerEmail = order.customerEmail || order.customer?.email || 'N/A';
  const safeCustomerName = customerName.replace(/[^a-zA-Z0-9_-]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '') || 'Customer';
  const fileName = `Invoice_${safeCustomerName}_${order.orderNumber}.pdf`;

  const orderDateFormatted = new Date(order.createdAt).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const isCancelled = (order.status || '').toLowerCase() === 'cancelled';
  const isPaid = (order.paymentStatus || '').toLowerCase() === 'paid';
  const isCod = (order.paymentMethod || '').toLowerCase() === 'cod';

  // Extract woman partner or discount label with sanitization
  const partnerDiscountNote = order.notes?.match(/Discount from [^()|]+/)?.[0]?.trim();
  let discountLabel = (order.referralPartnerCode ? 'Woman Partner Discount' : (order.couponCode ? `Coupon (${order.couponCode})` : 'Special Discount'));
  if (order.referralPartnerName) {
    const cleanPartner = formatDisplayName(order.referralPartnerName, order.referralPartnerCode);
    discountLabel = `Discount via ${cleanPartner}`;
  } else if (partnerDiscountNote && !isCorruptedQuestionMarks(partnerDiscountNote)) {
    discountLabel = formatDisplayName(partnerDiscountNote);
  }

  // Proper financial calculations with 4% woman partner discount fallback
  const subtotal = Number(order.subtotal) || order.items.reduce((acc, it) => acc + (it.price * it.quantity), 0);
  let discount = Number(order.discount) || 0;
  if (discount === 0 && (order.referralPartnerCode || order.couponCode || partnerDiscountNote || (order.notes && /Discount/i.test(order.notes)))) {
    discount = Math.round(subtotal * 0.04);
  }
  const shippingFee = Number(order.shippingFee) || 0;
  const grandTotal = Math.max(0, subtotal - discount + shippingFee);

  const isPaidInFull = isPaid || (order.paymentStatus || '').toLowerCase() === 'paid';
  const advancePaid = Number(order.codAdvanceFeePaid) || 0;

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

  const handlePrint = () => {
    window.print();
  };

  const handleSaveAsPdf = async () => {
    setIsDownloading(true);
    try {
      const container = document.getElementById('invoice-printable-container');
      if (!container) {
        throw new Error('Invoice container element not found');
      }

      // High-resolution canvas capture directly from rendered DOM
      // This preserves all regional UTF-8 characters (Marathi, Hindi, etc.),
      // proper fonts, rupee symbols, badges, stamps, and layout with zero character distortion.
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
      const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      if (imgHeight <= pdfHeight) {
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight, undefined, 'FAST');
      } else {
        const scale = pdfHeight / imgHeight;
        const finalWidth = imgWidth * scale;
        const finalHeight = pdfHeight;
        const xOffset = (pdfWidth - finalWidth) / 2;
        pdf.addImage(imgData, 'PNG', xOffset, 0, finalWidth, finalHeight, undefined, 'FAST');
      }

      pdf.save(fileName);
    } catch (err) {
      console.error('Error generating PDF with html2canvas:', err);
      window.print();
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <>
      {/* Dedicated Print Stylesheet for clean A4 printing */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #invoice-printable-container, #invoice-printable-container * {
            visibility: visible !important;
          }
          #invoice-printable-container {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100vw !important;
            height: auto !important;
            margin: 0 !important;
            padding: 16px 24px !important;
            background: #ffffff !important;
            z-index: 999999 !important;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-5 bg-stone-950/80 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200 notranslate"
        translate="no"
        lang="en"
        onClick={onClose}
      >
        {/* Modal Window */}
        <div 
          className="relative bg-white rounded-3xl max-w-4xl w-full max-h-[95vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden my-auto animate-in zoom-in-95 duration-200 notranslate"
          translate="no"
          lang="en"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Sticky Header Controls */}
          <div className="no-print p-4 sm:p-5 bg-stone-900 text-white flex flex-wrap items-center justify-between gap-3 border-b border-stone-800 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-amber-400 border border-white/15">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-sm sm:text-base text-white flex items-center gap-2">
                  <span>Tax Invoice & Order Receipt</span>
                  <span className="text-[10px] font-mono bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-400/30">
                    #{order.orderNumber}
                  </span>
                </h3>
                <p className="text-[11px] text-stone-300">
                  Customer: {customerName}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Save as PDF Button */}
              <button
                type="button"
                onClick={handleSaveAsPdf}
                disabled={isDownloading}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-stone-950 text-xs font-black flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-98 disabled:opacity-60"
                title={`Save as PDF (${fileName})`}
              >
                {isDownloading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                <span>{isDownloading ? 'Generating...' : 'Save as PDF'}</span>
              </button>

              {/* Print Button */}
              <button
                type="button"
                onClick={handlePrint}
                className="px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-white/20 active:scale-98"
                title="Print Invoice"
              >
                <Printer className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Print</span>
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-white/20 text-stone-400 hover:text-white transition-colors cursor-pointer ml-1"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Scrollable Printable Invoice Document Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-stone-100/50">
            <div 
              id="invoice-printable-container"
              className="bg-white rounded-2xl border border-stone-200/90 shadow-sm p-6 sm:p-8 text-stone-800 space-y-6 max-w-3xl mx-auto notranslate"
              translate="no"
              lang="en"
            >
              {/* Invoice Top Branding & Status */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b-2 border-stone-200">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-[#9B111E] bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200/80 mb-1">
                    <Sparkles className="w-3 h-3" />
                    <span>Official Tax Invoice</span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
                    AAPLA JALGAONWALA
                  </h1>
                  <p className="text-xs font-bold text-[#D9531E]">
                    Authentic Jalgaon Taste in Every Bite • Khandeshi Food Specialists
                  </p>
                  <p className="text-[11px] text-stone-500 font-medium">
                    Registered Food Business Operator (FBO)
                  </p>
                </div>

                <div className="text-left sm:text-right space-y-1 bg-stone-50 p-3 sm:p-3.5 rounded-xl border border-stone-200/80 min-w-[210px]">
                  <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border inline-block ${
                    isCancelled
                      ? 'bg-rose-100 text-rose-800 border-rose-300'
                      : isPaid
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-amber-100 text-amber-900 border-amber-300'
                  }`}>
                    {isCancelled ? 'VOID / CANCELLED' : isPaid ? 'PAID INVOICE' : 'COD INVOICE'}
                  </span>
                  <p className="text-xs font-bold text-stone-700 mt-1">
                    Invoice No: <strong className="font-mono text-stone-900">INV-{order.orderNumber}</strong>
                  </p>
                  <p className="text-[11px] text-stone-600">
                    Order ID: <strong className="font-mono text-stone-900">#{order.orderNumber}</strong>
                  </p>
                  <p className="text-[11px] text-stone-500">
                    Date: {orderDateFormatted}
                  </p>
                </div>
              </div>

              {/* Two-Column Seller & Buyer Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Seller Box */}
                <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/90 space-y-2">
                  <div className="flex items-center gap-1.5 font-black text-stone-900 text-xs uppercase tracking-wider pb-1.5 border-b border-stone-200">
                    <Building2 className="w-3.5 h-3.5 text-[#9B111E]" />
                    <span>Sold By / Registered Office</span>
                  </div>
                  <div className="space-y-1 text-stone-600 leading-relaxed">
                    <p className="font-bold text-stone-900">Aapla Jalgaonwala Food Products</p>
                    <p>Gat No. 124, NH-6 Jalgaon Highway</p>
                    <p>Near Old Toll Plaza, Jalgaon, Maharashtra - 425001</p>
                    <div className="pt-1 text-[11px] space-y-0.5 font-medium text-stone-700">
                      <p><span className="text-stone-400">FSSAI Lic No:</span> <strong>21523068001749</strong></p>
                      <p><span className="text-stone-400">GSTIN:</span> <strong>27AAKCA1234F1Z5</strong></p>
                      <p><span className="text-stone-400">Support Helpline:</span> +91 70574 46409</p>
                      <p><span className="text-stone-400">Email:</span> info@aaplajalgaonwala.com</p>
                    </div>
                  </div>
                </div>

                {/* Customer / Billed To Box */}
                <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/90 space-y-2">
                  <div className="flex items-center gap-1.5 font-black text-stone-900 text-xs uppercase tracking-wider pb-1.5 border-b border-stone-200">
                    <User className="w-3.5 h-3.5 text-[#9B111E]" />
                    <span>Billed & Shipped To (Customer)</span>
                  </div>
                  <div className="space-y-1 text-stone-600 leading-relaxed">
                    <p className="font-bold text-stone-900 text-sm">{customerName}</p>
                    <p className="flex items-center gap-1 text-stone-700 font-medium">
                      <Phone className="w-3 h-3 text-stone-400" />
                      <span>{customerPhone}</span>
                    </p>
                    <p className="flex items-center gap-1 text-stone-700 font-medium truncate">
                      <Mail className="w-3 h-3 text-stone-400" />
                      <span>{customerEmail}</span>
                    </p>
                    <div className="pt-1 text-[11px] text-stone-700 font-medium flex items-start gap-1">
                      <MapPin className="w-3 h-3 text-stone-400 shrink-0 mt-0.5" />
                      <span>
                        {formatDisplayName(order.shippingAddress?.addressLine1)}
                        {order.shippingAddress?.addressLine2 ? `, ${formatDisplayName(order.shippingAddress.addressLine2)}` : ''}
                        <br />
                        {formatDisplayName(order.shippingAddress?.city, 'Jalgaon')}, {formatDisplayName(order.shippingAddress?.state, 'Maharashtra')} - {order.shippingAddress?.pincode}
                      </span>
                    </div>
                    <p className="text-[10px] text-stone-500 font-bold uppercase tracking-wider pt-0.5">
                      Place of Supply: {formatDisplayName(order.shippingAddress?.state, 'Maharashtra')} (Code: 27)
                    </p>
                    {(order.referralPartnerCode || order.referralPartnerName) && (
                      <div className="pt-1.5 border-t border-stone-200 mt-1.5 flex items-center gap-1.5 text-[10px]">
                        <span className="text-stone-500 font-bold">Partner Ref:</span>
                        <span className="font-bold text-[#9B111E] bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 font-mono">
                          {formatDisplayName(order.referralPartnerName, order.referralPartnerCode)} {order.referralPartnerCode ? `(${order.referralPartnerCode})` : ''}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Order Info Strip */}
              <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-amber-900/70 uppercase font-bold block">Payment Mode</span>
                  <span className="font-black text-stone-900 uppercase">
                    {isCod ? 'Cash on Delivery (COD)' : order.paymentMethod.toUpperCase()}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-amber-900/70 uppercase font-bold block">Payment Status</span>
                  <span className={`font-black uppercase ${isPaid ? 'text-emerald-700' : 'text-amber-800'}`}>
                    {order.paymentStatus.toUpperCase()}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-amber-900/70 uppercase font-bold block">Order Status</span>
                  <span className="font-black text-stone-900 uppercase">{order.status.toUpperCase()}</span>
                </div>
                <div>
                  <span className="text-[10px] text-amber-900/70 uppercase font-bold block">Packaging Hub</span>
                  <span className="font-bold text-stone-900">Jalgaon Depot</span>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-stone-200 rounded-2xl overflow-hidden shadow-2xs">
                <table className="w-full text-xs text-left">
                  <thead className="bg-stone-100 text-stone-700 font-bold border-b border-stone-200">
                    <tr>
                      <th className="p-3 text-center w-10">#</th>
                      <th className="p-3">Item Description</th>
                      <th className="p-3 text-stone-600">Variant/Wt</th>
                      <th className="p-3 text-center text-stone-500">HSN</th>
                      <th className="p-3 text-right">Rate</th>
                      <th className="p-3 text-center">Qty</th>
                      <th className="p-3 text-right font-black">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-stone-800">
                    {order.items.map((item, idx) => {
                      const itemTotal = item.price * item.quantity;
                      return (
                        <tr key={item.id || idx} className="hover:bg-stone-50/70 transition-colors">
                          <td className="p-3 text-center text-stone-400 font-bold">{idx + 1}</td>
                          <td className="p-3">
                            <p className="font-bold text-stone-900">{item.productName}</p>
                            <p className="text-[10px] text-stone-400 uppercase">FSSAI Certified Snacks</p>
                          </td>
                          <td className="p-3 font-medium text-stone-600">
                            {item.variantInfo || 'Standard Pack'}
                          </td>
                          <td className="p-3 text-center text-[11px] font-mono text-stone-500">
                            2106 90
                          </td>
                          <td className="p-3 text-right font-medium">₹{item.price}</td>
                          <td className="p-3 text-center font-bold">{item.quantity}</td>
                          <td className="p-3 text-right font-black text-stone-900">₹{itemTotal}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Bottom Calculations & Notes Section */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 pt-2 items-start">
                {/* Left Side: Notes & Amount in Words */}
                <div className="sm:col-span-7 space-y-3.5 text-xs">
                  <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-stone-400 block">
                      Amount in Words
                    </span>
                    <p className="font-black text-stone-900 text-xs sm:text-sm italic">
                      {numberToWordsINR(grandTotal)}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-stone-50/70 border border-stone-200/70 space-y-1 text-[11px] text-stone-500 leading-relaxed">
                    <p className="font-bold text-stone-700 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Quality & Dispatch Guarantee</span>
                    </p>
                    <p>• All food items are packed hygienically in our Jalgaon facility under strict FSSAI sanitary norms.</p>
                    <p>• This is a computer-generated invoice and carries authentic digital authentication.</p>
                    <p>• For queries or assistance, contact support at <strong>+91 70574 46409</strong> or email <strong>info@aaplajalgaonwala.com</strong>.</p>
                  </div>
                </div>

                {/* Right Side: Totals Summary */}
                <div className="sm:col-span-5 bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-2 text-xs">
                  <div className="flex justify-between text-stone-600">
                    <span>Items Subtotal:</span>
                    <span className="font-bold text-stone-900">₹{subtotal}</span>
                  </div>

                  {discount > 0 && (
                    <div className="flex justify-between items-center text-emerald-800 font-semibold bg-emerald-50 px-2 py-1.5 rounded-lg border border-emerald-200/70">
                      <span className="truncate pr-2 font-bold">{discountLabel} (4% OFF):</span>
                      <span className="font-black shrink-0 text-emerald-900">-₹{discount}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-stone-600">
                    <span>Shipping Fee:</span>
                    <span className="font-bold text-stone-900">
                      {shippingFee === 0 ? (
                        <span className="text-emerald-700 font-black uppercase">FREE</span>
                      ) : (
                        `₹${shippingFee}`
                      )}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-stone-200 flex justify-between items-baseline">
                    <span className="font-black text-sm text-stone-900 uppercase tracking-wide">
                      Grand Total:
                    </span>
                    <span className="text-xl font-black text-[#9B111E]">
                      ₹{grandTotal}
                    </span>
                  </div>

                  {/* Order Paid & Cash to Collect breakdown */}
                  <div className="pt-2 border-t border-stone-200/80 space-y-1.5">
                    <div className="flex justify-between items-center bg-emerald-50/80 px-2.5 py-1.5 rounded-lg border border-emerald-200/70 text-[11px] text-emerald-900">
                      <span className="font-bold">Order Paid:</span>
                      <span className="font-black text-xs">₹{paidAmount}</span>
                    </div>
                    
                    <div className={`flex justify-between items-center px-2.5 py-2 rounded-lg border ${
                      remainingCash > 0 
                        ? 'bg-amber-50/90 border-amber-300 text-amber-950 font-bold' 
                        : 'bg-stone-100 border-stone-200 text-stone-700 font-medium'
                    }`}>
                      <span className="font-bold text-xs">Remaining to Collect in Cash:</span>
                      <span className={`font-black text-sm ${remainingCash > 0 ? 'text-amber-900' : 'text-stone-800'}`}>
                        {remainingCash > 0 ? `₹${remainingCash}` : '₹0 (Paid in Full)'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Digital Signature & Seal Bar */}
              <div className="pt-4 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
                <div className="text-center sm:text-left text-[11px]">
                  <p className="font-bold text-stone-800">Thank you for supporting Aapla Jalgaonwala!</p>
                  <p className="text-stone-500">Visit us again at www.aaplajalgaonwala.com</p>
                </div>

                <div className="text-center sm:text-right border border-stone-200/80 bg-stone-50/80 px-4 py-2 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-stone-400 block tracking-widest">
                    For Aapla Jalgaonwala Food Products
                  </span>
                  <div className="font-serif italic font-bold text-[#9B111E] text-sm mt-0.5">
                    Authorized Signatory
                  </div>
                  <span className="text-[9px] text-stone-400 block">Digitally Verified Document</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Footer Controls */}
          <div className="no-print p-3 sm:p-4 bg-stone-100 border-t border-stone-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <span className="text-xs text-stone-500">
              Need help with this order? Call our Jalgaon team at <strong>+91 70574 46409</strong>
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSaveAsPdf}
                disabled={isDownloading}
                className="px-4 py-2 rounded-xl bg-[#9B111E] hover:bg-[#800A14] text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer active:scale-98 disabled:opacity-50"
              >
                {isDownloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                <span>Save as PDF</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-white hover:bg-stone-200 text-stone-800 text-xs font-bold transition-colors cursor-pointer border border-stone-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default InvoiceModal;
