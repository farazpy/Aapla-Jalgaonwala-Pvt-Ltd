'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { motion } from 'motion/react';
import { ShoppingBag, Heart, Check, Eye, Star } from 'lucide-react';
import { Product } from '@/types';
import { Badge } from '../ui/Badge';
import { BananaChipLoader } from '../ui/BananaChipLoader';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';

// Dynamic lazy import for QuickViewModal to reduce initial bundle size
const QuickViewModal = dynamic(
  () => import('./QuickViewModal').then((mod) => mod.QuickViewModal),
  { ssr: false }
);

export interface ProductCardProps {
  product: Product;
  className?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, className }) => {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [added, setAdded] = useState(false);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const isWishlisted = isInWishlist(product.id);
  const primaryImage = product.images[0]?.url || 'https://picsum.photos/seed/jalgaon/400/400';

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsQuickViewOpen(true);
  };

  return (
    <>
      <motion.div
        whileHover={{ y: -4 }}
        transition={{ duration: 0.2 }}
        className={`group relative bg-white rounded-3xl border border-stone-200/80 shadow-xs hover:shadow-md overflow-hidden flex flex-col justify-between transition-all duration-300 ${className}`}
      >
        <Link href={`/product/${product.slug}`} prefetch={true} className="block flex-1">
          {/* Image Container with Banana Chip Loader */}
          <div className="relative w-full aspect-square bg-[#FAF6ED] overflow-hidden">
            {/* Unified Banana Chip Async Loader */}
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-[#FAF6ED] z-0">
                <BananaChipLoader size="md" />
              </div>
            )}

            <Image
              src={primaryImage}
              alt={product.name}
              fill
              loading="lazy"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              onLoad={() => setImageLoaded(true)}
              className={`object-cover transition-all duration-500 group-hover:scale-105 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              referrerPolicy="no-referrer"
            />

            {/* Top Badges */}
            <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
              {product.discount && product.discount > 0 && (
                <Badge variant="red" size="sm">
                  {product.discount}% OFF
                </Badge>
              )}
              {product.isBestSeller && (
                <Badge variant="saffron" size="sm">
                  Best Seller
                </Badge>
              )}
              {!product.isBestSeller && product.flavour && (
                <Badge variant="orange" size="sm">
                  {product.flavour}
                </Badge>
              )}
            </div>

            {/* Top Right Buttons: Wishlist & Quick View */}
            <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5">
              <button
                onClick={handleToggleWishlist}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-2xs ${
                  isWishlisted
                    ? 'bg-red-50 text-red-600 shadow-xs'
                    : 'bg-white/80 text-stone-600 hover:bg-white hover:text-red-600 backdrop-blur-xs'
                }`}
                title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
              >
                <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
              </button>

              <button
                onClick={handleQuickView}
                className="w-8 h-8 rounded-full bg-white/80 text-stone-700 hover:bg-white hover:text-[#9B111E] flex items-center justify-center transition-all backdrop-blur-xs shadow-2xs"
                title="Quick View"
              >
                <Eye className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-5">
            <div className="flex items-center gap-1.5 text-xs text-amber-600 mb-1 font-medium">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>4.9</span>
              <span className="text-stone-300">•</span>
              <span className="text-stone-500">{product.netQuantity}</span>
            </div>

            <h3 className="font-bold text-base text-stone-900 group-hover:text-[#9B111E] transition-colors line-clamp-1">
              {product.name}
            </h3>

            <p className="text-xs text-stone-500 line-clamp-2 mt-1 min-h-[32px] leading-relaxed">
              {product.shortDescription || product.description}
            </p>
          </div>
        </Link>

        {/* Price & Add to Cart Footer */}
        <div className="p-4 sm:p-5 pt-0 flex items-center justify-between mt-2">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-[#9B111E]">₹{product.price}</span>
              {product.mrp > product.price && (
                <span className="text-xs text-stone-400 line-through">₹{product.mrp}</span>
              )}
            </div>
          </div>

          <button
            onClick={handleAddToCart}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 ${
              added
                ? 'bg-emerald-600 text-white'
                : 'bg-[#9B111E] hover:bg-[#800A14] text-white shadow-xs hover:shadow-sm'
            }`}
          >
            {added ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Added</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Add</span>
              </>
            )}
          </button>
        </div>
      </motion.div>

      {/* Quick View Modal - Lazily Mounted */}
      {isQuickViewOpen && (
        <QuickViewModal
          product={product}
          isOpen={isQuickViewOpen}
          onClose={() => setIsQuickViewOpen(false)}
        />
      )}
    </>
  );
};
