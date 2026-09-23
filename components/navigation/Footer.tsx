'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, Phone, MapPin, Clock, ArrowRight, Instagram, Facebook, Youtube, Send } from 'lucide-react';
import { initialSiteSettings } from '@/data/settings';
import { Button } from '../ui/Button';

export const Footer: React.FC = () => {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [siteSettings, setSiteSettings] = useState(initialSiteSettings);

  React.useEffect(() => {
    let timer: NodeJS.Timeout;
    if (typeof window !== 'undefined') {
      timer = setTimeout(() => {
        const cached = localStorage.getItem('ajw_site_settings');
        if (cached) {
          try {
            setSiteSettings(prev => ({ ...prev, ...JSON.parse(cached) }));
          } catch {
            // Ignore JSON parse error
          }
        }
      }, 0);
    }

    fetch('/api/settings')
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          setSiteSettings(json.data);
          if (typeof window !== 'undefined') {
            localStorage.setItem('ajw_site_settings', JSON.stringify(json.data));
            if (json.data.appLogo) localStorage.setItem('ajw_site_logo', json.data.appLogo);
            if (json.data.storeName) localStorage.setItem('ajw_store_title', json.data.storeName);
            if (json.data.tagline) localStorage.setItem('ajw_site_tagline', json.data.tagline);
          }
        }
      })
      .catch((err) => console.log('Footer settings fetch note:', err));

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, []);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail.trim()) {
      setSubscribed(true);
      setNewsletterEmail('');
      setTimeout(() => setSubscribed(false), 3000);
    }
  };

  return (
    <footer className="bg-stone-900 text-stone-300 pt-16 pb-8 border-t border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Newsletter Banner */}
        <div className="bg-gradient-to-r from-[#9B111E] via-[#B8222F] to-[#D9531E] rounded-3xl p-6 sm:p-10 mb-16 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-1 text-center md:text-left">
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Get updates, offers and new flavours.</h3>
            <p className="text-xs sm:text-sm text-stone-200">
              Subscribe to receive exclusive Khandeshi snack launch alerts and seasonal discounts.
            </p>
          </div>

          <form onSubmit={handleSubscribe} className="w-full md:w-auto flex items-center gap-2 max-w-md">
            <div className="relative flex-1">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="email"
                required
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full pl-10 pr-4 py-3 bg-white text-stone-900 placeholder:text-stone-400 text-xs font-medium rounded-xl focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="bg-amber-400 hover:bg-amber-300 text-amber-950 font-bold px-5 py-3 rounded-xl text-xs whitespace-nowrap transition-colors flex items-center gap-1.5"
            >
              {subscribed ? 'Subscribed!' : 'Subscribe'}
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

        {/* Footer Links Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-stone-800">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              {siteSettings.appLogo ? (
                <div className="w-10 h-10 rounded-xl bg-white p-1 overflow-hidden flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={siteSettings.appLogo} alt={siteSettings.storeName} className="w-full h-full object-contain" />
                </div>
              ) : (
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#9B111E] to-[#D9531E] flex items-center justify-center text-white font-black text-base">
                  AJ
                </div>
              )}
              <span className="text-xl font-black text-white tracking-tight">{siteSettings.storeName}</span>
            </div>

            <p className="text-xs text-stone-400 max-w-sm leading-relaxed">
              Rooted in Tradition. Crafted for Modern Taste. Bringing authentic Jalgaon banana chips, farsaan and Khandeshi masalas directly from farmers to homes across India.
            </p>

            <div className="text-[11px] text-stone-500 space-y-0.5">
              <p>Operating under: <strong>{siteSettings.storeLegalNamePvt || initialSiteSettings.storeLegalNamePvt}</strong></p>
              <p>Retail Outlet: <strong>{siteSettings.storeLegalNameEnt || initialSiteSettings.storeLegalNameEnt}</strong></p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <a href={siteSettings.socialLinks?.instagram || initialSiteSettings.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-stone-800 text-stone-400 hover:text-white transition-colors" title="Instagram">
                <Instagram className="w-4 h-4" />
              </a>
              <a href={siteSettings.socialLinks?.facebook || initialSiteSettings.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-stone-800 text-stone-400 hover:text-white transition-colors" title="Facebook">
                <Facebook className="w-4 h-4" />
              </a>
              <a href={siteSettings.socialLinks?.youtube || initialSiteSettings.socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-stone-800 text-stone-400 hover:text-white transition-colors" title="YouTube">
                <Youtube className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">Shop Products</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/upwas-special" className="text-amber-400 font-bold hover:text-amber-300 transition-colors">Upwas Special (Fasting)</Link></li>
              <li><Link href="/shop?category=banana-chips" className="hover:text-amber-400 transition-colors">Banana Chips (10 Flavours)</Link></li>
              <li><Link href="/shop?category=farsaan" className="hover:text-amber-400 transition-colors">Farsaan & Savouries</Link></li>
              <li><Link href="/shop?category=kitchen-masalas" className="hover:text-amber-400 transition-colors">Kitchen Masalas</Link></li>
              <li><Link href="/shop?category=chutneys" className="hover:text-amber-400 transition-colors">Dry Chutneys</Link></li>
              <li><Link href="/shop?category=potato-chips" className="hover:text-amber-400 transition-colors">Potato Chips</Link></li>
              <li><Link href="/shop?category=combo-packs" className="hover:text-amber-400 transition-colors">Value Combos & Gifts</Link></li>
            </ul>
          </div>

          {/* Company & Support */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">Company</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/our-story" className="hover:text-amber-400 transition-colors">Our Story & Founders</Link></li>
              <li><Link href="/franchise" className="hover:text-amber-400 transition-colors">Franchise Inquiry</Link></li>
              <li><Link href="/contact" className="hover:text-amber-400 transition-colors">Contact Us</Link></li>
              <li><Link href="/admin" className="text-amber-400/90 font-bold hover:text-amber-300 transition-colors flex items-center gap-1">Admin Panel</Link></li>
              <li><Link href="/privacy-policy" className="hover:text-amber-400 transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-amber-400 transition-colors">Terms of Service</Link></li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">Contact Info</h4>
            <ul className="space-y-3 text-xs text-stone-400">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#D9531E] flex-shrink-0 mt-0.5" />
                <span className="leading-tight">{siteSettings.storeAddress || initialSiteSettings.storeAddress}</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#D9531E] flex-shrink-0" />
                <a href={`tel:${siteSettings.contactPhone || initialSiteSettings.contactPhone}`} className="hover:text-white transition-colors">{siteSettings.contactPhone || initialSiteSettings.contactPhone}</a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#D9531E] flex-shrink-0" />
                <a href={`mailto:${siteSettings.contactEmail || initialSiteSettings.contactEmail}`} className="hover:text-white transition-colors">{siteSettings.contactEmail || initialSiteSettings.contactEmail}</a>
              </li>
              <li className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-[#D9531E] flex-shrink-0 mt-0.5" />
                <span>Store: {siteSettings.storeHours || initialSiteSettings.storeHours}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Legal */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-4">
          <p>© 2026 Aapla Jalgaonwala. All rights reserved.</p>
          <p className="text-[11px]">Designed with pride in Maharashtra, India.</p>
        </div>
      </div>
    </footer>
  );
};
