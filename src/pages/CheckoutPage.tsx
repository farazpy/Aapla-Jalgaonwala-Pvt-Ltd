'use client';

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { SEO } from '@/components/seo/SEO';
import { Container } from '@/components/ui/Container';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Image } from '@/components/ui/Image';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
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
  Sparkles,
  User as UserIcon,
  MapPin,
  Plus,
  Minus,
  Trash2,
  Heart,
  Shuffle,
  X
} from 'lucide-react';
import { AddressAutocompleteInput } from '@/components/common/AddressAutocompleteInput';
import { getReferralCookie, setReferralCookie, clearReferralCookie } from '@/utils/referralCookie';
import { Analytics } from '@/services/analyticsTracker';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const {
    cart,
    isLoaded,
    totalItems,
    subtotal,
    clearCart,
    removeFromCart,
    updateQuantity,
    appliedCoupon,
    applyCouponCode,
    removeAppliedCoupon,
    discountAmount,
    shippingFee,
    finalTotal
  } = useCart();
  const { user, isAuthenticated, openAuthModal, addresses, saveAddress, setSession } = useAuth();

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
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [saveAddressToAccount, setSaveAddressToAccount] = useState(false);

  // Site settings for COD Advance Fee and Payment Gateways
  const { settings: globalSettings, refreshSettings } = useSettings();
  const [siteSettings, setSiteSettings] = useState<any>(globalSettings || null);

  // Cities dynamic dropdown selection
  const [customCities, setCustomCities] = useState<string[]>([]);
  const activeStateCities = INDIAN_STATES_AND_CITIES[state] || [];
  const finalCityList = Array.from(new Set([...activeStateCities, ...customCities])).sort();

  // UI status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Partner Referral Code & 4% Discount State
  const [referralPartnerCode, setReferralPartnerCode] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const cookieRef = getReferralCookie();
      return cookieRef?.code || localStorage.getItem('ajw_referral_partner') || '';
    }
    return '';
  });
  const [partnerDiscountInfo, setPartnerDiscountInfo] = useState<{ partnerName?: string; valid?: boolean } | null>(() => {
    if (typeof window !== 'undefined') {
      const cookieRef = getReferralCookie();
      if (cookieRef?.partnerName) {
        return { partnerName: cookieRef.partnerName, valid: true };
      }
    }
    return null;
  });
  const [manualCodeInput, setManualCodeInput] = useState('');
  const [codeCheckLoading, setCodeCheckLoading] = useState(false);
  const [codeMessage, setCodeMessage] = useState<string | null>(null);
  const [randomAssignLoading, setRandomAssignLoading] = useState(false);
  const [userRemovedCoupon, setUserRemovedCoupon] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('ajw_coupon_removed') === 'true';
    }
    return false;
  });

  useEffect(() => {
    if (finalTotal > 0 || totalItems > 0) {
      Analytics.trackInitiateCheckout(finalTotal, totalItems);
    }
    if (typeof window !== 'undefined' && !(window as any).Razorpay) {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  // Fetch real-time settings on mount with cache: 'no-store'
  useEffect(() => {
    refreshSettings();
    fetch(`/api/settings?t=${Date.now()}`, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' }
    })
      .then((r) => r.json())
      .then((j) => {
        if (j.success && j.data) {
          setSiteSettings(j.data);
          if (j.data.enableCod === false) {
            setPaymentMethod('ONLINE');
          }
        }
      })
      .catch((err) => console.warn('Failed to fetch settings in checkout:', err));
  }, [refreshSettings]);

  // Sync when global settings update
  useEffect(() => {
    if (globalSettings) {
      setSiteSettings(globalSettings);
      if (globalSettings.enableCod === false) {
        setPaymentMethod('ONLINE');
      }
    }
  }, [globalSettings]);

  // Auto-fill from user account on load / auth change
  useEffect(() => {
    if (user) {
      if (!fullName && user.name) setFullName(user.name);
      if (!email && user.email) setEmail(user.email);
      if (!phone) {
        if (user.phone) {
          setPhone(user.phone.replace(/\D/g, '').slice(-10));
        } else if (addresses && addresses.length > 0) {
          const addrWithPhone = addresses.find(a => a.phone) || addresses[0];
          if (addrWithPhone?.phone) {
            setPhone(addrWithPhone.phone.replace(/\D/g, '').slice(-10));
          }
        }
      }
    }
  }, [user, addresses]);

  // If user has saved addresses, prefill default or first address
  useEffect(() => {
    if (addresses && addresses.length > 0 && !addressLine1) {
      const def = addresses.find(a => a.isDefault) || addresses[0];
      if (def) {
        setSelectedAddressId(def.id);
        if (!fullName) setFullName(def.name || (user?.name || ''));
        if (!phone && def.phone) setPhone(def.phone.replace(/\D/g, '').slice(-10));
        setAddressLine1(def.addressLine1);
        setAddressLine2(def.addressLine2 || '');
        setLandmark(def.landmark || '');
        setCity(def.city);
        setState(def.state);
        setPincode(def.pincode);
      }
    }
  }, [addresses, user]);

  const handleSelectSavedAddress = (addrId: string) => {
    setSelectedAddressId(addrId);
    const selected = addresses.find(a => a.id === addrId);
    if (selected) {
      setFullName(selected.name || (user?.name || ''));
      if (selected.phone) setPhone(selected.phone.replace(/\D/g, '').slice(-10));
      setAddressLine1(selected.addressLine1);
      setAddressLine2(selected.addressLine2 || '');
      setLandmark(selected.landmark || '');
      setCity(selected.city);
      setState(selected.state);
      setPincode(selected.pincode);
    }
  };

  // Automatically assign a random woman partner coupon without button click!
  useEffect(() => {
    if (subtotal > 0 && !appliedCoupon && !userRemovedCoupon && !randomAssignLoading && !manualCodeInput) {
      let isCancelled = false;

      const autoAssign = async () => {
        try {
          const currentCode = referralPartnerCode || '';
          const url = currentCode
            ? `/api/partner-program/random-partner?exclude=${encodeURIComponent(currentCode)}`
            : '/api/partner-program/random-partner';
          const res = await fetch(url);
          const json = await res.json();
          if (!isCancelled && json.success && json.data) {
            const partner = json.data;
            const applyRes = await applyCouponCode(partner.partnerCode);
            if (!isCancelled && applyRes.success) {
              setReferralPartnerCode(partner.partnerCode);
              setPartnerDiscountInfo({ partnerName: partner.fullName, valid: true });
              setReferralCookie(partner.partnerCode, partner.fullName);
            }
          }
        } catch (err) {
          console.warn('Auto-assigning woman partner error:', err);
        }
      };

      autoAssign();

      return () => {
        isCancelled = true;
      };
    }
  }, [subtotal, appliedCoupon, userRemovedCoupon, referralPartnerCode]);

  useEffect(() => {
    if (referralPartnerCode) {
      fetch(`/api/partner-program/verify/${encodeURIComponent(referralPartnerCode)}`)
        .then(r => r.json())
        .then(j => {
          if (j.success && j.data?.valid) {
            setPartnerDiscountInfo({ partnerName: j.data.partnerName, valid: true });
          } else {
            setPartnerDiscountInfo(null);
          }
        })
        .catch(() => setPartnerDiscountInfo(null));
    }
  }, [referralPartnerCode]);

  const handleApplyPartnerCode = async () => {
    if (!manualCodeInput.trim()) return;
    setCodeCheckLoading(true);
    setCodeMessage(null);

    // Reset removed state on user-initiated manual code apply
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('ajw_coupon_removed');
    }
    setUserRemovedCoupon(false);

    const res = await applyCouponCode(manualCodeInput);
    setCodeCheckLoading(false);

    if (res.success) {
      if (res.coupon?.isPartnerCode) {
        setReferralPartnerCode(res.coupon.code);
        setPartnerDiscountInfo({ partnerName: res.coupon.partnerName, valid: true });
        setCodeMessage(res.message || `Discount from ${res.coupon.partnerName || 'Woman Partner'} applied!`);
      } else {
        setCodeMessage(res.message || `Code "${manualCodeInput.trim().toUpperCase()}" applied successfully!`);
      }
      setManualCodeInput('');
    } else {
      setCodeMessage(res.message || 'Invalid coupon or promo code.');
    }
  };

  const handleRandomAssignWomanPartner = async (excludeCurrent = true) => {
    setRandomAssignLoading(true);
    setCodeMessage(null);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('ajw_coupon_removed');
    }
    setUserRemovedCoupon(false);

    try {
      const currentCode = appliedCoupon?.isPartnerCode ? appliedCoupon.code : (referralPartnerCode || '');
      const url = excludeCurrent && currentCode
        ? `/api/partner-program/random-partner?exclude=${encodeURIComponent(currentCode)}`
        : '/api/partner-program/random-partner';

      const res = await fetch(url);
      const json = await res.json();

      if (json.success && json.data) {
        const partner = json.data;
        const applyRes = await applyCouponCode(partner.partnerCode);
        if (applyRes.success) {
          setReferralPartnerCode(partner.partnerCode);
          setPartnerDiscountInfo({ partnerName: partner.fullName, valid: true });
          setReferralCookie(partner.partnerCode, partner.fullName);
          setCodeMessage(`Discount from ${partner.fullName} applied! Saved ₹${applyRes.coupon?.discountAmount || Math.round(subtotal * 0.04)}`);
        } else {
          setCodeMessage(applyRes.message || 'Failed to apply woman partner code.');
        }
      } else {
        setCodeMessage(json.error?.message || json.message || 'No active women partners available right now.');
      }
    } catch (err: any) {
      console.error('Error assigning random partner:', err);
      setCodeMessage('Failed to randomly assign a woman partner code.');
    } finally {
      setRandomAssignLoading(false);
    }
  };

  const handleRemovePartnerCode = () => {
    removeAppliedCoupon();
    setReferralPartnerCode('');
    setPartnerDiscountInfo(null);
    clearReferralCookie();
    localStorage.removeItem('ajw_referral_partner');
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('ajw_coupon_removed', 'true');
    }
    setUserRemovedCoupon(true);
    setCodeMessage('Coupon removed.');
  };

  const estimatedTotal = finalTotal;

  const effectiveSettings = siteSettings || globalSettings;
  const isCodEnabled = effectiveSettings ? effectiveSettings.enableCod !== false : true;
  const isCodAdvanceEnabled = Boolean(
    isCodEnabled &&
    effectiveSettings?.codAdvanceFeeEnabled === true &&
    Number(effectiveSettings?.codAdvanceFeeAmount || 0) > 0
  );
  const codFeeAmountSetting = Number(effectiveSettings?.codAdvanceFeeAmount || 50);
  const codFeeTypeSetting = effectiveSettings?.codAdvanceFeeType || 'fixed';

  // Fallback check: If COD is disabled, ensure paymentMethod is ONLINE
  useEffect(() => {
    if (!isCodEnabled && paymentMethod === 'COD') {
      setPaymentMethod('ONLINE');
    }
  }, [isCodEnabled, paymentMethod]);

  let codAdvanceFee = 0;
  let codRemainingBalance = estimatedTotal;

  if (isCodEnabled && paymentMethod === 'COD' && isCodAdvanceEnabled) {
    if (codFeeTypeSetting === 'percentage') {
      codAdvanceFee = Math.round((estimatedTotal * codFeeAmountSetting) / 100);
    } else {
      codAdvanceFee = Math.min(codFeeAmountSetting, estimatedTotal);
    }
    codRemainingBalance = Math.max(0, estimatedTotal - codAdvanceFee);
  }

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

  if (isLoaded && cart.length === 0) {
    return (
      <div className="py-20 bg-[#FAF6ED] min-h-screen text-center">
        <SEO title="Checkout | Aapla Jalgaonwala" description="Complete your order." />
        <Container>
          <div className="max-w-md mx-auto bg-white p-8 rounded-3xl shadow-xs border border-stone-200/80">
            <h2 className="text-xl font-bold text-stone-900 mb-2">Your Cart is Empty</h2>
            <p className="text-xs text-stone-500 mb-6">Please add items to your cart before proceeding to checkout.</p>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#9B111E] text-white font-bold text-xs"
            >
              <span>Return to Shop</span>
            </Link>
          </div>
        </Container>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="py-20 bg-[#FAF6ED] min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#9B111E] border-t-transparent rounded-full animate-spin" />
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

    if (paymentMethod === 'COD' && !isCodEnabled) {
      setFormError('Cash on Delivery is currently disabled. Please proceed with Razorpay Online Payment.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Prepare general order payload
      const orderPayload = {
        customer: {
          id: user?.id || undefined,
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
          price: item.selectedVariant ? item.selectedVariant.price : item.product.price,
          variantInfo: item.selectedVariant ? item.selectedVariant.weight : item.product.netQuantity,
          image: item.product.images[0]?.url || undefined
        })),
        paymentMethod: paymentMethod === 'COD' ? 'COD' : 'Razorpay',
        subtotal: subtotal,
        discount: discountAmount || 0,
        discountAmount: discountAmount || 0,
        shippingFee: shippingFee,
        totalAmount: estimatedTotal,
        codAdvanceFeePaid: 0,
        codRemainingBalance: paymentMethod === 'COD' ? (codAdvanceFee > 0 ? codRemainingBalance : estimatedTotal) : 0,
        couponCode: appliedCoupon?.code || undefined,
        referralPartnerCode: (appliedCoupon?.isPartnerCode ? appliedCoupon.code : referralPartnerCode) || undefined,
        notes: (appliedCoupon?.isPartnerCode && (appliedCoupon.partnerName || partnerDiscountInfo?.partnerName))
          ? `Discount from ${appliedCoupon.partnerName || partnerDiscountInfo?.partnerName} (${appliedCoupon.code})${notes.trim() ? ` | ${notes.trim()}` : ''}`
          : (notes.trim() || undefined)
      };

      // If user is authenticated and checked 'save address to account', persist address in background
      if (isAuthenticated && saveAddressToAccount && !selectedAddressId) {
        saveAddress({
          name: fullName.trim(),
          phone: cleanPhone,
          email: email.trim(),
          addressLine1: addressLine1.trim(),
          addressLine2: addressLine2.trim() || undefined,
          landmark: landmark.trim() || undefined,
          city: city.trim(),
          state: state.trim(),
          pincode: pincode.trim(),
          isDefault: addresses.length === 0
        }).catch(err => console.warn('Could not auto-save address:', err));
      }

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

      // Auto-login user if account was created/linked and token returned
      if (dbOrder.authUser && dbOrder.authToken) {
        setSession(dbOrder.authUser, dbOrder.authToken);
      }

      // 3. Handle Cash on Delivery Flow without Advance Fee
      if (paymentMethod === 'COD' && codAdvanceFee === 0) {
        Analytics.trackPurchaseComplete({
          orderId: dbOrder.id,
          totalAmount: estimatedTotal,
          paymentMethod: 'COD',
          itemsCount: totalItems,
          referralCode: referralPartnerCode || undefined
        });
        clearCart();
        navigate(`/order/${dbOrder.id}?status=success`);
        return;
      }

      // 4. Handle Razorpay Gateway Flow (either Full Payment or COD Advance Fee)
      const targetChargeAmount = paymentMethod === 'COD' ? codAdvanceFee : estimatedTotal;
      const isCodAdvanceCharge = paymentMethod === 'COD' && codAdvanceFee > 0;

      const payResponse = await fetch('/api/payment/razorpay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: targetChargeAmount,
          receipt: dbOrder.orderNumber,
          notes: {
            orderId: dbOrder.id,
            isCodAdvance: isCodAdvanceCharge ? 'true' : 'false',
            advanceFee: codAdvanceFee,
            remainingBalance: codRemainingBalance
          }
        })
      });

      const payResult = await payResponse.json();
      if (!payResult.success || !payResult.data) {
        throw new Error(payResult.error?.message || 'Failed to initialize payment gateway.');
      }

      const razorpayOrder = payResult.data;

      // Ensure Razorpay SDK is available
      if (typeof window === 'undefined' || !(window as any).Razorpay) {
        throw new Error('Razorpay payment gateway script is still loading. Please try placing your order again in a moment.');
      }

      const options = {
        key: razorpayOrder.key,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: 'Aapla Jalgaonwala',
        description: isCodAdvanceCharge
          ? `COD Advance Deposit for Order ${dbOrder.orderNumber}`
          : `Full Payment for Order ${dbOrder.orderNumber}`,
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
                isCodAdvance: isCodAdvanceCharge,
                advanceFeePaid: codAdvanceFee,
                remainingBalance: codRemainingBalance
              })
            });

            const verifyResult = await verifyRes.json();
            if (verifyResult.success) {
              Analytics.trackPurchaseComplete({
                orderId: dbOrder.id,
                totalAmount: estimatedTotal,
                paymentMethod: isCodAdvanceCharge ? 'COD_ADVANCE' : 'ONLINE_RAZORPAY',
                itemsCount: totalItems,
                referralCode: referralPartnerCode || undefined
              });
              clearCart();
              navigate(`/order/${dbOrder.id}?${isCodAdvanceCharge ? 'status=success&codAdvance=true' : 'payment=success'}`);
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
          ondismiss: async function () {
            setIsSubmitting(false);
            setFormError('Payment was cancelled or closed before completion. Your order was not placed.');
            try {
              await fetch(`/api/orders/${dbOrder.id}/cancel-payment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason: 'Razorpay payment modal closed by customer' })
              });
            } catch (cancelErr) {
              console.warn('[Checkout] Failed to report payment cancellation:', cancelErr);
            }
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);

      rzp.on('payment.failed', async function (failedResponse: any) {
        setIsSubmitting(false);
        const failReason = failedResponse?.error?.description || 'Payment transaction failed or declined';
        setFormError(`Payment failed: ${failReason}. Your order was not placed.`);
        try {
          await fetch(`/api/orders/${dbOrder.id}/cancel-payment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason: `Razorpay payment failed: ${failReason}` })
          });
        } catch (cancelErr) {
          console.warn('[Checkout] Failed to report payment failure:', cancelErr);
        }
      });

      rzp.open();

    } catch (err: any) {
      console.error('Checkout failed:', err);
      setFormError(err.message || 'An error occurred while processing checkout. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="py-8 md:py-16 bg-[#FAFAF8] min-h-screen">
      <SEO title="Secure Checkout | Aapla Jalgaonwala" description="Enter delivery address and payment option to complete your Jalgaon snacks order." />

      <Container>
        <div className="mb-6">
          <Link to="/cart" className="inline-flex items-center gap-2 text-xs font-bold text-stone-600 hover:text-[#9B111E]">
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
            {/* Quick Login Callout for Unauthenticated Guests */}
            {!isAuthenticated && (
              <div className="bg-gradient-to-r from-amber-500/10 via-[#D9531E]/10 to-[#9B111E]/10 border border-amber-200/80 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-3 text-center sm:text-left">
                  <div className="w-10 h-10 rounded-full bg-[#9B111E]/10 text-[#9B111E] flex items-center justify-center shrink-0">
                    <UserIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-stone-900">Already have an account?</h4>
                    <p className="text-[11px] text-stone-600">Log in for 1-click address fill, saved preferences & tracking.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => openAuthModal('login')}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#9B111E] text-white text-xs font-bold hover:bg-[#800A14] transition-all shadow-xs shrink-0 cursor-pointer"
                >
                  Login
                </button>
              </div>
            )}

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

              {/* Saved Addresses 1-Click Picker */}
              {addresses && addresses.length > 0 && (
                <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-2">
                  <span className="text-[11px] font-bold text-stone-700 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#9B111E]" />
                    <span>Choose from Saved Addresses:</span>
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {addresses.map((addr) => (
                      <button
                        key={addr.id}
                        type="button"
                        onClick={() => handleSelectSavedAddress(addr.id)}
                        className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                          selectedAddressId === addr.id
                            ? 'border-[#9B111E] bg-white text-stone-900 shadow-2xs ring-1 ring-[#9B111E]/30'
                            : 'border-stone-200 bg-white/70 hover:bg-white text-stone-600'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="font-bold text-stone-900 text-xs">{addr.name}</span>
                          {addr.isDefault && (
                            <span className="text-[9px] font-black uppercase bg-[#9B111E]/10 text-[#9B111E] px-1.5 py-0.2 rounded-md">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="line-clamp-1 text-[11px] text-stone-500">{addr.addressLine1}, {addr.city}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

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
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs font-semibold text-stone-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#D9531E]"
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

                {isAuthenticated && (
                  <div className="sm:col-span-2 pt-1 flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="saveAddressCheckbox"
                      checked={saveAddressToAccount}
                      onChange={(e) => setSaveAddressToAccount(e.target.checked)}
                      className="rounded text-[#9B111E] focus:ring-[#9B111E] cursor-pointer"
                    />
                    <label htmlFor="saveAddressCheckbox" className="text-xs text-stone-700 font-semibold cursor-pointer">
                      Save this address to my account for faster future checkout
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Method Card (Positioned below Delivery Address) */}
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
                {isCodEnabled && (
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
                    <div className="flex-1 space-y-2">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="block font-bold text-xs text-stone-900">Cash on Delivery (COD)</span>
                          {isCodAdvanceEnabled && (
                            <span className="text-[9px] bg-amber-100 text-amber-900 font-extrabold px-2 py-0.5 rounded-full uppercase">
                              Deposit Required
                            </span>
                          )}
                        </div>
                        <span className="block text-[11px] text-stone-500 mt-0.5">
                          {isCodAdvanceEnabled
                            ? `Pay ₹${codAdvanceFee} deposit online via Razorpay, pay remaining ₹${codRemainingBalance} cash on delivery.`
                            : 'Pay with cash upon package receipt.'}
                        </span>
                      </div>

                      {paymentMethod === 'COD' && isCodAdvanceEnabled && (
                        <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/90 text-xs space-y-1.5 shadow-2xs">
                          <div className="flex items-center justify-between text-stone-600 text-[11px] font-medium">
                            <span>Pay Online Now (Advance Deposit):</span>
                            <span className="font-bold text-[#9B111E]">₹{codAdvanceFee}</span>
                          </div>
                          <div className="flex items-center justify-between text-stone-700 text-[11px] font-medium pt-1 border-t border-stone-200/70">
                            <span>Cash Due on Delivery:</span>
                            <span className="font-bold text-stone-900">₹{codRemainingBalance}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </label>
                )}

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
                    <span className="block text-[11px] text-stone-500 mt-0.5">Pay seamlessly with UPI (GPay, PhonePe, Paytm), Cards, Netbanking, or Wallet. Securely verified by Razorpay.</span>
                  </div>
                </label>

                {!isCodEnabled && (
                  <div className="p-3 bg-gradient-to-r from-amber-50/90 via-orange-50/70 to-amber-50/90 rounded-2xl border border-amber-200/80 text-xs text-stone-700 flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-amber-100 text-amber-800 shrink-0">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
                        <span>Direct Razorpay Gateway Active</span>
                        <span className="text-[9px] bg-emerald-100 text-emerald-800 font-extrabold px-1.5 py-0.2 rounded-full uppercase">Instant Confirmation</span>
                      </div>
                      <div className="text-[11px] text-stone-600 mt-0.5">
                        Cash on Delivery is currently disabled. All orders are processed instantly through 100% encrypted bank-grade Razorpay gateway.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Order Summary Column (5 cols) */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
            {/* Order Summary Card */}
            <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-xs space-y-6">
              <h3 className="font-black text-base text-stone-900 pb-3 border-b border-stone-100 flex items-center justify-between">
                <span>Order Summary</span>
                <span className="text-xs bg-stone-100 text-stone-600 px-2.5 py-0.5 rounded-full font-bold">{totalItems || cart.length} items</span>
              </h3>

              {/* Cart Items List with Quantity Adjust & Delete */}
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {cart.map((item) => {
                  const itemPrice = item.selectedVariant ? item.selectedVariant.price : item.product.price;
                  return (
                    <div
                      key={`${item.product.id}-${item.selectedVariant?.id || 'default'}`}
                      className="p-3 rounded-2xl bg-stone-50/90 border border-stone-200/80 hover:border-amber-300/80 transition-all space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <Link
                          href={`/product/${item.product.slug}`}
                          className="flex items-center gap-3 group min-w-0 flex-1"
                        >
                          <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-amber-100 shrink-0 border border-stone-200 group-hover:opacity-90 transition-opacity">
                            <Image
                              src={item.product.images[0]?.url || 'https://picsum.photos/seed/jalgaon/200/200'}
                              alt={item.product.name}
                              fill
                              className="object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-bold text-xs text-stone-900 line-clamp-1 group-hover:text-[#9B111E] transition-colors">
                              {item.product.name}
                            </h4>
                            <p className="text-[10px] text-stone-500 font-medium">
                              {item.selectedVariant ? item.selectedVariant.weight : item.product.netQuantity} • ₹{itemPrice} each
                            </p>
                          </div>
                        </Link>

                        <button
                          type="button"
                          onClick={() => removeFromCart(item.product.id, item.selectedVariant?.id)}
                          className="text-stone-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors shrink-0 cursor-pointer"
                          title="Remove product from order summary"
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between pt-1.5 border-t border-stone-200/60">
                        {/* Quantity Counter */}
                        <div className="flex items-center gap-1 bg-white border border-stone-200 rounded-lg p-0.5 shadow-2xs">
                          <button
                            type="button"
                            onClick={() => {
                              if (item.quantity > 1) {
                                updateQuantity(item.product.id, item.quantity - 1, item.selectedVariant?.id);
                              } else {
                                removeFromCart(item.product.id, item.selectedVariant?.id);
                              }
                            }}
                            className="w-6 h-6 flex items-center justify-center text-stone-600 hover:text-stone-950 hover:bg-stone-100 rounded transition-colors cursor-pointer"
                            title="Decrease quantity"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-bold w-6 text-center text-stone-900 select-none">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.selectedVariant?.id)}
                            className="w-6 h-6 flex items-center justify-center text-stone-600 hover:text-stone-950 hover:bg-stone-100 rounded transition-colors cursor-pointer"
                            title="Increase quantity"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Item Total */}
                        <div className="text-right">
                          <span className="font-extrabold text-xs sm:text-sm text-[#9B111E]">
                            ₹{itemPrice * item.quantity}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

            {/* Promo / Coupon / Partner Code Box */}
            <div className="pt-2">
              {appliedCoupon ? (
                appliedCoupon.isPartnerCode ? (
                  /* Woman Partner Referral Discount Card */
                  <div className="p-3.5 bg-gradient-to-br from-rose-50/90 via-amber-50/70 to-emerald-50/80 rounded-2xl border border-rose-200/90 shadow-2xs space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 text-[#9B111E] text-[10px] font-black tracking-wide uppercase border border-rose-200/80">
                            <Heart className="w-3 h-3 fill-[#9B111E] text-[#9B111E]" />
                            Woman Micro-Entrepreneur
                          </span>
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-full border border-emerald-200">
                            {appliedCoupon.value || 4}% OFF
                          </span>
                        </div>

                        {/* Showcasing 'Discount from {woman_name}' */}
                        <h4 className="text-sm font-black text-stone-900 mt-1.5 flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                          <span>Discount from {appliedCoupon.partnerName || partnerDiscountInfo?.partnerName || 'Woman Partner'}</span>
                        </h4>

                        <p className="text-[11px] text-stone-600 mt-1 leading-snug">
                          Supporting local women micro-entrepreneurs — You saved <strong className="text-emerald-700 font-black">₹{discountAmount}</strong>!
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleRemovePartnerCode}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/95 hover:bg-rose-50 text-rose-700 hover:text-rose-800 text-[11px] font-bold border border-rose-200/90 shadow-2xs hover:shadow-xs transition-all active:scale-95 cursor-pointer shrink-0"
                        title="Remove coupon code"
                      >
                        <X className="w-3 h-3 text-rose-600" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Standard Store Coupon */
                  <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-emerald-600 animate-pulse" />
                        <span>{appliedCoupon.autoApplyTitle || 'Coupon Discount Applied'}</span>
                      </span>
                      <p className="text-xs font-bold text-emerald-900 truncate">
                        Code: <span className="font-mono bg-emerald-200/70 px-1 py-0.5 rounded text-emerald-950">{appliedCoupon.code}</span> — Saved ₹{discountAmount}!
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemovePartnerCode}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white hover:bg-rose-50 text-rose-700 hover:text-rose-800 text-[11px] font-bold border border-rose-200 shadow-2xs hover:shadow-xs transition-all active:scale-95 cursor-pointer shrink-0"
                      title="Remove coupon code"
                    >
                      <X className="w-3 h-3 text-rose-600" />
                      <span>Remove</span>
                    </button>
                  </div>
                )
              ) : (
                /* No coupon applied (e.g. user removed coupon or waiting) */
                <div className="space-y-3">
                  {userRemovedCoupon ? (
                    <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-stone-800">Coupon removed</p>
                        <p className="text-[10.5px] text-stone-600">Want to re-apply the 4% woman partner discount?</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRandomAssignWomanPartner(false)}
                        disabled={randomAssignLoading}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#9B111E] hover:bg-[#800A14] text-white font-bold text-[11px] shrink-0 transition-colors shadow-2xs active:scale-95 cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3 text-amber-300" />
                        <span>{randomAssignLoading ? 'Applying...' : 'Re-apply 4% OFF'}</span>
                      </button>
                    </div>
                  ) : (
                    <div className="p-3 rounded-2xl bg-rose-50/60 border border-rose-100 flex items-center gap-2">
                      <Heart className="w-4 h-4 text-[#9B111E] fill-[#9B111E] shrink-0 animate-pulse" />
                      <span className="text-xs text-stone-700 font-medium">Applying 4% Woman Partner discount...</span>
                    </div>
                  )}

                  {/* Manual coupon code input */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-stone-600">Have a promo or partner code?</span>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="e.g. FREEDOM15 or WBP-PRIYA123"
                        value={manualCodeInput}
                        onChange={(e) => setManualCodeInput(e.target.value.toUpperCase())}
                        className="flex-1 px-3 py-1.5 rounded-xl border border-stone-300 text-xs uppercase font-mono focus:ring-1 focus:ring-[#9B111E] focus:outline-none bg-white"
                      />
                      <button
                        type="button"
                        onClick={handleApplyPartnerCode}
                        disabled={codeCheckLoading || !manualCodeInput.trim()}
                        className="px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs disabled:opacity-40 cursor-pointer"
                      >
                        {codeCheckLoading ? '...' : 'Apply'}
                      </button>
                    </div>
                    {codeMessage && (
                      <p className="text-[10.5px] text-stone-600 font-medium">{codeMessage}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Total Summary */}
            <div className="space-y-2.5 pt-4 border-t border-stone-100 text-xs font-semibold text-stone-600">
              {/* 1. Items Subtotal */}
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span className="font-bold text-stone-900">₹{subtotal}</span>
              </div>

              {/* 2. Delivery Charge */}
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

              {/* 3. Discount */}
              {discountAmount > 0 && (
                <div className="flex justify-between items-center text-emerald-700 font-bold">
                  <span className="flex items-center gap-1 min-w-0 pr-2">
                    <Sparkles className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">
                      {appliedCoupon?.isPartnerCode
                        ? `Discount from ${appliedCoupon.partnerName || partnerDiscountInfo?.partnerName || 'Woman Partner'}`
                        : `Discount Applied (${appliedCoupon?.code})`}
                    </span>
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span>-₹{discountAmount}</span>
                    <button
                      type="button"
                      onClick={handleRemovePartnerCode}
                      className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-800 text-[10px] font-bold border border-rose-200/80 transition-colors shadow-2xs cursor-pointer"
                      title="Remove coupon code"
                    >
                      <X className="w-2.5 h-2.5" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              )}

              {/* 4. Total Order Amount */}
              <div className="pt-3 border-t border-stone-200 flex justify-between items-baseline text-sm font-black text-stone-900">
                <span className="text-stone-900">Total Order Amount</span>
                <span className="text-2xl text-[#9B111E]">₹{estimatedTotal}</span>
              </div>

              {/* COD Advance Breakdown on Order Summary Card (Minimal & Clean) */}
              {paymentMethod === 'COD' && (
                <div className="mt-3 p-3 rounded-xl bg-stone-50 border border-stone-200/90 text-xs space-y-1.5">
                  <div className="flex items-center justify-between text-stone-600 font-medium text-[11.5px]">
                    <span>Pay Online Now (Advance Deposit):</span>
                    <span className="font-bold text-[#9B111E]">₹{codAdvanceFee}</span>
                  </div>
                  <div className="flex items-center justify-between text-stone-800 font-semibold text-[11.5px] pt-1.5 border-t border-stone-200/70">
                    <span>Cash Due on Delivery:</span>
                    <span className="font-bold text-stone-900">₹{codRemainingBalance}</span>
                  </div>
                  <p className="text-[10.5px] text-stone-500 leading-snug pt-0.5">
                    Pay ₹{codAdvanceFee} advance online via UPI/Card to confirm • Balance ₹{codRemainingBalance} cash on delivery.
                  </p>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 rounded-2xl bg-[#9B111E] hover:bg-[#800A14] text-white font-black text-xs text-center flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50 cursor-pointer"
            >
              <Lock className="w-4 h-4 text-amber-300 shrink-0" />
              <span>
                {isSubmitting
                  ? 'SECURELY PROCESSING...'
                  : paymentMethod === 'COD' && codAdvanceFee > 0
                  ? `PAY ₹${codAdvanceFee} ADVANCE DEPOSIT & PLACE COD ORDER`
                  : `PLACE SECURE ORDER (₹${estimatedTotal})`}
              </span>
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

