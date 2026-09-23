'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'motion/react';
import { Sparkles, ArrowRight, Flame, ShieldCheck, Award } from 'lucide-react';
import { Button } from '../ui/Button';
import { SiteSettings } from '@/types';

interface HeroSectionProps {
  settings?: SiteSettings;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ settings: initialSettings }) => {
  const [fetchedSettings, setFetchedSettings] = useState<SiteSettings | null>(null);
  const settings = initialSettings || fetchedSettings || undefined;

  // Fetch live settings if initialSettings was not passed from server
  useEffect(() => {
    if (initialSettings) return;

    let active = true;
    fetch('/api/settings')
      .then((res) => res.json())
      .then((json) => {
        if (active && json.success && json.data) {
          setFetchedSettings(json.data);
        }
      })
      .catch((err) => console.log('HeroSection settings fetch:', err));

    return () => {
      active = false;
    };
  }, [initialSettings]);

  // Derived content with robust defaults
  const eyebrow = settings?.heroEyebrow?.trim() || 'Rooted in Tradition. Crafted for Modern Taste.';
  const title = settings?.heroTitle?.trim() || 'A Taste of Jalgaon in Every Bite.';
  const titleHighlight = settings?.heroTitleHighlight?.trim() || 'Jalgaon';
  const subtitle = settings?.heroSubtitle?.trim() || "Authentic banana chips, farsaan, masalas and regional flavours crafted for today's generation. Directly sourced from Jalgaon farms and freshly packed for pure crunch.";
  const primaryCtaText = settings?.heroPrimaryCtaText?.trim() || 'Shop Now';
  const primaryCtaLink = settings?.heroPrimaryCtaLink?.trim() || '/shop';
  const secondaryCtaText = settings?.heroSecondaryCtaText?.trim() || 'Our Story';
  const secondaryCtaLink = settings?.heroSecondaryCtaLink?.trim() || '/our-story';

  // Showcase card content
  const cardImage = settings?.heroCardImage?.trim() || 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=1000&q=80';
  const cardBadge = settings?.heroCardBadge?.trim() || 'Hero Special';
  const cardTitle = settings?.heroCardTitle?.trim() || 'Khandeshi Masala Banana Chips';
  const cardSubtitle = settings?.heroCardSubtitle?.trim() || 'Thin, crispy, and tossed in authentic regional spices';

  // Floating pill badge content
  const pillTitle = settings?.heroPillTitle?.trim() || '10 Unique Flavours';
  const pillSubtitle = settings?.heroPillSubtitle?.trim() || 'From Peri Peri to Pani Poori';
  const isPillEnabled = settings?.heroPillEnabled !== false;

  // Helper to highlight specific word in title
  const renderHighlightedTitle = () => {
    if (!titleHighlight || !title.toLowerCase().includes(titleHighlight.toLowerCase())) {
      return title;
    }
    const regex = new RegExp(`(${titleHighlight})`, 'gi');
    const parts = title.split(regex);
    return parts.map((part, index) =>
      part.toLowerCase() === titleHighlight.toLowerCase() ? (
        <span key={index} className="text-transparent bg-clip-text bg-gradient-to-r from-[#9B111E] to-[#D9531E]">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#FAF6ED] via-[#FFFDF9] to-[#FAF6ED] py-12 md:py-20 lg:py-24">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#D9531E]/10 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#9B111E]/10 rounded-full blur-3xl -z-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Text Column */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-7 space-y-6 text-left"
          >
            {/* Pill Eyebrow */}
            {eyebrow && (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-[#D9531E]" />
                <span>{eyebrow}</span>
              </div>
            )}

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-stone-900 tracking-tight leading-[1.1]">
              {renderHighlightedTitle()}
            </h1>

            {/* Supporting Copy */}
            <p className="text-base sm:text-lg text-stone-600 max-w-2xl leading-relaxed font-normal">
              {subtitle}
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link href={primaryCtaLink}>
                <Button
                  variant="primary"
                  size="lg"
                  className="rounded-2xl px-7 shadow-md"
                  rightIcon={<ArrowRight className="w-4 h-4 ml-1" />}
                >
                  {primaryCtaText}
                </Button>
              </Link>
              <Link href={secondaryCtaLink}>
                <Button variant="outline" size="lg" className="rounded-2xl border-stone-300 text-stone-800 hover:bg-stone-100">
                  {secondaryCtaText}
                </Button>
              </Link>
            </div>

            {/* Hero Quick Trust Badges */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-stone-200/80 max-w-lg">
              <div>
                <span className="block text-xl font-extrabold text-[#9B111E]">100%</span>
                <span className="text-xs text-stone-500 font-medium">Jalgaon Bananas</span>
              </div>
              <div>
                <span className="block text-xl font-extrabold text-[#D9531E]">10</span>
                <span className="text-xs text-stone-500 font-medium">Unique Flavours</span>
              </div>
              <div>
                <span className="block text-xl font-extrabold text-amber-600">Fresh</span>
                <span className="text-xs text-stone-500 font-medium">Daily Small Batches</span>
              </div>
            </div>

            {/* Quality Standard Certification Badges */}
            <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-stone-200/80 max-w-xl">
              <span className="text-[10px] font-black uppercase text-stone-400 tracking-wider block">Quality Certifications:</span>
              <div className="flex items-center gap-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50/90 text-emerald-800 border border-emerald-200/80 text-[11px] font-bold shadow-2xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Govt. Approved Quality Lab Certified</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50/90 text-blue-800 border border-blue-200/80 text-[11px] font-bold shadow-2xs">
                  <Award className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>SGS Certified Quality</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Visual Imagery Showcase */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="lg:col-span-5 relative"
          >
            <div className="relative mx-auto max-w-md lg:max-w-none pb-6 pr-4 sm:pb-8 sm:pr-6">
              {/* Main Container Card */}
              <div className="relative rounded-3xl bg-gradient-to-br from-[#FAF6ED] to-white p-3 border-2 border-amber-900/10 shadow-xl">
                <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-amber-100/50">
                  <Image
                    src={cardImage}
                    alt={cardTitle || 'Aapla Jalgaonwala Authentic Snacks'}
                    fill
                    priority
                    className="object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950/70 via-stone-950/20 to-transparent" />
                  
                  <div className="absolute bottom-4 left-4 right-4 text-white z-10">
                    {cardBadge && (
                      <span className="inline-block bg-[#D9531E] text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full mb-1">
                        {cardBadge}
                      </span>
                    )}
                    <h3 className="text-xl font-extrabold leading-snug">{cardTitle}</h3>
                    {cardSubtitle && (
                      <p className="text-xs text-stone-200">{cardSubtitle}</p>
                    )}
                  </div>
                </div>

                {/* Floating Highlight Card */}
                {isPillEnabled && (
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="absolute -bottom-4 -left-2 sm:-left-4 bg-white/95 backdrop-blur-md p-3 sm:p-3.5 rounded-2xl shadow-xl border border-amber-200/80 flex items-center gap-3 z-20"
                  >
                    <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-[#D9531E] shrink-0">
                      <Flame className="w-5 h-5" />
                    </div>
                    <div className="whitespace-nowrap">
                      <p className="text-xs font-bold text-stone-900">{pillTitle}</p>
                      <p className="text-[11px] text-stone-500">{pillSubtitle}</p>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

