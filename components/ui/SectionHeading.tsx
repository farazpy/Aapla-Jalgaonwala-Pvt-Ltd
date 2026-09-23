import React from 'react';
import { cn } from '@/lib/utils';

export interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  centered?: boolean;
  className?: string;
}

export const SectionHeading: React.FC<SectionHeadingProps> = ({
  eyebrow,
  title,
  subtitle,
  centered = false,
  className
}) => {
  return (
    <div className={cn('mb-8 md:mb-12', centered && 'text-center mx-auto max-w-2xl', className)}>
      {eyebrow && (
        <span className="inline-block text-xs font-semibold uppercase tracking-widest text-[#D9531E] mb-2 px-3 py-1 bg-[#D9531E]/10 rounded-full border border-[#D9531E]/15">
          {eyebrow}
        </span>
      )}
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-stone-900 leading-tight">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-3 text-sm sm:text-base text-stone-600 leading-relaxed font-normal">
          {subtitle}
        </p>
      )}
    </div>
  );
};
