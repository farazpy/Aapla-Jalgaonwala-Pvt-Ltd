'use client';

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Container } from '../ui/Container';
import { SectionHeading } from '../ui/SectionHeading';
import { ProductCard } from '../product/ProductCard';
import { ProductGridSkeleton } from '../product/ProductSkeletons';
import { Product } from '@/types';

export const FarsanShowcase: React.FC<{ products?: Product[]; isLoading?: boolean }> = ({ products = [], isLoading }) => {
  const farsaanItems = products.filter(p => p.category === 'farsaan' || p.category === 'khandeshi-farsaan' || p.categoryId === '2' || p.categoryId === 'farsaan' || p.categoryId === 'khandeshi-farsaan');

  return (
    <section className="py-16 md:py-24 bg-white border-t border-stone-200/60">
      <Container>
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <SectionHeading
            eyebrow="Savoury Snacks"
            title="Traditional Farsaan. Timeless Taste."
            subtitle="Authentic Maharashtrian & Khandeshi savoury snacks crafted with pure gram flour, peanuts, and traditional spices. All items flat ₹70."
            className="mb-0"
          />

          <Link
            to="/shop?category=farsaan"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#9B111E] hover:text-[#800A14] uppercase tracking-wider whitespace-nowrap self-start md:self-end"
          >
            <span>Explore All Farsaan</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Editorial Layout */}
        {isLoading ? (
          <ProductGridSkeleton count={4} />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {farsaanItems.slice(0, 8).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </Container>
    </section>
  );
};
