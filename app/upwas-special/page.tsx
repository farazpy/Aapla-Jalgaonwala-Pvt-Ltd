'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SEO } from '@/components/seo/SEO';
import { Container } from '@/components/ui/Container';
import { ProductGrid } from '@/components/product/ProductGrid';
import { Product } from '@/types';
import { initialProducts } from '@/data/products';
import {
  Sparkles,
  Search,
  SlidersHorizontal,
  Plus,
  ShieldCheck,
  Flame,
  Wheat,
  Heart,
  ChevronRight,
  RotateCcw,
  CheckCircle2,
  Lock,
  SunMedium,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const UPWAS_FILTER_PILLS = [
  { id: 'all', label: 'All Fasting Specials' },
  { id: 'banana', label: 'Rock Salt Banana Chips' },
  { id: 'potato', label: 'Potato Wafers' },
  { id: 'sabudana', label: 'Farali Sabudana & Chivda' },
  { id: 'rajgira', label: 'Rajgira Crunch' },
  { id: 'spicy', label: 'Teekha Farali' }
];

export default function UpwasSpecialPage() {
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>(() => {
    return initialProducts.filter(
      p =>
        p.category === 'upwas-special' ||
        p.categoryId === 'upwas-special' ||
        (p.tags && p.tags.some(t => /upwas|farali|fasting|sendha/i.test(t))) ||
        /upwas|farali|sendha/i.test(p.name)
    );
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSubFilter, setActiveSubFilter] = useState('all');
  const [maxPrice, setMaxPrice] = useState(500);
  const [sortBy, setSortBy] = useState('featured');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('ajw_admin_authenticated') === 'true';
    }
    return false;
  });

  useEffect(() => {
    let isMounted = true;
    const fetchUpwasProducts = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/products');
        const json = await res.json();
        if (isMounted) {
          if (json.success && Array.isArray(json.data) && json.data.length > 0) {
            const upwasItems = json.data.filter(
              (p: Product) =>
                p.category === 'upwas-special' ||
                p.categoryId === 'upwas-special' ||
                (p.categoryName && /upwas/i.test(p.categoryName)) ||
                (p.tags && p.tags.some(t => /upwas|farali|fasting|sendha/i.test(t))) ||
                /upwas|farali|sendha/i.test(p.name)
            );
            if (upwasItems.length > 0) {
              setProducts(upwasItems);
            } else {
              // Fallback to initialProducts Upwas items
              setProducts(
                initialProducts.filter(
                  p =>
                    p.category === 'upwas-special' ||
                    p.categoryId === 'upwas-special' ||
                    (p.tags && p.tags.some(t => /upwas|farali|fasting|sendha/i.test(t))) ||
                    /upwas|farali|sendha/i.test(p.name)
                )
              );
            }
          }
        }
      } catch (err) {
        console.error('Failed to load upwas special products:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchUpwasProducts();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredProducts = useMemo(() => {
    let list = [...products];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        p =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          (p.flavour && p.flavour.toLowerCase().includes(q)) ||
          (p.tags && p.tags.some(t => t.toLowerCase().includes(q)))
      );
    }

    if (activeSubFilter !== 'all') {
      list = list.filter(p => {
        const text = `${p.name} ${p.flavour || ''} ${(p.tags || []).join(' ')} ${p.description}`.toLowerCase();
        if (activeSubFilter === 'banana') return text.includes('banana') || text.includes('kela');
        if (activeSubFilter === 'potato') return text.includes('potato') || text.includes('batata') || text.includes('wafer');
        if (activeSubFilter === 'sabudana') return text.includes('sabudana') || text.includes('sago') || text.includes('chivda');
        if (activeSubFilter === 'rajgira') return text.includes('rajgira') || text.includes('amaranth');
        if (activeSubFilter === 'spicy') return text.includes('teekha') || text.includes('spicy') || text.includes('masala');
        return true;
      });
    }

    if (maxPrice < 500) {
      list = list.filter(p => p.price <= maxPrice);
    }

    switch (sortBy) {
      case 'price-low':
        list.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        list.sort((a, b) => b.price - a.price);
        break;
      case 'popular':
        list.sort((a, b) => (b.isBestSeller ? 1 : 0) - (a.isBestSeller ? 1 : 0));
        break;
      case 'newest':
        list.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
        break;
      case 'featured':
      default:
        list.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
        break;
    }

    return list;
  }, [products, searchQuery, activeSubFilter, maxPrice, sortBy]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setActiveSubFilter('all');
    setMaxPrice(500);
    setSortBy('featured');
  };

  return (
    <div className="py-8 md:py-16 bg-[#FAF6ED] min-h-screen">
      <SEO
        title="Upwas Special (उपवास स्पेशल) | Fasting Savouries & Farali Snacks | Aapla Jalgaonwala"
        description="Explore 100% Satvik Upwas snacks made with pure Himalayan Sendha Namak (Rock Salt), crispy Sabudana, fresh Jalgaon potatoes and banana chips for your holy fasts."
      />

      <Container>
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs font-semibold text-stone-500 mb-6">
          <Link href="/" className="hover:text-[#9B111E] transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
          <Link href="/shop" className="hover:text-[#9B111E] transition-colors">
            Shop
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
          <span className="text-amber-800 font-bold">Upwas Special (उपवास)</span>
        </nav>

        {/* Hero Festive Banner */}
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-amber-700 via-amber-800 to-[#9B111E] text-white p-6 sm:p-10 md:p-12 shadow-xl mb-10 border border-amber-600/30">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-amber-400/20 to-transparent pointer-events-none" />
          <div className="relative z-10 max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-400/20 border border-amber-300/30 text-amber-200 text-xs font-black uppercase tracking-wider backdrop-blur-xs">
              <SunMedium className="w-4 h-4 text-amber-300 animate-spin-slow" />
              <span>100% Satvik Fasting Delicacies</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight">
              Upwas Special <span className="text-amber-300">उपवास स्पेशल</span>
            </h1>

            <p className="text-sm sm:text-base text-stone-200 leading-relaxed font-medium">
              Pure, wholesome, and delicious fasting snacks crafted strictly with <strong>Himalayan Sendha Namak (Rock Salt)</strong>, 
              fresh raw bananas, crisp potato wafers, and crunchy Sabudana farali mixes in dedicated Satvik setups.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3 sm:gap-6 text-xs text-amber-100 font-bold">
              <div className="flex items-center gap-1.5 bg-black/20 px-3 py-1.5 rounded-xl border border-white/10">
                <CheckCircle2 className="w-4 h-4 text-amber-300" />
                <span>Pure Sendha Namak</span>
              </div>
              <div className="flex items-center gap-1.5 bg-black/20 px-3 py-1.5 rounded-xl border border-white/10">
                <ShieldCheck className="w-4 h-4 text-amber-300" />
                <span>No Table Salt / Zero Onions</span>
              </div>
              <div className="flex items-center gap-1.5 bg-black/20 px-3 py-1.5 rounded-xl border border-white/10">
                <Flame className="w-4 h-4 text-amber-300" />
                <span>Fresh Groundnut Oil</span>
              </div>
            </div>
          </div>

          {/* Admin Management Quick Link Button */}
          <div className="mt-6 pt-6 border-t border-white/15 flex flex-wrap items-center justify-between gap-4">
            <p className="text-xs text-amber-200 font-semibold">
              Showing <strong>{filteredProducts.length}</strong> fasting-ready snacks
            </p>

            <div className="flex items-center gap-3">
              <Link
                href="/admin/products/add?category=upwas-special"
                className="inline-flex items-center gap-2 px-4 py-2 bg-amber-400 hover:bg-amber-300 text-amber-950 text-xs font-black rounded-xl shadow-md transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Upwas Product (Admin)</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Filter Sub-Pills Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 no-scrollbar">
          {UPWAS_FILTER_PILLS.map(pill => (
            <button
              key={pill.id}
              onClick={() => setActiveSubFilter(pill.id)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                activeSubFilter === pill.id
                  ? 'bg-[#9B111E] text-white shadow-md'
                  : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200/80 shadow-2xs'
              }`}
            >
              <span>{pill.label}</span>
              {activeSubFilter === pill.id && <Check className="w-3.5 h-3.5" />}
            </button>
          ))}
        </div>

        {/* Controls Bar (Search + Sort + Price) */}
        <div className="bg-white rounded-3xl border border-stone-200/80 p-4 shadow-xs mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search in Upwas Special..."
              className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-2xl text-xs font-semibold text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#9B111E]"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between w-full md:w-auto gap-4">
            {/* Price Filter */}
            <div className="flex items-center gap-3 bg-stone-50 px-3.5 py-2 rounded-2xl border border-stone-200">
              <span className="text-xs font-bold text-stone-600">Max: ₹{maxPrice}</span>
              <input
                type="range"
                min="50"
                max="500"
                step="10"
                value={maxPrice}
                onChange={e => setMaxPrice(Number(e.target.value))}
                className="w-24 accent-[#9B111E] cursor-pointer"
              />
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-stone-500 hidden sm:inline">Sort:</span>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="bg-stone-50 border border-stone-200 rounded-2xl px-3 py-2.5 text-xs font-bold text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#9B111E]"
              >
                <option value="featured">Featured Fasting Specials</option>
                <option value="popular">Bestsellers</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="newest">New Upwas Launches</option>
              </select>
            </div>

            {(searchQuery || activeSubFilter !== 'all' || maxPrice < 500) && (
              <button
                onClick={handleResetFilters}
                className="text-xs font-bold text-[#9B111E] hover:underline flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Product Grid Section */}
        <div className="mb-16">
          <ProductGrid
            products={filteredProducts}
            isLoading={isLoading}
            emptyTitle="No Upwas items found matching your filters"
            emptySubtitle="Try resetting your filters or add new Upwas products via the Admin panel."
          />
        </div>

        {/* Fasting & Satvik Trust Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12 border-t border-stone-200/80">
          <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-xs space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-800 font-bold mb-3">
              <ShieldCheck className="w-5 h-5 text-[#9B111E]" />
            </div>
            <h3 className="text-sm font-extrabold text-stone-900">100% Sendha Namak Guaranteed</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              We never use regular refined table salt in our Upwas batches. Every batch is seasoned with pure rock salt.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-xs space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-800 font-bold mb-3">
              <Flame className="w-5 h-5 text-[#D9531E]" />
            </div>
            <h3 className="text-sm font-extrabold text-stone-900">Dedicated Fasting Equipment</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Fried in separate pure groundnut oil kettles with no cross-contamination with garlic, onion, or non-fasting grains.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-xs space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-800 font-bold mb-3">
              <Sparkles className="w-5 h-5 text-amber-600" />
            </div>
            <h3 className="text-sm font-extrabold text-stone-900">Farm Fresh Khandeshi Quality</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Directly made with freshly harvested Jalgaon raw bananas and crispy potato wafers for unmatched crunch.
            </p>
          </div>
        </div>
      </Container>
    </div>
  );
}
