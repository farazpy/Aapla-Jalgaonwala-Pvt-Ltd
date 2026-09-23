'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product } from '@/types';

interface WishlistContextType {
  wishlist: Product[];
  toggleWishlist: (product: Product) => void;
  isInWishlist: (productId: string) => boolean;
  totalWishlistItems: number;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Safely hydrate from localStorage on mount without causing hydration mismatch
  useEffect(() => {
    try {
      const saved = localStorage.getItem('aapla_wishlist');
      if (saved && saved !== 'undefined' && saved !== 'null') {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          queueMicrotask(() => setWishlist(parsed));
        }
      }
    } catch (e) {
      console.error('Error loading wishlist:', e);
    } finally {
      queueMicrotask(() => setIsLoaded(true));
    }
  }, []);

  // Persist to localStorage whenever wishlist changes after initial load
  useEffect(() => {
    if (!isLoaded) return;
    try {
      const safeWishlist = wishlist.map((product) => ({
        id: product.id,
        slug: product.slug,
        name: product.name,
        category: product.category,
        price: product.price,
        mrp: product.mrp,
        netQuantity: product.netQuantity,
        flavour: product.flavour,
        images: product.images || [],
        isAvailable: product.isAvailable,
        stock: product.stock,
      }));
      localStorage.setItem('aapla_wishlist', JSON.stringify(safeWishlist));
    } catch (e) {
      console.error('Error saving wishlist:', e);
    }
  }, [wishlist, isLoaded]);

  const toggleWishlist = (product: Product) => {
    setWishlist((prev) => {
      const exists = prev.some((p) => p.id === product.id);
      if (exists) {
        return prev.filter((p) => p.id !== product.id);
      } else {
        return [...prev, product];
      }
    });
  };

  const isInWishlist = (productId: string) => {
    return wishlist.some((p) => p.id === productId);
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        toggleWishlist,
        isInWishlist,
        totalWishlistItems: wishlist.length,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within a WishlistProvider');
  return ctx;
};
