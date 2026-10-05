'use client';

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ShoppingBag, Heart, Check, Eye, Star, Bell, CheckCircle2 } from 'lucide-react';
import { Product, ProductVariant } from '@/types';
import { Badge } from '../ui/Badge';
import { BananaChipLoader } from '../ui/BananaChipLoader';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { QuickViewModal } from './QuickViewModal';
import { optimizeImageUrl, getResponsiveImageProps } from '@/lib/utils';

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
  const isOutOfStock = Boolean(product.stock <= 0 || product.isAvailable === false);
  
  // Strict Confidential Document Filter
  const isConfidentialDoc = (url?: string): boolean => {
    if (!url || typeof url !== 'string') return false;
    const lower = url.toLowerCase();
    return (
      lower.includes('partner_passbook') ||
      lower.includes('passbook') ||
      lower.includes('aadhaar') ||
      lower.includes('pan_card') ||
      lower.includes('kyc')
    );
  };

  const safeImages = (product.images || []).filter(img => img && img.url && !isConfidentialDoc(img.url));
  let rawImage = safeImages[0]?.url || (!isConfidentialDoc(product.image) ? product.image : undefined) || 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=600&q=80';
  if (product.updatedAt && !rawImage.includes('v=') && !rawImage.includes('_cb=')) {
    const v = new Date(product.updatedAt).getTime();
    if (v && !isNaN(v)) {
      rawImage = rawImage.includes('?') ? `${rawImage}&v=${v}` : `${rawImage}?v=${v}`;
    }
  }
  const imageProps = getResponsiveImageProps(rawImage, 240, '(max-width: 640px) 180px, 240px');

  // Normalize variants and compute price range from 1st to last variation
  const variants = (Array.isArray(product.variants) ? product.variants : []).filter(
    (v): v is ProductVariant => Boolean(v && typeof v.price === 'number')
  );
  const hasVariants = variants.length > 0;
  const isMultipleVariants = variants.length > 1;

  // 1st variation and last variation
  const firstVariant = variants[0];
  const lastVariant = variants[variants.length - 1];

  const firstPrice = firstVariant ? firstVariant.price : (product.salePrice || product.price);
  const lastPrice = lastVariant ? lastVariant.price : (product.salePrice || product.price);

  const minPrice = Math.min(firstPrice, lastPrice);
  const maxPrice = Math.max(firstPrice, lastPrice);
  const isPriceRange = isMultipleVariants && minPrice !== maxPrice;
  const displayPriceRange = isPriceRange ? `₹${minPrice} – ₹${maxPrice}` : `₹${firstPrice}`;

  // MRP calculation
  const firstMrp = firstVariant?.mrp || firstPrice;
  const lastMrp = lastVariant?.mrp || lastPrice;
  const minMrp = Math.min(firstMrp, lastMrp);
  const maxMrp = Math.max(firstMrp, lastMrp);
  const hasMrpDiscount = (maxMrp > maxPrice) || (product.mrp && product.mrp > product.price);
  const isMrpRange = isMultipleVariants && minMrp !== maxMrp && hasMrpDiscount;
  const displayMrpRange = isMrpRange
    ? `₹${minMrp} – ₹${maxMrp}`
    : (hasMrpDiscount ? `₹${Math.max(maxMrp, product.mrp || 0)}` : null);

  // Weight display (e.g. "200g – 1kg" or "100g")
  const firstWeight = firstVariant?.weight;
  const lastWeight = lastVariant?.weight;
  const displayWeight = isMultipleVariants && firstWeight && lastWeight && firstWeight !== lastWeight
    ? `${firstWeight} – ${lastWeight}`
    : (firstWeight || product.netQuantity || '200g');

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isMultipleVariants) {
      setIsQuickViewOpen(true);
      return;
    }
    const defaultVariant = variants.length > 0 ? variants[0] : undefined;
    addToCart(product, defaultVariant);
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
        className={`group relative bg-white rounded-2xl sm:rounded-3xl border border-stone-200/80 shadow-xs hover:shadow-md overflow-hidden flex flex-col justify-between transition-all duration-300 ${className || ''}`}
      >
        <Link to={`/product/${product.slug}`} className="flex flex-col flex-1">
          {/* Image Container with Banana Chip Loader */}
          <div className="relative w-full aspect-square bg-[#FAF6ED] overflow-hidden shrink-0">
            {/* Unified Banana Chip Async Loader */}
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-[#FAF6ED] z-0">
                <BananaChipLoader size="md" />
              </div>
            )}

            <img
              src={imageProps.src}
              srcSet={imageProps.srcSet}
              sizes={imageProps.sizes}
              alt={product.name}
              width="240"
              height="240"
              loading="lazy"
              decoding="async"
              onLoad={() => setImageLoaded(true)}
              className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              referrerPolicy="no-referrer"
            />

            {/* Top Badges - Compact & Clean on Mobile 2-Col */}
            <div className="absolute top-1.5 left-1.5 sm:top-2.5 sm:left-2.5 flex flex-wrap gap-1 z-10 max-w-[calc(100%-2.75rem)] sm:max-w-[calc(100%-4rem)] pointer-events-none">
              {isOutOfStock ? (
                <span className="text-[8px] xs:text-[9px] sm:text-[10px] font-black uppercase tracking-tight sm:tracking-wider bg-red-600 text-white px-1.5 sm:px-2.5 py-0.5 rounded-md shadow-xs sm:shadow-md border border-red-700">
                  Out of Stock
                </span>
              ) : (
                <>
                  {product.discount && product.discount > 0 && (
                    <span className="text-[8px] xs:text-[9px] sm:text-[10px] font-black uppercase tracking-tight sm:tracking-wider bg-[#9B111E] text-white px-1.5 sm:px-2.5 py-0.5 rounded-md shadow-xs sm:shadow-md border border-red-400/30">
                      {product.discount}% OFF
                    </span>
                  )}

                  {product.isBestSeller && (
                    <span className="text-[8px] xs:text-[9px] sm:text-[10px] font-black uppercase tracking-tight sm:tracking-wider bg-amber-400 text-stone-950 px-1.5 sm:px-2.5 py-0.5 rounded-md shadow-xs sm:shadow-md border border-amber-300">
                      ★ Best Seller
                    </span>
                  )}

                  {/* Flavour & Spicy Badge - Clean & Scaled on Mobile */}
                  {product.flavour && (
                    <span
                      className={`text-[8px] xs:text-[9px] sm:text-[10px] font-black uppercase tracking-tight sm:tracking-wider px-1.5 sm:px-2.5 py-0.5 rounded-md shadow-xs sm:shadow-md border flex items-center gap-0.5 sm:gap-1 ${
                        /spicy|tikhat|hot|masala|chilli|fire|mirch/i.test(product.flavour)
                          ? 'bg-[#D9531E] text-white border-amber-300/40'
                          : 'bg-stone-900/90 text-amber-300 backdrop-blur-md border-amber-400/40'
                      }`}
                    >
                      {/spicy|tikhat|hot|masala|chilli|fire/i.test(product.flavour) && <span className="text-[9px] sm:text-xs">🌶️</span>}
                      <span className="truncate max-w-[70px] sm:max-w-none">{product.flavour}</span>
                    </span>
                  )}

                  {!product.flavour && product.tags && product.tags.some(t => /spicy|tikhat|hot|masala/i.test(t)) && (
                    <span className="text-[8px] xs:text-[9px] sm:text-[10px] font-black uppercase tracking-tight sm:tracking-wider bg-[#D9531E] text-white px-1.5 sm:px-2.5 py-0.5 rounded-md shadow-xs sm:shadow-md border border-amber-300/40 flex items-center gap-0.5 sm:gap-1">
                      <span>🌶️</span>
                      <span>Spicy</span>
                    </span>
                  )}
                </>
              )}
            </div>

            {/* Top Right Action Buttons: Wishlist & Quick View */}
            <div className="absolute top-1.5 right-1.5 sm:top-2.5 sm:right-2.5 z-10 flex flex-col gap-1 sm:gap-1.5">
              <button
                type="button"
                onClick={handleToggleWishlist}
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-xs ${
                  isWishlisted
                    ? 'bg-red-50 text-red-600 shadow-xs'
                    : 'bg-white/85 text-stone-600 hover:bg-white hover:text-red-600 backdrop-blur-xs'
                }`}
                title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
                aria-label="Wishlist"
              >
                <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isWishlisted ? 'fill-current' : ''}`} />
              </button>

              <button
                type="button"
                onClick={handleQuickView}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/85 text-stone-700 hover:bg-white hover:text-[#9B111E] hidden xs:flex items-center justify-center transition-all backdrop-blur-xs shadow-xs cursor-pointer"
                title="Quick View"
                aria-label="Quick View"
              >
                <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>
          </div>

          {/* Content Container - Stretch flex column */}
          <div className="p-2.5 sm:p-4 md:p-5 pb-1 sm:pb-2 flex-1 flex flex-col justify-between">
            <div>
              {/* Rating & Net Quantity Row with Dynamic Real Reviews Badge */}
              <div className="flex flex-wrap items-center gap-1.5 text-[10px] sm:text-xs text-amber-700 mb-1.5 font-bold">
                <span className="flex items-center gap-0.5 bg-amber-50 px-1 sm:px-1.5 py-0.5 rounded border border-amber-200/80 shrink-0">
                  <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-amber-400 text-amber-500 shrink-0" />
                  <span>{product.rating ? Number(product.rating).toFixed(1) : '4.9'}</span>
                </span>

                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200/60 text-[9px] sm:text-[10px] font-black shrink-0">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                  <span>{product.reviewsCount && product.reviewsCount > 0 ? `${product.reviewsCount} Real Reviews` : 'Real Reviews'}</span>
                </span>

                <span className="text-stone-300">•</span>
                <span className="text-stone-500 font-semibold truncate">{displayWeight}</span>
              </div>

              {/* Product Name with ample top space & line-height for Devanagari matras / velanti */}
              <h3 className="mt-1.5 pt-1 pb-0.5 font-bold text-xs xs:text-sm sm:text-base text-stone-900 group-hover:text-[#9B111E] transition-colors line-clamp-2 leading-[1.38] sm:leading-[1.42] min-h-[2.4rem] sm:min-h-0">
                {product.name}
              </h3>

              {/* Short Description */}
              <p className="text-[10px] xs:text-[11px] sm:text-xs text-stone-500 line-clamp-1 sm:line-clamp-2 mt-0.5 sm:mt-1 leading-normal sm:leading-relaxed">
                {product.shortDescription || product.description || 'Authentic Jalgaon snack handcrafted with traditional spices.'}
              </p>
            </div>

            {/* Feature Badges / Highlights */}
            <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 mt-1.5 sm:mt-2.5">
              <span className="inline-flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.2 sm:py-0.5 rounded text-[8.5px] xs:text-[9px] sm:text-[10px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200/80">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                100% Veg
              </span>

              {isMultipleVariants ? (
                <span className="px-1.5 sm:px-2 py-0.2 sm:py-0.5 rounded text-[8.5px] xs:text-[9px] sm:text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200/80">
                  {variants.length} Sizes Available
                </span>
              ) : product.isBestSeller ? (
                <span className="px-1.5 sm:px-2 py-0.2 sm:py-0.5 rounded text-[8.5px] xs:text-[9px] sm:text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200/80">
                  ⚡ Bestseller
                </span>
              ) : (
                <span className="px-1.5 sm:px-2 py-0.2 sm:py-0.5 rounded text-[8.5px] xs:text-[9px] sm:text-[10px] font-semibold bg-stone-100 text-stone-600 border border-stone-200/60">
                  Fresh Batch
                </span>
              )}
            </div>
          </div>
        </Link>

        {/* Price & Add to Cart / Notify Footer */}
        <div className="p-2.5 sm:p-4 md:p-5 pt-1 sm:pt-1 flex items-center justify-between gap-1.5">
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-1 sm:gap-1.5 flex-wrap">
              <span className="text-xs xs:text-sm sm:text-base md:text-lg font-black text-[#9B111E] leading-none whitespace-nowrap">
                {displayPriceRange}
              </span>
              {displayMrpRange && (
                <span className="text-[10px] sm:text-xs text-stone-400 line-through font-medium whitespace-nowrap">
                  {displayMrpRange}
                </span>
              )}
            </div>
            {isPriceRange && (
              <span className="text-[9px] sm:text-[10px] text-stone-500 font-semibold block mt-0.5 truncate">
                {variants.length} pack options
              </span>
            )}
          </div>

          {isOutOfStock ? (
            <Link
              to={`/product/${product.slug}`}
              className="px-2 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-[10px] sm:text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-1 transition-all duration-200 shadow-xs hover:shadow-sm shrink-0"
            >
              <Bell className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>Notify</span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={handleAddToCart}
              className={`px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 transition-all duration-200 cursor-pointer shrink-0 ${
                added
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[#9B111E] hover:bg-[#800A14] text-white shadow-xs hover:shadow-sm active:scale-95'
              }`}
              title={isMultipleVariants ? "Select Pack Option" : "Add to Cart"}
            >
              {added ? (
                <>
                  <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span>Added</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span>{isMultipleVariants ? 'Select' : 'Add'}</span>
                </>
              )}
            </button>
          )}
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
