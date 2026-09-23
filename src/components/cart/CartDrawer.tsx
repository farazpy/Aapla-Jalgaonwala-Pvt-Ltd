'use client';

import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight } from 'lucide-react';
import { Drawer } from '../ui/Drawer';
import { Button } from '../ui/Button';
import { IconButton } from '../ui/IconButton';
import { useCart } from '@/context/CartContext';

export const CartDrawer: React.FC = () => {
  const { cart, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity, subtotal, totalItems } = useCart();

  const freeShippingThreshold = 499;
  const progressPercent = Math.min(100, (subtotal / freeShippingThreshold) * 100);
  const remainingForFreeShipping = freeShippingThreshold - subtotal;

  return (
    <Drawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} title={`Your Cart (${totalItems})`}>
      {cart.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full py-12 text-center">
          <div className="w-16 h-16 bg-[#FAF6ED] rounded-full flex items-center justify-center mb-4 text-[#D9531E]">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h4 className="text-lg font-bold text-stone-900 mb-1">Your cart is empty</h4>
          <p className="text-sm text-stone-500 max-w-xs mb-6">
            Explore our authentic Jalgaon banana chips, farsaan & masalas.
          </p>
          <Button onClick={() => setIsCartOpen(false)} variant="primary" size="md">
            Start Shopping
          </Button>
        </div>
      ) : (
        <div className="flex flex-col h-full justify-between">
          {/* Free Shipping Progress */}
          <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200/80 mb-4">
            <p className="text-xs font-semibold text-amber-900 mb-1.5 flex items-center justify-between">
              {remainingForFreeShipping > 0 ? (
                <span>Add ₹{remainingForFreeShipping} more for <strong>FREE Shipping</strong>!</span>
              ) : (
                <span className="text-emerald-700 font-bold">🎉 You unlocked FREE Shipping!</span>
              )}
            </p>
            <div className="w-full h-2 bg-amber-200/60 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#D9531E] rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {cart.map((item) => {
              const itemPrice = item.selectedVariant ? item.selectedVariant.price : item.product.price;
              const imageUrl = item.product.images[0]?.url || 'https://picsum.photos/seed/jalgaon/400/400';

              return (
                <div
                  key={`${item.product.id}-${item.selectedVariant?.id || 'default'}`}
                  className="flex gap-3 p-3 bg-stone-50 rounded-2xl border border-stone-200/60 transition-all hover:bg-stone-100/50"
                >
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-white border border-stone-200 flex-shrink-0">
                    <img loading="lazy"
                      src={imageUrl}
                      alt={item.product.name}
                      loading="lazy"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  <div className="flex-1 flex flex-col justify-between py-0.5">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <h5 className="text-sm font-bold text-stone-900 line-clamp-1">{item.product.name}</h5>
                        <button
                          onClick={() => removeFromCart(item.product.id, item.selectedVariant?.id)}
                          className="text-stone-400 hover:text-red-600 transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-xs text-stone-500 font-medium">
                        {item.selectedVariant ? item.selectedVariant.weight : item.product.netQuantity}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-1.5 bg-white border border-stone-200 rounded-lg p-1">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1, item.selectedVariant?.id)}
                          className="w-5 h-5 flex items-center justify-center text-stone-600 hover:text-stone-900"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold w-6 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.selectedVariant?.id)}
                          className="w-5 h-5 flex items-center justify-center text-stone-600 hover:text-stone-900"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="text-right">
                        <span className="text-sm font-bold text-[#9B111E]">₹{itemPrice * item.quantity}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Drawer Footer Summary */}
          <div className="pt-4 border-t border-stone-200 mt-4 space-y-3">
            <div className="flex items-center justify-between text-stone-600 text-sm">
              <span>Subtotal</span>
              <span className="font-bold text-stone-900 text-base">₹{subtotal}</span>
            </div>
            <p className="text-[11px] text-stone-500">Taxes and shipping calculated at checkout.</p>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Link
                to="/cart"
                onClick={() => setIsCartOpen(false)}
                className="w-full py-3 px-4 rounded-xl border border-stone-300 text-stone-800 font-bold text-xs text-center hover:bg-stone-100 transition-all"
              >
                View Full Cart
              </Link>
              <Link
                to="/checkout"
                onClick={() => setIsCartOpen(false)}
                className="w-full py-3 px-4 rounded-xl bg-[#9B111E] hover:bg-[#800A14] text-white font-bold text-xs text-center flex items-center justify-center gap-1 shadow-md transition-all"
              >
                <span>Checkout</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </Drawer>
  );
};
