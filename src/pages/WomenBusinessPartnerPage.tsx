'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { SEO } from '@/components/seo/SEO';
import { Container } from '@/components/ui/Container';
import {
  Sparkles,
  Users,
  Percent,
  Calendar,
  CheckCircle2,
  Share2,
  Copy,
  IndianRupee,
  TrendingUp,
  ShieldCheck,
  Building2,
  Heart,
  Gift,
  PhoneCall,
  Clock,
  ArrowRight,
  Zap,
  Check,
  ExternalLink,
  Lock,
  Instagram,
  Facebook,
  MessageCircle,
  Award,
  Wallet,
  AlertCircle,
  ChevronDown,
  Search,
  Upload,
  FileText,
  Image as ImageIcon,
  Star,
  Download,
  HelpCircle,
  Briefcase,
  ChevronRight,
  RefreshCw,
  QrCode,
  Sliders,
  CheckCheck,
  UserCheck,
  Smartphone
} from 'lucide-react';
import { BusinessPartner, PartnerOrderReferral, PartnerSettlement } from '@/types';
import { useSettings } from '@/context/SettingsContext';
import { getReferralCookie, setReferralCookie } from '@/utils/referralCookie';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false);
    if ((window as any).Razorpay) return resolve(true);
    const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(true));
      existingScript.addEventListener('error', () => resolve(false));
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const INDIAN_BANKS = [
  "State Bank of India (SBI)",
  "HDFC Bank",
  "ICICI Bank",
  "Axis Bank",
  "Kotak Mahindra Bank",
  "Punjab National Bank (PNB)",
  "Bank of Baroda (BoB)",
  "Canara Bank",
  "Union Bank of India",
  "Bank of India (BoI)",
  "Central Bank of India",
  "Indian Bank",
  "Indian Overseas Bank",
  "IDBI Bank",
  "IndusInd Bank",
  "YES Bank",
  "Federal Bank",
  "IDFC FIRST Bank",
  "UCO Bank",
  "Bank of Maharashtra",
  "Punjab & Sind Bank",
  "Bandhan Bank",
  "RBL Bank",
  "South Indian Bank",
  "Jammu & Kashmir Bank",
  "Karur Vysya Bank",
  "Karnataka Bank",
  "City Union Bank",
  "Tamilnad Mercantile Bank",
  "AU Small Finance Bank",
  "Equitas Small Finance Bank",
  "Ujjivan Small Finance Bank",
  "Jana Small Finance Bank",
  "ESAF Small Finance Bank",
  "Suryoday Small Finance Bank",
  "Utkarsh Small Finance Bank",
  "Paytm Payments Bank",
  "Airtel Payments Bank",
  "India Post Payments Bank (IPPB)",
  "Jio Payments Bank",
  "Fino Payments Bank",
  "Saraswat Co-operative Bank",
  "Cosmos Co-operative Bank",
  "SVC Co-operative Bank",
  "Standard Chartered Bank",
  "Citi Bank",
  "HSBC Bank",
  "DBS Bank India",
  "Other Bank / Cooperative Bank / Rural Bank"
];

const SUCCESS_STORIES = [
  {
    name: "Pooja Nitin Shinde",
    location: "Kothrud, Pune",
    role: "Homemaker & Mother of 2",
    monthlyEarnings: "₹38,400",
    quote: "I started by simply posting the Khandeshi banana chips and authentic Goda masala pictures on my WhatsApp status and society group. Within 3 weeks, over 40 families ordered through my link. Sunday bank payout has never missed a single week!",
    ordersReferred: "190+ orders",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80"
  },
  {
    name: "Sunita Ramesh Patil",
    location: "Ramanand Nagar, Jalgaon",
    role: "Teacher & Part-time Entrepreneur",
    monthlyEarnings: "₹46,200",
    quote: "Our Jalgaon taste is famous everywhere in Maharashtra! My college friends in Mumbai and Pune order festive combos using my 4% discount code. Zero tension of packing or couriering—Aapla Jalgaonwala team handles everything directly.",
    ordersReferred: "240+ orders",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80"
  },
  {
    name: "Meena Vikas Kulkarni",
    location: "Gangapur Road, Nashik",
    role: "Home Baker & Community Leader",
    monthlyEarnings: "₹29,800",
    quote: "The 12% commission is totally fair and transparent. The online portal lets me check real-time whenever a friend places an order. It's the most dignified work-from-home business for women.",
    ordersReferred: "135+ orders",
    avatar: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150&auto=format&fit=crop&q=80"
  }
];

const FAQS = [
  {
    q: "What is the one-time registration fee collected for?",
    a: "The one-time registration fee covers your comprehensive starter media kit (HD product images, festive video reels, and promotional banners), legal partner onboarding compliance, and lifetime access to your live Partner Analytics Portal where you can track orders, 12% sales commissions, and Sunday bank payouts in real-time."
  },
  {
    q: "How and when do I receive my commissions?",
    a: "All confirmed and delivered customer orders are calculated automatically at a flat 12% net commission. Payouts are transferred directly to your registered bank account or UPI every single Sunday via IMPS / NEFT with detailed settlement receipts."
  },
  {
    q: "How does the customer receive the 4% discount?",
    a: "When a customer clicks your personal referral link or enters your unique Partner Code during checkout, our store automatically deducts 4% from their order total. This gives your friends and community an irresistible reason to buy through your link."
  },
  {
    q: "Do I need to buy inventory or pack products at home?",
    a: "No! You carry zero product stock, zero capital risk, and zero packaging work. Aapla Jalgaonwala's state-of-the-art hygienic kitchen prepares, packs, and delivers all products directly to your customer's doorstep anywhere in India."
  },
  {
    q: "Where do I get marketing photos, videos, and captions?",
    a: "Immediately upon registration, you gain access to our exclusive Women Partner WhatsApp Group and in-portal Media Center where daily ready-to-post WhatsApp stories, reels, festive posters, and Marathi/English captions are shared for 1-click sharing."
  },
  {
    q: "What documents are required to register?",
    a: "Only your 12-digit Aadhaar Number (for identity verification and partner authorization) along with your Bank Account details (or a photo/PDF of your bank passbook front page) so we can transfer your Sunday payouts."
  }
];

export default function WomenBusinessPartnerPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { settings } = useSettings();

  // If query string contains ?free=1 (e.g. /women-business-partner?free=1), registration fee is ₹1
  const isSpecialPromoFee = searchParams.get('free') === '1';
  const registrationFee = isSpecialPromoFee ? 1 : (settings.womenPartnerFee ?? 699);

  // Calculator State
  const [dailyOrders, setDailyOrders] = useState<number>(6);
  const [averageOrderValue, setAverageOrderValue] = useState<number>(650);

  // Computed Calculator Metrics (12% Partner Commission)
  const dailySales = dailyOrders * averageOrderValue;
  const dailyCommission = Math.round(dailySales * 0.12);
  const weeklyPayout = dailyCommission * 7;
  const monthlyEarnings = dailyCommission * 30;
  const annualEarnings = monthlyEarnings * 12;

  // Registration Form State
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    city: '',
    state: 'Maharashtra',
    socialPlatform: 'WhatsApp',
    socialHandle: '',
    phonePeNumber: '',
    bankAccountName: '',
    bankName: '',
    bankAccountNumber: '',
    ifscCode: '',
    upiId: '',
    aadhaarPanNumber: '',
    documentUrl: '',
    termsAccepted: true
  });

  const [bankDetailMethod, setBankDetailMethod] = useState<'phonepe' | 'upi' | 'manual' | 'passbook'>('phonepe');
  const [bankSearchTerm, setBankSearchTerm] = useState('');
  const [isBankDropdownOpen, setIsBankDropdownOpen] = useState(false);
  const [isOtherBankSelected, setIsOtherBankSelected] = useState(false);
  const [customBankInput, setCustomBankInput] = useState('');
  const [isUploadingPassbook, setIsUploadingPassbook] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const bankDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (bankDropdownRef.current && !bankDropdownRef.current.contains(event.target as Node)) {
        setIsBankDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handlePassbookUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Only image files (JPG, PNG, WEBP) or PDFs are allowed.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size must be under 10MB.');
      return;
    }

    setIsUploadingPassbook(true);
    setUploadError(null);

    try {
      const data = new FormData();
      data.append('file', file);
      data.append('folder', 'partner_passbooks');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: data
      });

      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.error || 'Failed to upload passbook');
      }

      setFormData(prev => ({
        ...prev,
        documentUrl: json.url
      }));
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload passbook. Please try again.');
    } finally {
      setIsUploadingPassbook(false);
    }
  };

  const [isRegistering, setIsRegistering] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const errorAlertRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (regError) {
      setTimeout(() => {
        if (errorAlertRef.current) {
          const yOffset = -90;
          const element = errorAlertRef.current;
          const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
          window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
        }
      }, 50);
    }
  }, [regError]);

  // Partner Portal Login State
  const [isPortalModalOpen, setIsPortalModalOpen] = useState(false);
  const [loginInput, setLoginInput] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [portalPartner, setPortalPartner] = useState<BusinessPartner | null>(null);
  const [portalReferrals, setPortalReferrals] = useState<PartnerOrderReferral[]>([]);
  const [portalSettlements, setPortalSettlements] = useState<PartnerSettlement[]>([]);
  const [copiedLink, setCopiedLink] = useState(false);
  const [partnerStats, setPartnerStats] = useState<{
    totalPartners: number;
    activePartners: number;
    totalReferredOrders: number;
    totalSalesThroughPartners: number;
    totalPaidCommissions: number;
  } | null>(null);

  // Fetch partner program live stats
  useEffect(() => {
    fetch('/api/partner-program/stats')
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          setPartnerStats(json.data);
        }
      })
      .catch((err) => console.warn('Could not fetch partner stats:', err));
  }, []);

  // Capture ref query parameter on load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const refCode = params.get('ref');
      if (refCode) {
        const cleanCode = refCode.trim().toUpperCase();
        setReferralCookie(cleanCode);
        console.log('[Partner Registration] Captured referral code from URL:', cleanCode);
      }
    }
  }, []);

  // Check if user has an active partner session saved
  useEffect(() => {
    const savedCode = localStorage.getItem('ajw_active_partner_code');
    if (savedCode) {
      fetchPartnerData(savedCode, true);
    }
  }, []);

  const fetchPartnerData = async (identifier: string, isSilent = false) => {
    if (!isSilent) setIsLoggingIn(true);
    if (!isSilent) setLoginError(null);
    try {
      const res = await fetch(`/api/partner-program/partners/${encodeURIComponent(identifier.trim())}`);
      const json = await res.json();

      if (!res.ok || !json.success || !json.data?.partner) {
        if (!isSilent) {
          throw new Error(json.error?.message || 'No partner account found with this Partner Code / Mobile number.');
        }
        return;
      }

      setPortalPartner(json.data.partner);
      setPortalReferrals(json.data.referrals || []);
      setPortalSettlements(json.data.settlements || []);
      localStorage.setItem('ajw_active_partner_code', json.data.partner.partnerCode);
    } catch (err: any) {
      if (!isSilent) {
        setLoginError(err.message || 'Failed to fetch partner dashboard.');
      }
    } finally {
      if (!isSilent) setIsLoggingIn(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (name === 'phone' || name === 'phonePeNumber') {
      let digits = value.replace(/\D/g, '');
      // Strip leading zeros if present (e.g. 09890175921 -> 9890175921)
      if (digits.startsWith('0')) {
        digits = digits.replace(/^0+/, '');
      }
      // Strip country code 91 if pasted as 12 digits (e.g. 919890175921 -> 9890175921)
      if (digits.startsWith('91') && digits.length > 10) {
        digits = digits.slice(2);
      }
      // Strict 10-digit limit
      digits = digits.slice(0, 10);
      setFormData(prev => ({ ...prev, [name]: digits }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);

    if (!formData.fullName.trim()) {
      setRegError('Please enter your full name.');
      return;
    }
    const cleanContactPhone = formData.phone.replace(/\D/g, '');
    if (!formData.phone.trim() || cleanContactPhone.length !== 10) {
      setRegError('Please enter a valid 10-digit mobile number (e.g. 9822455890).');
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setRegError('Please enter a valid email address.');
      return;
    }
    if (!formData.city.trim()) {
      setRegError('Please enter your city / town.');
      return;
    }

    const aadharClean = formData.aadhaarPanNumber.trim().replace(/\s/g, '');
    if (!aadharClean) {
      setRegError('Please enter your 12-digit Aadhaar Number.');
      return;
    }
    if (!/^\d{12}$/.test(aadharClean)) {
      setRegError('Aadhaar Number must be exactly 12 numeric digits.');
      return;
    }

    // Payout Validation - Any one payout method required
    const cleanPhonePe = formData.phonePeNumber.replace(/\D/g, '');
    
    if (bankDetailMethod === 'phonepe') {
      if (!cleanPhonePe) {
        setRegError('Please enter your 10-digit PhonePe / Google Pay mobile number.');
        return;
      }
      if (cleanPhonePe.length !== 10) {
        setRegError(`PhonePe / Google Pay number must be exactly 10 digits (currently ${cleanPhonePe.length} digits).`);
        return;
      }
    } else if (bankDetailMethod === 'upi') {
      if (!formData.upiId.trim() || formData.upiId.trim().length < 3) {
        setRegError('Please enter a valid UPI ID (e.g. 9822455890@paytm or yourname@okhdfcbank).');
        return;
      }
    } else if (bankDetailMethod === 'manual') {
      if (!formData.bankAccountName.trim()) {
        setRegError('Please enter the Account Holder Name as per bank records.');
        return;
      }
      if (!formData.bankName.trim()) {
        setRegError('Please select or enter your Bank Name.');
        return;
      }
      if (!formData.bankAccountNumber.trim()) {
        setRegError('Please enter your Bank Account Number.');
        return;
      }
      if (!formData.ifscCode.trim()) {
        setRegError('Please enter your Bank IFSC Code.');
        return;
      }
    } else if (bankDetailMethod === 'passbook') {
      if (!formData.documentUrl.trim()) {
        setRegError('Please upload a photo or PDF of your bank passbook front page.');
        return;
      }
    }

    // Overall check that at least one payout method is valid
    const hasValidPhonePe = cleanPhonePe.length === 10;
    const hasValidUpi = Boolean(formData.upiId.trim() && formData.upiId.trim().length >= 3);
    const hasValidBank = Boolean(formData.bankAccountNumber.trim() && formData.ifscCode.trim());
    const hasValidPassbook = Boolean(formData.documentUrl.trim());

    if (!hasValidPhonePe && !hasValidUpi && !hasValidBank && !hasValidPassbook) {
      setRegError('Please provide at least one payout method (PhonePe/GPay 10-digit number, UPI ID, Bank Account details, or Passbook photo) for your Sunday commission settlements.');
      return;
    }

    if (!formData.termsAccepted) {
      setRegError('Please accept the Partner Terms and Conditions.');
      return;
    }

    setIsRegistering(true);
    setRegError(null);

    const effectiveUpi = (cleanPhonePe || formData.upiId.trim());
    const finalPayload = {
      ...formData,
      phonePeNumber: cleanPhonePe,
      upiId: effectiveUpi,
      bankAccountName: formData.bankAccountName.trim() || formData.fullName,
      bankName: formData.bankName.trim() || (cleanPhonePe ? 'PhonePe / GPay' : formData.upiId.trim() ? 'UPI Transfer' : formData.documentUrl ? 'Uploaded Passbook' : 'Direct Payout'),
      bankAccountNumber: formData.bankAccountNumber.trim() || effectiveUpi || (formData.documentUrl ? 'Passbook Uploaded' : 'UPI-PAYOUT'),
      ifscCode: formData.ifscCode.trim() ? formData.ifscCode.trim().toUpperCase() : 'UPI-PAYOUT',
      referredByPartnerCode: getReferralCookie()?.code || undefined,
    };

    try {
      // Step 1: Pre-validate unique Email, Phone and Partner Code in MySQL before opening payment gateway
      const preValidateRes = await fetch('/api/partner-program/pre-validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: formData.fullName.trim(),
          phone: formData.phone.trim(),
          email: formData.email.trim(),
          aadhaarPanNumber: formData.aadhaarPanNumber.trim()
        })
      });

      const preValidateJson = await preValidateRes.json();
      if (!preValidateRes.ok || !preValidateJson.success) {
        throw new Error(preValidateJson.error?.message || 'Pre-registration validation failed. An account with this mobile or email may already exist.');
      }

      const verifiedPartnerCode = preValidateJson.data?.partnerCode;

      if (registrationFee === 0) {
        const registerRes = await fetch('/api/partner-program/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...finalPayload,
            ...(verifiedPartnerCode ? { partnerCode: verifiedPartnerCode } : {}),
            isSimulation: false,
            isAdminBypass: false
          })
        });

        const registerJson = await registerRes.json();
        if (!registerRes.ok || !registerJson.success) {
          throw new Error(registerJson.error?.message || 'Registration failed. Please try again.');
        }

        const partner = registerJson.data.partner;
        setPortalPartner(partner);
        localStorage.setItem('ajw_active_partner_code', partner.partnerCode);
        navigate('/woman-partner-login');
        setIsRegistering(false);
        return;
      }

      await loadRazorpayScript();

      const orderRes = await fetch('/api/payment/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: registrationFee,
          currency: 'INR',
          notes: {
            purpose: 'Women Business Partner Registration Fee',
            partnerName: formData.fullName,
            phone: formData.phone,
            email: formData.email
          }
        })
      });
      const orderJson = await orderRes.json();
      if (!orderRes.ok || !orderJson.success) {
        throw new Error(orderJson.error?.message || `Failed to initiate ₹${registrationFee} payment gateway. Please try again.`);
      }
      const orderData = orderJson.data;

      if (orderData.isSimulation || !orderData.key || orderData.key === 'rzp_test_placeholder_key') {
        const simulatedPaymentId = `pay_sim_${Date.now()}`;
        const registerRes = await fetch('/api/partner-program/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...finalPayload,
            ...(verifiedPartnerCode ? { partnerCode: verifiedPartnerCode } : {}),
            paymentRef: simulatedPaymentId,
            transactionId: simulatedPaymentId,
            razorpay_payment_id: simulatedPaymentId,
            razorpay_order_id: orderData.id,
            razorpay_signature: 'simulated_signature',
            paymentAmount: registrationFee,
            isSimulation: true
          })
        });

        const registerJson = await registerRes.json();
        if (!registerRes.ok || !registerJson.success) {
          throw new Error(registerJson.error?.message || 'Registration failed. Please try again.');
        }

        const partner = registerJson.data.partner;
        setPortalPartner(partner);
        localStorage.setItem('ajw_active_partner_code', partner.partnerCode);
        navigate('/woman-partner-login');
        setIsRegistering(false);
        return;
      }

      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'Aapla Jalgaonwala',
        description: `Women Partner Registration Fee (₹${registrationFee})`,
        order_id: orderData.id,
        prefill: {
          name: formData.fullName,
          email: formData.email,
          contact: formData.phone
        },
        theme: { color: '#9B111E' },
        modal: {
          ondismiss: () => {
            setIsRegistering(false);
            setRegError('Payment cancelled. Registration was not completed and no partner account was created.');
          }
        },
        handler: async (response: any) => {
          try {
            const registerRes = await fetch('/api/partner-program/register', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ...finalPayload,
                ...(verifiedPartnerCode ? { partnerCode: verifiedPartnerCode } : {}),
                paymentRef: response.razorpay_payment_id,
                transactionId: response.razorpay_payment_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                paymentAmount: registrationFee,
                isSimulation: orderData.isSimulation
              })
            });

            const registerJson = await registerRes.json();
            if (!registerRes.ok || !registerJson.success) {
              throw new Error(registerJson.error?.message || 'Payment received, but registration encountered an issue. Please contact support.');
            }

            const partner = registerJson.data.partner;
            setPortalPartner(partner);
            localStorage.setItem('ajw_active_partner_code', partner.partnerCode);
            navigate('/woman-partner-login');
          } catch (err: any) {
            setRegError(err.message || 'An error occurred during registration finalization. Please contact support.');
          } finally {
            setIsRegistering(false);
          }
        }
      };

      if ((window as any).Razorpay) {
        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', function (response: any) {
          setRegError(response.error?.description || 'Payment failed. You were not charged and partner registration was not completed.');
          setIsRegistering(false);
        });
        rzp.open();
      } else {
        throw new Error('Razorpay payment gateway failed to initialize. Please refresh the page and try again.');
      }
    } catch (err: any) {
      setRegError(err.message || 'An error occurred while initiating payment.');
      setIsRegistering(false);
    }
  };

  const handlePortalLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginInput.trim()) {
      setLoginError('Please enter your Partner Code, Registered Mobile, or Email.');
      return;
    }
    fetchPartnerData(loginInput.trim(), false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const yOffset = -80;
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
    }
  };

  const partnerRefLink = portalPartner ? `http://aaplajalgaonwala.com/ref/${portalPartner.partnerCode}` : '';

  return (
    <ErrorBoundary moduleName="WomenBusinessPartnerPage">
      <SEO
        title="Women Business Partner Program | Earn 12% Commission from Home"
        description="Empowering women across Maharashtra to earn ₹15,000–₹50,000+ monthly. Flat 12% direct commission, 4% customer discount, zero stock risk, and weekly Sunday bank settlements."
      />

      <div className="bg-white min-h-screen text-stone-900 pb-24">
        
        {/* ========================================================================= */}
        {/* HERO SECTION */}
        {/* ========================================================================= */}
        <section className="relative overflow-hidden bg-stone-950 text-white pt-14 pb-16 md:pt-20 md:pb-24 border-b border-stone-800">
          <div className="absolute inset-0 z-0">
            <img loading="lazy"
              src="https://res.cloudinary.com/xbtfj9zf/image/upload/fl_original/v1786881985/ChatGPT_Image_Aug_16_2026_05_36_11_PM.png"
              alt="Aapla Jalgaonwala Women Partner Program"
              className="w-full h-full object-cover object-center scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-stone-950/80 via-stone-950/70 to-stone-950/95" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_20%,rgba(217,83,30,0.2),transparent)]" />
          </div>

          <Container className="relative z-10">
            <div className="max-w-4xl mx-auto text-center space-y-6">
              
              {/* Trust Badge with Live Count */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-stone-900/90 border border-amber-400/40 text-amber-300 text-xs sm:text-sm font-bold tracking-wide backdrop-blur-md shadow-xl">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>
                  {partnerStats?.totalPartners ? `${partnerStats.totalPartners}+` : '280+'} Active Homemaker Partners across Maharashtra • Weekly Sunday Payouts
                </span>
              </div>

              {/* Main Headline */}
              <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-white leading-tight font-serif drop-shadow-md">
                Aapla Jalgaonwala <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-orange-300">
                  Women Business Partner Program
                </span>
              </h1>

              {/* Mission Subtitle */}
              <p className="text-stone-200 text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed bg-stone-950/70 p-4 sm:p-5 rounded-2xl backdrop-blur-md border border-white/10 shadow-lg">
                Empowering women, homemakers & food lovers to earn <strong className="text-amber-300 font-bold">₹15,000 to ₹50,000+ per month</strong> from home. Promote authentic Khandeshi banana chips, masalas & festive snacks via WhatsApp & Instagram—we handle fresh packing and doorstep delivery across India.
              </p>

              {/* 4 Pillars Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-2 max-w-3xl mx-auto text-left">
                <div className="bg-stone-900/90 backdrop-blur-md border border-amber-400/30 p-4 rounded-2xl shadow-lg">
                  <div className="text-amber-400 font-black text-2xl sm:text-3xl font-serif">12%</div>
                  <div className="text-xs text-stone-200 font-bold mt-1">Direct Commission</div>
                  <div className="text-[10px] text-stone-400 mt-0.5">On all confirmed sales</div>
                </div>

                <div className="bg-stone-900/90 backdrop-blur-md border border-emerald-400/30 p-4 rounded-2xl shadow-lg">
                  <div className="text-emerald-400 font-black text-2xl sm:text-3xl font-serif">4% OFF</div>
                  <div className="text-xs text-stone-200 font-bold mt-1">Customer Discount</div>
                  <div className="text-[10px] text-stone-400 mt-0.5">Applied via your link</div>
                </div>

                <div className="bg-stone-900/90 backdrop-blur-md border border-amber-400/30 p-4 rounded-2xl shadow-lg">
                  <div className="text-amber-300 font-black text-2xl sm:text-3xl font-serif">Sunday</div>
                  <div className="text-xs text-stone-200 font-bold mt-1">Bank Settlements</div>
                  <div className="text-[10px] text-stone-400 mt-0.5">Weekly IMPS / UPI payouts</div>
                </div>

                <div className="bg-stone-900/90 backdrop-blur-md border border-rose-400/30 p-4 rounded-2xl shadow-lg">
                  <div className="text-rose-400 font-black text-2xl sm:text-3xl font-serif">₹0 Risk</div>
                  <div className="text-xs text-stone-200 font-bold mt-1">Zero Stock / Storage</div>
                  <div className="text-[10px] text-stone-400 mt-0.5">No packing or couriers</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4">
                <button
                  onClick={() => scrollToSection('partner-application-form')}
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-[#9B111E] to-[#D9531E] hover:from-[#800E19] hover:to-[#B84014] text-white font-black text-sm shadow-xl shadow-[#9B111E]/40 flex items-center justify-center gap-2.5 transition-all transform active:scale-95 cursor-pointer"
                >
                  <Sparkles className="w-5 h-5 text-amber-300" />
                  <span>
                    {registrationFee === 0
                      ? 'Participate for Free (Instant Activation)'
                      : `Fill Application Form Below (₹${registrationFee} Fee)`}
                  </span>
                </button>

                <button
                  onClick={() => scrollToSection('income-calculator-section')}
                  className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-white/10 hover:bg-white/15 text-amber-300 border border-amber-400/30 font-bold text-sm backdrop-blur-md flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
                >
                  <IndianRupee className="w-4 h-4 text-amber-400" />
                  <span>Calculate Monthly Income</span>
                </button>

                {portalPartner ? (
                  <Link
                    to="/woman-partner-login"
                    className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white border border-emerald-500/30 font-bold text-sm backdrop-blur-md flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
                  >
                    <UserCheck className="w-4 h-4 text-emerald-200" />
                    <span>Open My Partner Portal</span>
                  </Link>
                ) : (
                  <button
                    onClick={() => scrollToSection('portal-login-section')}
                    className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-stone-900/90 hover:bg-stone-800 text-stone-200 border border-white/20 font-bold text-sm backdrop-blur-md flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
                  >
                    <Lock className="w-4 h-4 text-stone-400" />
                    <span>Woman Partner Login</span>
                  </button>
                )}
              </div>

            </div>
          </Container>
        </section>

        {/* ========================================================================= */}
        {/* LIVE PARTNER COMMUNITY METRICS BAR */}
        {/* ========================================================================= */}
        <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border-b border-amber-200/80 py-4 px-4 shadow-inner">
          <Container>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center divide-y sm:divide-y-0 sm:divide-x divide-amber-200/80">
              <div className="py-2">
                <div className="text-xl sm:text-2xl font-black text-stone-900 font-serif flex items-center justify-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                  <span>{partnerStats?.totalPartners ? `${partnerStats.totalPartners}+` : '280+'}</span>
                </div>
                <div className="text-[11px] font-bold text-amber-900 uppercase tracking-wider mt-0.5">
                  Women Partners Enrolled
                </div>
              </div>
              <div className="py-2">
                <div className="text-xl sm:text-2xl font-black text-stone-900 font-serif">
                  45+ Cities
                </div>
                <div className="text-[11px] font-bold text-amber-900 uppercase tracking-wider mt-0.5">
                  Across Maharashtra
                </div>
              </div>
              <div className="py-2">
                <div className="text-xl sm:text-2xl font-black text-emerald-700 font-serif">
                  {partnerStats?.totalReferredOrders ? `${partnerStats.totalReferredOrders}+` : '1,450+'}
                </div>
                <div className="text-[11px] font-bold text-amber-900 uppercase tracking-wider mt-0.5">
                  Customer Orders Delivered
                </div>
              </div>
              <div className="py-2">
                <div className="text-xl sm:text-2xl font-black text-[#9B111E] font-serif">
                  Every Sunday
                </div>
                <div className="text-[11px] font-bold text-amber-900 uppercase tracking-wider mt-0.5">
                  100% On-Time Bank Payouts
                </div>
              </div>
            </div>
          </Container>
        </div>

        {/* ========================================================================= */}
        {/* MAIN TWO-COLUMN LAYOUT: APPLICATION FORM (SHOWN BY DEFAULT) & SIDEBAR */}
        {/* ========================================================================= */}
        <Container className="pt-12 md:pt-16">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* ===================================================================== */}
            {/* LEFT / PRIMARY COLUMN: THE COMPLETE APPLICATION FORM (SHOWN BY DEFAULT) */}
            {/* ===================================================================== */}
            <div id="partner-application-form" className="lg:col-span-7 space-y-6">
              
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 text-[#9B111E] text-xs font-black uppercase tracking-wider bg-[#9B111E]/10 px-3.5 py-1 rounded-full">
                  <Sparkles className="w-3.5 h-3.5 text-[#9B111E]" />
                  <span>Official Application Form</span>
                </div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-stone-900 font-serif">
                  Apply as Women Business Partner
                </h2>
                <p className="text-xs sm:text-sm text-stone-600">
                  {registrationFee === 0
                    ? 'Complete the quick application below. Registration is 100% Free—your unique Partner Code and live shareable link will be activated immediately upon submission!'
                    : isSpecialPromoFee
                    ? 'Complete the quick application below. Special promotional link applied: Pay just ₹1 via Razorpay to activate your unique Partner Code and live shareable link!'
                    : `Complete the quick application below. Upon one-time ₹${registrationFee} registration fee payment via Razorpay, your unique Partner Code and live shareable link will be activated immediately!`}
                </p>
              </div>

              {/* Special ₹1 Promo Banner (Only shown if ?free=1) */}
              {isSpecialPromoFee && (
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-400 text-emerald-950 text-xs shadow-md flex items-start gap-3.5">
                  <div className="p-2 rounded-xl bg-emerald-200 text-emerald-900 shrink-0 mt-0.5">
                    <Sparkles className="w-5 h-5 text-emerald-800" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-emerald-950 text-sm">
                        Special ₹1 Promotional Partner Access
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 text-[10px] font-black uppercase tracking-wider">
                        Promo Applied
                      </span>
                    </div>
                    <p className="text-emerald-900 leading-relaxed text-xs">
                      Special promotional link detected: Your onboarding fee is discounted to a symbolic <strong>₹1 only</strong> (regular onboarding fee: ₹{settings.womenPartnerFee ?? 699}). Full partner benefits, 12% commission & live dashboard are included.
                    </p>
                  </div>
                </div>
              )}

              {/* Registration Fee Transparency Banner (Only shown if fee > 0) */}
              {registrationFee > 0 && (
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-50 to-amber-100/70 border border-amber-300 text-amber-950 text-xs shadow-sm flex items-start gap-3.5">
                  <div className="p-2 rounded-xl bg-amber-200/90 text-amber-900 shrink-0 mt-0.5">
                    <Award className="w-5 h-5 text-amber-900" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-amber-950 text-xs sm:text-sm">
                      What is the ₹{registrationFee} Registration Fee For?
                    </h3>
                    <p className="text-amber-900/90 leading-relaxed text-xs">
                      The nominal one-time fee of <strong>₹{registrationFee}</strong> covers your <strong>starter marketing materials & training kit</strong> (HD video reels, festive posters, product photos), <strong>legal partner compliance onboarding</strong>, and lifetime access to your live <strong>Partner Analytics Dashboard</strong> where you track 12% sales commissions and Sunday bank payouts in real time.
                    </p>
                  </div>
                </div>
              )}

              {regError && (
                <div
                  ref={errorAlertRef}
                  tabIndex={-1}
                  className="p-4 sm:p-5 rounded-2xl bg-rose-50 border-2 border-rose-400 text-rose-900 text-xs sm:text-sm flex items-start gap-3 shadow-lg shadow-rose-900/10 focus:outline-none"
                >
                  <div className="p-2 rounded-xl bg-rose-200 text-rose-800 shrink-0 mt-0.5">
                    <AlertCircle className="w-5 h-5 text-rose-700" />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="font-bold text-rose-950 text-xs sm:text-sm">Please Check Required Fields</h4>
                    <p className="text-rose-800 leading-relaxed font-medium">{regError}</p>
                  </div>
                </div>
              )}

              {/* THE FORM CONTAINER */}
              <form onSubmit={handleRegisterSubmit} className="bg-white p-5 sm:p-8 rounded-3xl border border-stone-200 shadow-xl space-y-7">
                
                {/* Section 1: Personal & Contact Information */}
                <div className="space-y-4">
                  <h3 className="text-sm font-black text-stone-900 uppercase tracking-wider border-b border-stone-100 pb-2 flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#9B111E]" />
                    <span>1. Personal & Contact Information</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label htmlFor="form-full-name" className="text-xs font-bold text-stone-700">Full Name *</label>
                      <input
                        id="form-full-name"
                        type="text"
                        name="fullName"
                        required
                        placeholder="e.g. Pooja Nitin Shinde"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-[#9B111E] focus:outline-none bg-white focus:bg-white active:bg-white text-stone-900 transition-colors shadow-2xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label htmlFor="form-phone" className="text-xs font-bold text-stone-700">Mobile / WhatsApp Number *</label>
                        <span className="text-[10px] font-semibold text-stone-400">10 Digits Only</span>
                      </div>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-500 text-xs font-bold font-mono">
                          +91
                        </div>
                        <input
                          id="form-phone"
                          type="tel"
                          name="phone"
                          required
                          maxLength={10}
                          inputMode="numeric"
                          pattern="[0-9]{10}"
                          placeholder="9822455890"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="w-full pl-12 pr-28 py-2.5 rounded-xl border border-stone-300 text-xs font-mono text-stone-900 tracking-wider focus:ring-2 focus:ring-[#9B111E] focus:outline-none bg-white focus:bg-white active:bg-white font-bold transition-all shadow-2xs"
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none select-none">
                          {formData.phone.replace(/\D/g, '').length === 10 ? (
                            <span key="phone-valid-badge" className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-700 shrink-0" />
                              <span>10 Digits</span>
                            </span>
                          ) : (
                            <span key="phone-count-badge" className="text-[10px] font-semibold text-stone-400">
                              <span>{formData.phone.replace(/\D/g, '').length}</span>
                              <span> / 10 Digits</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="form-email" className="text-xs font-bold text-stone-700">Email Address *</label>
                      <input
                        id="form-email"
                        type="email"
                        name="email"
                        required
                        placeholder="e.g. pooja.shinde@gmail.com"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-[#9B111E] focus:outline-none bg-white focus:bg-white active:bg-white text-stone-900 transition-colors shadow-2xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="form-city" className="text-xs font-bold text-stone-700">City / Town *</label>
                      <input
                        id="form-city"
                        type="text"
                        name="city"
                        required
                        placeholder="e.g. Pune, Jalgaon, Mumbai, Nashik"
                        value={formData.city}
                        onChange={handleInputChange}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-[#9B111E] focus:outline-none bg-white focus:bg-white active:bg-white text-stone-900 transition-colors shadow-2xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Promotion Channels */}
                <div className="space-y-4 pt-2">
                  <h3 className="text-sm font-black text-stone-900 uppercase tracking-wider border-b border-stone-100 pb-2 flex items-center gap-2">
                    <Instagram className="w-4 h-4 text-[#D9531E]" />
                    <span>2. Promotion Channels & Social Reach</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label htmlFor="form-channel" className="text-xs font-bold text-stone-700">Primary Channel</label>
                      <select
                        id="form-channel"
                        name="socialPlatform"
                        value={formData.socialPlatform}
                        onChange={handleInputChange}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-[#9B111E] focus:outline-none bg-white focus:bg-white active:bg-white font-medium cursor-pointer shadow-2xs"
                      >
                        <option value="WhatsApp">WhatsApp (Status, Housing Society & Family Groups)</option>
                        <option value="Instagram">Instagram (Stories, Reels & Bio Link)</option>
                        <option value="Facebook">Facebook (Profile & Community Groups)</option>
                        <option value="YouTube">YouTube (Vlogs & Shorts)</option>
                        <option value="Word of Mouth">Word of Mouth & Local Community</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="form-handle" className="text-xs font-bold text-stone-700">Profile / Handle / Society Details (Optional)</label>
                      <input
                        id="form-handle"
                        type="text"
                        name="socialHandle"
                        placeholder="e.g. @pooja_pune or 300+ Flat Society"
                        value={formData.socialHandle}
                        onChange={handleInputChange}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-[#9B111E] focus:outline-none bg-white focus:bg-white active:bg-white text-stone-900 transition-colors shadow-2xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 3: Payout Settlement Details */}
                <div className="space-y-4 pt-2">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-stone-100 pb-2">
                    <div>
                      <h3 className="text-sm font-black text-stone-900 uppercase tracking-wider flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-emerald-600" />
                        <span>3. Commission Payout Details (Sunday Transfers)</span>
                      </h3>
                      <p className="text-[11px] text-stone-500 mt-0.5">Select your preferred payout method (Any one required).</p>
                    </div>

                    {/* Mode Toggle Tabs: PhonePe/GPay First, Bank Account, Passbook */}
                    <div className="flex flex-wrap items-center gap-1 p-1 bg-stone-100/80 rounded-xl shrink-0">
                      <button
                        type="button"
                        onClick={() => setBankDetailMethod('phonepe')}
                        className={`py-1.5 px-2.5 sm:px-3 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                          bankDetailMethod === 'phonepe'
                            ? 'bg-[#9B111E] text-white shadow-sm'
                            : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
                        }`}
                      >
                        <Smartphone className="w-3.5 h-3.5" />
                        <span>PhonePe / GPay</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setBankDetailMethod('manual')}
                        className={`py-1.5 px-2.5 sm:px-3 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                          bankDetailMethod === 'manual'
                            ? 'bg-[#9B111E] text-white shadow-sm'
                            : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
                        }`}
                      >
                        <Building2 className="w-3.5 h-3.5" />
                        <span>Bank Account</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setBankDetailMethod('passbook')}
                        className={`py-1.5 px-2.5 sm:px-3 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                          bankDetailMethod === 'passbook'
                            ? 'bg-[#9B111E] text-white shadow-sm'
                            : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
                        }`}
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Passbook</span>
                      </button>
                    </div>
                  </div>

                  {/* Option 1: PhonePe / Google Pay Number (Default & Top Recommended) */}
                  {bankDetailMethod === 'phonepe' && (
                    <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-rose-50/70 via-stone-50/80 to-amber-50/50 border border-rose-200/80 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                          <label htmlFor="form-phonepe" className="text-xs font-bold text-stone-900 flex items-center gap-2">
                            <Smartphone className="w-4 h-4 text-[#9B111E]" />
                            <span>PhonePe / Google Pay 10-Digit Mobile Number *</span>
                          </label>
                          <p className="text-[11px] text-stone-600 mt-0.5">
                            Your 12% weekly commission earnings will be credited directly to this registered number every Sunday.
                          </p>
                        </div>
                        {formData.phone && (
                          <button
                            type="button"
                            onClick={() => {
                              const clean = formData.phone.replace(/\D/g, '').slice(0, 10);
                              setFormData(prev => ({ ...prev, phonePeNumber: clean }));
                            }}
                            className="text-[11px] text-[#9B111E] hover:text-rose-800 font-bold bg-white px-2.5 py-1 rounded-lg border border-rose-200 shadow-2xs hover:bg-rose-50 transition-colors self-start sm:self-auto cursor-pointer"
                          >
                            Use Contact Phone ({formData.phone})
                          </button>
                        )}
                      </div>

                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-500 text-xs font-bold font-mono">
                          +91
                        </div>
                        <input
                          id="form-phonepe"
                          type="tel"
                          name="phonePeNumber"
                          maxLength={10}
                          placeholder="e.g. 9822455890"
                          value={formData.phonePeNumber}
                          onChange={(e) => {
                            const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                            setFormData(prev => ({ ...prev, phonePeNumber: digits }));
                          }}
                          className="w-full pl-12 pr-28 py-2.5 rounded-xl border border-stone-300 text-xs font-mono text-stone-900 tracking-wider focus:ring-2 focus:ring-[#9B111E] focus:outline-none bg-white font-bold transition-all shadow-2xs"
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none select-none">
                          {formData.phonePeNumber.replace(/\D/g, '').length === 10 ? (
                            <span key="phonepe-valid-badge" className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-700 shrink-0" />
                              <span>10 Digits</span>
                            </span>
                          ) : (
                            <span key="phonepe-count-badge" className="text-[10px] font-semibold text-stone-400">
                              <span>{formData.phonePeNumber.replace(/\D/g, '').length}</span>
                              <span> / 10 Digits</span>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-stone-500">
                        <span className="flex items-center gap-1 text-stone-600">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Supports PhonePe, Google Pay, Paytm & BHIM UPI
                        </span>
                        <button
                          type="button"
                          onClick={() => setBankDetailMethod('manual')}
                          className="text-[#9B111E] font-bold hover:underline cursor-pointer"
                        >
                          Want to enter Bank IFSC & Account instead?
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Option 2: UPI ID (VPA) */}
                  {bankDetailMethod === 'upi' && (
                    <div className="p-4 sm:p-5 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
                      <div>
                        <label htmlFor="form-upi-direct" className="text-xs font-bold text-stone-900 flex items-center gap-2">
                          <Zap className="w-4 h-4 text-amber-600" />
                          <span>UPI ID / VPA *</span>
                        </label>
                        <p className="text-[11px] text-stone-600 mt-0.5">
                          Enter your personalized UPI ID (e.g. mobile@paytm or name@okhdfcbank).
                        </p>
                      </div>

                      <input
                        id="form-upi-direct"
                        type="text"
                        name="upiId"
                        placeholder="e.g. 9822455890@paytm or yourname@okhdfcbank"
                        value={formData.upiId}
                        onChange={handleInputChange}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs font-mono focus:ring-2 focus:ring-[#9B111E] focus:outline-none bg-white transition-colors"
                      />
                    </div>
                  )}

                  {/* Option 3: Manual Bank Account Details */}
                  {bankDetailMethod === 'manual' && (
                    <div className="p-4 sm:p-5 rounded-2xl bg-stone-50 border border-stone-200 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label htmlFor="form-acc-holder" className="text-xs font-bold text-stone-700">Account Holder Name *</label>
                          <input
                            id="form-acc-holder"
                            type="text"
                            name="bankAccountName"
                            placeholder="As on Bank Account"
                            value={formData.bankAccountName}
                            onChange={handleInputChange}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-[#9B111E] focus:outline-none bg-white transition-colors"
                          />
                        </div>

                        {/* Searchable Bank Dropdown with Other Bank Option */}
                        <div className="space-y-1 relative" ref={bankDropdownRef}>
                          <label className="text-xs font-bold text-stone-700 block">Bank Name *</label>
                          <div
                            onClick={() => setIsBankDropdownOpen(!isBankDropdownOpen)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs flex justify-between items-center cursor-pointer bg-white hover:border-stone-400 focus-within:ring-2 focus-within:ring-[#9B111E] select-none"
                          >
                            <span className={formData.bankName ? "text-stone-900 font-semibold truncate" : "text-stone-400"}>
                              {formData.bankName || "Select Bank Name..."}
                            </span>
                            <ChevronDown className="w-4 h-4 text-stone-500 shrink-0" />
                          </div>

                          {isBankDropdownOpen && (
                            <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-stone-200 rounded-2xl shadow-2xl overflow-hidden max-h-64 flex flex-col">
                              <div className="p-2.5 border-b border-stone-100 flex items-center gap-2 bg-stone-50">
                                <Search className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                                <input
                                  type="text"
                                  placeholder="Search major Indian banks or type name..."
                                  value={bankSearchTerm}
                                  onChange={(e) => setBankSearchTerm(e.target.value)}
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-full bg-transparent text-xs focus:outline-none py-1 text-stone-800 font-medium"
                                  autoFocus
                                />
                              </div>

                              {/* Option to use typed text directly as custom bank */}
                              {bankSearchTerm.trim() && (
                                <div
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const customName = bankSearchTerm.trim();
                                    setFormData(prev => ({ ...prev, bankName: customName }));
                                    setCustomBankInput(customName);
                                    setIsOtherBankSelected(true);
                                    setIsBankDropdownOpen(false);
                                    setBankSearchTerm('');
                                  }}
                                  className="px-3.5 py-2.5 text-xs bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold border-b border-amber-200 cursor-pointer flex items-center gap-2 transition-colors"
                                >
                                  <Sparkles className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                                  <span>Use &ldquo;{bankSearchTerm.trim()}&rdquo; as Bank Name</span>
                                </div>
                              )}

                              <div className="overflow-y-auto flex-1 divide-y divide-stone-50">
                                {INDIAN_BANKS.filter(bank => bank.toLowerCase().includes(bankSearchTerm.toLowerCase())).map((bank) => (
                                  <div
                                    key={bank}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (bank.includes('Other Bank')) {
                                        setIsOtherBankSelected(true);
                                        setFormData(prev => ({ ...prev, bankName: customBankInput || '' }));
                                      } else {
                                        setIsOtherBankSelected(false);
                                        setFormData(prev => ({ ...prev, bankName: bank }));
                                      }
                                      setIsBankDropdownOpen(false);
                                      setBankSearchTerm('');
                                    }}
                                    className={`px-3.5 py-2.5 text-xs hover:bg-amber-50/70 cursor-pointer text-stone-700 font-semibold transition-colors flex items-center justify-between ${
                                      bank.includes('Other Bank') ? 'bg-stone-50 font-bold text-[#9B111E]' : ''
                                    }`}
                                  >
                                    <span>{bank}</span>
                                    {formData.bankName === bank && <Check className="w-4 h-4 text-[#9B111E]" />}
                                  </div>
                                ))}
                                {INDIAN_BANKS.filter(bank => bank.toLowerCase().includes(bankSearchTerm.toLowerCase())).length === 0 && !bankSearchTerm.trim() && (
                                  <div className="px-3.5 py-4 text-xs text-stone-400 text-center">No matching banks found</div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Custom Bank Name Input when Other Bank is selected */}
                        {isOtherBankSelected && (
                          <div className="space-y-1 sm:col-span-2 bg-amber-50/60 p-3 rounded-2xl border border-amber-200">
                            <label htmlFor="form-custom-bank" className="text-xs font-bold text-amber-950 block">Enter Custom Bank Name *</label>
                            <input
                              id="form-custom-bank"
                              type="text"
                              required
                              placeholder="e.g. Nashik District Central Co-op Bank or Citizen Credit Co-op Bank"
                              value={formData.bankName}
                              onChange={(e) => {
                                const val = e.target.value;
                                setCustomBankInput(val);
                                setFormData(prev => ({ ...prev, bankName: val }));
                              }}
                              className="w-full px-3.5 py-2.5 rounded-xl border border-amber-300 text-xs focus:ring-2 focus:ring-[#9B111E] focus:outline-none bg-white font-medium"
                            />
                          </div>
                        )}

                        <div className="space-y-1">
                          <label htmlFor="form-acc-num" className="text-xs font-bold text-stone-700">Account Number *</label>
                          <input
                            id="form-acc-num"
                            type="text"
                            name="bankAccountNumber"
                            placeholder="e.g. 50100492817462"
                            value={formData.bankAccountNumber}
                            onChange={handleInputChange}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs font-mono focus:ring-2 focus:ring-[#9B111E] focus:outline-none bg-white transition-colors"
                          />
                        </div>

                        <div className="space-y-1">
                          <label htmlFor="form-ifsc" className="text-xs font-bold text-stone-700">IFSC Code *</label>
                          <input
                            id="form-ifsc"
                            type="text"
                            name="ifscCode"
                            placeholder="e.g. HDFC0001248"
                            value={formData.ifscCode}
                            onChange={handleInputChange}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs font-mono uppercase focus:ring-2 focus:ring-[#9B111E] focus:outline-none bg-white transition-colors"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Option 4: Upload Passbook */}
                  {bankDetailMethod === 'passbook' && (
                    <div className="p-4 sm:p-5 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
                      <label className="text-xs font-bold text-stone-700 block">Bank Passbook Front Page (Photo or PDF) *</label>
                      <p className="text-[11px] text-stone-500 leading-relaxed">
                        Upload a clear picture or PDF of your bank passbook front page displaying your Account Number, IFSC Code, and Name.
                      </p>

                      {!formData.documentUrl ? (
                        <div className="relative border-2 border-dashed border-stone-300 hover:border-[#9B111E] rounded-2xl p-7 transition-all bg-white flex flex-col items-center justify-center text-center group cursor-pointer">
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            onChange={handlePassbookUpload}
                            disabled={isUploadingPassbook}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          {isUploadingPassbook ? (
                            <div className="space-y-2">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#9B111E] mx-auto" />
                              <span className="text-xs font-semibold text-stone-600 block">Uploading securely to Cloudinary...</span>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <Upload className="w-8 h-8 text-stone-400 group-hover:text-[#9B111E] mx-auto transition-colors" />
                              <div className="text-xs">
                                <span className="text-[#9B111E] font-bold group-hover:underline">Click to upload</span> or drag and drop
                              </div>
                              <span className="text-[10px] text-stone-400 block">Accepts image files (PNG, JPG, WEBP) or PDFs up to 10MB</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center justify-between p-4 rounded-2xl border border-stone-200 bg-emerald-50/50">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-800 shrink-0">
                              {formData.documentUrl.toLowerCase().endsWith('.pdf') ? (
                                <FileText className="w-5 h-5" />
                              ) : (
                                <ImageIcon className="w-5 h-5" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <span className="text-xs font-bold text-stone-800 block truncate">Passbook Document Uploaded</span>
                              <a
                                href={formData.documentUrl}
                                target="_blank"
                                referrerPolicy="no-referrer"
                                rel="noreferrer"
                                className="text-[11px] text-emerald-700 hover:underline font-semibold flex items-center gap-1 mt-0.5"
                              >
                                View uploaded file <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, documentUrl: '' }))}
                            className="text-xs text-rose-600 hover:text-rose-800 font-bold px-3 py-1.5 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      )}

                      {uploadError && (
                        <p className="text-xs font-semibold text-rose-600 flex items-center gap-1.5 pt-1">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>{uploadError}</span>
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Section 4: Aadhaar Verification */}
                <div className="space-y-4 pt-2">
                  <h3 className="text-sm font-black text-stone-900 uppercase tracking-wider border-b border-stone-100 pb-2 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#9B111E]" />
                    <span>4. Identity Verification</span>
                  </h3>

                  <div className="space-y-1 max-w-md">
                    <label htmlFor="form-aadhaar" className="text-xs font-bold text-stone-700 block">Aadhaar Number (12 Digits) *</label>
                    <input
                      id="form-aadhaar"
                      type="text"
                      name="aadhaarPanNumber"
                      required
                      maxLength={12}
                      placeholder="e.g. 509218274639"
                      value={formData.aadhaarPanNumber}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 12);
                        setFormData(prev => ({ ...prev, aadhaarPanNumber: val }));
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs font-mono tracking-widest focus:ring-2 focus:ring-[#9B111E] focus:outline-none bg-white focus:bg-white active:bg-white text-stone-900 transition-colors shadow-2xs"
                    />
                    <p className="text-[10px] text-stone-500">Your Aadhaar number is verified securely for partner authorization.</p>
                  </div>
                </div>

                {/* Terms Checkbox */}
                <div className="pt-2 space-y-3">
                  <label className="flex items-start gap-3 text-xs text-stone-600 cursor-pointer">
                    <input
                      type="checkbox"
                      name="termsAccepted"
                      checked={formData.termsAccepted}
                      onChange={handleInputChange}
                      className="mt-0.5 rounded text-[#9B111E] focus:ring-[#9B111E]"
                    />
                    <span className="leading-relaxed">
                      I agree to the Women Business Partner program terms. I understand that I earn a 12% net commission on all completed product sales generated through my referral link, settled every Sunday directly to my bank account.
                    </span>
                  </label>
                </div>

                {/* Submit / Pay Button */}
                <button
                  type="submit"
                  disabled={isRegistering}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#9B111E] to-[#D9531E] hover:from-[#800E19] hover:to-[#B84014] text-white font-black text-sm shadow-xl shadow-[#9B111E]/30 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {isRegistering ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>
                        {registrationFee === 0
                          ? 'Activating Partner Account for Free...'
                          : `Processing Secure Payment (₹${registrationFee})...`}
                      </span>
                    </div>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>
                        {registrationFee === 0
                          ? 'Participate for Free & Activate Partner Account'
                          : `Pay ₹${registrationFee} & Activate Business Partner Account`}
                      </span>
                    </>
                  )}
                </button>

                {registrationFee === 0 ? (
                  <div className="pt-1 flex flex-wrap items-center justify-center gap-4 text-[11px] text-stone-500">
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> 100% Free Participation
                    </span>
                    <span className="flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 text-amber-600" /> Weekly Direct Sunday Payouts
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Instant Partner Link Issuance
                    </span>
                  </div>
                ) : (
                  <div className="pt-1 flex flex-wrap items-center justify-center gap-4 text-[11px] text-stone-500">
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> 100% Secure Razorpay
                    </span>
                    <span className="flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 text-amber-600" /> UPI, GPay, PhonePe, Cards, NetBanking
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Instant Partner Link Issuance
                    </span>
                  </div>
                )}
              </form>

            </div>

            {/* ===================================================================== */}
            {/* RIGHT COLUMN: INTERACTIVE CALCULATOR & VALUE HIGHLIGHTS */}
            {/* ===================================================================== */}
            <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
              
              {/* Interactive Earnings Calculator Card */}
              <div id="income-calculator-section" className="bg-white p-6 sm:p-7 rounded-3xl border border-stone-200 shadow-xl space-y-6">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 text-amber-800 text-xs font-black uppercase tracking-wider bg-amber-100 px-3 py-1 rounded-full">
                    <IndianRupee className="w-3.5 h-3.5 text-amber-600" />
                    <span>Live 12% Calculation</span>
                  </div>
                  <h3 className="text-xl font-bold text-stone-900 font-serif">
                    Earnings Calculator
                  </h3>
                  <p className="text-xs text-stone-500">
                    Estimate your weekly Sunday and monthly income.
                  </p>
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => { setDailyOrders(3); setAverageOrderValue(500); }}
                    className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-[11px] font-bold transition-colors cursor-pointer"
                  >
                    Part-Time (3/day)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setDailyOrders(10); setAverageOrderValue(750); }}
                    className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 text-[11px] font-bold transition-colors cursor-pointer"
                  >
                    Promoter (10/day)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setDailyOrders(25); setAverageOrderValue(1000); }}
                    className="px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-900 text-[11px] font-bold transition-colors cursor-pointer"
                  >
                    Leader (25/day)
                  </button>
                </div>

                {/* Sliders */}
                <div className="space-y-4 pt-1">
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-bold text-stone-800">
                      <label htmlFor="calc-side-orders">Referred Orders / Day:</label>
                      <span className="text-xs text-[#9B111E] font-black bg-[#9B111E]/10 px-2.5 py-0.5 rounded-lg">
                        {dailyOrders} {dailyOrders === 1 ? 'order' : 'orders'}
                      </span>
                    </div>
                    <input
                      id="calc-side-orders"
                      type="range"
                      min="1"
                      max="50"
                      step="1"
                      value={dailyOrders}
                      onChange={(e) => setDailyOrders(Number(e.target.value))}
                      className="w-full h-2.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-[#9B111E]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-bold text-stone-800">
                      <label htmlFor="calc-side-aov">Average Cart Size:</label>
                      <span className="text-xs text-emerald-700 font-black bg-emerald-50 px-2.5 py-0.5 rounded-lg">
                        ₹{averageOrderValue}
                      </span>
                    </div>
                    <input
                      id="calc-side-aov"
                      type="range"
                      min="300"
                      max="2500"
                      step="50"
                      value={averageOrderValue}
                      onChange={(e) => setAverageOrderValue(Number(e.target.value))}
                      className="w-full h-2.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                    />
                  </div>
                </div>

                {/* Metric Boxes */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="bg-amber-50 p-3.5 rounded-2xl border border-amber-200 text-center">
                    <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">Weekly Sunday Payout</span>
                    <div className="text-xl font-black text-[#9B111E] mt-0.5 font-serif">₹{weeklyPayout.toLocaleString('en-IN')}</div>
                    <span className="text-[9px] text-amber-700 font-semibold">Direct Bank/UPI</span>
                  </div>

                  <div className="bg-emerald-50 p-3.5 rounded-2xl border border-emerald-200 text-center">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">Monthly Income</span>
                    <div className="text-xl font-black text-emerald-700 mt-0.5 font-serif">₹{monthlyEarnings.toLocaleString('en-IN')}</div>
                    <span className="text-[9px] text-emerald-600 font-semibold">12% net commission</span>
                  </div>
                </div>
              </div>

              {/* Ready Marketing Kit Promo */}
              <div className="bg-[#FAF0E6] p-6 rounded-3xl border border-[#9B111E]/20 space-y-4">
                <div className="flex items-center gap-2 text-[#9B111E] font-bold text-xs">
                  <Download className="w-4 h-4" />
                  <span>Free Ready-to-Post Marketing Kit</span>
                </div>
                <h4 className="text-sm font-bold text-stone-900 leading-snug">
                  Everything provided: WhatsApp posters, festive combos, and HD Instagram video reels.
                </h4>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-stone-700">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>WhatsApp Stories</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Instagram Reels</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Festive Posters</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Digital Catalogs</span>
                  </div>
                </div>
              </div>

              {/* Returning Partner Quick Login Box */}
              <div id="portal-login-section" className="bg-stone-900 text-white p-6 rounded-3xl border border-stone-800 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-amber-400" />
                    <h4 className="text-sm font-bold text-white">Woman Partner Login</h4>
                  </div>
                  {portalPartner && (
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded-full">
                      Logged In
                    </span>
                  )}
                </div>

                {portalPartner ? (
                  <div className="space-y-3">
                    <p className="text-xs text-stone-300">
                      Welcome back, <strong>{portalPartner.fullName}</strong> ({portalPartner.partnerCode})!
                    </p>
                    <Link
                      to="/partner-analytics"
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#9B111E] to-[#D9531E] hover:from-[#800E19] hover:to-[#B84014] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <TrendingUp className="w-3.5 h-3.5 text-amber-300" />
                      <span>View Live Orders & Sunday Payouts</span>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs text-stone-300">
                      Enter your Partner Code or registered mobile to access your analytics dashboard.
                    </p>

                    {loginError && (
                      <div className="p-2.5 rounded-xl bg-rose-900/50 border border-rose-500/50 text-rose-200 text-xs flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                        <span>{loginError}</span>
                      </div>
                    )}

                    <form onSubmit={handlePortalLogin} className="space-y-2">
                      <input
                        type="text"
                        required
                        placeholder="e.g. AJW-104822 or 9822455890"
                        value={loginInput}
                        onChange={(e) => setLoginInput(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-stone-800 border border-stone-700 text-xs text-white placeholder:text-stone-500 focus:ring-2 focus:ring-[#9B111E] focus:outline-none"
                      />
                      <button
                        type="submit"
                        disabled={isLoggingIn}
                        className="w-full py-2.5 rounded-xl bg-[#9B111E] hover:bg-[#800E19] text-white font-bold text-xs transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        {isLoggingIn ? 'Checking Account...' : 'Access Dashboard'}
                      </button>
                    </form>
                  </div>
                )}
              </div>

            </div>

          </div>
        </Container>

        {/* ========================================================================= */}
        {/* STEP-BY-STEP WORKFLOW SECTION */}
        {/* ========================================================================= */}
        <Container className="pt-20 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <div className="inline-flex items-center gap-1.5 text-[#9B111E] text-xs font-black uppercase tracking-wider bg-[#9B111E]/10 px-3.5 py-1 rounded-full">
              <Zap className="w-3.5 h-3.5 text-[#9B111E]" />
              <span>Simple 6-Step Workflow</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-stone-900 font-serif">
              How the Program Works
            </h2>
            <p className="text-xs sm:text-sm text-stone-600">
              Zero inventory, zero packing stress, and zero shipping logistics. Here is your effortless step-by-step roadmap to regular weekly income.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Step 1 */}
            <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-2xl bg-[#9B111E]/10 text-[#9B111E] font-black text-lg flex items-center justify-center mb-4">
                01
              </div>
              <h3 className="text-base font-bold text-stone-900 mb-1.5">Register in 2 Minutes</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Submit your contact & bank details in the application form above, complete the ₹{registrationFee} registration fee, and instantly unlock your official partner account.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-700 font-black text-lg flex items-center justify-center mb-4">
                02
              </div>
              <h3 className="text-base font-bold text-stone-900 mb-1.5">Get Code & Link</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Receive your customized Partner Code (e.g. <strong>AJW-104822</strong>) and 1-click shareable website referral link for WhatsApp, Instagram, and Facebook.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-2xl bg-pink-500/10 text-pink-600 font-black text-lg flex items-center justify-center mb-4">
                03
              </div>
              <h3 className="text-base font-bold text-stone-900 mb-1.5">Share Photos & Reels</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Use our free ready-to-post HD photos, festive banners, and video reels on your WhatsApp Status, Instagram Stories, housing society groups, and Telegram.
              </p>
            </div>

            {/* Step 4 */}
            <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 font-black text-lg flex items-center justify-center mb-4">
                04
              </div>
              <h3 className="text-base font-bold text-stone-900 mb-1.5">Customers Get 4% OFF</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                When friends and buyers open your link, a <strong>4% instant discount</strong> is automatically applied at checkout—giving them strong motivation to purchase through you!
              </p>
            </div>

            {/* Step 5 */}
            <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 font-black text-lg flex items-center justify-center mb-4">
                05
              </div>
              <h3 className="text-base font-bold text-stone-900 mb-1.5">We Pack & Deliver Fresh</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                You don't handle packaging, couriers, or payment collection. Aapla Jalgaonwala processes payments and ships fresh authentic snacks straight to your customer's door.
              </p>
            </div>

            {/* Step 6 */}
            <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-2xl bg-[#9B111E]/10 text-[#9B111E] font-black text-lg flex items-center justify-center mb-4">
                06
              </div>
              <h3 className="text-base font-bold text-stone-900 mb-1.5">Enjoy 12% Sunday Payouts</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                All sales are tracked transparently in your partner dashboard. Your <strong>12% net commission</strong> is deposited straight to your bank account / UPI every Sunday!
              </p>
            </div>
          </div>
        </Container>

        {/* ========================================================================= */}
        {/* 16% TOTAL BENEFIT MODEL DEEP DIVE */}
        {/* ========================================================================= */}
        <Container className="pt-16">
          <div className="bg-gradient-to-br from-stone-900 via-stone-900 to-[#320808] text-white p-8 sm:p-12 rounded-3xl border border-stone-800 shadow-2xl relative overflow-hidden">
            <div className="max-w-3xl space-y-6">
              <div className="inline-flex items-center gap-1.5 text-amber-300 text-xs font-bold uppercase tracking-wider bg-amber-400/10 px-3.5 py-1 rounded-full border border-amber-400/20">
                <Percent className="w-3.5 h-3.5 text-amber-300" />
                <span>Win-Win 16% Total Benefit Ecosystem</span>
              </div>

              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black font-serif">
                Total Ecosystem Value: <span className="text-amber-300">16% per Order</span>
              </h2>

              <p className="text-stone-300 text-xs sm:text-sm leading-relaxed">
                We designed this model so that both you and your customers win every time. Your community saves money while you earn dependable passive income.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/15">
                  <div className="text-amber-400 font-black text-3xl sm:text-4xl mb-1 font-serif">12%</div>
                  <h3 className="text-base font-bold text-white mb-1">Partner Direct Commission</h3>
                  <p className="text-xs text-stone-300 leading-relaxed">
                    Earn a flat 12% net commission on every product order placed through your referral code or direct link.
                  </p>
                </div>

                <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/15">
                  <div className="text-emerald-400 font-black text-3xl sm:text-4xl mb-1 font-serif">4%</div>
                  <h3 className="text-base font-bold text-white mb-1">Mandatory Customer Discount</h3>
                  <p className="text-xs text-stone-300 leading-relaxed">
                    Automatically applied to the customer's cart as an instant incentive to purchase through your partner referral code.
                  </p>
                </div>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-400/20 flex items-start gap-3.5">
                <Calendar className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
                <p className="text-xs sm:text-sm text-stone-200 leading-relaxed">
                  <strong className="text-amber-300">Guaranteed Sunday Payouts:</strong> Every Sunday, all completed orders from the past week are consolidated and transferred to your registered bank account with an instant settlement reference ID.
                </p>
              </div>
            </div>
          </div>
        </Container>

        {/* ========================================================================= */}
        {/* SUCCESS STORIES SECTION */}
        {/* ========================================================================= */}
        <Container className="pt-16 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <div className="inline-flex items-center gap-1.5 text-amber-700 text-xs font-black uppercase tracking-wider bg-amber-100 px-3.5 py-1 rounded-full">
              <Heart className="w-3.5 h-3.5 text-amber-700" />
              <span>Partner Voices</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 font-serif">
              Stories from Our Women Business Partners
            </h2>
            <p className="text-xs sm:text-sm text-stone-600">
              Hear how homemakers, teachers, and professionals across Maharashtra are building financial independence from home.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {SUCCESS_STORIES.map((story, i) => (
              <div key={i} className="bg-white p-6 sm:p-7 rounded-3xl border border-stone-200 shadow-sm flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3.5">
                    <img loading="lazy"
                      src={story.avatar}
                      alt={story.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-[#9B111E]/20"
                    />
                    <div>
                      <h3 className="text-sm font-bold text-stone-900">{story.name}</h3>
                      <p className="text-[11px] text-stone-500">{story.location} • {story.role}</p>
                    </div>
                  </div>
                  <p className="text-xs text-stone-600 italic leading-relaxed">
                    "{story.quote}"
                  </p>
                </div>

                <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-stone-400 uppercase font-bold block">Avg. Monthly Income</span>
                    <span className="text-sm font-black text-emerald-700">{story.monthlyEarnings}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-stone-400 uppercase font-bold block">Orders Referred</span>
                    <span className="text-xs font-bold text-stone-800">{story.ordersReferred}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Container>

        {/* ========================================================================= */}
        {/* FREQUENTLY ASKED QUESTIONS */}
        {/* ========================================================================= */}
        <Container className="pt-16 max-w-3xl space-y-6">
          <div className="text-center space-y-1">
            <div className="inline-flex items-center gap-1.5 text-stone-600 text-xs font-black uppercase tracking-wider bg-stone-200/70 px-3 py-1 rounded-full">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Got Questions?</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 font-serif">
              Frequently Asked Questions
            </h2>
            <p className="text-xs text-stone-600">Everything you need to know about starting as a Women Business Partner</p>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <details key={i} className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200 shadow-sm cursor-pointer group">
                <summary className="font-bold text-xs sm:text-sm text-stone-900 list-none flex justify-between items-center gap-4 select-none">
                  <span>{faq.q}</span>
                  <span className="text-[#9B111E] text-xl font-bold group-open:rotate-45 transition-transform shrink-0">+</span>
                </summary>
                <p className="text-xs text-stone-600 mt-3 leading-relaxed border-t border-stone-100 pt-3">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </Container>

      </div>
    </ErrorBoundary>
  );
}
