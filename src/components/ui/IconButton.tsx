'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  label: string;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ children, className, variant = 'ghost', size = 'md', label, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50 disabled:opacity-50 disabled:cursor-not-allowed';

    const variants = {
      primary: 'bg-[#9B111E] text-white hover:bg-[#800A14]',
      secondary: 'bg-[#D9531E] text-white hover:bg-[#B84214]',
      outline: 'border border-stone-200 text-stone-700 hover:bg-stone-100/80',
      ghost: 'text-stone-700 hover:bg-stone-200/60 hover:text-stone-900',
    };

    const sizes = {
      sm: 'w-8 h-8 text-sm',
      md: 'w-10 h-10 text-base',
      lg: 'w-12 h-12 text-lg',
    };

    return (
      <button
        ref={ref}
        aria-label={label}
        title={label}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';
