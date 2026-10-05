import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Image } from '@/components/ui/Image';
import { Link } from '@/lib/linkCompat';
import { useRouter } from '@/lib/navCompat';
import { SEO } from '@/components/seo/SEO';
import { Container } from '@/components/ui/Container';
import { Badge } from '@/components/ui/Badge';
import { ProductCard } from '@/components/product/ProductCard';
import { ProductDetailSkeleton } from '@/components/product/ProductSkeletons';
import { ProductReviewsSection } from '@/components/product/ProductReviewsSection';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { Product, ProductVariant } from '@/types';
import { initialProducts } from '@/data/products';
import { Analytics } from '@/services/analyticsTracker';
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
  Bell,
  Mail,
  AlertCircle,
  Package,
  ChevronRight
} from 'lucide-react';
import { motion } from 'motion/react';
import { DiwaliComboShowcase } from '@/components/product/DiwaliComboShowcase';

export function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();

  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const [product, setProduct] = useState<Product | null>(null);
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const [activeTab, setActiveTab] = useState<'description' | 'ingredients' | 'reviews' | 'storage'>('description');

  // Stock Notification State
  const [notifyEmail, setNotifyEmail] = useState('');
  const [isSubmittingNotify, setIsSubmittingNotify] = useState(false);
  const [notifySuccessMessage, setNotifySuccessMessage] = useState<string | null>(null);
  const [notifyErrorMessage, setNotifyErrorMessage] = useState<string | null>(null);

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
            const p: Product = json.data.product;
            const isDiwali = Boolean(
              p.slug === 'diwali-special-offer-box-womens-business-group' ||
              p.slug?.includes('diwali') ||
              p.id === '32' ||
              p.id === 'diwali-special-combo' ||
              p.name?.toLowerCase().includes('diwali')
            );
            if (isDiwali && (!p.variants || p.variants.length === 0)) {
              p.variants = [
                {
                  id: 'var-diwali-booking',
                  weight: '₹1,000 Booking Advance',
                  price: 1000,
                  mrp: 1000,
                  stock: 1000
                },
                {
                  id: 'var-diwali-full',
                  weight: '₹4,999 Full Payment',
                  price: 4999,
                  mrp: 6499,
                  stock: 1000
                }
              ];
            }
            setProduct(p);
            if (Array.isArray(p.variants) && p.variants.length > 0) {
              setSelectedVariant(p.variants[0]);
            } else {
              setSelectedVariant(null);
            }
            setRecommendations(json.data.recommendations || []);
            Analytics.trackViewItem({
              id: p.id,
              name: p.name,
              price: p.salePrice || p.price,
              category: p.category
            });
          } else {
            setProduct(null);
            setSelectedVariant(null);
            setRecommendations([]);
          }
        }
      } catch (err) {
        console.error('Failed to load product details:', err);
        if (isMounted) {
          setProduct(null);
          setRecommendations([]);
        }
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

  // Strict Confidential Document Filter
  const isConfidentialDoc = (url?: string): boolean => {
    if (!url || typeof url !== 'string') return false;
    const lower = url.toLowerCase();
    return (
      lower.includes('partner_passbook') ||
      lower.includes('passbook') ||
      lower.includes('aadhaar') ||
      lower.includes('pan_card') ||
      lower.includes('kyc')
    );
  };

  const filteredRawImages = (product.images || []).filter(img => img && img.url && !isConfidentialDoc(img.url));
  const rawList = filteredRawImages.length > 0
    ? filteredRawImages
    : [{ id: '1', url: (!isConfidentialDoc(product.image) ? product.image : undefined) || 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=800&q=80', alt: product.name }];

  const images = rawList.map(img => {
    if (!img?.url || !product.updatedAt || img.url.includes('v=') || img.url.includes('_cb=')) return img;
    const v = new Date(product.updatedAt).getTime();
    return {
      ...img,
      url: v && !isNaN(v) ? (img.url.includes('?') ? `${img.url}&v=${v}` : `${img.url}?v=${v}`) : img.url
    };
  });
  const currentImage = images[selectedImageIndex]?.url || images[0].url;
  const isOutOfStock = Boolean(product.stock <= 0 || product.isAvailable === false);

  const isDiwaliCombo = Boolean(
    product && (
      product.slug === 'diwali-special-offer-box-womens-business-group' ||
      product.slug?.includes('diwali') ||
      product.id === '32' ||
      product.id === 'diwali-special-combo' ||
      product.name?.toLowerCase().includes('diwali')
    )
  );

  // Dynamic active pricing based on selected variant
  const displayPrice = selectedVariant ? selectedVariant.price : (product.salePrice || product.price);
  const displayMrp = selectedVariant ? (selectedVariant.mrp || selectedVariant.price) : (product.mrp || product.price);
  const displayWeight = selectedVariant ? selectedVariant.weight : product.netQuantity;
  const displayDiscount = displayMrp > displayPrice 
    ? Math.round(((displayMrp - displayPrice) / displayMrp) * 100) 
    : (product.discount || 0);

  const handleSubscribeNotify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifyEmail || !notifyEmail.includes('@')) {
      setNotifyErrorMessage('Please enter a valid email address.');
      return;
    }

    setIsSubmittingNotify(true);
    setNotifyErrorMessage(null);
    setNotifySuccessMessage(null);

    try {
      const res = await fetch('/api/stock-notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: notifyEmail.trim(),
          productId: product.id,
          productSlug: product.slug,
          productName: product.name
        })
      });

      const json = await res.json();
      if (json.success) {
        setNotifySuccessMessage(json.data.message || `We will email ${notifyEmail.trim()} as soon as stock arrives!`);
        setNotifyEmail('');
      } else {
        setNotifyErrorMessage(json.error?.message || json.message || 'Failed to subscribe to stock alert.');
      }
    } catch (err) {
      console.error('Failed to subscribe to stock alert:', err);
      setNotifyErrorMessage('Network error while registering for stock alert. Please try again.');
    } finally {
      setIsSubmittingNotify(false);
    }
  };

  const handleAddToCart = () => {
    addToCart(product, selectedVariant || undefined, quantity, false);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 1800);
  };

  const handleBuyNow = () => {
    addToCart(product, selectedVariant || undefined, quantity, false);
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
    <div className="py-8 md:py-16 bg-[#FAFAF8] min-h-screen">
      <SEO
        title={`${product.name} | Authentic Jalgaon Taste`}
        description={product.shortDescription || product.description}
        ogImage={currentImage}
        product={product}
      />

      <Container>
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs font-semibold text-stone-500 mb-6">
          <Link href="/" className="hover:text-[#9B111E]">Home</Link>
          <span>/</span>
          <Link href="/shop" className="hover:text-[#9B111E]">Shop</Link>
          <span>/</span>
          <Link href={`/shop?category=${product.category}`} className="capitalize hover:text-[#9B111E]">
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
                <button
                  onClick={() => {
                    setActiveTab('reviews');
                    const el = document.getElementById('product-tabs-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="flex items-center gap-1.5 text-amber-700 bg-amber-50 hover:bg-amber-100/80 px-2.5 py-1 rounded-lg border border-amber-200/60 transition-colors cursor-pointer"
                >
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span className="font-extrabold">{product.rating ? product.rating.toFixed(1) : '5.0'}</span>
                  <span className="text-[11px] text-stone-500 font-medium">({product.reviewsCount || 0} reviews)</span>
                </button>
                <span>•</span>
                {isOutOfStock ? (
                  <span className="text-red-700 font-bold bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Out of Stock
                  </span>
                ) : (
                  <span className="text-emerald-700 font-bold">In Stock ({product.stock} packs left)</span>
                )}
              </div>
            </div>

            {/* Pricing Section */}
            <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/60 flex items-baseline justify-between">
              <div>
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-black text-[#9B111E]">₹{displayPrice}</span>
                  {displayMrp > displayPrice && (
                    <span className="text-sm font-semibold text-stone-400 line-through">₹{displayMrp}</span>
                  )}
                  {displayDiscount > 0 && (
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                      SAVE {displayDiscount}%
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-stone-500 mt-1">Inclusive of all taxes. Net Quantity: <strong>{displayWeight}</strong></p>
              </div>

              <span className="text-xs font-bold text-stone-600 bg-white px-3 py-1.5 rounded-xl border border-stone-200 shadow-2xs">
                Pack size: {displayWeight}
              </span>
            </div>

            {/* Weight Variations & Pack Size Selector */}
            {product.variants && product.variants.length > 0 && (
              isDiwaliCombo ? (
                <div className="space-y-3 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#9B111E]" />
                      <span>Choose Booking / Payment Option</span>
                    </label>
                    <span className="text-[11px] text-[#D9531E] font-extrabold bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
                      Limited 1,000 Boxes
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {product.variants.map((v) => {
                      const isSelected = selectedVariant?.id === v.id || (!selectedVariant && v === product.variants![0]);
                      const isBooking = v.price <= 1000;
                      return (
                        <button
                          key={v.id || v.weight}
                          type="button"
                          onClick={() => setSelectedVariant(v)}
                          className={`relative p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                            isSelected
                              ? 'border-[#9B111E] bg-amber-50/70 ring-2 ring-[#9B111E]/20 shadow-xs'
                              : 'border-stone-200 bg-stone-50/70 hover:bg-white hover:border-stone-300'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <div>
                              <span className={`inline-block text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md mb-1 ${
                                isBooking ? 'bg-[#9B111E] text-white' : 'bg-emerald-700 text-white'
                              }`}>
                                {isBooking ? 'Step 1 • Advance Booking' : 'One-Time Full Settlement'}
                              </span>
                              <h4 className="text-xs sm:text-sm font-black text-stone-900">
                                {v.weight}
                              </h4>
                            </div>
                            <div className="text-right">
                              <span className="text-base sm:text-lg font-black text-[#9B111E]">₹{v.price}</span>
                              {v.mrp && v.mrp > v.price && (
                                <span className="text-[10px] font-bold text-stone-400 line-through block">₹{v.mrp}</span>
                              )}
                            </div>
                          </div>
                          <p className="text-[11px] text-stone-600 leading-tight">
                            {isBooking 
                              ? 'Confirm your hamper now with ₹1,000. Balance payable by Oct 1 & Oct 20.' 
                              : 'Complete full payment today and save ₹1,500 on MRP ₹6,499 with priority dispatch.'}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-[#9B111E]" />
                      <span>Select Pack Size / Weight</span>
                    </label>
                    <span className="text-[11px] text-stone-500 font-medium">
                      {product.variants.length} options available
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {product.variants.map((v) => {
                      const isSelected = selectedVariant?.id === v.id || (!selectedVariant && v.weight === product.netQuantity);
                      const varDiscount = v.mrp && v.mrp > v.price ? Math.round(((v.mrp - v.price) / v.mrp) * 100) : 0;
                      return (
                        <button
                          key={v.id || v.weight}
                          type="button"
                          onClick={() => setSelectedVariant(v)}
                          className={`relative p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                            isSelected
                              ? 'border-[#9B111E] bg-white ring-2 ring-[#9B111E]/20 shadow-xs'
                              : 'border-stone-200 bg-stone-50/60 hover:bg-white hover:border-stone-300'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className={`text-xs font-black ${isSelected ? 'text-[#9B111E]' : 'text-stone-800'}`}>
                              {v.weight}
                            </span>
                            {varDiscount > 0 && (
                              <span className="text-[9px] font-bold text-emerald-800 bg-emerald-100/90 px-1.5 py-0.5 rounded-md">
                                {varDiscount}% off
                              </span>
                            )}
                          </div>
                          <div className="flex items-baseline gap-1.5 mt-0.5">
                            <span className="text-sm font-black text-stone-900">₹{v.price}</span>
                            {v.mrp && v.mrp > v.price && (
                              <span className="text-[11px] text-stone-400 line-through">₹{v.mrp}</span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )
            )}

            {/* Short Description */}
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              {product.shortDescription || product.description}
            </p>

            {/* Quantity & CTAs OR Stock Notification Component */}
            {isOutOfStock ? (
              <div className="p-5 sm:p-6 bg-gradient-to-br from-amber-50/90 via-orange-50/50 to-amber-50/90 rounded-3xl border border-amber-200/90 shadow-2xs space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-300 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
                    <Bell className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-stone-900 flex items-center gap-2 flex-wrap">
                      <span>Currently Out of Stock</span>
                      <span className="text-[10px] font-extrabold uppercase bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-full border border-amber-300/60">Fresh Batch In Making</span>
                    </h3>
                    <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                      Our kitchen in Jalgaon is preparing a fresh batch of <strong>{product.name}</strong>. Enter your email below to get an instant notification as soon as stock is available!
                    </p>
                  </div>
                </div>

                {notifySuccessMessage ? (
                  <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200/80 text-emerald-900 space-y-1">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Stock Alert Registered!</span>
                    </div>
                    <p className="text-xs text-emerald-700 pl-6">{notifySuccessMessage}</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubscribeNotify} className="space-y-2">
                    <label className="block text-xs font-bold text-stone-800">
                      Notify Me When Available (Email Address) *
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="relative flex-1">
                        <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          value={notifyEmail}
                          onChange={(e) => setNotifyEmail(e.target.value)}
                          placeholder="Enter your email address"
                          required
                          className="w-full pl-10 pr-3.5 py-3 rounded-2xl bg-white border border-stone-300 text-xs font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#9B111E]/20 focus:border-[#9B111E]"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={isSubmittingNotify}
                        className="py-3 px-6 rounded-2xl bg-[#9B111E] hover:bg-[#800A14] text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shrink-0 disabled:opacity-60"
                      >
                        {isSubmittingNotify ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Subscribing...</span>
                          </>
                        ) : (
                          <>
                            <Bell className="w-4 h-4" />
                            <span>Notify Me</span>
                          </>
                        )}
                      </button>
                    </div>

                    {notifyErrorMessage && (
                      <p className="text-xs font-semibold text-red-600 pt-1 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{notifyErrorMessage}</span>
                      </p>
                    )}

                    <div className="flex items-center justify-between text-[11px] text-stone-500 pt-1">
                      <span className="flex items-center gap-1 text-amber-800/80 font-medium">
                        <Sparkles className="w-3 h-3 text-amber-600 shrink-0" />
                        Instant email notification sent when stock is updated.
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleWishlist(product)}
                        className="text-stone-700 hover:text-[#9B111E] font-bold flex items-center gap-1 hover:underline"
                      >
                        <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-red-600 text-red-600' : ''}`} />
                        <span>{isWishlisted ? 'Saved to Wishlist' : 'Add to Wishlist'}</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ) : (
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
                        <span>Add to Cart (₹{displayPrice * quantity})</span>
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
            )}


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

            {/* Diwali Combo Quick Navigator Strip */}
            {isDiwaliCombo && (
              <div className="pt-2">
                <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-red-500/10 border border-amber-300/80 flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl shrink-0">🎁</span>
                    <div>
                      <p className="text-xs font-black text-stone-900 flex items-center gap-1.5 flex-wrap">
                        <span>7 Handcrafted Sub-Products Inside!</span>
                        <span className="text-[9px] font-extrabold uppercase bg-amber-200/90 text-amber-900 px-1.5 py-0.2 rounded-md border border-amber-300">Complete Diwali</span>
                      </p>
                      <p className="text-[11px] text-stone-600 mt-0.5">
                        4.5kg Farsan • 2.5kg Sweets • Lakshmi Puja Kit • Safe Crackers • Rangoli • Gift
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('description');
                      setTimeout(() => {
                        const elem = document.getElementById('diwali-combo-breakdown');
                        if (elem) {
                          elem.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        } else {
                          document.getElementById('product-tabs-section')?.scrollIntoView({ behavior: 'smooth' });
                        }
                      }, 50);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-[#9B111E] text-white text-xs font-black hover:bg-[#800A14] transition-all flex items-center gap-1 shrink-0 shadow-xs"
                  >
                    <span>View 7 Sections & Schedule</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Detailed Tabs Section */}
        <div id="product-tabs-section" className="mt-12 bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/80 shadow-xs">
          <div className="flex border-b border-stone-200 gap-6 overflow-x-auto no-scrollbar">
            {[
              { id: 'description', label: isDiwaliCombo ? "What's in the Box & Schedule" : 'Detailed Description' },
              { id: 'ingredients', label: isDiwaliCombo ? 'Ingredients & Pure Desi Ghee' : 'Ingredients & Nutrition' },
              { id: 'storage', label: isDiwaliCombo ? 'Freshness & Shelf Life Guide' : 'Storage & Shelf Life' },
              { id: 'reviews', label: `Customer Reviews (${product.rating ? product.rating.toFixed(1) : '5.0'}★)` }
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
                <DiwaliComboShowcase comboImages={product.comboImages} />
              ) : (
                <div className="space-y-4 text-xs sm:text-sm text-stone-700 leading-relaxed">
                  <div className="space-y-2">
                    {product.description?.replace(/<br\s*\/?>/gi, '\n').split('\n').filter(Boolean).map((pLine, idx) => (
                      <p key={idx} className="leading-relaxed">{pLine}</p>
                    ))}
                  </div>
                  {product.category?.includes('banana') && (
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
                  )}
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
                  <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200">
                    <h4 className="font-bold text-stone-900 mb-2">Quality & Purity Commitment:</h4>
                    <ul className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs text-stone-600 font-semibold">
                      <li className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> 100% Pure Vegetarian</li>
                      <li className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> No Chemical Preservatives</li>
                      <li className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Pure Cow Ghee in Sweets</li>
                    </ul>
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
                        <span><strong>Diwali Farsan (Chakli, Chivda, Shankarpale, Bhakarwadi):</strong> 60 Days shelf life. Store in dry, airtight steel tins or containers away from humidity to maintain maximum crunch.</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span><strong>Ladoos (Besan & Motichoor Ladoo):</strong> 30 Days shelf life in a cool, shaded pantry.</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span><strong>Syrup Sweets (Gulab Jamun & Rasgulla):</strong> Best consumed within 10-15 days. Refrigerate once opened.</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span><strong>Lakshmi Puja & Firecrackers Kit:</strong> Keep in a dry area away from direct moisture, sunlight or flame sources until Diwali evening.</span>
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
              <ProductReviewsSection
                product={product}
                onReviewSubmitted={() => {
                  fetchProduct();
                }}
              />
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

            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
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

export default ProductDetailPage;
