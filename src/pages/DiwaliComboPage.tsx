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
  Calendar, 
  Flame, 
  Users, 
  Sparkle,
  ShoppingBag,
  ArrowRight,
  Clock,
  Paintbrush,
  AlertTriangle,
  Lock,
  Plus,
  Minus
} from 'lucide-react';
import { motion } from 'motion/react';

export default function DiwaliComboPage() {
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [selectedOption, setSelectedOption] = useState<'booking' | 'full'>('booking');
  const [quantity, setQuantity] = useState(1);
  const [isBooked, setIsBooked] = useState(false);
  const [currentSlots, setCurrentSlots] = useState(842); // Simulated high-quality static production counter (ticks down slowly or stays very authentic)

  useEffect(() => {
    // Slow real countdown simulation to preserve authentic production feel
    const interval = setInterval(() => {
      setCurrentSlots(prev => (prev > 147 ? prev - 1 : prev));
    }, 45000);
    return () => clearInterval(interval);
  }, []);

  const diwaliProduct: Product = {
    id: 'diwali-special-combo',
    slug: 'diwali-special-combo-box',
    name: 'Diwali Special Combo Box',
    category: 'combo-packs',
    categoryId: 'combo-packs',
    categoryName: 'Combo Packs & Gifting',
    description: 'Farsan + Sweets + Firecrackers + Rangoli + Lakshmi Puja Essentials + Aapla Jalgaonwala Special = Complete Diwali in One Box! Supporting Women’s Business Group with every purchase.',
    price: selectedOption === 'booking' ? 1000 : 4999,
    mrp: selectedOption === 'booking' ? 1000 : 6999,
    stock: 1000,
    images: [{
      id: 'img-diwali-combo-1',
      url: 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&w=800&q=80',
      alt: 'Diwali Special Combo Box',
      isPrimary: true
    }]
  };

  const selectedVariant = selectedOption === 'booking' 
    ? {
        id: 'var-diwali-booking',
        weight: 'Booking Advance Payment',
        price: 1000,
        mrp: 1000,
        stock: 1000
      }
    : {
        id: 'var-diwali-full',
        weight: 'Full One-Time Payment',
        price: 4999,
        mrp: 6999,
        stock: 1000
      };

  const handleAction = () => {
    addToCart(diwaliProduct, selectedVariant, quantity, false);
    setIsBooked(true);
    setTimeout(() => {
      setIsBooked(false);
      navigate('/checkout');
    }, 800);
  };

  return (
    <div className="py-8 md:py-16 bg-[#FDFBF7] min-h-screen text-stone-900">
      <SEO
        title="Diwali Special Offer Box (दिवाळी स्पेशल कॉम्बो) | Complete Diwali In One Box | Aapla Jalgaonwala"
        description="Farsan + Sweets + Firecrackers + Rangoli + Lakshmi Puja Essentials = Complete Diwali in One Box! Made lovingly by the Aapla Jalgaonwala Women’s Business Group."
      />

      <Container>
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-xs font-semibold text-stone-500 mb-6 md:mb-10">
          <Link to="/" className="hover:text-[#9B111E] transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
          <Link to="/shop" className="hover:text-[#9B111E] transition-colors">Shop</Link>
          <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
          <span className="text-[#9B111E] font-bold">Diwali Special Box</span>
        </nav>

        {/* Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start mb-16">
          {/* Hero Left: Product Visual Presentation */}
          <div className="lg:col-span-7 space-y-6">
            <div className="relative rounded-3xl overflow-hidden border border-amber-200/60 shadow-lg bg-stone-900">
              <img loading="lazy"
                src="https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&w=1200&q=80"
                alt="Diwali Special Celebration Combo Box"
                className="w-full h-auto aspect-video md:aspect-[4/3] object-cover hover:scale-105 transition-transform duration-700 opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6 md:p-8">
                <span className="inline-flex self-start items-center gap-1.5 px-3 py-1 bg-amber-500 text-stone-950 text-[10px] md:text-xs font-black uppercase rounded-full tracking-wider mb-2.5 shadow-sm border border-amber-400">
                  <Sparkle className="w-3.5 h-3.5 animate-spin-slow" />
                  Diwali Special Launch
                </span>
                <h1 className="text-2xl md:text-4xl font-black text-white leading-tight">
                  Diwali Special Offer Box
                </h1>
                <p className="text-xs md:text-sm text-stone-200 font-medium max-w-xl mt-2">
                  Complete Diwali celebration delivered in one massive, authentic, homemade box by the Aapla Jalgaonwala Women’s Business Group.
                </p>
              </div>
            </div>

            {/* Micro Badges Grid */}
            <div className="grid grid-cols-3 gap-3 md:gap-4">
              <div className="bg-white p-3.5 rounded-2xl border border-stone-200/80 text-center shadow-2xs">
                <Users className="w-5 h-5 mx-auto text-[#9B111E] mb-1.5" />
                <h3 className="text-xs font-bold text-stone-900">Women-Empowered</h3>
                <p className="text-[10px] text-stone-500 mt-0.5">Supports 50+ Women</p>
              </div>
              <div className="bg-white p-3.5 rounded-2xl border border-stone-200/80 text-center shadow-2xs">
                <Heart className="w-5 h-5 mx-auto text-[#D9531E] mb-1.5" />
                <h3 className="text-xs font-bold text-stone-900">100% Homemade</h3>
                <p className="text-[10px] text-stone-500 mt-0.5">Authentic Taste & Care</p>
              </div>
              <div className="bg-white p-3.5 rounded-2xl border border-stone-200/80 text-center shadow-2xs">
                <ShieldCheck className="w-5 h-5 mx-auto text-emerald-600 mb-1.5" />
                <h3 className="text-xs font-bold text-stone-900">Premium Quality</h3>
                <p className="text-[10px] text-stone-500 mt-0.5">Fresh & Safe Items</p>
              </div>
            </div>

            {/* Campaign Callout */}
            <div className="bg-[#9B111E]/5 border border-[#9B111E]/10 rounded-2xl p-4 md:p-6 flex gap-4 items-start">
              <span className="p-2.5 rounded-xl bg-[#9B111E]/15 text-[#9B111E] text-lg font-black leading-none shrink-0">🙏</span>
              <div>
                <h3 className="text-sm font-extrabold text-[#9B111E]">Support Women Business Group</h3>
                <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                  With every single order you place this Diwali, you will be supporting local women entrepreneurs and helping them build self-reliant businesses. Thank you for making their festive season bright! 😊❤️
                </p>
              </div>
            </div>
          </div>

          {/* Hero Right: Booking Controls */}
          <div className="lg:col-span-5 bg-white border border-stone-200/80 rounded-3xl p-6 md:p-8 shadow-md sticky top-28 space-y-6">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-[#D9531E]">
                <Clock className="w-3.5 h-3.5 animate-pulse" />
                Limited Batch Offering
              </span>
              <h2 className="text-2xl font-black text-stone-900 leading-none">Book Your Diwali Box</h2>
              <p className="text-xs text-stone-500 leading-relaxed">
                Exclusively available to the first 1,000 customers. Secure your spot in the queue with a flexible payment schedule.
              </p>
            </div>

            {/* Counter Section */}
            <div className="bg-amber-50 border border-amber-200/50 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Slots Available</p>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-black text-stone-950">{currentSlots}</span>
                  <span className="text-xs text-stone-400">/ 1,000 Left</span>
                </div>
              </div>
              <div className="w-24 bg-stone-200 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-amber-500 h-full rounded-full transition-all duration-1000" 
                  style={{ width: `${(currentSlots / 1000) * 100}%` }}
                />
              </div>
            </div>

            {/* Interactive Pricing Options */}
            <div className="space-y-3">
              <h4 className="text-xs font-extrabold text-stone-700 uppercase tracking-wider">Select Payment Option</h4>

              {/* Option 1: Booking */}
              <button
                onClick={() => setSelectedOption('booking')}
                className={`w-full p-4 rounded-2xl border-2 text-left transition-all relative ${
                  selectedOption === 'booking'
                    ? 'border-[#9B111E] bg-[#9B111E]/2'
                    : 'border-stone-200 hover:border-stone-300 bg-stone-50/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-black text-stone-900">1. Booking Payment Option</span>
                    <p className="text-[10px] text-stone-500 mt-0.5">Pay ₹1,000 now, rest in 2 flexible installments</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-black text-[#9B111E]">₹1,000</span>
                    <p className="text-[9px] text-stone-400 line-through">₹1,500</p>
                  </div>
                </div>
                {selectedOption === 'booking' && (
                  <span className="absolute -top-2.5 right-4 px-2 py-0.5 bg-[#9B111E] text-white text-[9px] font-black uppercase rounded-md tracking-wider">
                    Most Popular
                  </span>
                )}
              </button>

              {/* Option 2: Full Payment */}
              <button
                onClick={() => setSelectedOption('full')}
                className={`w-full p-4 rounded-2xl border-2 text-left transition-all relative ${
                  selectedOption === 'full'
                    ? 'border-[#9B111E] bg-[#9B111E]/2'
                    : 'border-stone-200 hover:border-stone-300 bg-stone-50/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-black text-stone-900">2. Full One-Time Payment</span>
                    <p className="text-[10px] text-stone-500 mt-0.5">Pay full ₹4,999 today and sit back relax</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-black text-[#9B111E]">₹4,999</span>
                    <p className="text-[9px] text-stone-400 line-through">₹6,999</p>
                  </div>
                </div>
                {selectedOption === 'full' && (
                  <span className="absolute -top-2.5 right-4 px-2 py-0.5 bg-[#9B111E] text-white text-[9px] font-black uppercase rounded-md tracking-wider">
                    Instant Secure
                  </span>
                )}
              </button>
            </div>

            {/* Installments breakdown */}
            {selectedOption === 'booking' && (
              <div className="bg-stone-50 rounded-2xl p-4 border border-stone-150 text-xs space-y-2.5">
                <span className="font-extrabold text-stone-700 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-stone-500" />
                  Deferred Payment Schedule:
                </span>
                <div className="grid grid-cols-3 gap-2 text-[10px] text-stone-600">
                  <div className="p-2 bg-white rounded-lg border border-stone-200">
                    <p className="font-bold text-stone-400">1. Booking</p>
                    <p className="font-black text-[#9B111E] mt-0.5">₹1,000</p>
                    <p className="text-[8px] text-stone-500 mt-1">Today</p>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-stone-200">
                    <p className="font-bold text-stone-400">2. Installment</p>
                    <p className="font-black text-stone-800 mt-0.5">₹2,500</p>
                    <p className="text-[8px] text-stone-500 mt-1">By Oct 1</p>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-stone-200">
                    <p className="font-bold text-stone-400">3. Final Due</p>
                    <p className="font-black text-stone-800 mt-0.5">₹1,499</p>
                    <p className="text-[8px] text-stone-500 mt-1">By Oct 20</p>
                  </div>
                </div>
                <div className="border-t border-stone-200/80 pt-2 flex justify-between items-center text-[10px] font-bold text-stone-500">
                  <span>Total Package Value:</span>
                  <span className="text-stone-900 font-extrabold">₹4,999/- Only</span>
                </div>
              </div>
            )}

            {/* Quantity Selector */}
            <div className="flex items-center justify-between border-t border-stone-150 pt-5">
              <span className="text-xs font-extrabold text-stone-600">Select Box Quantity:</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="w-8 h-8 rounded-full border border-stone-300 hover:bg-stone-50 active:bg-stone-100 flex items-center justify-center font-bold text-stone-600 transition-colors cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="text-sm font-black w-5 text-center text-stone-900">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity(q => q + 1)}
                  className="w-8 h-8 rounded-full border border-stone-300 hover:bg-stone-50 active:bg-stone-100 flex items-center justify-center font-bold text-stone-600 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={handleAction}
                disabled={isBooked}
                className="w-full py-4 px-6 bg-[#9B111E] hover:bg-[#800d18] text-white font-extrabold rounded-2xl shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer text-sm"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>
                  {isBooked ? 'Adding to Box...' : selectedOption === 'booking' ? 'Book Now (Pay ₹1,000)' : 'Buy Full Combo Box (₹4,999)'}
                </span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>

              <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-stone-400">
                <Lock className="w-3.5 h-3.5 text-stone-300" />
                <span>Secure SSL Checkout • Non-Refundable Booking Amount</span>
              </div>
            </div>
          </div>
        </div>

        {/* The 7-In-1 Box Inclusions Grid */}
        <div className="my-16 md:my-24 space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-[#9B111E] font-black text-xs uppercase tracking-widest block">Complete Diwali in One Box</span>
            <h2 className="text-2xl md:text-4xl font-black text-stone-950 leading-tight">What Is Inside The Box?</h2>
            <p className="text-xs md:text-sm text-stone-500 leading-relaxed">
              Every package is freshly prepped, quality checked, and carefully arranged under strict hygiene guidelines by our talented local women artisans.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            
            {/* item 1: Farsan */}
            <div className="bg-white border border-stone-200/80 rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition-all">
              <div className="h-44 overflow-hidden relative">
                <img loading="lazy" 
                  src="https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80" 
                  alt="Homemade Diwali Farsan" 
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-4 left-4 px-2.5 py-1 bg-[#9B111E] text-white text-[9px] font-black uppercase rounded-lg tracking-wider shadow-sm">
                  1. Homemade Farsan
                </span>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-1">
                  <h3 className="font-extrabold text-base text-stone-900">🥣 Homemade Diwali Farsan</h3>
                  <p className="text-[10px] text-stone-500">Traditional crisp savouries made with pure cold-pressed oil.</p>
                </div>
                <div className="border-t border-stone-100 pt-3 text-xs space-y-2">
                  <div className="flex justify-between items-center text-stone-600">
                    <span className="font-semibold text-stone-800">Chakli</span>
                    <span className="px-2 py-0.5 bg-stone-100 rounded-md font-bold text-stone-700">500 g</span>
                  </div>
                  <div className="flex justify-between items-center text-stone-600">
                    <span className="font-semibold text-stone-800">Chivda</span>
                    <span className="px-2 py-0.5 bg-stone-100 rounded-md font-bold text-stone-700">2 kg</span>
                  </div>
                  <div className="flex justify-between items-center text-stone-600">
                    <span className="font-semibold text-stone-800">Shankarpale</span>
                    <span className="px-2 py-0.5 bg-stone-100 rounded-md font-bold text-stone-700">500 g</span>
                  </div>
                  <div className="flex justify-between items-center text-stone-600">
                    <span className="font-semibold text-stone-800">Karanji</span>
                    <span className="px-2 py-0.5 bg-stone-100 rounded-md font-bold text-stone-700">500 g</span>
                  </div>
                  <div className="flex justify-between items-center text-stone-600">
                    <span className="font-semibold text-stone-800">Anarse</span>
                    <span className="px-2 py-0.5 bg-stone-100 rounded-md font-bold text-stone-700">500 g</span>
                  </div>
                  <div className="flex justify-between items-center text-stone-600">
                    <span className="font-semibold text-stone-800">Bhakarwadi</span>
                    <span className="px-2 py-0.5 bg-stone-100 rounded-md font-bold text-stone-700">500 g</span>
                  </div>
                </div>
              </div>
            </div>

            {/* item 2: Sweets */}
            <div className="bg-white border border-stone-200/80 rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition-all">
              <div className="h-44 overflow-hidden relative">
                <img loading="lazy" 
                  src="https://images.unsplash.com/photo-1589135304905-eb107abb8f68?auto=format&fit=crop&w=600&q=80" 
                  alt="Pure Festive Sweets" 
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-4 left-4 px-2.5 py-1 bg-[#9B111E] text-white text-[9px] font-black uppercase rounded-lg tracking-wider shadow-sm">
                  2. Sweets
                </span>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-1">
                  <h3 className="font-extrabold text-base text-stone-900">🍬 Sweets</h3>
                  <p className="text-[10px] text-stone-500">Mouthwatering classic sweets rich in authentic flavor.</p>
                </div>
                <div className="border-t border-stone-100 pt-3 text-xs space-y-2">
                  <div className="flex justify-between items-center text-stone-600">
                    <span className="font-semibold text-stone-800">Besan Ladoo</span>
                    <span className="px-2 py-0.5 bg-stone-100 rounded-md font-bold text-stone-700">250 g</span>
                  </div>
                  <div className="flex justify-between items-center text-stone-600">
                    <span className="font-semibold text-stone-800">Motichoor Ladoo</span>
                    <span className="px-2 py-0.5 bg-stone-100 rounded-md font-bold text-stone-700">250 g</span>
                  </div>
                  <div className="flex justify-between items-center text-stone-600">
                    <span className="font-semibold text-stone-800">Gulab Jamun</span>
                    <span className="px-2 py-0.5 bg-stone-100 rounded-md font-bold text-stone-700">1 kg</span>
                  </div>
                  <div className="flex justify-between items-center text-stone-600">
                    <span className="font-semibold text-stone-800">Rasgulla</span>
                    <span className="px-2 py-0.5 bg-stone-100 rounded-md font-bold text-stone-700">1 kg</span>
                  </div>
                </div>
              </div>
            </div>

            {/* item 3: Jalgaonwala Special */}
            <div className="bg-white border border-stone-200/80 rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition-all">
              <div className="h-44 overflow-hidden relative">
                <img loading="lazy" 
                  src="https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=600&q=80" 
                  alt="Aapla Jalgaonwala Specials" 
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-4 left-4 px-2.5 py-1 bg-[#9B111E] text-white text-[9px] font-black uppercase rounded-lg tracking-wider shadow-sm">
                  3. Jalgaonwala Special
                </span>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-1">
                  <h3 className="font-extrabold text-base text-stone-900">🌶️ Aapla Jalgaonwala Special</h3>
                  <p className="text-[10px] text-stone-500">Uniquely crafted taste of Khandeshi spices and savouries.</p>
                </div>
                <div className="border-t border-stone-100 pt-3 text-xs space-y-2">
                  <div className="flex justify-between items-center text-stone-600">
                    <span className="font-semibold text-stone-800">Special Khandeshi Chivda</span>
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-900 rounded-md font-bold text-[10px]">Included</span>
                  </div>
                  <div className="flex justify-between items-center text-stone-600">
                    <span className="font-semibold text-stone-800">1-Time Family Masala</span>
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-900 rounded-md font-bold text-[10px]">Included</span>
                  </div>
                </div>
              </div>
            </div>

            {/* item 4: Puja Kit */}
            <div className="bg-white border border-stone-200/80 rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition-all">
              <div className="h-44 overflow-hidden relative">
                <img loading="lazy" 
                  src="https://images.unsplash.com/photo-1609137144813-0b1965b9ffdf?auto=format&fit=crop&w=600&q=80" 
                  alt="Lakshmi Puja Essentials" 
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-4 left-4 px-2.5 py-1 bg-[#9B111E] text-white text-[9px] font-black uppercase rounded-lg tracking-wider shadow-sm">
                  4. Lakshmi Puja Kit
                </span>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-1">
                  <h3 className="font-extrabold text-base text-stone-900">🪔 Complete Lakshmi Puja Kit</h3>
                  <p className="text-[10px] text-stone-500">All the essential components for your sacred evening prayer.</p>
                </div>
                <div className="border-t border-stone-100 pt-3 text-xs space-y-2">
                  <div className="flex items-center gap-2 text-stone-600">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Beautiful Lakshmi Idol</span>
                  </div>
                  <div className="flex items-center gap-2 text-stone-600">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Coconut, Betel Nut & Betel Leaves</span>
                  </div>
                  <div className="flex items-center gap-2 text-stone-600">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Turmeric, Kumkum & Akshata</span>
                  </div>
                  <div className="flex items-center gap-2 text-stone-600">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Camphor, Cotton Wicks & Incense Sticks</span>
                  </div>
                </div>
              </div>
            </div>

            {/* item 5: Firecrackers */}
            <div className="bg-white border border-stone-200/80 rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition-all">
              <div className="h-44 overflow-hidden relative">
                <img loading="lazy" 
                  src="https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=600&q=80" 
                  alt="Diwali Firecrackers" 
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-4 left-4 px-2.5 py-1 bg-[#9B111E] text-white text-[9px] font-black uppercase rounded-lg tracking-wider shadow-sm">
                  5. Kids Firecrackers
                </span>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-1">
                  <h3 className="font-extrabold text-base text-stone-900">🎆 Diwali Firecrackers</h3>
                  <p className="text-[10px] text-stone-500">Child-safe varieties to spark joy for the kids safely.</p>
                </div>
                <div className="border-t border-stone-100 pt-3 text-xs space-y-2">
                  <div className="flex items-center gap-2 text-stone-600">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Premium Sparklers (Phulbaji)</span>
                  </div>
                  <div className="flex items-center gap-2 text-stone-600">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Spinning Ground Wheels (Bhui Chakra)</span>
                  </div>
                  <div className="flex items-center gap-2 text-stone-600">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Safe Mixed Soundless Novelties</span>
                  </div>
                </div>
              </div>
            </div>

            {/* item 6 & 7: Rangoli and Gift */}
            <div className="bg-white border border-stone-200/80 rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition-all">
              <div className="h-44 overflow-hidden relative">
                <img loading="lazy" 
                  src="https://images.unsplash.com/photo-1605335914620-e1451e04169c?auto=format&fit=crop&w=600&q=80" 
                  alt="Rangoli Designs & Gifts" 
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-4 left-4 px-2.5 py-1 bg-[#9B111E] text-white text-[9px] font-black uppercase rounded-lg tracking-wider shadow-sm">
                  6 & 7. Art & Gifts
                </span>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-1">
                  <h3 className="font-extrabold text-base text-stone-900">🎨 Rangoli & Surprise Gift</h3>
                  <p className="text-[10px] text-stone-500">Colors, design stencils, and an exclusive keepsake.</p>
                </div>
                <div className="border-t border-stone-100 pt-3 text-xs space-y-2">
                  <div className="flex items-center gap-2 text-stone-600">
                    <Paintbrush className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Premium Vibrating Colors Package</span>
                  </div>
                  <div className="flex items-center gap-2 text-stone-600">
                    <Paintbrush className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Handmade Wooden Stencil / Acrylic Border</span>
                  </div>
                  <div className="flex items-center gap-2 text-stone-600">
                    <Gift className="w-3.5 h-3.5 text-[#9B111E] shrink-0" />
                    <span className="font-bold text-stone-900">Aapla Jalgaonwala Surprise Keepsake</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Payment Terms Callout */}
        <div className="bg-amber-50/50 border border-amber-200 rounded-3xl p-6 md:p-8 my-16 max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          <div className="md:col-span-8 space-y-3">
            <span className="text-amber-800 font-extrabold text-xs uppercase tracking-widest flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-[#D9531E]" />
              Booking Confirmation Rules & Terms
            </span>
            <h3 className="text-lg font-black text-stone-900">Important Terms to Note</h3>
            <ul className="text-xs text-stone-600 space-y-1.5 list-disc list-inside">
              <li>The booking amount of <strong>₹1,000/- is strictly non-refundable</strong>.</li>
              <li>Once booking is verified, your complete combo box slot stands 100% confirmed.</li>
              <li>Remaining installments must be cleared according to schedules to ensure dispatch.</li>
              <li>Limited run of exactly 1,000 boxes made by the Women’s Business Group.</li>
            </ul>
          </div>
          <div className="md:col-span-4 text-center md:border-l md:border-amber-200/60 md:pl-6 space-y-3">
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Starting Price</p>
            <div className="flex items-center justify-center gap-1 text-stone-950">
              <span className="text-3xl font-black text-[#9B111E]">₹1,000</span>
              <span className="text-xs font-bold text-stone-500">Booking</span>
            </div>
            <button
              onClick={() => {
                setSelectedOption('booking');
                window.scrollTo({ top: 120, behavior: 'smooth' });
              }}
              className="w-full py-2.5 bg-[#9B111E] hover:bg-[#800d18] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Secure My Box
            </button>
          </div>
        </div>

      </Container>
    </div>
  );
}
