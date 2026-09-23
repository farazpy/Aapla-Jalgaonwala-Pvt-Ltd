'use client';

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Container } from '../ui/Container';
import { SectionHeading } from '../ui/SectionHeading';
import { ProductCard } from '../product/ProductCard';
import { ProductGridSkeleton } from '../product/ProductSkeletons';
import { Product } from '@/types';

export const PotatoChipsShowcase: React.FC<{ products?: Product[]; isLoading?: boolean }> = ({ products = [], isLoading }) => {
  const potatoChips = products.filter(
    p =>
      p.category === 'potato-chips' ||
      p.categoryId === 'potato-chips' ||
      p.categoryId === '4' ||
      p.tags?.some(t => t.toLowerCase().includes('potato')) ||
      p.name.toLowerCase().includes('potato')
  );

  return (
    <section className="py-16 md:py-24 bg-white border-t border-stone-200/60">
      <Container>
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <SectionHeading
            eyebrow="Artisanal Potato Crisps"
            title="Handcrafted Potato Chips. Pure Crunch."
            subtitle="Kettle-cooked farm potato wafers sliced paper-thin and seasoned with gourmet rock salts, herbs, and spices."
            className="mb-0"
          />

          <Link
            to="/shop?category=potato-chips"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#9B111E] hover:text-[#800A14] uppercase tracking-wider whitespace-nowrap self-start md:self-end"
          >
            <span>Explore All Potato Chips</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <ProductGridSkeleton count={4} />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {potatoChips.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </Container>
    </section>
  );
};
