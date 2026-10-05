'use client';

import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, PhoneCall, Mail, Sparkles } from 'lucide-react';
import { useSettings } from '@/context/SettingsContext';
import { useLanguage } from '@/context/LanguageContext';

export const AnnouncementBar: React.FC = () => {
  const { settings } = useSettings();
  const { isMarathi, t } = useLanguage();

  if (settings.announcementEnabled === false && !settings.contactPhone && !settings.contactEmail) return null;

  const phoneDisplay = settings.contactPhone || '+91 70574 46409';
  const phoneHref = phoneDisplay.replace(/[^\d+]/g, '');
  const emailDisplay = settings.contactEmail || 'info@aaplajalgaonwala.com';
  const announcement = isMarathi 
    ? (settings.announcementTextMarathi || settings.announcementText || t('announcement.text', '✨ संपूर्ण स्टोअरवर ५% सूट • ₹४१९ पेक्षा जास्त किमतीच्या ऑर्डरवर मोफत शिपिंग')) 
    : (settings.announcementText || '✨ 5% Discount Storewide • Free Shipping on orders over ₹419!');

  return (
    <div className="bg-gradient-to-r from-[#800A14] via-[#9B111E] to-[#B8222F] text-white text-xs font-medium py-1.5 sm:py-2 px-2.5 sm:px-6 relative z-40 border-b border-amber-900/30 shadow-xs w-full max-w-full overflow-hidden min-h-[36px] sm:min-h-[40px] flex items-center">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-1 sm:gap-1.5 md:gap-4 w-full">
        
        {/* Left Side: Store Location & Phone */}
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-2 sm:gap-x-3 gap-y-0.5 text-stone-100 text-[10px] sm:text-xs">
          <Link 
            to="/contact" 
            className="inline-flex items-center gap-1 hover:text-amber-300 transition-colors group max-w-[200px] sm:max-w-none truncate"
            title="View Store Location & Map"
          >
            <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400 group-hover:scale-110 transition-transform shrink-0" />
            <span className="font-semibold text-amber-200 shrink-0">{isMarathi ? 'दुकान:' : 'Store:'}</span>
            <span className="truncate max-w-[100px] xs:max-w-[140px] sm:max-w-none">
              {settings.storeAddress ? settings.storeAddress.split(',').slice(-2).join(',').trim() : (isMarathi ? 'जळगाव व पुणे, महाराष्ट्र' : 'Jalgaon & Pune, MH')}
            </span>
          </Link>

          <span className="text-amber-400/50 hidden xs:inline">•</span>

          <a 
            href={`tel:${phoneHref}`} 
            className="inline-flex items-center gap-1 hover:text-amber-300 transition-colors font-semibold text-amber-100 shrink-0"
          >
            <PhoneCall className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400 shrink-0" />
            <span className="text-[10px] sm:text-xs">{phoneDisplay}</span>
          </a>
        </div>

        {/* Center: Offer Banner */}
        {settings.announcementEnabled !== false && announcement && (
          <div className="flex items-center justify-center gap-1.5 bg-amber-950/50 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full border border-amber-500/30 text-amber-200 text-[10px] sm:text-xs font-semibold shadow-xs max-w-full text-center leading-tight">
            <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-300 animate-pulse shrink-0 hidden sm:inline-block" />
            <span className="tracking-wide line-clamp-1 sm:line-clamp-none">
              {announcement}
            </span>
          </div>
        )}

        {/* Right Side: Email, Version & Support */}
        <div className="flex items-center justify-end gap-2.5 text-stone-100 text-[11px] sm:text-xs">
          <span className="hidden xl:inline-block px-1.5 py-0.2 bg-black/25 text-amber-200/90 text-[9.5px] font-bold rounded-md border border-amber-400/20 tracking-wider">
            v1.8.0
          </span>
          <a 
            href={`mailto:${emailDisplay}`} 
            className="hidden lg:inline-flex items-center gap-1.5 hover:text-amber-300 transition-colors"
          >
            <Mail className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>{emailDisplay}</span>
          </a>
        </div>

      </div>
    </div>
  );
};
