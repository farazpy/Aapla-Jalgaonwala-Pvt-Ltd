'use client';

import React, { useState } from 'react';
import { SEO } from '@/components/seo/SEO';
import { Container } from '@/components/ui/Container';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import {
  Store,
  Send,
  CheckCircle2,
  TrendingUp,
  Award,
  Truck,
  Users,
  Sparkles,
  Coins,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  PieChart
} from 'lucide-react';

// FAQ Items Data
const FAQ_ITEMS = [
  {
    question: 'What is the minimum investment required to open an Aapla Jalgaonwala franchise?',
    answer: 'The minimum investment starts at ₹4.5 Lakhs for an Express Kiosk model (100–250 sq. ft.), which includes franchise fees, store setup, initial inventory, and launch marketing support.'
  },
  {
    question: 'Are there any recurring royalty or profit-sharing fees?',
    answer: 'No! We believe in a transparent partnership model. We charge 0% royalty fees. You earn full gross margins on all products supplied directly from our central Jalgaon facility at wholesale rates.'
  },
  {
    question: 'How long does it take to set up and launch a franchise store?',
    answer: 'From the day the MoU is signed and location feasibility is approved, it typically takes 21 to 30 days to complete store fit-outs, branding, inventory dispatch, and staff SOP training.'
  },
  {
    question: 'Do I get exclusive territorial rights for my location?',
    answer: 'Yes. Every franchisee is granted exclusive territorial rights within a defined catchment radius (typically 2 to 5 km depending on city density) to prevent store cannibalization.'
  },
  {
    question: 'How does product replenishment and supply chain work?',
    answer: 'All products are nitrogen-flushed and packaged at our central Jalgaon factory to ensure 6 to 9 months shelf life. Replenishment orders are dispatched within 24–48 hours via our dedicated logistics partners.'
  },
  {
    question: 'What support will I receive for marketing and launch?',
    answer: 'We provide end-to-end support including 3D store interior layouts, signage design, social media launch campaigns, local PR/influencer visits, promotional opening discounts, and staff training.'
  }
];

// Franchise Models Data
const FRANCHISE_MODELS = [
  {
    id: 'express',
    name: 'Express Kiosk',
    badge: 'Most Popular',
    area: '100 - 250 Sq. Ft.',
    investment: '₹4.5L - ₹7.0L',
    margin: '35% - 40%',
    roi: '10 - 12 Months',
    idealFor: 'Malls, Metro Stations, High-footfall Markets, Transit Hubs',
    features: [
      'Low capital expenditure & rapid breakeven',
      'Plug-and-play modular kiosk structure',
      'Ideal for takeaway snacks & packaged combos',
      'Minimal staff requirement (1–2 persons)'
    ]
  },
  {
    id: 'flagship',
    name: 'Flagship Experience Store',
    badge: 'High Profitability',
    area: '400 - 800 Sq. Ft.',
    investment: '₹12.0L - ₹18.0L',
    margin: '40% - 45%',
    roi: '14 - 18 Months',
    idealFor: 'High Street Main Roads, Premium Commercial Hubs, Highway Food Parks',
    features: [
      'Live banana chip frying & hot farsan counter',
      'Dine-in tasting lounge & gift combo display',
      'Maximum product range including fresh savories',
      'Staff training & operational SOP management'
    ]
  },
  {
    id: 'master',
    name: 'Distributor / Wholesale Partner',
    badge: 'Enterprise',
    area: '1,000+ Sq. Ft. Warehouse',
    investment: '₹25.0L+',
    margin: '20% - 25% (Volume)',
    roi: '12 - 15 Months',
    idealFor: 'Regional FMCG Distributors, Multi-City Super Stockists',
    features: [
      'Exclusive district-wide distribution rights',
      'Supply to retail stores, supermarkets & sweet shops',
      'Dedicated B2B account manager & field sales team support',
      'Direct factory dispatch with maximum volume discounts'
    ]
  }
];

export default function FranchisePage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
    state: 'Maharashtra',
    model: 'Express Kiosk',
    investmentBudget: '₹5 Lakh - ₹10 Lakh',
    propertyStatus: 'Rented / Leased',
    message: ''
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [selectedModelTab, setSelectedModelTab] = useState<string>('express');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          subject: `Franchise Opportunity Inquiry - ${formData.city} (${formData.model})`,
          message: `City: ${formData.city}, ${formData.state} | Model: ${formData.model} | Budget: ${formData.investmentBudget} | Property: ${formData.propertyStatus} | Notes: ${formData.message}`,
          type: 'franchise'
        })
      });

      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        setFormData({
          name: '',
          email: '',
          phone: '',
          city: '',
          state: 'Maharashtra',
          model: 'Express Kiosk',
          investmentBudget: '₹5 Lakh - ₹10 Lakh',
          propertyStatus: 'Rented / Leased',
          message: ''
        });
      } else {
        setError(data.error || 'Submission failed');
      }
    } catch (err) {
      setError('Failed to send franchise inquiry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  return (
    <div className="bg-[#FAF6ED] min-h-screen">
      <SEO
        title="Franchise Opportunity | Aapla Jalgaonwala"
        description="Become a partner with Maharashtra's premier authentic Jalgaon snacking brand. High ROI, zero royalty, and full operational support."
      />

      {/* 1. HERO SECTION */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 bg-gradient-to-b from-amber-500/10 via-[#FAF6ED] to-[#FAF6ED] overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#9B111E_1px,transparent_1px)] [background-size:24px_24px] opacity-5 pointer-events-none" />
        
        <Container size="lg" className="relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100 border border-amber-300 text-[#9B111E] font-extrabold text-xs tracking-wider uppercase shadow-xs">
              <Sparkles className="w-4 h-4 text-[#D9531E]" />
              <span>Business Opportunity 2026</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-stone-900 leading-tight tracking-tight">
              Own a Slice of <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#9B111E] via-[#D9531E] to-amber-600">Jalgaon’s Heritage</span>
            </h1>

            <p className="text-base sm:text-lg text-stone-600 font-medium leading-relaxed max-w-2xl mx-auto">
              Partner with Maharashtra’s fastest-growing authentic snacking brand. High gross margins, proven unit economics, zero royalty fees, and direct farm-fresh supply.
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
              <a
                href="#apply-form"
                className="px-8 py-4 rounded-2xl bg-[#9B111E] hover:bg-[#800A14] text-white font-extrabold text-sm shadow-lg shadow-[#9B111E]/20 hover:scale-[1.02] transition-all duration-200 flex items-center gap-2"
              >
                <span>Apply For Franchise</span>
                <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="#financials"
                className="px-8 py-4 rounded-2xl bg-white border border-stone-300 hover:border-[#9B111E] text-stone-800 hover:text-[#9B111E] font-bold text-sm shadow-xs transition-all duration-200 flex items-center gap-2"
              >
                <PieChart className="w-4 h-4 text-[#D9531E]" />
                <span>View ROI & Financials</span>
              </a>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-10">
              <div className="p-4 rounded-2xl bg-white border border-stone-200/80 shadow-xs text-center">
                <p className="text-2xl sm:text-3xl font-black text-[#9B111E]">35% - 45%</p>
                <p className="text-xs font-bold text-stone-500 mt-1">High Gross Margins</p>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-stone-200/80 shadow-xs text-center">
                <p className="text-2xl sm:text-3xl font-black text-[#D9531E]">0% Royalty</p>
                <p className="text-xs font-bold text-stone-500 mt-1">Keep All Your Profits</p>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-stone-200/80 shadow-xs text-center">
                <p className="text-2xl sm:text-3xl font-black text-amber-600">10-14 Mo.</p>
                <p className="text-xs font-bold text-stone-500 mt-1">Estimated Payback ROI</p>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-stone-200/80 shadow-xs text-center">
                <p className="text-2xl sm:text-3xl font-black text-emerald-600">30+ Years</p>
                <p className="text-xs font-bold text-stone-500 mt-1">Culinary Legacy</p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* 2. WHY PARTNER WITH US SECTION */}
      <section className="py-16 bg-white border-y border-stone-200/80">
        <Container size="lg">
          <SectionHeading
            eyebrow="The Advantage"
            title="Why Invest in Aapla Jalgaonwala?"
            subtitle="Snacking is a ₹1.3 Lakh Crore market in India. Here is why our authentic regional heritage model delivers unmatched unit economics."
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div className="p-8 rounded-3xl bg-[#FAF6ED] border border-amber-200/60 shadow-xs space-y-4 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center text-[#9B111E]">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-stone-900">Geographical Heritage</h3>
              <p className="text-sm text-stone-600 leading-relaxed font-medium">
                Our banana chips are made exclusively from Shendurni raw bananas sourced from Jalgaon, known for their distinct crispiness, flavor retention, and natural sweet aroma.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-[#FAF6ED] border border-amber-200/60 shadow-xs space-y-4 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-700">
                <Coins className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-stone-900">Zero Royalty Model</h3>
              <p className="text-sm text-stone-600 leading-relaxed font-medium">
                Unlike global food chains that charge 6% to 10% monthly sales royalties, we take ₹0 royalty. You buy stock at wholesale price and keep 100% of store profits.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-[#FAF6ED] border border-amber-200/60 shadow-xs space-y-4 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 flex items-center justify-center text-[#9B111E]">
                <Truck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-stone-900">Extended 9-Month Shelf Life</h3>
              <p className="text-sm text-stone-600 leading-relaxed font-medium">
                Our food technology uses multi-layer nitrogen flush foil packaging. Zero spoilage risk, zero inventory waste, and effortless stock management.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-[#FAF6ED] border border-amber-200/60 shadow-xs space-y-4 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-700">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-stone-900">Dedicated Training & SOPs</h3>
              <p className="text-sm text-stone-600 leading-relaxed font-medium">
                No prior food industry experience required! We provide comprehensive staff onboarding, POS billing setup, inventory management, and customer service training.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-[#FAF6ED] border border-amber-200/60 shadow-xs space-y-4 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center text-purple-700">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-stone-900">360° Marketing Engine</h3>
              <p className="text-sm text-stone-600 leading-relaxed font-medium">
                We handle hyper-local influencer campaigns, store launch flyers, Google Maps SEO, social media ads, and festive gifting combo promotions for your store.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-[#FAF6ED] border border-amber-200/60 shadow-xs space-y-4 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center text-[#D9531E]">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-stone-900">Territorial Protection</h3>
              <p className="text-sm text-stone-600 leading-relaxed font-medium">
                We ensure guaranteed exclusive operating zones around your store radius so that you never compete with another official Aapla Jalgaonwala outlet.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* 3. FRANCHISE MODELS COMPARISON SECTION */}
      <section className="py-16 md:py-24 bg-[#FAF6ED]">
        <Container size="lg">
          <SectionHeading
            eyebrow="Flexible Options"
            title="Select Your Franchise Model"
            subtitle="Choose a business model tailored to your investment budget, target location, and operational goals."
          />

          {/* Model Tabs */}
          <div className="flex justify-center my-8">
            <div className="inline-flex p-1.5 bg-stone-200/80 rounded-2xl gap-1">
              {FRANCHISE_MODELS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedModelTab(m.id)}
                  className={`px-5 py-2.5 rounded-xl font-extrabold text-xs transition-all ${
                    selectedModelTab === m.id
                      ? 'bg-[#9B111E] text-white shadow-md'
                      : 'text-stone-700 hover:text-stone-900 hover:bg-stone-300/50'
                  }`}
                >
                  {m.name}
                </button>
              ))}
            </div>
          </div>

          {/* Model Detail Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {FRANCHISE_MODELS.map((model) => {
              const isSelected = selectedModelTab === model.id;
              return (
                <div
                  key={model.id}
                  className={`relative rounded-3xl p-8 transition-all duration-300 flex flex-col justify-between bg-white border ${
                    isSelected
                      ? 'border-[#9B111E] ring-2 ring-[#9B111E]/20 shadow-xl'
                      : 'border-stone-200/80 shadow-xs hover:border-stone-300'
                  }`}
                >
                  <div>
                    {/* Badge */}
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <span className="text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full bg-amber-100 text-[#9B111E]">
                        {model.badge}
                      </span>
                      <span className="text-xs font-bold text-stone-500">{model.area}</span>
                    </div>

                    <h3 className="text-2xl font-black text-stone-900 mb-2">{model.name}</h3>
                    <p className="text-xs text-stone-500 font-medium mb-6">Ideal for: {model.idealFor}</p>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-[#FAF6ED] mb-6">
                      <div>
                        <p className="text-[11px] font-bold text-stone-500 uppercase">Investment</p>
                        <p className="text-base font-black text-[#9B111E]">{model.investment}</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-stone-500 uppercase">Margin</p>
                        <p className="text-base font-black text-emerald-700">{model.margin}</p>
                      </div>
                      <div className="col-span-2 pt-2 border-t border-stone-200/60 flex items-center justify-between">
                        <span className="text-[11px] font-bold text-stone-500 uppercase">Payback Timeline:</span>
                        <span className="text-xs font-extrabold text-stone-800">{model.roi}</span>
                      </div>
                    </div>

                    {/* Features List */}
                    <div className="space-y-3 mb-8">
                      <p className="text-xs font-black text-stone-900 uppercase tracking-wide">Key Highlights:</p>
                      {model.features.map((feat, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs font-medium text-stone-700">
                          <CheckCircle2 className="w-4 h-4 text-[#9B111E] shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <a
                    href="#apply-form"
                    onClick={() => setFormData({ ...formData, model: model.name })}
                    className={`w-full py-3.5 rounded-2xl font-extrabold text-xs text-center transition-all flex items-center justify-center gap-2 ${
                      isSelected
                        ? 'bg-[#9B111E] text-white hover:bg-[#800A14] shadow-md'
                        : 'bg-stone-100 text-stone-800 hover:bg-stone-200'
                    }`}
                  >
                    <span>Select {model.name}</span>
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              );
            })}
          </div>
        </Container>
      </section>

      {/* 4. FINANCIAL PROJECTION & ROI BREAKDOWN */}
      <section id="financials" className="py-16 bg-white border-y border-stone-200/80">
        <Container size="lg">
          <SectionHeading
            eyebrow="Financial Clarity"
            title="Sample Monthly ROI Projection (Express Kiosk)"
            subtitle="Based on average performance across existing metro outlets."
          />

          <div className="mt-12 bg-[#FAF6ED] rounded-3xl p-6 sm:p-10 border border-stone-200/80 shadow-xs max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              {/* Table side */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-stone-900 border-b border-stone-200 pb-3 flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-[#9B111E]" />
                  <span>Monthly P&L Estimates</span>
                </h3>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between py-1.5 border-b border-stone-200/60 font-medium text-stone-700">
                    <span>Average Daily Sales:</span>
                    <span className="font-bold text-stone-900">₹12,000</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-stone-200/60 font-medium text-stone-700">
                    <span>Monthly Gross Sales (30 Days):</span>
                    <span className="font-bold text-stone-900">₹3,60,000</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-stone-200/60 font-medium text-stone-700">
                    <span>Gross Profit Margin (40% Avg):</span>
                    <span className="font-bold text-emerald-700">₹1,44,000</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-stone-200/60 font-medium text-stone-500 text-xs">
                    <span>Less: Kiosk Rent (Est.):</span>
                    <span>- ₹35,000</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-stone-200/60 font-medium text-stone-500 text-xs">
                    <span>Less: Staff Salaries (2 staff):</span>
                    <span>- ₹28,000</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-stone-200/60 font-medium text-stone-500 text-xs">
                    <span>Less: Electricity & Misc Expenses:</span>
                    <span>- ₹8,000</span>
                  </div>
                  <div className="flex justify-between pt-3 font-black text-lg text-stone-900">
                    <span>Estimated Monthly Net Profit:</span>
                    <span className="text-[#9B111E]">₹73,000</span>
                  </div>
                </div>
              </div>

              {/* Highlights Card */}
              <div className="bg-gradient-to-br from-[#9B111E] to-[#D9531E] rounded-2xl p-6 text-white space-y-6 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-bold">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs uppercase font-extrabold text-amber-200 tracking-wider">Net Profitability</p>
                    <p className="text-2xl font-black">~ 20.2% Net Margin</p>
                  </div>
                </div>

                <div className="space-y-3 pt-2 border-t border-white/20 text-xs text-amber-100 font-medium leading-relaxed">
                  <p>✓ Fast Payback: Full capital recovery within 10 to 12 operating months.</p>
                  <p>✓ Festive Spikes: Sales increase up to 2.5x during Diwali, Ganpati, and wedding seasons with corporate bulk orders.</p>
                  <p>✓ Zero Wastage: All unsold inventory supported via stock rotation guidance.</p>
                </div>

                <a
                  href="#apply-form"
                  className="block w-full py-3 rounded-xl bg-white text-[#9B111E] font-extrabold text-xs text-center shadow-md hover:bg-amber-50 transition-colors"
                >
                  Request Detailed Financial Deck
                </a>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* 5. ONBOARDING TIMELINE SECTION */}
      <section className="py-16 md:py-24 bg-[#FAF6ED]">
        <Container size="lg">
          <SectionHeading
            eyebrow="The Roadmap"
            title="5 Steps to Launching Your Outlet"
            subtitle="From application submission to grand opening in 30 days."
          />

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-12">
            {[
              {
                step: '01',
                title: 'Submit Inquiry',
                desc: 'Fill out our online application form with your target location and budget.'
              },
              {
                step: '02',
                title: 'Site Feasibility',
                desc: 'Our franchise expansion team conducts a location footfall audit and approves site.'
              },
              {
                step: '03',
                title: 'MoU & Agreement',
                desc: 'Sign formal partnership agreement and finalize territorial rights.'
              },
              {
                step: '04',
                title: 'Store Fit-Out',
                desc: 'Receive 3D interior design specs, signage, POS billing machine & staff training.'
              },
              {
                step: '05',
                title: 'Grand Opening',
                desc: 'Launch with local influencer visits, sampling campaign, and social media buzz.'
              }
            ].map((st, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-xs relative flex flex-col justify-between space-y-4"
              >
                <div>
                  <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#9B111E] to-[#D9531E]">
                    {st.step}
                  </span>
                  <h4 className="text-base font-bold text-stone-900 mt-2">{st.title}</h4>
                  <p className="text-xs text-stone-500 mt-2 leading-relaxed font-medium">{st.desc}</p>
                </div>
                <div className="w-full h-1 bg-amber-100 rounded-full overflow-hidden mt-4">
                  <div className="h-full bg-[#9B111E]" style={{ width: `${(i + 1) * 20}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* 6. FAQ SECTION */}
      <section className="py-16 bg-white border-t border-stone-200/80">
        <Container size="md">
          <SectionHeading
            eyebrow="Got Questions?"
            title="Frequently Asked Questions"
            subtitle="Everything you need to know about partnering with Aapla Jalgaonwala."
          />

          <div className="mt-10 space-y-4">
            {FAQ_ITEMS.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="bg-[#FAF6ED] rounded-2xl border border-stone-200/80 overflow-hidden transition-all"
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full text-left p-5 flex items-center justify-between gap-4 font-bold text-sm text-stone-900 hover:text-[#9B111E] transition-colors"
                  >
                    <span>{faq.question}</span>
                    {isOpen ? (
                      <ChevronUp className="w-5 h-5 text-[#9B111E] shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-stone-400 shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs text-stone-600 leading-relaxed font-medium border-t border-stone-200/60">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Container>
      </section>

      {/* 7. APPLICATION FORM SECTION */}
      <section id="apply-form" className="py-16 md:py-24 bg-[#FAF6ED]">
        <Container size="md">
          <SectionHeading
            eyebrow="Apply Today"
            title="Franchise Application Form"
            subtitle="Take the first step towards building a successful food retail business. Fill in your details below."
          />

          <div className="bg-white p-6 sm:p-10 rounded-3xl border border-stone-200/80 shadow-md mt-8">
            {success ? (
              <div className="text-center py-12 space-y-4">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mx-auto">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold text-stone-900">Franchise Inquiry Received!</h3>
                <p className="text-sm text-stone-600 max-w-md mx-auto">
                  Thank you for your interest in partnering with Aapla Jalgaonwala. Our team will review your application and reach out within 24 hours.
                </p>
                <Button onClick={() => setSuccess(false)} variant="outline" size="md">
                  Submit Another Inquiry
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Input
                    label="Full Name *"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Rajesh Patil"
                  />
                  <Input
                    label="Phone Number (WhatsApp) *"
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Input
                    label="Email Address *"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="rajesh@example.com"
                  />
                  <Input
                    label="Target City / Town *"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="e.g. Pune, Nashik, Chhatrapati Sambhajinagar"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Select
                    label="Preferred Franchise Model *"
                    options={[
                      { label: 'Express Kiosk (100-250 sq. ft.)', value: 'Express Kiosk' },
                      { label: 'Flagship Experience Store (400-800 sq. ft.)', value: 'Flagship Experience Store' },
                      { label: 'Master Distributor (Regional Wholesale)', value: 'Master Distributor' }
                    ]}
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  />

                  <Select
                    label="Investment Budget Range *"
                    options={[
                      { label: '₹4.5 Lakh - ₹7 Lakh', value: '₹4.5 Lakh - ₹7 Lakh' },
                      { label: '₹7 Lakh - ₹15 Lakh', value: '₹7 Lakh - ₹15 Lakh' },
                      { label: '₹15 Lakh - ₹25 Lakh+', value: '₹15 Lakh - ₹25 Lakh+' }
                    ]}
                    value={formData.investmentBudget}
                    onChange={(e) => setFormData({ ...formData, investmentBudget: e.target.value })}
                  />
                </div>

                <Select
                  label="Property Status *"
                  options={[
                    { label: 'Rented / Leased Space Available', value: 'Rented / Leased' },
                    { label: 'Self-Owned Property', value: 'Self-Owned Property' },
                    { label: 'Currently Searching For Location', value: 'Searching For Location' }
                  ]}
                  value={formData.propertyStatus}
                  onChange={(e) => setFormData({ ...formData, propertyStatus: e.target.value })}
                />

                <Textarea
                  label="Additional Notes / Business Experience"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Tell us about your background, proposed retail market location, or target timeline..."
                />

                {error && <p className="text-xs text-red-600 font-bold">{error}</p>}

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  isLoading={loading}
                  className="w-full gap-2 rounded-2xl py-4 shadow-lg shadow-[#9B111E]/20"
                >
                  <span>Submit Official Franchise Inquiry</span>
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            )}
          </div>
        </Container>
      </section>
    </div>
  );
}
