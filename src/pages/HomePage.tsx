import React, { useState, useEffect } from 'react';
import { SEO } from '@/components/seo/SEO';
import { HeroSection } from '@/components/home/HeroSection';
import { USPSection } from '@/components/home/USPSection';
import { BananaChipShowcase } from '@/components/home/BananaChipShowcase';
import { RegularBananaChipShowcase } from '@/components/home/RegularBananaChipShowcase';
import { FarsanShowcase } from '@/components/home/FarsanShowcase';
import { MasalaShowcase } from '@/components/home/MasalaShowcase';
import { PotatoChipsShowcase } from '@/components/home/PotatoChipsShowcase';
import { WomanPartnerShowcaseSection } from '@/components/home/WomanPartnerShowcaseSection';
import { FarmerStorySection } from '@/components/home/FarmerStorySection';
import { WatchStorySection } from '@/components/common/WatchStorySection';
import { TrustCertificationsSection } from '@/components/home/TrustCertificationsSection';
import { ComboPreviewSection } from '@/components/home/ComboPreviewSection';
import { StoreLocationSection } from '@/components/home/StoreLocationSection';
import { useSettings } from '@/context/SettingsContext';
import { Product } from '@/types';
import { getBootstrapData } from '@/services/bootstrap';
import { LazyRender } from '@/components/ui/LazyRender';

export function HomePage() {
  const { settings } = useSettings();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    
    getBootstrapData().then((boot) => {
      if (isMounted && boot?.products && Array.isArray(boot.products) && boot.products.length > 0) {
        setProducts(boot.products);
        setIsLoading(false);
      } else if (isMounted) {
        // Fallback to direct products endpoint if needed
        fetch('/api/products')
          .then((res) => res.json())
          .then((json) => {
            if (isMounted && json.success && Array.isArray(json.data)) {
              setProducts(json.data);
            }
          })
          .catch((err) => {
            console.error('Failed to fetch products:', err);
          })
          .finally(() => {
            if (isMounted) setIsLoading(false);
          });
      }
    }).catch(() => {
      if (isMounted) {
        fetch('/api/products')
          .then((res) => res.json())
          .then((json) => {
            if (isMounted && json.success && Array.isArray(json.data)) {
              setProducts(json.data);
            }
          })
          .catch((err) => {
            console.error('Failed to fetch products:', err);
          })
          .finally(() => {
            if (isMounted) setIsLoading(false);
          });
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

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

      {/* SECTION 1: Banana Chips (10 Flavours @ ₹79) - Immediate Top Shelf */}
      <BananaChipShowcase products={products} isLoading={isLoading} />

      {/* Below-the-fold Sections: Deferred until scroll to prevent VPS network spike */}
      <LazyRender minHeight="380px">
        {/* SECTION 1B: Regular Banana Chips (200g, 500g, 1kg) */}
        <RegularBananaChipShowcase products={products} isLoading={isLoading} />
      </LazyRender>

      <LazyRender minHeight="380px">
        {/* SECTION 2: Khandeshi Farsaan (@ ₹70) */}
        <FarsanShowcase products={products} isLoading={isLoading} />
      </LazyRender>

      <LazyRender minHeight="380px">
        {/* SECTION 3: Kitchen Masalas (@ ₹45) */}
        <MasalaShowcase products={products} isLoading={isLoading} />
      </LazyRender>

      <LazyRender minHeight="380px">
        {/* SECTION 4: Potato Chips (Artisanal Potato Wafers) */}
        <PotatoChipsShowcase products={products} isLoading={isLoading} />
      </LazyRender>

      <LazyRender minHeight="400px">
        {/* Woman Business Partner Program Unified Showcase Section */}
        <WomanPartnerShowcaseSection />
      </LazyRender>

      <LazyRender minHeight="400px">
        {/* The Refined Journey of Every Chip & Direct Farm Story */}
        <FarmerStorySection />
      </LazyRender>

      <LazyRender minHeight="420px">
        {/* Watch Our Story in Action Video Section (also defers /api/media call) */}
        <WatchStorySection />
      </LazyRender>

      <LazyRender minHeight="380px">
        {/* Combo / Value Bundles Preview */}
        <ComboPreviewSection products={products} isLoading={isLoading} />
      </LazyRender>

      <LazyRender minHeight="350px">
        {/* Physical Store Location & Experience */}
        <StoreLocationSection />
      </LazyRender>

      <LazyRender minHeight="200px">
        {/* Unified Quality Badges & Customer Guarantee */}
        <TrustCertificationsSection />
      </LazyRender>
    </>
  );
}

export default HomePage;
