'use client';

import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Sparkles, Zap, ArrowRight } from 'lucide-react';
import { Container } from '../ui/Container';
import { SectionHeading } from '../ui/SectionHeading';
import { ProductCard } from '../product/ProductCard';
import { ProductGridSkeleton } from '../product/ProductSkeletons';
import { Product } from '@/types';

export const ModernFlavoursSection: React.FC<{ products?: Product[]; isLoading?: boolean }> = ({ products = [], isLoading }) => {
  const modernFlavoursList = ['Pani Poori', 'Cheese', 'Peri Peri', 'Noodles / Maggi Flavour', 'Garlic', 'Tomato'];
  const modernProducts = products.filter(
    p => p.flavour && modernFlavoursList.includes(p.flavour)
  );

  return (
    <section className="py-16 md:py-24 bg-linear-to-b from-stone-900 via-stone-950 to-stone-900 text-white relative overflow-hidden">
      {/* Decorative Glow */}
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-[#D9531E]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-[#9B111E]/20 rounded-full blur-3xl pointer-events-none" />

      <Container>
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-amber-400 mb-2 px-3 py-1 bg-amber-400/10 rounded-full border border-amber-400/20">
              <Zap className="w-3.5 h-3.5" />
              <span>Next-Gen Snacking</span>
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight">
              Traditional Roots. Unexpected Flavours.
            </h2>
            <p className="mt-3 text-stone-400 text-sm sm:text-base max-w-xl">
              From chatpata Pani Poori to nostalgic Noodle Masala and creamy Cheese — reimagining raw banana chips for gen-Z and modern foodies.
            </p>
          </div>

          <Link to="/shop?category=banana-chips">
            <button className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-amber-950 font-bold px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all whitespace-nowrap">
              <span>Explore Modern Flavours</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
        </div>

        {/* Product Grid */}
        {isLoading ? (
          <ProductGridSkeleton count={4} />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            {modernProducts.map((p) => (
              <div key={p.id} className="text-stone-900">
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        )}
      </Container>
    </section>
  );
};
