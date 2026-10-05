import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Calendar,
  IndianRupee,
  Users,
  CheckCircle2,
  Truck,
  AlertCircle,
  X,
  RefreshCw,
  Sliders,
  ShieldCheck,
  CreditCard,
  MapPin,
  PackageCheck
} from 'lucide-react';
import { BusinessPartner } from '@/types';

interface OrderSimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (count: number, total: number) => void;
  adminEmail: string;
  partnersList: BusinessPartner[];
}

export const OrderSimulationModal: React.FC<OrderSimulationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  adminEmail,
  partnersList
}) => {
  const [count, setCount] = useState<number>(3);
  const [dateMode, setDateMode] = useState<'now' | 'specific' | 'range'>('now');
  const [specificDate, setSpecificDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [dateFrom, setDateFrom] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 14);
    return d.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState<string>(() => new Date().toISOString().split('T')[0]);

  const [amountMode, setAmountMode] = useState<'random_cart' | 'target_range' | 'exact_target'>('random_cart');
  const [minAmount, setMinAmount] = useState<number>(450);
  const [maxAmount, setMaxAmount] = useState<number>(2400);
  const [targetAmount, setTargetAmount] = useState<number>(1200);

  const [statusMode, setStatusMode] = useState<'mixed' | 'delivered' | 'shipped' | 'processing' | 'pending' | 'custom'>('mixed');
  const [paymentMode, setPaymentMode] = useState<'mixed' | 'UPI' | 'Credit / Debit Card' | 'COD' | 'Net Banking'>('mixed');

  const [customDeliveredPercent, setCustomDeliveredPercent] = useState<number>(70);
  const [customShippedPercent, setCustomShippedPercent] = useState<number>(20);
  const [customCancelledPercent, setCustomCancelledPercent] = useState<number>(10);

  const [referralMode, setReferralMode] = useState<'random_partner' | 'specific_partner' | 'no_partner'>('random_partner');
  const [specificPartnerCode, setSpecificPartnerCode] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (partnersList.length > 0 && !specificPartnerCode) {
      setSpecificPartnerCode(partnersList[0].partnerCode);
    }
  }, [partnersList, specificPartnerCode]);

  if (!isOpen) return null;

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const payload = {
        count: Number(count) || 1,
        dateMode,
        specificDate: dateMode === 'specific' ? specificDate : undefined,
        dateFrom: dateMode === 'range' ? dateFrom : undefined,
        dateTo: dateMode === 'range' ? dateTo : undefined,
        amountMode,
        minAmount: amountMode === 'target_range' ? Number(minAmount) : undefined,
        maxAmount: amountMode === 'target_range' ? Number(maxAmount) : undefined,
        targetAmount: amountMode === 'exact_target' ? Number(targetAmount) : undefined,
        statusMode,
        customDeliveredPercent: Number(customDeliveredPercent),
        customShippedPercent: Number(customShippedPercent),
        customCancelledPercent: Number(customCancelledPercent),
        paymentMode,
        referralMode,
        specificPartnerCode: referralMode === 'specific_partner' ? specificPartnerCode : undefined,
        adminEmail
      };

      const res = await fetch('/api/orders/simulate', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-email': adminEmail || ''
        },
        body: JSON.stringify(payload)
      });

      const rawText = await res.text();
      let json: any = null;
      try {
        json = JSON.parse(rawText);
      } catch {
        // Not a JSON response
      }

      if (!res.ok || !json || !json.success) {
        throw new Error(json?.error?.message || json?.message || `Server returned error (${res.status})`);
      }

      const createdCount = json.data?.createdCount || count;
      const totalAmountVal = json.data?.totalAmount || 0;
      onSuccess(createdCount, totalAmountVal);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to simulate orders');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-linear-to-r from-purple-900 via-indigo-950 to-stone-900 text-white flex items-center justify-between relative overflow-hidden shrink-0">
          <div className="flex items-center gap-3.5 z-10">
            <div className="w-11 h-11 rounded-2xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300 shrink-0">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Simulate Live Shop Orders
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-400/20 text-purple-200 border border-purple-300/30">
                  Admin Panel
                </span>
              </div>
              <p className="text-xs text-purple-200/80 mt-0.5">
                Generates authentic orders using real catalog snacks, genuine Indian addresses, dates, and woman commissions.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0 z-10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSimulate} className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1 text-xs">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span className="font-semibold text-xs">{errorMsg}</span>
            </div>
          )}

          {/* Quick Info Banner */}
          <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-start gap-2.5 text-[11px] text-amber-950 font-medium">
            <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold">Database Flag Notice:</span> Each simulated order is marked with{' '}
              <code className="px-1 py-0.2 bg-amber-100/90 rounded text-amber-900 font-mono text-[10px]">is_fake = 1</code> in
              the database. They seamlessly blend into admin views like authentic orders without test tags.
            </div>
          </div>

          {/* 1. Order Count */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-stone-900 uppercase tracking-wider">
                1. Number of Orders to Create (Max 1,000)
              </label>
              <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                Selected: {count.toLocaleString('en-IN')} {count === 1 ? 'Order' : 'Orders'}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {[1, 5, 20, 50, 100, 250, 500, 1000].map((num) => (
                <button
                  type="button"
                  key={num}
                  onClick={() => setCount(num)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    count === num
                      ? 'bg-purple-700 text-white shadow-xs'
                      : 'bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200'
                  }`}
                >
                  {num}
                </button>
              ))}
              <div className="flex items-center gap-1.5 ml-auto">
                <span className="text-[11px] text-stone-500 font-medium">Custom:</span>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={count}
                  onChange={(e) => setCount(Math.max(1, Math.min(1000, parseInt(e.target.value) || 1)))}
                  className="w-24 px-2.5 py-1.5 rounded-lg border border-stone-300 text-xs font-bold text-center text-stone-900 focus:outline-purple-600"
                  placeholder="1 - 1000"
                />
              </div>
            </div>
          </div>

          {/* 2. Order Date Placement */}
          <div className="space-y-2 pt-1 border-t border-stone-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-purple-700" />
                <span>2. Order Date & Time</span>
              </label>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'now', label: 'Current Time' },
                { id: 'specific', label: 'Specific Date' },
                { id: 'range', label: 'Date Range' }
              ].map((opt) => (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => setDateMode(opt.id as any)}
                  className={`p-2.5 rounded-xl border text-center font-bold text-xs transition-all cursor-pointer ${
                    dateMode === opt.id
                      ? 'bg-purple-50 border-purple-400 text-purple-900 shadow-2xs'
                      : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {dateMode === 'specific' && (
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <label className="block text-[11px] font-bold text-stone-700 mb-1">Pick Date</label>
                <input
                  type="date"
                  value={specificDate}
                  onChange={(e) => setSpecificDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs font-bold text-stone-800"
                />
              </div>
            )}

            {dateMode === 'range' && (
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">From Date</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs font-bold text-stone-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">To Date</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs font-bold text-stone-800"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 3. Pricing & Amount */}
          <div className="space-y-2 pt-1 border-t border-stone-100">
            <label className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
              <IndianRupee className="w-3.5 h-3.5 text-purple-700" />
              <span>3. Order Amount Preference</span>
            </label>

            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'random_cart', label: 'Random Real Cart' },
                { id: 'target_range', label: 'Amount Range' },
                { id: 'exact_target', label: 'Target Amount' }
              ].map((opt) => (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => setAmountMode(opt.id as any)}
                  className={`p-2.5 rounded-xl border text-center font-bold text-xs transition-all cursor-pointer ${
                    amountMode === opt.id
                      ? 'bg-purple-50 border-purple-400 text-purple-900 shadow-2xs'
                      : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {amountMode === 'target_range' && (
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">Min Amount (₹)</label>
                  <input
                    type="number"
                    min="100"
                    step="50"
                    value={minAmount}
                    onChange={(e) => setMinAmount(Math.max(100, Number(e.target.value)))}
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs font-bold text-stone-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">Max Amount (₹)</label>
                  <input
                    type="number"
                    min="200"
                    step="50"
                    value={maxAmount}
                    onChange={(e) => setMaxAmount(Math.max(minAmount + 50, Number(e.target.value)))}
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs font-bold text-stone-800"
                  />
                </div>
              </div>
            )}

            {amountMode === 'exact_target' && (
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <label className="block text-[11px] font-bold text-stone-700 mb-1">Approx. Target Amount (₹)</label>
                <input
                  type="number"
                  min="200"
                  step="50"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(Math.max(100, Number(e.target.value)))}
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs font-bold text-stone-800"
                  placeholder="e.g. 1200"
                />
              </div>
            )}
          </div>

          {/* 4. Woman Partner Referral & Commission */}
          <div className="space-y-2 pt-1 border-t border-stone-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-rose-600" />
                <span>4. Woman Business Partner Referral & Commission</span>
              </label>
              <span className="text-[10px] text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                12% Commission
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'random_partner', label: 'Random Active Woman' },
                { id: 'specific_partner', label: 'Specific Woman' },
                { id: 'no_partner', label: 'Direct Order (None)' }
              ].map((opt) => (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => setReferralMode(opt.id as any)}
                  className={`p-2.5 rounded-xl border text-center font-bold text-xs transition-all cursor-pointer ${
                    referralMode === opt.id
                      ? 'bg-rose-50 border-rose-400 text-rose-900 shadow-2xs'
                      : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {referralMode === 'specific_partner' && (
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  Select Woman Partner ({partnersList.length} registered)
                </label>
                <select
                  value={specificPartnerCode}
                  onChange={(e) => setSpecificPartnerCode(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs font-bold text-stone-800"
                >
                  {partnersList.map((p) => (
                    <option key={p.id} value={p.partnerCode}>
                      {p.partnerCode} — {p.fullName} ({p.city || 'Maharashtra'})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* 5. Status & Payment Method */}
          <div className="space-y-2 pt-1 border-t border-stone-100">
            <label className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-purple-700" />
              <span>5. Status & Payment</span>
            </label>

             <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-stone-600 mb-1">Fulfillment Status</label>
                <select
                  value={statusMode}
                  onChange={(e) => setStatusMode(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs font-bold text-stone-800"
                >
                  <option value="mixed">Mixed (55% Delivered, 25% Shipped, 20% Processing)</option>
                  <option value="delivered">Delivered (With Real DTDC AWB & Paid Status)</option>
                  <option value="shipped">Shipped (In-Transit DTDC)</option>
                  <option value="processing">Processing</option>
                  <option value="pending">Pending</option>
                  <option value="custom">Custom Percentages...</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-600 mb-1">Payment Method</label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs font-bold text-stone-800"
                >
                  <option value="mixed">Mixed (UPI / COD / Cards)</option>
                  <option value="UPI">UPI (Google Pay, PhonePe, Paytm)</option>
                  <option value="COD">Cash on Delivery (COD)</option>
                  <option value="Credit / Debit Card">Credit / Debit Card</option>
                  <option value="Net Banking">Net Banking</option>
                </select>
              </div>

              {(statusMode === 'custom' || statusMode === 'mixed') && (
                <div className="sm:col-span-2 grid grid-cols-3 gap-2 bg-purple-50/40 p-3 rounded-xl border border-purple-200/50">
                  <div>
                    <label className="block text-[10px] font-bold text-purple-900 mb-1 uppercase tracking-wider">Delivered %</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={customDeliveredPercent}
                      onChange={(e) => setCustomDeliveredPercent(Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
                      className="w-full px-2 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-bold text-stone-800 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-purple-900 mb-1 uppercase tracking-wider">Shipped %</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={customShippedPercent}
                      onChange={(e) => setCustomShippedPercent(Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
                      className="w-full px-2 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-bold text-stone-800 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-purple-900 mb-1 uppercase tracking-wider">Cancelled %</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={customCancelledPercent}
                      onChange={(e) => setCustomCancelledPercent(Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
                      className="w-full px-2 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-bold text-stone-800 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                  <span className="col-span-3 text-[9px] text-purple-700/80 font-bold block">
                    * Set custom percentages for Delivered, Shipped, and Cancelled orders (sum relative to 100%).
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 6. Indian Address & Shop Verification Note */}
          <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 flex items-center justify-between text-[11px] text-stone-600">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>Indian Address Engine:</strong> Genuine names, mobile numbers &amp; pin codes (Maharashtra &amp; Indian metros)
              </span>
            </div>
            <PackageCheck className="w-4 h-4 text-purple-600 shrink-0" />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 font-bold text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Generating Authentic Orders...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Generate {count} Simulated Order{count > 1 ? 's' : ''}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
