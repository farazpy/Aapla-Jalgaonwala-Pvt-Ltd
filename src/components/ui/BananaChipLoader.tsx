'use client';

import React from 'react';

interface BananaChipLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}

export const BananaChipLoader: React.FC<BananaChipLoaderProps> = ({
  size = 'md',
  label,
  className = ''
}) => {
  const sizeConfig = {
    sm: { wrapper: 'w-10 h-10', svg: 'w-8 h-8', text: 'text-[10px]' },
    md: { wrapper: 'w-16 h-16', svg: 'w-12 h-12', text: 'text-xs' },
    lg: { wrapper: 'w-24 h-24', svg: 'w-16 h-16', text: 'text-sm' }
  }[size];

  return (
    <div className={`flex flex-col items-center justify-center gap-2 select-none ${className}`}>
      {/* Animated Golden Banana Chip Wafer Graphic */}
      <div className={`relative ${sizeConfig.wrapper} flex items-center justify-center`}>
        {/* Soft Golden Ambient Pulse */}
        <div className="absolute inset-0 rounded-full bg-amber-400/20 blur-md animate-ping" style={{ animationDuration: '2s' }} />
        <div className="absolute inset-1 rounded-full bg-amber-300/30 blur-xs animate-pulse" />

        {/* Banana Chip Wafer SVG */}
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`${sizeConfig.svg} relative z-10 drop-shadow-md animate-bounce`}
          style={{ animationDuration: '1.4s' }}
        >
          {/* Outer Golden Wafer Body */}
          <ellipse
            cx="50"
            cy="50"
            rx="42"
            ry="40"
            fill="url(#bananaGradient)"
            stroke="#D97706"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Crispy Textured Edges */}
          <path
            d="M12 48 C16 30, 32 14, 52 13 C72 12, 88 28, 88 50 C88 72, 70 87, 48 87 C26 87, 10 70, 12 48 Z"
            fill="url(#bananaHighlight)"
            opacity="0.85"
          />

          {/* Internal Seed Core & Concentric Growth Rings */}
          <ellipse
            cx="50"
            cy="50"
            rx="24"
            ry="22"
            stroke="#B45309"
            strokeWidth="1.5"
            strokeDasharray="2 3"
            opacity="0.6"
          />
          <ellipse
            cx="50"
            cy="50"
            rx="12"
            ry="11"
            stroke="#92400E"
            strokeWidth="1.5"
            strokeDasharray="1.5 2.5"
            opacity="0.75"
          />

          {/* Banana Core Triple Seeds */}
          <circle cx="46" cy="48" r="2.2" fill="#78350F" />
          <circle cx="54" cy="47" r="2" fill="#78350F" />
          <circle cx="50" cy="54" r="2.2" fill="#78350F" />

          {/* Authentic Handcrafted Seasoning Specks (Chilli & Masala Flecks) */}
          <circle cx="34" cy="36" r="1.4" fill="#DC2626" opacity="0.9" />
          <circle cx="66" cy="38" r="1.2" fill="#B91C1C" opacity="0.85" />
          <circle cx="38" cy="64" r="1.3" fill="#D97706" opacity="0.9" />
          <circle cx="62" cy="62" r="1.5" fill="#DC2626" opacity="0.8" />
          <circle cx="28" cy="50" r="1" fill="#451A03" opacity="0.7" />
          <circle cx="72" cy="52" r="1" fill="#451A03" opacity="0.7" />

          {/* Golden Shimmer Glaze Highlight */}
          <path
            d="M24 30 Q45 18 68 26"
            stroke="#FEF3C7"
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity="0.75"
          />

          {/* Gradients */}
          <defs>
            <linearGradient id="bananaGradient" x1="15" y1="15" x2="85" y2="85" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FDE047" />
              <stop offset="0.45" stopColor="#FBBF24" />
              <stop offset="0.8" stopColor="#F59E0B" />
              <stop offset="1" stopColor="#D97706" />
            </linearGradient>
            <radialGradient id="bananaHighlight" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(42 40) rotate(52) scale(46 42)">
              <stop stopColor="#FEF08A" />
              <stop offset="0.6" stopColor="#FBBF24" stopOpacity="0.8" />
              <stop offset="1" stopColor="#D97706" stopOpacity="0" />
            </radialGradient>
          </defs>
        </svg>
      </div>

      {label && (
        <span className={`font-semibold tracking-wide text-amber-900/80 ${sizeConfig.text}`}>
          {label}
        </span>
      )}
    </div>
  );
};
