import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import {
  Package,
  Truck,
  CheckCircle2,
  MapPin,
  Search,
  Copy,
  ExternalLink,
  RefreshCw,
  Phone,
  AlertCircle,
  ShoppingBag,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Calendar,
  FileText,
  MessageCircle
} from 'lucide-react';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  unit?: string;
  image?: string;
}

interface OrderData {
  id: string;
  orderNumber: string;
  createdAt: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  totalAmount: number;
  subtotal?: number;
  discount?: number;
  shippingFee?: number;
  codAdvanceFeePaid?: number;
  codRemainingBalance?: number;
  awbNumber?: string;
  trackingNumber?: string;
  courierPartner?: string;
  customerName?: string;
  shippingAddress?: {
    fullName?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    pincode?: string;
    phone?: string;
  };
  items?: OrderItem[];
  referralPartnerCode?: string;
  referralPartnerName?: string;
}

interface RawTrackingItem {
  code?: string;
  strCode?: string;
  action?: string;
  strAction?: string;
  formatted_date?: string;
  date?: string;
  strActionDate?: string;
  formatted_time?: string;
  time?: string;
  strActionTime?: string;
  origin?: string;
  strOrigin?: string;
  destination?: string;
  strDestination?: string;
  remarks?: string;
  sTrRemarks?: string;
  strRemarks?: string;
}

interface DtdcTrackingData {
  success: boolean;
  status?: string;
  mappedStatus?: string;
  shipment?: {
    strShipmentNo?: string;
    strStatus?: string;
    strBookedDate?: string;
    strBookedTime?: string;
    strOrigin?: string;
    strDestination?: string;
    strExpectedDeliveryDate?: string;
  };
  tracking?: RawTrackingItem[];
  rawResponse?: {
    trackDetails?: RawTrackingItem[];
    trackHeader?: any;
  };
  error?: string;
}

function formatDtdcDateHelper(rawDate?: string): string {
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

function formatDtdcTimeHelper(rawTime?: string): string {
  if (!rawTime || typeof rawTime !== 'string') return '';
  const clean = rawTime.trim();
  if (clean.length === 4 && /^\d{4}$/.test(clean)) {
    return `${clean.substring(0, 2)}:${clean.substring(2, 4)}`;
  }
  return clean;
}

export default function IframeOrderTrackingPage() {
  const params = useParams<{ orderId?: string }>();
  const [searchParams] = useSearchParams();
  const rawId = params.orderId || searchParams.get('id') || searchParams.get('order') || '';

  const [searchQuery, setSearchQuery] = useState(rawId);
  const [currentId, setCurrentId] = useState(rawId);

  const [order, setOrder] = useState<OrderData | null>(null);
  const [loadingOrder, setLoadingOrder] = useState<boolean>(true);
  const [orderError, setOrderError] = useState<string | null>(null);

  const [dtdcData, setDtdcData] = useState<DtdcTrackingData | null>(null);
  const [loadingTracking, setLoadingTracking] = useState<boolean>(false);
  const [copiedAwb, setCopiedAwb] = useState<boolean>(false);

  // Active tab state: 'tracking' | 'items' | 'address'
  const [activeTab, setActiveTab] = useState<'tracking' | 'items' | 'address'>('tracking');
  
  // Accordion toggle states
  const [isLogOpen, setIsLogOpen] = useState<boolean>(true);
  const [isItemsOpen, setIsItemsOpen] = useState<boolean>(true);
  const [isPriceOpen, setIsPriceOpen] = useState<boolean>(true);

  // Ensure iframe tracking pages are kept private and strictly NOT indexed by search engines
  useEffect(() => {
    let metaRobots = document.querySelector<HTMLMetaElement>("meta[name='robots']");
    const created = !metaRobots;
    if (!metaRobots) {
      metaRobots = document.createElement('meta');
      metaRobots.name = 'robots';
      document.head.appendChild(metaRobots);
    }
    const prevContent = metaRobots.content;
    metaRobots.content = 'noindex, nofollow, noarchive, nosnippet';

    return () => {
      if (metaRobots) {
        if (created) {
          metaRobots.remove();
        } else {
          metaRobots.content = prevContent || 'index, follow';
        }
      }
    };
  }, []);

  // Fetch Order details
  const fetchOrder = async (idToFetch: string) => {
    if (!idToFetch || !idToFetch.trim()) {
      setLoadingOrder(false);
      setOrder(null);
      setOrderError(null);
      return;
    }

    setLoadingOrder(true);
    setOrderError(null);
    setDtdcData(null);

    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(idToFetch.trim())}`);
      const json = await res.json();

      if (!res.ok || !json.success || !json.data) {
        setOrder(null);
        setOrderError(json.error || `Order "#${idToFetch}" was not found.`);
      } else {
        const data: OrderData = json.data;
        setOrder(data);

        // Check if AWB / tracking number exists and fetch live DTDC data
        const awb = data.awbNumber || data.trackingNumber;
        if (awb && awb.trim()) {
          fetchDtdcTracking(awb.trim());
        }
      }
    } catch (err: any) {
      setOrder(null);
      setOrderError(err.message || 'Network error fetching order details.');
    } finally {
      setLoadingOrder(false);
    }
  };

  // Fetch live DTDC shipment tracking
  const fetchDtdcTracking = async (awbNumber: string) => {
    setLoadingTracking(true);
    try {
      const res = await fetch(`/api/tracking/${encodeURIComponent(awbNumber)}`);
      const json = await res.json();
      if (json) {
        setDtdcData(json);
      }
    } catch (err) {
      console.warn('DTDC tracking fetch notice:', err);
    } finally {
      setLoadingTracking(false);
    }
  };

  useEffect(() => {
    if (rawId) {
      setCurrentId(rawId);
      setSearchQuery(rawId);
      fetchOrder(rawId);
    } else {
      setLoadingOrder(false);
    }
  }, [rawId]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setCurrentId(searchQuery.trim());
      fetchOrder(searchQuery.trim());
    }
  };

  const copyToClipboard = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedAwb(true);
    setTimeout(() => setCopiedAwb(false), 2000);
  };

  // Determine active status step (1-5)
  const getStatusStep = (status?: string) => {
    const s = (status || '').toLowerCase();
    if (s.includes('delivered')) return 5;
    if (s.includes('out for delivery') || s.includes('out_for_delivery')) return 4;
    if (s.includes('shipped') || s.includes('dispatched') || s.includes('in transit')) return 3;
    if (s.includes('processing') || s.includes('confirmed') || s.includes('packed')) return 2;
    if (s.includes('cancelled')) return 0;
    return 1;
  };

  const activeStep = getStatusStep(order?.status);

  // Extract combined list of tracking logs from API response
  const rawLogs = dtdcData?.tracking || dtdcData?.rawResponse?.trackDetails || [];
  
  // Format each log item safely
  const formattedLogs = rawLogs.map((item) => {
    const actionName = item.action || item.strAction || item.code || item.strCode || 'Status Update';
    const dateStr = item.formatted_date || formatDtdcDateHelper(item.date || item.strActionDate) || 'Recent';
    const timeStr = item.formatted_time || formatDtdcTimeHelper(item.time || item.strActionTime) || '';
    const locOrigin = item.origin || item.strOrigin || '';
    const locDest = item.destination || item.strDestination || '';
    const remarks = item.remarks || item.sTrRemarks || item.strRemarks || '';

    return {
      action: actionName,
      date: dateStr,
      time: timeStr,
      origin: locOrigin,
      destination: locDest,
      remarks: remarks.trim()
    };
  });

  // Reverse so newest movement appears at top
  const sortedLogs = [...formattedLogs].reverse();

  return (
    <div className="min-h-screen bg-[#FAF6ED] text-stone-900 p-2.5 sm:p-4 font-sans max-w-xl mx-auto space-y-3">
      {/* Top Search Bar (Only shown if no order ID in URL) */}
      {!rawId && (
        <div className="bg-white rounded-2xl p-3 border border-stone-200/90 shadow-2xs space-y-2">
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
            <div className="relative flex-1 min-w-0">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter Order ID or AWB..."
                className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#9B111E] focus:bg-white outline-none"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-2 bg-[#9B111E] hover:bg-[#800A14] text-white text-xs font-bold rounded-xl shadow-2xs transition-colors shrink-0 cursor-pointer"
            >
              Track
            </button>
          </form>
        </div>
      )}

      {/* Loading State */}
      {loadingOrder && (
        <div className="bg-white rounded-2xl p-6 border border-stone-200/90 shadow-2xs text-center space-y-2">
          <div className="w-7 h-7 border-3 border-[#9B111E] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-stone-600">Loading order status...</p>
        </div>
      )}

      {/* Error State */}
      {!loadingOrder && orderError && (
        <div className="bg-white rounded-2xl p-5 border border-red-200 shadow-2xs text-center space-y-2">
          <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-5 h-5" />
          </div>
          <h3 className="text-xs font-bold text-stone-900">Order Not Found</h3>
          <p className="text-[11px] text-stone-500 max-w-xs mx-auto">{orderError}</p>
        </div>
      )}

      {/* Main Order Content */}
      {!loadingOrder && order && (
        <div className="space-y-3">
          {/* Status Header Card */}
          <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-stone-200/90 shadow-2xs space-y-3">
            <div className="flex items-center justify-between gap-2 border-b border-stone-100 pb-2.5">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-stone-400 uppercase tracking-wider">Order</span>
                  <h2 className="text-sm sm:text-base font-black text-stone-900">
                    #{order.orderNumber || order.id}
                  </h2>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(order.orderNumber || order.id)}
                    className="text-stone-400 hover:text-stone-700 cursor-pointer"
                    title="Copy ID"
                  >
                    {copiedAwb ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
                <p className="text-[10px] text-stone-500 font-medium pt-0.5">
                  Placed {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                </p>
              </div>

              <div className="flex flex-col items-end gap-1">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  order.status === 'Delivered'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : order.status === 'Shipped' || order.status === 'Dispatched'
                    ? 'bg-blue-100 text-blue-800 border border-blue-300'
                    : order.status === 'Cancelled'
                    ? 'bg-red-100 text-red-800 border border-red-300'
                    : 'bg-amber-100 text-amber-900 border border-amber-300'
                }`}>
                  {order.status || 'Processing'}
                </span>

                <span className="text-[10px] font-bold text-stone-500">
                  {order.paymentMethod || 'Online'} • <span className="text-emerald-700">{order.paymentStatus || 'Paid'}</span>
                </span>
              </div>
            </div>

            {/* Cancelled Order Notice Banner */}
            {order.status === 'Cancelled' && (
              <div className="bg-red-50/90 border border-red-200 rounded-xl p-3.5 text-center space-y-2 mt-2">
                <div className="w-9 h-9 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-red-900 uppercase tracking-wide">Order Cancelled</h3>
                  <p className="text-[11px] text-red-700 font-medium leading-relaxed mt-0.5">
                    This order has been cancelled and will not be processed or shipped.
                  </p>
                </div>
                <a
                  href={`https://wa.me/917057446409?text=${encodeURIComponent(`Hi Aapla Jalgaonwala! I have a question regarding my cancelled order #${order.orderNumber || order.id}.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#9B111E] hover:bg-[#800A14] text-white text-[11px] font-bold rounded-lg shadow-2xs transition-colors cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Contact Support on WhatsApp</span>
                </a>
              </div>
            )}

            {/* Stepper Bar */}
            {order.status !== 'Cancelled' && (
              <div className="pt-1">
                <div className="relative flex items-center justify-between max-w-sm mx-auto px-2">
                  <div className="absolute top-3.5 left-6 right-6 h-0.5 bg-stone-200 z-0" />
                  <div
                    className="absolute top-3.5 left-6 h-0.5 bg-[#9B111E] z-0 transition-all duration-300"
                    style={{
                      width: activeStep <= 1 ? '0%' : activeStep === 2 ? '33%' : activeStep === 3 ? '66%' : '100%'
                    }}
                  />

                  {/* Step 1 */}
                  <div className="relative z-10 flex flex-col items-center">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold ${
                      activeStep >= 1 ? 'bg-[#9B111E] text-white shadow-xs' : 'bg-stone-100 text-stone-400'
                    }`}>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[9px] font-bold text-stone-700 mt-1">Placed</span>
                  </div>

                  {/* Step 2 */}
                  <div className="relative z-10 flex flex-col items-center">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold ${
                      activeStep >= 2 ? 'bg-[#9B111E] text-white shadow-xs' : 'bg-stone-100 text-stone-400'
                    }`}>
                      <Package className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[9px] font-bold text-stone-700 mt-1">Packed</span>
                  </div>

                  {/* Step 3 */}
                  <div className="relative z-10 flex flex-col items-center">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold ${
                      activeStep >= 3 ? 'bg-[#9B111E] text-white shadow-xs' : 'bg-stone-100 text-stone-400'
                    }`}>
                      <Truck className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[9px] font-bold text-stone-700 mt-1">Shipped</span>
                  </div>

                  {/* Step 4 */}
                  <div className="relative z-10 flex flex-col items-center">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold ${
                      activeStep >= 5 ? 'bg-emerald-600 text-white shadow-xs' : 'bg-stone-100 text-stone-400'
                    }`}>
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[9px] font-bold text-stone-700 mt-1">Delivered</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Minimal Mobile Tabs */}
          <div className="flex bg-white p-1 rounded-xl border border-stone-200/90 shadow-2xs gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('tracking')}
              className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'tracking'
                  ? 'bg-[#9B111E] text-white shadow-xs'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Tracking</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('items')}
              className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'items'
                  ? 'bg-[#9B111E] text-white shadow-xs'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Items ({order.items?.length || 0})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('address')}
              className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'address'
                  ? 'bg-[#9B111E] text-white shadow-xs'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Address</span>
            </button>
          </div>

          {/* TAB 1: COURIER & SHIPMENT TRACKING */}
          {activeTab === 'tracking' && (
            <div className="space-y-3">
              {/* Courier Summary Card */}
              <div className="bg-white rounded-2xl p-3.5 border border-stone-200/90 shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                  <div className="flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-[#D9531E]" />
                    <span className="text-xs font-bold text-stone-900">
                      {order.courierPartner || 'DTDC Express'}
                    </span>
                  </div>
                </div>

                <div className="bg-stone-50 rounded-xl p-2.5 border border-stone-200/80 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-stone-500 font-medium">AWB Number:</span>
                    <div className="flex items-center gap-1.5 font-mono font-bold text-stone-900">
                      <span>{order.awbNumber || order.trackingNumber || dtdcData?.shipment?.strShipmentNo || 'Pending Allocation'}</span>
                      {(order.awbNumber || order.trackingNumber || dtdcData?.shipment?.strShipmentNo) && (
                        <button
                          type="button"
                          onClick={() => copyToClipboard(order.awbNumber || order.trackingNumber || dtdcData?.shipment?.strShipmentNo || '')}
                          className="text-stone-400 hover:text-stone-700 cursor-pointer"
                        >
                          {copiedAwb ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        </button>
                      )}
                    </div>
                  </div>

                  {dtdcData?.shipment?.strStatus && (
                    <div className="flex items-center justify-between">
                      <span className="text-stone-500 font-medium">Courier Status:</span>
                      <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded text-[11px]">
                        {dtdcData.shipment.strStatus}
                      </span>
                    </div>
                  )}

                  {dtdcData?.shipment?.strExpectedDeliveryDate && (
                    <div className="flex items-center justify-between">
                      <span className="text-stone-500 font-medium">Expected Delivery:</span>
                      <span className="font-bold text-stone-900">
                        {dtdcData.shipment.strExpectedDeliveryDate}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Accordion: Shipment Movement Log */}
              <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs overflow-hidden">
                <button
                  type="button"
                  onClick={() => setIsLogOpen(!isLogOpen)}
                  className="w-full px-3.5 py-3 flex items-center justify-between bg-white text-xs font-bold text-stone-900 cursor-pointer hover:bg-stone-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#9B111E]" />
                    <span>Shipment Movement Log</span>
                    <span className="text-[10px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full font-mono">
                      {sortedLogs.length} updates
                    </span>
                  </div>
                  {isLogOpen ? <ChevronUp className="w-4 h-4 text-stone-400" /> : <ChevronDown className="w-4 h-4 text-stone-400" />}
                </button>

                {isLogOpen && (
                  <div className="px-3.5 pb-4 pt-2 border-t border-stone-100 space-y-3">
                    {loadingTracking && (
                      <div className="py-4 text-center text-xs text-stone-500 flex items-center justify-center gap-2">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#9B111E]" />
                        <span>Fetching live courier movement logs...</span>
                      </div>
                    )}

                    {!loadingTracking && sortedLogs.length === 0 && (
                      <p className="py-3 text-center text-xs text-stone-500 italic">
                        No shipment scan records available yet. Courier details will update once dispatched.
                      </p>
                    )}

                    {!loadingTracking && sortedLogs.length > 0 && (
                      <div className="relative border-l-2 border-[#9B111E]/20 ml-2 pl-3.5 space-y-3.5 pt-1">
                        {sortedLogs.map((log, idx) => {
                          const isLatest = idx === 0;
                          return (
                            <div key={idx} className="relative text-xs space-y-0.5">
                              {/* Timeline Bullet Dot */}
                              <div
                                className={`absolute -left-[19.5px] top-1.5 rounded-full ring-2 ring-white ${
                                  isLatest
                                    ? 'w-3 h-3 bg-emerald-600 shadow-xs'
                                    : 'w-2.5 h-2.5 bg-[#9B111E]'
                                }`}
                              />

                              <div className="flex items-center justify-between gap-2">
                                <span className={`font-black text-xs ${isLatest ? 'text-emerald-800' : 'text-stone-900'}`}>
                                  {log.action}
                                </span>
                                <span className="text-[10px] text-stone-400 font-mono shrink-0">
                                  {log.date} {log.time}
                                </span>
                              </div>

                              {log.origin && (
                                <p className="text-[11px] font-medium text-stone-600">
                                  📍 {log.origin} {log.destination ? `→ ${log.destination}` : ''}
                                </p>
                              )}

                              {log.remarks && (
                                <p className="text-[11px] text-stone-500 bg-stone-50 p-1.5 rounded-md border border-stone-200/60 font-mono mt-1">
                                  {log.remarks}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: ORDERED ITEMS & PRICE SUMMARY */}
          {activeTab === 'items' && (
            <div className="space-y-3">
              {/* Accordion: Items List */}
              <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs overflow-hidden">
                <button
                  type="button"
                  onClick={() => setIsItemsOpen(!isItemsOpen)}
                  className="w-full px-3.5 py-3 flex items-center justify-between bg-white text-xs font-bold text-stone-900 cursor-pointer hover:bg-stone-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-[#D9531E]" />
                    <span>Product Items</span>
                    <span className="text-[10px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full">
                      {order.items?.length || 0}
                    </span>
                  </div>
                  {isItemsOpen ? <ChevronUp className="w-4 h-4 text-stone-400" /> : <ChevronDown className="w-4 h-4 text-stone-400" />}
                </button>

                {isItemsOpen && (
                  <div className="px-3.5 pb-3 border-t border-stone-100 divide-y divide-stone-100">
                    {order.items && order.items.length > 0 ? (
                      order.items.map((item, idx) => (
                        <div key={idx} className="py-2.5 flex items-center justify-between text-xs gap-3">
                          <div className="min-w-0">
                            <p className="font-bold text-stone-900 truncate">{item.name}</p>
                            <p className="text-[11px] text-stone-500">
                              Qty: {item.quantity} {item.unit ? `(${item.unit})` : ''} × ₹{item.price}
                            </p>
                          </div>
                          <span className="font-bold text-stone-800 shrink-0">
                            ₹{item.price * item.quantity}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="py-3 text-center text-xs text-stone-500">No items listed.</p>
                    )}
                  </div>
                )}
              </div>

              {/* Accordion: Price Breakdown */}
              <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs overflow-hidden">
                <button
                  type="button"
                  onClick={() => setIsPriceOpen(!isPriceOpen)}
                  className="w-full px-3.5 py-3 flex items-center justify-between bg-white text-xs font-bold text-stone-900 cursor-pointer hover:bg-stone-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#9B111E]" />
                    <span>Payment & Bill Summary</span>
                  </div>
                  {isPriceOpen ? <ChevronUp className="w-4 h-4 text-stone-400" /> : <ChevronDown className="w-4 h-4 text-stone-400" />}
                </button>

                {isPriceOpen && (
                  <div className="p-3.5 border-t border-stone-100 text-xs space-y-2 bg-stone-50/50">
                    {Boolean(order.subtotal) && (
                      <div className="flex justify-between text-stone-600">
                        <span>Items Subtotal:</span>
                        <span>₹{order.subtotal}</span>
                      </div>
                    )}
                    {Boolean(order.discount) && (
                      <div className="flex justify-between text-emerald-700 font-medium">
                        <span>Partner/Coupon Discount:</span>
                        <span>-₹{order.discount}</span>
                      </div>
                    )}
                    {Boolean(order.shippingFee) && (
                      <div className="flex justify-between text-stone-600">
                        <span>Shipping Fee:</span>
                        <span>₹{order.shippingFee}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-black text-stone-900 text-sm border-t border-stone-200 pt-2">
                      <span>Total Amount:</span>
                      <span>₹{order.totalAmount}</span>
                    </div>

                    {order.paymentMethod === 'COD' && Boolean(order.codRemainingBalance) && order.codRemainingBalance! > 0 && (
                      <div className="flex justify-between text-amber-900 bg-amber-100 p-2.5 rounded-xl font-bold text-xs mt-2 border border-amber-200">
                        <span>COD Balance Payable on Delivery:</span>
                        <span>₹{order.codRemainingBalance}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: ADDRESS & SUPPORT */}
          {activeTab === 'address' && (
            <div className="space-y-3">
              <div className="bg-white rounded-2xl p-3.5 border border-stone-200/90 shadow-2xs space-y-2">
                <div className="flex items-center gap-1.5 border-b border-stone-100 pb-2">
                  <MapPin className="w-4 h-4 text-[#D9531E]" />
                  <h3 className="text-xs font-bold text-stone-900">Delivery Recipient & Address</h3>
                </div>

                <div className="text-xs text-stone-700 space-y-1 pt-1">
                  <p className="font-bold text-stone-900">
                    {order.shippingAddress?.fullName || order.customerName || 'Customer'}
                  </p>
                  {order.shippingAddress?.addressLine1 && (
                    <p>{order.shippingAddress.addressLine1} {order.shippingAddress.addressLine2}</p>
                  )}
                  <p>
                    {[
                      order.shippingAddress?.city,
                      order.shippingAddress?.state,
                      order.shippingAddress?.pincode
                    ].filter(Boolean).join(', ') || 'Jalgaon, Maharashtra'}
                  </p>
                </div>
              </div>

              {/* Direct Support */}
              <div className="bg-white rounded-2xl p-3.5 border border-stone-200/90 shadow-2xs text-center space-y-2">
                <p className="text-xs text-stone-600 font-medium">Customer Support Assistance</p>
                <div className="flex items-center justify-center gap-4 text-xs font-bold text-[#9B111E]">
                  <a href="tel:+917057446409" className="flex items-center gap-1 hover:underline">
                    <Phone className="w-3.5 h-3.5" />
                    <span>+91 70574 46409</span>
                  </a>
                  <span>•</span>
                  <a href="mailto:info@aaplajalgaonwala.com" className="hover:underline">
                    Support Email
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
