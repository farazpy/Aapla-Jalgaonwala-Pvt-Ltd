'use client';

import React from 'react';
import { motion } from 'motion/react';
import { Product } from '@/types';
import { ProductCard } from './ProductCard';
import { ProductGridSkeleton } from './ProductSkeletons';
import { Frown, Sparkles } from 'lucide-react';
import Link from 'next/link';

interface ProductGridProps {
  products: Product[];
  isLoading?: boolean;
  viewMode?: 'grid' | 'list';
  emptyTitle?: string;
  emptySubtitle?: string;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  isLoading = false,
  viewMode = 'grid',
  emptyTitle = "We couldn't find any matching flavours",
  emptySubtitle = "Try adjusting your filters or search for another delicious snack."
}) => {
  if (isLoading) {
    return <ProductGridSkeleton count={6} />;
  }

  if (!products || products.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-16 px-4 bg-amber-50/50 rounded-3xl border border-amber-200/60 max-w-xl mx-auto my-8"
      >
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center text-[#D9531E] mx-auto mb-4">
          <Frown className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-stone-900 mb-2">{emptyTitle}</h3>
        <p className="text-sm text-stone-600 mb-6">{emptySubtitle}</p>
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#9B111E] text-white font-bold text-xs shadow-md hover:bg-[#800A14] transition-all"
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>Explore All Products</span>
        </Link>
      </motion.div>
    );
  }

  return (
    <div
      className={
        viewMode === 'grid'
          ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-4 sm:gap-6'
          : 'flex flex-col gap-4'
      }
    >
      {products.map((product, idx) => (
        <motion.div
          key={product.id}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: Math.min(idx * 0.05, 0.3) }}
        >
          <ProductCard product={product} />
        </motion.div>
      ))}
    </div>
  );
};
