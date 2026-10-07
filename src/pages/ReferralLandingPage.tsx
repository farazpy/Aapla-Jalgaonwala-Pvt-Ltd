'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { SEO } from '@/components/seo/SEO';
import { Container } from '@/components/ui/Container';
import { ProductGrid } from '@/components/product/ProductGrid';
import { Product, Category } from '@/types';
import { useCart } from '@/context/CartContext';
import { setReferralCookie, getReferralCookie } from '@/utils/referralCookie';
import {
  Gift,
  CheckCircle2,
  ShieldCheck,
  Heart,
  Search,
  X,
  SlidersHorizontal,
  Filter,
  Sparkles,
  RotateCcw,
  Check,
  ShoppingBag,
  Percent,
  Tag,
  ArrowRight,
  Flame,
  Award
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

export default function ReferralLandingPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { addToCart, applyCouponCode } = useCart();

  const [partnerInfo, setPartnerInfo] = useState<{
    partnerName: string;
    partnerCode: string;
    customerDiscountRate?: number;
  } | null>(() => {
    const saved = getReferralCookie();
    if (saved && saved.code && saved.partnerName) {
      return {
        partnerCode: saved.code,
        partnerName: saved.partnerName
      };
    }
    return null;
  });

  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [navratriOffer, setNavratriOffer] = useState<any>(null);
  const [navratriAdded, setNavratriAdded] = useState(false);

  // Filter & Search states
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedFlavour, setSelectedFlavour] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<number>(1000);
  const [sortBy, setSortBy] = useState<string>('featured');
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState<boolean>(false);

  // Referral initialization
  useEffect(() => {
    if (!code) return;
    const cleanCode = code.trim().toUpperCase();

    // 1. Save referral partner code in 15-minute cookie & localStorage
    setReferralCookie(cleanCode);

    // 2. Immediately try auto-applying coupon in CartContext
    applyCouponCode(cleanCode).catch(() => {});

    // 3. Verify partner code and fetch partner details
    fetch(`/api/partner-program/verify/${encodeURIComponent(cleanCode)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setPartnerInfo(data.data);
          setReferralCookie(cleanCode, data.data.partnerName);
          applyCouponCode(cleanCode).catch(() => {});
        }
      })
      .catch((err) => console.warn('Referral verification error:', err));
  }, [code, applyCouponCode]);

  // Fetch Navratri offer config
  useEffect(() => {
    fetch(`/api/navratri-offer?_t=${Date.now()}`, { cache: 'no-store' })
      .then(async (res) => {
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setNavratriOffer(json.data);
          }
        }
      })
      .catch(() => {});
  }, []);

  // Fetch all categories
  useEffect(() => {
    let isMounted = true;
    fetch('/api/categories')
      .then((res) => res.json())
      .then((json) => {
        const list = json.data || (Array.isArray(json) ? json : []);
        if (isMounted && Array.isArray(list) && list.length > 0) {
          setCategories(list);
        }
      })
      .catch((err) => console.warn('Categories fetch error:', err));

    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch all products from MySQL database and inject Navratri combo pack
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    fetch('/api/products')
      .then((res) => res.json())
      .then((json) => {
        if (isMounted) {
          const list: Product[] = json.data || (Array.isArray(json) ? json : []);
          
          const navPrice = Number(navratriOffer?.price || 599);
          const navProduct: Product = {
            id: 'navratri-festive-combo',
            slug: 'navratri-festive-combo-pack',
            name: 'Navratri Festive Special Combo Pack (नवरात्री स्पेशल कॉम्बो)',
            category: 'combo-packs',
            categoryId: 'combo-packs',
            categoryName: 'Combo Packs & Gifting',
            description: navratriOffer?.description || 'Special Navratri Festivity Pack containing 500g Salted Banana Chips, 500g Spicy Masala Banana Chips, 500g Sweet Potato Chivda, 500g Spicy Potato Chivda, and a FREE pack of nutritious Rajgira Ladoos! Made 100% Satvik with Sendha Namak (Rock Salt) in separate dedicated frying lines.',
            shortDescription: '500g Salted + 500g Masala Banana Chips + 500g Sweet + 500g Spicy Potato Chivda + FREE Rajgira Ladoo (2.2kg Net Weight)',
            price: navPrice,
            mrp: Math.round(navPrice * 1.5),
            stock: 2000,
            isAvailable: true,
            isFeatured: true,
            isBestSeller: true,
            flavour: 'Fasting Satvik Mixed',
            netQuantity: '2.2kg Complete Festivity Pack',
            tags: ['navratri', 'upwas', 'combo', 'fasting', 'festive', 'gift', 'satvik'],
            images: [{
              id: 'img-navratri-combo-1',
              url: navratriOffer?.featuredImage || 'https://images.unsplash.com/photo-1605000797439-7ab1434893e2?auto=format&fit=crop&w=1200&q=80',
              alt: 'Navratri Special Festive Combo Pack with Free Ladoo',
              isPrimary: true
            }],
            variants: [{
              id: 'var-navratri-combo-full',
              weight: '2.2kg Complete Festivity Pack',
              price: navPrice,
              mrp: Math.round(navPrice * 1.5),
              stock: 2000
            }]
          };

          const combined = [navProduct, ...list.filter((p) => p.id !== 'navratri-festive-combo' && p.slug !== 'navratri-festive-combo-pack')];
          setAllProducts(combined);
        }
      })
      .catch((err) => {
        console.error('Products fetch error:', err);
        if (isMounted) setAllProducts([]);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [navratriOffer]);

  // Filtered & Sorted products computation
  const filteredProducts = useMemo(() => {
    let result = [...allProducts];

    // 1. Category Filter
    if (selectedCategory && selectedCategory !== 'all') {
      const targetCat = selectedCategory.trim().toLowerCase();
      result = result.filter((p) => {
        const pCat = (p.category || '').toLowerCase();
        const pCatId = (p.categoryId || '').toLowerCase();
        const pCatName = (p.categoryName || '').toLowerCase().replace(/\s+/g, '-');
        const pCatSlug = pCat.replace(/\s+/g, '-');
        return (
          pCat === targetCat ||
          pCatId === targetCat ||
          pCatName === targetCat ||
          pCatSlug === targetCat ||
          pCat.includes(targetCat)
        );
      });
    }

    // 2. Search query
    if (searchQuery.trim()) {
      const term = searchQuery.trim().toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.category.toLowerCase().includes(term) ||
          (p.flavour && p.flavour.toLowerCase().includes(term)) ||
          (p.tags && p.tags.some((t) => t.toLowerCase().includes(term))) ||
          (p.description && p.description.toLowerCase().includes(term))
      );
    }

    // 3. Flavour Profile Filter
    if (selectedFlavour && selectedFlavour !== 'all') {
      const f = selectedFlavour.toLowerCase();
      result = result.filter((p) => {
        if (!p.flavour && !p.tags) return false;
        const prodFlavour = (p.flavour || '').toLowerCase();
        const prodTags = (p.tags || []).map((t) => t.toLowerCase());

        if (f === 'classic') {
          return (
            prodFlavour.includes('salty') ||
            prodFlavour.includes('plain') ||
            prodFlavour.includes('classic') ||
            prodTags.includes('classic')
          );
        }
        if (f === 'spicy') {
          return (
            prodFlavour.includes('masala') ||
            prodFlavour.includes('peri') ||
            prodFlavour.includes('pepper') ||
            prodFlavour.includes('chilli') ||
            prodTags.includes('spicy')
          );
        }
        if (f === 'tangy') {
          return (
            prodFlavour.includes('pudina') ||
            prodFlavour.includes('tomato') ||
            prodFlavour.includes('pani poori') ||
            prodFlavour.includes('chatpata')
          );
        }
        if (f === 'cheesy') return prodFlavour.includes('cheese');
        if (f === 'fresh') return prodFlavour.includes('pudina') || prodTags.includes('fresh');
        if (f === 'experimental') {
          return (
            prodFlavour.includes('noodle') ||
            prodFlavour.includes('maggi') ||
            prodTags.includes('experimental')
          );
        }

        return prodFlavour.includes(f) || prodTags.includes(f);
      });
    }

    // 4. Price filter
    if (maxPrice < 1000) {
      result = result.filter((p) => p.price <= maxPrice);
    }

    // 5. In-stock filter
    if (inStockOnly) {
      result = result.filter((p) => p.isAvailable && (p.stock === undefined || p.stock > 0));
    }

    // 6. Sorting
    if (sortBy === 'price-low') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'popular') {
      result.sort((a, b) => (b.reviewsCount || 0) - (a.reviewsCount || 0));
    } else if (sortBy === 'newest') {
      result.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
    } else if (sortBy === 'name-az') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      // Default: Featured first
      result.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
    }

    return result;
  }, [allProducts, selectedCategory, searchQuery, selectedFlavour, maxPrice, inStockOnly, sortBy]);

  const handleResetFilters = () => {
    setSelectedCategory('all');
    setSelectedFlavour('all');
    setSearchQuery('');
    setMaxPrice(1000);
    setSortBy('featured');
    setInStockOnly(false);
  };

  const hasActiveFilters =
    selectedCategory !== 'all' ||
    selectedFlavour !== 'all' ||
    searchQuery.trim() !== '' ||
    maxPrice < 1000 ||
    inStockOnly;

  const discountDisplay = partnerInfo?.customerDiscountRate || 4;

  return (
    <>
      <SEO
        title={`Special ${discountDisplay}% Referral Privilege | ${partnerInfo?.partnerName || 'Women Partner'} | Aapla Jalgaonwala`}
        description={`Enjoy an exclusive ${discountDisplay}% instant discount across all authentic Khandeshi snacks, banana chips, farsaan and kitchen masalas from Aapla Jalgaonwala.`}
      />

      <div className="bg-[#FAF6ED] min-h-screen text-stone-900 pb-20">
        {/* Top Referral Celebration Hero Banner */}
        <div className="bg-gradient-to-r from-[#9B111E] via-[#B8222F] to-[#9B111E] text-white py-10 sm:py-14 px-4 text-center relative overflow-hidden shadow-inner">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
          
          <div className="max-w-3xl mx-auto space-y-4 relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 text-white font-bold text-xs backdrop-blur-md border border-white/20 shadow-xs">
              <Gift className="w-4 h-4 text-amber-300 animate-pulse" />
              <span>Special Referral Privilege Unlocked</span>
            </div>

            <h1 className="text-2xl sm:text-4xl md:text-5xl font-black font-serif leading-tight text-white drop-shadow-xs">
              Welcome! You've Unlocked an Extra <span className="text-amber-300 underline decoration-amber-400">{discountDisplay}% Instant Discount</span>
            </h1>

            <p className="text-xs sm:text-base text-stone-100 max-w-xl mx-auto leading-relaxed">
              Compliments of our certified Women Business Partner{' '}
              <strong className="text-amber-200 font-bold underline decoration-amber-300">
                {partnerInfo?.partnerName || 'Women Business Partner'}
              </strong>{' '}
              <span className="inline-block bg-black/30 px-2 py-0.5 rounded-md font-mono text-[11px] sm:text-xs ml-1 border border-white/20">
                Code: {code?.toUpperCase()}
              </span>
            </p>

            <div className="inline-flex flex-wrap items-center justify-center gap-2 text-xs bg-black/40 backdrop-blur-md px-4 py-2.5 rounded-2xl text-amber-200 font-medium border border-amber-400/30 shadow-md">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Your <strong>{discountDisplay}% discount</strong> is automatically applied at checkout! (Valid for 15 mins)</span>
            </div>
          </div>
        </div>

        <Container className="pt-8 space-y-6">
          {/* Featured Spotlight: Navratri Festive Special Combo Box */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-stone-900 via-[#4A0E17] to-stone-950 text-white p-6 sm:p-8 border border-amber-500/30 shadow-xl">
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-amber-500/20 via-orange-600/10 to-transparent rounded-full blur-3xl pointer-events-none" />
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center relative z-10">
              {/* Image Showcase */}
              <div className="lg:col-span-5 relative rounded-2xl overflow-hidden border border-amber-400/30 shadow-lg group">
                <img 
                  src={navratriOffer?.featuredImage || 'https://images.unsplash.com/photo-1605000797439-7ab1434893e2?auto=format&fit=crop&w=800&q=80'} 
                  alt="Navratri Special Fasting Festivity Combo Box" 
                  className="w-full h-56 sm:h-64 object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                  <span className="px-3 py-1 bg-amber-500 text-stone-950 text-[10px] sm:text-xs font-black uppercase rounded-full tracking-wider shadow-md inline-flex items-center gap-1 border border-amber-300">
                    <Sparkles className="w-3.5 h-3.5" />
                    Navratri Festive Launch
                  </span>
                  <span className="px-2.5 py-0.5 bg-emerald-600 text-white text-[9.5px] font-extrabold uppercase rounded-md shadow-sm">
                    {discountDisplay}% Referral Privilege Applied
                  </span>
                </div>
              </div>

              {/* Offer Details */}
              <div className="lg:col-span-7 space-y-4">
                <div className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 bg-amber-400/15 px-2.5 py-1 rounded-full border border-amber-400/30">
                    🎉 FESTIVE SPECIAL (2.2 KG COMPLETE PACK + FREE GIFT)
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-white font-serif leading-tight">
                    Navratri Festive Special Combo Pack (नवरात्री स्पेशल कॉम्बो)
                  </h3>
                  <p className="text-xs text-stone-300 leading-relaxed">
                    ५००g खारट केळी वेफर्स + ५००g मसाला केळी वेफर्स + ५००g गोड बटाटा चिवडा + ५००g तिखट बटाटा चिवडा + मोफत राजगिरा लाडू! 100% Pure Sendha Namak Satvik Fasting Delicacy.
                  </p>
                </div>

                {/* Pricing with Partner Referral Discount */}
                <div className="flex flex-wrap items-baseline gap-3 bg-black/40 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 w-fit">
                  <div>
                    <span className="text-[10px] text-stone-400 uppercase font-bold block">Exclusive Referral Price</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl sm:text-3xl font-black text-amber-300">₹{Math.round(Number(navratriOffer?.price || 599) * (1 - discountDisplay / 100))}</span>
                      <span className="text-xs text-stone-400 line-through">₹{Math.round(Number(navratriOffer?.price || 599) * 1.5)}</span>
                      <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-500/30">
                        Save ₹{Math.round(Number(navratriOffer?.price || 599) * 1.5) - Math.round(Number(navratriOffer?.price || 599) * (1 - discountDisplay / 100))}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick CTA Buttons */}
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      const navPrice = Number(navratriOffer?.price || 599);
                      const navProduct: Product = {
                        id: 'navratri-festive-combo',
                        slug: 'navratri-festive-combo-pack',
                        name: 'Navratri Festive Special Combo Pack (नवरात्री स्पेशल कॉम्बो)',
                        category: 'combo-packs',
                        categoryId: 'combo-packs',
                        categoryName: 'Combo Packs & Gifting',
                        description: navratriOffer?.description || 'Special Navratri Festivity Pack containing 500g Salted Banana Chips, 500g Spicy Masala Banana Chips, 500g Sweet Potato Chivda, 500g Spicy Potato Chivda, and a FREE pack of nutritious Rajgira Ladoos!',
                        price: navPrice,
                        mrp: Math.round(navPrice * 1.5),
                        stock: 2000,
                        images: [{
                          id: 'img-navratri-combo-1',
                          url: navratriOffer?.featuredImage || 'https://images.unsplash.com/photo-1605000797439-7ab1434893e2?auto=format&fit=crop&w=1200&q=80',
                          alt: 'Navratri Special Festive Combo Pack with Free Ladoo',
                          isPrimary: true
                        }]
                      };
                      const navVariant = {
                        id: 'var-navratri-combo-full',
                        weight: '2.2kg Complete Festivity Pack',
                        price: navPrice,
                        mrp: Math.round(navPrice * 1.5),
                        stock: 2000
                      };
                      addToCart(navProduct, navVariant, 1, true);
                      setNavratriAdded(true);
                      setTimeout(() => setNavratriAdded(false), 2000);
                    }}
                    disabled={navratriAdded}
                    className="px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-extrabold text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    {navratriAdded ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-900 animate-bounce" />
                        <span>Added to Cart!</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-4 h-4" />
                        <span>Add Navratri Combo to Cart</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const navPrice = Number(navratriOffer?.price || 599);
                      const navProduct: Product = {
                        id: 'navratri-festive-combo',
                        slug: 'navratri-festive-combo-pack',
                        name: 'Navratri Festive Special Combo Pack (नवरात्री स्पेशल कॉम्बो)',
                        category: 'combo-packs',
                        categoryId: 'combo-packs',
                        categoryName: 'Combo Packs & Gifting',
                        description: navratriOffer?.description || 'Special Navratri Festivity Pack containing 500g Salted Banana Chips, 500g Spicy Masala Banana Chips, 500g Sweet Potato Chivda, 500g Spicy Potato Chivda, and a FREE pack of nutritious Rajgira Ladoos!',
                        price: navPrice,
                        mrp: Math.round(navPrice * 1.5),
                        stock: 2000,
                        images: [{
                          id: 'img-navratri-combo-1',
                          url: navratriOffer?.featuredImage || 'https://images.unsplash.com/photo-1605000797439-7ab1434893e2?auto=format&fit=crop&w=1200&q=80',
                          alt: 'Navratri Special Festive Combo Pack with Free Ladoo',
                          isPrimary: true
                        }]
                      };
                      const navVariant = {
                        id: 'var-navratri-combo-full',
                        weight: '2.2kg Complete Festivity Pack',
                        price: navPrice,
                        mrp: Math.round(navPrice * 1.5),
                        stock: 2000
                      };
                      addToCart(navProduct, navVariant, 1, false);
                      navigate('/checkout');
                    }}
                    className="px-5 py-3 rounded-xl bg-gradient-to-r from-orange-600 to-[#9B111E] hover:from-orange-700 hover:to-[#800A14] text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer active:scale-95"
                  >
                    <span>Instant Checkout</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <Link
                    to="/navratri-offer"
                    className="text-xs font-bold text-stone-300 hover:text-white underline decoration-stone-500 hover:decoration-white transition-colors ml-auto hidden sm:inline-block"
                  >
                    View Full Navratri Details →
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Category Tabs / Pills (Scrollable horizontally on mobile) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                selectedCategory === 'all'
                  ? 'bg-[#9B111E] text-white shadow-md'
                  : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200/80'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>All Products</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ml-1 ${selectedCategory === 'all' ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-600'}`}>
                {allProducts.length}
              </span>
            </button>

            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.slug || selectedCategory === cat.name;
              return (
                <button
                  key={cat.id || cat.slug}
                  type="button"
                  onClick={() => setSelectedCategory(cat.slug)}
                  className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                    isSelected
                      ? 'bg-[#9B111E] text-white shadow-md'
                      : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200/80'
                  }`}
                >
                  <span>{cat.name}</span>
                  {cat.productCount !== undefined && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ml-1 ${isSelected ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-600'}`}>
                      {cat.productCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Filter, Search & Sorting Bar */}
          <div className="bg-white rounded-3xl border border-stone-200/80 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Search Box */}
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search banana chips, farsaan, masalas..."
                className="w-full pl-10 pr-8 py-2.5 bg-stone-50 border border-stone-200 rounded-2xl text-xs font-semibold text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#9B111E]"
              />
              {searchQuery && (
                <button
                  type="button"
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
                type="button"
                onClick={() => setIsMobileFilterOpen(true)}
                className="lg:hidden flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-100 text-amber-900 text-xs font-bold border border-amber-200 cursor-pointer"
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
                  type="button"
                  onClick={handleResetFilters}
                  className="text-xs font-bold text-stone-500 hover:text-[#9B111E] flex items-center gap-1 transition-colors cursor-pointer"
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
                  className="bg-stone-50 border border-stone-200 rounded-2xl px-3 py-2.5 text-xs font-bold text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#9B111E]"
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

          {/* Results Summary and Referral Badge */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold text-stone-900 font-serif">
                {selectedCategory === 'all' ? 'All Khandeshi Delicacies' : categories.find(c => c.slug === selectedCategory)?.name || selectedCategory}
              </h2>
              <span className="text-xs font-bold text-stone-500 bg-white px-2.5 py-0.5 rounded-full border border-stone-200">
                {filteredProducts.length} Items
              </span>
            </div>

            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
              <Tag className="w-3 h-3 text-emerald-600" />
              <span>{discountDisplay}% partner discount will reflect automatically in cart</span>
            </div>
          </div>

          {/* Main Layout: Desktop Sidebar + Product Grid */}
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
                    type="button"
                    onClick={handleResetFilters}
                    className="text-[11px] font-bold text-[#9B111E] hover:underline cursor-pointer"
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
                    type="button"
                    onClick={() => setSelectedCategory('all')}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                      selectedCategory === 'all'
                        ? 'bg-[#9B111E] text-white shadow-xs'
                        : 'text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    <span>All Categories</span>
                    {selectedCategory === 'all' && <Check className="w-3.5 h-3.5" />}
                  </button>
                  {categories.map((cat) => {
                    const isSelected = selectedCategory === cat.slug || selectedCategory === cat.name;
                    return (
                      <button
                        key={cat.id || cat.slug}
                        type="button"
                        onClick={() => setSelectedCategory(cat.slug)}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-[#9B111E] text-white shadow-xs'
                            : 'text-stone-700 hover:bg-stone-100'
                        }`}
                      >
                        <span className="truncate pr-2">{cat.name}</span>
                        {cat.productCount !== undefined && (
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 ${
                              isSelected ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-500'
                            }`}
                          >
                            {cat.productCount}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Flavour Profile Filter */}
              <div className="pt-4 border-t border-stone-100">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-stone-400 mb-3">
                  Flavour Profile
                </h4>
                <div className="space-y-1">
                  {FLAVOUR_OPTIONS.map((f) => (
                    <button
                      key={f.value}
                      type="button"
                      onClick={() => setSelectedFlavour(f.value)}
                      className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-between cursor-pointer ${
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

              {/* In Stock Filter */}
              <div className="pt-4 border-t border-stone-100">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-xs font-bold text-stone-700">In Stock Only</span>
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={(e) => setInStockOnly(e.target.checked)}
                    className="w-4 h-4 rounded text-[#9B111E] focus:ring-[#9B111E] accent-[#9B111E] cursor-pointer"
                  />
                </label>
              </div>
            </aside>

            {/* Product Grid Area */}
            <main className="lg:col-span-3">
              <ProductGrid
                products={filteredProducts}
                isLoading={loading}
                viewMode="grid"
                emptyTitle="No Snacks Match Your Filter"
                emptySubtitle="Try selecting All Categories or resetting active flavour and price filters."
              />
            </main>
          </div>

          {/* Guarantee Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-10 border-t border-stone-200/80">
            <div className="bg-white p-5 rounded-2xl border border-stone-200 flex items-center gap-3 shadow-2xs">
              <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-stone-900">100% Pure & Authentic</h4>
                <p className="text-[11px] text-stone-500">Traditional Khandeshi recipes</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200 flex items-center gap-3 shadow-2xs">
              <Sparkles className="w-6 h-6 text-amber-500 shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-stone-900">Fresh Batch Guarantee</h4>
                <p className="text-[11px] text-stone-500">Dispatched within 24 hours</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200 flex items-center gap-3 shadow-2xs">
              <Heart className="w-6 h-6 text-rose-500 shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-stone-900">Support Women Partners</h4>
                <p className="text-[11px] text-stone-500">Your order empowers local women entrepreneurs</p>
              </div>
            </div>
          </div>
        </Container>
      </div>

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
                    type="button"
                    onClick={() => setIsMobileFilterOpen(false)}
                    className="p-1 rounded-full hover:bg-stone-100 cursor-pointer"
                  >
                    <X className="w-5 h-5 text-stone-500" />
                  </button>
                </div>

                {/* Categories */}
                <div className="mb-6">
                  <h4 className="text-xs font-extrabold uppercase text-stone-400 mb-3">Categories</h4>
                  <div className="space-y-1">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategory('all');
                        setIsMobileFilterOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold cursor-pointer ${
                        selectedCategory === 'all' ? 'bg-[#9B111E] text-white' : 'text-stone-700 hover:bg-stone-100'
                      }`}
                    >
                      All Categories
                    </button>
                    {categories.map((cat) => {
                      const isSelected = selectedCategory === cat.slug || selectedCategory === cat.name;
                      return (
                        <button
                          key={cat.id || cat.slug}
                          type="button"
                          onClick={() => {
                            setSelectedCategory(cat.slug);
                            setIsMobileFilterOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold cursor-pointer ${
                            isSelected ? 'bg-[#9B111E] text-white' : 'text-stone-700 hover:bg-stone-100'
                          }`}
                        >
                          {cat.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Flavours */}
                <div className="mb-6">
                  <h4 className="text-xs font-extrabold uppercase text-stone-400 mb-3">Flavour Profile</h4>
                  <div className="space-y-1">
                    {FLAVOUR_OPTIONS.map((f) => (
                      <button
                        key={f.value}
                        type="button"
                        onClick={() => {
                          setSelectedFlavour(f.value);
                          setIsMobileFilterOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer ${
                          selectedFlavour === f.value ? 'bg-amber-100 text-amber-900 font-bold' : 'text-stone-600 hover:bg-stone-100'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price Filter */}
                <div className="mb-6">
                  <h4 className="text-xs font-extrabold uppercase text-stone-400 mb-3">Max Price: ₹{maxPrice}</h4>
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
              </div>

              <div className="pt-4 border-t border-stone-200 space-y-2">
                <button
                  type="button"
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="w-full py-3 bg-[#9B111E] text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
                >
                  Apply Filters ({filteredProducts.length} Products)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleResetFilters();
                    setIsMobileFilterOpen(false);
                  }}
                  className="w-full py-2 bg-stone-100 text-stone-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Clear All
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
