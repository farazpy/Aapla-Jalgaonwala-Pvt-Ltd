'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  ShoppingBag,
  Heart,
  User,
  Menu,
  X,
  MapPin,
  ChevronRight,
  PhoneCall
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { IconButton } from '../ui/IconButton';
import { Drawer } from '../ui/Drawer';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { initialProducts } from '@/data/products';
import { ProductCard } from '../product/ProductCard';

import dynamic from 'next/dynamic';

const SearchOverlay = dynamic(() => import('./SearchOverlay').then(m => m.SearchOverlay), {
  ssr: false
});

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { totalItems, setIsCartOpen } = useCart();
  const { totalWishlistItems } = useWishlist();

  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOverlayOpen, setSearchOverlayOpen] = useState(false);
  const [siteLogo, setSiteLogo] = useState<string | null>('https://res.cloudinary.com/db7nvcm4i/image/upload/fl_original/v1789546237/branding/1789546235891_wqs7e2wxhhj4chie8bun__1_.png');
  const [storeTitle, setStoreTitle] = useState('Aapla Jalgaonwala');
  const [siteTagline, setSiteTagline] = useState('Authentic Khandeshi Taste');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);

    // Read cached values after hydration
    const timer = setTimeout(() => {
      const cachedLogo = localStorage.getItem('ajw_site_logo');
      if (cachedLogo) setSiteLogo(cachedLogo);

      const cachedTitle = localStorage.getItem('ajw_store_title');
      if (cachedTitle) setStoreTitle(cachedTitle);

      const cachedTagline = localStorage.getItem('ajw_site_tagline');
      if (cachedTagline) setSiteTagline(cachedTagline);
    }, 0);

    // Fetch live settings for logo and store details
    fetch('/api/settings')
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          if (json.data.appLogo) {
            setSiteLogo(json.data.appLogo);
            localStorage.setItem('ajw_site_logo', json.data.appLogo);
          }
          if (json.data.storeName) {
            setStoreTitle(json.data.storeName);
            localStorage.setItem('ajw_store_title', json.data.storeName);
          }
          if (json.data.tagline) {
            setSiteTagline(json.data.tagline);
            localStorage.setItem('ajw_site_tagline', json.data.tagline);
          }
        }
      })
      .catch((err) => console.log('Navbar settings fetch note:', err));

    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Shop', href: '/shop' },
    { name: 'Upwas Special', href: '/upwas-special', badge: 'Fasting' },
    { name: 'Categories', href: '/categories' },
    { name: 'Our Story', href: '/our-story' },
    { name: 'Franchise', href: '/franchise' },
    { name: 'Contact', href: '/contact' },
  ];

  return (
    <>
      <header
        className={`sticky top-0 z-30 transition-all duration-300 w-full max-w-full overflow-hidden ${
          isScrolled
            ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-stone-200/80 py-2 sm:py-3'
            : 'bg-[#FAF6ED] border-b border-stone-200/50 py-2.5 sm:py-4'
        }`}
      >
        <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 w-full">
          <div className="flex items-center justify-between gap-1.5 sm:gap-4 w-full">
            {/* Brand Logo */}
            <Link href="/" prefetch={true} className="flex items-center gap-1.5 sm:gap-2.5 group min-w-0 flex-1 sm:flex-initial">
              {siteLogo ? (
                <div className="relative w-8 h-8 xs:w-9 xs:h-9 sm:w-11 sm:h-11 rounded-xl overflow-hidden border border-stone-200/80 bg-white p-1 shadow-sm group-hover:scale-105 transition-transform flex items-center justify-center shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={siteLogo} alt={storeTitle} className="w-full h-full object-contain" />
                </div>
              ) : (
                <div className="w-8 h-8 xs:w-9 xs:h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-[#9B111E] to-[#D9531E] flex items-center justify-center text-white font-extrabold text-xs sm:text-lg shadow-sm group-hover:scale-105 transition-transform shrink-0">
                  AJ
                </div>
              )}
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs xs:text-sm sm:text-lg lg:text-xl font-black tracking-tight text-stone-900 group-hover:text-[#9B111E] transition-colors leading-tight truncate">
                    {storeTitle}
                  </span>
                  <span className="text-[9px] font-mono font-bold text-stone-400 bg-stone-100 border border-stone-200/80 px-1 py-0.2 rounded select-none">
                    v1.3.9
                  </span>
                </div>
                <span className="text-[7.5px] xs:text-[8.5px] sm:text-[10px] font-semibold text-[#D9531E] tracking-widest uppercase truncate hidden xs:block">
                  {siteTagline}
                </span>
              </div>
            </Link>

            {/* Desktop Nav Links */}
            <nav className="hidden lg:flex items-center gap-7">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    prefetch={true}
                    className={`text-sm font-semibold transition-colors relative py-1 flex items-center gap-1.5 ${
                      isActive ? 'text-[#9B111E]' : 'text-stone-700 hover:text-[#9B111E]'
                    }`}
                  >
                    <span>{link.name}</span>
                    {link.badge && (
                      <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded-full bg-gradient-to-r from-amber-500 to-[#D9531E] text-white shadow-2xs">
                        {link.badge}
                      </span>
                    )}
                    {isActive && (
                      <motion.div
                        layoutId="activeNavIndicator"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#9B111E] rounded-full"
                      />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Desktop & Mobile Actions */}
            <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
              {/* Search Trigger */}
              <button
                onClick={() => setSearchOverlayOpen(true)}
                className="flex items-center gap-1.5 p-1.5 sm:px-3 sm:py-2 text-stone-600 hover:text-stone-900 bg-stone-100/80 hover:bg-stone-200/60 rounded-xl text-xs font-medium transition-colors shrink-0"
                title="Search snacks"
              >
                <Search className="w-4 h-4 text-stone-500" />
                <span className="hidden md:inline">Search snacks...</span>
              </button>

              {/* Wishlist Link */}
              <Link href="/shop?wishlist=true" prefetch={true} className="relative hidden xs:inline-flex shrink-0">
                <IconButton label="Wishlist">
                  <Heart className="w-5 h-5" />
                </IconButton>
                {totalWishlistItems > 0 && (
                  <span className="absolute top-0 right-0 w-4 h-4 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">
                    {totalWishlistItems}
                  </span>
                )}
              </Link>

              {/* Cart Button */}
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative flex items-center gap-1.5 bg-[#9B111E] hover:bg-[#800A14] text-white px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl transition-all shadow-xs shrink-0"
                title="Shopping Cart"
              >
                <ShoppingBag className="w-4 h-4" />
                <span className="hidden sm:inline text-xs font-bold">Cart</span>
                <span className="bg-white text-[#9B111E] text-xs font-extrabold px-1.5 py-0.5 rounded-md min-w-[18px] text-center">
                  {totalItems}
                </span>
              </button>

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-1.5 sm:p-2 text-stone-700 hover:text-stone-900 rounded-xl shrink-0"
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      <Drawer
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        title="Menu"
        position="left"
      >
        <div className="flex flex-col justify-between h-full py-2">
          <div className="space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                prefetch={true}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between p-3.5 rounded-2xl font-bold text-base transition-colors ${
                  pathname === link.href
                    ? 'bg-[#9B111E]/10 text-[#9B111E]'
                    : 'text-stone-800 hover:bg-stone-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>{link.name}</span>
                  {link.badge && (
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                      {link.badge}
                    </span>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-stone-400" />
              </Link>
            ))}
          </div>

          <div className="pt-6 border-t border-stone-200 mt-6 space-y-4">
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200">
              <p className="text-xs font-bold text-amber-900 mb-1">Aapla Jalgaonwala Store</p>
              <p className="text-xs text-stone-600 mb-2">Ground Floor, Shop No. 20, Yelwadi, Dehu, Pune</p>
              <a
                href="tel:+917057446409"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#9B111E]"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                +91 70574 46409
              </a>
            </div>
          </div>
        </div>
      </Drawer>

      {/* Search Overlay - Lazily Loaded */}
      {searchOverlayOpen && (
        <SearchOverlay
          isOpen={searchOverlayOpen}
          onClose={() => setSearchOverlayOpen(false)}
        />
      )}
    </>
  );
};
