'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { MapPin, PhoneCall, Mail, Sparkles, X } from 'lucide-react';
import { initialSiteSettings } from '@/data/settings';

export const AnnouncementBar: React.FC = () => {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div className="bg-gradient-to-r from-[#800A14] via-[#9B111E] to-[#B8222F] text-white text-xs font-medium py-1.5 sm:py-2 px-2.5 sm:px-6 relative z-40 border-b border-amber-900/30 shadow-xs w-full max-w-full overflow-hidden">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-1 sm:gap-1.5 md:gap-4 w-full">
        
        {/* Left Side: Store Location & Phone */}
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-2 sm:gap-x-4 gap-y-0.5 text-stone-100 text-[10px] sm:text-xs">
          <Link 
            href="/contact" 
            className="inline-flex items-center gap-1.5 hover:text-amber-300 transition-colors group max-w-[180px] sm:max-w-none truncate"
            title="View Store Location & Map"
          >
            <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400 group-hover:scale-110 transition-transform shrink-0" />
            <span className="font-semibold text-amber-200 shrink-0">Store:</span>
            <span className="truncate max-w-[100px] xs:max-w-[140px] sm:max-w-none">Yelwadi, Dehu, Pune, MH 412109</span>
          </Link>

          <span className="hidden xs:inline text-amber-400/50">•</span>

          <a 
            href={`tel:${initialSiteSettings.contactPhone.replace(/\s+/g, '')}`} 
            className="inline-flex items-center gap-1 hover:text-amber-300 transition-colors font-semibold shrink-0"
          >
            <PhoneCall className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400 shrink-0" />
            <span className="text-[10px] sm:text-xs">{initialSiteSettings.contactPhone}</span>
          </a>
        </div>

        {/* Center: Offer Banner */}
        <div className="flex items-center gap-1.5 bg-amber-950/40 px-2.5 py-0.5 sm:px-3 rounded-full border border-amber-500/30 text-amber-200 text-[10px] sm:text-xs font-semibold shadow-xs max-w-full text-center leading-tight">
          <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-300 animate-pulse shrink-0 hidden sm:inline-block" />
          <span className="tracking-wide text-center line-clamp-1 sm:line-clamp-none">
            {initialSiteSettings.announcementText}
          </span>
        </div>

        {/* Right Side: Email & Close */}
        <div className="hidden md:flex items-center justify-end gap-3 text-stone-100 text-[11px] sm:text-xs">
          <a 
            href={`mailto:${initialSiteSettings.contactEmail}`} 
            className="hidden lg:inline-flex items-center gap-1.5 hover:text-amber-300 transition-colors"
          >
            <Mail className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>{initialSiteSettings.contactEmail}</span>
          </a>

          <button
            onClick={() => setVisible(false)}
            className="p-1 rounded-md hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
            aria-label="Close announcement bar"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
};

