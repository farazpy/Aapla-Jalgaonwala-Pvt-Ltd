import React, { useState } from 'react';
import { 
  Sparkles, 
  Gift, 
  Heart, 
  ShieldCheck, 
  CheckCircle2, 
  Flame, 
  Users, 
  Palette, 
  Calendar, 
  Package, 
  Clock, 
  Coins, 
  ChevronRight,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface DiwaliSubProduct {
  id: string;
  categoryNumber: number;
  title: string;
  categoryTag: string;
  icon: string;
  totalWeight: string;
  badgeColor: string;
  accentBg: string;
  borderColor: string;
  description: string;
  defaultImageUrl: string;
  items: {
    name: string;
    weight: string;
    description: string;
    highlight?: string;
  }[];
}

export const DIWALI_SUB_PRODUCTS: DiwaliSubProduct[] = [
  {
    id: 'farsan',
    categoryNumber: 1,
    title: 'Homemade Diwali Farsan',
    categoryTag: 'Authentic Khandeshi Crisps',
    icon: '🥣',
    totalWeight: '4.5 kg Total',
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
    accentBg: 'from-amber-50/90 via-orange-50/40 to-amber-50/80',
    borderColor: 'border-amber-200',
    defaultImageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80',
    description: 'Freshly fried in pure quality oil using multigrain bhajani flours and fragrant spices by local mothers & home chefs.',
    items: [
      { name: 'Chakli', weight: '500 g', description: 'Crisp, spiral crunchy chaklis made with four-grain traditional roasted bhajani flour.', highlight: 'Traditional Bhajani' },
      { name: 'Chivda', weight: '2 kg', description: 'Signature Khandeshi roasted poha chivda tossed with crunchy peanuts, dry coconut slivers & curry leaves.', highlight: '2 kg Mega Pack' },
      { name: 'Shankarpale', weight: '500 g', description: 'Melt-in-the-mouth golden diamond snacks with the right touch of gentle sweetness.', highlight: 'Pure Ghee Aroma' },
      { name: 'Karanji', weight: '500 g', description: 'Handcrafted flaky crescent pastries filled with roasted desiccated coconut, dry fruits & cardamom.', highlight: 'Stuffed Pastry' },
      { name: 'Anarse', weight: '500 g', description: 'Heritage fermented rice and jaggery delicacy gently fried and crusted with white poppy seeds (khaskhas).', highlight: 'Khandeshi Heritage' },
      { name: 'Bhakarwadi', weight: '500 g', description: 'Crispy savory rolled pinwheels packed with spicy, tangy Khandeshi masala filling.', highlight: 'Spicy & Tangy' }
    ]
  },
  {
    id: 'sweets',
    categoryNumber: 2,
    title: 'Traditional Homemade Sweets',
    categoryTag: 'Pure Desi Ghee & Fresh Chenna',
    icon: '🍬',
    totalWeight: '2.5 kg Total',
    badgeColor: 'bg-rose-100 text-rose-900 border-rose-300',
    accentBg: 'from-rose-50/90 via-orange-50/30 to-amber-50/80',
    borderColor: 'border-rose-200',
    defaultImageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80',
    description: 'Handcrafted with unadulterated pure cow desi ghee, saffron, and fresh ingredients without any artificial preservatives.',
    items: [
      { name: 'Besan Ladoo', weight: '250 g', description: 'Slow-roasted gram flour in pure desi ghee, hand-rolled with aromatic green cardamom and dry fruits.', highlight: 'Pure Desi Ghee' },
      { name: 'Motichoor Ladoo', weight: '250 g', description: 'Fine boondi pearls delicately cooked and infused with kesar (saffron) syrup and melon seeds.', highlight: 'Saffron Infused' },
      { name: 'Gulab Jamun', weight: '1 kg', description: 'Tender golden-brown milk dumplings immersed in rich cardamom and rose water sugar syrup.', highlight: '1 kg Tin Pack' },
      { name: 'Rasgulla', weight: '1 kg', description: 'Soft, spongy artisanal cow milk chenna balls floating in light saffron-scented syrup.', highlight: '1 kg Tin Pack' }
    ]
  },
  {
    id: 'special',
    categoryNumber: 3,
    title: 'Aapla Jalgaonwala Special',
    categoryTag: 'Secret Kitchen Flavours',
    icon: '🌶️',
    totalWeight: '2 Signature Items',
    badgeColor: 'bg-red-100 text-red-900 border-red-300',
    accentBg: 'from-red-50/80 via-amber-50/40 to-orange-50/70',
    borderColor: 'border-red-200',
    defaultImageUrl: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?auto=format&fit=crop&w=800&q=80',
    description: 'Our proprietary specialty blends that made Aapla Jalgaonwala a household name across Maharashtra.',
    items: [
      { name: 'Special Chivda', weight: 'Family Pack', description: 'Exclusive savory mixture infused with our crisp Jalgaon banana wafers, spiced sev, and crunchy cashews.', highlight: 'Signature Fusion' },
      { name: '1 Time Family Masala', weight: '1 Cooking Pouch', description: 'Our secret festive masala blend formulated for the grand Khandeshi family Diwali meal.', highlight: 'Secret Family Recipe' }
    ]
  },
  {
    id: 'puja',
    categoryNumber: 4,
    title: 'Complete Lakshmi Puja Kit',
    categoryTag: '100% Satvik & Auspicious',
    icon: '🪔',
    totalWeight: 'All-in-One Ritual Box',
    badgeColor: 'bg-yellow-100 text-yellow-900 border-yellow-300',
    accentBg: 'from-yellow-50/90 via-amber-50/50 to-orange-50/80',
    borderColor: 'border-yellow-300',
    defaultImageUrl: 'https://images.unsplash.com/photo-1605649487212-47bdab064df8?auto=format&fit=crop&w=800&q=80',
    description: 'Every sacred essential required for Lakshmi & Kuber Pujan on Diwali evening, curated according to traditional Vedic vidhi.',
    items: [
      { name: 'Lakshmi Idol', weight: '1 Devotional Murti', description: 'Auspicious handcrafted Lakshmi Murti ready for the Diwali evening shrine.', highlight: 'Handcrafted Idol' },
      { name: 'Coconut, Betel Nut & Betel Leaves', weight: 'Complete Set', description: 'Sacred Shriphal (coconut), dry supari, and fresh paan leaves for sthapana.', highlight: 'Pooja Samagri' },
      { name: 'Turmeric, Kumkum & Akshata', weight: 'Sacred Pouches', description: 'Pure haldi, fragrant red kumkum, and consecrated unbroken rice grains (akshata).', highlight: 'Natural Pigments' },
      { name: 'Camphor & Incense Sticks', weight: 'Ritual Pack', description: 'Pure Bhimseni kapur (camphor) and natural dhoop / agarbatti incense for positive vibrations.', highlight: 'Bhimseni Kapur' },
      { name: 'Cotton Wicks', weight: 'Phool & Lambi Vat', description: 'Soft hand-rolled round and elongated cotton wicks for ghee diyas.', highlight: 'Hand-rolled' },
      { name: 'Other Essential Puja Items', weight: 'Complete Kit', description: 'Janeu holy thread, matchbox, Gangajal vial, and detailed Puja ritual step guide.', highlight: 'Full Samagri' }
    ]
  },
  {
    id: 'firecrackers',
    categoryNumber: 5,
    title: 'Diwali Firecrackers',
    categoryTag: 'Child-Safe & Family Joy',
    icon: '🎆',
    totalWeight: 'Curated Family Box',
    badgeColor: 'bg-purple-100 text-purple-900 border-purple-300',
    accentBg: 'from-purple-50/90 via-pink-50/30 to-amber-50/70',
    borderColor: 'border-purple-200',
    defaultImageUrl: 'https://images.unsplash.com/photo-1508963493744-76fce69379c0?auto=format&fit=crop&w=800&q=80',
    description: 'Carefully selected safe varieties suitable for children, with smoke-safe sparklers and ground spinners for joyful celebrations.',
    items: [
      { name: 'Safe Varieties for Children', weight: 'Multi-item Assortment', description: 'Certified kid-friendly firecrackers designed for gentle illumination and high safety.', highlight: 'Tested Safe' },
      { name: 'Sparklers (Fuljhadi)', weight: 'Golden & Color Sticks', description: 'Long-burning sparklers casting magical golden, red, and green twinkling sparks.', highlight: 'Smokeless' },
      { name: 'Ground Spinners (Zameen Chakri)', weight: 'Smooth Rotating Discs', description: 'Classic swirling floor spinners emitting vibrant concentric circles of bright light.', highlight: 'Smooth Spin' },
      { name: 'Small Mixed Firecracker Box', weight: 'Assorted Pack', description: 'Novelty flower pots (anar), sparklers, and festive novelty family sparklers.', highlight: 'Festive Pack' }
    ]
  },
  {
    id: 'rangoli',
    categoryNumber: 6,
    title: 'Rangoli Art & Decor Kit',
    categoryTag: 'Festive Doorway Art',
    icon: '🎨',
    totalWeight: 'Complete Decor Set',
    badgeColor: 'bg-teal-100 text-teal-900 border-teal-300',
    accentBg: 'from-teal-50/90 via-emerald-50/30 to-amber-50/70',
    borderColor: 'border-teal-200',
    defaultImageUrl: 'https://images.unsplash.com/photo-1576872381149-7847515ce5d8?auto=format&fit=crop&w=800&q=80',
    description: 'Transform your entrance with vibrant eco-friendly colors and precision design stencils.',
    items: [
      { name: 'Vibrant Rangoli Colors', weight: 'Assorted Colors', description: 'Bright festive powder shades: Sindoor Red, Haldi Yellow, Peacock Blue, Bright Green & Rani Pink.', highlight: 'Eco-Friendly' },
      { name: 'Rangoli Designs / Stencils', weight: 'Multiple Cutouts', description: 'Easy-to-use traditional stencil templates including Lakshmi Charan, Lotus, and geometric patterns.', highlight: 'Easy Stencils' },
      { name: 'Essential Decoration Materials', weight: 'Accessory Kit', description: 'Border fillers, nozzles, and festive glitter powder for pristine courtyard artwork.', highlight: 'Floor Decor' }
    ]
  },
  {
    id: 'surprise_gift',
    categoryNumber: 7,
    title: 'Attractive Surprise Diwali Gift',
    categoryTag: 'Exclusive Souvenir',
    icon: '🎁',
    totalWeight: 'Special Gift',
    badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    accentBg: 'from-emerald-50/90 via-amber-50/40 to-orange-50/60',
    borderColor: 'border-emerald-200',
    defaultImageUrl: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80',
    description: 'A special token of gratitude and love from the founders of Aapla Jalgaonwala to brighten your home.',
    items: [
      { name: 'Surprise Diwali Souvenir', weight: 'Exclusive 1 Pack', description: 'Specially designed festive gift exclusively packaged for our first 1,000 customers.', highlight: 'Collector Item' }
    ]
  }
];

export interface DiwaliComboShowcaseProps {
  comboImages?: Record<string, string>;
}

export function DiwaliComboShowcase({ comboImages }: DiwaliComboShowcaseProps = {}) {
  const [activeSubId, setActiveSubId] = useState<string>('all');

  const filteredSubProducts = activeSubId === 'all' 
    ? DIWALI_SUB_PRODUCTS 
    : DIWALI_SUB_PRODUCTS.filter(p => p.id === activeSubId);

  return (
    <div className="space-y-8" id="diwali-combo-breakdown">
      {/* Hero Header Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#9B111E] via-[#800A14] to-[#4A050B] p-6 sm:p-8 text-white shadow-lg border border-[#B81D2B]/50">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-48 h-48 bg-orange-500/15 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-400 text-stone-950 shadow-xs">
              <Sparkles className="w-3.5 h-3.5" />
              Limited Edition • First 1,000 Customers Only
            </span>
            <span className="text-xs font-bold text-amber-200 bg-white/10 px-3 py-1 rounded-full backdrop-blur-xs border border-white/15">
              Approx. 9.5 kg+ Complete Festive Hamper
            </span>
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white flex items-center gap-2.5 flex-wrap">
              <span>Complete Diwali in One Box!</span>
              <span className="text-2xl sm:text-3xl">🪔❤️</span>
            </h2>
            <p className="text-amber-100/90 text-xs sm:text-sm font-medium mt-2 max-w-3xl leading-relaxed">
              Specially curated and lovingly handcrafted by the <strong>Aapla Jalgaonwala Women’s Business Group</strong>. 
              Farsan + Sweets + Firecrackers + Rangoli + Lakshmi Puja Essentials + Aapla Jalgaonwala Special = Everything you need for an auspicious and joyful Diwali celebration!
            </p>
          </div>

          {/* Key Metric Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-3 border border-white/10">
              <span className="text-[11px] font-bold text-amber-200 block uppercase tracking-wider">Homemade Farsan</span>
              <span className="text-lg sm:text-xl font-black text-white">4.5 kg</span>
              <span className="text-[10px] text-white/75 block">6 Khandeshi Delicacies</span>
            </div>
            <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-3 border border-white/10">
              <span className="text-[11px] font-bold text-amber-200 block uppercase tracking-wider">Traditional Sweets</span>
              <span className="text-lg sm:text-xl font-black text-white">2.5 kg</span>
              <span className="text-[10px] text-white/75 block">Pure Desi Ghee & Chenna</span>
            </div>
            <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-3 border border-white/10">
              <span className="text-[11px] font-bold text-amber-200 block uppercase tracking-wider">Devotional & Decor</span>
              <span className="text-lg sm:text-xl font-black text-white">Puja + Rangoli</span>
              <span className="text-[10px] text-white/75 block">Idol, Samagri & Stencils</span>
            </div>
            <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-3 border border-white/10">
              <span className="text-[11px] font-bold text-amber-200 block uppercase tracking-wider">Joy & Surprises</span>
              <span className="text-lg sm:text-xl font-black text-white">Safe Crackers + Gift</span>
              <span className="text-[10px] text-white/75 block">Kid-Safe Sparklers & Hamper</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Product Category Navigation Chips */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-stone-900 uppercase tracking-wider flex items-center gap-2">
            <Package className="w-4 h-4 text-[#9B111E]" />
            <span>Explore The 7 Sub-Product Sections:</span>
          </h3>
          <span className="text-xs text-stone-500 font-semibold">
            {activeSubId === 'all' ? 'Showing All 7 Sections' : 'Filtered Section'}
          </span>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          <button
            onClick={() => setActiveSubId('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
              activeSubId === 'all'
                ? 'bg-[#9B111E] text-white border-[#9B111E] shadow-xs'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200 border-stone-200'
            }`}
          >
            🌟 All 7 Sub-Products
          </button>
          {DIWALI_SUB_PRODUCTS.map((sub) => (
            <button
              key={sub.id}
              onClick={() => setActiveSubId(sub.id)}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-1.5 ${
                activeSubId === sub.id
                  ? 'bg-[#9B111E] text-white border-[#9B111E] shadow-xs'
                  : 'bg-white text-stone-700 hover:bg-stone-50 border-stone-200'
              }`}
            >
              <span>{sub.icon}</span>
              <span>{sub.categoryNumber}. {sub.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Individual Sub-Product Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredSubProducts.map((sub) => (
            <motion.div
              layout
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.25 }}
              key={sub.id}
              className={`rounded-3xl border ${sub.borderColor} bg-gradient-to-br ${sub.accentBg} p-5 sm:p-6 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden`}
            >
              {/* Card Header */}
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-10 h-10 rounded-2xl bg-white shadow-2xs border border-stone-200/80 flex items-center justify-center text-xl shrink-0">
                      {sub.icon}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-black uppercase tracking-wider text-[#9B111E]">
                          Section {sub.categoryNumber}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${sub.badgeColor}`}>
                          {sub.categoryTag}
                        </span>
                      </div>
                      <h4 className="text-lg font-black text-stone-900 tracking-tight leading-tight mt-0.5">
                        {sub.title}
                      </h4>
                    </div>
                  </div>

                  <span className="text-xs font-extrabold text-stone-900 bg-white/90 border border-stone-300/80 px-2.5 py-1 rounded-xl shadow-2xs shrink-0 whitespace-nowrap">
                    {sub.totalWeight}
                  </span>
                </div>

                <p className="text-xs text-stone-600 mb-3 leading-relaxed">
                  {sub.description}
                </p>

                {/* Sub-Product Visual Image Showcase */}
                <div className="relative w-full h-44 sm:h-48 rounded-2xl overflow-hidden mb-4 border border-stone-200/90 bg-stone-100 group shadow-2xs">
                  <img
                    src={comboImages?.[sub.id] || sub.defaultImageUrl}
                    alt={sub.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = sub.defaultImageUrl;
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950/70 via-stone-900/15 to-transparent pointer-events-none" />
                  
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider bg-black/60 backdrop-blur-xs text-amber-300 border border-white/20 px-2 py-0.5 rounded-full shadow-xs">
                      Section {sub.categoryNumber}
                    </span>
                  </div>

                  <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-white drop-shadow-xs">
                    <span className="text-xs font-bold flex items-center gap-1.5 truncate">
                      <span>{sub.icon}</span>
                      <span className="truncate">{sub.title}</span>
                    </span>
                    <span className="text-[10px] font-extrabold bg-[#9B111E] text-white px-2 py-0.5 rounded-md border border-white/20 shadow-xs shrink-0 whitespace-nowrap">
                      {sub.totalWeight}
                    </span>
                  </div>
                </div>

                {/* Sub-Items List */}
                <div className="space-y-2.5 pt-1 border-t border-stone-200/60">
                  {sub.items.map((item, idx) => (
                    <div 
                      key={idx} 
                      className="bg-white/80 rounded-2xl p-3 border border-stone-200/60 shadow-2xs hover:bg-white transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="text-xs font-black text-stone-900">
                            {item.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {item.highlight && (
                            <span className="text-[9px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded-md border border-amber-200">
                              {item.highlight}
                            </span>
                          )}
                          <span className="text-xs font-extrabold text-[#9B111E] bg-stone-50 border border-stone-200 px-2 py-0.5 rounded-lg whitespace-nowrap">
                            {item.weight}
                          </span>
                        </div>
                      </div>
                      <p className="text-[11px] text-stone-600 mt-1 pl-6 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card Footer Tag */}
              <div className="mt-4 pt-3 border-t border-stone-200/50 flex items-center justify-between text-[11px] text-stone-500">
                <span className="font-semibold flex items-center gap-1 text-stone-600">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  100% Quality & Purity Assured
                </span>
                <span className="font-bold text-[#9B111E]">
                  {sub.items.length} Curated Items
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* 3-Stage Milestone Payment Schedule */}
      <div className="rounded-3xl border border-amber-300 bg-gradient-to-br from-amber-50/90 via-orange-50/40 to-yellow-50/80 p-6 sm:p-8 shadow-xs space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-200/80 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg">💰</span>
              <span className="text-xs font-black uppercase tracking-wider text-[#D9531E]">
                Affordable & Stress-Free Ordering
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight mt-0.5">
              Flexible 3-Step Payment Schedule
            </h3>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold text-stone-500 block">Total Offer Price</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-[#9B111E]">₹4,999/-</span>
              <span className="text-xs font-bold text-stone-400 line-through">₹6,499</span>
              <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                SAVE ₹1,500
              </span>
            </div>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-stone-700 leading-relaxed">
          Book with just <strong>₹1,000 today</strong> to secure your slot out of the 1,000 limited boxes. Pay the rest in easy instalments as preparation and dispatch begin!
        </p>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {/* Milestone 1 */}
          <div className="bg-white rounded-2xl p-4 border border-amber-200 shadow-2xs space-y-2 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-[#9B111E] text-white text-[10px] font-black px-2.5 py-0.5 rounded-bl-xl uppercase tracking-wider">
              Step 1 • Immediate
            </div>
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-black text-sm">
                1️⃣
              </span>
              <div>
                <h4 className="text-xs font-black text-stone-900">Booking Advance</h4>
                <p className="text-[10px] text-stone-500">At time of booking</p>
              </div>
            </div>
            <div className="text-xl font-black text-[#9B111E]">
              ₹1,000/-
            </div>
            <p className="text-[11px] text-stone-600 leading-relaxed">
              Confirms your order and reserves your hamper from the strictly limited 1,000 production units (Non-refundable).
            </p>
          </div>

          {/* Milestone 2 */}
          <div className="bg-white rounded-2xl p-4 border border-amber-200 shadow-2xs space-y-2 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-stone-100 text-stone-700 text-[10px] font-black px-2.5 py-0.5 rounded-bl-xl uppercase tracking-wider border-l border-b border-stone-200">
              Step 2 • Pre-Festival
            </div>
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-orange-100 text-orange-900 flex items-center justify-center font-black text-sm">
                2️⃣
              </span>
              <div>
                <h4 className="text-xs font-black text-stone-900">Second Payment</h4>
                <p className="text-[10px] text-stone-500 font-bold text-[#D9531E]">Before 1st October 2026</p>
              </div>
            </div>
            <div className="text-xl font-black text-stone-900">
              ₹2,500/-
            </div>
            <p className="text-[11px] text-stone-600 leading-relaxed">
              Covers raw ingredient procurement, sweet preparation, and packaging by the Women’s Business Group.
            </p>
          </div>

          {/* Milestone 3 */}
          <div className="bg-white rounded-2xl p-4 border border-amber-200 shadow-2xs space-y-2 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-emerald-700 text-white text-[10px] font-black px-2.5 py-0.5 rounded-bl-xl uppercase tracking-wider">
              Step 3 • Dispatch
            </div>
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-900 flex items-center justify-center font-black text-sm">
                3️⃣
              </span>
              <div>
                <h4 className="text-xs font-black text-stone-900">Final Payment</h4>
                <p className="text-[10px] text-stone-500 font-bold text-emerald-700">By 20th October 2026</p>
              </div>
            </div>
            <div className="text-xl font-black text-stone-900">
              ₹1,499/-
            </div>
            <p className="text-[11px] text-stone-600 leading-relaxed">
              Final settlement before express insured doorstep dispatch across Maharashtra & India.
            </p>
          </div>
        </div>

        <div className="bg-amber-100/60 rounded-2xl p-3 border border-amber-200 flex items-center justify-between flex-wrap gap-2 text-xs text-amber-950">
          <span className="font-bold flex items-center gap-1.5">
            <Coins className="w-4 h-4 text-[#D9531E] shrink-0" />
            Simple Math: ₹1,000 (Booking) + ₹2,500 (2nd Payment) + ₹1,499 (Final) = <strong>₹4,999/- Only</strong>
          </span>
          <span className="text-[11px] font-semibold text-stone-600">
            * Or choose full upfront payment to skip instalments!
          </span>
        </div>
      </div>

      {/* Women's Empowerment & Community Impact Banner */}
      <div className="rounded-3xl border border-rose-200 bg-gradient-to-r from-rose-50 via-amber-50 to-orange-50 p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#9B111E] text-white flex items-center justify-center shrink-0 shadow-md text-2xl">
            👩‍🍳
          </div>
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-[#9B111E]">
                Empowering Local Communities
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-rose-200/80 text-rose-900 px-2 py-0.5 rounded-full">
                <Heart className="w-3 h-3 fill-rose-600 text-rose-600" />
                Women-Led Initiative
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-stone-900 leading-snug">
              Every Order Directly Empowers Women Entrepreneurs in Jalgaon
            </h3>
            <p className="text-xs sm:text-sm text-stone-700 leading-relaxed">
              All bookings and production are lovingly arranged through the <strong>Aapla Jalgaonwala Women’s Business Group</strong>. 
              With every order you place this Diwali, you will be supporting women and helping them build their own self-sustaining businesses. ❤️🙏
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
