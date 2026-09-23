'use client';

import React from 'react';
import Link from 'next/link';
import { Gift, Package, Sparkles } from 'lucide-react';
import { Container } from '../ui/Container';
import { SectionHeading } from '../ui/SectionHeading';
import { ProductCard } from '../product/ProductCard';
import { initialProducts } from '@/data/products';
import { Product } from '@/types';

export const ComboPreviewSection: React.FC<{ products?: Product[] }> = ({ products }) => {
  const sourceProducts = products && products.length > 0 ? products : initialProducts;
  const combos = sourceProducts.filter(p => p.category === 'combo-packs');

  return (
    <section className="py-16 md:py-24 bg-[#FAF6ED] border-t border-stone-200/60">
      <Container>
        <SectionHeading
          eyebrow="Value Bundles & Gifting"
          title="Curated Snack Combos. Maximum Value."
          subtitle="Explore our specially priced gift boxes and sample packs designed for families, festive occasions, and corporate gifting."
          centered
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
          {combos.map((combo) => (
            <ProductCard key={combo.id} product={combo} />
          ))}
        </div>
      </Container>
    </section>
  );
};
