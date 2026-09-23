'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  X,
  TrendingUp,
  Sparkles,
  ArrowRight,
  ShoppingBag,
  Info,
  Package,
  Truck,
  HelpCircle,
  PhoneCall,
  Grid,
  ChevronRight,
  Plus,
  Check,
  Building2,
  Users,
  ShieldCheck,
  Flame,
  RotateCcw,
  MessageCircle,
  ArrowUpRight
} from 'lucide-react';
import { Link } from '@/lib/linkCompat';
import { Product, Category } from '@/types';
import { useCart } from '@/context/CartContext';

interface SitePageInfo {
  title: string;
  description: string;
  url: string;
  category: string;
  keywords: string[];
}

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchOverlay: React.FC<SearchOverlayProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'products' | 'categories' | 'info'>('all');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [siteInfo, setSiteInfo] = useState<SitePageInfo[]>([]);
  const [popularSearches, setPopularSearches] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [addedProductId, setAddedProductId] = useState<string | null>(null);

  const { addToCart } = useCart();
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
    setCategories([]);
    setSiteInfo([]);
    setActiveTab('all');
    onClose();
  };

  // Keyboard Escape listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Fetch search data with debounce
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const json = await res.json();
        if (json.success && json.data) {
          if (Array.isArray(json.data)) {
            setProducts(json.data);
            setCategories([]);
            setSiteInfo([]);
          } else {
            setProducts(json.data.products || []);
            setCategories(json.data.categories || []);
            setSiteInfo(json.data.siteInfo || []);
            setPopularSearches(json.data.popularSearches || []);
          }
        }
      } catch (err) {
        console.error('Search API error:', err);
      } finally {
        setIsLoading(false);
      }
    }, 180);

    return () => clearTimeout(timer);
  }, [query, isOpen]);

  const handleQuickAdd = (p: Product, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(p, undefined, 1, false);
    setAddedProductId(p.id);
    setTimeout(() => setAddedProductId(null), 1500);
  };

  const getPageCategoryIcon = (category: string) => {
    switch (category) {
      case 'Account & Orders':
        return <Package className="w-4 h-4 text-emerald-600" />;
      case 'Store Policy':
        return <Truck className="w-4 h-4 text-amber-600" />;
      case 'Special Collection':
        return <Sparkles className="w-4 h-4 text-rose-600" />;
      case 'Business Partnerships':
        return <Building2 className="w-4 h-4 text-indigo-600" />;
      case 'Community Impact':
        return <Users className="w-4 h-4 text-purple-600" />;
      case 'Help & Support':
        return <HelpCircle className="w-4 h-4 text-blue-600" />;
      default:
        return <Info className="w-4 h-4 text-[#D9531E]" />;
    }
  };

  if (!isOpen) return null;

  const totalResults = products.length + categories.length + siteInfo.length;
  const isRefundQuery = /refund|return|cancel|damag|leak|replace|money|policy/i.test(query);

  // Render high-quality Product Grid Card
  const renderProductCard = (p: Product) => {
    const imgUrl = p.images?.[0]?.url || p.imageUrl || p.image || 'https://picsum.photos/seed/jalgaon/300/300';
    const isAdded = addedProductId === p.id;
    const isOutOfStock = Boolean(p.stock <= 0 || p.isAvailable === false);
    const discountPercent = p.mrp && p.mrp > p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0;

    return (
      <div
        key={p.id}
        className="group relative bg-white rounded-2xl border border-stone-200/90 hover:border-amber-400 hover:shadow-lg transition-all duration-200 flex flex-col justify-between overflow-hidden"
      >
        <Link
          to={`/product/${p.slug}`}
          onClick={handleClose}
          className="block flex-1 p-2.5 sm:p-3"
        >
          {/* Product Image */}
          <div className="relative aspect-square rounded-xl overflow-hidden bg-stone-50 mb-2.5 border border-stone-100">
            <img
              src={imgUrl}
              alt={p.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              referrerPolicy="no-referrer"
              loading="lazy"
            />

            {/* Badges Overlay */}
            <div className="absolute top-2 left-2 flex flex-col gap-1 items-start pointer-events-none">
              {/* Pure Veg Indicator */}
              <div className="w-3.5 h-3.5 rounded-xs border border-emerald-600 bg-white flex items-center justify-center shadow-2xs">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              </div>

              {discountPercent > 0 && (
                <span className="text-[9px] font-black text-white bg-[#9B111E] px-1.5 py-0.5 rounded-md shadow-2xs">
                  {discountPercent}% OFF
                </span>
              )}

              {p.isBestSeller && discountPercent === 0 && (
                <span className="text-[9px] font-black text-amber-950 bg-amber-400 px-1.5 py-0.5 rounded-md shadow-2xs flex items-center gap-0.5">
                  <Flame className="w-2.5 h-2.5 fill-amber-950 text-amber-950" />
                  HOT
                </span>
              )}
            </div>

            {p.netQuantity && (
              <div className="absolute top-2 right-2 bg-stone-900/80 backdrop-blur-xs text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md shadow-2xs pointer-events-none">
                {p.netQuantity}
              </div>
            )}

            {isOutOfStock && (
              <div className="absolute inset-0 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center">
                <span className="text-[10px] font-black tracking-wider uppercase text-white bg-red-600 px-2.5 py-1 rounded-lg shadow-sm">
                  Sold Out
                </span>
              </div>
            )}
          </div>

          {/* Product Category & Flavour */}
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className="text-[9px] xs:text-[9.5px] font-extrabold uppercase tracking-wider text-stone-500 truncate">
              {p.category}
            </span>
            {p.flavour && (
              <span className="text-[9px] xs:text-[9.5px] font-bold text-[#D9531E] truncate max-w-[50%]">
                {p.flavour}
              </span>
            )}
          </div>

          {/* Product Name */}
          <h4 className="font-bold text-xs sm:text-sm text-stone-900 group-hover:text-[#9B111E] transition-colors line-clamp-2 min-h-[2.2rem] leading-snug">
            {p.name}
          </h4>

          {/* Price & MRP */}
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="text-sm sm:text-base font-black text-[#9B111E]">
              ₹{p.price}
            </span>
            {p.mrp && p.mrp > p.price && (
              <span className="text-[11px] text-stone-400 line-through font-semibold">
                ₹{p.mrp}
              </span>
            )}
          </div>
        </Link>

        {/* Card Footer: Add to Cart Button */}
        <div className="p-2.5 sm:p-3 pt-0">
          <button
            type="button"
            disabled={isOutOfStock}
            onClick={(e) => handleQuickAdd(p, e)}
            className={`w-full py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs ${
              isOutOfStock
                ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
                : isAdded
                ? 'bg-emerald-600 text-white'
                : 'bg-amber-100/80 hover:bg-[#9B111E] text-stone-900 hover:text-white border border-amber-300/60 hover:border-[#9B111E]'
            }`}
          >
            {isAdded ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Added!</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                <span>Add to Cart</span>
              </>
            )}
          </button>
        </div>
      </div>
    );
  };

  return (
    <AnimatePresence>
      <div
        onClick={(e) => {
          if (e.target === e.currentTarget) handleClose();
        }}
        className="fixed inset-0 z-[100] flex flex-col bg-stone-950/75 backdrop-blur-md animate-in fade-in duration-200"
      >
        {/* Top Search Header Bar */}
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          className="bg-white border-b border-stone-200 shadow-xl px-4 py-4 sm:px-6 sm:py-5"
        >
          <div className="max-w-5xl mx-auto relative flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-100 text-[#D9531E] shrink-0">
              <Search className="w-5 h-5" />
            </div>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search banana chips, spices, refund policy, tracking, bulk..."
              className="w-full text-base sm:text-lg font-bold text-stone-900 placeholder:text-stone-400 bg-transparent outline-none"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full cursor-pointer transition-colors"
                aria-label="Clear search"
              >
                <X className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={handleClose}
              className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-black transition-all ml-1 shrink-0 cursor-pointer"
            >
              ESC
            </button>
          </div>

          {/* Filter Tab Chips when searching */}
          {query.trim() !== '' && (
            <div className="max-w-5xl mx-auto flex items-center gap-2 mt-3 pt-3 border-t border-stone-100 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'all'
                    ? 'bg-[#9B111E] text-white shadow-xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                All Results ({totalResults})
              </button>
              <button
                onClick={() => setActiveTab('products')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'products'
                    ? 'bg-[#9B111E] text-white shadow-xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                Snacks & Products ({products.length})
              </button>
              <button
                onClick={() => setActiveTab('info')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'info'
                    ? 'bg-[#9B111E] text-white shadow-xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                Help & Store Policies ({siteInfo.length})
              </button>
              <button
                onClick={() => setActiveTab('categories')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'categories'
                    ? 'bg-[#9B111E] text-white shadow-xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                Categories ({categories.length})
              </button>
            </div>
          )}
        </motion.div>

        {/* Results Container */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) handleClose();
          }}
          className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-5xl w-full mx-auto"
        >
          <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-2xl border border-stone-200/90 min-h-[420px]">
            {/* Loading Indicator */}
            {isLoading && (
              <div className="py-16 text-center flex flex-col items-center justify-center gap-2">
                <div className="w-8 h-8 border-3 border-[#D9531E] border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-bold text-stone-600">Searching authentic snacks & store policies...</span>
              </div>
            )}

            {/* DEFAULT STATE: (Query is Empty) -> SHOW PRODUCTS AT TOP IN GRID! */}
            {!isLoading && query.trim() === '' && (
              <div className="space-y-8">
                {/* Popular Trending Search Chips */}
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-stone-500">
                      <TrendingUp className="w-4 h-4 text-[#D9531E]" />
                      <span>Popular Trending Searches</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {popularSearches.map((term) => (
                      <button
                        key={term}
                        onClick={() => setQuery(term)}
                        className="px-3.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-stone-800 text-xs font-bold border border-amber-200/80 transition-all flex items-center gap-1.5 hover:scale-102 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-[#D9531E]" />
                        <span>{term}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* TOP PRODUCTS GRID (Featured & Best Sellers displayed immediately!) */}
                {products.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3.5">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-amber-100 text-[#D9531E]">
                          <Flame className="w-4 h-4 fill-[#D9531E]" />
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-stone-900 tracking-tight">
                            Popular & Best-Selling Snacks
                          </h3>
                          <p className="text-[11px] text-stone-500 font-medium">
                            Freshly crafted Khandeshi specialities direct from Jalgaon
                          </p>
                        </div>
                      </div>
                      <Link
                        to="/shop"
                        onClick={handleClose}
                        className="text-xs font-bold text-[#D9531E] hover:text-[#9B111E] flex items-center gap-1 hover:underline shrink-0"
                      >
                        <span>View All</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>

                    {/* 4-column responsive grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                      {products.map(renderProductCard)}
                    </div>
                  </div>
                )}

                {/* Quick Store Guides & Services (Including Refund/Return Policy) */}
                <div>
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-stone-500 mb-3">
                    <Info className="w-4 h-4 text-amber-600" />
                    <span>Quick Store Guides & Services</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* Refund & Return Policy Card */}
                    <Link
                      to="/faq"
                      onClick={handleClose}
                      className="p-3.5 rounded-2xl bg-emerald-50/70 hover:bg-emerald-100/80 border border-emerald-200/80 transition-all flex flex-col justify-between group"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-300/60">
                            Guarantee
                          </span>
                          <RotateCcw className="w-4 h-4 text-emerald-600" />
                        </div>
                        <h4 className="text-xs font-bold text-stone-900 group-hover:text-emerald-900 transition-colors">
                          Refund & Return Policy
                        </h4>
                        <p className="text-[11px] text-stone-600 mt-0.5 line-clamp-2">
                          100% freshness guarantee. Easy replacement or instant refund for transit damage.
                        </p>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 mt-3 flex items-center gap-1">
                        View Refund Policy <ChevronRight className="w-3 h-3" />
                      </span>
                    </Link>

                    {/* Track Orders Card */}
                    <Link
                      to="/account"
                      onClick={handleClose}
                      className="p-3.5 rounded-2xl bg-stone-50 hover:bg-stone-100/80 border border-stone-200/80 transition-all flex flex-col justify-between group"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                            Orders
                          </span>
                          <Package className="w-4 h-4 text-emerald-600" />
                        </div>
                        <h4 className="text-xs font-bold text-stone-900 group-hover:text-[#9B111E] transition-colors">
                          Track Live Orders
                        </h4>
                        <p className="text-[11px] text-stone-500 mt-0.5 line-clamp-2">
                          DTDC tracking status, dispatch updates & tax invoices.
                        </p>
                      </div>
                      <span className="text-[10px] font-bold text-[#D9531E] mt-3 flex items-center gap-1">
                        Go to Account <ChevronRight className="w-3 h-3" />
                      </span>
                    </Link>

                    {/* Shipping & Delivery Card */}
                    <Link
                      to="/faq"
                      onClick={handleClose}
                      className="p-3.5 rounded-2xl bg-stone-50 hover:bg-stone-100/80 border border-stone-200/80 transition-all flex flex-col justify-between group"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
                            Shipping
                          </span>
                          <Truck className="w-4 h-4 text-amber-600" />
                        </div>
                        <h4 className="text-xs font-bold text-stone-900 group-hover:text-[#9B111E] transition-colors">
                          Shipping & Delivery
                        </h4>
                        <p className="text-[11px] text-stone-500 mt-0.5 line-clamp-2">
                          Free delivery over ₹399 in MH & ₹799 Pan-India.
                        </p>
                      </div>
                      <span className="text-[10px] font-bold text-[#D9531E] mt-3 flex items-center gap-1">
                        View Shipping FAQs <ChevronRight className="w-3 h-3" />
                      </span>
                    </Link>

                    {/* Franchise & Wholesale Card */}
                    <Link
                      to="/franchise"
                      onClick={handleClose}
                      className="p-3.5 rounded-2xl bg-stone-50 hover:bg-stone-100/80 border border-stone-200/80 transition-all flex flex-col justify-between group"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200/60">
                            B2B Bulk
                          </span>
                          <Building2 className="w-4 h-4 text-indigo-600" />
                        </div>
                        <h4 className="text-xs font-bold text-stone-900 group-hover:text-[#9B111E] transition-colors">
                          Franchise & Bulk
                        </h4>
                        <p className="text-[11px] text-stone-500 mt-0.5 line-clamp-2">
                          Bulk supply, corporate gifting, distribution & dealership.
                        </p>
                      </div>
                      <span className="text-[10px] font-bold text-[#D9531E] mt-3 flex items-center gap-1">
                        Inquire Now <ChevronRight className="w-3 h-3" />
                      </span>
                    </Link>
                  </div>
                </div>

                {/* Top Categories */}
                {categories.length > 0 && (
                  <div>
                    <div className="text-xs font-black uppercase tracking-wider text-stone-500 mb-3 flex items-center gap-2">
                      <Grid className="w-4 h-4 text-[#D9531E]" />
                      <span>Browse by Snack Category</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                      {categories.map((cat) => (
                        <Link
                          key={cat.id}
                          to={`/shop?category=${cat.slug}`}
                          onClick={handleClose}
                          className="p-3 rounded-2xl bg-stone-50 hover:bg-amber-50 border border-stone-200/80 hover:border-amber-300 transition-all text-center group flex flex-col items-center justify-center"
                        >
                          <span className="block font-bold text-xs text-stone-900 group-hover:text-[#9B111E] transition-colors">
                            {cat.name}
                          </span>
                          <span className="text-[10px] text-stone-500 font-medium mt-0.5">
                            {cat.productCount ? `${cat.productCount} items` : 'Explore'}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* NO RESULTS FOUND */}
            {!isLoading && query.trim() !== '' && totalResults === 0 && (
              <div className="py-16 text-center max-w-md mx-auto">
                <div className="w-12 h-12 bg-amber-100 text-[#D9531E] rounded-full flex items-center justify-center mx-auto mb-3">
                  <Search className="w-6 h-6" />
                </div>
                <h3 className="text-base font-black text-stone-900 mb-1">
                  No matching results for &ldquo;{query}&rdquo;
                </h3>
                <p className="text-xs text-stone-500 mb-5 leading-relaxed">
                  Try searching for keywords like &quot;Banana Chips&quot;, &quot;Pudina&quot;, &quot;Refund Policy&quot;, &quot;Upwas&quot;, or &quot;Track Order&quot;.
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  <Link
                    to="/shop"
                    onClick={handleClose}
                    className="px-4 py-2.5 rounded-xl bg-[#9B111E] hover:bg-[#800A14] text-white text-xs font-bold transition-all flex items-center gap-2 shadow-xs"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Browse All Snacks</span>
                  </Link>
                  <a
                    href="https://wa.me/917057446409?text=Hello%20Aapla%20Jalgaonwala,%20I%20need%20help%20finding%20a%20product"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 rounded-xl border border-stone-300 hover:bg-stone-100 text-stone-700 text-xs font-bold transition-all flex items-center gap-2"
                  >
                    <PhoneCall className="w-4 h-4 text-emerald-600" />
                    <span>Ask WhatsApp Mitra</span>
                  </a>
                </div>
              </div>
            )}

            {/* ACTIVE RESULTS DISPLAY: PRODUCTS AT TOP IN GRID! */}
            {!isLoading && query.trim() !== '' && totalResults > 0 && (
              <div className="space-y-8">
                {/* 1. MATCHING PRODUCTS - DISPLAYED AT TOP IN GRID */}
                {(activeTab === 'all' || activeTab === 'products') && products.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3.5 pb-2 border-b border-stone-100">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-amber-100 text-[#D9531E]">
                          <ShoppingBag className="w-4 h-4 text-[#D9531E]" />
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-stone-900 tracking-tight flex items-center gap-2">
                            <span>Snacks & Products</span>
                            <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 text-[11px] font-bold">
                              {products.length}
                            </span>
                          </h3>
                          <p className="text-[11px] text-stone-500 font-medium">
                            Matching results for &ldquo;{query}&rdquo;
                          </p>
                        </div>
                      </div>
                      <Link
                        to={`/shop?q=${encodeURIComponent(query)}`}
                        onClick={handleClose}
                        className="text-xs font-bold text-[#D9531E] hover:text-[#9B111E] flex items-center gap-1 hover:underline shrink-0"
                      >
                        <span>View in Shop</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>

                    {/* Responsive Grid: 2 cols on mobile, 3 on sm, 4 on lg */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                      {products.map(renderProductCard)}
                    </div>
                  </div>
                )}

                {/* 2. DEDICATED REFUND & RETURN ASSISTANCE BANNER (If query is refund/return related or tab is info) */}
                {(isRefundQuery || activeTab === 'info') && (
                  <div className="rounded-2xl p-4 sm:p-5 bg-gradient-to-r from-emerald-50 via-teal-50 to-stone-50 border border-emerald-200/80 shadow-xs">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700 shrink-0 mt-0.5">
                          <RotateCcw className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-md">
                              100% Freshness Guarantee
                            </span>
                            <span className="text-[10px] font-bold text-stone-500">
                              Instant Resolution
                            </span>
                          </div>
                          <h4 className="text-sm font-black text-stone-900">
                            Looking for Return, Refund or Damaged Order Assistance?
                          </h4>
                          <p className="text-xs text-stone-600 mt-1 max-w-2xl leading-relaxed">
                            Because our snacks are authentic perishable food items, if your parcel arrives damaged, open, or incorrect, our WhatsApp Mitra team issues a free replacement or instant refund within 48 hours without hassle.
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap sm:flex-col gap-2 shrink-0 w-full sm:w-auto">
                        <a
                          href="https://wa.me/917057446409?text=Hello%20Aapla%20Jalgaonwala,%20I%20need%20assistance%20regarding%20my%20order/refund"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-xs"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span>WhatsApp Mitra Support</span>
                        </a>
                        <Link
                          to="/faq"
                          onClick={handleClose}
                          className="px-3.5 py-2 rounded-xl bg-white hover:bg-stone-100 text-stone-700 text-xs font-bold border border-stone-300 flex items-center justify-center gap-1 transition-all"
                        >
                          <span>Read Return & Refund Policy</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. MATCHING STORE INFO & HELP TOPICS */}
                {(activeTab === 'all' || activeTab === 'info') && siteInfo.length > 0 && (
                  <div>
                    <div className="text-xs font-black uppercase tracking-wider text-stone-500 mb-3 flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Info className="w-4 h-4 text-indigo-600" />
                        <span>Website Info & Help Pages ({siteInfo.length})</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {siteInfo.map((page, idx) => (
                        <Link
                          key={idx}
                          to={page.url}
                          onClick={handleClose}
                          className="p-3.5 rounded-2xl bg-stone-50/80 hover:bg-indigo-50/50 border border-stone-200/80 hover:border-indigo-300 transition-all flex items-start justify-between gap-3 group"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="p-1 rounded-lg bg-white shadow-xs">
                                {getPageCategoryIcon(page.category)}
                              </span>
                              <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                                {page.category}
                              </span>
                            </div>
                            <h4 className="text-xs sm:text-sm font-bold text-stone-900 group-hover:text-indigo-900 transition-colors">
                              {page.title}
                            </h4>
                            <p className="text-[11px] text-stone-500 mt-0.5 line-clamp-2 leading-relaxed">
                              {page.description}
                            </p>
                          </div>
                          <div className="p-1.5 rounded-xl bg-white text-stone-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all shrink-0 mt-1">
                            <ArrowRight className="w-4 h-4" />
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. MATCHING CATEGORIES */}
                {(activeTab === 'all' || activeTab === 'categories') && categories.length > 0 && (
                  <div>
                    <div className="text-xs font-black uppercase tracking-wider text-stone-500 mb-3 flex items-center gap-2">
                      <Grid className="w-4 h-4 text-[#D9531E]" />
                      <span>Matching Snack Categories ({categories.length})</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                      {categories.map((cat) => (
                        <Link
                          key={cat.id}
                          to={`/shop?category=${cat.slug}`}
                          onClick={handleClose}
                          className="p-3 rounded-2xl bg-stone-50 hover:bg-amber-50 border border-stone-200/80 transition-all text-center group"
                        >
                          <span className="block font-bold text-xs text-stone-900 group-hover:text-[#9B111E] transition-colors">
                            {cat.name}
                          </span>
                          <span className="text-[10px] text-stone-500 font-medium">
                            {cat.productCount ? `${cat.productCount} products` : 'Browse'}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
