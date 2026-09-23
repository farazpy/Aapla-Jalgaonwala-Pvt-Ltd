'use client';

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSettings } from '@/context/SettingsContext';
import { useLanguage } from '@/context/LanguageContext';
import { LanguageToggle } from '@/components/navigation/LanguageToggle';
import {
  MapPin,
  PhoneCall,
  Mail,
  Instagram,
  Facebook,
  Youtube,
  Send,
  ShieldCheck,
  Truck,
  Sparkles,
  Heart,
  ChevronRight,
  CheckCircle2
} from 'lucide-react';

export function Footer() {
  const { settings } = useSettings();
  const [emailInput, setEmailInput] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const phoneDisplay = settings.contactPhone || '+91 70574 46409';
  const phoneHref = phoneDisplay.replace(/[^\d+]/g, '');
  const emailDisplay = settings.contactEmail || 'info@aaplajalgaonwala.com';
  const addressDisplay = settings.storeAddress || 'Gat No. 142, Yelwadi, Dehu-Alandi Road, Pune, Maharashtra 412109';
  const storeNameDisplay = settings.storeName || 'Aapla Jalgaonwala';
  const taglineDisplay = settings.tagline || 'Khandeshi Swaad, Shuddhata Aapli';

  const handleNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailInput.trim()) {
      setSubscribed(true);
      setEmailInput('');
      setTimeout(() => setSubscribed(false), 5000);
    }
  };

  return (
    <footer className="bg-stone-950 text-stone-300 pt-14 pb-8 border-t border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Badges / Guarantees */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-12 border-b border-stone-800">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-stone-900/60 border border-stone-800/80">
            <div className="w-10 h-10 rounded-xl bg-[#9B111E]/20 text-[#D9531E] flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-black text-white">Authentic Khandeshi</h4>
              <p className="text-[10px] text-stone-400">Pure recipes from Jalgaon</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-2xl bg-stone-900/60 border border-stone-800/80">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-black text-white">All India Delivery</h4>
              <p className="text-[10px] text-stone-400">Fresh dispatched in 24h</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-2xl bg-stone-900/60 border border-stone-800/80">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-black text-white">100% Quality Tested</h4>
              <p className="text-[10px] text-stone-400">Zero artificial additives</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-2xl bg-stone-900/60 border border-stone-800/80">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
              <Heart className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-black text-white">40,000+ Happy Families</h4>
              <p className="text-[10px] text-stone-400">Loved across India</p>
            </div>
          </div>
        </div>

        {/* Main Footer Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 py-12 border-b border-stone-800">
          
          {/* Col 1: Brand & Bio (2 cols on lg) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              {(() => {
                const logoUrl = settings.appLogo || DEFAULT_HEADER_LOGO;
                return logoUrl ? (
                  <img loading="lazy"
                    src={logoUrl}
                    alt={storeNameDisplay}
                    className="h-10 w-auto max-w-[150px] object-contain rounded-xl"
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (target.src !== DEFAULT_HEADER_LOGO) {
                        target.src = DEFAULT_HEADER_LOGO;
                      }
                    }}
                  />
                ) : (
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#9B111E] to-[#D9531E] flex items-center justify-center text-white font-black text-lg shadow-md">
                    AJW
                  </div>
                );
              })()}
              <div>
                <h3 className="text-base font-black text-white leading-tight">{storeNameDisplay}</h3>
                <p className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                  {taglineDisplay}
                </p>
              </div>
            </div>

            <p className="text-xs text-stone-400 leading-relaxed max-w-sm">
              Bringing the authentic crunch, spicy masalas, and sacred Upwas specialties of Jalgaon, Maharashtra directly to your doorsteps across India.
            </p>

            <div className="space-y-2 pt-2 text-xs">
              <div className="flex items-start gap-2.5 text-stone-400">
                <MapPin className="w-4 h-4 text-[#D9531E] shrink-0 mt-0.5" />
                <span>{addressDisplay}</span>
              </div>
              <div className="flex items-center gap-2.5 text-stone-400">
                <PhoneCall className="w-4 h-4 text-[#D9531E] shrink-0" />
                <a href={`tel:${phoneHref}`} className="hover:text-white transition-colors">
                  {phoneDisplay}
                </a>
              </div>
              <div className="flex items-center gap-2.5 text-stone-400">
                <Mail className="w-4 h-4 text-[#D9531E] shrink-0" />
                <a href={`mailto:${emailDisplay}`} className="hover:text-white transition-colors">
                  {emailDisplay}
                </a>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-3 pt-2">
              <a
                href={settings.socialLinks?.instagram || 'https://www.instagram.com/aapla_jalgaonwala__19/'}
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-xl bg-stone-900 hover:bg-[#E1306C] text-stone-400 hover:text-white flex items-center justify-center transition-all"
                title="Follow us on Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href={settings.socialLinks?.facebook || 'https://www.facebook.com/profile.php?id=61572308534512'}
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-xl bg-stone-900 hover:bg-[#1877F2] text-stone-400 hover:text-white flex items-center justify-center transition-all"
                title="Follow us on Facebook"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href={settings.socialLinks?.youtube || 'https://www.youtube.com/@aaplajalgaonwala'}
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-xl bg-stone-900 hover:bg-[#FF0000] text-stone-400 hover:text-white flex items-center justify-center transition-all"
                title="Watch us on YouTube"
              >
                <Youtube className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase text-white tracking-wider">Quick Links</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/" className="hover:text-amber-400 transition-colors flex items-center gap-1.5">
                  <ChevronRight className="w-3 h-3 text-stone-600" />
                  <span>Home</span>
                </Link>
              </li>
              <li>
                <Link to="/shop" className="hover:text-amber-400 transition-colors flex items-center gap-1.5">
                  <ChevronRight className="w-3 h-3 text-stone-600" />
                  <span>Shop All Products</span>
                </Link>
              </li>
              <li>
                <Link to="/categories" className="hover:text-amber-400 transition-colors flex items-center gap-1.5">
                  <ChevronRight className="w-3 h-3 text-stone-600" />
                  <span>Browse Categories</span>
                </Link>
              </li>
              <li>
                <Link to="/upwas-special" className="hover:text-amber-400 transition-colors flex items-center gap-1.5">
                  <ChevronRight className="w-3 h-3 text-stone-600" />
                  <span className="text-amber-300 font-bold">Upwas Special (Fasting)</span>
                </Link>
              </li>
              <li>
                <Link to="/cart" className="hover:text-amber-400 transition-colors flex items-center gap-1.5">
                  <ChevronRight className="w-3 h-3 text-stone-600" />
                  <span>Shopping Cart</span>
                </Link>
              </li>
              <li>
                <Link to="/account" className="hover:text-amber-400 transition-colors flex items-center gap-1.5">
                  <ChevronRight className="w-3 h-3 text-stone-600" />
                  <span>My Account & Orders</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Company & Information */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase text-white tracking-wider">Company</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/our-story" className="hover:text-amber-400 transition-colors flex items-center gap-1.5">
                  <ChevronRight className="w-3 h-3 text-stone-600" />
                  <span>Our Story & Heritage</span>
                </Link>
              </li>
              <li>
                <Link to="/women-business-partner" className="hover:text-amber-400 transition-colors flex items-center gap-1.5">
                  <ChevronRight className="w-3 h-3 text-stone-600" />
                  <span className="text-amber-300 font-bold">Women Partner Program</span>
                </Link>
              </li>
              <li>
                <Link to="/woman-partner-login" className="hover:text-amber-400 transition-colors flex items-center gap-1.5">
                  <ChevronRight className="w-3 h-3 text-stone-600" />
                  <span className="text-stone-300 font-semibold">Woman Partner Login</span>
                </Link>
              </li>
              <li>
                <Link to="/franchise" className="hover:text-amber-400 transition-colors flex items-center gap-1.5">
                  <ChevronRight className="w-3 h-3 text-stone-600" />
                  <span className="text-emerald-400 font-bold">Franchise Opportunities</span>
                </Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-amber-400 transition-colors flex items-center gap-1.5">
                  <ChevronRight className="w-3 h-3 text-stone-600" />
                  <span>Frequently Asked Questions</span>
                </Link>
              </li>
              <li>
                <Link to="/instagram" className="hover:text-amber-400 transition-colors flex items-center gap-1.5">
                  <ChevronRight className="w-3 h-3 text-stone-600" />
                  <span>Instagram Community</span>
                </Link>
              </li>
              <li>
                <Link to="/privacy-policy" className="hover:text-amber-400 transition-colors flex items-center gap-1.5">
                  <ChevronRight className="w-3 h-3 text-stone-600" />
                  <span>Privacy Policy</span>
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-amber-400 transition-colors flex items-center gap-1.5">
                  <ChevronRight className="w-3 h-3 text-stone-600" />
                  <span>Contact Us & Stores</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Newsletter & Offers */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase text-white tracking-wider">Stay In Touch</h4>
            <p className="text-xs text-stone-400 leading-relaxed">
              Subscribe to get secret festival coupon codes and first notification on freshly prepared batches.
            </p>

            <form onSubmit={handleNewsletter} className="space-y-2">
              <div className="relative">
                <input
                  type="email"
                  required
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-xs text-white placeholder:text-stone-500 focus:outline-none focus:border-[#D9531E]"
                />
                <button
                  type="submit"
                  className="absolute right-1.5 top-1.5 p-1.5 rounded-lg bg-[#9B111E] text-white hover:bg-[#800A14] transition-colors cursor-pointer"
                  title="Subscribe"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>

              {subscribed && (
                <div className="flex items-center gap-1.5 text-emerald-400 text-[11px] font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Thank you! You are on our VIP list.</span>
                </div>
              )}
            </form>

            <div className="pt-2">
              <span className="text-[10px] text-stone-500 block">Accepted Payment Modes:</span>
              <p className="text-[11px] font-bold text-stone-400 mt-1">UPI • GPay • PhonePe • Cards • Netbanking • Cash on Delivery</p>
            </div>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-stone-500">
          <p className="flex items-center gap-2 flex-wrap text-center sm:text-left">
            <span>© {new Date().getFullYear()} {storeNameDisplay}. All Rights Reserved. Crafted with pure ingredients.</span>
          </p>
          <div className="flex items-center gap-4 flex-wrap justify-center">
            <LanguageToggle variant="compact" />
            <span className="text-stone-700 hidden sm:inline">•</span>
            <Link to="/privacy-policy" className="hover:text-stone-400 transition-colors">Privacy Policy</Link>
            <span>•</span>
            <Link to="/faq" className="hover:text-stone-400 transition-colors">Terms of Service</Link>
            <span>•</span>
            <Link to="/contact" className="hover:text-stone-400 transition-colors">Shipping Policy</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}

export default Footer;
