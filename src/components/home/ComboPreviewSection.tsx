'use client';

import React from 'react';
import { Link } from 'react-router-dom';
import { Gift, Package, Sparkles } from 'lucide-react';
import { Container } from '../ui/Container';
import { SectionHeading } from '../ui/SectionHeading';
import { ProductCard } from '../product/ProductCard';
import { ProductGridSkeleton } from '../product/ProductSkeletons';
import { Product } from '@/types';

export const ComboPreviewSection: React.FC<{ products?: Product[]; isLoading?: boolean }> = ({ products = [], isLoading }) => {
  const combos = products.filter(p => p.category === 'combo-packs');

  return (
    <section className="py-16 md:py-24 bg-[#FAF6ED] border-t border-stone-200/60">
      <Container>
        <SectionHeading
          eyebrow="Value Bundles & Gifting"
          title="Curated Snack Combos. Maximum Value."
          subtitle="Explore our specially priced gift boxes and sample packs designed for families, festive occasions, and corporate gifting."
          centered
        />

        {isLoading ? (
          <div className="mt-8">
            <ProductGridSkeleton count={4} />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-8 mt-8">
            {combos.map((combo) => (
              <ProductCard key={combo.id} product={combo} />
            ))}
          </div>
        )}
      </Container>
    </section>
  );
};
