import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import { useLanguage } from '@/context/LanguageContext';
import { LanguageToggle } from '@/components/navigation/LanguageToggle';
import { SearchOverlay } from '@/components/navigation/SearchOverlay';
import { initialCategories } from '@/data/categories';
import { Category } from '@/types';
import { motion, AnimatePresence } from 'motion/react';
import { optimizeImageUrl } from '@/lib/utils';
import { DEFAULT_HEADER_LOGO } from '@/data/settings';
import {
  ShoppingBag,
  Heart,
  Search,
  Menu,
  X,
  User as UserIcon,
  ChevronDown,
  ChevronRight,
  Sparkles,
  PhoneCall,
  Package,
  MapPin,
  LogOut,
  Flame,
  Instagram,
  HelpCircle,
  Store,
  BookOpen,
  Building2,
  TrendingUp,
  Layers,
  Gift
} from 'lucide-react';

const CATEGORY_ICONS: Record<string, string> = {
  'banana-chips': '🍌',
  'regular-banana-chips': '🍌',
  'khandeshi-farsaan': '🌶️',
  'kitchen-masalas': '🍲',
  'potato-chips': '🥔',
  'upwas-special': '🕉️',
  'shravan-special': '🪔',
  'combo-packs': '🎁'
};

const CATEGORY_BADGES: Record<string, { label: string; color: string }> = {
  'banana-chips': { label: '10 Signature Flavours', color: 'bg-amber-100 text-amber-800 border-amber-300/80' },
  'regular-banana-chips': { label: 'Classic Packs', color: 'bg-yellow-100 text-yellow-800 border-yellow-300/80' },
  'khandeshi-farsaan': { label: 'Traditional Tikhat', color: 'bg-red-100 text-red-800 border-red-300/80' },
  'kitchen-masalas': { label: 'Stone-Ground', color: 'bg-orange-100 text-orange-800 border-orange-300/80' },
  'potato-chips': { label: 'Handcrafted Wafers', color: 'bg-amber-100 text-amber-800 border-amber-300/80' },
  'upwas-special': { label: 'Fasting Special', color: 'bg-[#D9531E] text-white border-orange-600' },
  'shravan-special': { label: 'Holy Farali', color: 'bg-amber-600 text-white border-amber-700' },
  'combo-packs': { label: 'Curated Hampers', color: 'bg-purple-100 text-purple-800 border-purple-300/80' }
};

function getCleanCategoryName(rawName: string): string {
  if (!rawName) return '';
  return rawName.replace(/Banana Chipss/gi, 'Banana Chips').trim();
}

export function Navbar() {
  const location = useLocation();
  const pathname = location.pathname;
  const { totalItems, setIsCartOpen, subtotal } = useCart();
  const { wishlist } = useWishlist();
  const { user, isAuthenticated, openAuthModal, logout } = useAuth();
  const { settings } = useSettings();
  const { t, isMarathi } = useLanguage();

  const phoneDisplay = String(settings.contactPhone || '+91 70574 46409');
  const phoneHref = phoneDisplay.replace(/[^\d+]/g, '');
  const emailDisplay = settings.contactEmail || 'info@aaplajalgaonwala.com';
  const storeName = isMarathi ? t('store.name', 'आपला जळगाववाला') : (settings.storeName || 'Aapla Jalgaonwala');
  const tagline = isMarathi ? t('store.tagline', 'अस्सल खान्देशी स्वाद • १००% शुद्ध') : (settings.tagline || 'Khandeshi Swaad • 100% Pure');
  const fallbackAvatar = settings.defaultUserAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&h=200&q=80';
  const userAvatar = user?.avatarUrl || fallbackAvatar;
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
  // Real categories fetched from MySQL database
  const [categories, setCategories] = useState<Category[]>([]);

  // Dropdown states
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [isExploreOpen, setIsExploreOpen] = useState(false);

  // Mobile drawer accordion states
  const [mobileCategoriesExpanded, setMobileCategoriesExpanded] = useState(true);
  const [mobileExploreExpanded, setMobileExploreExpanded] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const categoriesMenuRef = useRef<HTMLDivElement>(null);
  const exploreMenuRef = useRef<HTMLDivElement>(null);

  const categoriesHoverTimeout = useRef<NodeJS.Timeout | null>(null);
  const exploreHoverTimeout = useRef<NodeJS.Timeout | null>(null);

  // Fetch real categories from MySQL database
  useEffect(() => {
    let isMounted = true;
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => {
        const list = data && (data.data || (Array.isArray(data) ? data : [])) || [];
        if (isMounted && Array.isArray(list) && list.length > 0) {
          setCategories(list);
        } else if (isMounted) {
          setCategories(initialCategories);
        }
      })
      .catch(() => {
        if (isMounted) setCategories(initialCategories);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Track scrolling
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setIsUserMenuOpen(false);
      }
      if (categoriesMenuRef.current && !categoriesMenuRef.current.contains(target)) {
        setIsCategoriesOpen(false);
      }
      if (exploreMenuRef.current && !exploreMenuRef.current.contains(target)) {
        setIsExploreOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsUserMenuOpen(false);
    setIsCategoriesOpen(false);
    setIsExploreOpen(false);
  }, [pathname]);

  // Explore / Company Dropdown items
  const exploreLinks = [
    {
      title: 'Women Business Partner',
      desc: 'Earn 12% Commission Promoting on WhatsApp & Social Media',
      href: '/women-business-partner',
      icon: Sparkles,
      badge: 'Earn 12%',
      iconColor: 'text-[#9B111E]',
      bgColor: 'bg-[#9B111E]/10'
    },
    {
      title: 'Woman Partner Login',
      desc: 'Access your Partner Dashboard, Referral Link & Sunday Payouts',
      href: '/woman-partner-login',
      icon: TrendingUp,
      badge: 'Dashboard',
      iconColor: 'text-amber-700',
      bgColor: 'bg-amber-100/70'
    },
    {
      title: 'Franchise Opportunities',
      desc: 'High Margin (40-50%) Turnkey Store Model Across India',
      href: '/franchise',
      icon: Building2,
      badge: 'Partner With Us',
      iconColor: 'text-emerald-600',
      bgColor: 'bg-emerald-50'
    },
    {
      title: 'Our Story',
      desc: 'Started in 2024 • Authentic Khandeshi Recipes',
      href: '/our-story',
      icon: BookOpen,
      iconColor: 'text-[#9B111E]',
      bgColor: 'bg-[#9B111E]/10'
    },
    {
      title: 'Upwas Special (उपवास)',
      desc: '100% Satvik Fasting Snacks & Farali Batata Mixture',
      href: '/upwas-special',
      icon: Flame,
      iconColor: 'text-[#D9531E]',
      bgColor: 'bg-[#D9531E]/10'
    },
    {
      title: 'FAQs & Support',
      desc: 'Delivery Timelines, Freshness Guarantee & Bulk Queries',
      href: '/faq',
      icon: HelpCircle,
      iconColor: 'text-amber-600',
      bgColor: 'bg-amber-50'
    },
    {
      title: 'Instagram Community',
      desc: 'Watch Customer Reviews, Reels & Fresh Batch Vlogs',
      href: '/instagram',
      icon: Instagram,
      iconColor: 'text-pink-600',
      bgColor: 'bg-pink-50'
    }
  ];

  const handleCategoriesMouseEnter = () => {
    if (categoriesHoverTimeout.current) clearTimeout(categoriesHoverTimeout.current);
    setIsCategoriesOpen(true);
    setIsExploreOpen(false);
  };

  const handleCategoriesMouseLeave = () => {
    categoriesHoverTimeout.current = setTimeout(() => {
      setIsCategoriesOpen(false);
    }, 150);
  };

  const handleExploreMouseEnter = () => {
    if (exploreHoverTimeout.current) clearTimeout(exploreHoverTimeout.current);
    setIsExploreOpen(true);
    setIsCategoriesOpen(false);
  };

  const handleExploreMouseLeave = () => {
    exploreHoverTimeout.current = setTimeout(() => {
      setIsExploreOpen(false);
    }, 150);
  };

  const isExploreActive = ['/our-story', '/franchise', '/faq', '/instagram', '/partner-program'].includes(pathname);
  const isCategoriesActive = pathname === '/categories' || pathname.startsWith('/categories/');

  return (
    <>
      <header
        className={`sticky top-0 z-40 transition-all duration-300 w-full max-w-full overflow-visible ${
          isScrolled
            ? 'bg-white/95 backdrop-blur-md shadow-md border-b border-stone-200/80 py-2 sm:py-2.5'
            : 'bg-white border-b border-stone-100 py-2.5 sm:py-3.5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 w-full">
          <div className="flex items-center justify-between gap-1.5 sm:gap-4 w-full">
            
            {/* Mobile Menu Button */}
            <div className="flex items-center lg:hidden shrink-0">
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-1.5 sm:p-2 rounded-xl text-stone-700 hover:bg-stone-100 hover:text-stone-900 transition-colors cursor-pointer"
                aria-label="Open mobile menu"
              >
                <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            {/* Brand Logo & Tagline */}
            <Link to="/" className="flex items-center gap-1.5 sm:gap-3 group min-w-0 flex-1 sm:flex-initial">
              {(() => {
                const logoUrl = settings.appLogo || DEFAULT_HEADER_LOGO;
                return logoUrl ? (
                  <img
                    src={optimizeImageUrl(logoUrl, 160)}
                    alt={storeName}
                    width="120"
                    height="44"
                    className="h-8 xs:h-9 sm:h-11 w-auto max-w-[80px] xs:max-w-[120px] sm:max-w-[160px] object-contain rounded-xl shrink-0"
                    loading="eager"
                    fetchPriority="high"
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (target.src !== DEFAULT_HEADER_LOGO) {
                        target.src = DEFAULT_HEADER_LOGO;
                      }
                    }}
                  />
                ) : (
                  <div className="w-8 h-8 xs:w-9 xs:h-9 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-[#9B111E] to-[#D9531E] flex items-center justify-center text-white font-black text-xs sm:text-lg shadow-md group-hover:scale-105 transition-transform shrink-0">
                    AJW
                  </div>
                );
              })()}
              <div className="flex flex-col min-w-0">
                <span className="text-xs xs:text-sm sm:text-base md:text-lg font-black text-stone-900 tracking-tight leading-tight group-hover:text-[#9B111E] transition-colors truncate">
                  {storeName}
                </span>
                <span className="text-[7.5px] xs:text-[8.5px] sm:text-[10px] font-bold text-[#D9531E] tracking-wider uppercase truncate hidden xs:block">
                  {tagline}
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
              
              {/* Home */}
              <Link
                to="/"
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  pathname === '/'
                    ? 'text-[#9B111E] bg-[#9B111E]/5 font-extrabold'
                    : 'text-stone-700 hover:text-[#9B111E] hover:bg-stone-50'
                }`}
              >
                {t('nav.home', 'Home')}
              </Link>

              {/* Shop */}
              <Link
                to="/shop"
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  pathname === '/shop'
                    ? 'text-[#9B111E] bg-[#9B111E]/5 font-extrabold'
                    : 'text-stone-700 hover:text-[#9B111E] hover:bg-stone-50'
                }`}
              >
                {t('nav.shop', 'Shop')}
              </Link>

              {/* Categories Dropdown Menu */}
              <div
                className="relative"
                ref={categoriesMenuRef}
                onMouseEnter={handleCategoriesMouseEnter}
                onMouseLeave={handleCategoriesMouseLeave}
              >
                <button
                  type="button"
                  onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    isCategoriesActive || isCategoriesOpen
                      ? 'text-[#9B111E] bg-[#9B111E]/5 font-extrabold'
                      : 'text-stone-700 hover:text-[#9B111E] hover:bg-stone-50'
                  }`}
                  aria-expanded={isCategoriesOpen}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>{t('nav.categories', 'Categories')}</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      isCategoriesOpen ? 'rotate-180 text-[#9B111E]' : 'text-stone-400'
                    }`}
                  />
                </button>

                {/* Dropdown Menu for Categories - Dynamic from MySQL database */}
                <AnimatePresence>
                  {isCategoriesOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.98 }}
                      transition={{ duration: 0.18, ease: 'easeOut' }}
                      className="absolute top-full left-0 mt-2 w-[540px] max-w-[95vw] bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-stone-200/90 p-5 z-[100] overflow-hidden"
                    >
                      {/* Dropdown Header */}
                      <div className="flex items-center justify-between pb-3.5 mb-3 border-b border-stone-100 px-1">
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#9B111E] bg-[#9B111E]/8 px-2 py-0.5 rounded-md">
                              Artisanal Menu
                            </span>
                            <span className="text-[11px] font-bold text-stone-400">• Jalgaon Pure</span>
                          </div>
                          <h4 className="text-sm font-black text-stone-900">
                            Explore Khandeshi Delicacies
                          </h4>
                        </div>
                        <Link
                          to="/categories"
                          onClick={() => setIsCategoriesOpen(false)}
                          className="text-xs font-bold text-[#9B111E] hover:text-[#800A14] flex items-center gap-1 hover:underline shrink-0 bg-stone-50 hover:bg-stone-100 px-3 py-1.5 rounded-xl transition-all border border-stone-200/60"
                        >
                          <span>View All ({categories.length})</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>

                      {/* Dropdown Scrollable Categories Grid */}
                      <div className="grid grid-cols-1 gap-2 max-h-[380px] overflow-y-auto pr-1.5 space-y-0.5 [::-webkit-scrollbar]:w-1.5 [::-webkit-scrollbar-track]:bg-stone-100 [::-webkit-scrollbar-thumb]:bg-amber-300/80 [::-webkit-scrollbar-thumb]:rounded-full hover:[::-webkit-scrollbar-thumb]:bg-amber-400">
                        {categories.map((cat) => {
                          const cleanName = getCleanCategoryName(cat.name);
                          const icon = CATEGORY_ICONS[cat.slug] || '✨';
                          const badge = CATEGORY_BADGES[cat.slug];
                          const isUpwas = cat.slug === 'upwas-special' || cat.slug === 'shravan-special';
                          const targetUrl = isUpwas ? '/upwas-special' : `/shop?category=${cat.slug}`;

                          return (
                            <Link
                              key={cat.slug || cat.id}
                              to={targetUrl}
                              onClick={() => setIsCategoriesOpen(false)}
                              className={`p-2.5 rounded-2xl flex items-center justify-between transition-all group border ${
                                isUpwas
                                  ? 'bg-gradient-to-r from-amber-500/10 via-[#D9531E]/10 to-[#9B111E]/10 border-amber-300/80 hover:border-amber-400 hover:shadow-md'
                                  : 'bg-white hover:bg-gradient-to-r hover:from-amber-50/60 hover:to-orange-50/40 border-stone-100 hover:border-amber-200 hover:shadow-md'
                              }`}
                            >
                              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                                {/* Thumbnail Image or Emoji Badge */}
                                <div className="relative w-11 h-11 rounded-xl overflow-hidden shrink-0 bg-amber-50 border border-amber-200/60 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform duration-300">
                                  {cat.image ? (
                                    <img
                                      src={optimizeImageUrl(cat.image, { width: 100, quality: 'auto' })}
                                      alt={cleanName}
                                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                      onError={(e) => {
                                        // Fallback to emoji on image load error
                                        (e.target as HTMLElement).style.display = 'none';
                                        if (e.currentTarget.parentElement) {
                                          const fallback = document.createElement('span');
                                          fallback.className = 'text-2xl';
                                          fallback.innerText = icon;
                                          e.currentTarget.parentElement.appendChild(fallback);
                                        }
                                      }}
                                    />
                                  ) : (
                                    <span className="text-2xl">{icon}</span>
                                  )}
                                </div>

                                {/* Category Title, Badge & Tagline */}
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xs sm:text-[13px] font-extrabold text-stone-900 group-hover:text-[#9B111E] transition-colors truncate">
                                      {cleanName}
                                    </span>
                                    {badge && (
                                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border shrink-0 ${badge.color}`}>
                                        {badge.label}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-stone-500 font-medium line-clamp-1 mt-0.5">
                                    {cat.tagline || cat.description}
                                  </p>
                                </div>
                              </div>

                              {/* Action Arrow Pill */}
                              <div className="w-7 h-7 rounded-full bg-stone-100 group-hover:bg-[#9B111E] text-stone-400 group-hover:text-white flex items-center justify-center transition-all shrink-0 ml-3 group-hover:translate-x-0.5 shadow-xs">
                                <ChevronRight className="w-4 h-4" />
                              </div>
                            </Link>
                          );
                        })}
                      </div>

                      {/* Footer inside Mega Dropdown */}
                      <div className="mt-3.5 -mx-5 -mb-5 px-5 py-3.5 bg-gradient-to-r from-stone-50 via-amber-50/30 to-stone-50 border-t border-stone-200/80 flex items-center justify-between gap-3 rounded-b-3xl">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-[#D9531E]/10 flex items-center justify-center shrink-0">
                            <Sparkles className="w-4 h-4 text-[#D9531E]" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-extrabold text-stone-800 truncate">100% Pure Fresh Batches</p>
                            <p className="text-[10.5px] font-medium text-stone-500 truncate">All India Express Delivery Guaranteed</p>
                          </div>
                        </div>
                        <Link
                          to="/shop"
                          onClick={() => setIsCategoriesOpen(false)}
                          className="px-4 py-2 rounded-xl bg-[#9B111E] text-white text-xs font-extrabold hover:bg-[#800A14] transition-all shadow-md shadow-[#9B111E]/20 hover:scale-105 active:scale-95 shrink-0 whitespace-nowrap"
                        >
                          Shop Full Menu
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Navratri Offer Link */}
              <Link
                to="/navratri-offer"
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all relative ${
                  pathname === '/navratri-offer'
                    ? 'text-[#9B111E] bg-[#9B111E]/5 font-extrabold'
                    : 'text-stone-700 hover:text-[#9B111E] hover:bg-stone-50'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <Gift className="w-3.5 h-3.5 text-[#D9531E] animate-bounce" />
                  <span>{t('nav.navratri', 'Navratri Offer 🎁')}</span>
                </span>
              </Link>

              {/* Explore / Company Dropdown Menu */}
              <div
                className="relative"
                ref={exploreMenuRef}
                onMouseEnter={handleExploreMouseEnter}
                onMouseLeave={handleExploreMouseLeave}
              >
                <button
                  type="button"
                  onClick={() => setIsExploreOpen(!isExploreOpen)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    isExploreActive || isExploreOpen
                      ? 'text-[#9B111E] bg-[#9B111E]/5 font-extrabold'
                      : 'text-stone-700 hover:text-[#9B111E] hover:bg-stone-50'
                  }`}
                  aria-expanded={isExploreOpen}
                >
                  <span>{t('nav.explore', 'Explore')}</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      isExploreOpen ? 'rotate-180 text-[#9B111E]' : 'text-stone-400'
                    }`}
                  />
                </button>

                {/* Explore Dropdown Card */}
                <AnimatePresence>
                  {isExploreOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.98 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full left-0 mt-1.5 w-80 max-w-[90vw] bg-white rounded-3xl shadow-2xl border border-stone-200/90 p-3 z-[100]"
                    >
                      <div className="px-2 py-1.5 border-b border-stone-100 mb-2">
                        <span className="text-[11px] font-black uppercase text-stone-500 tracking-wider">
                          About & Information
                        </span>
                      </div>

                      <div className="space-y-1">
                        {exploreLinks.map((item) => {
                          const Icon = item.icon;
                          const isActive = pathname === item.href;
                          return (
                            <Link
                              key={item.href}
                              to={item.href}
                              onClick={() => setIsExploreOpen(false)}
                              className={`p-2.5 rounded-2xl flex items-start gap-3 transition-all group ${
                                isActive
                                  ? 'bg-[#9B111E]/5 border border-[#9B111E]/20'
                                  : 'hover:bg-stone-50 border border-transparent'
                              }`}
                            >
                              <div className={`w-8 h-8 rounded-xl ${item.bgColor} ${item.iconColor} flex items-center justify-center shrink-0 mt-0.5`}>
                                <Icon className="w-4 h-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-1">
                                  <span className={`text-xs font-bold ${isActive ? 'text-[#9B111E]' : 'text-stone-900 group-hover:text-[#9B111E]'}`}>
                                    {item.title}
                                  </span>
                                  {item.badge && (
                                    <span className="text-[9px] font-black uppercase bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-md">
                                      {item.badge}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] text-stone-500 leading-tight mt-0.5 line-clamp-1">
                                  {item.desc}
                                </p>
                              </div>
                            </Link>
                          );
                        })}
                      </div>

                      <div className="mt-2 pt-2 border-t border-stone-100 px-2 py-1 flex items-center justify-between text-[11px]">
                        <span className="text-stone-500">Need immediate help?</span>
                        <a
                          href={`tel:${phoneHref}`}
                          className="font-bold text-[#D9531E] hover:underline flex items-center gap-1"
                        >
                          <PhoneCall className="w-3 h-3" />
                          <span>{phoneDisplay}</span>
                        </a>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Contact Us */}
              <Link
                to="/contact"
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  pathname === '/contact'
                    ? 'text-[#9B111E] bg-[#9B111E]/5 font-extrabold'
                    : 'text-stone-700 hover:text-[#9B111E] hover:bg-stone-50'
                }`}
              >
                {t('nav.contact', 'Contact Us')}
              </Link>

            </nav>

            {/* Action Controls (Search Icon, Language Dropdown, Wishlist, Cart, Account) */}
            {/* Right Action Controls */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Search Button (Icon only) */}
              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                className="p-1.5 xs:p-2 sm:p-2.5 rounded-xl sm:rounded-2xl text-stone-700 hover:bg-stone-100 hover:text-stone-900 border border-stone-200/90 transition-colors cursor-pointer shrink-0 shadow-2xs"
                title={t('nav.search', 'Search')}
                aria-label="Search"
              >
                <Search className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-stone-700" />
              </button>

              {/* Language Dropdown at the Right Side of Search Bar Icon */}
              <LanguageToggle variant="dropdown" />

              {/* Wishlist Link */}
              <Link
                to="/shop"
                className="relative p-1.5 xs:p-2 sm:p-2.5 rounded-xl sm:rounded-2xl text-stone-700 hover:bg-stone-100 hover:text-stone-900 border border-stone-200/90 transition-colors hidden sm:inline-flex cursor-pointer shrink-0 shadow-2xs"
                title="Your Wishlist"
              >
                <Heart className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                {wishlist.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#D9531E] text-white text-[10px] font-black flex items-center justify-center ring-2 ring-white">
                    {wishlist.length}
                  </span>
                )}
              </Link>

              {/* Cart Button */}
              <button
                type="button"
                onClick={() => setIsCartOpen(true)}
                className="relative p-1.5 xs:p-2 sm:px-3 sm:py-2 rounded-xl sm:rounded-2xl text-stone-700 hover:bg-stone-100 hover:text-stone-900 border border-stone-200/90 transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 shadow-2xs"
                title="Open Shopping Cart"
                aria-label="Shopping Cart"
              >
                <div className="relative">
                  <ShoppingBag className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-[#9B111E]" />
                  {totalItems > 0 && (
                    <span className="absolute -top-1.5 -right-2 w-4 h-4 rounded-full bg-[#9B111E] text-white text-[10px] font-black flex items-center justify-center ring-2 ring-white">
                      {totalItems}
                    </span>
                  )}
                </div>
                {totalItems > 0 && (
                  <span className="hidden md:inline-block text-xs font-black text-stone-900 whitespace-nowrap">
                    ₹{subtotal}
                  </span>
                )}
              </button>

              {/* User Account / Auth Dropdown */}
              <div className="relative shrink-0" ref={userMenuRef}>
                {isAuthenticated && user ? (
                  <div className="flex items-center gap-1 sm:gap-2">
                    <button
                      type="button"
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                      className="flex items-center gap-1.5 p-1 sm:px-3 sm:py-2 rounded-full sm:rounded-2xl bg-stone-100 hover:bg-stone-200/80 transition-colors cursor-pointer border border-stone-200/80 shadow-2xs whitespace-nowrap"
                      aria-label="User account menu"
                      title={user.name}
                    >
                      <img
                        src={userAvatar}
                        alt={user.name}
                        className="w-7 h-7 sm:w-6.5 sm:h-6.5 rounded-full object-cover ring-1 ring-[#9B111E] bg-stone-100 shrink-0"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = fallbackAvatar;
                        }}
                      />
                      <span className="hidden sm:inline text-xs font-bold text-stone-800 max-w-[100px] truncate whitespace-nowrap">
                        {(user.name || '').split(' ')[0]}
                      </span>
                      <ChevronDown className="hidden sm:inline w-3.5 h-3.5 text-stone-500 shrink-0" />
                    </button>

                    {/* User Dropdown Menu */}
                    <AnimatePresence>
                      {isUserMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-stone-200/80 p-2 z-[100] text-xs"
                        >
                          <div className="px-3 py-2 border-b border-stone-100 mb-1 flex items-center gap-2.5">
                            <img
                              src={userAvatar}
                              alt={user.name}
                              className="w-8 h-8 rounded-full object-cover ring-1 ring-[#9B111E]/30 shrink-0 bg-stone-100"
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = fallbackAvatar;
                              }}
                            />
                            <div className="truncate">
                              <p className="font-black text-stone-900 truncate whitespace-nowrap">{user.name}</p>
                              <p className="text-[11px] text-stone-500 truncate whitespace-nowrap">{user.email}</p>
                            </div>
                          </div>

                          <Link
                            to="/account"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-stone-700 hover:bg-stone-50 hover:text-[#9B111E] font-semibold transition-colors whitespace-nowrap"
                          >
                            <UserIcon className="w-4 h-4 text-stone-400 shrink-0" />
                            <span>My Account</span>
                          </Link>

                          <Link
                            to="/account"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-stone-700 hover:bg-stone-50 hover:text-[#9B111E] font-semibold transition-colors whitespace-nowrap"
                          >
                            <Package className="w-4 h-4 text-stone-400 shrink-0" />
                            <span>My Orders</span>
                          </Link>

                          <Link
                            to="/account"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-stone-700 hover:bg-stone-50 hover:text-[#9B111E] font-semibold transition-colors whitespace-nowrap"
                          >
                            <MapPin className="w-4 h-4 text-stone-400 shrink-0" />
                            <span>Saved Addresses</span>
                          </Link>

                          {Boolean(
                            user.email?.toLowerCase() === 'operationalhtklabs@gmail.com' ||
                            user.role === 'admin' ||
                            user.role === 'super_admin' ||
                            user.role === 'sub_admin' ||
                            user.isStaff ||
                            (user.role && user.role !== 'customer') ||
                            (user.permissions && user.permissions.length > 0) ||
                            (user.customPermissions && user.customPermissions.length > 0)
                          ) && (
                            <Link
                              to="/admin"
                              onClick={() => setIsUserMenuOpen(false)}
                              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-amber-900 bg-amber-50 hover:bg-amber-100 font-bold transition-colors mt-1 whitespace-nowrap border border-amber-200/60"
                            >
                              <Store className="w-4 h-4 text-amber-700 shrink-0" />
                              <span>Admin Portal</span>
                            </Link>
                          )}

                          <div className="border-t border-stone-100 mt-1 pt-1">
                            <button
                              type="button"
                              onClick={() => {
                                logout();
                                setIsUserMenuOpen(false);
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-red-700 hover:bg-red-50 font-bold transition-colors cursor-pointer whitespace-nowrap"
                            >
                              <LogOut className="w-4 h-4 shrink-0" />
                              <span>Log Out</span>
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => openAuthModal('login')}
                    className="inline-flex items-center justify-center p-1.5 xs:p-2 sm:px-3.5 sm:py-2 gap-1.5 rounded-xl sm:rounded-2xl bg-[#9B111E] hover:bg-[#800A14] text-white text-xs font-bold shadow-2xs transition-all cursor-pointer shrink-0"
                    aria-label={t('nav.login', 'Login')}
                    title={t('nav.login', 'Login')}
                  >
                    <UserIcon className="w-4 h-4 sm:w-3.5 sm:h-3.5 shrink-0" />
                    <span className="hidden sm:inline whitespace-nowrap">{t('nav.login', 'Login')}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Full-Screen Sidebar Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-[100] lg:hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-stone-950/60 backdrop-blur-sm"
            />

            {/* Full-Screen Drawer Menu */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              className="fixed inset-0 w-full h-full bg-white flex flex-col z-10 overflow-hidden"
            >
              {/* Top Header Bar */}
              <div className="flex items-center justify-between px-4 py-3.5 border-b border-stone-200/90 bg-white shrink-0 shadow-2xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  {(() => {
                    const logoUrl = settings.appLogo || DEFAULT_HEADER_LOGO;
                    return logoUrl ? (
                      <img
                        src={optimizeImageUrl(logoUrl, 160)}
                        alt={storeName}
                        className="h-9 w-auto max-w-[120px] object-contain rounded-lg shrink-0"
                        onError={(e) => {
                          const target = e.currentTarget;
                          if (target.src !== DEFAULT_HEADER_LOGO) {
                            target.src = DEFAULT_HEADER_LOGO;
                          }
                        }}
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-xl bg-[#9B111E] text-white font-black flex items-center justify-center text-sm shrink-0">
                        AJW
                      </div>
                    );
                  })()}
                  <div className="truncate">
                    <h3 className="font-black text-sm text-stone-900 leading-tight truncate whitespace-nowrap">{storeName}</h3>
                    <p className="text-[10px] font-bold text-[#D9531E] truncate whitespace-nowrap">{tagline}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 rounded-full text-stone-500 bg-stone-100 hover:bg-stone-200 hover:text-stone-900 transition-colors cursor-pointer shrink-0"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Content Body */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-stone-50/40">
                {/* Search Bar Button */}
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setIsSearchOpen(true);
                    }}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-white border border-stone-200/90 text-stone-500 text-xs font-semibold shadow-2xs hover:border-[#9B111E]/40 hover:bg-stone-50/80 transition-all cursor-pointer whitespace-nowrap"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Search className="w-4 h-4 text-[#9B111E] shrink-0" />
                      <span className="truncate whitespace-nowrap">{t('nav.search_placeholder', 'Search snacks, banana chips, masalas...')}</span>
                    </div>
                    <span className="text-[10px] uppercase font-bold text-stone-400 bg-stone-100 px-2 py-0.5 rounded-md shrink-0">
                      Search
                    </span>
                  </button>
                </div>

                {/* Mobile Language Selector Box */}
                <LanguageToggle variant="mobile" />

                {/* Dedicated Woman Business Partner Program & Login Section */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-rose-500/5 to-amber-500/10 border border-amber-300/90 shadow-2xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Sparkles className="w-4 h-4 text-[#9B111E] shrink-0" />
                      <span className="text-xs font-black text-stone-900 truncate whitespace-nowrap">Woman Partner Program</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-[#9B111E] text-white text-[9px] font-black uppercase tracking-wider whitespace-nowrap shrink-0">
                      Earn 12%
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-600 font-medium leading-tight truncate whitespace-nowrap">
                    Earn 12% commission by sharing on WhatsApp
                  </p>
                  <div className="grid grid-cols-2 gap-2 pt-0.5">
                    <Link
                      to="/partner-program"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="py-2.5 px-2 rounded-xl bg-[#9B111E] text-white text-xs font-bold text-center hover:bg-[#800A14] transition-colors whitespace-nowrap truncate shadow-2xs flex items-center justify-center gap-1"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                      <span className="whitespace-nowrap">Join (₹699)</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        openAuthModal('partner');
                      }}
                      className="py-2.5 px-2 rounded-xl bg-amber-100 hover:bg-amber-200/80 text-amber-950 border border-amber-300 text-xs font-bold text-center transition-colors whitespace-nowrap truncate flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <TrendingUp className="w-3.5 h-3.5 text-amber-800 shrink-0" />
                      <span className="whitespace-nowrap">Woman Partner Login</span>
                    </button>
                  </div>
                </div>

                {/* Primary Navigation Directory */}
                <div className="bg-white p-3 rounded-2xl border border-stone-200/90 shadow-2xs space-y-1">
                  <div className="px-2 py-1 mb-1">
                    <span className="text-[10px] font-black uppercase text-stone-400 tracking-wider whitespace-nowrap">
                      Store Navigation
                    </span>
                  </div>

                  <Link
                    to="/"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                      pathname === '/' ? 'bg-[#9B111E] text-white shadow-xs' : 'text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    <span>{t('nav.home', 'Home')}</span>
                    <ChevronRight className={`w-3.5 h-3.5 ${pathname === '/' ? 'text-white' : 'text-stone-300'}`} />
                  </Link>

                  <Link
                    to="/shop"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                      pathname === '/shop' ? 'bg-[#9B111E] text-white shadow-xs' : 'text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    <span>{t('nav.shop', 'Shop All Products')}</span>
                    <ChevronRight className={`w-3.5 h-3.5 ${pathname === '/shop' ? 'text-white' : 'text-stone-300'}`} />
                  </Link>

                  <Link
                    to="/navratri-offer"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                      pathname === '/navratri-offer'
                        ? 'bg-[#9B111E] text-white shadow-xs font-extrabold'
                        : 'bg-amber-50/70 text-[#D9531E] border border-amber-200/60'
                    }`}
                  >
                    <span className="flex items-center gap-2 truncate whitespace-nowrap">
                      <Gift className="w-4 h-4 text-[#D9531E] shrink-0" />
                      <span className="truncate">{t('nav.navratri', 'Navratri Offer 🎁')}</span>
                    </span>
                  </Link>

                  {/* Categories Collapsible Accordion in Mobile Menu */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setMobileCategoriesExpanded(!mobileCategoriesExpanded)}
                      className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-bold text-stone-700 hover:bg-stone-50 cursor-pointer whitespace-nowrap"
                    >
                      <span className="flex items-center gap-2 truncate whitespace-nowrap">
                        <Layers className="w-4 h-4 text-[#9B111E] shrink-0" />
                        <span className="truncate">Categories ({categories.length})</span>
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 shrink-0 ${
                          mobileCategoriesExpanded ? 'rotate-180 text-[#9B111E]' : 'text-stone-400'
                        }`}
                      />
                    </button>

                    {mobileCategoriesExpanded && (
                      <div className="pl-4 pr-1 py-1 space-y-1 border-l-2 border-[#9B111E]/20 ml-4 mt-1">
                        <Link
                          to="/categories"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-black text-[#9B111E] hover:bg-[#9B111E]/10 whitespace-nowrap"
                        >
                          <span className="truncate">View All Categories</span>
                          <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                        </Link>
                        {categories.map((cat) => {
                          const cleanName = getCleanCategoryName(cat.name);
                          const icon = CATEGORY_ICONS[cat.slug] || '✨';
                          const isUpwas = cat.slug === 'upwas-special';
                          const targetUrl = isUpwas ? '/upwas-special' : `/shop?category=${cat.slug}`;

                          return (
                            <Link
                              key={cat.slug || cat.id}
                              to={targetUrl}
                              onClick={() => setIsMobileMenuOpen(false)}
                              className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-stone-700 hover:text-[#9B111E] hover:bg-stone-50 whitespace-nowrap group"
                            >
                              <span className="flex items-center gap-2.5 truncate whitespace-nowrap">
                                {cat.image ? (
                                  <img
                                    src={optimizeImageUrl(cat.image, { width: 60, quality: 'auto' })}
                                    alt={cleanName}
                                    className="w-5 h-5 rounded-md object-cover border border-amber-200/60 shrink-0"
                                  />
                                ) : (
                                  <span className="text-sm shrink-0">{icon}</span>
                                )}
                                <span className="truncate font-bold text-stone-900 group-hover:text-[#9B111E]">{cleanName}</span>
                              </span>
                              <ChevronRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-[#9B111E] shrink-0 ml-2" />
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Explore & Brand Collapsible Accordion in Mobile Menu */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setMobileExploreExpanded(!mobileExploreExpanded)}
                      className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-bold text-stone-700 hover:bg-stone-50 cursor-pointer whitespace-nowrap"
                    >
                      <span className="flex items-center gap-2 truncate whitespace-nowrap">
                        <BookOpen className="w-4 h-4 text-amber-600 shrink-0" />
                        <span className="truncate">Explore & Story</span>
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 shrink-0 ${
                          mobileExploreExpanded ? 'rotate-180 text-amber-600' : 'text-stone-400'
                        }`}
                      />
                    </button>

                    {mobileExploreExpanded && (
                      <div className="pl-4 pr-1 py-1 space-y-1 border-l-2 border-stone-200 ml-4 mt-1">
                        {exploreLinks.map((item) => {
                          const Icon = item.icon;
                          return (
                            <Link
                              key={item.href}
                              to={item.href}
                              onClick={() => setIsMobileMenuOpen(false)}
                              className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-stone-700 hover:text-[#9B111E] hover:bg-stone-50 whitespace-nowrap"
                            >
                              <span className="flex items-center gap-2 truncate whitespace-nowrap">
                                <Icon className={`w-4 h-4 ${item.iconColor} shrink-0`} />
                                <span className="truncate">{item.title}</span>
                              </span>
                              {item.badge && (
                                <span className="text-[9px] font-black uppercase bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-md whitespace-nowrap shrink-0">
                                  {item.badge}
                                </span>
                              )}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <Link
                    to="/franchise"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                      pathname === '/franchise'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-emerald-800 bg-emerald-50/60 hover:bg-emerald-100'
                    }`}
                  >
                    <span className="flex items-center gap-2 truncate whitespace-nowrap">
                      <Store className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="truncate">Franchise Opportunities</span>
                    </span>
                    <span className="text-[10px] font-black uppercase text-emerald-700 bg-white px-2 py-0.5 rounded-full whitespace-nowrap shrink-0">
                      40-50% Margin
                    </span>
                  </Link>

                  <Link
                    to="/contact"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                      pathname === '/contact'
                        ? 'bg-[#9B111E] text-white shadow-xs'
                        : 'text-stone-800 hover:bg-stone-50'
                    }`}
                  >
                    <span className="flex items-center gap-2 truncate whitespace-nowrap">
                      <PhoneCall className="w-4 h-4 text-[#D9531E] shrink-0" />
                      <span className="truncate">Contact Us & Stores</span>
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-stone-300 shrink-0" />
                  </Link>
                </div>

                {/* Account & Authentication Section */}
                <div className="bg-white p-3 rounded-2xl border border-stone-200/90 shadow-2xs space-y-2.5">
                  <div className="px-2 py-0.5">
                    <span className="text-[10px] font-black uppercase text-stone-400 tracking-wider whitespace-nowrap">
                      Account & Access
                    </span>
                  </div>

                  {isAuthenticated && user ? (
                    <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200/80 space-y-2">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={userAvatar}
                          alt={user.name}
                          className="w-8 h-8 rounded-full object-cover ring-1 ring-[#9B111E]/30 shrink-0 bg-stone-100"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = fallbackAvatar;
                          }}
                        />
                        <div className="truncate min-w-0">
                          <p className="text-xs font-bold text-stone-900 truncate whitespace-nowrap">{user.name}</p>
                          <p className="text-[10px] text-stone-400 truncate whitespace-nowrap">{user.email}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <Link
                          to="/account"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="text-center py-2 bg-white border border-stone-200 rounded-xl text-xs font-bold text-stone-700 hover:bg-stone-100 whitespace-nowrap"
                        >
                          My Account
                        </Link>
                        <button
                          type="button"
                          onClick={() => {
                            logout();
                            setIsMobileMenuOpen(false);
                          }}
                          className="py-2 bg-red-50 text-red-700 rounded-xl text-xs font-bold hover:bg-red-100 cursor-pointer whitespace-nowrap"
                        >
                          Log Out
                        </button>
                      </div>

                      {Boolean(
                        user.email?.toLowerCase() === 'operationalhtklabs@gmail.com' ||
                        user.role === 'admin' ||
                        user.role === 'super_admin' ||
                        user.role === 'sub_admin' ||
                        user.isStaff ||
                        (user.role && user.role !== 'customer') ||
                        (user.permissions && user.permissions.length > 0) ||
                        (user.customPermissions && user.customPermissions.length > 0)
                      ) && (
                        <Link
                          to="/admin"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-amber-50 text-amber-950 border border-amber-300 rounded-xl text-xs font-bold hover:bg-amber-100 transition-colors whitespace-nowrap"
                        >
                          <Store className="w-4 h-4 text-amber-700 shrink-0" />
                          <span>Open Admin Portal</span>
                        </Link>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          openAuthModal('login');
                        }}
                        className="w-full py-2.5 rounded-xl bg-[#9B111E] hover:bg-[#800A14] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-2xs cursor-pointer transition-colors whitespace-nowrap"
                      >
                        <UserIcon className="w-4 h-4 shrink-0" />
                        <span className="whitespace-nowrap">{t('nav.login', 'Login')}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          openAuthModal('partner');
                        }}
                        className="w-full py-2.5 rounded-xl bg-amber-50 text-amber-950 border border-amber-300 text-xs font-bold flex items-center justify-center gap-2 hover:bg-amber-100 transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <TrendingUp className="w-4 h-4 text-amber-700 shrink-0" />
                        <span className="whitespace-nowrap">Woman Partner Login</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Footer Info & Support Contacts */}
                <div className="text-center text-[11px] text-stone-500 space-y-1 pt-2 pb-4">
                  <p className="whitespace-nowrap truncate font-medium">Customer Support: <a href={`tel:${phoneHref}`} className="font-bold text-stone-800 hover:text-[#9B111E]">{phoneDisplay}</a></p>
                  <p className="whitespace-nowrap truncate"><a href={`mailto:${emailDisplay}`} className="text-[10px] text-stone-600 hover:underline">{emailDisplay}</a></p>
                  <p className="text-[10px] text-stone-400 pt-1">100% Khandeshi Authentic Taste • Pure Quality</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Global Search Overlay */}
      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}

export default Navbar;
