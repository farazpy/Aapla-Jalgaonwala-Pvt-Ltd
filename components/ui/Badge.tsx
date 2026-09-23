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
    red: 'bg-[#9B111E]/10 text-[#9B111E] border border-[#9B111E]/20',
    orange: 'bg-[#D9531E]/10 text-[#D9531E] border border-[#D9531E]/20',
    saffron: 'bg-amber-100 text-amber-900 border border-amber-300',
    green: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
    neutral: 'bg-stone-200/70 text-stone-700 border border-stone-300/50',
    outline: 'bg-transparent border border-stone-300 text-stone-700',
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
