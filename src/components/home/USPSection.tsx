import React from 'react';
import { Award, Sprout, ShieldCheck, PackageCheck, Truck } from 'lucide-react';
import { Container } from '../ui/Container';

export const USPSection: React.FC = () => {
  const usps = [
    {
      icon: <Award className="w-6 h-6 text-[#9B111E]" />,
      title: 'Authentic Jalgaon Flavours',
      desc: 'Regional taste rooted in Khandeshi food tradition and heritage spices.'
    },
    {
      icon: <Sprout className="w-6 h-6 text-[#D9531E]" />,
      title: 'Farmer-Sourced Bananas',
      desc: 'Raw bananas directly procured from Jalgaon district farmers.'
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-amber-600" />,
      title: 'Premium Ingredients',
      desc: 'Carefully selected cold-pressed oils, pure rock salt and spices.'
    },
    {
      icon: <PackageCheck className="w-6 h-6 text-emerald-700" />,
      title: 'Freshly Packed',
      desc: 'Small batch production focused strictly on maximum crunch and freshness.'
    },
    {
      icon: <Truck className="w-6 h-6 text-indigo-700" />,
      title: 'Pan-India Delivery',
      desc: 'Safe, sealed multi-layer moisture-proof packaging delivered everywhere.'
    }
  ];

  return (
    <section className="hidden md:block py-10 bg-white border-y border-stone-200/60 shadow-xs">
      <Container>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {usps.map((item, index) => (
            <div
              key={index}
              className="flex items-start gap-3.5 p-3 rounded-2xl hover:bg-[#FAF6ED]/80 transition-colors"
            >
              <div className="p-2.5 rounded-xl bg-stone-100/80 border border-stone-200/60 flex-shrink-0">
                {item.icon}
              </div>
              <div>
                <h4 className="text-sm font-bold text-stone-900 mb-1">{item.title}</h4>
                <p className="text-xs text-stone-500 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
};
