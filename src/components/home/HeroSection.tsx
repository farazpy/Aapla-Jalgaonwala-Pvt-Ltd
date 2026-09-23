'use client';

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Sparkles, ArrowRight, Flame, ShieldCheck, Award } from 'lucide-react';
import { Button } from '../ui/Button';
import { optimizeImageUrl } from "@/lib/utils";
import { SiteSettings } from '@/types';
import { DEFAULT_HERO_IMAGE } from '@/data/settings';

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
  const rawTitle = settings?.heroTitle?.trim();
  const title = (!rawTitle || rawTitle === 'A Taste of Jalgaon in Every Bite.') ? 'A Taste of Homemade Aroma' : rawTitle;
  const rawHighlight = settings?.heroTitleHighlight?.trim();
  const titleHighlight = (!rawHighlight || rawHighlight === 'Jalgaon') ? 'Homemade Aroma' : rawHighlight;
  const subtitle = settings?.heroSubtitle?.trim() || "Authentic banana chips, farsaan, masalas and regional flavours crafted for today's generation. Directly sourced from Jalgaon farms and freshly packed for pure crunch.";
  const primaryCtaText = settings?.heroPrimaryCtaText?.trim() || 'Shop Now';
  const primaryCtaLink = settings?.heroPrimaryCtaLink?.trim() || '/shop';
  const secondaryCtaText = (settings?.heroSecondaryCtaText && settings?.heroSecondaryCtaText.trim() !== 'Our Story') 
    ? settings.heroSecondaryCtaText.trim() 
    : 'Woman Partner Registration';
  const secondaryCtaLink = (settings?.heroSecondaryCtaLink && settings?.heroSecondaryCtaLink.trim() !== '/our-story') 
    ? settings.heroSecondaryCtaLink.trim() 
    : '/women-business-partner';

  // Showcase card content
  const rawCardImage = settings?.heroCardImage?.trim() || DEFAULT_HERO_IMAGE;
  const cardImage = optimizeImageUrl(rawCardImage, 550, 'auto');
  const cardBadge = settings?.heroCardBadge?.trim() || 'Hero Special';
  const rawCardTitle = settings?.heroCardTitle?.trim();
  const cardTitle = (!rawCardTitle || rawCardTitle === 'Khandeshi Masala Banana Chips') ? 'A Taste of Homemade Aroma' : rawCardTitle;
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

  // Helper to render supporting description with highlighted line
  const renderDescription = () => {
    const dreamRegex = /(helping\s+wom[a|e]n\s+ach[i|ie]*ve\s+their\s+dreams[\.]?)/i;
    const hasDreamLine = dreamRegex.test(subtitle);

    if (hasDreamLine) {
      const parts = subtitle.split(dreamRegex);
      return (
        <p className="text-base sm:text-lg text-stone-600 max-w-2xl leading-relaxed font-normal">
          {parts.map((part, index) =>
            dreamRegex.test(part) ? (
              <span
                key={index}
                className="inline-block font-semibold text-[#9B111E] bg-rose-50 border border-rose-200/70 px-2 py-0.5 rounded-md mx-1"
              >
                {part}
              </span>
            ) : (
              part
            )
          )}
        </p>
      );
    }

    return (
      <div className="space-y-3 max-w-2xl">
        <p className="text-base sm:text-lg text-stone-600 leading-relaxed font-normal">
          {subtitle}
        </p>
        <div className="pt-0.5">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-50/90 border border-rose-200/80 text-xs sm:text-sm font-semibold text-[#9B111E] shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-[#9B111E] animate-pulse" />
            Empowering women to achieve their dreams
          </span>
        </div>
      </div>
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
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
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-stone-900 tracking-tight leading-[1.15] break-words">
              {renderHighlightedTitle()}
            </h1>

            {/* Supporting Copy with Highlighted Primary Line */}
            {renderDescription()}

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link to={primaryCtaLink}>
                <Button
                  variant="primary"
                  size="lg"
                  className="rounded-2xl px-7 shadow-md"
                  rightIcon={<ArrowRight className="w-4 h-4 ml-1" />}
                >
                  {primaryCtaText}
                </Button>
              </Link>
              <Link to={secondaryCtaLink}>
                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-2xl border-2 border-orange-400/80 bg-orange-500 hover:bg-orange-600 text-white font-black shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center"
                >
                  <span>{secondaryCtaText}</span>
                  <Sparkles className="w-4 h-4 ml-2 inline-block shrink-0" />
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-5 relative"
          >
            <div className="relative mx-auto max-w-md lg:max-w-none pb-6 pr-4 sm:pb-8 sm:pr-6">
              {/* Main Container Card */}
              <div className="relative rounded-3xl bg-gradient-to-br from-[#FAF6ED] to-white p-3 border-2 border-amber-900/10 shadow-xl">
                <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-amber-100/50">
                  <img
                    src={cardImage}
                    alt={cardTitle || 'Aapla Jalgaonwala Authentic Snacks'}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    fetchPriority="high"
                    loading="eager"
                    decoding="async"
                    width="550"
                    height="550"
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (target.src !== DEFAULT_HERO_IMAGE) {
                        target.src = DEFAULT_HERO_IMAGE;
                      }
                    }}
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
                  <div
                    className="absolute -bottom-4 -left-2 sm:-left-4 bg-white/95 backdrop-blur-md p-3 sm:p-3.5 rounded-2xl shadow-xl border border-amber-200/80 flex items-center gap-3 z-20"
                  >
                    <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-[#D9531E] shrink-0">
                      <Flame className="w-5 h-5" />
                    </div>
                    <div className="whitespace-nowrap">
                      <p className="text-xs font-bold text-stone-900">{pillTitle}</p>
                      <p className="text-[11px] text-stone-500">{pillSubtitle}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

