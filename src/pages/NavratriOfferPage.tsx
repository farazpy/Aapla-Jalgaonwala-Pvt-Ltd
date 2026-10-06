import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SEO } from '@/components/seo/SEO';
import { Container } from '@/components/ui/Container';
import { useCart } from '@/context/CartContext';
import { Product } from '@/types';
import { 
  Sparkles, 
  Heart, 
  ShieldCheck, 
  CheckCircle2, 
  ChevronRight, 
  Gift, 
  Flame, 
  ArrowRight, 
  Plus, 
  Minus,
  Sparkle,
  ShoppingBag,
  TrendingUp,
  Info
} from 'lucide-react';
import { motion } from 'motion/react';

export default function NavratriOfferPage() {
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Dynamic configuration loaded from MySQL database
  const [offerConfig, setOfferConfig] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/navratri-offer?_t=${Date.now()}`, { cache: 'no-store' })
      .then(async res => {
        if (res.ok) {
          const text = await res.text();
          try {
            const json = JSON.parse(text);
            if (json.success && json.data && typeof json.data === 'object') {
              setOfferConfig(json.data);
            }
          } catch {
            // Use defaults
          }
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  // Standard high-fidelity fallbacks if API is loading or unavailable
  const featuredImage = offerConfig?.featuredImage || 'https://images.unsplash.com/photo-1605000797439-7ab1434893e2?auto=format&fit=crop&w=1200&q=80';
  const price = Number(offerConfig?.price || 599);
  const mrp = Math.round(price * 1.5);
  const description = offerConfig?.description || 'Special Navratri Festivity Pack containing 500g Salted Banana Chips, 500g Spicy Masala Banana Chips, 500g Sweet Potato Chivda, 500g Spicy Potato Chivda, and a FREE pack of nutritious Rajgira Ladoos! Made 100% Satvik with Sendha Namak (Rock Salt) in separate dedicated frying lines.';
  const comboItems = offerConfig?.products || [
    {
      name: 'Sendha Namak Rock Salt Banana Chips (५०० ग्रॅम)',
      weight: '500g Pack',
      desc: 'Melt-in-your-mouth wafer thin raw banana wafers salted with pure Himalayan Sendha Namak (Rock Salt).',
      img: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=400&q=80',
      badge: 'Fasting Approved'
    },
    {
      name: 'Spicy Masala Fasting Banana Chips (५०० ग्रॅम)',
      weight: '500g Pack',
      desc: 'Crispy raw banana wafers tossed with fast-compliant spicy red chilli powder and rock salt.',
      img: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=400&q=80',
      badge: 'Spicy Delight'
    },
    {
      name: 'Meetha Farali Potato Batata Chivda (५०० ग्रॅम)',
      weight: '500g Pack',
      desc: 'Crisp hand-grated Jalgaon potato salli blended with premium cashew nuts, sweet raisins, and roasted peanuts.',
      img: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=400&q=80',
      badge: 'Sweet & Crunchy'
    },
    {
      name: 'Teekha Farali Potato Batata Chivda (५०० ग्रॅम)',
      weight: '500g Pack',
      desc: 'Thin golden matchstick potato salli seasoned with a spicy Navratri spice mix and crunchy rock salt.',
      img: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=400&q=80',
      badge: 'Spicy & Savoury'
    },
    {
      name: 'Rajgira Amaranth Sweet Ladoo (राजगिरा लाडू)',
      weight: 'Full Pack (FREE GIFT)',
      desc: 'Mouthwatering, soft, nutrient-packed amaranth puffed seeds balls sweetened with jaggery/pure sugar.',
      img: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=400&q=80',
      badge: 'Free Gift 🎁',
      isGift: true
    }
  ];

  const navratriComboProduct: Product = {
    id: 'navratri-festive-combo',
    slug: 'navratri-festive-combo-pack',
    name: 'Navratri Festive Special Combo Pack (नवरात्री स्पेशल कॉम्बो)',
    category: 'combo-packs',
    categoryId: 'combo-packs',
    categoryName: 'Combo Packs & Gifting',
    description: description,
    price: price,
    mrp: mrp,
    stock: 2000,
    images: [{
      id: 'img-navratri-combo-1',
      url: featuredImage,
      alt: 'Navratri Special Festive Combo Pack with Free Ladoo',
      isPrimary: true
    }]
  };

  const selectedVariant = {
    id: 'var-navratri-combo-full',
    weight: '2.2kg Complete Festivity Pack',
    price: price,
    mrp: mrp,
    stock: 2000
  };

  const handleAction = () => {
    addToCart(navratriComboProduct, selectedVariant, quantity, false);
    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
      navigate('/checkout');
    }, 800);
  };

  if (isLoading) {
    return (
      <div className="py-20 bg-stone-50 min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-[#9B111E] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-black text-stone-500 uppercase tracking-widest animate-pulse">Loading Festivity Offer...</p>
      </div>
    );
  }

  return (
    <div className="py-8 md:py-16 bg-[#FDFBF7] min-h-screen text-stone-900">
      <SEO
        title="Navratri Festive Special Combo Pack (नवरात्री स्पेशल कॉम्बो) | Aapla Jalgaonwala"
        description="Get 500g Salty Banana Chips + 500g Masala Banana Chips + 500g Sweet Potato Chivda + 500g Spicy Potato Chivda + FREE Rajgeera Ladoo! Pure 100% fasting-grade satvik savouries with Sendha Namak."
      />

      <Container>
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs font-semibold text-stone-500 mb-6 md:mb-10">
          <Link to="/" className="hover:text-[#9B111E] transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
          <Link to="/shop" className="hover:text-[#9B111E] transition-colors">Shop</Link>
          <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
          <span className="text-[#9B111E] font-bold">Navratri Offer Pack</span>
        </nav>

        {/* Hero Presentation */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start mb-16">
          {/* Hero Left Side: Image presentation */}
          <div className="lg:col-span-7 space-y-6">
            <div className="relative rounded-3xl overflow-hidden border border-orange-200 shadow-xl bg-stone-900">
              <img 
                src={featuredImage}
                alt="Navratri Special Fasting Festivity Combo Box"
                className="w-full h-auto aspect-video md:aspect-[4/3] object-cover hover:scale-105 transition-transform duration-700 opacity-95"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent flex flex-col justify-end p-6 md:p-8">
                <span className="inline-flex self-start items-center gap-1.5 px-3 py-1 bg-amber-500 text-stone-950 text-[10px] md:text-xs font-black uppercase rounded-full tracking-wider mb-2.5 shadow-sm border border-amber-400">
                  <Sparkles className="w-3.5 h-3.5" />
                  Navratri Festive Special Launch
                </span>
                <h1 className="text-2xl md:text-4xl font-black text-white leading-tight">
                  Navratri Special Offer Combo Pack
                </h1>
                <p className="text-xs md:text-sm text-stone-200 font-semibold max-w-xl mt-2 leading-relaxed">
                  ५०० ग्रॅम खारट केळी वेफर्स + ५०० ग्रॅम मसाला केळी वेफर्स + ५०० ग्रॅम गोड बटाटा चिवडा + ५०० ग्रॅम तिखट बटाटा चिवडा आणि त्यावर राजगिरा लाडू मोफत!
                </p>
              </div>
            </div>

            {/* Badges Grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white p-3.5 rounded-2xl border border-stone-200/80 text-center shadow-2xs">
                <Flame className="w-5 h-5 mx-auto text-orange-600 mb-1.5" />
                <h3 className="text-xs font-extrabold text-stone-900">100% Fasting Approved</h3>
                <p className="text-[10px] text-stone-500 mt-0.5">Pure Sendha Namak Only</p>
              </div>
              <div className="bg-white p-3.5 rounded-2xl border border-stone-200/80 text-center shadow-2xs">
                <Gift className="w-5 h-5 mx-auto text-[#9B111E] mb-1.5" />
                <h3 className="text-xs font-extrabold text-stone-900">FREE Rajgira Ladoo</h3>
                <p className="text-[10px] text-stone-500 mt-0.5">Complementary Amaranth Gift</p>
              </div>
              <div className="bg-white p-3.5 rounded-2xl border border-stone-200/80 text-center shadow-2xs">
                <ShieldCheck className="w-5 h-5 mx-auto text-emerald-600 mb-1.5" />
                <h3 className="text-xs font-extrabold text-stone-900">Separate Frying batch</h3>
                <p className="text-[10px] text-stone-500 mt-0.5">Strict Fasting Purity</p>
              </div>
            </div>

            {/* Purity Guarantee Panel */}
            <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 md:p-6 flex gap-4 items-start">
              <span className="p-3 rounded-xl bg-amber-100 text-amber-800 text-lg font-black leading-none shrink-0">🕉️</span>
              <div>
                <h3 className="text-sm font-extrabold text-amber-900">Our 100% Satvik Fasting Pledge</h3>
                <p className="text-xs text-stone-700 mt-1 leading-relaxed">
                  We prepare our fasting items on separate, designated kettles with cold-pressed peanut/coconut oils. Every batch is seasoned strictly with Sendha Namak (pure Himalayan Rock Salt) to protect the purity of your holy fasts. No refined table salt is used in any Upwas batches!
                </p>
              </div>
            </div>
          </div>

          {/* Hero Right Side: Offer Details and Cart Actions */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-3xl border border-stone-200 p-6 md:p-8 space-y-6 shadow-xs relative">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#9B111E] bg-[#9B111E]/10 px-2.5 py-1 rounded-full">
                  FESTIVE SAVINGS (33% OFF)
                </span>
                <h2 className="text-xl md:text-2xl font-black text-stone-900 pt-1.5">
                  Navratri Fasting Combo Pack
                </h2>
                <p className="text-xs text-stone-500 font-semibold">
                  Contains 2.0kg net weight + Free Amaranth Sweet balls pack
                </p>
              </div>

              {/* Price Panel */}
              <div className="bg-stone-50 p-4.5 rounded-2xl border border-stone-200/80 flex items-center justify-between">
                <div>
                  <span className="block text-[10px] text-stone-500 font-bold uppercase tracking-wider">Festival Special Price</span>
                  <div className="flex items-baseline gap-2.5">
                    <span className="text-2xl md:text-3xl font-black text-[#9B111E]">₹{price}</span>
                    <span className="text-sm text-stone-400 line-through font-semibold">₹{mrp}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-block px-2.5 py-1 bg-emerald-600 text-white text-[10px] font-black uppercase rounded-lg shadow-sm">
                    Save ₹{mrp - price}!
                  </span>
                </div>
              </div>

              {/* Description Panel */}
              <div className="space-y-1">
                <span className="block text-xs font-black uppercase tracking-wider text-stone-800">Combo Overview:</span>
                <p className="text-xs text-stone-600 leading-relaxed font-semibold">{description}</p>
              </div>

              {/* Items included summary */}
              <div className="space-y-3">
                <span className="block text-xs font-black uppercase tracking-wider text-stone-800">What is inside this pack:</span>
                <ul className="space-y-2 text-xs font-bold text-stone-600">
                  {comboItems.map((item: any, idx: number) => (
                    <li key={idx} className="flex items-center gap-2">
                      {item.isGift ? (
                        <Gift className="w-4 h-4 text-amber-500 shrink-0" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      )}
                      <span className={item.isGift ? 'text-amber-600 font-black' : ''}>
                        {item.isGift ? '🎁 FREE ' : ''}{item.name} ({item.weight})
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Quantity Counter */}
              <div className="pt-3 flex items-center justify-between border-t border-stone-100">
                <span className="text-xs font-black text-stone-700">Quantity:</span>
                <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200/60">
                  <button
                    type="button"
                    onClick={() => setQuantity(prev => (prev > 1 ? prev - 1 : 1))}
                    className="w-8 h-8 rounded-lg hover:bg-white text-stone-600 flex items-center justify-center font-black cursor-pointer active:scale-95 transition-all"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-10 text-center text-xs font-black text-stone-900">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(prev => prev + 1)}
                    className="w-8 h-8 rounded-lg hover:bg-white text-stone-600 flex items-center justify-center font-black cursor-pointer active:scale-95 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <button
                type="button"
                onClick={handleAction}
                disabled={isAdded}
                className="w-full py-4 bg-gradient-to-r from-orange-600 to-[#9B111E] hover:from-orange-700 hover:to-[#800A14] text-white rounded-2xl text-sm font-extrabold flex items-center justify-center gap-2.5 shadow-lg shadow-[#9B111E]/20 transition-all cursor-pointer active:scale-98 disabled:opacity-50"
              >
                {isAdded ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-white animate-bounce" />
                    <span>Added Pack To Cart!</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" />
                    <span>Order Special Combo Pack (₹{price})</span>
                  </>
                )}
              </button>

              <div className="text-center">
                <span className="inline-block text-[10px] text-stone-500 font-semibold leading-relaxed">
                  🛡️ 100% Pure Satvik Guarantee • Separate Fasting Frying Batch • Secure Checkout
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Item List Breakdown */}
        <div className="space-y-8 mb-16">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-2xl font-black text-stone-900">What's Inside Your Festival Pack</h2>
            <p className="text-xs text-stone-500 font-semibold">
              Take a closer look at the delicious, pure fasting savouries handpicked to fuel your 9 days of devotion and joy.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {comboItems.map((item: any, idx: number) => (
              <div 
                key={idx} 
                className={`bg-white rounded-2xl border overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between ${
                  item.isGift ? 'border-amber-400 bg-amber-50/20' : 'border-stone-200'
                }`}
              >
                <div>
                  <div className="relative aspect-video bg-stone-100">
                    <img 
                      src={item.img} 
                      alt={item.name} 
                      className="w-full h-full object-cover"
                    />
                    <span className={`absolute top-3 left-3 text-[9px] font-black uppercase px-2.5 py-1 rounded-md shadow-sm ${
                      item.isGift ? 'bg-amber-400 text-stone-950' : 'bg-black/60 text-white'
                    }`}>
                      {item.badge || 'Fasting Snack'}
                    </span>
                  </div>
                  <div className="p-4.5 space-y-1.5">
                    <h3 className="text-xs font-black text-stone-900 leading-snug">
                      {item.name}
                    </h3>
                    <p className="text-[10px] text-[#9B111E] font-bold">
                      {item.weight}
                    </p>
                    <p className="text-[11px] text-stone-500 leading-relaxed font-semibold">
                      {item.desc}
                    </p>
                  </div>
                </div>
                {item.isGift && (
                  <div className="px-4.5 pb-4.5">
                    <div className="bg-amber-100/50 border border-amber-200/60 p-2.5 rounded-xl text-center text-[10px] font-bold text-amber-900 flex items-center justify-center gap-1.5">
                      <Gift className="w-3.5 h-3.5 text-amber-500" />
                      <span>Complimentary Navratri Gift on every Combo purchase!</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </Container>
    </div>
  );
}
