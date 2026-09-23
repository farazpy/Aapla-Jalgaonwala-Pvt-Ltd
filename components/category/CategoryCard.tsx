'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import { Category } from '@/types';

export interface CategoryCardProps {
  category: Category;
  className?: string;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({ category, className }) => {
  return (
    <Link href={`/shop?category=${category.slug}`} prefetch={true}>
      <motion.div
        whileHover={{ y: -4 }}
        transition={{ duration: 0.2 }}
        className={`group relative bg-white rounded-3xl border border-stone-200/80 shadow-xs hover:shadow-md overflow-hidden p-4 sm:p-5 flex flex-col justify-between transition-all duration-300 ${className}`}
      >
        <div className="relative w-full aspect-16/10 rounded-2xl overflow-hidden mb-4 bg-[#FAF6ED]">
          <Image
            src={category.image}
            alt={category.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-linear-to-t from-stone-950/40 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
          {category.productCount !== undefined && (
            <span className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-xs text-stone-900 text-[11px] font-bold px-2.5 py-1 rounded-full border border-stone-200">
              {category.productCount} Items
            </span>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-lg font-bold text-stone-900 group-hover:text-[#D9531E] transition-colors">
              {category.name}
            </h3>
            <div className="w-7 h-7 rounded-full bg-stone-100 group-hover:bg-[#D9531E] group-hover:text-white text-stone-600 flex items-center justify-center transition-colors">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">
            {category.description}
          </p>
        </div>
      </motion.div>
    </Link>
  );
};
