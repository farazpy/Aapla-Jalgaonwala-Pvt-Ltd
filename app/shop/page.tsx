'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { SEO } from '@/components/seo/SEO';
import { Container } from '@/components/ui/Container';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { ProductGrid } from '@/components/product/ProductGrid';
import { initialCategories } from '@/data/categories';
import { initialProducts } from '@/data/products';
import { useWishlist } from '@/context/WishlistContext';
import { Product, Category } from '@/types';
import {
  Filter,
  SlidersHorizontal,
  X,
  Search,
  Sparkles,
  Grid,
  List,
  ChevronDown,
  RotateCcw,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const FLAVOUR_OPTIONS = [
  { label: 'All Flavours', value: 'all' },
  { label: 'Salty / Classic', value: 'classic' },
  { label: 'Spicy Masala', value: 'spicy' },
  { label: 'Tangy & Chatpata', value: 'tangy' },
  { label: 'Cheesy & Creamy', value: 'cheesy' },
  { label: 'Fresh Pudina', value: 'fresh' },
  { label: 'Fusion / Experimental', value: 'experimental' }
];

function ShopContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const showWishlistOnly = searchParams.get('wishlist') === 'true';
  const urlCategory = searchParams.get('category') || 'all';
  const urlQuery = searchParams.get('q') || '';

  const { wishlist } = useWishlist();

  const [products, setProducts] = useState<Product[]>(() => initialProducts);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch categories from API
  useEffect(() => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(json => {
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setCategories(json.data);
        }
      })
      .catch(() => {});
  }, []);

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState<string>(urlCategory);
  const [selectedFlavour, setSelectedFlavour] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>(urlQuery);
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(1000);
  const [sortBy, setSortBy] = useState<string>('featured');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Fetch products from API when filters change
  useEffect(() => {
    if (showWishlistOnly) return;

    let isMounted = true;
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (selectedCategory && selectedCategory !== 'all') params.set('category', selectedCategory);
        if (selectedFlavour && selectedFlavour !== 'all') params.set('flavour', selectedFlavour);
        if (searchQuery.trim()) params.set('q', searchQuery.trim());
        if (minPrice > 0) params.set('minPrice', minPrice.toString());
        if (maxPrice < 1000) params.set('maxPrice', maxPrice.toString());
        if (sortBy) params.set('sort', sortBy);

        const res = await fetch(`/api/products?${params.toString()}`);
        const json = await res.json();
        if (isMounted) {
          if (json.success && json.data && json.data.length > 0) {
            setProducts(json.data);
          } else {
            // Fallback to filtered initialProducts if database is unseeded
            let fallback = [...initialProducts];
            if (selectedCategory && selectedCategory !== 'all') {
              fallback = fallback.filter(p => p.category === selectedCategory || p.categoryId === selectedCategory);
            }
            setProducts(fallback);
          }
        }
      } catch (err) {
        console.error('Error fetching products:', err);
        if (isMounted) {
          let fallback = [...initialProducts];
          if (selectedCategory && selectedCategory !== 'all') {
            fallback = fallback.filter(p => p.category === selectedCategory || p.categoryId === selectedCategory);
          }
          setProducts(fallback);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchProducts();
    return () => {
      isMounted = false;
    };
  }, [selectedCategory, selectedFlavour, searchQuery, minPrice, maxPrice, sortBy, showWishlistOnly]);

  const handleResetFilters = () => {
    setSelectedCategory('all');
    setSelectedFlavour('all');
    setSearchQuery('');
    setMinPrice(0);
    setMaxPrice(1000);
    setSortBy('featured');
    router.push('/shop');
  };

  const hasActiveFilters =
    selectedCategory !== 'all' ||
    selectedFlavour !== 'all' ||
    searchQuery.trim() !== '' ||
    minPrice > 0 ||
    maxPrice < 1000;

  return (
    <div className="py-8 md:py-16 bg-[#FAF6ED] min-h-screen">
      <SEO
        title={showWishlistOnly ? 'Saved Favorites | Aapla Jalgaonwala' : 'Shop Authentic Jalgaon Snacks & Masalas | Aapla Jalgaonwala'}
        description="Browse our farm-fresh raw banana chips, artisanal farsaan, daily kitchen masalas, chutneys, and gift combos."
      />

      <Container>
        {/* Page Banner Header */}
        <div className="mb-8 text-center max-w-3xl mx-auto">
          <SectionHeading
            eyebrow={showWishlistOnly ? 'Saved Favorites' : 'Aapla Jalgaonwala Shop'}
            title={showWishlistOnly ? 'Your Wishlist' : 'Authentic Khandeshi Collection'}
            subtitle={
              showWishlistOnly
                ? 'Your handpicked savory Jalgaon chips and masalas.'
                : '100% farm-sourced raw banana chips, stone-ground masalas, crisp farsaan, and chatpata treats delivered across India.'
            }
          />
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-white rounded-3xl border border-stone-200/80 p-4 shadow-xs mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Search Box inside Shop */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search in shop..."
              className="w-full pl-10 pr-8 py-2.5 bg-stone-50 border border-stone-200 rounded-2xl text-xs font-semibold text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#D9531E]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center justify-between w-full sm:w-auto gap-3">
            {/* Mobile Filter Button Trigger */}
            <button
              onClick={() => setIsMobileFilterOpen(true)}
              className="lg:hidden flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-100 text-amber-900 text-xs font-bold border border-amber-200"
            >
              <SlidersHorizontal className="w-4 h-4 text-[#D9531E]" />
              <span>Filters</span>
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-[#9B111E]" />
              )}
            </button>

            {/* Reset Filters */}
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="text-xs font-bold text-stone-500 hover:text-[#9B111E] flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            )}

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-stone-500 hidden md:inline">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-stone-50 border border-stone-200 rounded-2xl px-3 py-2.5 text-xs font-bold text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#D9531E]"
              >
                <option value="featured">Featured First</option>
                <option value="popular">Bestsellers</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="newest">New Releases</option>
                <option value="name-az">Name: A to Z</option>
              </select>
            </div>
          </div>
        </div>

        {/* Main Content Layout: Sidebar + Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          {/* Desktop Filter Sidebar */}
          <aside className="hidden lg:block lg:col-span-1 bg-white p-6 rounded-3xl border border-stone-200/80 shadow-xs space-y-6 sticky top-24">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
              <h3 className="font-extrabold text-sm text-stone-900 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-[#D9531E]" />
                <span>Refine Catalogue</span>
              </h3>
              {hasActiveFilters && (
                <button
                  onClick={handleResetFilters}
                  className="text-[11px] font-bold text-[#9B111E] hover:underline"
                >
                  Clear All
                </button>
              )}
            </div>

            {/* Categories Filter */}
            <div>
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-stone-400 mb-3">
                Categories
              </h4>
              <div className="space-y-1">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                    selectedCategory === 'all'
                      ? 'bg-[#9B111E] text-white shadow-xs'
                      : 'text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <span>All Categories</span>
                  {selectedCategory === 'all' && <Check className="w-3.5 h-3.5" />}
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.slug)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                      selectedCategory === cat.slug
                        ? 'bg-[#9B111E] text-white shadow-xs'
                        : 'text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    <span>{cat.name}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${selectedCategory === cat.slug ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-500'}`}>
                      {cat.productCount}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Flavour Filter */}
            <div className="pt-4 border-t border-stone-100">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-stone-400 mb-3">
                Flavour Profile
              </h4>
              <div className="space-y-1">
                {FLAVOUR_OPTIONS.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setSelectedFlavour(f.value)}
                    className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-between ${
                      selectedFlavour === f.value
                        ? 'bg-amber-100 text-amber-900 font-bold'
                        : 'text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    <span>{f.label}</span>
                    {selectedFlavour === f.value && <Sparkles className="w-3 h-3 text-[#D9531E]" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Filter */}
            <div className="pt-4 border-t border-stone-100">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-stone-400 mb-3">
                Max Price: ₹{maxPrice}
              </h4>
              <input
                type="range"
                min="40"
                max="1000"
                step="10"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-[#9B111E] cursor-pointer"
              />
              <div className="flex justify-between text-[11px] font-bold text-stone-500 mt-1">
                <span>₹40</span>
                <span>₹1000+</span>
              </div>
            </div>
          </aside>

          {/* Product Grid Area */}
          <main className="lg:col-span-3">
            <ProductGrid
              products={showWishlistOnly ? wishlist : products}
              isLoading={isLoading}
              viewMode={viewMode}
              emptyTitle={
                showWishlistOnly
                  ? 'Your Wishlist is Empty'
                  : 'No Jalgaon Snacks Found'
              }
              emptySubtitle={
                showWishlistOnly
                  ? 'Click the heart icon on any banana chips or masala to save it here.'
                  : 'Try clearing your active filters or search terms.'
              }
            />
          </main>
        </div>
      </Container>

      {/* Mobile Drawer Filter Overlay */}
      <AnimatePresence>
        {isMobileFilterOpen && (
          <div className="fixed inset-0 z-50 flex justify-end bg-stone-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-xs bg-white h-full shadow-2xl p-6 flex flex-col justify-between overflow-y-auto"
            >
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-stone-200 mb-6">
                  <h3 className="font-extrabold text-base text-stone-900 flex items-center gap-2">
                    <Filter className="w-5 h-5 text-[#D9531E]" />
                    <span>Filter Products</span>
                  </h3>
                  <button
                    onClick={() => setIsMobileFilterOpen(false)}
                    className="p-1 rounded-full hover:bg-stone-100"
                  >
                    <X className="w-5 h-5 text-stone-500" />
                  </button>
                </div>

                {/* Categories */}
                <div className="mb-6">
                  <h4 className="text-xs font-extrabold uppercase text-stone-400 mb-3">Categories</h4>
                  <div className="space-y-1">
                    <button
                      onClick={() => setSelectedCategory('all')}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold ${
                        selectedCategory === 'all' ? 'bg-[#9B111E] text-white' : 'text-stone-700'
                      }`}
                    >
                      All Categories
                    </button>
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.slug)}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold ${
                          selectedCategory === cat.slug ? 'bg-[#9B111E] text-white' : 'text-stone-700'
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Flavours */}
                <div className="mb-6">
                  <h4 className="text-xs font-extrabold uppercase text-stone-400 mb-3">Flavour Profile</h4>
                  <div className="space-y-1">
                    {FLAVOUR_OPTIONS.map((f) => (
                      <button
                        key={f.value}
                        onClick={() => setSelectedFlavour(f.value)}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold ${
                          selectedFlavour === f.value ? 'bg-amber-100 text-amber-900 font-bold' : 'text-stone-600'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-stone-200 space-y-2">
                <button
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="w-full py-3 bg-[#9B111E] text-white font-bold text-xs rounded-xl shadow-md"
                >
                  Apply Filters ({products.length} Products)
                </button>
                <button
                  onClick={handleResetFilters}
                  className="w-full py-2 bg-stone-100 text-stone-700 font-bold text-xs rounded-xl"
                >
                  Clear All
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-stone-500">Loading Jalgaon shop...</div>}>
      <ShopContent />
    </Suspense>
  );
}
