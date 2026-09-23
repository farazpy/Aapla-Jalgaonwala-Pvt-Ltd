import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { Coupon, Category, Product } from '../../types';
import { ErrorBoundary } from '../../components/ui/ErrorBoundary';
import {
  TicketPercent,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Calendar,
  AlertCircle,
  Percent,
  DollarSign,
  Tag,
  Package,
  Layers,
  Copy,
  Check,
  Power,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Helper function to identify and exclude woman business partner referral discount codes
export const isWomanPartnerCoupon = (coupon: any, partnerCodes?: Set<string>): boolean => {
  if (!coupon) return false;
  if (coupon.isPartnerCode) return true;
  const code = (coupon.code || '').trim().toUpperCase();
  if (code.startsWith('AJW-') || code.startsWith('WBP-')) return true;
  if (partnerCodes && partnerCodes.has(code)) return true;
  const desc = (coupon.description || '').toLowerCase();
  if (
    desc.includes('women business partner') ||
    desc.includes('woman business partner') ||
    desc.includes('women partner') ||
    desc.includes('woman partner') ||
    desc.includes('business partner') ||
    desc.includes('referral discount') ||
    desc.includes('referral code')
  ) {
    return true;
  }
  return false;
};

export function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [partnerCodes, setPartnerCodes] = useState<Set<string>>(new Set());
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'active' | 'expired'>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Form State
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed' | 'free_shipping'>('percentage');
  const [discountValue, setDiscountValue] = useState<number>(10);
  const [minOrderAmount, setMinOrderAmount] = useState<number | undefined>(499);
  const [maxDiscount, setMaxDiscount] = useState<number | undefined>(200);
  const [startDate, setStartDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [usageLimit, setUsageLimit] = useState<number | undefined>(100);
  const [isActive, setIsActive] = useState(true);
  const [applicableCategories, setApplicableCategories] = useState<string[]>([]);
  const [applicableProducts, setApplicableProducts] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [firstTimeUserOnly, setFirstTimeUserOnly] = useState(false);
  const [paymentMethodRestriction, setPaymentMethodRestriction] = useState<'all' | 'online' | 'cod'>('all');
  const [minItemQuantity, setMinItemQuantity] = useState<number | undefined>(undefined);
  const [usageLimitPerUser, setUsageLimitPerUser] = useState<number | undefined>(1);
  const [isAutoApply, setIsAutoApply] = useState(false);
  const [autoApplyTitle, setAutoApplyTitle] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const headers = { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache', 'X-Admin-Request': 'true' };
      const timestamp = Date.now();
      const [coupRes, catRes, prodRes, partnerRes] = await Promise.all([
        fetch(`/api/coupons?excludePartners=true&_t=${timestamp}`, { headers }).then((r) => r.json()),
        fetch(`/api/categories?_t=${timestamp}`, { headers }).then((r) => r.json()),
        fetch(`/api/products?_t=${timestamp}`, { headers }).then((r) => r.json()),
        fetch(`/api/partner-program/partners?_t=${timestamp}`, { headers }).then((r) => r.json()).catch(() => ({ data: [] }))
      ]);

      const partnerCodeSet = new Set<string>();
      if (partnerRes && partnerRes.success && Array.isArray(partnerRes.data)) {
        partnerRes.data.forEach((p: any) => {
          if (p.partnerCode) partnerCodeSet.add(p.partnerCode.trim().toUpperCase());
        });
      }
      setPartnerCodes(partnerCodeSet);

      if (coupRes.success && Array.isArray(coupRes.data)) {
        const storeCouponsOnly = coupRes.data.filter((c: any) => !isWomanPartnerCoupon(c, partnerCodeSet));
        setCoupons(storeCouponsOnly);
      }
      if (catRes.success && Array.isArray(catRes.data)) {
        setCategories(catRes.data);
      }
      if (prodRes.success && Array.isArray(prodRes.data)) {
        setProducts(prodRes.data);
      }
    } catch (err) {
      console.error('Error fetching coupon page data:', err);
      showToast('Failed to load coupons data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const openAddModal = () => {
    setEditingCoupon(null);
    setCode(`PROMO${Math.floor(10 + Math.random() * 90)}`);
    setDiscountType('percentage');
    setDiscountValue(15);
    setMinOrderAmount(499);
    setMaxDiscount(250);
    setStartDate(new Date().toISOString().split('T')[0]);
    
    // Default expiry 30 days ahead
    const future = new Date();
    future.setDate(future.getDate() + 30);
    setExpiryDate(future.toISOString().split('T')[0]);

    setUsageLimit(100);
    setIsActive(true);
    setIsAutoApply(false);
    setAutoApplyTitle('');
    setApplicableCategories([]);
    setApplicableProducts([]);
    setDescription('Festive store discount for all snacks and namkeen');
    setFirstTimeUserOnly(false);
    setPaymentMethodRestriction('all');
    setMinItemQuantity(undefined);
    setUsageLimitPerUser(1);
    setIsModalOpen(true);
  };

  const openEditModal = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setCode(coupon.code);
    setDiscountType(coupon.discountType || coupon.type || 'percentage');
    setDiscountValue(coupon.discountValue ?? coupon.value ?? 0);
    setMinOrderAmount(coupon.minOrderAmount ?? coupon.minimumOrder ?? undefined);
    setMaxDiscount(coupon.maxDiscount ?? coupon.maximumDiscount ?? undefined);
    const startStr = coupon.startDate || coupon.startsAt;
    const expStr = coupon.expiryDate || coupon.expiresAt;
    setStartDate(startStr ? startStr.split('T')[0] : '');
    setExpiryDate(expStr ? expStr.split('T')[0] : '');
    setUsageLimit(coupon.usageLimit);
    setIsActive(coupon.isActive);
    setIsAutoApply(Boolean(coupon.isAutoApply));
    setAutoApplyTitle(coupon.autoApplyTitle || '');
    setApplicableCategories(coupon.applicableCategories || []);
    setApplicableProducts(coupon.applicableProducts || coupon.applicableProductIds || []);
    setDescription(coupon.description || '');
    setFirstTimeUserOnly(Boolean(coupon.firstTimeUserOnly));
    setPaymentMethodRestriction(coupon.paymentMethodRestriction || 'all');
    setMinItemQuantity(coupon.minItemQuantity);
    setUsageLimitPerUser(coupon.usageLimitPerUser || 1);
    setIsModalOpen(true);
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      showToast('Coupon code is required');
      return;
    }

    const couponPayload = {
      code: code.trim().toUpperCase(),
      type: discountType,
      discountType,
      value: Number(discountValue),
      discountValue: Number(discountValue),
      minimumOrder: minOrderAmount ? Number(minOrderAmount) : 0,
      minOrderAmount: minOrderAmount ? Number(minOrderAmount) : undefined,
      maximumDiscount: discountType === 'percentage' && maxDiscount ? Number(maxDiscount) : undefined,
      maxDiscount: discountType === 'percentage' && maxDiscount ? Number(maxDiscount) : undefined,
      startDate: startDate || undefined,
      startsAt: startDate || undefined,
      expiryDate: expiryDate || undefined,
      expiresAt: expiryDate || undefined,
      usageLimit: usageLimit ? Number(usageLimit) : undefined,
      isActive,
      isAutoApply,
      autoApplyTitle: isAutoApply ? (autoApplyTitle.trim() || 'Special Offer') : undefined,
      applicableCategories,
      applicableProducts,
      applicableProductIds: applicableProducts,
      isStoreWide: applicableCategories.length === 0 && applicableProducts.length === 0,
      description: description.trim(),
      firstTimeUserOnly,
      paymentMethodRestriction,
      minItemQuantity: minItemQuantity ? Number(minItemQuantity) : undefined,
      usageLimitPerUser: usageLimitPerUser ? Number(usageLimitPerUser) : undefined
    };

    try {
      const url = editingCoupon ? `/api/coupons/${editingCoupon.id}` : '/api/coupons';
      const method = editingCoupon ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(couponPayload)
      });

      const data = await res.json();
      if (data.success) {
        showToast(editingCoupon ? 'Coupon updated successfully!' : 'New coupon created successfully!');
        setIsModalOpen(false);
        fetchInitialData();
      } else {
        showToast(data.message || 'Failed to save coupon');
      }
    } catch (err: any) {
      showToast(err.message || 'Error communicating with server');
    }
  };

  const handleToggleActive = async (coupon: Coupon) => {
    try {
      const res = await fetch(`/api/coupons/${coupon.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !coupon.isActive })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Coupon ${coupon.code} is now ${!coupon.isActive ? 'Active' : 'Disabled'}`);
        fetchInitialData();
      }
    } catch (err) {
      showToast('Failed to update status');
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    try {
      const res = await fetch(`/api/coupons/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast('Coupon deleted');
        setDeleteConfirmId(null);
        fetchInitialData();
      } else {
        showToast(data.message || 'Failed to delete coupon');
      }
    } catch (err) {
      showToast('Error deleting coupon');
    }
  };

  const copyCode = (c: string) => {
    navigator.clipboard.writeText(c);
    setCopiedCode(c);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Filtered coupons list (strictly excluding woman partner referral codes)
  const filteredCoupons = coupons.filter((c) => {
    if (isWomanPartnerCoupon(c, partnerCodes)) return false;

    const matchesSearch =
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const isExpired = c.expiryDate && new Date(c.expiryDate) < new Date();

    if (filterType === 'active') {
      return matchesSearch && c.isActive && !isExpired;
    }
    if (filterType === 'expired') {
      return matchesSearch && isExpired;
    }
    return matchesSearch;
  });

  const storeCouponsCount = coupons.filter((c) => !isWomanPartnerCoupon(c, partnerCodes)).length;
  const activeStoreCouponsCount = coupons.filter(
    (c) => !isWomanPartnerCoupon(c, partnerCodes) && c.isActive && (!c.expiryDate || new Date(c.expiryDate) >= new Date())
  ).length;
  const redeemedStoreCouponsCount = coupons
    .filter((c) => !isWomanPartnerCoupon(c, partnerCodes))
    .reduce((acc, c) => acc + (c.usedCount || 0), 0);

  return (
    <ErrorBoundary>
      <AdminLayout
        pageTitle="Store Coupons & Promos"
      breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Coupons' }]}
      actions={
        <button
          onClick={openAddModal}
          className="bg-[#9B111E] text-white hover:bg-[#800A14] transition-colors px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-md cursor-pointer ring-1 ring-white/20"
        >
          <Plus className="w-4 h-4" />
          <span>Create Coupon</span>
        </button>
      }
    >
      {/* Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-6 z-50 bg-stone-900 text-white px-4 py-3 rounded-xl shadow-xl text-sm font-medium flex items-center gap-2 border border-stone-800"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-900/90 via-stone-900 to-amber-950 text-white p-6 rounded-2xl mb-6 shadow-md border border-amber-800/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs tracking-wider uppercase mb-1">
              <TicketPercent className="w-4 h-4" />
              <span>Store-Wide Discounts & Promotion Engine</span>
            </div>
            <h1 className="text-2xl font-bold font-serif text-amber-100">Store Coupons & Criteria Rules</h1>
            <p className="text-stone-300 text-sm mt-1 max-w-2xl">
              Set up targeted discount codes with minimum order thresholds, category restrictions, maximum discount caps, and automated usage limits.
            </p>
          </div>
          <div className="flex items-center gap-3 bg-stone-800/80 p-3 rounded-xl border border-stone-700/50 shrink-0">
            <div className="text-center px-3 border-r border-stone-700">
              <span className="block text-xl font-bold text-amber-300">{storeCouponsCount}</span>
              <span className="text-[10px] uppercase text-stone-400 font-medium">Total</span>
            </div>
            <div className="text-center px-3 border-r border-stone-700">
              <span className="block text-xl font-bold text-emerald-400">
                {activeStoreCouponsCount}
              </span>
              <span className="text-[10px] uppercase text-stone-400 font-medium">Active</span>
            </div>
            <div className="text-center px-3">
              <span className="block text-xl font-bold text-amber-400">
                {redeemedStoreCouponsCount}
              </span>
              <span className="text-[10px] uppercase text-stone-400 font-medium">Redeemed</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dedicated Store Coupons Scope Notice */}
      <div className="bg-stone-50 border border-stone-200/90 rounded-xl px-4 py-3 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs">
        <div className="flex items-center gap-2.5 text-stone-700">
          <TicketPercent className="w-4 h-4 text-[#9B111E] shrink-0" />
          <span>
            This page is strictly reserved for <strong>Store Discount Coupons</strong>. Women Business Partner referral codes are managed separately in the <a href="/admin/partners" className="font-bold text-[#9B111E] hover:underline">Women Partners Program</a>.
          </span>
        </div>
        <a
          href="/admin/partners"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-stone-700 hover:text-stone-900 font-semibold shadow-2xs hover:bg-stone-50 transition-colors shrink-0"
        >
          <span>View Women Partners</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-stone-200 mb-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Search by coupon code or title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Status:</span>
          <div className="flex bg-stone-100 p-1 rounded-xl">
            {(['all', 'active', 'expired'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all ${
                  filterType === type ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Coupons Grid / Table */}
      {loading ? (
        <div className="bg-white p-12 rounded-2xl border border-stone-200 text-center text-stone-500">
          <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm">Loading store coupons...</p>
        </div>
      ) : filteredCoupons.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-stone-200 text-center">
          <TicketPercent className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <h3 className="font-serif text-lg font-bold text-stone-800">No Coupons Found</h3>
          <p className="text-sm text-stone-500 max-w-md mx-auto mt-1 mb-4">
            {searchQuery ? 'No coupons matched your search query.' : 'Create your first store coupon to offer discounts to customers.'}
          </p>
          <button
            onClick={openAddModal}
            className="bg-amber-600 text-white hover:bg-amber-700 px-4 py-2 rounded-xl text-sm font-semibold inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Coupon</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredCoupons.map((coupon) => {
            const isExpired = coupon.expiryDate && new Date(coupon.expiryDate) < new Date();
            return (
              <div
                key={coupon.id}
                className={`bg-white rounded-2xl border overflow-hidden transition-all shadow-sm hover:shadow-md flex flex-col justify-between ${
                  !coupon.isActive || isExpired ? 'border-stone-200 opacity-80' : 'border-amber-200/80 ring-1 ring-amber-500/10'
                }`}
              >
                <div>
                  {/* Coupon Header Badge */}
                  <div className="p-4 bg-gradient-to-r from-stone-900 to-stone-800 text-white flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-extrabold text-amber-300 tracking-wider text-base bg-amber-950/60 px-2.5 py-1 rounded-lg border border-amber-500/30">
                        {coupon.code}
                      </span>
                      <button
                        onClick={() => copyCode(coupon.code)}
                        title="Copy Code"
                        className="text-stone-400 hover:text-white transition-colors"
                      >
                        {copiedCode === coupon.code ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      {isExpired ? (
                        <span className="bg-red-500/20 text-red-300 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border border-red-500/30">
                          Expired
                        </span>
                      ) : coupon.isActive ? (
                        <span className="bg-emerald-500/20 text-emerald-300 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                          Active
                        </span>
                      ) : (
                        <span className="bg-stone-500/20 text-stone-400 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border border-stone-500/30">
                          Disabled
                        </span>
                      )}

                      <button
                        onClick={() => handleToggleActive(coupon)}
                        title={coupon.isActive ? 'Disable Coupon' : 'Enable Coupon'}
                        className={`p-1 rounded-lg transition-colors ${
                          coupon.isActive ? 'text-emerald-400 hover:bg-emerald-950' : 'text-stone-400 hover:bg-stone-700'
                        }`}
                      >
                        <Power className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-4">
                    <div>
                      <div className="text-2xl font-bold text-stone-900 font-serif">
                        {(coupon.discountType || coupon.type) === 'percentage' ? (
                          <span className="text-amber-700">{(coupon.discountValue ?? coupon.value)}% OFF</span>
                        ) : (coupon.discountType || coupon.type) === 'free_shipping' ? (
                          <span className="text-emerald-700 flex items-center gap-1.5 text-xl">
                            🚚 FREE SHIPPING
                          </span>
                        ) : (
                          <span className="text-amber-700">₹{(coupon.discountValue ?? coupon.value)} OFF</span>
                        )}
                        {(coupon.discountType || coupon.type) === 'percentage' && (coupon.maxDiscount || coupon.maximumDiscount) && (
                          <span className="text-xs font-sans font-semibold text-stone-500 block">
                            Max discount cap: ₹{coupon.maxDiscount || coupon.maximumDiscount}
                          </span>
                        )}
                      </div>
                      {coupon.description && (
                        <p className="text-xs text-stone-600 mt-1 line-clamp-2">{coupon.description}</p>
                      )}
                    </div>

                    {/* Criteria Badges */}
                    <div className="flex flex-wrap gap-1.5">
                      {coupon.isAutoApply && (
                        <span className="bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold text-[10px] px-2.5 py-0.5 rounded-md flex items-center gap-1 shadow-2xs">
                          <Sparkles className="w-3 h-3" /> Auto-Applies: "{coupon.autoApplyTitle || 'Special Offer'}"
                        </span>
                      )}
                      {coupon.firstTimeUserOnly && (
                        <span className="bg-purple-50 text-purple-800 border border-purple-200 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                          ✨ 1st Order Only
                        </span>
                      )}
                      {coupon.paymentMethodRestriction === 'online' && (
                        <span className="bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                          💳 Prepaid Online Only
                        </span>
                      )}
                      {coupon.paymentMethodRestriction === 'cod' && (
                        <span className="bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                          💵 COD Only
                        </span>
                      )}
                      {coupon.minItemQuantity && (
                        <span className="bg-stone-100 text-stone-700 border border-stone-200 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                          📦 Min {coupon.minItemQuantity} Items
                        </span>
                      )}
                    </div>

                    {/* Rules & Criteria */}
                    <div className="bg-stone-50 p-3 rounded-xl border border-stone-100 text-xs space-y-1.5 text-stone-700">
                      <div className="flex items-center justify-between">
                        <span className="text-stone-500">Min. Order Value:</span>
                        <span className="font-semibold">
                          {(coupon.minOrderAmount || coupon.minimumOrder) ? `₹${coupon.minOrderAmount || coupon.minimumOrder}` : 'No Minimum'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-stone-500">Redeemed:</span>
                        <span className="font-semibold text-amber-700">
                          {coupon.usedCount || coupon.usageCount || 0} {coupon.usageLimit ? `/ ${coupon.usageLimit} max` : 'times'}
                        </span>
                      </div>
                      {(coupon.expiryDate || coupon.expiresAt) && (
                        <div className="flex items-center justify-between">
                          <span className="text-stone-500">Valid Till:</span>
                          <span className="font-semibold">
                            {new Date(coupon.expiryDate || coupon.expiresAt!).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Restrictions */}
                    {((coupon.applicableCategories && coupon.applicableCategories.length > 0) ||
                      (coupon.applicableProducts && coupon.applicableProducts.length > 0)) && (
                      <div className="space-y-1">
                        <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block">
                          Restrictions:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {coupon.applicableCategories?.map((catId) => {
                            const cat = categories.find((c) => c.id === catId);
                            return (
                              <span
                                key={catId}
                                className="bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1"
                              >
                                <Tag className="w-3 h-3" />
                                {cat ? cat.name : catId}
                              </span>
                            );
                          })}
                          {coupon.applicableProducts?.map((prodId) => {
                            const prod = products.find((p) => p.id === prodId);
                            return (
                              <span
                                key={prodId}
                                className="bg-stone-100 text-stone-800 border border-stone-200 text-[10px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1"
                              >
                                <Package className="w-3 h-3" />
                                {prod ? prod.name : prodId}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 bg-stone-50 border-t border-stone-100 flex items-center justify-between">
                  <span className="text-[11px] text-stone-400">ID: {coupon.id}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(coupon)}
                      className="p-1.5 text-stone-600 hover:text-amber-800 hover:bg-amber-100/60 rounded-lg transition-colors text-xs font-semibold flex items-center gap-1"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(coupon.id)}
                      className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[100] bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-center font-serif text-lg font-bold text-stone-900">Delete Coupon?</h3>
            <p className="text-center text-stone-600 text-sm mt-1 mb-6">
              This action cannot be undone. Customers will no longer be able to use this coupon code.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2.5 border border-stone-300 rounded-xl font-semibold text-stone-700 hover:bg-stone-50 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteCoupon(deleteConfirmId)}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 text-sm shadow-sm"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Coupon Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full my-8 p-6 shadow-2xl border border-stone-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100 mb-6">
              <div>
                <h2 className="text-xl font-bold font-serif text-stone-900">
                  {editingCoupon ? 'Edit Coupon' : 'Create Store Coupon'}
                </h2>
                <p className="text-xs text-stone-500">Configure discount code parameters and eligibility conditions</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 p-1.5 rounded-lg hover:bg-stone-100"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCoupon} className="space-y-6">
              {/* Quick Presets Bar */}
              <div className="p-3 bg-stone-100/80 rounded-2xl border border-stone-200/80 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-stone-700">
                  <span className="flex items-center gap-1.5 uppercase tracking-wider text-[11px] text-amber-800">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    Quick Strategy Presets
                  </span>
                  <span className="text-[10px] text-stone-400 font-normal">Click to auto-populate criteria</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCode('WELCOME100');
                      setDiscountType('fixed');
                      setDiscountValue(100);
                      setMinOrderAmount(399);
                      setFirstTimeUserOnly(true);
                      setPaymentMethodRestriction('all');
                      setDescription('₹100 Off for First-Time Customers');
                    }}
                    className="px-2.5 py-1 bg-white hover:bg-amber-50 text-stone-700 hover:text-amber-900 border border-stone-200 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-2xs"
                  >
                    🎁 First Order ₹100 Off
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCode('PREPAID20');
                      setDiscountType('percentage');
                      setDiscountValue(20);
                      setMaxDiscount(200);
                      setMinOrderAmount(499);
                      setPaymentMethodRestriction('online');
                      setFirstTimeUserOnly(false);
                      setDescription('20% Off on Prepaid Online UPI/Card Orders');
                    }}
                    className="px-2.5 py-1 bg-white hover:bg-amber-50 text-stone-700 hover:text-amber-900 border border-stone-200 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-2xs"
                  >
                    💳 Prepaid Online 20% Off
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCode('FREESHIP');
                      setDiscountType('free_shipping');
                      setDiscountValue(0);
                      setMinOrderAmount(299);
                      setPaymentMethodRestriction('all');
                      setDescription('Free Express Shipping on Orders Above ₹299');
                    }}
                    className="px-2.5 py-1 bg-white hover:bg-amber-50 text-stone-700 hover:text-amber-900 border border-stone-200 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-2xs"
                  >
                    🚚 Free Shipping Above ₹299
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCode('BULKBONUS');
                      setDiscountType('percentage');
                      setDiscountValue(15);
                      setMaxDiscount(350);
                      setMinOrderAmount(999);
                      setMinItemQuantity(3);
                      setDescription('15% Off on Bulk Orders (Min 3 Items)');
                    }}
                    className="px-2.5 py-1 bg-white hover:bg-amber-50 text-stone-700 hover:text-amber-900 border border-stone-200 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-2xs"
                  >
                    📦 Bulk 3+ Items Discount
                  </button>
                </div>
              </div>

              {/* Code and Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                    Coupon Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. FESTIVE20"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl font-mono font-bold text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                    Status
                  </label>
                  <select
                    value={isActive ? 'active' : 'disabled'}
                    onChange={(e) => setIsActive(e.target.value === 'active')}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  >
                    <option value="active">Active (Usable)</option>
                    <option value="disabled">Disabled (Draft)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                  Description / Offer Banner Text
                </label>
                <input
                  type="text"
                  placeholder="e.g. Flat 15% off on orders above ₹499"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              {/* Discount Type & Value */}
              <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200/60 space-y-4">
                <span className="text-xs font-bold text-amber-900 uppercase tracking-wider block">
                  Discount Value & Type
                </span>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">Discount Mode</label>
                    <div className="flex bg-white p-1 border border-stone-200 rounded-xl gap-0.5">
                      <button
                        type="button"
                        onClick={() => setDiscountType('percentage')}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg flex items-center justify-center gap-1 transition-all ${
                          discountType === 'percentage'
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'text-stone-600 hover:text-stone-900'
                        }`}
                      >
                        <Percent className="w-3.5 h-3.5" />
                        <span>% Off</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDiscountType('fixed')}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg flex items-center justify-center gap-1 transition-all ${
                          discountType === 'fixed'
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'text-stone-600 hover:text-stone-900'
                        }`}
                      >
                        <DollarSign className="w-3.5 h-3.5" />
                        <span>₹ Flat</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDiscountType('free_shipping')}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg flex items-center justify-center gap-1 transition-all ${
                          discountType === 'free_shipping'
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'text-stone-600 hover:text-stone-900'
                        }`}
                      >
                        <span>Free Ship</span>
                      </button>
                    </div>
                  </div>

                  {discountType !== 'free_shipping' && (
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        {discountType === 'percentage' ? 'Percentage Off (%)' : 'Amount Off (₹)'}
                      </label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={discountValue}
                        onChange={(e) => setDiscountValue(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-sm font-bold focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  )}

                  {discountType === 'percentage' && (
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">Max Discount Cap (₹)</label>
                      <input
                        type="number"
                        min="0"
                        placeholder="e.g. 500"
                        value={maxDiscount || ''}
                        onChange={(e) => setMaxDiscount(e.target.value ? Number(e.target.value) : undefined)}
                        className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Detailed Eligibility & Criteria Controls */}
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-4">
                <span className="text-xs font-bold text-stone-800 uppercase tracking-wider block">
                  Eligibility Criteria & Order Rules
                </span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* First Time User Only Toggle */}
                  <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-stone-200">
                    <div>
                      <label className="block text-xs font-bold text-stone-800">First-Time Customers Only</label>
                      <p className="text-[11px] text-stone-500">Only valid on user's first order on store</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={firstTimeUserOnly}
                      onChange={(e) => setFirstTimeUserOnly(e.target.checked)}
                      className="w-5 h-5 accent-amber-600 rounded cursor-pointer"
                    />
                  </div>

                  {/* Payment Method Eligibility */}
                  <div className="p-3 bg-white rounded-xl border border-stone-200 space-y-1">
                    <label className="block text-xs font-bold text-stone-800">Payment Method Restriction</label>
                    <select
                      value={paymentMethodRestriction}
                      onChange={(e) => setPaymentMethodRestriction(e.target.value as any)}
                      className="w-full text-xs font-semibold px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-amber-500"
                    >
                      <option value="all">All Payment Methods (Prepaid & COD)</option>
                      <option value="online">Prepaid Online Payments Only (UPI/Card)</option>
                      <option value="cod">Cash on Delivery (COD) Only</option>
                    </select>
                  </div>

                  {/* Minimum Item Quantity */}
                  <div className="p-3 bg-white rounded-xl border border-stone-200 space-y-1">
                    <label className="block text-xs font-bold text-stone-800">Min. Total Items in Cart</label>
                    <input
                      type="number"
                      min="1"
                      placeholder="e.g. 2 items required"
                      value={minItemQuantity || ''}
                      onChange={(e) => setMinItemQuantity(e.target.value ? Number(e.target.value) : undefined)}
                      className="w-full text-xs font-medium px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Usage Limit Per User */}
                  <div className="p-3 bg-white rounded-xl border border-stone-200 space-y-1">
                    <label className="block text-xs font-bold text-stone-800">Usage Limit Per User</label>
                    <input
                      type="number"
                      min="1"
                      placeholder="Default 1 per user"
                      value={usageLimitPerUser || ''}
                      onChange={(e) => setUsageLimitPerUser(e.target.value ? Number(e.target.value) : undefined)}
                      className="w-full text-xs font-medium px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Auto-Apply Checkbox & Title Section */}
              <div className="p-4 bg-amber-50/80 rounded-2xl border border-amber-200 space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAutoApply}
                    onChange={(e) => setIsAutoApply(e.target.checked)}
                    className="mt-1 w-4 h-4 text-amber-600 border-amber-300 rounded focus:ring-amber-500"
                  />
                  <div>
                    <span className="text-sm font-bold text-amber-950 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-600" />
                      Auto-Apply Coupon Automatically at Checkout
                    </span>
                    <p className="text-xs text-amber-800/80 mt-0.5">
                      When checked, this coupon will be automatically applied to eligible customer carts without requiring them to enter a code manually!
                    </p>
                  </div>
                </label>

                {isAutoApply && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="pt-2 border-t border-amber-200/60 space-y-2"
                  >
                    <label className="block text-xs font-bold uppercase tracking-wider text-amber-900">
                      Auto-Apply Campaign / Offer Title *
                    </label>
                    <input
                      type="text"
                      value={autoApplyTitle}
                      onChange={(e) => setAutoApplyTitle(e.target.value)}
                      placeholder="e.g. Independence Day Offer"
                      className="w-full px-3.5 py-2 bg-white border border-amber-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 font-medium text-stone-900"
                    />
                    <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] text-amber-800">
                      <span className="font-semibold">Quick Title Presets:</span>
                      {['Independence Day Offer', 'Monsoon Festival Offer', 'Festive Offer', 'Grand Jalgaon Deal'].map((preset) => (
                        <button
                          type="button"
                          key={preset}
                          onClick={() => setAutoApplyTitle(preset)}
                          className="px-2 py-0.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-md font-medium text-[11px] border border-amber-300/60 transition-colors"
                        >
                          + {preset}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Order Thresholds & Limits */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                    Min. Order Subtotal (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0 for no minimum"
                    value={minOrderAmount || ''}
                    onChange={(e) => setMinOrderAmount(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                    Global Usage Limit (Total Redemptions)
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Unlimited"
                    value={usageLimit || ''}
                    onChange={(e) => setUsageLimit(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Start Date & Expiry Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Category Restrictions */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                  Applicable Categories (Optional)
                </label>
                <div className="flex flex-wrap gap-2 p-3 bg-stone-50 rounded-xl border border-stone-200 max-h-32 overflow-y-auto">
                  {categories.map((cat) => {
                    const selected = applicableCategories.includes(cat.id);
                    return (
                      <button
                        type="button"
                        key={cat.id}
                        onClick={() => {
                          if (selected) {
                            setApplicableCategories(applicableCategories.filter((c) => c !== cat.id));
                          } else {
                            setApplicableCategories([...applicableCategories, cat.id]);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                          selected
                            ? 'bg-amber-600 text-white border-amber-700 shadow-2xs'
                            : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        <Tag className="w-3.5 h-3.5" />
                        <span>{cat.name}</span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-stone-400 mt-1">If none selected, coupon applies store-wide across all categories.</p>
              </div>

              <div className="pt-4 border-t border-stone-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 border border-stone-300 rounded-xl font-semibold text-stone-700 text-sm hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#9B111E] text-white hover:bg-[#800A14] rounded-xl font-bold text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{editingCoupon ? 'Update Coupon' : 'Create Coupon'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </AdminLayout>
    </ErrorBoundary>
  );
}
