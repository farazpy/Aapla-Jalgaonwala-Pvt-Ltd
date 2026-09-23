import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Image } from '@/components/ui/Image';
import { Link } from '@/lib/linkCompat';
import { SEO } from '@/components/seo/SEO';
import { Container } from '@/components/ui/Container';
import { Order } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import {
  CheckCircle2,
  Package,
  Truck,
  MapPin,
  Phone,
  Mail,
  ArrowRight,
  ShoppingBag,
  Printer,
  Sparkles,
  FileText,
  User as UserIcon,
  ShieldCheck,
  CreditCard,
  Banknote,
  Copy,
  Check,
  MessageSquare,
  Clock,
  Box,
  Flame,
  XCircle,
  AlertTriangle,
  RotateCcw,
  RefreshCw,
  AlertCircle,
  HelpCircle,
  Ban,
  Building,
  ChevronRight
} from 'lucide-react';
import { motion } from 'motion/react';
import { InvoiceModal } from '@/components/invoice/InvoiceModal';

export function OrderSuccessPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { addToCart, setIsCartOpen } = useCart();

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedOrderNo, setCopiedOrderNo] = useState(false);
  const [reordering, setReordering] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchOrder = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/orders/${id}`);
        const json = await res.json();
        if (json.success && json.data) {
          setOrder(json.data);
        } else {
          setOrder(null);
        }
      } catch (err) {
        console.error('Error loading order details:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  const handleDownloadInvoice = () => {
    if (!id) return;
    window.open(`/api/orders/${id}/invoice`, '_blank');
  };

  const handleCopyOrderNumber = () => {
    if (!order?.orderNumber) return;
    navigator.clipboard.writeText(order.orderNumber);
    setCopiedOrderNo(true);
    setTimeout(() => setCopiedOrderNo(false), 2000);
  };

  const handleReorder = async () => {
    if (!order || !order.items || order.items.length === 0) return;
    setReordering(true);
    try {
      const res = await fetch('/api/products');
      const json = await res.json();
      const allProducts = json.success && Array.isArray(json.data) ? json.data : [];

      for (const item of order.items) {
        const matchedProd = allProducts.find((p: any) => p.id === item.productId || p.name === item.productName);
        if (matchedProd) {
          const matchedVariant = matchedProd.variants?.find((v: any) => v.weight === item.variantInfo);
          addToCart(matchedProd, matchedVariant, item.quantity, false);
        } else {
          addToCart(
            {
              id: item.productId || `item_${Date.now()}`,
              name: item.productName,
              slug: item.productName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
              price: item.price,
              mrp: Math.round(item.price * 1.2),
              category: 'Snacks',
              images: item.image ? [{ id: '1', url: item.image, alt: item.productName }] : [],
              image: item.image,
              stock: 50,
              isAvailable: true
            },
            undefined,
            item.quantity,
            false
          );
        }
      }

      setIsCartOpen(true);
      navigate('/cart');
    } catch (err) {
      console.error('Failed to reorder items:', err);
      navigate('/shop');
    } finally {
      setReordering(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 bg-[#FAF6ED] min-h-screen flex items-center justify-center text-center">
        <div className="space-y-4">
          <div className="w-12 h-12 border-4 border-[#9B111E] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-stone-600 font-bold uppercase tracking-widest">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="py-20 bg-[#FAF6ED] min-h-screen text-center flex items-center">
        <Container size="md">
          <div className="max-w-md mx-auto bg-white p-8 rounded-3xl border border-stone-200/80 shadow-xs">
            <div className="w-14 h-14 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-stone-400">
              <Package className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-stone-900 mb-2">Order Not Found</h2>
            <p className="text-xs text-stone-500 mb-6">We couldn&apos;t locate an order with ID &ldquo;{id}&rdquo;.</p>
            <Link href="/shop" className="inline-flex items-center justify-center gap-2 w-full px-6 py-3.5 rounded-2xl bg-[#9B111E] text-white font-bold text-xs shadow-sm hover:bg-[#800A14] transition-colors">
              <ShoppingBag className="w-4 h-4 text-amber-300" />
              <span>Return to Shop</span>
            </Link>
          </div>
        </Container>
      </div>
    );
  }

  // Determine actual lifecycle state
  const statusStr = (order.status || '').toLowerCase().trim();
  const paymentStatusStr = (order.paymentStatus || '').toLowerCase().trim();

  const isCancelled = statusStr === 'cancelled' || paymentStatusStr === 'cancelled';
  const isFailed = paymentStatusStr === 'failed' || statusStr === 'failed';
  const isRefunded = statusStr === 'refunded' || paymentStatusStr === 'refunded';
  const isPaymentPending = (statusStr === 'pending' || paymentStatusStr === 'payment pending' || paymentStatusStr === 'pending') && !isCancelled && !isFailed;
  const isDelivered = statusStr === 'delivered';
  const isShipped = statusStr === 'shipped' || statusStr === 'out for delivery' || Boolean(order.awbNumber);

  // Customer Name derivation
  const customerName = order.customer?.name || order.shippingAddress?.fullName || 'Customer';

  // Calculate delivery date estimates
  const orderDate = new Date(order.createdAt || Date.now());
  const estMin = new Date(orderDate);
  estMin.setDate(estMin.getDate() + 3);
  const estMax = new Date(orderDate);
  estMax.setDate(estMax.getDate() + 5);

  const minDateStr = estMin.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  const maxDateStr = estMax.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });

  // Fallback for legacy order items with zero price
  const displayItems = (order.items || []).map(it => {
    let p = it.price || 0;
    if (p === 0 && order.subtotal > 0 && order.items.length > 0) {
      p = Math.round(order.subtotal / order.items.length);
    }
    return { ...it, displayPrice: p };
  });

  const isCod = order.paymentMethod === 'COD';
  const codAdvancePaid = order.codAdvanceFeePaid || 0;
  const codRemaining = order.codRemainingBalance !== undefined
    ? order.codRemainingBalance
    : (isCod ? Math.max(0, order.totalAmount - codAdvancePaid) : 0);

  // Dynamic SEO title based on real status
  const pageSeoTitle = isCancelled
    ? `Order Cancelled #${order.orderNumber} | Aapla Jalgaonwala`
    : isFailed
    ? `Payment Failed #${order.orderNumber} | Aapla Jalgaonwala`
    : isRefunded
    ? `Order Refunded #${order.orderNumber} | Aapla Jalgaonwala`
    : `Order Confirmed #${order.orderNumber} | Aapla Jalgaonwala`;

  return (
    <div className="py-6 sm:py-10 md:py-14 bg-[#FAF6ED] min-h-screen">
      <SEO 
        title={pageSeoTitle} 
        description={isCancelled ? `Order #${order.orderNumber} is cancelled and not being processed.` : `Order details for #${order.orderNumber}.`} 
      />

      {/* Unified max-w-5xl Container for perfect vertical grid alignment */}
      <Container size="md" className="space-y-6">

        {/* ========================================================================= */}
        {/* HERO BANNER - ERROR / CANCELLED / REFUNDED STATE */}
        {/* ========================================================================= */}
        {(isCancelled || isFailed || isRefunded) && (
          <motion.div
            initial={{ scale: 0.98, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.35 }}
            className="relative bg-gradient-to-br from-rose-50 via-white to-red-50/40 rounded-3xl p-6 sm:p-9 border border-rose-200 shadow-sm text-center overflow-hidden"
          >
            {/* Ambient Lighting Circles */}
            <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-rose-400/10 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-red-400/10 blur-3xl pointer-events-none" />

            {/* Icon Badge */}
            <div className="relative inline-flex items-center justify-center mb-3.5">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-tr from-rose-600 to-red-600 rounded-3xl rotate-2 flex items-center justify-center text-white shadow-lg shadow-rose-600/25 ring-4 ring-rose-100">
                {isRefunded ? (
                  <RotateCcw className="w-8 h-8 sm:w-10 sm:h-10 -rotate-2" />
                ) : (
                  <XCircle className="w-8 h-8 sm:w-10 sm:h-10 -rotate-2" />
                )}
              </div>
            </div>

            {/* Status Pill */}
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className={`text-[10px] sm:text-[11px] uppercase font-black tracking-widest px-3.5 py-1 rounded-full border ${
                isRefunded
                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                  : isFailed
                  ? 'bg-rose-100 text-rose-900 border-rose-300'
                  : 'bg-stone-100 text-stone-800 border-stone-300'
              }`}>
                {isRefunded 
                  ? 'Order Cancelled & Refunded' 
                  : isFailed 
                  ? 'Payment Incomplete / Failed' 
                  : 'Order Cancelled'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-stone-900 tracking-tight">
              {isRefunded 
                ? 'Order Refunded' 
                : isFailed 
                ? 'Payment Could Not Be Verified' 
                : 'This Order Was Cancelled'}
            </h1>

            <p className="text-xs sm:text-sm text-stone-600 mt-2 max-w-xl mx-auto font-medium leading-relaxed">
              {isFailed ? (
                <>
                  The online payment verification for this order was not completed or failed. As a result, this order was <strong className="text-rose-700 font-bold">not confirmed</strong> and is not scheduled for preparation or dispatch.
                </>
              ) : isRefunded ? (
                <>
                  This order was cancelled and a refund of <strong className="text-stone-900 font-bold">₹{order.totalAmount}</strong> has been processed back to your original payment method.
                </>
              ) : (
                <>
                  This order has been cancelled and is <strong className="text-rose-700 font-bold">no longer active</strong>. Our kitchen and dispatch depot will not ship these items.
                </>
              )}
            </p>

            {/* Order Identifier & Badges Grid */}
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
              <div className="flex items-center gap-2 px-3.5 py-2 bg-stone-900 text-white rounded-2xl text-xs font-bold shadow-xs">
                <span className="text-stone-400 font-normal">Order ID:</span>
                <span className="text-rose-300 font-mono font-black">{order.orderNumber}</span>
                <button
                  type="button"
                  onClick={handleCopyOrderNumber}
                  className="ml-1 p-1 rounded-lg hover:bg-white/20 text-stone-300 hover:text-white transition-colors cursor-pointer"
                  title="Copy Order ID"
                >
                  {copiedOrderNo ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="flex items-center gap-2 px-3.5 py-2 bg-rose-100 text-rose-950 rounded-2xl text-xs font-bold border border-rose-300">
                <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
                <span>Status: <strong className="text-rose-800">Cancelled / Not Dispatched</strong></span>
              </div>

              <button
                type="button"
                onClick={() => setShowInvoiceModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-white text-[#9B111E] hover:bg-rose-50 rounded-2xl text-xs font-bold border border-rose-200/80 transition-all shadow-xs cursor-pointer active:scale-98"
              >
                <FileText className="w-3.5 h-3.5 text-[#9B111E]" />
                <span>Invoice</span>
              </button>
            </div>

            {/* Quick Hero Re-order Buttons */}
            <div className="mt-6 pt-5 border-t border-rose-200/70 max-w-md mx-auto flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleReorder}
                disabled={reordering}
                className="w-full sm:w-auto flex-1 px-5 py-2.5 rounded-xl bg-[#9B111E] hover:bg-[#800A14] text-white font-black text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-98"
              >
                {reordering ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <ShoppingBag className="w-3.5 h-3.5 text-amber-300" />
                )}
                <span>{reordering ? 'Adding to Cart...' : 'Re-order Items Now'}</span>
              </button>

              <a
                href={`https://wa.me/917057446409?text=${encodeURIComponent(`Hi Aapla Jalgaonwala! I have a question regarding my cancelled order #${order.orderNumber}.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto flex-1 px-4 py-2.5 rounded-xl bg-white hover:bg-stone-50 text-stone-800 font-bold text-xs border border-stone-200 shadow-2xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                <span>WhatsApp Help</span>
              </a>
            </div>
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* HERO BANNER - PAYMENT PENDING STATE */}
        {/* ========================================================================= */}
        {isPaymentPending && (
          <motion.div
            initial={{ scale: 0.98, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.35 }}
            className="relative bg-gradient-to-br from-amber-50 via-white to-amber-50/50 rounded-3xl p-6 sm:p-9 border border-amber-300 shadow-sm text-center overflow-hidden"
          >
            <div className="relative inline-flex items-center justify-center mb-3.5">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-tr from-amber-500 to-amber-600 rounded-3xl rotate-2 flex items-center justify-center text-white shadow-lg shadow-amber-500/25 ring-4 ring-amber-100">
                <Clock className="w-8 h-8 sm:w-10 sm:h-10 -rotate-2" />
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-[10px] sm:text-[11px] uppercase font-black tracking-widest bg-amber-100 text-amber-900 px-3.5 py-1 rounded-full border border-amber-300">
                Action Required • Payment Pending
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-stone-900 tracking-tight">
              Order Awaiting Payment Verification
            </h1>

            <p className="text-xs sm:text-sm text-stone-600 mt-2 max-w-xl mx-auto font-medium leading-relaxed">
              We received your order request, but the payment confirmation is currently pending. Your snacks will only be prepared once payment is verified.
            </p>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
              <div className="flex items-center gap-2 px-3.5 py-2 bg-stone-900 text-white rounded-2xl text-xs font-bold shadow-xs">
                <span className="text-stone-400 font-normal">Order ID:</span>
                <span className="text-amber-300 font-mono font-black">{order.orderNumber}</span>
                <button
                  type="button"
                  onClick={handleCopyOrderNumber}
                  className="ml-1 p-1 rounded-lg hover:bg-white/20 text-stone-300 hover:text-white transition-colors cursor-pointer"
                  title="Copy Order ID"
                >
                  {copiedOrderNo ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="flex items-center gap-2 px-3.5 py-2 bg-amber-100 text-amber-950 rounded-2xl text-xs font-bold border border-amber-300">
                <AlertTriangle className="w-4 h-4 text-[#D9531E]" />
                <span>Status: <strong>Awaiting Confirmation</strong></span>
              </div>
            </div>
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* HERO BANNER - CONFIRMED & ACTIVE (SUCCESS FLOW) */}
        {/* ========================================================================= */}
        {!isCancelled && !isFailed && !isRefunded && !isPaymentPending && (
          <motion.div
            initial={{ scale: 0.98, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.35 }}
            className="relative bg-gradient-to-br from-white via-amber-50/40 to-white rounded-3xl p-6 sm:p-9 border border-amber-200/90 shadow-sm text-center overflow-hidden"
          >
            {/* Subtle Decorative Background Circles */}
            <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-amber-400/10 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-[#9B111E]/10 blur-3xl pointer-events-none" />

            {/* Icon Badge */}
            <div className="relative inline-flex items-center justify-center mb-3.5">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-tr from-emerald-600 to-emerald-500 rounded-3xl rotate-3 flex items-center justify-center text-white shadow-lg shadow-emerald-600/25 ring-4 ring-emerald-100">
                <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10 -rotate-3" />
              </div>
              <motion.div
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                className="absolute -top-2 -right-2 bg-amber-400 text-stone-900 p-1.5 rounded-full shadow-xs"
              >
                <Sparkles className="w-4 h-4" />
              </motion.div>
            </div>

            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-[10px] sm:text-[11px] uppercase font-black tracking-widest bg-emerald-100 text-emerald-800 px-3.5 py-1 rounded-full border border-emerald-200">
                {isDelivered ? 'Order Delivered' : isShipped ? 'Order Dispatched & In Transit' : 'Order Confirmed & Processing'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-stone-900 tracking-tight">
              {isDelivered 
                ? `Delivered, ${customerName}!`
                : `Thank You, ${customerName}!`}
            </h1>

            <p className="text-xs sm:text-sm text-stone-600 mt-2 max-w-xl mx-auto font-medium">
              {isDelivered
                ? 'Your delicious Jalgaon snacks order has been successfully delivered. We hope you enjoy the authentic taste!'
                : isShipped
                ? 'Your snacks have been freshly packed and are on their way to your delivery address!'
                : 'Your delicious Jalgaon snacks order is officially placed and sent directly to our fresh Dehu/Jalgaon depot team!'}
            </p>

            {/* Order Number & Delivery Estimate Badges */}
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
              <div className="flex items-center gap-2 px-3.5 py-2 bg-stone-900 text-white rounded-2xl text-xs font-bold shadow-xs">
                <span className="text-stone-400 font-normal">Order ID:</span>
                <span className="text-amber-300 font-mono font-black">{order.orderNumber}</span>
                <button
                  type="button"
                  onClick={handleCopyOrderNumber}
                  className="ml-1 p-1 rounded-lg hover:bg-white/20 text-stone-300 hover:text-white transition-colors cursor-pointer"
                  title="Copy Order ID"
                >
                  {copiedOrderNo ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="flex items-center gap-2 px-3.5 py-2 bg-amber-100/90 text-amber-950 rounded-2xl text-xs font-bold border border-amber-300">
                <Truck className="w-4 h-4 text-[#D9531E]" />
                <span>Est. Delivery: <strong>{minDateStr} – {maxDateStr}</strong></span>
              </div>

              <button
                type="button"
                onClick={() => setShowInvoiceModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-amber-50/70 text-[#9B111E] rounded-2xl text-xs font-bold border border-rose-200/80 transition-all shadow-xs cursor-pointer active:scale-98"
              >
                <FileText className="w-3.5 h-3.5 text-[#9B111E]" />
                <span>Invoice</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* LOGGED-IN ACCOUNT SYNC BANNER */}
        {/* ========================================================================= */}
        {isAuthenticated && user && (
          <motion.div
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 text-white rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 border border-stone-700/60"
          >
            <div className="flex items-center gap-3.5 text-center sm:text-left min-w-0">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 text-amber-300 border border-white/15">
                <UserIcon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center justify-center sm:justify-start gap-2 mb-0.5">
                  <span className="bg-amber-400/20 text-amber-200 text-[9.5px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider border border-amber-400/30 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-amber-300" /> Account Synced
                  </span>
                </div>
                <h3 className="font-bold text-xs sm:text-sm text-white truncate">
                  Logged in as {user.name || user.email}
                </h3>
                <p className="text-[11px] text-stone-300 mt-0.5 truncate hidden sm:block">
                  View complete order history, track deliveries, and reorder from your dashboard.
                </p>
              </div>
            </div>

            <Link
              href="/account"
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white text-stone-950 font-black text-xs hover:bg-stone-100 transition-all shadow-xs text-center shrink-0 flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <span>View Orders in Account</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* LIFECYCLE SUMMARY / STEPPER TIMELINE */}
        {/* ========================================================================= */}
        {isCancelled || isFailed || isRefunded ? (
          <div className="bg-rose-50/70 p-5 sm:p-6 rounded-3xl border border-rose-200 shadow-xs">
            <div className="flex items-center justify-between pb-3.5 border-b border-rose-200/80 mb-4">
              <h3 className="font-black text-xs sm:text-sm text-rose-950 flex items-center gap-2">
                <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Order Status Summary</span>
              </h3>
              <span className="text-[10px] sm:text-[11px] font-black text-rose-800 bg-rose-100 px-2.5 py-0.5 rounded-full border border-rose-300 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-rose-600" /> Cancelled / Not Shipped
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              <div className="p-3.5 rounded-2xl bg-white border border-rose-200/90 shadow-2xs space-y-1">
                <span className="text-[9.5px] font-black uppercase tracking-wider text-rose-600">Lifecycle State</span>
                <p className="text-xs sm:text-sm font-black text-stone-900">Cancelled / Inactive</p>
                <p className="text-[11px] text-stone-500 font-medium">This order will not be fulfilled or dispatched.</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-rose-200/90 shadow-2xs space-y-1">
                <span className="text-[9.5px] font-black uppercase tracking-wider text-rose-600">Payment Status</span>
                <p className="text-xs sm:text-sm font-black text-stone-900">
                  {order.paymentStatus || 'Failed / Cancelled'}
                </p>
                <p className="text-[11px] text-stone-500 font-medium">
                  {order.paymentStatus === 'Refunded' 
                    ? 'Refund credited back to source.'
                    : 'No payment was captured for this order.'}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-rose-200/90 shadow-2xs space-y-1">
                <span className="text-[9.5px] font-black uppercase tracking-wider text-rose-600">Customer Support</span>
                <p className="text-xs sm:text-sm font-black text-stone-900">Active & Ready</p>
                <p className="text-[11px] text-stone-500 font-medium">Reach our team on WhatsApp for quick help or re-ordering.</p>
              </div>
            </div>
          </div>
        ) : (
          /* Active Delivery Stepper Timeline */
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-stone-200/80 shadow-xs">
            <div className="flex items-center justify-between pb-3.5 border-b border-stone-100 mb-4">
              <h3 className="font-black text-xs sm:text-sm text-stone-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#D9531E]" />
                <span>Order Tracking Timeline</span>
              </h3>
              <span className="text-[10px] sm:text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                <Flame className="w-3 h-3 text-amber-500" /> Dispatched within 24 Hours
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 relative">
              {/* Step 1: Placed */}
              <div className="flex flex-col items-center text-center p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/90">
                <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs mb-1.5 shadow-xs">
                  <Check className="w-4 h-4" />
                </div>
                <span className="font-bold text-xs text-emerald-950">1. Placed</span>
                <span className="text-[10px] text-emerald-700 font-semibold mt-0.5">Confirmed</span>
              </div>

              {/* Step 2: Quality Packing */}
              <div className={`flex flex-col items-center text-center p-3 rounded-2xl border relative ${
                isShipped || isDelivered 
                  ? 'bg-emerald-50/70 border-emerald-200/90' 
                  : 'bg-amber-50/80 border-amber-300'
              }`}>
                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs mb-1.5 shadow-xs ${
                  isShipped || isDelivered 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-[#D9531E] text-white animate-pulse'
                }`}>
                  {isShipped || isDelivered ? <Check className="w-4 h-4" /> : <Box className="w-4 h-4" />}
                </div>
                <span className="font-bold text-xs text-amber-950">2. Fresh Packing</span>
                <span className="text-[10px] text-amber-800 font-extrabold mt-0.5">
                  {isShipped || isDelivered ? 'Completed' : 'In Progress ⚡'}
                </span>
              </div>

              {/* Step 3: Dispatched */}
              <div className={`flex flex-col items-center text-center p-3 rounded-2xl border ${
                isDelivered
                  ? 'bg-emerald-50/70 border-emerald-200/90'
                  : isShipped
                  ? 'bg-amber-50/80 border-amber-300'
                  : 'bg-stone-50 border-stone-200 opacity-80'
              }`}>
                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs mb-1.5 ${
                  isDelivered 
                    ? 'bg-emerald-600 text-white'
                    : isShipped
                    ? 'bg-[#9B111E] text-white animate-pulse'
                    : 'bg-stone-200 text-stone-600'
                }`}>
                  <Truck className="w-4 h-4" />
                </div>
                <span className="font-bold text-xs text-stone-800">3. Transit</span>
                <span className="text-[10px] text-stone-500 font-medium mt-0.5">
                  {isDelivered ? 'Completed' : isShipped ? 'In Transit 🚚' : 'Scheduled'}
                </span>
              </div>

              {/* Step 4: Handover */}
              <div className={`flex flex-col items-center text-center p-3 rounded-2xl border ${
                isDelivered
                  ? 'bg-emerald-50/70 border-emerald-200/90'
                  : 'bg-stone-50 border-stone-200 opacity-80'
              }`}>
                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs mb-1.5 ${
                  isDelivered ? 'bg-emerald-600 text-white' : 'bg-stone-200 text-stone-600'
                }`}>
                  <Package className="w-4 h-4" />
                </div>
                <span className="font-bold text-xs text-stone-800">4. Handover</span>
                <span className="text-[10px] text-stone-500 font-medium mt-0.5">
                  {isDelivered ? 'Delivered 🎉' : `Est. ${minDateStr}`}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MAIN BALANCED 2-COLUMN GRID (7 COLS / 5 COLS) */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Ordered Items & Bill Breakdown (7 cols) */}
          <div className="lg:col-span-7 bg-white p-5 sm:p-6 rounded-3xl border border-stone-200/80 shadow-xs space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-stone-100">
              <h3 className="font-black text-sm sm:text-base text-stone-900 flex items-center gap-2">
                <Package className={`w-4 h-4 sm:w-5 sm:h-5 ${isCancelled ? 'text-rose-600' : 'text-[#9B111E]'}`} />
                <span>{isCancelled ? 'Cancelled Items' : 'Ordered Snacks'}</span>
                <span className="text-[11px] font-bold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full">
                  {displayItems.length} {displayItems.length === 1 ? 'item' : 'items'}
                </span>
              </h3>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowInvoiceModal(true)}
                  className={`text-xs font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-colors cursor-pointer ${
                    isCancelled
                      ? 'text-rose-700 bg-rose-50 border-rose-200 hover:bg-rose-100'
                      : 'text-[#9B111E] bg-red-50 border-red-200/80 hover:bg-red-100/70'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Invoice</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowInvoiceModal(true)}
                  className="text-xs font-bold text-stone-600 hover:text-stone-900 flex items-center gap-1 px-2.5 py-1.5 rounded-xl hover:bg-stone-100 transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Print</span>
                </button>
              </div>
            </div>

            {/* Items List */}
            <div className="space-y-2.5">
              {displayItems.map((item, idx) => (
                <div 
                  key={item.id || idx} 
                  className={`flex items-center justify-between gap-3.5 p-3 rounded-2xl border transition-colors ${
                    isCancelled 
                      ? 'bg-rose-50/30 border-rose-100/80 opacity-85' 
                      : 'bg-stone-50/90 border-stone-200/60 hover:border-amber-200'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="relative w-12 h-12 rounded-xl bg-amber-100/80 overflow-hidden shrink-0 border border-stone-200 flex items-center justify-center">
                      {item.image ? (
                        <Image src={item.image} alt={item.productName} fill className="object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <Package className="w-5 h-5 text-amber-800/60" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-xs sm:text-sm text-stone-900 line-clamp-1">{item.productName}</h4>
                      <p className="text-[11px] text-stone-500 font-medium mt-0.5">
                        {item.variantInfo || 'Standard Pack'} • Qty: <strong className="text-stone-800">{item.quantity}</strong>
                        {item.displayPrice > 0 && <span className="ml-1 text-stone-400 font-normal">(₹{item.displayPrice} / pack)</span>}
                      </p>
                      {isCancelled && (
                        <span className="inline-block mt-0.5 text-[9.5px] font-bold text-rose-700 bg-rose-100/80 px-2 py-0.2 rounded-md">
                          Not Dispatched
                        </span>
                      )}
                    </div>
                  </div>

                  <span className={`font-black text-sm shrink-0 ${isCancelled ? 'text-stone-500 line-through' : 'text-[#9B111E]'}`}>
                    ₹{item.displayPrice * item.quantity}
                  </span>
                </div>
              ))}
            </div>

            {/* Financial Summary */}
            <div className="space-y-2 pt-3.5 border-t border-stone-100 text-xs font-semibold text-stone-600">
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span className="font-bold text-stone-900">₹{order.subtotal}</span>
              </div>

              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>
                    {order.notes?.match(/Discount from [^()|]+/)?.[0]?.replace(/\s*\([^)]*\)/g, '') ||
                      (order.referralPartnerCode ? 'Discount from Woman Partner' : (order.couponCode ? `Discount Applied (${order.couponCode})` : 'Discount Applied'))}
                  </span>
                  <span className="font-bold">-₹{order.discount}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Shipping Fee</span>
                {order.shippingFee === 0 ? (
                  <span className="font-bold text-emerald-700 uppercase flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5" /> FREE SHIPPING
                  </span>
                ) : (
                  <span className="font-bold text-stone-900">₹{order.shippingFee}</span>
                )}
              </div>

              <div className="pt-3 border-t border-stone-200 flex justify-between items-baseline text-sm font-black text-stone-900">
                <span>Total Order Value</span>
                <span className={`text-xl sm:text-2xl font-black ${isCancelled ? 'text-stone-700' : 'text-[#9B111E]'}`}>
                  ₹{order.totalAmount}
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Payment Details & Address (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Payment Summary Box */}
            <div className="bg-white p-5 sm:p-6 rounded-3xl border border-stone-200/80 shadow-xs space-y-3.5">
              <h3 className="font-black text-sm sm:text-base text-stone-900 pb-3 border-b border-stone-100 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-[#D9531E]" />
                  <span>Payment Status</span>
                </span>
                <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${
                  isFailed || isCancelled
                    ? 'bg-rose-100 text-rose-900 border-rose-300'
                    : isRefunded
                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                    : order.paymentStatus === 'Paid'
                    ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                    : 'bg-stone-100 text-stone-700 border-stone-300'
                }`}>
                  {order.paymentStatus || (isCancelled ? 'Cancelled' : 'Unpaid')}
                </span>
              </h3>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center text-stone-600">
                  <span>Payment Method:</span>
                  <span className="font-bold text-stone-900 uppercase flex items-center gap-1">
                    {isCod ? <Banknote className="w-4 h-4 text-[#D9531E]" /> : <CreditCard className="w-4 h-4 text-emerald-700" />}
                    {isCod ? 'Cash on Delivery (COD)' : 'Razorpay Gateway'}
                  </span>
                </div>

                {/* State-specific explanatory banners */}
                {isFailed && (
                  <div className="mt-2.5 p-3 rounded-2xl bg-rose-50/90 border border-rose-200 space-y-1 text-rose-900 text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-rose-800">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span>Payment Verification Incomplete</span>
                    </div>
                    <p className="text-[11px] text-rose-700 leading-snug font-medium">
                      The transaction was incomplete or could not be captured. If any funds were deducted, your bank will automatically reverse the transaction within 3-5 business days.
                    </p>
                  </div>
                )}

                {isCancelled && !isFailed && !isRefunded && (
                  <div className="mt-2.5 p-3 rounded-2xl bg-stone-50 border border-stone-200 space-y-1 text-stone-800 text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-stone-700">
                      <Ban className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                      <span>Order Cancelled</span>
                    </div>
                    <p className="text-[11px] text-stone-500 leading-snug font-medium">
                      No further payment or action is required for this cancelled order.
                    </p>
                  </div>
                )}

                {/* COD Breakdown for active orders */}
                {!isCancelled && !isFailed && isCod && (
                  <div className="mt-2.5 p-3.5 rounded-2xl bg-amber-50/90 border border-amber-300 space-y-2 shadow-2xs">
                    <div className="flex justify-between items-center font-bold text-stone-800">
                      <span className="flex items-center gap-1.5 text-stone-700">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Advance Paid Online:</span>
                      </span>
                      <span className="text-emerald-700 font-black text-sm">₹{codAdvancePaid}</span>
                    </div>

                    <div className="flex justify-between items-center font-black text-emerald-950 pt-2 border-t border-amber-200/80">
                      <span className="flex items-center gap-1.5 text-emerald-900">
                        <Banknote className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Cash Due on Delivery:</span>
                      </span>
                      <span className="text-sm font-black bg-emerald-100 text-emerald-900 px-2.5 py-0.5 rounded-xl border border-emerald-300">
                        ₹{codRemaining}
                      </span>
                    </div>

                    <p className="text-[10px] text-stone-600 leading-snug">
                      💵 Please keep exact cash of <strong>₹{codRemaining}</strong> ready to pay the courier agent upon parcel delivery.
                    </p>
                  </div>
                )}

                {!isCancelled && !isFailed && !isCod && order.paymentStatus === 'Paid' && (
                  <div className="mt-2.5 p-3 rounded-2xl bg-emerald-50/90 border border-emerald-200 text-xs text-emerald-900 space-y-0.5">
                    <div className="flex items-center gap-1.5 font-bold">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                      <span>100% Fully Paid Online</span>
                    </div>
                    <p className="text-[11px] text-emerald-800 font-medium">
                      No additional payment required upon delivery.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Delivery Address Card */}
            <div className="bg-white p-5 sm:p-6 rounded-3xl border border-stone-200/80 shadow-xs space-y-3.5">
              <h3 className="font-black text-sm sm:text-base text-stone-900 pb-3 border-b border-stone-100 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#9B111E]" />
                <span>Destination Address</span>
              </h3>

              <div className="space-y-1 text-xs font-medium text-stone-700">
                <p className="font-black text-stone-900 text-sm">{order.shippingAddress.fullName || customerName}</p>
                <p className="text-stone-600">{order.shippingAddress.addressLine1}</p>
                {order.shippingAddress.addressLine2 && <p className="text-stone-600">{order.shippingAddress.addressLine2}</p>}
                <p className="font-bold text-stone-900">{order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}</p>
                {order.shippingAddress.landmark && (
                  <p className="text-stone-600 italic bg-stone-50 p-2 rounded-xl border border-stone-100 font-normal mt-1">
                    Landmark: <span className="font-semibold text-stone-800">{order.shippingAddress.landmark}</span>
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-stone-100 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-stone-600">
                <div className="flex items-center gap-2 min-w-0">
                  <Phone className="w-3.5 h-3.5 text-[#D9531E] shrink-0" />
                  <span className="font-semibold truncate">{order.customer?.phone || order.shippingAddress?.phone || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <Mail className="w-3.5 h-3.5 text-[#D9531E] shrink-0" />
                  <span className="font-semibold truncate">{order.customer?.email || order.shippingAddress?.email || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* BOTTOM BALANCED ACTION BUTTONS */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <a
            href={`https://wa.me/917057446409?text=${encodeURIComponent(
              isCancelled 
                ? `Hi Aapla Jalgaonwala! I have a question regarding my cancelled order #${order.orderNumber}.`
                : `Hi Aapla Jalgaonwala! I have a question regarding my order #${order.orderNumber}.`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2.5 shadow-sm transition-all cursor-pointer hover:shadow-md active:scale-[0.99]"
          >
            <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
            <span>{isCancelled ? 'WhatsApp Support (Help with Order)' : 'Need Delivery Help? WhatsApp Support'}</span>
          </a>

          {isCancelled ? (
            <button
              type="button"
              onClick={handleReorder}
              disabled={reordering}
              className="w-full py-3.5 px-6 rounded-2xl bg-[#9B111E] hover:bg-[#800A14] text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2.5 shadow-sm transition-all cursor-pointer text-center hover:shadow-md active:scale-[0.99]"
            >
              {reordering ? (
                <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
              ) : (
                <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300 shrink-0" />
              )}
              <span>{reordering ? 'Adding Items to Cart...' : 'Re-order Authentic Snacks'}</span>
            </button>
          ) : (
            <Link
              href="/shop"
              className="w-full py-3.5 px-6 rounded-2xl bg-[#9B111E] hover:bg-[#800A14] text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2.5 shadow-sm transition-all cursor-pointer text-center hover:shadow-md active:scale-[0.99]"
            >
              <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300 shrink-0" />
              <span>Continue Shopping Fresh Snacks</span>
            </Link>
          )}
        </div>

      </Container>

      {/* Professional Tax Invoice Modal */}
      <InvoiceModal
        isOpen={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
        order={order}
      />
    </div>
  );
}

export default OrderSuccessPage;
