'use client';

import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Sparkles,
  ArrowRight,
  TrendingUp,
  Percent,
  CheckCircle2,
  Users,
  ShieldCheck,
  Zap,
  Calendar,
  Gift
} from 'lucide-react';
import { Container } from '../ui/Container';
import { Button } from '../ui/Button';
import { useSettings } from '@/context/SettingsContext';

export const WomanPartnerShowcaseSection: React.FC = () => {
  const { settings } = useSettings();
  const fee = settings.womenPartnerFee ?? 699;

  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-stone-50 via-[#FAF6ED] to-white border-t border-stone-200/70 relative overflow-hidden">
      {/* Decorative Background Glows */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-96 h-96 bg-[#9B111E]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* ========================================================================= */}
          {/* LEFT COLUMN: CONTENT & ACTION CTAs */}
          {/* ========================================================================= */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-7 space-y-6 text-left"
          >
            {/* Pill Eyebrow */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-50 border border-rose-200/80 text-[#9B111E] text-xs font-bold shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-[#D9531E] animate-pulse" />
              <span>🌸 100% Work From Home • Zero Inventory Required</span>
            </div>

            {/* Headline */}
            <div className="space-y-2">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-stone-900 tracking-tight leading-[1.15] font-serif">
                Women Business <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#9B111E] via-[#B8222F] to-[#D9531E]">Partner Program</span>
              </h2>
              <p className="text-base sm:text-lg text-stone-700 leading-relaxed font-medium">
                Empower your financial independence. Earn up to <strong className="text-[#9B111E] font-bold">₹15,000 to ₹50,000+ monthly</strong> from home by recommending authentic Jalgaon banana chips, farsaan, and kitchen masalas to your network.
              </p>
            </div>

            {/* Key Value Proposition Grid (4 highlights) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              <div className="p-3.5 bg-white rounded-2xl border border-stone-200/80 shadow-2xs hover:shadow-xs transition-shadow space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-[#D9531E] flex items-center justify-center font-bold text-xs">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-stone-900 text-xs sm:text-sm">12% Direct Commission</span>
                </div>
                <p className="text-[11.5px] text-stone-600 leading-snug">
                  Earn 12% on every customer order, transferred directly to your Bank or UPI every Sunday.
                </p>
              </div>

              <div className="p-3.5 bg-white rounded-2xl border border-stone-200/80 shadow-2xs hover:shadow-xs transition-shadow space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-xs">
                    <Gift className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-stone-900 text-xs sm:text-sm">4% Customer Discount</span>
                </div>
                <p className="text-[11.5px] text-stone-600 leading-snug">
                  Your buyers automatically get an instant 4% OFF on their entire order when using your link.
                </p>
              </div>

              <div className="p-3.5 bg-white rounded-2xl border border-stone-200/80 shadow-2xs hover:shadow-xs transition-shadow space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-[#9B111E] flex items-center justify-center font-bold text-xs">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-stone-900 text-xs sm:text-sm">Zero Stock & Packaging</span>
                </div>
                <p className="text-[11.5px] text-stone-600 leading-snug">
                  No inventory needed. We handle fresh cooking, nitrogen packing, and courier delivery across India.
                </p>
              </div>

              <div className="p-3.5 bg-white rounded-2xl border border-stone-200/80 shadow-2xs hover:shadow-xs transition-shadow space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#9B111E]/10 text-[#9B111E] flex items-center justify-center font-bold text-xs">
                    <Zap className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-stone-900 text-xs sm:text-sm">Just 30 Mins Daily</span>
                </div>
                <p className="text-[11.5px] text-stone-600 leading-snug">
                  Share tempting snack videos & offers on WhatsApp status, Instagram stories, and Facebook groups.
                </p>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3.5 pt-3">
              <Link to="/partner-program">
                <Button
                  variant="primary"
                  size="lg"
                  className="rounded-2xl px-6 sm:px-8 py-3.5 bg-gradient-to-r from-[#9B111E] to-[#D9531E] hover:from-[#800A14] hover:to-[#B84014] text-white font-bold text-sm shadow-md shadow-[#9B111E]/20"
                  rightIcon={<ArrowRight className="w-4 h-4 ml-1" />}
                >
                  Register as Woman Partner (₹{fee})
                </Button>
              </Link>

              <Link to="/partner-program">
                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-2xl border-stone-300 bg-white hover:bg-stone-50 text-stone-800 text-sm font-bold shadow-2xs"
                >
                  <Users className="w-4 h-4 mr-1.5 text-[#9B111E]" />
                  <span>Partner Details & Calculator</span>
                </Button>
              </Link>
            </div>

            {/* Micro Trust Indicators */}
            <div className="flex items-center gap-4 text-xs text-stone-500 font-medium pt-1">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Instant Partner Code</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-amber-600" />
                <span>Every Sunday Settlement</span>
              </span>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-[#9B111E]" />
                <span>Official Partner Certificate</span>
              </span>
            </div>
          </motion.div>

          {/* ========================================================================= */}
          {/* RIGHT COLUMN: SHOWCASE BRAND IMAGE & FLOATING METRIC CARDS */}
          {/* ========================================================================= */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-5 relative"
          >
            {/* Main Visual Image Card */}
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-stone-900 group">
              <img
                src="https://res.cloudinary.com/xbtfj9zf/image/upload/fl_original/v1786881985/ChatGPT_Image_Aug_16_2026_05_36_11_PM.png"
                alt="Aapla Jalgaonwala Women Business Partner Program"
                className="w-full h-auto min-h-[380px] max-h-[500px] object-cover object-center group-hover:scale-105 transition-transform duration-700"
                loading="lazy"
                decoding="async"
                width="500"
                height="450"
              />
              
              {/* Subtle Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-stone-950/20 to-transparent pointer-events-none" />

              {/* Bottom Image Caption */}
              <div className="absolute bottom-0 inset-x-0 p-5 text-white space-y-1">
                <span className="inline-block px-2.5 py-0.5 rounded-md bg-[#9B111E] text-white text-[10px] font-bold uppercase tracking-wider">
                  Micro-Entrepreneurship
                </span>
                <h3 className="text-base sm:text-lg font-black text-white leading-tight">
                  Earn with Pride from Home
                </h3>
                <p className="text-xs text-stone-200 line-clamp-2">
                  Join 100+ proud women micro-entrepreneurs building independent monthly incomes with Aapla Jalgaonwala.
                </p>
              </div>
            </div>

            {/* Floating Top Badge */}
            <div className="absolute -top-4 -left-3 sm:-left-6 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-xl border border-stone-200/80 flex items-center gap-2.5 z-10">
              <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-[#D9531E] flex items-center justify-center font-black text-xs">
                <Sparkles className="w-4 h-4 text-[#D9531E]" />
              </div>
              <div>
                <span className="block text-[10px] uppercase font-bold text-stone-500 tracking-wider">Weekly Payouts</span>
                <span className="block text-xs font-black text-stone-900">Direct Sunday Bank Transfer</span>
              </div>
            </div>

            {/* Floating Bottom Badge */}
            <div className="absolute -bottom-4 -right-3 sm:-right-6 bg-stone-900/95 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-xl border border-white/10 text-white flex items-center gap-2.5 z-10">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#9B111E] to-[#D9531E] text-white flex items-center justify-center font-black text-xs">
                12%
              </div>
              <div>
                <span className="block text-[10px] uppercase font-bold text-amber-300 tracking-wider">Direct Commission</span>
                <span className="block text-xs font-bold text-white">On All Referred Orders</span>
              </div>
            </div>
          </motion.div>
        </div>
      </Container>
    </section>
  );
};
