'use client';

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Inbox } from 'lucide-react';
import { Container } from '../ui/Container';
import { SectionHeading } from '../ui/SectionHeading';
import { ProductCard } from '../product/ProductCard';
import { ProductGridSkeleton } from '../product/ProductSkeletons';
import { Product } from '@/types';

export const RegularBananaChipShowcase: React.FC<{ products?: Product[]; isLoading?: boolean }> = ({ products = [], isLoading }) => {
  // Filter products strictly belonging to the 'regular-banana-chips' category slug or categoryId (id: 5)
  const regularChips = products.filter(p => 
    p.category === 'regular-banana-chips' || 
    p.categoryId === '5' || 
    p.categoryId === 'regular-banana-chips' ||
    (p.categoryName && p.categoryName.toLowerCase().includes('regular banana chips'))
  );

  return (
    <section className="py-16 md:py-24 bg-stone-50/50 border-t border-stone-200/60" id="regular-banana-chips-section">
      <Container>
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <SectionHeading
            eyebrow="Traditional Family Packs"
            title="Regular Banana Chips"
            subtitle="Your favorite golden-crispy banana chips available in standard family-size packages of 200g, 500g, and 1kg (1k) for wholesome snacking."
            className="mb-0"
            id="regular-banana-chips-heading"
          />

          <Link
            to="/shop?category=regular-banana-chips"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#9B111E] hover:text-[#800A14] uppercase tracking-wider whitespace-nowrap self-start md:self-end"
            id="explore-regular-chips-link"
          >
            <span>Explore Family Packs</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {isLoading ? (
          <ProductGridSkeleton count={4} />
        ) : regularChips.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-16 px-4 border border-dashed border-stone-200/80 rounded-3xl bg-white/60 shadow-xs max-w-xl mx-auto" id="no-regular-products-found">
            <div className="w-12 h-12 rounded-2xl bg-stone-100 flex items-center justify-center text-stone-400 mb-4">
              <Inbox className="w-6 h-6" />
            </div>
            <h4 className="text-stone-800 font-bold text-base mb-1">No Products Found</h4>
            <p className="text-stone-500 text-sm max-w-sm">
              We are currently preparing fresh packages for this category. Check back soon for authentic 200g, 500g, and 1kg options!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6" id="regular-chips-grid">
            {regularChips.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </Container>
    </section>
  );
};
