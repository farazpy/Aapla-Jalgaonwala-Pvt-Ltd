'use client';

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Container } from '../ui/Container';
import { SectionHeading } from '../ui/SectionHeading';
import { ProductCard } from '../product/ProductCard';
import { ProductGridSkeleton } from '../product/ProductSkeletons';
import { Product } from '@/types';

export const KhandeshiChutneyShowcase: React.FC<{ products?: Product[]; isLoading?: boolean }> = ({ products = [], isLoading }) => {
  const chutneys = products.filter(
    p =>
      p.category === 'khandeshi-chutney' ||
      p.category === 'chutneys' ||
      p.category === 'chutney' ||
      p.categoryId === '6' ||
      p.categoryId === 'khandeshi-chutney' ||
      p.tags?.some(t => t.toLowerCase().includes('chutney')) ||
      p.name.toLowerCase().includes('chutney') ||
      p.categoryName?.toLowerCase().includes('chutney')
  );

  return (
    <section className="py-16 md:py-24 bg-[#FAFAF8] border-t border-stone-200/60">
      <Container>
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <SectionHeading
            eyebrow="Authentic Maharashtrian Spices"
            title="Khandeshi Chutney. Fiery & Traditional."
            subtitle="Coarsely pounded Shengdana (Peanut), Lasun (Garlic), Til, and dry roasted spice chutneys prepared in pure Khandeshi style."
            className="mb-0"
          />

          <Link
            to="/shop?category=khandeshi-chutney"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#9B111E] hover:text-[#800A14] uppercase tracking-wider whitespace-nowrap self-start md:self-end"
          >
            <span>Explore All Chutneys</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Products Grid - 4 Column Layout for all Chutneys */}
        {isLoading ? (
          <ProductGridSkeleton count={4} />
        ) : chutneys.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {chutneys.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="p-8 text-center bg-white rounded-2xl border border-stone-200/80 text-stone-500 text-sm font-semibold">
            Authentic Khandeshi Chutneys arriving soon!
          </div>
        )}
      </Container>
    </section>
  );
};
