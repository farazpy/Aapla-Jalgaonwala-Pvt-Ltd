import React from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ children, className, hoverEffect = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'bg-white/90 backdrop-blur-xs rounded-2xl border border-amber-950/5 shadow-xs overflow-hidden transition-all duration-300',
          hoverEffect && 'hover:shadow-md hover:-translate-y-1 hover:border-[#D9531E]/20',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
