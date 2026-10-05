'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SEO } from '@/components/seo/SEO';
import { Container } from '@/components/ui/Container';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { useCart } from '@/context/CartContext';
import Script from 'next/script';
import { INDIAN_STATES_AND_CITIES, ALL_STATES } from '@/data/indianStatesAndCities';
import {
  ShieldCheck,
  Truck,
  CheckCircle2,
  Lock,
  ArrowLeft,
  ShoppingBag,
  CreditCard,
  Banknote,
  AlertCircle,
  HelpCircle,
  Clock,
  Sparkles
} from 'lucide-react';
import { AddressAutocompleteInput } from '@/components/common/AddressAutocompleteInput';

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, subtotal, clearCart, removeFromCart } = useCart();

  // Customer Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [landmark, setLandmark] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'ONLINE'>('COD');
  const [notes, setNotes] = useState('');

  // Cities dynamic dropdown selection
  const [customCities, setCustomCities] = useState<string[]>([]);
  const activeStateCities = INDIAN_STATES_AND_CITIES[state] || [];
  const finalCityList = Array.from(new Set([...activeStateCities, ...customCities])).sort();

  // UI status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const shippingFee = subtotal >= 499 || subtotal === 0 ? 0 : 40;
  const estimatedTotal = subtotal + shippingFee;

  // Dynamically validate cart items against the actual store catalog on mount
  useEffect(() => {
    const validateCartItems = async () => {
      try {
        const res = await fetch('/api/products');
        if (!res.ok) return;
        const result = await res.json();
        if (result && result.success && Array.isArray(result.data)) {
          const availableProducts = result.data;
          const availableIds = new Set(availableProducts.map((p: any) => String(p.id)));
          const availableSlugs = new Set(availableProducts.map((p: any) => String(p.slug)));

          const invalidItems = cart.filter(
            (item) => !availableIds.has(String(item.product.id)) && !availableSlugs.has(String(item.product.slug))
          );

          if (invalidItems.length > 0) {
            invalidItems.forEach((item) => {
              removeFromCart(item.product.id, item.selectedVariant?.id);
            });
            setFormError(
              `Notice: Stale items in your cart (${invalidItems.map((i) => i.product.name).join(', ')}) are no longer active in our store catalog and have been cleared.`
            );
          }
        }
      } catch (err) {
        console.warn('Cart items validation failed:', err);
      }
    };

    if (cart.length > 0) {
      validateCartItems();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Dynamic Pincode Lookup for City and State
  useEffect(() => {
    if (pincode.length === 6) {
      const fetchPincodeDetails = async () => {
        try {
          const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
          if (!res.ok) return;
          const data = await res.json();
          if (data && data[0] && data[0].Status === 'Success') {
            const postOffices = data[0].PostOffice;
            if (postOffices && postOffices.length > 0) {
              const po = postOffices[0];
              const fetchedState = po.State;
              const fetchedCity = po.District || po.Division || po.Circle;

              if (fetchedState) {
                const matchedState = ALL_STATES.find(s => s.toLowerCase() === fetchedState.toLowerCase()) || fetchedState;
                setState(matchedState);

                if (fetchedCity) {
                  const stateCities = INDIAN_STATES_AND_CITIES[matchedState] || [];
                  const matchedCity = stateCities.find(c => c.toLowerCase() === fetchedCity.toLowerCase()) || fetchedCity;

                  if (!stateCities.includes(matchedCity)) {
                    setCustomCities(prev => {
                      if (prev.includes(matchedCity)) return prev;
                      return [...prev, matchedCity];
                    });
                  }
                  setCity(matchedCity);
                }
              }
            }
          }
        } catch (err) {
          console.warn('Pincode fetch failed:', err);
        }
      };

      fetchPincodeDetails();
    }
  }, [pincode]);

  if (cart.length === 0) {
    return (
      <div className="py-20 bg-[#FAF6ED] min-h-screen text-center">
        <SEO title="Checkout | Aapla Jalgaonwala" description="Complete your order." />
        <Container>
          <div className="max-w-md mx-auto bg-white p-8 rounded-3xl shadow-xs border border-stone-200/80">
            <h2 className="text-xl font-bold text-stone-900 mb-2">Your Cart is Empty</h2>
            <p className="text-xs text-stone-500 mb-6">Please add items to your cart before proceeding to checkout.</p>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#9B111E] text-white font-bold text-xs"
            >
              <span>Return to Shop</span>
            </Link>
          </div>
        </Container>
      </div>
    );
  }

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Frontend Validations
    if (!fullName.trim() || !email.trim() || !phone.trim()) {
      setFormError('Please fill in your complete name, email address, and mobile number.');
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setFormError('Please enter a valid 10-digit Indian mobile number (e.g. 9876543210).');
      return;
    }

    if (!addressLine1.trim() || !city.trim() || !state.trim() || !pincode.trim()) {
      setFormError('Please provide your complete delivery address, city, state and PIN code.');
      return;
    }

    if (!/^\d{6}$/.test(pincode.trim())) {
      setFormError('Please enter a valid 6-digit PIN code (e.g. 425001).');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Prepare general order payload
      const orderPayload = {
        customer: {
          name: fullName.trim(),
          email: email.trim(),
          phone: cleanPhone
        },
        shippingAddress: {
          fullName: fullName.trim(),
          phone: cleanPhone,
          email: email.trim(),
          addressLine1: addressLine1.trim(),
          addressLine2: addressLine2.trim() || undefined,
          city: city.trim(),
          state: state.trim(),
          pincode: pincode.trim(),
          landmark: landmark.trim() || undefined
        },
        items: cart.map(item => ({
          productId: item.product.id,
          productName: item.product.name,
          quantity: item.quantity,
          variantInfo: item.selectedVariant ? item.selectedVariant.weight : item.product.netQuantity
        })),
        paymentMethod: paymentMethod === 'COD' ? 'COD' : 'Razorpay',
        notes: notes.trim() || undefined
      };

      // 2. Post Order to Backend (Status set as Pending)
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });

      const orderResult = await response.json();

      if (!orderResult.success || !orderResult.data) {
        throw new Error(orderResult.error?.message || 'Failed to initialize order.');
      }

      const dbOrder = orderResult.data;

      // 3. Handle Cash on Delivery Flow
      if (paymentMethod === 'COD') {
        clearCart();
        router.push(`/order/${dbOrder.id}?status=success`);
        return;
      }

      // 4. Handle Online Payment (Razorpay) Flow
      const payResponse = await fetch('/api/payment/razorpay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: estimatedTotal,
          receipt: dbOrder.orderNumber
        })
      });

      const payResult = await payResponse.json();
      if (!payResult.success || !payResult.data) {
        throw new Error(payResult.error?.message || 'Failed to initialize payment gateway.');
      }

      const razorpayOrder = payResult.data;

      // Ensure Razorpay SDK is available
      if (typeof window === 'undefined' || !(window as any).Razorpay) {
        throw new Error('Razorpay payment gateway is loading. Please try placing your order again in a few seconds.');
      }

      const options = {
        key: razorpayOrder.key,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: 'Aapla Jalgaonwala',
        description: `Order ${dbOrder.orderNumber}`,
        image: '/favicon.ico',
        order_id: razorpayOrder.id,
        handler: async function (response: any) {
          try {
            setIsSubmitting(true);
            const verifyRes = await fetch('/api/payment/razorpay/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                orderId: dbOrder.id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                isSimulation: razorpayOrder.isSimulation
              })
            });

            const verifyResult = await verifyRes.json();
            if (verifyResult.success) {
              clearCart();
              router.push(`/order/${dbOrder.id}?payment=success`);
            } else {
              setFormError('Payment verification failed. Please contact our support team.');
              setIsSubmitting(false);
            }
          } catch (verifyErr) {
            console.error('Payment verification request failed:', verifyErr);
            setFormError('Signature verification failed. Please contact support.');
            setIsSubmitting(false);
          }
        },
        prefill: {
          name: fullName,
          email: email,
          contact: phone
        },
        theme: {
          color: '#9B111E'
        },
        modal: {
          ondismiss: function () {
            setIsSubmitting(false);
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();

    } catch (err: any) {
      console.error('Checkout failed:', err);
      setFormError(err.message || 'An error occurred while processing checkout. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="py-8 md:py-16 bg-[#FAF6ED] min-h-screen">
      <SEO title="Secure Checkout | Aapla Jalgaonwala" description="Enter delivery address and payment option to complete your Jalgaon snacks order." />
      
      {/* Dynamic Razorpay Script Loading */}
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      <Container>
        <div className="mb-6">
          <Link href="/cart" className="inline-flex items-center gap-2 text-xs font-bold text-stone-600 hover:text-[#9B111E]">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Cart</span>
          </Link>
        </div>

        <SectionHeading
          eyebrow="Express Checkout"
          title="Complete Your Order"
          subtitle="Delivered fresh & crunchy from Jalgaon, Maharashtra."
        />

        {formError && (
          <div className="p-4 mb-6 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-700 text-xs font-semibold">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
            <span>{formError}</span>
          </div>
        )}

        {isSubmitting && (
          <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs z-50 flex flex-col items-center justify-center text-white gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
            <p className="font-extrabold text-sm tracking-wider">SECURE TRANSACTION IN PROGRESS...</p>
            <p className="text-xs text-stone-300">Please do not refresh the page or click back.</p>
          </div>
        )}

        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Shipping & Payment Details Column (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Contact Details Card */}
            <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <h3 className="font-black text-base text-stone-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#9B111E]/10 text-[#9B111E] flex items-center justify-center text-xs font-black">1</span>
                  Contact Information
                </h3>
                <span className="text-[10px] bg-[#9B111E]/10 text-[#9B111E] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Required</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-stone-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Rahul Patil"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#D9531E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Mobile Number *</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-xs font-bold text-stone-400">+91</span>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="9876543210"
                      className="w-full pl-12 pr-3.5 py-2.5 rounded-xl border border-stone-300 text-xs font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#D9531E]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="rahulpatil@example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#D9531E]"
                  />
                </div>
              </div>
            </div>

            {/* Delivery Address Card */}
            <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <h3 className="font-black text-base text-stone-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#9B111E]/10 text-[#9B111E] flex items-center justify-center text-xs font-black">2</span>
                  Delivery Address
                </h3>
                <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" /> Google Autocomplete
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-stone-700 mb-1">House/Flat No., Building, Society, Street *</label>
                  <AddressAutocompleteInput
                    required
                    value={addressLine1}
                    onChange={(val) => setAddressLine1(val)}
                    onAddressSelect={(addr) => {
                      if (addr.addressLine1) setAddressLine1(addr.addressLine1);
                      if (addr.landmark) setLandmark(addr.landmark);
                      if (addr.pincode) setPincode(addr.pincode);
                      
                      if (addr.state) {
                        const matchedState = ALL_STATES.find(s => s.toLowerCase() === addr.state.toLowerCase()) || addr.state;
                        setState(matchedState);

                        if (addr.city) {
                          const stateCities = INDIAN_STATES_AND_CITIES[matchedState] || [];
                          const matchedCity = stateCities.find(c => c.toLowerCase() === addr.city.toLowerCase()) || addr.city;
                          
                          if (!stateCities.includes(matchedCity)) {
                            setCustomCities(prev => {
                              if (prev.includes(matchedCity)) return prev;
                              return [...prev, matchedCity];
                            });
                          }
                          setCity(matchedCity);
                        }
                      }
                    }}
                    placeholder="Search for your building, society, or street name..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9531E]/30 text-xs font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#D9531E] bg-amber-50/10 placeholder:text-stone-400"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-stone-700 mb-1">Floor, Block or Area Landmark (Optional)</label>
                  <input
                    type="text"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    placeholder="e.g. Near Main Gate, Opp Pharmacy"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#D9531E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">6-Digit PIN Code *</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 425001"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#D9531E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Select State *</label>
                  <select
                    required
                    value={state}
                    onChange={(e) => {
                      const newState = e.target.value;
                      setState(newState);
                      setCustomCities([]);
                      const list = INDIAN_STATES_AND_CITIES[newState] || [];
                      if (list.length > 0) {
                        setCity(list[0]);
                      } else {
                        setCity('');
                      }
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs font-semibold text-stone-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#D9531E]"
                  >
                    <option value="">Select State</option>
                    {ALL_STATES.map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-stone-700 mb-1">Select City / Town *</label>
                  <select
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#e1e3e5] text-xs font-semibold text-stone-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#D9531E]"
                  >
                    <option value="">Select City / Town</option>
                    {finalCityList.map((cty) => (
                      <option key={cty} value={cty}>{cty}</option>
                    ))}
                    {finalCityList.length === 0 && (
                      <option value="">Choose State First</option>
                    )}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Payment & Order Summary Column (5 cols) */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
            {/* Payment Method Card */}
            <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <h3 className="font-black text-base text-stone-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#9B111E]/10 text-[#9B111E] flex items-center justify-center text-xs font-black">3</span>
                  Payment Gateway
                </h3>
                <span className="text-[10px] bg-emerald-100 text-emerald-900 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> 100% Encrypted
                </span>
              </div>

              <div className="space-y-3">
                <label className={`flex items-start gap-3.5 p-4 rounded-2xl border cursor-pointer transition-all ${paymentMethod === 'COD' ? 'border-[#9B111E] bg-amber-50/40 ring-2 ring-[#9B111E]/10' : 'border-stone-200 hover:bg-stone-50'}`}>
                  <input
                    type="radio"
                    name="payment"
                    value="COD"
                    checked={paymentMethod === 'COD'}
                    onChange={() => setPaymentMethod('COD')}
                    className="accent-[#9B111E] mt-1"
                  />
                  <Banknote className="w-5 h-5 text-[#D9531E] shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <span className="block font-bold text-xs text-stone-900">Cash on Delivery (COD)</span>
                    <span className="block text-[11px] text-stone-500 mt-0.5">Pay with cash upon package receipt (₹40 extra fee for orders below ₹499).</span>
                  </div>
                </label>

                <label className={`flex items-start gap-3.5 p-4 rounded-2xl border cursor-pointer transition-all ${paymentMethod === 'ONLINE' ? 'border-[#9B111E] bg-amber-50/40 ring-2 ring-[#9B111E]/10' : 'border-stone-200 hover:bg-stone-50'}`}>
                  <input
                    type="radio"
                    name="payment"
                    value="ONLINE"
                    checked={paymentMethod === 'ONLINE'}
                    onChange={() => setPaymentMethod('ONLINE')}
                    className="accent-[#9B111E] mt-1"
                  />
                  <CreditCard className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <span className="block font-bold text-xs text-stone-900 flex items-center gap-2">
                      Online Payment (Razorpay Gateway)
                      <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full font-extrabold uppercase">Free Delivery on ₹499+</span>
                    </span>
                    <span className="block text-[11px] text-stone-500 mt-0.5">Pay seamlessly with UPI, Card, Netbanking, or Wallet. Securely verified by Razorpay.</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Order Summary Sidebar */}
            <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-xs space-y-6">
              <h3 className="font-black text-base text-stone-900 pb-3 border-b border-stone-100 flex items-center justify-between">
                <span>Order Summary</span>
                <span className="text-xs bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full font-bold">{cart.length} items</span>
              </h3>

            {/* Cart Items List */}
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {cart.map((item) => {
                const itemPrice = item.selectedVariant ? item.selectedVariant.price : item.product.price;
                return (
                  <div key={item.product.id} className="flex items-center justify-between gap-3 p-2.5 rounded-2xl bg-stone-50/80 border border-stone-100 hover:border-amber-200 transition-colors">
                    <Link href={`/product/${item.product.slug}`} className="flex items-center gap-3 group flex-1 min-w-0">
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-amber-100 shrink-0 border border-stone-200 group-hover:opacity-90 transition-opacity">
                        <Image src={item.product.images[0]?.url || 'https://picsum.photos/seed/jalgaon/200/200'} alt={item.product.name} fill className="object-cover" referrerPolicy="no-referrer" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs text-stone-900 line-clamp-1 group-hover:text-[#9B111E] transition-colors">{item.product.name}</h4>
                        <p className="text-[10px] text-stone-500 font-medium">Qty: {item.quantity} • {item.selectedVariant ? item.selectedVariant.weight : item.product.netQuantity}</p>
                      </div>
                    </Link>
                    <span className="font-extrabold text-xs text-[#9B111E] shrink-0">₹{itemPrice * item.quantity}</span>
                  </div>
                );
              })}
            </div>

            {/* Total Summary */}
            <div className="space-y-2.5 pt-4 border-t border-stone-100 text-xs font-semibold text-stone-600">
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span className="font-bold text-stone-900">₹{subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Charge</span>
                {shippingFee === 0 ? (
                  <span className="font-bold text-emerald-700 uppercase tracking-wide flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5" /> FREE
                  </span>
                ) : (
                  <span className="font-bold text-stone-900">₹{shippingFee}</span>
                )}
              </div>
              <div className="pt-4 border-t border-stone-200 flex justify-between items-baseline text-sm font-black text-stone-900">
                <span className="text-stone-900">Total Amount</span>
                <span className="text-2xl text-[#9B111E]">₹{estimatedTotal}</span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 rounded-2xl bg-[#9B111E] hover:bg-[#800A14] text-white font-black text-xs text-center flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50"
            >
              <Lock className="w-4 h-4 text-amber-300 shrink-0" />
              <span>{isSubmitting ? 'SECURELY PROCESSING...' : `PLACE SECURE ORDER (₹${estimatedTotal})`}</span>
            </button>

            {/* Extra Trust Badges */}
            <div className="space-y-2.5 pt-2">
              <div className="p-3 bg-amber-50/80 rounded-2xl border border-amber-200 text-center">
                <p className="text-[11px] font-black text-amber-900">Freshness & Crunch Guarantee</p>
                <p className="text-[10px] text-stone-600 mt-0.5">Dispatched directly from Dehu/Jalgaon Depot in premium air-tight bags.</p>
              </div>

              <div className="flex items-center justify-center gap-4 text-[10px] font-bold text-stone-500 py-1">
                <span className="flex items-center gap-1"><ShieldCheck className="w-4 h-4 text-emerald-600" /> Secure Gateway</span>
                <span>•</span>
                <span className="flex items-center gap-1"><Clock className="w-4 h-4 text-amber-600" /> Dispatch in 24 Hours</span>
              </div>
            </div>
          </div>
          </div>
        </form>
      </Container>
    </div>
  );
}

