'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, CheckCircle2, X, ArrowRight } from 'lucide-react';
import { CartItem, Product, ProductVariant } from '@/types';
import { getReferralCookie, setReferralCookie, clearReferralCookie } from '@/utils/referralCookie';
import { Analytics } from '@/services/analyticsTracker';

export interface AppliedCouponInfo {
  code: string;
  discountAmount: number;
  autoApplyTitle?: string;
  isAutoApplied?: boolean;
  isPartnerCode?: boolean;
  partnerName?: string;
  type?: string;
  value?: number;
}

export interface CartToastData {
  id: string;
  product: Product;
  variant?: ProductVariant;
  quantity: number;
  message: string;
}

interface CartContextType {
  cart: CartItem[];
  isLoaded: boolean;
  addToCart: (product: Product, variant?: ProductVariant, quantity?: number, openCart?: boolean) => void;
  removeFromCart: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
  appliedCoupon: AppliedCouponInfo | null;
  applyCouponCode: (code: string) => Promise<{ success: boolean; message?: string; coupon?: AppliedCouponInfo }>;
  removeAppliedCoupon: () => void;
  discountAmount: number;
  shippingFee: number;
  finalTotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedCart = localStorage.getItem('aapla_cart');
        if (savedCart && savedCart !== 'undefined' && savedCart !== 'null') {
          const parsed = JSON.parse(savedCart);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch (e) {
        console.warn('Error reading aapla_cart from localStorage:', e);
      }
    }
    return [];
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCouponInfo | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedCoupon = localStorage.getItem('aapla_applied_coupon');
        if (savedCoupon && savedCoupon !== 'undefined' && savedCoupon !== 'null') {
          const parsedCpn = JSON.parse(savedCoupon);
          if (parsedCpn && parsedCpn.code) return parsedCpn;
        }
      } catch (e) {
        console.warn('Error reading aapla_applied_coupon:', e);
      }
    }
    return null;
  });
  const [manuallyRemoved, setManuallyRemoved] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('ajw_coupon_removed') === 'true';
    }
    return false;
  });
  const [cartToast, setCartToast] = useState<CartToastData | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Safely verify and re-sync from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('aapla_cart');
      if (savedCart && savedCart !== 'undefined' && savedCart !== 'null') {
        const parsed = JSON.parse(savedCart);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCart(parsed);
        }
      }

      const savedCoupon = localStorage.getItem('aapla_applied_coupon');
      if (savedCoupon && savedCoupon !== 'undefined' && savedCoupon !== 'null') {
        const parsedCpn = JSON.parse(savedCoupon);
        if (parsedCpn && parsedCpn.code) {
          setAppliedCoupon(parsedCpn);
        }
      }
    } catch (e) {
      console.error('Error loading cart/coupon state:', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Persist cart & coupon to localStorage whenever they change
  useEffect(() => {
    if (!isLoaded) return;
    try {
      const safeCart = cart.map((item) => ({
        product: item.product,
        selectedVariant: item.selectedVariant,
        quantity: item.quantity,
      }));
      localStorage.setItem('aapla_cart', JSON.stringify(safeCart));

      if (appliedCoupon) {
        localStorage.setItem('aapla_applied_coupon', JSON.stringify(appliedCoupon));
      } else {
        localStorage.removeItem('aapla_applied_coupon');
      }
    } catch (e) {
      console.error('Error saving cart/coupon state:', e);
    }
  }, [cart, appliedCoupon, isLoaded]);

  const subtotal = cart.reduce((acc, item) => {
    const itemPrice = item.selectedVariant ? item.selectedVariant.price : item.product.price;
    return acc + itemPrice * item.quantity;
  }, 0);

  // Auto-revalidate or auto-apply coupon when subtotal or cart items change
  useEffect(() => {
    if (!isLoaded || subtotal === 0) {
      if (subtotal === 0 && appliedCoupon) {
        setAppliedCoupon(null);
      }
      return;
    }

    let isMounted = true;

    // 1. If a coupon is already applied, re-validate discount amount against new subtotal
    if (appliedCoupon) {
      fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: appliedCoupon.code, subtotal, cartTotal: subtotal, items: cart })
      })
        .then(r => r.json())
        .then(j => {
          if (isMounted && j.success && j.data) {
            setAppliedCoupon(prev => prev ? {
              ...prev,
              discountAmount: j.data.discount ?? prev.discountAmount
            } : null);
          } else if (isMounted && (!j.success || !j.data)) {
            // Coupon no longer valid for updated subtotal/items
            setAppliedCoupon(null);
          }
        })
        .catch(() => {});
      return;
    }

    // 2. If no coupon is applied and user hasn't manually removed one, check referral cookie or auto-apply
    if (!manuallyRemoved && !appliedCoupon) {
      const activeRef = getReferralCookie();
      if (activeRef && activeRef.code) {
        // Automatically apply the Women Partner referral coupon from 15-minute cookie
        fetch('/api/coupons/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: activeRef.code, subtotal, cartTotal: subtotal, items: cart })
        })
          .then(r => r.json())
          .then(j => {
            if (isMounted && j.success && j.data) {
              const partnerName = j.data.partnerName || activeRef.partnerName || 'Woman Partner';
              setAppliedCoupon({
                code: j.data.coupon?.code || activeRef.code,
                discountAmount: j.data.discount || 0,
                autoApplyTitle: `Discount from ${partnerName}`,
                isAutoApplied: true,
                isPartnerCode: true,
                partnerName: partnerName,
                type: j.data.coupon?.type || 'percentage',
                value: j.data.coupon?.value || 4.0
              });
            } else if (isMounted) {
              // Fallback to standard auto-apply if referral code is no longer valid
              checkStandardAutoApply(isMounted);
            }
          })
          .catch(() => {
            if (isMounted) checkStandardAutoApply(isMounted);
          });
      } else {
        checkStandardAutoApply(isMounted);
      }
    }

    function checkStandardAutoApply(mounted: boolean) {
      fetch('/api/coupons/auto-apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subtotal, cartTotal: subtotal, items: cart })
      })
        .then(r => r.json())
        .then(j => {
          if (mounted && j.success && j.data?.applied && j.data?.coupon) {
            setAppliedCoupon({
              code: j.data.coupon.code,
              discountAmount: j.data.discount,
              autoApplyTitle: j.data.autoApplyTitle || j.data.coupon.autoApplyTitle || 'Special Offer',
              isAutoApplied: true,
              type: j.data.coupon.type,
              value: j.data.coupon.value
            });
          }
        })
        .catch(err => console.warn('Auto-apply coupon check error:', err));
    }

    return () => { isMounted = false; };
  }, [subtotal, cart, isLoaded, manuallyRemoved, appliedCoupon?.code]);

  const applyCouponCode = async (code: string): Promise<{ success: boolean; message?: string; coupon?: AppliedCouponInfo }> => {
    if (!code || !code.trim()) {
      return { success: false, message: 'Please enter a valid coupon code.' };
    }

    try {
      const cleanCode = code.trim().toUpperCase();
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: cleanCode, subtotal, cartTotal: subtotal, items: cart })
      });
      const json = await res.json();

      if (json.success && json.data) {
        const isPartner = Boolean(json.data.isPartnerCode);
        const partnerName = json.data.partnerName || (isPartner ? 'Woman Partner' : undefined);
        const info: AppliedCouponInfo = {
          code: json.data.coupon?.code || cleanCode,
          discountAmount: json.data.discount || 0,
          isAutoApplied: false,
          isPartnerCode: isPartner,
          partnerName: partnerName,
          autoApplyTitle: isPartner ? `Discount from ${partnerName}` : (json.data.coupon?.autoApplyTitle || 'Special Discount'),
          type: json.data.coupon?.type,
          value: json.data.coupon?.value
        };

        if (isPartner) {
          setReferralCookie(cleanCode, partnerName);
        }

        Analytics.trackCouponApply(cleanCode, true, json.data.discount || 0);

        setAppliedCoupon(info);
        setManuallyRemoved(false);
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('ajw_coupon_removed');
        }
        return {
          success: true,
          coupon: info,
          message: isPartner
            ? `Discount from ${partnerName} applied! Saved ₹${info.discountAmount} (${info.value || 4}% OFF).`
            : `Discount of ₹${info.discountAmount} applied!`
        };
      } else {
        Analytics.trackCouponApply(cleanCode, false);
        return { success: false, message: json.error?.message || json.message || 'Invalid coupon or promo code.' };
      }
    } catch (err: any) {
      return { success: false, message: err.message || 'Failed to validate coupon code.' };
    }
  };

  const removeAppliedCoupon = () => {
    setAppliedCoupon(null);
    setManuallyRemoved(true);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('ajw_coupon_removed', 'true');
    }
    clearReferralCookie();
    localStorage.removeItem('aapla_applied_coupon');
  };

  const addToCart = (product: Product, variant?: ProductVariant, quantity = 1, openCart = false) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.product.id === product.id && item.selectedVariant?.id === variant?.id
      );

      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += quantity;
        return updated;
      } else {
        return [...prev, { product, selectedVariant: variant, quantity }];
      }
    });

    const price = variant ? variant.price : (product.salePrice || product.price);
    Analytics.trackAddToCart({
      id: product.id,
      name: product.name,
      price,
      quantity
    });

    // Trigger smooth Toast Notification
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setCartToast({
      id: `${product.id}_${Date.now()}`,
      product,
      variant,
      quantity,
      message: 'Added to cart'
    });

    toastTimeoutRef.current = setTimeout(() => {
      setCartToast(null);
    }, 3200);

    if (openCart) {
      setIsCartOpen(true);
    }
  };

  const removeFromCart = (productId: string, variantId?: string) => {
    const item = cart.find(
      (it) => it.product.id === productId && it.selectedVariant?.id === variantId
    );
    if (item) {
      Analytics.trackRemoveFromCart({
        id: item.product.id,
        name: item.product.name,
        price: item.selectedVariant ? item.selectedVariant.price : (item.product.salePrice || item.product.price)
      });
    }

    setCart((prev) =>
      prev.filter(
        (item) => !(item.product.id === productId && item.selectedVariant?.id === variantId)
      )
    );
  };

  const updateQuantity = (productId: string, quantity: number, variantId?: string) => {
    if (quantity <= 0) {
      removeFromCart(productId, variantId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id === productId && item.selectedVariant?.id === variantId) {
          return { ...item, quantity };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setCart([]);
    setAppliedCoupon(null);
    localStorage.removeItem('aapla_applied_coupon');
  };

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const shippingFee = subtotal >= 499 || subtotal === 0 ? 0 : 40;
  const finalTotal = Math.max(0, subtotal - discountAmount + shippingFee);

  const toastItemImage = cartToast?.product?.image || (cartToast?.product?.images && cartToast.product.images[0]?.url) || '';
  const toastItemPrice = cartToast?.variant ? cartToast.variant.price : (cartToast?.product?.price || 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        isLoaded,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        subtotal,
        isCartOpen,
        setIsCartOpen,
        appliedCoupon,
        applyCouponCode,
        removeAppliedCoupon,
        discountAmount,
        shippingFee,
        finalTotal
      }}
    >
      {children}

      {/* Smooth Ajax Add to Cart Toast Notification */}
      <AnimatePresence>
        {cartToast && (
          <motion.div
            key={cartToast.id}
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 24, stiffness: 350 }}
            className="fixed z-[9999] bottom-20 sm:bottom-6 right-3 sm:right-6 max-w-sm w-[calc(100vw-24px)] sm:w-auto pointer-events-auto"
          >
            <div className="bg-stone-900/95 text-white backdrop-blur-md px-3.5 py-3 rounded-2xl border border-emerald-500/40 shadow-2xl shadow-black/50 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                {toastItemImage && (
                  <img
                    src={toastItemImage}
                    alt={cartToast.product.name}
                    className="w-10 h-10 rounded-lg object-cover bg-stone-800 border border-stone-700 shrink-0"
                  />
                )}
                <div className="min-w-0 pr-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-black uppercase text-emerald-400 tracking-wider">Added to cart</span>
                    <span className="text-[10px] text-stone-400 font-medium">({cartToast.quantity > 1 ? `${cartToast.quantity} items` : '1 item'})</span>
                  </div>
                  <p className="text-xs font-bold text-white truncate max-w-[150px] sm:max-w-[170px]">
                    {cartToast.product.name}
                  </p>
                  <p className="text-[11px] text-amber-300 font-semibold font-mono">
                    ₹{toastItemPrice * cartToast.quantity}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setCartToast(null);
                    setIsCartOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-[#9B111E] hover:bg-[#800E19] text-white text-[11px] font-bold transition-all flex items-center gap-1 shadow-md shadow-[#9B111E]/30 cursor-pointer"
                >
                  <span>View Cart</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => setCartToast(null)}
                  className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
                  title="Close notification"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
};
