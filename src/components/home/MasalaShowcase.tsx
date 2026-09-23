'use client';

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Flame, Sparkles } from 'lucide-react';
import { Container } from '../ui/Container';
import { SectionHeading } from '../ui/SectionHeading';
import { ProductCard } from '../product/ProductCard';
import { ProductGridSkeleton } from '../product/ProductSkeletons';
import { Product } from '@/types';

export const MasalaShowcase: React.FC<{ products?: Product[]; isLoading?: boolean }> = ({ products = [], isLoading }) => {
  const masalas = products.filter(p => p.category === 'kitchen-masalas' || p.category === 'masalas' || p.categoryId === '3' || p.categoryId === 'kitchen-masalas');

  return (
    <section className="py-16 md:py-24 bg-[#FAFAF8] border-t border-stone-200/60">
      <Container>
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <SectionHeading
            eyebrow="Khandeshi Kitchen Essentials"
            title="Bring Home the Flavours of Maharashtra."
            subtitle="Authentic Maharashtrian flavour for everyday cooking. Handcrafted Kala Masalas and specialty blends roasted to perfection."
            className="mb-0"
          />

          <Link
            to="/shop?category=kitchen-masalas"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#9B111E] hover:text-[#800A14] uppercase tracking-wider whitespace-nowrap self-start md:self-end"
          >
            <span>Explore All Masalas</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {isLoading ? (
          <ProductGridSkeleton count={4} />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {masalas.map((masala) => (
              <ProductCard key={masala.id} product={masala} />
            ))}
          </div>
        )}
      </Container>
    </section>
  );
};
