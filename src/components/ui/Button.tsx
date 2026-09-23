'use client';

import React from 'react';
import { motion, HTMLMotionProps } from 'motion/react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'saffron';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap rounded-xl shadow-xs';

    const variants = {
      primary: 'bg-[#9B111E] hover:bg-[#800A14] text-white shadow-sm hover:shadow-md',
      secondary: 'bg-[#D9531E] hover:bg-[#B84214] text-white shadow-sm hover:shadow-md',
      saffron: 'bg-[#F59E0B] hover:bg-[#D97706] text-amber-950 font-semibold shadow-sm hover:shadow-md',
      outline: 'border border-[#9B111E]/30 text-[#9B111E] hover:bg-[#9B111E]/5 bg-transparent',
      ghost: 'text-stone-700 hover:bg-stone-200/50 hover:text-stone-900 bg-transparent shadow-none',
    };

    const sizes = {
      sm: 'text-xs px-3 py-1.5 gap-1.5',
      md: 'text-sm px-4 py-2.5 gap-2',
      lg: 'text-base px-6 py-3.5 gap-2.5 font-semibold',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading ? (
          <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-1.5" />
        ) : (
          leftIcon
        )}
        {typeof children === 'string' ? <span>{children}</span> : children}
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';
