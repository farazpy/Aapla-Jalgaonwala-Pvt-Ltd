'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, TrendingUp, Sparkles, ArrowRight, ShoppingBag } from 'lucide-react';
import { Product, Category } from '@/types';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchOverlay: React.FC<SearchOverlayProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [popularSearches, setPopularSearches] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      const focusTimer = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(focusTimer);
    }
  }, [isOpen]);

  const handleClose = () => {
    setQuery('');
    setProducts([]);
    onClose();
  };

  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const json = await res.json();
        if (json.success && json.data) {
          setProducts(json.data.products || []);
          setCategories(json.data.categories || []);
          setPopularSearches(json.data.popularSearches || []);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query, isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex flex-col bg-stone-900/60 backdrop-blur-md">
        {/* Top Search Bar Header */}
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          className="bg-white border-b border-stone-200 shadow-md p-4 sm:p-6"
        >
          <div className="max-w-4xl mx-auto relative flex items-center gap-3">
            <Search className="w-6 h-6 text-[#D9531E] shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search banana chips, farsaan, masalas, Pani Poori..."
              className="w-full text-base sm:text-lg font-medium text-stone-900 placeholder:text-stone-400 bg-transparent outline-none"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="p-1 text-stone-400 hover:text-stone-600 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={handleClose}
              className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition-all ml-2 shrink-0"
            >
              ESC
            </button>
          </div>
        </motion.div>

        {/* Results Container */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-4xl w-full mx-auto"
        >
          <div className="bg-white rounded-3xl p-6 shadow-2xl border border-stone-200/80 min-h-[320px]">
            {/* Loading Indicator */}
            {isLoading && (
              <div className="py-12 text-center text-xs text-stone-500 font-medium">
                Searching authentic Jalgaon flavours...
              </div>
            )}

            {!isLoading && query.trim() === '' && (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-stone-400 mb-3">
                    <TrendingUp className="w-4 h-4 text-[#D9531E]" />
                    <span>Popular Flavour Searches</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {popularSearches.map((term) => (
                      <button
                        key={term}
                        onClick={() => setQuery(term)}
                        className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-stone-800 text-xs font-semibold border border-amber-200/60 transition-all flex items-center gap-1.5"
                      >
                        <Sparkles className="w-3 h-3 text-[#D9531E]" />
                        <span>{term}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-xs font-extrabold uppercase tracking-wider text-stone-400 mb-3">
                    Browse Categories
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {categories.map((cat) => (
                      <Link
                        key={cat.id}
                        href={`/shop?category=${cat.slug}`}
                        prefetch={true}
                        onClick={onClose}
                        className="p-3 rounded-2xl bg-stone-50 hover:bg-amber-50 border border-stone-200/60 transition-all text-left group"
                      >
                        <span className="block font-bold text-xs text-stone-900 group-hover:text-[#9B111E]">
                          {cat.name}
                        </span>
                        <span className="text-[10px] text-stone-500">{cat.productCount} products</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {!isLoading && query.trim() !== '' && products.length === 0 && (
              <div className="py-12 text-center">
                <p className="text-base font-bold text-stone-800 mb-1">
                  No flavours matching &ldquo;{query}&rdquo;
                </p>
                <p className="text-xs text-stone-500 mb-4">
                  Try searching for &quot;Banana Chips&quot;, &quot;Pani Poori&quot;, or &quot;Farsaan&quot;.
                </p>
                <Link
                  href="/shop"
                  onClick={onClose}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#9B111E] text-white text-xs font-bold"
                >
                  <span>Browse Full Shop</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}

            {!isLoading && products.length > 0 && (
              <div>
                <div className="text-xs font-extrabold uppercase tracking-wider text-stone-400 mb-4 flex justify-between items-center">
                  <span>Matching Flavour Results ({products.length})</span>
                  <Link
                    href={`/shop?q=${encodeURIComponent(query)}`}
                    onClick={onClose}
                    className="text-[#D9531E] font-bold text-xs hover:underline flex items-center gap-1"
                  >
                    <span>View all in shop</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {products.map((p) => (
                    <Link
                      key={p.id}
                      href={`/product/${p.slug}`}
                      prefetch={true}
                      onClick={onClose}
                      className="flex items-center gap-3 p-3 rounded-2xl hover:bg-amber-50/80 border border-transparent hover:border-amber-200 transition-all group"
                    >
                      <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-amber-100 shrink-0">
                        <Image
                          src={p.images[0]?.url || 'https://picsum.photos/seed/jalgaon/200/200'}
                          alt={p.name}
                          fill
                          className="object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-xs sm:text-sm text-stone-900 group-hover:text-[#9B111E] truncate">
                          {p.name}
                        </h4>
                        <div className="flex items-center gap-2 text-[11px] text-stone-500 mt-0.5">
                          <span className="font-semibold text-[#9B111E]">₹{p.price}</span>
                          <span>•</span>
                          <span>{p.netQuantity}</span>
                          {p.flavour && (
                            <>
                              <span>•</span>
                              <span className="text-amber-800 font-medium">{p.flavour}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
