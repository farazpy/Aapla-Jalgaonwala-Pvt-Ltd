'use client';

import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import {
  Banknote,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Save,
  CreditCard,
  Percent,
  IndianRupee,
  HelpCircle,
  Sparkles,
  Info,
  RefreshCw,
  ShoppingBag
} from 'lucide-react';

export default function AdminCodSettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State for COD
  const [enableCod, setEnableCod] = useState(true);
  const [codAdvanceFeeEnabled, setCodAdvanceFeeEnabled] = useState(true);
  const [codAdvanceFeeType, setCodAdvanceFeeType] = useState<'fixed' | 'percentage'>('fixed');
  const [codAdvanceFeeAmount, setCodAdvanceFeeAmount] = useState<number>(50);
  const [codAdvanceFeeTitle, setCodAdvanceFeeTitle] = useState('COD Confirmation Deposit');
  const [codAdvanceFeeDescription, setCodAdvanceFeeDescription] = useState(
    'A small deposit is required to confirm Cash on Delivery orders and protect against fake/unclaimed shipments. The remaining balance is payable in cash upon delivery.'
  );

  // Load existing settings
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/settings');
      const json = await res.json();
      if (json.success && json.data) {
        const d = json.data;
        if (d.enableCod !== undefined) setEnableCod(Boolean(d.enableCod));
        if (d.codAdvanceFeeEnabled !== undefined) setCodAdvanceFeeEnabled(Boolean(d.codAdvanceFeeEnabled));
        if (d.codAdvanceFeeType) setCodAdvanceFeeType(d.codAdvanceFeeType);
        if (d.codAdvanceFeeAmount !== undefined) setCodAdvanceFeeAmount(Number(d.codAdvanceFeeAmount));
        if (d.codAdvanceFeeTitle) setCodAdvanceFeeTitle(d.codAdvanceFeeTitle);
        if (d.codAdvanceFeeDescription) setCodAdvanceFeeDescription(d.codAdvanceFeeDescription);
      }
    } catch (err) {
      console.error('Failed to fetch COD settings:', err);
      setErrorMessage('Failed to load current settings from server.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    setErrorMessage(null);

    try {
      const authToken = localStorage.getItem('ajw_auth_token') || localStorage.getItem('token') || '';

      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
        },
        body: JSON.stringify({
          enableCod,
          codAdvanceFeeEnabled,
          codAdvanceFeeType,
          codAdvanceFeeAmount,
          codAdvanceFeeTitle,
          codAdvanceFeeDescription
        })
      });

      const json = await res.json();
      if (json.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 4000);
      } else {
        throw new Error(json.error?.message || json.message || 'Failed to save settings.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  // Live preview calculation for a sample ₹500 order
  const sampleOrderTotal = 500;
  const calculatedSampleFee = codAdvanceFeeType === 'percentage'
    ? Math.round((sampleOrderTotal * codAdvanceFeeAmount) / 100)
    : Math.min(codAdvanceFeeAmount, sampleOrderTotal);
  const sampleRemaining = sampleOrderTotal - calculatedSampleFee;

  return (
    <AdminLayout
      pageTitle="COD Advance Fee Manager"
      breadcrumbs={[
        { label: 'Admin Dashboard', href: '/admin' },
        { label: 'COD Settings' }
      ]}
      actions={
        <button
          onClick={handleSave}
          disabled={isSaving || isLoading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#9B111E] text-white font-bold text-xs rounded-xl shadow-xs hover:bg-[#800A14] disabled:opacity-50 transition-all cursor-pointer"
        >
          {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 text-amber-300" />}
          <span>{isSaving ? 'Saving...' : 'Save Configuration'}</span>
        </button>
      }
    >
      <div className="max-w-5xl space-y-8">
        {/* Banner */}
        <div className="p-6 bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 text-white rounded-3xl border border-stone-700 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Fake Order Prevention Engine</span>
            </div>
            <h2 className="text-xl font-black tracking-tight">Manage Cash on Delivery (COD) & Advance Fee</h2>
            <p className="text-xs text-stone-300 leading-relaxed">
              Enable or disable Cash on Delivery store-wide to keep only Razorpay gateway. When COD is active, you can optionally require a partial advance fee online to protect against unclaimed shipments.
            </p>
          </div>
          <div className="bg-stone-800/80 p-4 rounded-2xl border border-stone-700 shrink-0 text-center min-w-[200px]">
            <div className="text-[10px] text-stone-400 uppercase font-bold">Current Status</div>
            {!enableCod ? (
              <div className="text-sm font-black mt-1 flex items-center justify-center gap-1.5 text-rose-400">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                COD Disabled (Razorpay Only)
              </div>
            ) : (
              <div className={`text-sm font-black mt-1 flex items-center justify-center gap-1.5 ${codAdvanceFeeEnabled ? 'text-emerald-400' : 'text-amber-400'}`}>
                <span className={`w-2.5 h-2.5 rounded-full ${codAdvanceFeeEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                {codAdvanceFeeEnabled ? 'Active (Advance Fee)' : 'Active (Standard COD)'}
              </div>
            )}
          </div>
        </div>

        {/* Status Messages */}
        {saveSuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-bold flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>Payment and COD settings saved successfully! All checkout pages updated immediately.</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-900 rounded-2xl text-xs font-bold flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Configuration Grid */}
        <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Form Controls (7 cols) */}
          <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-6">
            <h3 className="font-bold text-sm text-stone-900 pb-3 border-b border-stone-100 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Banknote className="w-4 h-4 text-[#9B111E]" />
                <span>Cash on Delivery Gateway Settings</span>
              </span>
              <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                enableCod ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}>
                {enableCod ? 'COD Active' : 'COD Disabled (Razorpay Only)'}
              </span>
            </h3>

            {/* Master COD Switch: Enable/Disable COD completely */}
            <div className={`p-4 rounded-2xl border transition-all ${
              enableCod ? 'bg-emerald-50/50 border-emerald-200' : 'bg-rose-50/70 border-rose-200'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-black text-stone-900 block">
                    Enable Cash on Delivery (COD)
                  </label>
                  <p className="text-[11px] text-stone-600 mt-0.5">
                    {enableCod
                      ? 'Customers can select Cash on Delivery as a payment option during checkout.'
                      : 'Disabled: COD is completely hidden at checkout. Customers can only pay online via Razorpay.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEnableCod(!enableCod)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    enableCod ? 'bg-[#9B111E]' : 'bg-stone-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      enableCod ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {!enableCod && (
                <div className="mt-3 p-3 bg-white/80 border border-rose-200 rounded-xl text-[11px] font-bold text-rose-900 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Razorpay Online Payment is currently the sole active gateway for all customer checkouts.</span>
                </div>
              )}
            </div>

            {/* Enable Toggle Switch for Partial Advance Deposit */}
            <div className={`space-y-6 ${!enableCod ? 'opacity-40 pointer-events-none' : ''}`}>
            <div className="flex items-center justify-between p-4 bg-stone-50 rounded-2xl border border-stone-200">
              <div>
                <label className="text-xs font-extrabold text-stone-900 block">Require Advance Deposit for COD</label>
                <p className="text-[11px] text-stone-500 mt-0.5">When active, customer must pay partial deposit online before COD order is placed.</p>
              </div>
              <button
                type="button"
                disabled={!enableCod}
                onClick={() => setCodAdvanceFeeEnabled(!codAdvanceFeeEnabled)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  codAdvanceFeeEnabled ? 'bg-[#9B111E]' : 'bg-stone-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    codAdvanceFeeEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Fee Calculation Mode */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-2">Calculation Method</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setCodAdvanceFeeType('fixed')}
                  className={`p-3.5 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                    codAdvanceFeeType === 'fixed'
                      ? 'border-[#9B111E] bg-red-50/50 text-[#9B111E] font-bold shadow-xs'
                      : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  <div className={`p-2 rounded-xl ${codAdvanceFeeType === 'fixed' ? 'bg-[#9B111E] text-amber-300' : 'bg-stone-100 text-stone-600'}`}>
                    <IndianRupee className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-extrabold">Flat Rupee Amount</div>
                    <div className="text-[10px] text-stone-500">e.g. ₹50 or ₹100 per order</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setCodAdvanceFeeType('percentage')}
                  className={`p-3.5 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                    codAdvanceFeeType === 'percentage'
                      ? 'border-[#9B111E] bg-red-50/50 text-[#9B111E] font-bold shadow-xs'
                      : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  <div className={`p-2 rounded-xl ${codAdvanceFeeType === 'percentage' ? 'bg-[#9B111E] text-amber-300' : 'bg-stone-100 text-stone-600'}`}>
                    <Percent className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-extrabold">Percentage (%)</div>
                    <div className="text-[10px] text-stone-500">e.g. 10% of order total</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Advance Amount Input */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-2">
                {codAdvanceFeeType === 'fixed' ? 'Advance Fee Amount (₹)' : 'Advance Fee Percentage (%)'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400 font-bold text-xs">
                  {codAdvanceFeeType === 'fixed' ? '₹' : '%'}
                </div>
                <input
                  type="number"
                  min="1"
                  max={codAdvanceFeeType === 'percentage' ? 100 : 5000}
                  value={codAdvanceFeeAmount}
                  onChange={(e) => setCodAdvanceFeeAmount(Number(e.target.value))}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-stone-300 text-xs font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#9B111E]"
                  required
                />
              </div>
              <p className="text-[10px] text-stone-400 mt-1">
                {codAdvanceFeeType === 'fixed'
                  ? `Customer will pay ₹${codAdvanceFeeAmount} online, remaining balance in cash.`
                  : `Customer will pay ${codAdvanceFeeAmount}% of cart total online, remaining in cash.`}
              </p>
            </div>

            {/* Title / Label Banner */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-2">Banner Title at Checkout</label>
              <input
                type="text"
                value={codAdvanceFeeTitle}
                onChange={(e) => setCodAdvanceFeeTitle(e.target.value)}
                placeholder="e.g. COD Confirmation Deposit"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#9B111E]"
              />
            </div>

            {/* Description / Customer Explanation */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-2">Customer Explanation Text</label>
              <textarea
                rows={3}
                value={codAdvanceFeeDescription}
                onChange={(e) => setCodAdvanceFeeDescription(e.target.value)}
                className="w-full p-3 rounded-xl border border-stone-300 text-xs font-medium text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#9B111E]"
                placeholder="Explain why the advance fee is charged..."
              />
              <p className="text-[10px] text-stone-400 mt-1">Displayed on the checkout screen when Cash on Delivery is chosen.</p>
            </div>
            </div>

            <div className="pt-4 border-t border-stone-100 flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-3 bg-[#9B111E] text-white font-bold text-xs rounded-xl shadow-md hover:bg-[#800A14] disabled:opacity-50 transition-all cursor-pointer flex items-center gap-2"
              >
                {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 text-amber-300" />}
                <span>Save COD Configuration</span>
              </button>
            </div>
          </div>

          {/* Customer View Live Preview (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-stone-900 text-stone-100 p-6 rounded-3xl border border-stone-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-stone-800">
                <span className="text-xs font-extrabold uppercase text-amber-400 tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  <span>Checkout Screen Preview</span>
                </span>
                <span className="text-[10px] bg-stone-800 text-stone-400 px-2 py-0.5 rounded-full font-bold">Sample Order: ₹500</span>
              </div>

              <p className="text-xs text-stone-300">
                {enableCod
                  ? 'Here is what your customer will see when selecting Cash on Delivery (COD) during checkout:'
                  : 'Cash on Delivery is currently disabled. Here is what your customer sees on checkout:'}
              </p>

              {/* Mock Checkout Payment Card */}
              {!enableCod ? (
                <div className="bg-stone-800 p-4 rounded-2xl border border-rose-500/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full border-2 border-emerald-400 bg-emerald-400 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-stone-900" />
                      </div>
                      <span className="text-xs font-bold text-white">Online Payment (Razorpay Gateway)</span>
                    </div>
                    <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                      Sole Active Gateway
                    </span>
                  </div>
                  <div className="p-3 bg-stone-900/90 rounded-xl border border-stone-700 text-xs text-stone-300 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                      <CreditCard className="w-4 h-4" />
                      <span>Razorpay 100% Encrypted Gateway</span>
                    </div>
                    <p className="text-[11px] text-stone-400">
                      Customers pay securely using UPI (Google Pay, PhonePe, Paytm, BHIM), Credit/Debit Cards, or NetBanking. COD option is hidden from checkout.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-stone-800 p-4 rounded-2xl border border-stone-700/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full border-2 border-amber-400 bg-amber-400 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-stone-900" />
                      </div>
                      <span className="text-xs font-bold text-white">Cash on Delivery (COD)</span>
                    </div>
                    <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">
                      Advance Fee Required
                    </span>
                  </div>

                  {codAdvanceFeeEnabled ? (
                    <div className="p-3 bg-stone-900/90 rounded-xl border border-amber-500/30 text-xs space-y-2">
                      <div className="font-extrabold text-amber-300 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-amber-400" />
                        <span>{codAdvanceFeeTitle || 'COD Confirmation Deposit'}</span>
                      </div>

                      <p className="text-[11px] text-stone-300 leading-snug">
                        {codAdvanceFeeDescription || 'Pay partial deposit online via Razorpay to confirm COD.'}
                      </p>

                      <div className="pt-2 border-t border-stone-800 space-y-1.5 font-mono text-[11px]">
                        <div className="flex justify-between text-stone-400">
                          <span>Sample Cart Subtotal:</span>
                          <span>₹{sampleOrderTotal}</span>
                        </div>
                        <div className="flex justify-between text-amber-300 font-bold">
                          <span>Advance Fee (Pay Online Now):</span>
                          <span>₹{calculatedSampleFee}</span>
                        </div>
                        <div className="flex justify-between text-emerald-400 font-bold">
                          <span>Remaining Cash on Delivery:</span>
                          <span>₹{sampleRemaining}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-stone-900/50 rounded-xl border border-stone-700 text-xs text-stone-400">
                      Standard COD Enabled (No advance fee required). Full ₹500 payable in cash upon delivery.
                    </div>
                  )}
                </div>
              )}

              <div className="p-3 bg-stone-800/50 rounded-xl text-[11px] text-stone-400 flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  {!enableCod
                    ? 'All customer orders require full online payment through Razorpay before order placement is completed.'
                    : `When customer clicks 'Place Order', Razorpay popup opens for ₹${calculatedSampleFee}. Upon payment, order status is recorded in orders management.`}
                </span>
              </div>
            </div>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
