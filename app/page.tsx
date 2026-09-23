import React from 'react';
import dynamic from 'next/dynamic';
import { SEO } from '@/components/seo/SEO';
import { HeroSection } from '@/components/home/HeroSection';
import { ProductRepository } from '@/server/repositories/ProductRepository';
import { SettingsRepository } from '@/server/repositories/SettingsRepository';

// Skeleton fallback loader for lazy loaded sections
const SectionSkeleton = () => (
  <div className="w-full h-64 my-8 bg-stone-100/60 animate-pulse rounded-3xl max-w-7xl mx-auto px-4" />
);

// Dynamic Lazy Imports for Below-the-Fold Sections
const USPSection = dynamic(
  () => import('@/components/home/USPSection').then((mod) => mod.USPSection),
  { loading: SectionSkeleton }
);

// 1. Banana Chips Showcase (1st Product Section)
const BananaChipShowcase = dynamic(
  () => import('@/components/home/BananaChipShowcase').then((mod) => mod.BananaChipShowcase),
  { loading: SectionSkeleton }
);

// 2. Khandeshi Farsaan Showcase (2nd Product Section)
const FarsanShowcase = dynamic(
  () => import('@/components/home/FarsanShowcase').then((mod) => mod.FarsanShowcase),
  { loading: SectionSkeleton }
);

// 3. Kitchen Masalas Showcase (3rd Product Section)
const MasalaShowcase = dynamic(
  () => import('@/components/home/MasalaShowcase').then((mod) => mod.MasalaShowcase),
  { loading: SectionSkeleton }
);

// 4. Potato Chips Showcase (4th Product Section)
const PotatoChipsShowcase = dynamic(
  () => import('@/components/home/PotatoChipsShowcase').then((mod) => mod.PotatoChipsShowcase),
  { loading: SectionSkeleton }
);

// Refined Farm-to-Packet Journey & Farmer Story
const FarmerStorySection = dynamic(
  () => import('@/components/home/FarmerStorySection').then((mod) => mod.FarmerStorySection),
  { loading: SectionSkeleton }
);

// Unified Trust Certifications & Comparison Matrix
const TrustCertificationsSection = dynamic(
  () => import('@/components/home/TrustCertificationsSection').then((mod) => mod.TrustCertificationsSection),
  { loading: SectionSkeleton }
);

// Combo / Value Bundles Section
const ComboPreviewSection = dynamic(
  () => import('@/components/home/ComboPreviewSection').then((mod) => mod.ComboPreviewSection),
  { loading: SectionSkeleton }
);

// Physical Store Section
const StoreLocationSection = dynamic(
  () => import('@/components/home/StoreLocationSection').then((mod) => mod.StoreLocationSection),
  { loading: SectionSkeleton }
);

export default async function HomePage() {
  // Fetch real-time products and site settings concurrently
  const [products, settings] = await Promise.all([
    ProductRepository.getAll(),
    SettingsRepository.getSettings()
  ]);

  return (
    <>
      <SEO
        title={`${settings?.storeName || 'Aapla Jalgaonwala'} | Authentic Jalgaon Taste in Every Bite`}
        description="Authentic Jalgaon banana chips in 10 unique flavours, Khandeshi farsaan, kitchen masalas, and handcrafted potato chips. Sourced directly from Jalgaon farmers."
      />
      
      {/* Top Hero Section */}
      <HeroSection settings={settings} />
 
      {/* Quick Brand Trust & Value Badges */}
      <USPSection />
 
      {/* SECTION 1: Banana Chips (10 Flavours @ ₹79) */}
      <BananaChipShowcase products={products} />
 
      {/* SECTION 2: Khandeshi Farsaan (@ ₹70) */}
      <FarsanShowcase products={products} />
 
      {/* SECTION 3: Kitchen Masalas (@ ₹45) */}
      <MasalaShowcase products={products} />
 
      {/* SECTION 4: Potato Chips (Artisanal Potato Wafers) */}
      <PotatoChipsShowcase products={products} />

      {/* The Refined Journey of Every Chip & Direct Farm Story */}
      <FarmerStorySection />

      {/* Unified Trust, Certifications & Comparison Section */}
      <TrustCertificationsSection />
 
      {/* Combo / Value Bundles Section */}
      <ComboPreviewSection products={products} />
 
      {/* Physical Store Section */}
      <StoreLocationSection />
    </>
  );
}
