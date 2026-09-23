'use client';

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Flame, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Container } from '../ui/Container';
import { SectionHeading } from '../ui/SectionHeading';
import { ProductCard } from '../product/ProductCard';
import { ProductGridSkeleton } from '../product/ProductSkeletons';
import { Product } from '@/types';

export const BananaChipShowcase: React.FC<{ products?: Product[]; isLoading?: boolean }> = ({ products = [], isLoading }) => {
  const bananaChips = products.filter(p => {
    // Strictly Category 'banana-chips' / ID: '1'
    const isRegular = p.category === 'regular-banana-chips' || p.categoryId === '5' || p.categoryId === 'regular-banana-chips';
    const isUpwas = p.category === 'upwas-special' || p.categoryId === 'upwas-special';
    if (isRegular || isUpwas) return false;

    const isBananaCat = 
      p.category === 'banana-chips' || 
      p.categoryId === '1' || 
      p.categoryId === 'banana-chips' ||
      (p.categoryName && p.categoryName.toLowerCase() === 'banana chips');

    return isBananaCat;
  });

  const [selectedFlavour, setSelectedFlavour] = useState<string>('all');

  const flavours = [
    { id: 'all', name: 'All 10 Flavours' },
    { id: 'Masala', name: 'Masala' },
    { id: 'Peri Peri', name: 'Peri Peri' },
    { id: 'Pudina', name: 'Pudina' },
    { id: 'Cheese', name: 'Cheese' },
    { id: 'Pani Poori', name: 'Pani Poori' },
    { id: 'Noodles / Maggi Flavour', name: 'Noodle Masala' },
    { id: 'Garlic', name: 'Garlic' },
    { id: 'Black Pepper', name: 'Black Pepper' },
    { id: 'Tomato', name: 'Tomato' },
    { id: 'Salty', name: 'Classic Salty' },
  ];

  const filteredChips = selectedFlavour === 'all'
    ? bananaChips
    : bananaChips.filter(p => {
        const pFlavour = (p.flavour || '').toLowerCase();
        const pName = p.name.toLowerCase();
        const target = selectedFlavour.toLowerCase();

        if (target === 'masala') {
          return pFlavour === 'masala' || (pName.includes('masala') && !pName.includes('noodle'));
        }
        if (target.includes('noodle')) {
          return pFlavour.includes('noodle') || pName.includes('noodle') || pName.includes('maggi');
        }
        if (target === 'salty') {
          return pFlavour.includes('salty') || pFlavour.includes('salt') || pName.includes('salty') || pName.includes('salted');
        }
        return pFlavour === target || pFlavour.includes(target) || pName.includes(target);
      });

  return (
    <section className="py-16 md:py-24 bg-[#FAFAF8]">
      <Container>
        {/* Section Heading */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <SectionHeading
            eyebrow="Signature Product Line"
            title="10 Unique Flavours. One Unforgettable Crunch."
            subtitle="Farm-fresh Jalgaon raw bananas sliced paper-thin and seasoned with authentic regional and modern spices."
            className="mb-0"
          />

          <Link
            href="/shop?category=banana-chips"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#9B111E] hover:text-[#800A14] uppercase tracking-wider whitespace-nowrap self-start md:self-end"
          >
            <span>View All Banana Chips</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Flavour Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-4 mb-8">
          {flavours.map((f) => (
            <button
              key={f.id}
              onClick={() => setSelectedFlavour(f.id)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
                selectedFlavour === f.id
                  ? 'bg-[#9B111E] text-white shadow-sm'
                  : 'bg-white hover:bg-stone-100 text-stone-700 border border-stone-200'
              }`}
            >
              {f.name}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <ProductGridSkeleton count={6} />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6">
            {filteredChips.map((chip) => (
              <ProductCard key={chip.id} product={chip} />
            ))}
          </div>
        )}

        {/* Highlight Banner Callout */}
        <div className="mt-12 bg-linear-to-r from-[#9B111E] to-[#D9531E] rounded-3xl p-6 sm:p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg">
          <div className="space-y-2 text-center md:text-left">
            <span className="inline-block bg-amber-400 text-amber-950 font-black text-xs px-3 py-1 rounded-full uppercase tracking-wider">
              ₹79 Flat Rate
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold">All 10 Flavours @ Just ₹79 Each!</h3>
            <p className="text-sm text-amber-100 max-w-xl">
              Freshly crafted with Jalgaon raw bananas. Try our 100g Combo Pack to sample all bestsellers in one value box.
            </p>
          </div>
          <Link to="/shop?category=combo-packs">
            <button className="bg-amber-400 hover:bg-amber-300 text-amber-950 font-bold px-6 py-3.5 rounded-2xl text-sm transition-all shadow-md whitespace-nowrap">
              Explore Combo Box
            </button>
          </Link>
        </div>
      </Container>
    </section>
  );
};
