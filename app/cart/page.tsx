'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  const router = useRouter();
  const { cart, removeFromCart, updateQuantity, clearCart, subtotal, totalItems } = useCart();

  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountAmount: number } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  const freeShippingThreshold = 499;
  const remainingForFreeShipping = freeShippingThreshold - subtotal;
  const progressPercent = Math.min(100, (subtotal / freeShippingThreshold) * 100);

  const shippingFee = subtotal >= freeShippingThreshold || subtotal === 0 ? 0 : 40;
  const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const finalTotal = Math.max(0, subtotal - discountAmount + shippingFee);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;

    setIsApplyingCoupon(true);
    setCouponError(null);

    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponInput.trim(), subtotal })
      });
      const json = await res.json();

      if (json.success && json.data) {
        setAppliedCoupon({
          code: json.data.code,
          discountAmount: json.data.discountAmount
        });
        setCouponInput('');
      } else {
        setCouponError(json.error?.message || 'Invalid coupon code');
      }
    } catch (err) {
      console.error('Error validating coupon:', err);
      setCouponError('Failed to validate coupon code.');
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponError(null);
  };

  if (cart.length === 0) {
    return (
      <div className="py-16 md:py-24 bg-[#FAF6ED] min-h-screen">
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
              href="/shop"
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
    <div className="py-8 md:py-16 bg-[#FAF6ED] min-h-screen">
      <SEO title={`Shopping Cart (${totalItems}) | Aapla Jalgaonwala`} description="Review items in your shopping cart before checkout." />

      <Container>
        <div className="mb-6 flex items-center justify-between">
          <Link href="/shop" className="inline-flex items-center gap-2 text-xs font-bold text-stone-600 hover:text-[#9B111E]">
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
          {/* Cart Items Column (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            {cart.map((item) => {
              const itemPrice = item.selectedVariant ? item.selectedVariant.price : item.product.price;
              const imgUrl = item.product.images[0]?.url || 'https://picsum.photos/seed/jalgaon/400/400';

              return (
                <div
                  key={`${item.product.id}-${item.selectedVariant?.id || 'default'}`}
                  className="p-4 sm:p-5 bg-white rounded-3xl border border-stone-200/80 shadow-2xs flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between"
                >
                  <div className="flex gap-4 items-center flex-1">
                    <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-amber-50 shrink-0 border border-stone-200">
                      <Image src={imgUrl} alt={item.product.name} fill className="object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase text-[#D9531E]">{item.product.category.replace('-', ' ')}</span>
                      <h3 className="text-sm font-bold text-stone-900 line-clamp-1">{item.product.name}</h3>
                      <p className="text-xs text-stone-500 font-medium mt-0.5">
                        Net Wt: {item.selectedVariant ? item.selectedVariant.weight : item.product.netQuantity}
                      </p>
                      <div className="text-xs font-bold text-[#9B111E] mt-1">
                        ₹{itemPrice} / pack
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100">
                    <div className="inline-flex items-center rounded-xl border border-stone-300 bg-stone-50 p-1">
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1, item.selectedVariant?.id)}
                        className="w-7 h-7 rounded-lg bg-white flex items-center justify-center text-stone-700 hover:bg-stone-200 shadow-2xs"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-8 text-center font-bold text-xs text-stone-900">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.selectedVariant?.id)}
                        className="w-7 h-7 rounded-lg bg-white flex items-center justify-center text-stone-700 hover:bg-stone-200 shadow-2xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="text-right min-w-[80px]">
                      <span className="text-base font-black text-[#9B111E]">₹{itemPrice * item.quantity}</span>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.product.id, item.selectedVariant?.id)}
                      className="p-2 text-stone-400 hover:text-red-600 transition-colors"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Order Summary Sidebar (4 cols) */}
          <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-stone-200/80 shadow-xs space-y-6">
            <h3 className="font-black text-base text-stone-900 pb-3 border-b border-stone-100">Order Summary</h3>

            {/* Coupon Code Input */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-2 flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-[#D9531E]" />
                <span>Have a Coupon Code?</span>
              </label>

              {appliedCoupon ? (
                <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-emerald-900 uppercase">{appliedCoupon.code}</span>
                    <p className="text-[11px] text-emerald-700">₹{appliedCoupon.discountAmount} discount applied!</p>
                  </div>
                  <button
                    onClick={handleRemoveCoupon}
                    className="text-xs font-bold text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    placeholder="Enter promo code"
                    className="flex-1 px-3.5 py-2 rounded-xl border border-stone-300 text-xs font-bold uppercase focus:outline-none focus:ring-2 focus:ring-[#D9531E]"
                  />
                  <button
                    type="submit"
                    disabled={isApplyingCoupon || !couponInput.trim()}
                    className="px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-bold hover:bg-stone-800 disabled:opacity-50"
                  >
                    {isApplyingCoupon ? '...' : 'Apply'}
                  </button>
                </form>
              )}
              {couponError && <p className="text-[11px] text-red-600 font-medium mt-1">{couponError}</p>}
            </div>

            {/* Cost Breakdown */}
            <div className="space-y-3 pt-3 border-t border-stone-100 text-xs font-semibold text-stone-600">
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span className="font-bold text-stone-900">₹{subtotal}</span>
              </div>

              {appliedCoupon && (
                <div className="flex justify-between text-emerald-700">
                  <span>Coupon Discount</span>
                  <span className="font-bold">-₹{discountAmount}</span>
                </div>
              )}

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
                <span className="text-2xl text-[#9B111E]">₹{finalTotal}</span>
              </div>
            </div>

            {/* Proceed to Checkout Button */}
            <Link
              href="/checkout"
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
