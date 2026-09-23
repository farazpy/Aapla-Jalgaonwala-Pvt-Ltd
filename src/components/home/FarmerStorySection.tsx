'use client';

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Sprout, MapPin, Sparkles, Heart, Sun, ArrowRight, ShieldCheck, Flame, Layers, CheckCircle2 } from 'lucide-react';
import { Container } from '../ui/Container';

export const FarmerStorySection: React.FC = () => {
  const [activeStep, setActiveStep] = useState<number>(0);

  const sequenceSteps = [
    {
      num: '01',
      title: 'Jalgaon Regur Soil',
      subtitle: 'Volcanic Khandesh Terroir',
      desc: 'Known as India’s Banana Capital. The mineral-dense black volcanic soil and high-sun climate yield raw bananas with high starch density and supreme natural crisp potential.',
      tag: 'Origin: 21°00\'N 75°34\'E',
      icon: <Sun className="w-4 h-4 text-amber-600" />
    },
    {
      num: '02',
      title: 'Local Farmgate Harvest',
      subtitle: 'Fair-Trade Farmer Connection',
      desc: 'Procured within 12 hours of harvest directly from 40+ partner farming families in Yelwadi & Chopda at guaranteed fair-trade rates, completely bypassing exploitative mandi middlemen.',
      tag: 'Direct Sourcing',
      icon: <Sprout className="w-4 h-4 text-emerald-600" />
    },
    {
      num: '03',
      title: 'Handpicked Grade-A Selection',
      subtitle: 'Strict Caliber Quality',
      desc: 'Only unblemished, firm, premium green Cavendish bananas of uniform caliber are hand-selected for slicing to ensure every wafer cooks with uniform golden color.',
      tag: '100% Hand-Sorted',
      icon: <CheckCircle2 className="w-4 h-4 text-[#D9531E]" />
    },
    {
      num: '04',
      title: 'Precision Artisanal Slicing',
      subtitle: 'Small-Batch Kettle Fry',
      desc: 'Micro-calibrated circular wafer slicing dropping directly into fresh refined oil heated at precisely monitored 175°C to achieve our signature gossamer thin crispness.',
      tag: 'Kettle Cooked',
      icon: <Flame className="w-4 h-4 text-[#9B111E]" />
    },
    {
      num: '05',
      title: 'Stone-Ground Masala Toss',
      subtitle: 'Warm Drum Dusting',
      desc: 'Tossed warm inside copper drums with stone-ground Khandeshi spices, roasted rock salt, and authentic regional spice mixes that cling evenly to every chip.',
      tag: 'Stone-Ground Spices',
      icon: <Sparkles className="w-4 h-4 text-amber-500" />
    },
    {
      num: '06',
      title: 'Triple-Barrier Sealed Pack',
      subtitle: 'Farm-to-Door Delivery',
      desc: 'Immediately nitrogen-flushed and sealed in high-barrier multi-layer gold foil pouches to lock in maximum farm-fresh crunch for up to 180 days across India.',
      tag: 'Vacuum Freshness',
      icon: <ShieldCheck className="w-4 h-4 text-emerald-600" />
    }
  ];

  return (
    <section className="py-20 md:py-28 bg-[#FAF6ED] border-t border-stone-200/70 overflow-hidden relative">
      {/* Subtle Background Accent */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-amber-200/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#9B111E]/5 rounded-full blur-3xl pointer-events-none" />

      <Container>
        {/* Top Story Header */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center mb-16">
          <div className="lg:col-span-6 space-y-6">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-[#9B111E] px-3 py-1 bg-[#9B111E]/10 rounded-full border border-[#9B111E]/15">
                <MapPin className="w-3.5 h-3.5" />
                <span>Khandesh Heritage & Soil</span>
              </span>
              <span className="text-xs font-semibold text-stone-500">
                Jalgaon, Maharashtra
              </span>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-stone-900 tracking-tight leading-[1.15]">
              Honoring Jalgaon&apos;s Soil. Supporting Local Farmers.
            </h2>

            <p className="text-stone-600 text-base leading-relaxed">
              Jalgaon produces more than 16% of India’s bananas. At <strong className="text-stone-900 font-bold">Aapla Jalgaonwala</strong>, founders <strong>Saurabh Patil</strong> and <strong>Jayesh Patil</strong> built transparent farmgate partnerships directly with farming families in Yelwadi and surrounding talukas.
            </p>

            <p className="text-stone-600 text-sm leading-relaxed">
              By removing middlemen, our partner farmers receive guaranteed premium prices, while you experience genuine farm-freshness crafted within hours of harvesting.
            </p>

            {/* Direct Farm Impact Card */}
            <div className="p-5 bg-white rounded-2xl border border-stone-200/80 shadow-xs flex items-start gap-4">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200/60 text-emerald-700 flex-shrink-0">
                <Sprout className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-stone-900">Direct Farmer Fair-Price Commitment</h4>
                <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                  100% of our green bananas are procured from family-owned farms across Jalgaon, ensuring transparent livelihoods and direct community prosperity.
                </p>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-4">
              <Link to="/our-story">
                <button className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-[#9B111E] text-white font-bold text-xs uppercase tracking-wider hover:bg-[#800A14] transition-all shadow-xs hover:shadow-md">
                  <span>Read Our Full Story</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
              <Link to="/shop?category=banana-chips">
                <button className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white text-stone-800 font-bold text-xs uppercase tracking-wider border border-stone-300 hover:bg-stone-50 transition-all">
                  <span>Taste The Freshness</span>
                </button>
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6 relative">
            <div className="relative rounded-3xl overflow-hidden shadow-xl border border-stone-200/80 bg-stone-950 aspect-4/3 group">
              <img
                src="https://images.unsplash.com/photo-1599490659213-e2b9527bd087?auto=format&fit=crop&w=600&q=75"
                alt="Jalgaon Banana Farming and Crafting"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90"
                referrerPolicy="no-referrer"
                loading="lazy"
                decoding="async"
                width="600"
                height="450"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950/85 via-stone-950/30 to-transparent" />
              
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-stone-200/80 flex items-center gap-2 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] font-bold text-stone-900 tracking-wide uppercase">100% Genuine Khandesh Origin</span>
              </div>

              <div className="absolute bottom-6 left-6 right-6 text-white space-y-1.5">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-300">Yelwadi & Chopda, Jalgaon</span>
                </div>
                <h3 className="text-xl font-bold text-white">Direct Farmgate Procurement • Zero Middlemen</h3>
                <p className="text-xs text-stone-300 leading-relaxed max-w-lg">
                  Every batch of banana chips starts here, harvested in the morning sun and processed within 24 hours for unmatched crispness.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 6-Step Visual Journey: Elevated & Refined */}
        <div className="mt-16 pt-12 border-t border-stone-200/80">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-widest text-[#D9531E] px-3 py-1 bg-[#D9531E]/10 rounded-full border border-[#D9531E]/15">
              Farm-to-Packet Craftsmanship
            </span>
            <h3 className="text-2xl sm:text-3xl font-black text-stone-900 mt-2">
              The Journey of Every Chip
            </h3>
            <p className="text-xs sm:text-sm text-stone-600 mt-1.5">
              Six meticulous stages from fertile Khandeshi soil to your snack bowl
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
            {sequenceSteps.map((step, idx) => (
              <div
                key={step.num}
                onClick={() => setActiveStep(idx)}
                className={`relative bg-white p-5 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col justify-between ${
                  activeStep === idx
                    ? 'border-[#9B111E] shadow-md ring-2 ring-[#9B111E]/10 bg-linear-to-b from-white to-amber-50/40'
                    : 'border-stone-200/80 shadow-xs hover:border-[#D9531E]/40 hover:shadow-sm'
                }`}
              >
                <div>
                  {/* Step Number & Icon */}
                  <div className="flex items-center justify-between mb-3.5">
                    <span className="text-xs font-black text-[#9B111E] bg-[#9B111E]/10 px-2.5 py-1 rounded-lg">
                      {step.num}
                    </span>
                    <div className="p-1.5 rounded-lg bg-stone-100/80 border border-stone-200/60">
                      {step.icon}
                    </div>
                  </div>

                  <h4 className="text-sm font-bold text-stone-900 leading-snug mb-1">
                    {step.title}
                  </h4>
                  <p className="text-[11px] font-semibold text-[#D9531E] mb-2.5">
                    {step.subtitle}
                  </p>
                  <p className="text-xs text-stone-500 leading-relaxed font-normal">
                    {step.desc}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-[10px] font-semibold text-stone-400">
                  <span className="text-stone-600">{step.tag}</span>
                  {idx < 5 && (
                    <ArrowRight className="hidden lg:block w-3.5 h-3.5 text-stone-300" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
};
