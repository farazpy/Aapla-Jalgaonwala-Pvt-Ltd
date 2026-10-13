'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Wallet, 
  CheckCircle2, 
  Clock, 
  Search, 
  Filter, 
  RefreshCw, 
  ArrowUpRight, 
  Copy, 
  Check, 
  Phone, 
  Mail, 
  ChevronRight, 
  ChevronDown, 
  ExternalLink, 
  IndianRupee, 
  FileText, 
  AlertCircle, 
  Truck, 
  ShieldCheck, 
  X, 
  Send, 
  Gift, 
  Calendar, 
  CreditCard, 
  TrendingUp, 
  Eye, 
  Download, 
  Share2, 
  Sparkles,
  Building2,
  DollarSign
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { BusinessPartner, PartnerOrderReferral, PartnerSettlement } from '@/types';

type FilterTab = 'all' | 'pending' | 'settled' | 'transit' | 'referrals';
type SortOption = 'pending_desc' | 'earned_desc' | 'orders_desc' | 'referrals_desc' | 'name_asc';

export function AdminWomanFeesPage() {
  const [partners, setPartners] = useState<BusinessPartner[]>([]);
  const [referrals, setReferrals] = useState<PartnerOrderReferral[]>([]);
  const [settlements, setSettlements] = useState<PartnerSettlement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState<FilterTab>('all');
  const [selectedPartnerCode, setSelectedPartnerCode] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('pending_desc');

  // Drilldown Drawer / Detail Modal
  const [inspectPartner, setInspectPartner] = useState<BusinessPartner | null>(null);
  const [detailTab, setDetailTab] = useState<'orders' | 'referrals' | 'payouts' | 'summary'>('orders');

  // Settlement / Payment Modal
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payTargetPartner, setPayTargetPartner] = useState<BusinessPartner | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<'PhonePe' | 'Google Pay' | 'UPI' | 'Bank Transfer' | 'Cash'>('PhonePe');
  const [payTxnRef, setPayTxnRef] = useState('');
  const [payNotes, setPayNotes] = useState('');
  const [isSubmittingPay, setIsSubmittingPay] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const copyToClipboard = (text: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showToast(`Copied "${text}" to clipboard`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Fetch all partner, referral, and settlement records
  const loadData = async (silent = false): Promise<{ partners?: BusinessPartner[]; referrals?: PartnerOrderReferral[]; settlements?: PartnerSettlement[] }> => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const [pRes, rRes, sRes] = await Promise.all([
        fetch(`/api/partner-program/partners?t=${Date.now()}`).then(r => r.json()).catch(() => ({ success: false })),
        fetch(`/api/partner-program/referrals?t=${Date.now()}`).then(r => r.json()).catch(() => ({ success: false })),
        fetch(`/api/partner-program/settlements?t=${Date.now()}`).then(r => r.json()).catch(() => ({ success: false }))
      ]);

      let loadedPartners: BusinessPartner[] = [];
      let loadedReferrals: PartnerOrderReferral[] = [];
      let loadedSettlements: PartnerSettlement[] = [];

      if (pRes.success && Array.isArray(pRes.data)) {
        loadedPartners = pRes.data;
        setPartners(pRes.data);
      }
      if (rRes.success && Array.isArray(rRes.data)) {
        loadedReferrals = rRes.data;
        setReferrals(rRes.data);
      }
      if (sRes.success && Array.isArray(sRes.data)) {
        loadedSettlements = sRes.data;
        setSettlements(sRes.data);
      }

      return { partners: loadedPartners, referrals: loadedReferrals, settlements: loadedSettlements };
    } catch (err) {
      console.error('Failed to load woman fees data:', err);
      showToast('Error loading fees ledger');
      return {};
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Map referrals by partner code for instant drill-down and stats
  const referralsByPartnerCode = useMemo(() => {
    const map = new Map<string, PartnerOrderReferral[]>();
    for (const r of referrals) {
      const code = (r.partnerCode || '').trim().toUpperCase();
      if (!map.has(code)) map.set(code, []);
      map.get(code)!.push(r);
    }
    return map;
  }, [referrals]);

  // Map settlements by partner code
  const settlementsByPartnerCode = useMemo(() => {
    const map = new Map<string, PartnerSettlement[]>();
    for (const s of settlements) {
      const code = (s.partnerCode || '').trim().toUpperCase();
      if (!map.has(code)) map.set(code, []);
      map.get(code)!.push(s);
    }
    return map;
  }, [settlements]);

  // Overall Financial Totals
  const overallMetrics = useMemo(() => {
    let totalPayableNow = 0;
    let totalPaidSoFar = 0;
    let totalPendingDelivery = 0;
    let totalReferralBonuses = 0;
    let totalOrdersCount = 0;
    let totalSalesVolume = 0;
    let womenWithPendingCount = 0;

    for (const p of partners) {
      const pending = Number(p.pendingCommission || 0);
      const paid = Number(p.totalCommissionPaid || 0);
      const onHold = Number(p.onHoldCommission || 0);
      const bonus = Number(p.referralBonusEarned || 0);
      const sales = Number(p.totalSalesAmount || 0);
      const orders = Number(p.totalOrdersCount || 0);

      totalPayableNow += pending;
      totalPaidSoFar += paid;
      totalPendingDelivery += onHold;
      totalReferralBonuses += bonus;
      totalSalesVolume += sales;
      totalOrdersCount += orders;

      if (pending > 0) {
        womenWithPendingCount++;
      }
    }

    return {
      totalPayableNow,
      totalPaidSoFar,
      totalPendingDelivery,
      totalReferralBonuses,
      totalOrdersCount,
      totalSalesVolume,
      womenWithPendingCount
    };
  }, [partners]);

  // Filter & Sort Partners
  const filteredPartners = useMemo(() => {
    return partners
      .filter((p) => {
        // Specific woman filter
        if (selectedPartnerCode !== 'all' && p.partnerCode.toUpperCase() !== selectedPartnerCode.toUpperCase()) {
          return false;
        }

        // Tab Filter
        if (selectedTab === 'pending' && (p.pendingCommission || 0) <= 0) {
          return false;
        }
        if (selectedTab === 'settled' && ((p.pendingCommission || 0) > 0 || (p.totalCommissionPaid || 0) <= 0)) {
          return false;
        }
        if (selectedTab === 'transit' && (p.onHoldCommission || 0) <= 0) {
          return false;
        }
        if (selectedTab === 'referrals' && (p.referralBonusEarned || 0) <= 0 && ((p as any).invitedPartnersCount || 0) <= 0) {
          return false;
        }

        // Text Search
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = p.fullName?.toLowerCase().includes(q);
          const matchCode = p.partnerCode?.toLowerCase().includes(q);
          const matchPhone = p.phone?.toLowerCase().includes(q);
          const matchEmail = p.email?.toLowerCase().includes(q);
          const matchCity = p.city?.toLowerCase().includes(q);
          const matchUpi = p.upiId?.toLowerCase().includes(q);
          return matchName || matchCode || matchPhone || matchEmail || matchCity || matchUpi;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'pending_desc') {
          return (b.pendingCommission || 0) - (a.pendingCommission || 0);
        }
        if (sortBy === 'earned_desc') {
          return (b.totalCommissionEarned || 0) - (a.totalCommissionEarned || 0);
        }
        if (sortBy === 'orders_desc') {
          return (b.totalOrdersCount || 0) - (a.totalOrdersCount || 0);
        }
        if (sortBy === 'referrals_desc') {
          return ((b as any).invitedPartnersCount || (b.referralBonusEarned || 0)) - ((a as any).invitedPartnersCount || (a.referralBonusEarned || 0));
        }
        if (sortBy === 'name_asc') {
          return a.fullName.localeCompare(b.fullName);
        }
        return 0;
      });
  }, [partners, selectedPartnerCode, selectedTab, searchQuery, sortBy]);

  // Open Payment Modal
  const handleOpenPayModal = (p: BusinessPartner) => {
    setPayTargetPartner(p);
    const amount = p.pendingCommission && p.pendingCommission > 0 ? p.pendingCommission : 0;
    setPayAmount(amount);
    setPayMethod('PhonePe');
    setPayTxnRef(`PAY-${Date.now().toString().slice(-6)}`);
    setPayNotes(`Weekly Commission & Referral settlement for ${p.fullName} (${p.partnerCode})`);
    setIsPayModalOpen(true);
  };

  // Submit Settlement to Backend
  const handleRecordSettlement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payTargetPartner) return;
    if (payAmount <= 0) {
      showToast('Please enter an amount greater than ₹0');
      return;
    }
    if (!payTxnRef.trim()) {
      showToast('Please enter a Transaction Reference / UTR');
      return;
    }

    setIsSubmittingPay(true);
    try {
      const response = await fetch('/api/partner-program/settlements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partnerId: payTargetPartner.id,
          partnerCode: payTargetPartner.partnerCode,
          partnerName: payTargetPartner.fullName,
          amount: Number(payAmount),
          paymentMethod: payMethod,
          accountOrUpi: payTargetPartner.upiId || payTargetPartner.phone || '',
          transactionReference: payTxnRef.trim(),
          notes: payNotes.trim(),
          ordersCount: payTargetPartner.totalOrdersCount || 0
        })
      });

      const json = await response.json();
      if (json.success) {
        showToast(`₹${payAmount.toLocaleString('en-IN')} paid successfully to ${payTargetPartner.fullName}! Payment recorded in MySQL and email notification dispatched.`);
        setIsPayModalOpen(false);
        // Reload fresh data from backend
        const fresh = await loadData(true);
        if (inspectPartner && fresh?.partners) {
          const updated = fresh.partners.find(p => p.id === payTargetPartner.id || p.partnerCode === payTargetPartner.partnerCode);
          if (updated) setInspectPartner(updated);
        }
      } else {
        showToast(json.error || 'Failed to record settlement');
      }
    } catch (err: any) {
      showToast(err.message || 'Error executing settlement');
    } finally {
      setIsSubmittingPay(false);
    }
  };

  // Generate WhatsApp Payout Statement
  const generateWhatsAppStatement = (p: BusinessPartner) => {
    const text = `🌸 *Aapla Jalgaonwala - Women Business Partner Payout Statement* 🌸\n` +
      `------------------------------------\n` +
      `👤 *Partner:* ${p.fullName} (${p.partnerCode})\n` +
      `📍 *Location:* ${p.city}, ${p.state}\n` +
      `📱 *PhonePe/GPay:* ${p.phone || p.upiId || 'On Record'}\n\n` +
      `📊 *Performance & Commission Summary:*\n` +
      `• Total Orders Placed: ${p.totalOrdersCount || 0}\n` +
      `• Delivered & Settled Orders: ${p.deliveredOrdersCount || 0}\n` +
      `• Total Sales Volume: ₹${(p.totalSalesAmount || 0).toLocaleString('en-IN')}\n` +
      `• Total Commission Earned: ₹${(p.totalCommissionEarned || 0).toLocaleString('en-IN')}\n` +
      `• Woman Network Referrals: ₹${(p.referralBonusEarned || 0).toLocaleString('en-IN')} (${(p as any).invitedPartnersCount || 0} invited @ ₹200)\n` +
      `• Total Amount Paid to Date: ₹${(p.totalCommissionPaid || 0).toLocaleString('en-IN')}\n` +
      `------------------------------------\n` +
      `💰 *CURRENT NET PAYABLE BALANCE: ₹${(p.pendingCommission || 0).toLocaleString('en-IN')}*\n` +
      `📦 *In-Transit Delivery Orders (Pending Delivery): ₹${(p.onHoldCommission || 0).toLocaleString('en-IN')}*\n\n` +
      `🙏 _Thank you for being a valued Women Business Partner with Aapla Jalgaonwala!_`;

    const cleanPhone = (p.phone || '').replace(/[^\d]/g, '');
    const targetPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const url = `https://wa.me/${targetPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <AdminLayout 
      pageTitle="Woman Fees & Commission Management"
      breadcrumbs={[
        { label: 'Women Partners', href: '/admin/partners' },
        { label: 'Woman Fees' }
      ]}
    >
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-5 right-5 z-50 bg-stone-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-stone-700/80 text-xs font-bold flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-6 max-w-7xl mx-auto pb-16">
        {/* Top Header Card */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-stone-200/80 shadow-xs relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-200/80 rounded-full text-amber-900 text-[11px] font-extrabold uppercase tracking-wider mb-2">
                <Wallet className="w-3.5 h-3.5 text-amber-600" />
                <span>Financial Ledger & Commission Engine</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-stone-900 tracking-tight">
                Woman Fees & Commissions
              </h1>
              <p className="text-xs md:text-sm text-stone-600 max-w-2xl mt-1 leading-relaxed">
                Live authoritative tracking of delivered orders, delivery-contingent pending commissions, ₹200 network referral bonuses, and instant PhonePe / GPay settlements.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => loadData(true)}
                disabled={isRefreshing}
                className="px-4 py-2.5 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border border-stone-200"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#9B111E]' : ''}`} />
                <span>{isRefreshing ? 'Refreshing...' : 'Refresh Ledger'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Dashboard Financial KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: What Admin Has to Pay Now */}
          <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-3xl p-5 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between text-emerald-800 mb-2">
              <span className="text-xs font-extrabold uppercase tracking-wider">Payable Balance (To Pay)</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <IndianRupee className="w-4 h-4 text-emerald-700" />
              </div>
            </div>
            <div className="text-2xl md:text-3xl font-black text-emerald-950">
              ₹{overallMetrics.totalPayableNow.toLocaleString('en-IN')}
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] font-semibold text-emerald-800">
              <span>{overallMetrics.womenWithPendingCount} Women awaiting payout</span>
              <span className="font-bold underline cursor-pointer" onClick={() => setSelectedTab('pending')}>Filter</span>
            </div>
          </div>

          {/* Card 2: Total Commission Paid So Far */}
          <div className="bg-white border border-stone-200/80 rounded-3xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-stone-600 mb-2">
              <span className="text-xs font-extrabold uppercase tracking-wider">Total Paid (Settled)</span>
              <div className="w-8 h-8 rounded-xl bg-stone-100 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-stone-600" />
              </div>
            </div>
            <div className="text-2xl md:text-3xl font-black text-stone-900">
              ₹{overallMetrics.totalPaidSoFar.toLocaleString('en-IN')}
            </div>
            <div className="mt-2 text-[11px] text-stone-500 font-semibold flex items-center gap-1.5">
              <span>Across {settlements.length} settlement payouts</span>
            </div>
          </div>

          {/* Card 3: Pending Delivery (Orders In-Transit) */}
          <div className="bg-amber-50/80 border border-amber-200/80 rounded-3xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-amber-800 mb-2">
              <span className="text-xs font-extrabold uppercase tracking-wider">In-Delivery Pipeline</span>
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <Truck className="w-4 h-4 text-amber-700" />
              </div>
            </div>
            <div className="text-2xl md:text-3xl font-black text-amber-950">
              ₹{overallMetrics.totalPendingDelivery.toLocaleString('en-IN')}
            </div>
            <div className="mt-2 text-[11px] text-amber-800 font-medium">
              <span>Unlocks as orders are marked Delivered</span>
            </div>
          </div>

          {/* Card 4: Network Referral Bonuses (₹200 each) */}
          <div className="bg-indigo-50/80 border border-indigo-200/80 rounded-3xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-indigo-800 mb-2">
              <span className="text-xs font-extrabold uppercase tracking-wider">₹200 Referral Bonuses</span>
              <div className="w-8 h-8 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                <Gift className="w-4 h-4 text-indigo-700" />
              </div>
            </div>
            <div className="text-2xl md:text-3xl font-black text-indigo-950">
              ₹{overallMetrics.totalReferralBonuses.toLocaleString('en-IN')}
            </div>
            <div className="mt-2 text-[11px] text-indigo-800 font-semibold flex items-center gap-1">
              <span>Network growth bonuses earned</span>
            </div>
          </div>
        </div>

        {/* Filter Toolbar & Search Bar */}
        <div className="bg-white rounded-3xl p-4 md:p-6 border border-stone-200/80 shadow-xs space-y-4">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            {/* Search Box */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search woman by name, mobile, UPI / PhonePe, partner code, or city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-2xl text-xs font-semibold text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#9B111E]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Individual Woman Selector Dropdown */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
              <div className="w-full sm:w-64">
                <select
                  value={selectedPartnerCode}
                  onChange={(e) => setSelectedPartnerCode(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-2xl text-xs font-bold text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#9B111E]"
                >
                  <option value="all">All Women Partners ({partners.length})</option>
                  {partners.map(p => (
                    <option key={p.id} value={p.partnerCode}>
                      {p.fullName} ({p.partnerCode}) - ₹{Number(p.pendingCommission || 0)} Due
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort By Dropdown */}
              <div className="w-full sm:w-56">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-2xl text-xs font-bold text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#9B111E]"
                >
                  <option value="pending_desc">Highest Due (Pending)</option>
                  <option value="earned_desc">Highest Commission Earned</option>
                  <option value="orders_desc">Most Orders Placed</option>
                  <option value="referrals_desc">Most Network Referrals</option>
                  <option value="name_asc">Name (A to Z)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Tab Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-stone-100">
            {[
              { id: 'all', label: 'All Women', count: partners.length },
              { id: 'pending', label: 'Payout Pending (To Pay)', count: partners.filter(p => (p.pendingCommission || 0) > 0).length, highlight: true },
              { id: 'settled', label: 'Fully Settled / Paid', count: partners.filter(p => (p.pendingCommission || 0) <= 0 && (p.totalCommissionPaid || 0) > 0).length },
              { id: 'transit', label: 'Orders In Delivery', count: partners.filter(p => (p.onHoldCommission || 0) > 0).length },
              { id: 'referrals', label: '₹200 Referral Earners', count: partners.filter(p => (p.referralBonusEarned || 0) > 0 || ((p as any).invitedPartnersCount || 0) > 0).length }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedTab(tab.id as FilterTab)}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
                  selectedTab === tab.id
                    ? 'bg-[#9B111E] text-white shadow-xs'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  selectedTab === tab.id ? 'bg-white/20 text-white' : 'bg-stone-200 text-stone-700'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Master Table / List of Women Fees */}
        <div className="bg-white rounded-3xl border border-stone-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-stone-100 flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-stone-900 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#9B111E]" />
              <span>Partner Accounts & Payable Balances ({filteredPartners.length})</span>
            </h2>
          </div>

          {isLoading ? (
            <div className="py-24 text-center">
              <div className="w-8 h-8 border-3 border-[#9B111E] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs font-bold text-stone-500">Loading women fees ledger...</p>
            </div>
          ) : filteredPartners.length === 0 ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-12 h-12 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto text-stone-400">
                <Users className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-stone-800">No women partners found matching your filters</p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedTab('all');
                  setSelectedPartnerCode('all');
                }}
                className="text-xs font-bold text-[#9B111E] hover:underline"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-stone-50/80 border-b border-stone-200 text-stone-500 uppercase tracking-wider text-[10px] font-extrabold">
                    <th className="py-3.5 px-4">Woman Partner</th>
                    <th className="py-3.5 px-4">PhonePe / GPay</th>
                    <th className="py-3.5 px-4 text-center">Orders & Sales</th>
                    <th className="py-3.5 px-4 text-right">Commission (Delivered)</th>
                    <th className="py-3.5 px-4 text-right">In-Transit (Pending)</th>
                    <th className="py-3.5 px-4 text-center">₹200 Referrals</th>
                    <th className="py-3.5 px-4 text-right">Paid So Far</th>
                    <th className="py-3.5 px-4 text-right">Net Payable Now</th>
                    <th className="py-3.5 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-semibold text-stone-700">
                  {filteredPartners.map((partner) => {
                    const pendingAmount = Number(partner.pendingCommission || 0);
                    const paidAmount = Number(partner.totalCommissionPaid || 0);
                    const onHoldAmount = Number(partner.onHoldCommission || 0);
                    const deliveredComm = Number(partner.totalCommissionEarned || 0);
                    const invitedCount = (partner as any).invitedPartnersCount || (partner.invitedPartnersList?.length || 0);
                    const bonusEarned = Number(partner.referralBonusEarned || 0);
                    const paymentIdentifier = partner.phone || partner.upiId || 'Not provided';

                    return (
                      <tr key={partner.id} className="hover:bg-stone-50/60 transition-colors">
                        {/* Woman Partner Identity */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-2xl bg-amber-100 text-amber-900 font-black text-xs flex items-center justify-center shrink-0 border border-amber-200">
                              {partner.fullName.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-extrabold text-stone-900 text-xs flex items-center gap-1.5">
                                <span>{partner.fullName}</span>
                                {partner.status === 'active' && (
                                  <span className="w-2 h-2 rounded-full bg-emerald-500" title="Active Partner" />
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-stone-500">
                                <span className="font-mono font-bold bg-stone-100 px-1.5 py-0.2 rounded text-stone-700">
                                  {partner.partnerCode}
                                </span>
                                <span>• {partner.city || 'Jalgaon'}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* PhonePe / GPay Info */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-stone-800 text-[11px] font-bold">
                              {paymentIdentifier}
                            </span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(paymentIdentifier, `pay-${partner.id}`)}
                              className="p-1 hover:bg-stone-200 rounded text-stone-400 hover:text-stone-700 cursor-pointer"
                              title="Copy PhonePe / GPay number"
                            >
                              {copiedKey === `pay-${partner.id}` ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                          <span className="text-[10px] text-stone-400 block mt-0.5">
                            UPI: {partner.upiId || 'PhonePe / GPay'}
                          </span>
                        </td>

                        {/* Orders & Sales */}
                        <td className="py-4 px-4 text-center">
                          <div className="font-bold text-stone-900">
                            {partner.totalOrdersCount || 0} orders
                          </div>
                          <div className="text-[11px] text-stone-500">
                            ₹{(partner.totalSalesAmount || 0).toLocaleString('en-IN')} vol
                          </div>
                        </td>

                        {/* Commission Delivered */}
                        <td className="py-4 px-4 text-right">
                          <div className="font-bold text-stone-900">
                            ₹{deliveredComm.toLocaleString('en-IN')}
                          </div>
                          <div className="text-[10px] text-emerald-700 font-bold">
                            {partner.deliveredOrdersCount || 0} delivered
                          </div>
                        </td>

                        {/* In-Transit (Pending Delivery) */}
                        <td className="py-4 px-4 text-right">
                          {onHoldAmount > 0 ? (
                            <div>
                              <span className="font-bold text-amber-700">
                                ₹{onHoldAmount.toLocaleString('en-IN')}
                              </span>
                              <span className="text-[10px] block text-stone-400">
                                Pending delivery
                              </span>
                            </div>
                          ) : (
                            <span className="text-stone-400 font-normal">₹0</span>
                          )}
                        </td>

                        {/* ₹200 Referrals */}
                        <td className="py-4 px-4 text-center">
                          {invitedCount > 0 || bonusEarned > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-indigo-50 text-indigo-900 border border-indigo-200 text-[11px] font-bold">
                              <Gift className="w-3 h-3 text-indigo-600" />
                              <span>₹{bonusEarned > 0 ? bonusEarned : invitedCount * 200}</span>
                              <span className="text-indigo-500 font-normal">({invitedCount})</span>
                            </span>
                          ) : (
                            <span className="text-stone-400 font-normal">None</span>
                          )}
                        </td>

                        {/* Paid So Far */}
                        <td className="py-4 px-4 text-right">
                          <div className="font-bold text-stone-700">
                            ₹{paidAmount.toLocaleString('en-IN')}
                          </div>
                        </td>

                        {/* Net Payable Now */}
                        <td className="py-4 px-4 text-right">
                          {pendingAmount > 0 ? (
                            <div className="inline-block px-3 py-1 bg-emerald-100 border border-emerald-300 rounded-xl text-emerald-950 font-black text-xs">
                              ₹{pendingAmount.toLocaleString('en-IN')}
                            </div>
                          ) : (
                            <span className="inline-block px-2 py-0.5 bg-stone-100 text-stone-500 rounded-lg text-[11px] font-bold">
                              All Paid
                            </span>
                          )}
                        </td>

                        {/* Action Buttons */}
                        <td className="py-4 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Pay Button */}
                            {pendingAmount > 0 ? (
                              <button
                                type="button"
                                onClick={() => handleOpenPayModal(partner)}
                                className="px-3 py-1.5 bg-[#9B111E] hover:bg-[#800d18] text-white rounded-xl text-[11px] font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                              >
                                <span>Pay</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleOpenPayModal(partner)}
                                className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                              >
                                <span>Manual Pay</span>
                              </button>
                            )}

                            {/* View Details / Orders Drilldown */}
                            <button
                              type="button"
                              onClick={() => {
                                setInspectPartner(partner);
                                setDetailTab('orders');
                              }}
                              className="p-1.5 bg-stone-100 hover:bg-stone-200 rounded-xl text-stone-700 transition-colors cursor-pointer"
                              title="View orders placed & ledger"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {/* WhatsApp Payout Statement */}
                            <button
                              type="button"
                              onClick={() => generateWhatsAppStatement(partner)}
                              className="p-1.5 bg-emerald-50 hover:bg-emerald-100 rounded-xl text-emerald-700 transition-colors cursor-pointer"
                              title="Send WhatsApp Statement"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* DETAIL INSPECTION DRAWER / MODAL FOR SELECTED WOMAN */}
      <AnimatePresence>
        {inspectPartner && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl border border-stone-200 flex flex-col"
            >
              {/* Drawer Header */}
              <div className="p-6 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-900 font-black text-sm flex items-center justify-center border border-amber-300">
                    {inspectPartner.fullName.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-base font-black text-stone-900 flex items-center gap-2">
                      <span>{inspectPartner.fullName}</span>
                      <span className="font-mono text-xs font-bold px-2 py-0.5 bg-stone-200 text-stone-800 rounded-md">
                        {inspectPartner.partnerCode}
                      </span>
                    </h3>
                    <p className="text-xs text-stone-500 font-semibold mt-0.5">
                      PhonePe / GPay: <span className="text-stone-900 font-bold">{inspectPartner.phone || inspectPartner.upiId}</span> • {inspectPartner.city}, {inspectPartner.state}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenPayModal(inspectPartner)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <IndianRupee className="w-3.5 h-3.5" />
                    <span>Pay ₹{(inspectPartner.pendingCommission || 0).toLocaleString('en-IN')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setInspectPartner(null)}
                    className="p-2 hover:bg-stone-200 rounded-xl text-stone-500 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Sub-Tabs: Orders vs Network Referrals vs Past Settlements */}
              <div className="flex border-b border-stone-200 px-6 bg-white gap-6">
                {[
                  { id: 'orders', label: 'Referral Orders Placed' },
                  { id: 'referrals', label: `₹200 Referrals (${(inspectPartner as any).invitedPartnersCount || (inspectPartner.invitedPartnersList?.length || 0)})` },
                  { id: 'payouts', label: 'Payout History' },
                  { id: 'summary', label: 'Financial Sheet' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setDetailTab(tab.id as any)}
                    className={`py-3 text-xs font-extrabold border-b-2 transition-all cursor-pointer ${
                      detailTab === tab.id
                        ? 'border-[#9B111E] text-[#9B111E]'
                        : 'border-transparent text-stone-500 hover:text-stone-800'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Drawer Content Body */}
              <div className="p-6 overflow-y-auto flex-1 space-y-4">
                {/* TAB 1: REFERRAL ORDERS PLACED */}
                {detailTab === 'orders' && (
                  <div className="space-y-4">
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-xs text-amber-900 font-semibold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                      <span>
                        Commissions are counted as <strong>Eligible (To Pay)</strong> ONLY when the order is marked Delivered. In-transit orders remain <strong>On Hold</strong>.
                      </span>
                    </div>

                    {(() => {
                      const partnerRefs = referralsByPartnerCode.get(inspectPartner.partnerCode.toUpperCase()) || [];
                      if (partnerRefs.length === 0) {
                        return (
                          <div className="py-12 text-center text-stone-400 font-bold text-xs">
                            No orders placed under code {inspectPartner.partnerCode} yet.
                          </div>
                        );
                      }

                      return (
                        <div className="border border-stone-200 rounded-2xl overflow-hidden">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 text-[10px] font-extrabold uppercase">
                                <th className="py-2.5 px-3">Order #</th>
                                <th className="py-2.5 px-3">Date</th>
                                <th className="py-2.5 px-3">Customer</th>
                                <th className="py-2.5 px-3 text-right">Order Total</th>
                                <th className="py-2.5 px-3 text-center">Delivery Status</th>
                                <th className="py-2.5 px-3 text-right">Commission</th>
                                <th className="py-2.5 px-3 text-center">Eligibility</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-100 font-medium">
                              {partnerRefs.map((r) => {
                                const isDelivered = r.isDelivered || r.status === 'eligible' || r.status === 'settled';
                                const isCancelled = r.status === 'cancelled';
                                return (
                                  <tr key={r.id} className="hover:bg-stone-50">
                                    <td className="py-2.5 px-3 font-mono font-bold text-stone-900">
                                      {r.orderNumber || r.orderId}
                                    </td>
                                    <td className="py-2.5 px-3 text-stone-600 text-[11px]">
                                      {r.orderDate}
                                    </td>
                                    <td className="py-2.5 px-3 text-stone-800">
                                      {r.customerName} {r.customerCity ? `(${r.customerCity})` : ''}
                                    </td>
                                    <td className="py-2.5 px-3 text-right font-bold text-stone-900">
                                      ₹{(r.orderTotal || 0).toLocaleString('en-IN')}
                                    </td>
                                    <td className="py-2.5 px-3 text-center">
                                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                                        isDelivered
                                          ? 'bg-emerald-100 text-emerald-800'
                                          : isCancelled
                                          ? 'bg-rose-100 text-rose-800'
                                          : 'bg-amber-100 text-amber-800'
                                      }`}>
                                        {isDelivered ? 'Delivered' : isCancelled ? 'Cancelled' : (r.orderStatus || 'In Transit')}
                                      </span>
                                    </td>
                                    <td className="py-2.5 px-3 text-right font-bold text-stone-900">
                                      ₹{(r.partnerCommission || 0).toLocaleString('en-IN')}
                                    </td>
                                    <td className="py-2.5 px-3 text-center">
                                      {r.settlementId || r.status === 'settled' ? (
                                        <span className="text-stone-500 font-bold text-[10px] bg-stone-100 px-2 py-0.5 rounded-md">
                                          Paid
                                        </span>
                                      ) : isDelivered ? (
                                        <span className="text-emerald-700 font-black text-[10px] bg-emerald-100 px-2 py-0.5 rounded-md">
                                          Ready to Pay
                                        </span>
                                      ) : isCancelled ? (
                                        <span className="text-rose-600 font-bold text-[10px]">
                                          Void
                                        </span>
                                      ) : (
                                        <span className="text-amber-700 font-bold text-[10px] bg-amber-100 px-2 py-0.5 rounded-md">
                                          Pending Delivery
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* TAB 2: NETWORK REFERRAL BONUSES (₹200) */}
                {detailTab === 'referrals' && (
                  <div className="space-y-4">
                    <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-3 text-xs text-indigo-900 font-semibold flex items-center gap-2">
                      <Gift className="w-4 h-4 text-indigo-700 shrink-0" />
                      <span>
                        Each woman partner who registered using {inspectPartner.fullName}'s referral code awards a <strong>₹200 bonus</strong>.
                      </span>
                    </div>

                    {(() => {
                      const invitedList = (inspectPartner as any).invitedPartnersList || [];
                      if (invitedList.length === 0) {
                        return (
                          <div className="py-12 text-center text-stone-400 font-bold text-xs">
                            No woman partners have registered under {inspectPartner.partnerCode} yet.
                          </div>
                        );
                      }

                      return (
                        <div className="border border-stone-200 rounded-2xl overflow-hidden">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 text-[10px] font-extrabold uppercase">
                                <th className="py-2.5 px-3">Invited Partner</th>
                                <th className="py-2.5 px-3">Partner Code</th>
                                <th className="py-2.5 px-3">Contact</th>
                                <th className="py-2.5 px-3">Location</th>
                                <th className="py-2.5 px-3 text-center">Status</th>
                                <th className="py-2.5 px-3 text-right">Referral Bonus</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-100 font-medium">
                              {invitedList.map((inv: any) => (
                                <tr key={inv.id} className="hover:bg-stone-50">
                                  <td className="py-2.5 px-3 font-bold text-stone-900">
                                    {inv.fullName}
                                  </td>
                                  <td className="py-2.5 px-3 font-mono font-bold text-stone-700">
                                    {inv.partnerCode}
                                  </td>
                                  <td className="py-2.5 px-3 text-stone-600">
                                    {inv.phone}
                                  </td>
                                  <td className="py-2.5 px-3 text-stone-600">
                                    {inv.city}, {inv.state}
                                  </td>
                                  <td className="py-2.5 px-3 text-center">
                                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                                      {inv.status || 'Active'}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-black text-indigo-700">
                                    +₹200
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* TAB 3: SETTLEMENT / PAYOUT HISTORY */}
                {detailTab === 'payouts' && (
                  <div className="space-y-4">
                    {(() => {
                      const partnerSets = settlementsByPartnerCode.get(inspectPartner.partnerCode.toUpperCase()) || [];
                      if (partnerSets.length === 0) {
                        return (
                          <div className="py-12 text-center text-stone-400 font-bold text-xs">
                            No settlements recorded for {inspectPartner.partnerCode} yet.
                          </div>
                        );
                      }

                      return (
                        <div className="border border-stone-200 rounded-2xl overflow-hidden">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 text-[10px] font-extrabold uppercase">
                                <th className="py-2.5 px-3">Date</th>
                                <th className="py-2.5 px-3">Method</th>
                                <th className="py-2.5 px-3">UTR / Reference</th>
                                <th className="py-2.5 px-3">Notes</th>
                                <th className="py-2.5 px-3 text-right">Amount Paid</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-100 font-medium">
                              {partnerSets.map((s) => (
                                <tr key={s.id} className="hover:bg-stone-50">
                                  <td className="py-2.5 px-3 font-semibold text-stone-800">
                                    {s.settlementDate}
                                  </td>
                                  <td className="py-2.5 px-3">
                                    <span className="px-2 py-0.5 rounded-md bg-stone-100 font-bold text-stone-700 text-[10px]">
                                      {s.paymentMethod || 'PhonePe'}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3 font-mono font-bold text-stone-900">
                                    {s.transactionReference}
                                  </td>
                                  <td className="py-2.5 px-3 text-stone-500 text-[11px]">
                                    {s.notes || '-'}
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-black text-stone-900">
                                    ₹{s.amount.toLocaleString('en-IN')}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* TAB 4: FINANCIAL RECONCILIATION SHEET */}
                {detailTab === 'summary' && (
                  <div className="bg-stone-50 rounded-2xl p-5 border border-stone-200 space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-wider text-stone-800">
                      Statement of Account
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div className="bg-white p-3 rounded-xl border border-stone-200">
                        <span className="text-stone-400 block text-[10px] uppercase font-bold">Total Delivered Sales</span>
                        <span className="text-base font-black text-stone-900">
                          ₹{(inspectPartner.totalSalesAmount || 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-stone-200">
                        <span className="text-stone-400 block text-[10px] uppercase font-bold">Delivered Commission (Eligible)</span>
                        <span className="text-base font-black text-emerald-700">
                          ₹{(inspectPartner.totalCommissionEarned || 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-stone-200">
                        <span className="text-stone-400 block text-[10px] uppercase font-bold">Network Referrals (₹200 each)</span>
                        <span className="text-base font-black text-indigo-700">
                          ₹{(inspectPartner.referralBonusEarned || 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-stone-200">
                        <span className="text-stone-400 block text-[10px] uppercase font-bold">Total Paid to Date</span>
                        <span className="text-base font-black text-stone-700">
                          ₹{(inspectPartner.totalCommissionPaid || 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-black uppercase text-emerald-900 block">Current Balance Payable</span>
                        <span className="text-[11px] text-emerald-700">Ready for instant PhonePe / GPay payout</span>
                      </div>
                      <div className="text-xl font-black text-emerald-950">
                        ₹{(inspectPartner.pendingCommission || 0).toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Drawer Footer */}
              <div className="p-4 border-t border-stone-200 bg-stone-50 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => generateWhatsAppStatement(inspectPartner)}
                  className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-emerald-200"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Send WhatsApp Statement</span>
                </button>

                <button
                  type="button"
                  onClick={() => setInspectPartner(null)}
                  className="px-4 py-2 bg-stone-200 hover:bg-stone-300 rounded-xl text-stone-700 text-xs font-bold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* RECORD SETTLEMENT / PAYOUT MODAL */}
      <AnimatePresence>
        {isPayModalOpen && payTargetPartner && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-stone-200 p-6 space-y-5"
            >
              <div className="flex items-center justify-between pb-4 border-b border-stone-100">
                <div>
                  <h3 className="text-base font-black text-stone-900">
                    Settle Partner Commission
                  </h3>
                  <p className="text-xs text-stone-500 font-semibold mt-0.5">
                    Pay {payTargetPartner.fullName} ({payTargetPartner.partnerCode})
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPayModalOpen(false)}
                  className="p-1.5 hover:bg-stone-100 rounded-xl text-stone-400 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Payment Details Banner */}
              <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-amber-900">
                  <span>PhonePe / GPay / Mobile:</span>
                  <div className="flex items-center gap-1 font-mono font-black text-stone-900">
                    <span>{payTargetPartner.phone || payTargetPartner.upiId || 'N/A'}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(payTargetPartner.phone || payTargetPartner.upiId || '', 'modal-pay')}
                      className="p-1 text-amber-700 hover:text-amber-900"
                    >
                      {copiedKey === 'modal-pay' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-amber-800">
                  <span>Total Pending Balance:</span>
                  <span className="font-black text-amber-950 text-sm">₹{(payTargetPartner.pendingCommission || 0).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <form onSubmit={handleRecordSettlement} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Amount to Pay (₹)
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={payAmount}
                    onChange={(e) => setPayAmount(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-2xl bg-stone-50 border border-stone-200 text-sm font-black text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#9B111E]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Payment Mode
                    </label>
                    <select
                      value={payMethod}
                      onChange={(e) => setPayMethod(e.target.value as any)}
                      className="w-full px-3 py-2.5 rounded-2xl bg-stone-50 border border-stone-200 text-xs font-bold text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#9B111E]"
                    >
                      <option value="PhonePe">PhonePe</option>
                      <option value="Google Pay">Google Pay</option>
                      <option value="UPI">Paytm / UPI</option>
                      <option value="Bank Transfer">Bank Transfer / NEFT</option>
                      <option value="Cash">Cash Handover</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      UTR / Transaction Ref
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. UPI/4291829..."
                      value={payTxnRef}
                      onChange={(e) => setPayTxnRef(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-2xl bg-stone-50 border border-stone-200 text-xs font-mono font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#9B111E]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Settlement Notes (Optional)
                  </label>
                  <input
                    type="text"
                    value={payNotes}
                    onChange={(e) => setPayNotes(e.target.value)}
                    placeholder="Weekly payout description..."
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-stone-50 border border-stone-200 text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#9B111E]"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsPayModalOpen(false)}
                    className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingPay}
                    className="px-5 py-2.5 bg-[#9B111E] hover:bg-[#800d18] text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isSubmittingPay ? 'Recording Settlement...' : 'Confirm Payment & Settle'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}

export default AdminWomanFeesPage;
