import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import { Category } from '@/types';
import { optimizeImageUrl } from '@/lib/utils';

export interface CategoryCardProps {
  category: Category;
  className?: string;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({ category, className = '' }) => {
  const isUpwas = category.slug === 'upwas-special';
  const targetUrl = isUpwas ? '/upwas-special' : `/shop?category=${category.slug}`;
  const optimizedImage = optimizeImageUrl(category.image || '', 300);

  return (
    <Link to={targetUrl}>
      <motion.div
        whileHover={{ y: -4 }}
        transition={{ duration: 0.2 }}
        className={`group relative bg-white rounded-3xl border border-stone-200/80 shadow-xs hover:shadow-md overflow-hidden p-4 sm:p-5 flex flex-col justify-between transition-all duration-300 h-full ${className}`}
      >
        <div className="relative w-full aspect-16/10 rounded-2xl overflow-hidden mb-4 bg-[#FAF6ED]">
          {category.image ? (
            <img loading="lazy"
              src={optimizedImage}
              alt={category.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              referrerPolicy="no-referrer"
              width="300"
              height="300"
              decoding="async"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-stone-100 text-stone-400 font-bold">
              {category.name}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950/40 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
          {category.productCount !== undefined && (
            <span className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-xs text-stone-900 text-[11px] font-bold px-2.5 py-1 rounded-full border border-stone-200">
              {category.productCount} Items
            </span>
          )}
        </div>

        <div className="flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-base sm:text-lg font-bold text-stone-900 group-hover:text-[#9B111E] transition-colors">
                {category.name}
              </h3>
              <div className="w-7 h-7 rounded-full bg-stone-100 group-hover:bg-[#9B111E] group-hover:text-white text-stone-600 flex items-center justify-center transition-colors">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>

            {category.tagline && (
              <p className="text-xs font-semibold text-[#D9531E] mb-1.5 line-clamp-1">
                {category.tagline}
              </p>
            )}

            <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">
              {category.description}
            </p>
          </div>
        </div>
      </motion.div>
    </Link>
  );
};
