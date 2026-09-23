'use client';

import React from 'react';
import { 
  ShieldCheck, 
  Award, 
  CheckCircle2, 
  XCircle, 
  Star, 
  HeartHandshake, 
  Sprout, 
  Truck, 
  Sparkles,
  PackageCheck
} from 'lucide-react';
import { Container } from '../ui/Container';
import { SectionHeading } from '../ui/SectionHeading';

export const TrustCertificationsSection: React.FC = () => {
  const trustCards = [
    {
      icon: <Award className="w-6 h-6 text-[#9B111E]" />,
      badge: 'FSSAI Certified',
      title: 'Food Safety & Hygiene Standard',
      desc: 'Complies with rigorous FSSAI manufacturing protocols and laboratory batch tests for complete consumer safety.'
    },
    {
      icon: <Sprout className="w-6 h-6 text-emerald-700" />,
      badge: '100% Farmgate Bananas',
      title: 'Direct From Jalgaon Orchards',
      desc: 'Only Grade-A raw green bananas harvested from local farming families in Khandesh, never cold-storage remnants.'
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-amber-600" />,
      badge: 'Zero Palm Oil & Trans Fat',
      title: 'Clean, Pure Edible Oils',
      desc: 'Cooked in fresh, monitored refined sunflower oil and pure rock salts. Never reused or burnt oil.'
    },
    {
      icon: <PackageCheck className="w-6 h-6 text-indigo-700" />,
      badge: 'Nitrogen-Flushed Foil',
      title: '180-Day Crunch Guarantee',
      desc: 'Multi-layer food grade metallic barrier pouches protect every chip from humidity, air, and transit breakage.'
    }
  ];

  const comparisonData = [
    {
      factor: 'Raw Banana Source',
      us: '100% Fresh Jalgaon Raw Bananas harvested within 24h',
      them: 'Mass-procured cold stored bananas of mixed origin'
    },
    {
      factor: 'Cooking Oil Standard',
      us: 'Pure refined sunflower / groundnut oil with batch testing',
      them: 'Heavy palm olein oil blends with repeated frying'
    },
    {
      factor: 'Wafer Thickness & Texture',
      us: 'Paper-thin precision circular slices for instant crisp melt',
      them: 'Thick, uneven cuts that can be oily and hard on teeth'
    },
    {
      factor: 'Spices & Flavouring',
      us: 'Stone-ground authentic Khandeshi masalas & real herbs',
      them: 'Synthetic flavor powders and artificial flavor enhancers'
    },
    {
      factor: 'Farmer Fair-Share',
      us: 'Direct procurement at guaranteed fair-trade rates',
      them: 'Multi-tier broker mandis with squeezed farmer margins'
    }
  ];

  return (
    <section className="py-16 md:py-24 bg-white border-t border-stone-200/60 relative overflow-hidden">
      <Container>
        {/* Section Heading */}
        <SectionHeading
          eyebrow="Uncompromising Quality & Trust"
          title="Why 15,000+ Snack Lovers Trust Aapla Jalgaonwala"
          subtitle="We believe in complete transparency from farm soil to final sealed pouch. No shortcuts, no compromises."
          centered
        />

        {/* 4 Core Trust Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-12 mb-16">
          {trustCards.map((card, idx) => (
            <div
              key={idx}
              className="p-6 rounded-3xl bg-[#FAF6ED]/70 border border-stone-200/80 hover:border-[#9B111E]/30 hover:bg-[#FAF6ED] transition-all flex flex-col justify-between shadow-xs hover:shadow-sm"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-white rounded-2xl border border-stone-200/60 shadow-2xs">
                    {card.icon}
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-wider text-[#9B111E] bg-[#9B111E]/10 px-2.5 py-1 rounded-full">
                    {card.badge}
                  </span>
                </div>
                <h4 className="text-base font-bold text-stone-900 mb-2">
                  {card.title}
                </h4>
                <p className="text-xs text-stone-600 leading-relaxed font-normal">
                  {card.desc}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-stone-200/60 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Verified Quality Promise</span>
              </div>
            </div>
          ))}
        </div>

        {/* Comparison Matrix: Aapla Jalgaonwala vs Mass Commercial Chips */}
        <div className="bg-[#FAF6ED] rounded-3xl border border-stone-200/80 p-6 sm:p-8 shadow-xs">
          <div className="text-center max-w-xl mx-auto mb-8">
            <span className="text-xs font-bold uppercase tracking-widest text-[#D9531E] px-3 py-1 bg-[#D9531E]/10 rounded-full border border-[#D9531E]/15">
              The Quality Benchmark
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-stone-900 mt-2">
              The Aapla Jalgaonwala Difference
            </h3>
            <p className="text-xs text-stone-500 mt-1">
              How our authentic artisanal methods compare to mass-produced commercial chips
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-stone-300/80 text-xs font-bold text-stone-700 uppercase tracking-wider">
                  <th className="py-3 px-4 w-1/3">Quality Factor</th>
                  <th className="py-3 px-4 w-1/3 text-[#9B111E] bg-[#9B111E]/5 rounded-t-xl">
                    <span className="flex items-center gap-1.5">
                      <Star className="w-4 h-4 fill-current" />
                      Aapla Jalgaonwala
                    </span>
                  </th>
                  <th className="py-3 px-4 w-1/3 text-stone-500">Commercial Factory Brands</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200/70">
                {comparisonData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-white/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-stone-900 text-xs sm:text-sm">
                      {row.factor}
                    </td>
                    <td className="py-3.5 px-4 text-xs sm:text-sm font-semibold text-[#9B111E] bg-[#9B111E]/5 flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span>{row.us}</span>
                    </td>
                    <td className="py-3.5 px-4 text-xs sm:text-sm text-stone-500">
                      <span className="flex items-start gap-2 text-stone-500">
                        <XCircle className="w-4 h-4 text-stone-400 flex-shrink-0 mt-0.5" />
                        <span>{row.them}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Social Proof Stats Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 text-center">
          <div className="p-4 rounded-2xl bg-white border border-stone-200/80 shadow-2xs">
            <span className="block text-2xl sm:text-3xl font-black text-[#9B111E]">15,000+</span>
            <span className="text-xs font-semibold text-stone-600 mt-0.5">Satisfied Households</span>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-stone-200/80 shadow-2xs">
            <span className="block text-2xl sm:text-3xl font-black text-amber-600">4.9 / 5.0</span>
            <span className="text-xs font-semibold text-stone-600 mt-0.5">Verified Customer Rating</span>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-stone-200/80 shadow-2xs">
            <span className="block text-2xl sm:text-3xl font-black text-emerald-700">40+</span>
            <span className="text-xs font-semibold text-stone-600 mt-0.5">Jalgaon Farmer Partners</span>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-stone-200/80 shadow-2xs">
            <span className="block text-2xl sm:text-3xl font-black text-stone-900">28 States</span>
            <span className="text-xs font-semibold text-stone-600 mt-0.5">Pan-India Direct Delivery</span>
          </div>
        </div>
      </Container>
    </section>
  );
};
