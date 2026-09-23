import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'red' | 'orange' | 'saffron' | 'green' | 'neutral' | 'outline';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'red',
  size = 'md',
  className
}) => {
  const base = 'inline-flex items-center font-medium rounded-full tracking-wide whitespace-nowrap';
  
  const variants = {
    red: 'bg-[#9B111E] text-white font-bold border border-red-700 shadow-2xs',
    orange: 'bg-[#D9531E] text-white font-bold border border-amber-300/40 shadow-2xs',
    saffron: 'bg-amber-400 text-stone-950 font-extrabold border border-amber-300 shadow-2xs',
    green: 'bg-emerald-600 text-white font-bold border border-emerald-700 shadow-2xs',
    neutral: 'bg-stone-900 text-amber-300 font-bold border border-stone-800 shadow-2xs',
    outline: 'bg-white/90 text-stone-800 border border-stone-300 font-bold backdrop-blur-xs',
  };

  const sizes = {
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  };

  return (
    <span className={cn(base, variants[variant], sizes[size], className)}>
      {children}
    </span>
  );
};
