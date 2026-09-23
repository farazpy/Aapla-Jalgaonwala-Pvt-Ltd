'use client';

import React from 'react';
import { BananaChipLoader } from '../ui/BananaChipLoader';

export const ProductCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl border border-stone-200/80 p-2.5 sm:p-4 space-y-2 sm:space-y-3 overflow-hidden flex flex-col justify-between">
      <div className="w-full aspect-square rounded-xl sm:rounded-2xl bg-[#FAF6ED] flex items-center justify-center relative overflow-hidden">
        <BananaChipLoader size="sm" label="Crisping..." />
      </div>
      <div className="space-y-1.5 sm:space-y-2">
        <div className="h-3.5 sm:h-4 bg-stone-200/80 rounded-full w-3/4 animate-pulse" />
        <div className="h-2.5 sm:h-3 bg-stone-100 rounded-full w-1/2 animate-pulse" />
      </div>
      <div className="flex justify-between items-center pt-1 sm:pt-2">
        <div className="h-5 sm:h-6 bg-stone-200/70 rounded-lg w-12 sm:w-16 animate-pulse" />
        <div className="h-7 sm:h-8 bg-[#9B111E]/10 rounded-xl w-12 sm:w-16 animate-pulse" />
      </div>
    </div>
  );
};

export const ProductGridSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-6">
      {Array.from({ length: count }).map((_, idx) => (
        <ProductCardSkeleton key={idx} />
      ))}
    </div>
  );
};

export const ProductDetailSkeleton: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="aspect-square bg-[#FAF6ED] rounded-3xl flex items-center justify-center border border-stone-200/80">
        <BananaChipLoader size="lg" label="Loading Authentic Jalgaon Taste..." />
      </div>
      <div className="space-y-4">
        <div className="h-4 bg-stone-200 rounded-full w-1/4 animate-pulse" />
        <div className="h-8 bg-stone-200 rounded-full w-3/4 animate-pulse" />
        <div className="h-6 bg-stone-200 rounded-full w-1/3 animate-pulse" />
        <div className="h-20 bg-stone-100 rounded-2xl w-full animate-pulse" />
        <div className="h-12 bg-stone-200 rounded-2xl w-full animate-pulse" />
      </div>
    </div>
  );
};
