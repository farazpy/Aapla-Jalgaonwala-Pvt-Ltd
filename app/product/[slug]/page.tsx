'use client';

import React, { useState, useEffect, use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SEO } from '@/components/seo/SEO';
import { Container } from '@/components/ui/Container';
import { Badge } from '@/components/ui/Badge';
import { ProductCard } from '@/components/product/ProductCard';
import { ProductDetailSkeleton } from '@/components/product/ProductSkeletons';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { Product } from '@/types';
import { initialProducts } from '@/data/products';
import {
  ShoppingBag,
  Heart,
  Truck,
  ShieldCheck,
  Award,
  Plus,
  Minus,
  Check,
  Star,
  MapPin,
  ArrowRight,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  Package,
  ChevronRight
} from 'lucide-react';
import { motion } from 'motion/react';
import { DiwaliComboShowcase } from '@/components/product/DiwaliComboShowcase';

export default function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();

  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const [product, setProduct] = useState<Product | null>(null);
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const [activeTab, setActiveTab] = useState<'description' | 'ingredients' | 'reviews' | 'storage'>('description');

  // Pincode check state
  const [pincode, setPincode] = useState('');
  const [pincodeResult, setPincodeResult] = useState<string | null>(null);
  const [isCheckingPincode, setIsCheckingPincode] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchProductData = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/products/${slug}`);
        const json = await res.json();
        if (isMounted) {
          if (json.success && json.data?.product) {
            setProduct(json.data.product);
            setRecommendations(json.data.recommendations || []);
          } else {
            // Fallback to static initial products if database doesn't have it
            const fallbackProd = initialProducts.find(p => p.slug === slug || p.id === slug) || null;
            const fallbackRecs = initialProducts.filter(p => p.slug !== slug && p.id !== slug).slice(0, 4);
            setProduct(fallbackProd);
            setRecommendations(fallbackRecs);
          }
        }
      } catch (err) {
        console.error('Failed to load product details:', err);
        // Fallback to static data on network error
        const fallbackProd = initialProducts.find(p => p.slug === slug || p.id === slug) || null;
        const fallbackRecs = initialProducts.filter(p => p.slug !== slug && p.id !== slug).slice(0, 4);
        setProduct(fallbackProd);
        setRecommendations(fallbackRecs);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchProductData();
    return () => { isMounted = false; };
  }, [slug]);

  if (isLoading) {
    return (
      <div className="py-12 bg-[#FAF6ED] min-h-screen">
        <ProductDetailSkeleton />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="py-20 bg-[#FAF6ED] min-h-screen text-center">
        <Container>
          <div className="max-w-md mx-auto bg-white p-8 rounded-3xl shadow-xs border border-stone-200/80">
            <h2 className="text-2xl font-black text-stone-900 mb-2">Product Not Found</h2>
            <p className="text-xs text-stone-500 mb-6">
              The Jalgaon snack you are looking for might be out of stock or renamed.
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#9B111E] text-white font-bold text-xs"
            >
              <span>Return to Shop</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </Container>
      </div>
    );
  }

  const isWishlisted = isInWishlist(product.id);
  const images = product.images.length > 0 ? product.images : [{ id: '1', url: 'https://picsum.photos/seed/jalgaon/800/800', alt: product.name }];
  const currentImage = images[selectedImageIndex]?.url || images[0].url;

  const isDiwaliCombo = Boolean(
    product && (
      product.slug === 'diwali-special-offer-box-womens-business-group' ||
      product.slug?.includes('diwali') ||
      product.id === '32' ||
      product.id === 'diwali-special-combo' ||
      product.name?.toLowerCase().includes('diwali')
    )
  );

  const handleAddToCart = () => {
    addToCart(product, undefined, quantity);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 1800);
  };

  const handleBuyNow = () => {
    addToCart(product, undefined, quantity);
    router.push('/checkout');
  };

  const handleCheckPincode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pincode || pincode.trim().length !== 6) {
      setPincodeResult('Please enter a valid 6-digit PIN code.');
      return;
    }
    setIsCheckingPincode(true);
    setTimeout(() => {
      setIsCheckingPincode(false);
      if (pincode.startsWith('42')) {
        setPincodeResult('⚡ Fast Delivery! Delivery within 2-3 days in Jalgaon & North Maharashtra.');
      } else if (pincode.startsWith('40') || pincode.startsWith('41') || pincode.startsWith('43') || pincode.startsWith('44')) {
        setPincodeResult('🚚 Delivery available in 3-4 days across Maharashtra.');
      } else {
        setPincodeResult('📦 Pan-India Express Delivery available in 4-6 business days.');
      }
    }, 400);
  };

  return (
    <div className="py-8 md:py-16 bg-[#FAF6ED] min-h-screen">
      <SEO
        title={`${product.name} | Authentic Jalgaon Taste`}
        description={product.shortDescription || product.description}
      />

      <Container>
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs font-semibold text-stone-500 mb-6">
          <Link href="/" className="hover:text-[#9B111E]">Home</Link>
          <span>/</span>
          <Link href="/shop" className="hover:text-[#9B111E]">Shop</Link>
          <span>/</span>
          <Link href={`/category/${product.category}`} className="capitalize hover:text-[#9B111E]">
            {product.category.replace('-', ' ')}
          </Link>
          <span>/</span>
          <span className="text-stone-900 line-clamp-1">{product.name}</span>
        </nav>

        {/* Main Product Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 bg-white rounded-3xl p-6 sm:p-10 border border-stone-200/80 shadow-xs">
          {/* Gallery Column (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Primary Image Stage */}
            <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-amber-50/60 border border-amber-100/80 group">
              <Image
                src={currentImage}
                alt={product.name}
                fill
                priority
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />

              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
                {product.discount && product.discount > 0 && (
                  <Badge variant="red" size="md">
                    {product.discount}% OFF
                  </Badge>
                )}
                {product.isBestSeller && (
                  <Badge variant="saffron" size="md">
                    Bestseller
                  </Badge>
                )}
              </div>

              {/* Veg Dot Symbol */}
              <div className="absolute top-4 right-4 z-10 w-6 h-6 border-2 border-emerald-600 rounded-md p-0.5 bg-white flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
              </div>
            </div>

            {/* Thumbnail Selectors */}
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-1">
                {images.map((img, idx) => (
                  <button
                    key={img.id || idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                      selectedImageIndex === idx ? 'border-[#9B111E] scale-105' : 'border-stone-200 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <Image src={img.url} alt={img.alt || product.name} fill className="object-cover" referrerPolicy="no-referrer" />
                  </button>
                ))}
              </div>
            )}

            {/* Quality Guarantees Bar */}
            <div className="grid grid-cols-3 gap-2 pt-4 border-t border-stone-100 text-center">
              <div className="p-3 rounded-xl bg-amber-50/60 text-stone-800">
                <Award className="w-5 h-5 text-[#D9531E] mx-auto mb-1" />
                <p className="text-[10px] font-extrabold uppercase tracking-wider">100% Raw Jalgaon</p>
              </div>
              <div className="p-3 rounded-xl bg-amber-50/60 text-stone-800">
                <ShieldCheck className="w-5 h-5 text-emerald-700 mx-auto mb-1" />
                <p className="text-[10px] font-extrabold uppercase tracking-wider">Zero Preservatives</p>
              </div>
              <div className="p-3 rounded-xl bg-amber-50/60 text-stone-800">
                <Truck className="w-5 h-5 text-amber-700 mx-auto mb-1" />
                <p className="text-[10px] font-extrabold uppercase tracking-wider">Crisp Delivery</p>
              </div>
            </div>
          </div>

          {/* Details Column (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-black uppercase tracking-wider text-[#D9531E] bg-amber-100 px-2.5 py-1 rounded-md">
                  {product.category.replace('-', ' ')}
                </span>
                {product.flavour && (
                  <span className="text-xs font-bold text-stone-600 bg-stone-100 px-2.5 py-1 rounded-md">
                    {product.flavour}
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight leading-tight">
                {product.name}
              </h1>

              {/* Rating & Reviews summary */}
              <div className="flex items-center gap-3 mt-2 text-xs font-semibold text-stone-600">
                <div className="flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200/60">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span className="font-bold">4.9</span>
                </div>
                <span>•</span>
                <span>428 Customer Ratings</span>
                <span>•</span>
                <span className="text-emerald-700 font-bold">In Stock ({product.stock} packs left)</span>
              </div>
            </div>

            {/* Pricing Section */}
            <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/60 flex items-baseline justify-between">
              <div>
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-black text-[#9B111E]">₹{product.price}</span>
                  {product.mrp > product.price && (
                    <span className="text-sm font-semibold text-stone-400 line-through">₹{product.mrp}</span>
                  )}
                  {product.discount && (
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                      SAVE {product.discount}%
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-stone-500 mt-1">Inclusive of all taxes. Net Quantity: <strong>{product.netQuantity}</strong></p>
              </div>

              <span className="text-xs font-bold text-stone-600 bg-white px-3 py-1.5 rounded-xl border border-stone-200 shadow-2xs">
                Pack size: {product.netQuantity}
              </span>
            </div>

            {/* Short Description */}
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              {product.shortDescription || product.description}
            </p>

            {/* Quantity & CTAs */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-4">
                <span className="text-xs font-bold text-stone-700">Quantity:</span>
                <div className="inline-flex items-center rounded-2xl border border-stone-300 bg-stone-50 p-1">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-stone-700 hover:bg-stone-200 shadow-2xs disabled:opacity-50"
                    disabled={quantity <= 1}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-12 text-center font-extrabold text-sm text-stone-900">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-stone-700 hover:bg-stone-200 shadow-2xs"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <button
                  onClick={handleAddToCart}
                  className={`sm:col-span-6 py-3.5 px-6 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md ${
                    addedToCart
                      ? 'bg-emerald-600 text-white'
                      : 'bg-[#9B111E] hover:bg-[#800A14] text-white'
                  }`}
                >
                  {addedToCart ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Added to Cart</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4" />
                      <span>Add to Cart (₹{product.price * quantity})</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleBuyNow}
                  className="sm:col-span-4 py-3.5 px-6 rounded-2xl font-bold text-xs bg-[#D9531E] hover:bg-[#B84216] text-white transition-all shadow-md flex items-center justify-center gap-1.5"
                >
                  <span>Buy Now</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => toggleWishlist(product)}
                  className={`sm:col-span-2 py-3.5 px-4 rounded-2xl border flex items-center justify-center transition-all ${
                    isWishlisted
                      ? 'border-red-200 bg-red-50 text-red-600'
                      : 'border-stone-200 hover:bg-stone-100 text-stone-600'
                  }`}
                  title={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
                >
                  <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
                </button>
              </div>
            </div>

            {/* Pincode Checker */}
            <div className="pt-4 border-t border-stone-200">
              <form onSubmit={handleCheckPincode} className="space-y-2">
                <label className="block text-xs font-bold text-stone-700 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-[#D9531E]" />
                  <span>Check Delivery Availability</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 6-digit PIN code (e.g. 425001)"
                    className="flex-1 px-3.5 py-2 rounded-xl border border-stone-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#D9531E]"
                  />
                  <button
                    type="submit"
                    disabled={isCheckingPincode}
                    className="px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-bold hover:bg-stone-800"
                  >
                    {isCheckingPincode ? 'Checking...' : 'Check PIN'}
                  </button>
                </div>
                {pincodeResult && (
                  <p className="text-xs font-medium text-stone-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200 mt-2">
                    {pincodeResult}
                  </p>
                )}
              </form>
            </div>
          </div>
        </div>

        {/* Detailed Tabs Section */}
        <div id="product-tabs-section" className="mt-12 bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/80 shadow-xs">
          <div className="flex border-b border-stone-200 gap-6 overflow-x-auto no-scrollbar">
            {[
              { id: 'description', label: isDiwaliCombo ? "What's in the Box & Schedule" : 'Detailed Description' },
              { id: 'ingredients', label: isDiwaliCombo ? 'Ingredients & Pure Desi Ghee' : 'Ingredients & Nutrition' },
              { id: 'storage', label: isDiwaliCombo ? 'Freshness & Shelf Life Guide' : 'Storage & Shelf Life' },
              { id: 'reviews', label: 'Customer Reviews (4.9★)' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 text-xs font-bold whitespace-nowrap transition-colors relative ${
                  activeTab === tab.id ? 'text-[#9B111E]' : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="productTabIndicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#9B111E] rounded-full"
                  />
                )}
              </button>
            ))}
          </div>

          <div className="py-6">
            {activeTab === 'description' && (
              isDiwaliCombo ? (
                <DiwaliComboShowcase comboImages={(product as any).comboImages} />
              ) : (
                <div className="space-y-4 text-xs sm:text-sm text-stone-700 leading-relaxed">
                  <p>{product.description}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200/60">
                      <h4 className="font-extrabold text-stone-900 mb-1">Authentic Khandeshi Preparation</h4>
                      <p className="text-xs text-stone-600">
                        Crafted using traditional raw yellow bananas sourced directly from farm orchards in Jalgaon, fried to golden crispiness in fresh oil.
                      </p>
                    </div>
                    <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200/60">
                      <h4 className="font-extrabold text-stone-900 mb-1">Hygienic Moisture-Proof Pack</h4>
                      <p className="text-xs text-stone-600">
                        Sealed in multi-layer food-grade foil to retain authentic crunchiness, aroma, and fresh taste until opened.
                      </p>
                    </div>
                  </div>
                </div>
              )
            )}

            {activeTab === 'ingredients' && (
              isDiwaliCombo ? (
                <div className="space-y-5 text-xs sm:text-sm text-stone-700">
                  <div className="p-5 bg-gradient-to-br from-amber-50/90 to-orange-50/60 rounded-2xl border border-amber-200 space-y-3">
                    <h4 className="font-black text-stone-900 flex items-center gap-2">
                      <span className="text-lg">🥣</span>
                      <span>Handmade Farsan & Sweets Ingredients</span>
                    </h4>
                    <p className="text-stone-700 leading-relaxed text-xs sm:text-sm">
                      <strong>Traditional Sweets:</strong> Pure Cow Desi Ghee, Slow-roasted Gram Flour (Besan), Fresh Milk Solids (Chenna/Mawa), Kashmiri Saffron (Kesar), Fragrant Green Cardamom (Elaichi), Pure Sugar Syrup, Dry Melon Seeds.
                    </p>
                    <p className="text-stone-700 leading-relaxed text-xs sm:text-sm">
                      <strong>Homemade Diwali Farsan:</strong> Four-Grain Authentic Bhajani Flour (Rice, Chana Dal, Urad Dal, Coriander Seeds), Poori Poha, Fresh Roasted Groundnuts, Dry Desiccated Coconut Slivers, Poppy Seeds (Khaskhas), Red Chilli, Ajwain, Cumin, Rock Salt (Sendha Namak), Refined Vegetable Oil.
                    </p>
                    <p className="text-stone-700 leading-relaxed text-xs sm:text-sm">
                      <strong>Lakshmi Puja Samagri:</strong> 100% Satvik ritual items including natural Turmeric (Haldi), Pure Kumkum, Consecrated Akshata, Pure Bhimseni Camphor, Dhoop Agarbatti, and Hand-rolled Cotton Wicks.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 text-xs sm:text-sm text-stone-700">
                  <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200">
                    <h4 className="font-bold text-stone-900 mb-1">Key Ingredients:</h4>
                    <p className="text-stone-600">
                      Raw Jalgaon Yellow Bananas, Refined Vegetable Oil, Khandeshi Special Masala Blend (Chilli, Black Pepper, Cumin, Amchur, Rock Salt), Salt.
                    </p>
                  </div>
                  <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200">
                    <h4 className="font-bold text-stone-900 mb-1">Nutritional Facts (per 100g approx):</h4>
                    <ul className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-stone-600 pt-1 font-semibold">
                      <li>Energy: 520 kcal</li>
                      <li>Proteins: 3.2g</li>
                      <li>Carbohydrates: 58g</li>
                      <li>Dietary Fiber: 4.5g</li>
                    </ul>
                  </div>
                </div>
              )
            )}

            {activeTab === 'storage' && (
              isDiwaliCombo ? (
                <div className="space-y-3 text-xs sm:text-sm text-stone-700">
                  <div className="p-5 bg-amber-50/70 rounded-2xl border border-amber-200 space-y-3">
                    <h4 className="font-black text-stone-900 flex items-center gap-2">
                      <span className="text-lg">🕒</span>
                      <span>Festive Shelf Life & Freshness Guide</span>
                    </h4>
                    <div className="space-y-2.5">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span><strong>Diwali Farsan:</strong> 60 Days shelf life in dry, airtight tins.</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span><strong>Ladoos & Sweets:</strong> 30 Days shelf life. Store in cool, shaded pantry.</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 text-xs sm:text-sm text-stone-700">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Store in a cool, dry place away from direct sunlight and humidity.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Transfer to an airtight container after opening to retain maximum crispiness.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Best consumed within 6 months from the date of manufacturing.</span>
                  </div>
                </div>
              )
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-amber-50 rounded-2xl">
                  <div className="text-center px-4 border-r border-amber-200">
                    <span className="text-3xl font-black text-stone-900">4.9</span>
                    <div className="flex text-amber-400 mt-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-stone-600 font-medium">
                    98% of customers recommended this product for its crispiness and authentic Jalgaon flavour!
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  {[
                    { name: 'Sanjay Patil', city: 'Pune', comment: 'Best banana chips I have ordered online! So crunchy and not oily at all.', rating: 5 },
                    { name: 'Meena Kulkarni', city: 'Mumbai', comment: 'The masala blend reminds me of home in Jalgaon. Very delicious!', rating: 5 }
                  ].map((rev, i) => (
                    <div key={i} className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200/80">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-xs text-stone-900">{rev.name} ({rev.city})</span>
                        <span className="text-[10px] text-amber-700 font-bold">Verified Buyer</span>
                      </div>
                      <p className="text-xs text-stone-600">{rev.comment}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recommendations Section */}
        {recommendations.length > 0 && (
          <div className="mt-16 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-[#D9531E]">Authentic Recommendations</span>
                <h3 className="text-xl font-extrabold text-stone-900">You May Also Love from Jalgaon</h3>
              </div>
              <Link href="/shop" className="text-xs font-bold text-[#9B111E] hover:underline">
                View All &rarr;
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {recommendations.map((rec) => (
                <ProductCard key={rec.id} product={rec} />
              ))}
            </div>
          </div>
        )}
      </Container>
    </div>
  );
}
