'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, Product, ProductVariant } from '@/types';

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, variant?: ProductVariant, quantity?: number) => void;
  removeFromCart: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Safely hydrate from localStorage on mount without causing hydration mismatch
  useEffect(() => {
    try {
      const saved = localStorage.getItem('aapla_cart');
      if (saved && saved !== 'undefined' && saved !== 'null') {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          queueMicrotask(() => setCart(parsed));
        }
      }
    } catch (e) {
      console.error('Error loading cart:', e);
    } finally {
      queueMicrotask(() => setIsLoaded(true));
    }
  }, []);

  // Persist to localStorage whenever cart changes after initial load
  useEffect(() => {
    if (!isLoaded) return;
    try {
      const safeCart = cart.map((item) => ({
        product: {
          id: item.product.id,
          slug: item.product.slug,
          name: item.product.name,
          category: item.product.category,
          price: item.product.price,
          mrp: item.product.mrp,
          netQuantity: item.product.netQuantity,
          flavour: item.product.flavour,
          images: item.product.images || [],
          isAvailable: item.product.isAvailable,
          stock: item.product.stock,
        },
        selectedVariant: item.selectedVariant
          ? {
              id: item.selectedVariant.id,
              weight: item.selectedVariant.weight,
              price: item.selectedVariant.price,
              mrp: item.selectedVariant.mrp,
              stock: item.selectedVariant.stock,
            }
          : undefined,
        quantity: item.quantity,
      }));
      localStorage.setItem('aapla_cart', JSON.stringify(safeCart));
    } catch (e) {
      console.error('Error saving cart:', e);
    }
  }, [cart, isLoaded]);

  const addToCart = (product: Product, variant?: ProductVariant, quantity = 1) => {
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
    setIsCartOpen(true);
  };

  const removeFromCart = (productId: string, variantId?: string) => {
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

  const clearCart = () => setCart([]);

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  const subtotal = cart.reduce((acc, item) => {
    const itemPrice = item.selectedVariant ? item.selectedVariant.price : item.product.price;
    return acc + itemPrice * item.quantity;
  }, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        subtotal,
        isCartOpen,
        setIsCartOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
};
