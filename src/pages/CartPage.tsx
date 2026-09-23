'use client';

import React from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '@/components/seo/SEO';
import { Container } from '@/components/ui/Container';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { useCart } from '@/context/CartContext';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  Sparkles,
  Check,
  Tag,
  Truck,
  ShieldCheck,
  ArrowLeft
} from 'lucide-react';
import { motion } from 'motion/react';

export default function CartPage() {
  const {
    cart,
    removeFromCart,
    updateQuantity,
    clearCart,
    subtotal,
    totalItems,
    shippingFee
  } = useCart();

  const freeShippingThreshold = 499;
  const remainingForFreeShipping = freeShippingThreshold - subtotal;
  const progressPercent = Math.min(100, (subtotal / freeShippingThreshold) * 100);

  const cartTotalAmount = subtotal + shippingFee;

  if (cart.length === 0) {
    return (
      <div className="py-16 md:py-24 bg-[#FAFAF8] min-h-screen">
        <SEO title="Your Shopping Cart | Aapla Jalgaonwala" description="View your selected Jalgaon banana chips and snacks." />
        <Container>
          <div className="max-w-md mx-auto text-center bg-white p-8 sm:p-12 rounded-3xl border border-stone-200/80 shadow-xs">
            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center text-[#D9531E] mx-auto mb-4">
              <ShoppingBag className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-black text-stone-900 mb-2">Your Cart is Empty</h2>
            <p className="text-xs text-stone-500 mb-6">
              You haven&apos;t added any crunchy Jalgaon banana chips, farsaan, or masalas yet.
            </p>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-[#9B111E] text-white font-bold text-xs shadow-md hover:bg-[#800A14] transition-all"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Explore All Products</span>
            </Link>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="py-8 md:py-16 bg-[#FAFAF8] min-h-screen">
      <SEO title={`Shopping Cart (${totalItems}) | Aapla Jalgaonwala`} description="Review items in your shopping cart before checkout." />

      <Container>
        <div className="mb-6 flex items-center justify-between">
          <Link to="/shop" className="inline-flex items-center gap-2 text-xs font-bold text-stone-600 hover:text-[#9B111E]">
            <ArrowLeft className="w-4 h-4" />
            <span>Continue Shopping</span>
          </Link>
          <button
            onClick={clearCart}
            className="text-xs font-bold text-stone-400 hover:text-red-600 transition-colors flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Cart</span>
          </button>
        </div>

        <SectionHeading
          eyebrow="Shopping Cart"
          title={`Your Cart (${totalItems} ${totalItems === 1 ? 'item' : 'items'})`}
          subtitle="All prices are direct farm-to-table rates."
        />

        {/* Free Shipping Progress */}
        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200/80 mb-8 max-w-4xl">
          <p className="text-xs font-bold text-amber-900 mb-2 flex justify-between items-center">
            {remainingForFreeShipping > 0 ? (
              <span>Add ₹{remainingForFreeShipping} more for <strong>FREE Delivery</strong> across India!</span>
            ) : (
              <span className="text-emerald-700 font-extrabold flex items-center gap-1">
                <Check className="w-4 h-4" /> You unlocked FREE Delivery!
              </span>
            )}
            <span className="text-stone-500 font-semibold">{Math.round(progressPercent)}%</span>
          </p>
          <div className="w-full h-2.5 bg-amber-200/60 rounded-full overflow-hidden">
            <div className="h-full bg-[#D9531E] rounded-full transition-all duration-300" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Cart Items Column (8 cols) - 3 column grid on lg, 2 column grid on mobile */}
          <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cart.map((item) => {
              const itemPrice = item.selectedVariant ? item.selectedVariant.price : item.product.price;
              const imgUrl = item.product.images[0]?.url || 'https://picsum.photos/seed/jalgaon/400/400';

              return (
                <div
                  key={`${item.product.id}-${item.selectedVariant?.id || 'default'}`}
                  className="bg-white rounded-2xl border border-stone-200/80 shadow-2xs flex flex-col justify-between overflow-hidden group transition-all hover:border-[#D9531E]/30"
                >
                  {/* Top Image area & Remove button */}
                  <div className="relative w-full aspect-square bg-amber-50/40 border-b border-stone-100 overflow-hidden">
                    <img
                      loading="lazy"
                      src={imgUrl}
                      alt={item.product.name}
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                    <button
                      onClick={() => removeFromCart(item.product.id, item.selectedVariant?.id)}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 hover:bg-rose-50 text-stone-400 hover:text-red-600 transition-colors shadow-2xs cursor-pointer border border-stone-200/60"
                      title="Remove item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Body Info */}
                  <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <span className="text-[9px] font-black uppercase text-[#D9531E] tracking-wider block">
                        {item.product.category.replace('-', ' ')}
                      </span>
                      <h3 className="text-xs sm:text-sm font-black text-stone-900 mt-0.5 line-clamp-2 min-h-[2.5rem] leading-snug">
                        {item.product.name}
                      </h3>
                      <div className="flex flex-wrap items-center justify-between gap-1.5 mt-2">
                        <span className="text-[10px] sm:text-xs text-stone-500 font-bold bg-stone-100 px-2 py-0.5 rounded-md">
                          {item.selectedVariant ? item.selectedVariant.weight : item.product.netQuantity}
                        </span>
                        <span className="text-xs font-black text-[#9B111E]">
                          ₹{itemPrice} / pack
                        </span>
                      </div>
                    </div>

                    {/* Bottom controls and total price */}
                    <div className="pt-2.5 border-t border-stone-100 space-y-2">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Qty</span>
                        <div className="inline-flex items-center rounded-lg border border-stone-200 bg-stone-50 p-0.5">
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1, item.selectedVariant?.id)}
                            className="w-6 h-6 rounded-md bg-white flex items-center justify-center text-stone-700 hover:bg-stone-200 shadow-3xs cursor-pointer"
                          >
                            <Minus className="w-2.5 h-2.5" />
                          </button>
                          <span className="w-6 text-center font-bold text-xs text-stone-900">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.selectedVariant?.id)}
                            className="w-6 h-6 rounded-md bg-white flex items-center justify-center text-stone-700 hover:bg-stone-200 shadow-3xs cursor-pointer"
                          >
                            <Plus className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Subtotal</span>
                        <span className="text-sm font-black text-[#9B111E]">
                          ₹{itemPrice * item.quantity}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Order Summary Sidebar (4 cols) */}
          <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-stone-200/80 shadow-xs space-y-6">
            <h3 className="font-black text-base text-stone-900 pb-3 border-b border-stone-100">Order Summary</h3>

            {/* Cost Breakdown */}
            <div className="space-y-3 text-xs font-semibold text-stone-600">
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span className="font-bold text-stone-900">₹{subtotal}</span>
              </div>

              <div className="flex justify-between">
                <span>Shipping Fee</span>
                {shippingFee === 0 ? (
                  <span className="font-bold text-emerald-700 uppercase text-[11px]">FREE</span>
                ) : (
                  <span className="font-bold text-stone-900">₹{shippingFee}</span>
                )}
              </div>

              <div className="pt-3 border-t border-stone-200 flex justify-between items-baseline text-sm font-black text-stone-900">
                <span>Total Amount</span>
                <span className="text-2xl text-[#9B111E]">₹{cartTotalAmount}</span>
              </div>
            </div>

            {/* Coupons and Discounts info notice */}
            <div className="p-3.5 bg-amber-50/75 border border-amber-200/70 rounded-2xl text-[11px] leading-relaxed text-[#D9531E] font-medium">
              <div className="flex items-center gap-1.5 font-bold mb-1 text-stone-900">
                <Tag className="w-3.5 h-3.5 text-[#D9531E] shrink-0" />
                <span>Special Offers & Coupons</span>
              </div>
              Coupons, special promo codes, and automated **Woman Partner discounts (4% OFF)** will be calculated and applied automatically on the secure **Checkout page**.
            </div>

            {/* Proceed to Checkout Button */}
            <Link
              to="/checkout"
              className="w-full py-4 rounded-2xl bg-[#9B111E] hover:bg-[#800A14] text-white font-bold text-xs text-center flex items-center justify-center gap-2 shadow-md transition-all"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <div className="pt-2 text-center text-[11px] text-stone-400 flex items-center justify-center gap-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Safe & Secure Indian Payment Gateways & COD Available</span>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
