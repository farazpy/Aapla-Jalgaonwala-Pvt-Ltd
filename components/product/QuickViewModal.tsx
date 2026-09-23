'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { X, Heart, ShoppingBag, Check, ShieldCheck, Truck, Sparkles, Plus, Minus } from 'lucide-react';
import { Product } from '@/types';
import { Badge } from '../ui/Badge';
import { BananaChipLoader } from '../ui/BananaChipLoader';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';

interface QuickViewModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export const QuickViewModal: React.FC<QuickViewModalProps> = ({ product, isOpen, onClose }) => {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  if (!product || !isOpen) return null;

  const isWishlisted = isInWishlist(product.id);
  const primaryImage = product.images[0]?.url || 'https://picsum.photos/seed/jalgaon/600/600';

  const handleAddToCart = () => {
    addToCart(product, undefined, quantity);
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      onClose();
    }, 1200);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-stone-900/60 backdrop-blur-xs">
        {/* Backdrop click to close */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0"
        />

        {/* Modal Window: Centered Desktop, Bottom Sheet Mobile */}
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-2xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden z-10 max-h-[90vh] flex flex-col"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition-all"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="overflow-y-auto p-6 sm:p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
              {/* Image Column */}
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-amber-50 border border-amber-100">
                {!imgLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center bg-[#FAF6ED] z-0">
                    <BananaChipLoader size="md" />
                  </div>
                )}
                <Image
                  src={primaryImage}
                  alt={product.name}
                  fill
                  onLoad={() => setImgLoaded(true)}
                  className={`object-cover transition-opacity duration-300 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
                  referrerPolicy="no-referrer"
                />

                <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
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
                </div>
              </div>

              {/* Info Column */}
              <div className="space-y-4 text-left">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#D9531E]">
                    {product.category.replace('-', ' ')}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-stone-900 mt-1">
                    {product.name}
                  </h2>
                  <p className="text-xs text-stone-500 mt-0.5">Net Wt: {product.netQuantity}</p>
                </div>

                {/* Pricing */}
                <div className="flex items-baseline gap-3">
                  <span className="text-2xl font-black text-[#9B111E]">₹{product.price}</span>
                  {product.mrp > product.price && (
                    <span className="text-sm text-stone-400 line-through">₹{product.mrp}</span>
                  )}
                  {product.discount && (
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      Save ₹{product.mrp - product.price}
                    </span>
                  )}
                </div>

                {/* Description */}
                <p className="text-xs text-stone-600 leading-relaxed">
                  {product.shortDescription || product.description}
                </p>

                {/* Flavour Tag */}
                {product.flavour && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-semibold text-stone-700">Flavour Profile:</span>
                    <span className="px-2.5 py-1 bg-amber-100 text-amber-900 rounded-lg font-bold">
                      {product.flavour}
                    </span>
                  </div>
                )}

                {/* Quantity Control */}
                <div className="flex items-center gap-4 pt-2">
                  <span className="text-xs font-semibold text-stone-700">Quantity:</span>
                  <div className="inline-flex items-center rounded-xl border border-stone-200 bg-stone-50 p-1">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-7 h-7 rounded-lg bg-white flex items-center justify-center text-stone-600 hover:bg-stone-200 shadow-2xs disabled:opacity-50"
                      disabled={quantity <= 1}
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-10 text-center font-bold text-sm text-stone-900">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-7 h-7 rounded-lg bg-white flex items-center justify-center text-stone-600 hover:bg-stone-200 shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleAddToCart}
                    className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md ${
                      added
                        ? 'bg-emerald-600 text-white'
                        : 'bg-[#9B111E] hover:bg-[#800A14] text-white'
                    }`}
                  >
                    {added ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Added to Cart</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-4 h-4" />
                        <span>Add to Cart (₹{product.price * quantity})</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => toggleWishlist(product)}
                    className={`p-3 rounded-xl border flex items-center justify-center transition-all ${
                      isWishlisted
                        ? 'border-red-200 bg-red-50 text-red-600'
                        : 'border-stone-200 hover:bg-stone-50 text-stone-600'
                    }`}
                    title={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
                  >
                    <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
                  </button>
                </div>

                {/* View Full Detail Link */}
                <div className="pt-2 text-center">
                  <Link
                    href={`/product/${product.slug}`}
                    onClick={onClose}
                    className="text-xs font-bold text-[#D9531E] hover:underline inline-flex items-center gap-1"
                  >
                    <span>View Full Product Details & Ingredients</span>
                    <span>&rarr;</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
