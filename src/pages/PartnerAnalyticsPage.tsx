import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Share2,
  Copy,
  Check,
  MessageCircle,
  TrendingUp,
  ShoppingBag,
  Clock,
  CheckCircle2,
  LogOut,
  RefreshCw,
  Search,
  Sparkles,
  Building2,
  CreditCard,
  ShieldCheck,
  ArrowRight,
  Phone,
  MapPin,
  Calendar,
  Award,
  Wallet,
  ArrowUpRight,
  HelpCircle,
  QrCode,
  IndianRupee,
  CheckCircle,
  AlertCircle,
  Users,
  Percent,
  TrendingDown,
  ChevronRight,
  Info,
  Lightbulb,
  BookOpen,
  Target,
  Flame,
  Zap,
  Coffee,
  Gift,
  Instagram,
  Star,
  MessageSquare,
  LayoutDashboard,
  BarChart3,
  Settings,
  Package,
  User,
  Mail,
  FileText,
  Image as ImageIcon,
  Download,
  ExternalLink
} from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { SEO } from '@/components/seo/SEO';
import { BusinessPartner, PartnerOrderReferral, PartnerSettlement } from '@/types';

type PartnerTab = 'overview' | 'analytics' | 'commissions' | 'orders' | 'toolkit' | 'settings';

export default function PartnerAnalyticsPage() {
  const navigate = useNavigate();

  const [partnerCodeInput, setPartnerCodeInput] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const [partner, setPartner] = useState<BusinessPartner | null>(null);
  const [referrals, setReferrals] = useState<PartnerOrderReferral[]>([]);
  const [settlements, setSettlements] = useState<PartnerSettlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedPromo, setCopiedPromo] = useState(false);
  const [copiedInviteLink, setCopiedInviteLink] = useState(false);
  const [activeTab, setActiveTab] = useState<PartnerTab>('overview');
  const [orderSearchTerm, setOrderSearchTerm] = useState('');
  const [shareLanguage, setShareLanguage] = useState<'marathi' | 'english' | 'hindi'>('marathi');
  const [womanGraphics, setWomanGraphics] = useState<Array<{ id: string; title: string; caption: string; imageUrl: string; createdAt: string }>>([]);
  const [loadingGraphics, setLoadingGraphics] = useState(false);
  const [copiedGraphicId, setCopiedGraphicId] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab === 'toolkit') {
      setLoadingGraphics(true);
      fetch('/api/woman?action=get_media')
        .then(res => res.json())
        .then(data => {
          const items = data.data || data.media || data.graphics || [];
          if (Array.isArray(items)) {
            setWomanGraphics(items);
          }
        })
        .catch(err => console.error('Failed to load graphics:', err))
        .finally(() => setLoadingGraphics(false));
    }
  }, [activeTab]);

  // Next Sunday calculation for transparent payout schedules
  const nextSundayFormatted = useMemo(() => {
    const now = new Date();
    const day = now.getDay();
    const diff = (7 - day) % 7 || 7;
    const nextSun = new Date(now);
    nextSun.setDate(now.getDate() + diff);
    return nextSun.toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }, []);

  const totalSettledAmount = useMemo(() => {
    return settlements.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
  }, [settlements]);

  const deliveredReferrals = useMemo(() => {
    return referrals.filter(r => r.isDelivered || r.status === 'eligible' || r.status === 'settled');
  }, [referrals]);

  const onHoldReferrals = useMemo(() => {
    return referrals.filter(r => !r.isDelivered && r.status !== 'eligible' && r.status !== 'settled' && r.orderStatus?.toLowerCase() !== 'cancelled');
  }, [referrals]);

  const deliveredCommission = useMemo(() => {
    if (partner?.totalCommissionEarned !== undefined && partner?.totalCommissionEarned !== null) {
      return partner.totalCommissionEarned;
    }
    return deliveredReferrals.reduce((sum, r) => sum + (Number(r.partnerCommission) || 0), 0);
  }, [partner, deliveredReferrals]);

  const onHoldCommission = useMemo(() => {
    if (partner?.onHoldCommission !== undefined && partner?.onHoldCommission !== null) {
      return partner.onHoldCommission;
    }
    return onHoldReferrals.reduce((sum, r) => sum + (Number(r.partnerCommission) || 0), 0);
  }, [partner, onHoldReferrals]);

  const averageOrderValue = useMemo(() => {
    const count = partner?.totalOrdersCount || referrals.length || 0;
    const sales = partner?.totalSalesAmount || 0;
    if (count === 0 || sales === 0) return 0;
    return Math.round(sales / count);
  }, [partner, referrals]);

  const averageCommissionPerOrder = useMemo(() => {
    const count = deliveredReferrals.length;
    if (count === 0 || deliveredCommission === 0) return 0;
    return Math.round(deliveredCommission / count);
  }, [deliveredReferrals, deliveredCommission]);

  // Fetch partner data from MySQL DB backend strictly using partner code (codeOnly=true)
  const fetchPartnerData = useCallback(async (code: string, isInitialLoad = true) => {
    if (isInitialLoad) setLoading(true);
    else setIsRefreshing(true);
    setLoginError(null);

    const cleanCode = code.trim().toUpperCase();

    try {
      const res = await fetch(`/api/partner-program/partners/${encodeURIComponent(cleanCode)}?codeOnly=true`);
      const json = await res.json();

      if (!res.ok || !json.success || !json.data?.partner) {
        throw new Error(
          json.error?.message ||
          'Invalid Partner Code. Please enter your exact assigned Partner Referral Code (e.g., AJW-289822).'
        );
      }

      const p: BusinessPartner = json.data.partner;
      setPartner(p);
      setReferrals(json.data.referrals || []);
      setSettlements(json.data.settlements || []);

      // Store in localStorage for persistent session
      localStorage.setItem('ajw_active_partner_code', p.partnerCode);
    } catch (err: any) {
      setLoginError(err.message || 'Failed to verify Partner Code. Please check and try again.');
      localStorage.removeItem('ajw_active_partner_code');
      setPartner(null);
    } finally {
      if (isInitialLoad) setLoading(false);
      else setIsRefreshing(false);
    }
  }, []);

  // Check stored partner code on page load
  useEffect(() => {
    const savedCode = localStorage.getItem('ajw_active_partner_code');
    if (savedCode) {
      fetchPartnerData(savedCode, true);
    } else {
      setLoading(false);
    }
  }, [fetchPartnerData]);

  // Handle Login Submission strictly with referral code
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = partnerCodeInput.trim().toUpperCase();

    if (!cleanCode) {
      setLoginError('Please enter your assigned Partner Referral Code (e.g., AJW-129822).');
      return;
    }

    // Reject pure numbers (phones) to enforce user requirement: login only using referral code
    if (/^\d{10}$/.test(cleanCode)) {
      setLoginError('Login with mobile number is not supported. Please enter your unique Partner Referral Code (e.g., AJW-129822).');
      return;
    }

    setIsLoggingIn(true);
    fetchPartnerData(cleanCode, true).finally(() => setIsLoggingIn(false));
  };

  // Sign out handler
  const handleSignOut = () => {
    localStorage.removeItem('ajw_active_partner_code');
    setPartner(null);
    setReferrals([]);
    setSettlements([]);
    setPartnerCodeInput('');
  };

  // Copy referral link helper (standardized domain)
  const copyReferralLink = (link: string) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(link);
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = link;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Copy partner code helper
  const copyPartnerCode = (code: string) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(code);
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = code;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const copyInviteLink = (link: string) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(link);
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = link;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    setCopiedInviteLink(true);
    setTimeout(() => setCopiedInviteLink(false), 2500);
  };

  const referralLink = partner ? `http://aaplajalgaonwala.com/ref/${partner.partnerCode}` : '';
  const inviteLink = partner ? `${window.location.origin}/partner-program?ref=${partner.partnerCode}` : '';
  const womanInviteMessage = partner ? `सस्नेह नमस्कार! 🙏\nमी आपला जळगाववालाच्या 'विमेन बिझनेस पार्टनर प्रोग्राम'मध्ये सामील होऊन घरबसल्या दर आठवड्याला चांगले पैसे कमवत आहे. तुम्हीही या सन्माननीय कार्यक्रमात सामील व्हा आणि स्वतःचा व्यवसाय सुरू करा.\nमाझ्या लिंकवरून नोंदणी करा:\n👉 ${inviteLink}` : '';

  // Calculate Partner Tier based on Total Sales
  const partnerTier = useMemo(() => {
    if (!partner) return { name: 'Bronze Partner', color: 'text-amber-700 bg-amber-100 border-amber-300', nextMilestone: 5000, progress: 0 };
    const sales = partner.totalSalesAmount || 0;
    if (sales >= 25000) {
      return { name: 'Diamond Partner', color: 'text-cyan-900 bg-cyan-100 border-cyan-300', nextMilestone: 50000, progress: Math.min(100, (sales / 50000) * 100) };
    }
    if (sales >= 10000) {
      return { name: 'Gold Partner', color: 'text-amber-900 bg-amber-200 border-amber-400', nextMilestone: 25000, progress: Math.min(100, (sales / 25000) * 100) };
    }
    if (sales >= 3000) {
      return { name: 'Silver Partner', color: 'text-slate-800 bg-slate-200 border-slate-300', nextMilestone: 10000, progress: Math.min(100, (sales / 10000) * 100) };
    }
    return { name: 'Bronze Starter', color: 'text-orange-900 bg-orange-100 border-orange-200', nextMilestone: 3000, progress: Math.min(100, (sales / 3000) * 100) };
  }, [partner]);

  // Filtered referrals by search term
  const filteredReferrals = useMemo(() => {
    if (!orderSearchTerm.trim()) return referrals;
    const q = orderSearchTerm.toLowerCase();
    return referrals.filter(
      (r) =>
        r.orderNumber.toLowerCase().includes(q) ||
        (r.customerCity && r.customerCity.toLowerCase().includes(q)) ||
        (r.status && r.status.toLowerCase().includes(q))
    );
  }, [referrals, orderSearchTerm]);

  // Share messages for WhatsApp
  const shareMessages = {
    marathi: `सस्नेह नमस्कार! 🙏\nआपला जळगाववालाचे १००% अस्सल आणि ताजे खान्देशी बनाना चिप्स, स्पेशल शेव आणि मसाले आता ऑनलाइन ऑर्डर करा.\nमाझ्या लिंकवरून खरेदी केल्यास तुम्हाला मिळतील त्वरित ४% विशेष सूट!\n👉 ऑर्डर करा: ${referralLink}`,
    hindi: `नमस्ते! 🙏\nआपला जळगाववाला के शुद्ध और कुरकुरे खान्देशी बनाना चिप्स, नमकीन और मसाले घर बैठे मंगवाएं।\nमेरी लिंक से ऑर्डर करने पर आपको मिलेगा इंस्टेंट ४% डिस्काउंट!\n👉 अभी ऑर्डर करें: ${referralLink}`,
    english: `Hello! Enjoy authentic, fresh Khandeshi Banana Chips, Masalas & Savories from Aapla Jalgaonwala with an exclusive 4% instant cart discount!\n👉 Order now: ${referralLink}`
  };

  return (
    <div className="min-h-screen bg-white text-stone-800 pb-20">
      <SEO
        title="Woman Partner Login & Dashboard | Aapla Jalgaonwala"
        description="Official Woman Partner Login portal for registered Aapla Jalgaonwala Women Business Partners. Monitor live referral sales, 12% commission, and Sunday bank payouts."
      />

      {/* Top Banner Header */}
      <div className="bg-stone-900 text-white py-10 sm:py-14 border-b border-stone-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#9B111E]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <Container>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold uppercase tracking-wider border border-amber-500/30">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: '3s' }} />
                <span>Certified Woman Business Partner</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black font-serif tracking-tight text-white leading-tight">
                Woman Partner Login & Dashboard
              </h1>
              <p className="text-xs sm:text-sm text-stone-300 max-w-xl leading-relaxed">
                Live earnings and referral activity updated in real time. Monitor your customer orders, 12% commissions, and weekly Sunday payouts.
              </p>
            </div>

            {partner && (
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  onClick={() => fetchPartnerData(partner.partnerCode, false)}
                  disabled={isRefreshing}
                  className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold inline-flex items-center gap-2 transition-all cursor-pointer border border-white/10 disabled:opacity-50 hover:scale-[1.02]"
                  title="Refresh latest partner data"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
                  <span>{isRefreshing ? 'Refreshing...' : 'Refresh Data'}</span>
                </button>

                <button
                  onClick={handleSignOut}
                  className="px-4 py-2.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/25 text-rose-200 hover:text-white text-xs font-bold inline-flex items-center gap-2 transition-all cursor-pointer border border-rose-500/20 hover:scale-[1.02]"
                  title="Logout from Partner Session"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </Container>
      </div>

      <Container className="py-8">
        {loading ? (
          /* Loading State */
          <div className="bg-white p-12 rounded-3xl border border-stone-200 shadow-sm text-center space-y-4 my-8 max-w-lg mx-auto">
            <RefreshCw className="w-10 h-10 text-[#9B111E] animate-spin mx-auto" />
            <div>
              <p className="text-sm font-bold text-stone-900">Loading Live Records...</p>
              <p className="text-xs text-stone-500 mt-1">Retrieving verified partner sales and commission ledger</p>
            </div>
          </div>
        ) : !partner ? (
          /* Strict Partner Referral Code Login Screen + Marketing Playbook */
          <div className="max-w-4xl mx-auto my-8 space-y-10">
            {/* Login Card */}
            <div className="max-w-md mx-auto bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-xl space-y-6">
              <div className="text-center space-y-2">
                <div className="w-14 h-14 rounded-2xl bg-amber-100 text-[#9B111E] flex items-center justify-center mx-auto border border-amber-200">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <h2 className="text-xl font-bold font-serif text-stone-900">Woman Partner Login</h2>
                <p className="text-xs text-stone-500">
                  Login is secured exclusively using your assigned <strong>Partner Referral Code</strong>.
                </p>
              </div>

              {loginError && (
                <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs font-medium flex items-start gap-2.5 animate-in fade-in duration-200">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="partner-code-input" className="text-xs font-bold text-stone-700 flex items-center justify-between">
                    <span>Partner Referral Code *</span>
                    <span className="text-[10px] text-stone-400 font-normal">e.g. AJW-289822</span>
                  </label>
                  <div className="relative">
                    <input
                      id="partner-code-input"
                      type="text"
                      required
                      placeholder="AJW-XXXXXX"
                      value={partnerCodeInput}
                      onChange={(e) => setPartnerCodeInput(e.target.value.toUpperCase())}
                      className="w-full px-4 py-3 rounded-xl border border-stone-300 text-sm uppercase font-mono font-bold tracking-wider focus:ring-2 focus:ring-[#9B111E] focus:outline-none placeholder:text-stone-300"
                    />
                    <Sparkles className="w-4 h-4 text-amber-500 absolute right-3.5 top-3.5" />
                  </div>
                  <p className="text-[11px] text-stone-400 leading-tight">
                    Enter the code you received after registration. Mobile number login is disabled.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full py-3.5 rounded-xl bg-[#9B111E] hover:bg-[#800E19] text-white font-bold text-sm shadow-lg shadow-[#9B111E]/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isLoggingIn ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Verifying Account...</span>
                    </>
                  ) : (
                    <>
                      <span>Open Analytics Dashboard</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="pt-4 border-t border-stone-100 text-center space-y-2">
                <p className="text-xs text-stone-500">Not enrolled in Women Partner Program?</p>
                <button
                  onClick={() => navigate('/partner-program')}
                  className="text-xs font-bold text-[#9B111E] hover:underline cursor-pointer inline-flex items-center gap-1"
                >
                  <span>Register for ₹699 & Get Instant Code</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Marketing Tips & Tricks Section on Login Screen */}
            <div className="bg-stone-50 rounded-3xl border border-stone-200 p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 border border-amber-200">
                    <Lightbulb className="w-5 h-5 text-amber-700" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black font-serif text-stone-900">
                      Women Partner Growth Playbook: Marketing Tips & Tricks
                    </h3>
                    <p className="text-xs text-stone-600">
                      Proven daily strategies used by top women partners to generate ₹25,000 to ₹50,000+ monthly commission
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold shrink-0 self-start sm:self-auto border border-emerald-200">
                  <Award className="w-3.5 h-3.5 text-emerald-700" />
                  12% Guaranteed Commission
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Tip 1 */}
                <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-2.5">
                  <div className="flex items-center gap-2 text-stone-900 font-bold text-sm">
                    <span className="w-6 h-6 rounded-full bg-[#9B111E] text-white text-xs flex items-center justify-center font-bold">1</span>
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span>The 3-Time Daily WhatsApp Status Routine</span>
                  </div>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    <strong>• 8:30 AM:</strong> Post morning tea with Khandeshi Banana chips photo.<br />
                    <strong>• 1:30 PM:</strong> Post your 4% discount coupon link with the festival combo.<br />
                    <strong>• 6:30 PM:</strong> Share an authentic customer review or snack recommendation.
                  </p>
                </div>

                {/* Tip 2 */}
                <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-2.5">
                  <div className="flex items-center gap-2 text-stone-900 font-bold text-sm">
                    <span className="w-6 h-6 rounded-full bg-[#9B111E] text-white text-xs flex items-center justify-center font-bold">2</span>
                    <Coffee className="w-4 h-4 text-[#D9531E]" />
                    <span>Society Chai & Neighbor Tasting Session</span>
                  </div>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    Keep a bowl of Jalgaon banana chips or Kolhapuri Bhadang during building meetings or evening tea. Let them taste the wood-fired purity, then share your instant 4% discount link.
                  </p>
                </div>

                {/* Tip 3 */}
                <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-2.5">
                  <div className="flex items-center gap-2 text-stone-900 font-bold text-sm">
                    <span className="w-6 h-6 rounded-full bg-[#9B111E] text-white text-xs flex items-center justify-center font-bold">3</span>
                    <Gift className="w-4 h-4 text-purple-600" />
                    <span>Festive & Family WhatsApp Groups</span>
                  </div>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    Before Diwali, Ganpati, Sankranti, and family gatherings, share curated gift combos in family groups across Pune, Mumbai, Nashik, and Bangalore for bulk orders!
                  </p>
                </div>

                {/* Tip 4 */}
                <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-2.5">
                  <div className="flex items-center gap-2 text-stone-900 font-bold text-sm">
                    <span className="w-6 h-6 rounded-full bg-[#9B111E] text-white text-xs flex items-center justify-center font-bold">4</span>
                    <Instagram className="w-4 h-4 text-pink-600" />
                    <span>Instagram Bio & WhatsApp Description Link</span>
                  </div>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    Add your personal referral URL to your WhatsApp About and Instagram bio. Every time someone asks "Where did you get these chips?", point them directly to your link.
                  </p>
                </div>
              </div>

              {/* Earnings Table Highlight */}
              <div className="bg-amber-50 rounded-2xl p-4 sm:p-5 border border-amber-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center sm:text-left">
                  <div className="text-xs font-bold text-amber-900 uppercase tracking-wider">Estimated Monthly Earnings</div>
                  <p className="text-xs text-amber-800">10 regular family customers (₹2,500/mo each) = <strong>₹3,000 weekly / ₹12,000 monthly</strong> direct profit!</p>
                </div>
                <div className="text-center sm:text-right shrink-0">
                  <div className="text-xl sm:text-2xl font-black text-[#9B111E]">₹120 / ₹1,000</div>
                  <div className="text-[11px] text-stone-500">Credited every Sunday to your bank</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Full Creative Partner Analytics Dashboard */
          <div className="space-y-6 sm:space-y-8">
            
            {/* Conditional Status Banner: Pending Review Notice */}
            {partner.status === 'pending' && (
              <div className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-5 sm:p-6 shadow-md text-amber-950 space-y-3 animate-in fade-in duration-300">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-amber-200 text-amber-900 flex items-center justify-center shrink-0 mt-0.5">
                    <Clock className="w-5 h-5 text-amber-800 animate-pulse" />
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900 text-[11px] font-extrabold uppercase tracking-wider">
                        Application Status: Pending Approval
                      </span>
                      <span className="text-xs text-amber-800 font-medium">
                        (Registration Received)
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-black font-serif text-stone-900">
                      Your Women Partner Application is Under Review
                    </h3>
                    <p className="text-xs sm:text-sm text-stone-700 leading-relaxed">
                      You have registered successfully! Your account and payout bank details are currently being verified by our team. <strong>You will be approved shortly.</strong>
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-2 border-t border-amber-200/80 text-xs text-stone-700">
                  <div className="flex items-center gap-2 bg-white/70 p-2.5 rounded-xl border border-amber-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Confirmation email sent to <strong>{partner.email}</strong></span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/70 p-2.5 rounded-xl border border-amber-200">
                    <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Referral Code: <strong className="font-mono text-stone-900">{partner.partnerCode}</strong></span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/70 p-2.5 rounded-xl border border-amber-200">
                    <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>4% Customer Coupon activates upon approval</span>
                  </div>
                </div>
              </div>
            )}

            {/* Conditional Status Banner: Suspended Notice */}
            {partner.status === 'suspended' && (
              <div className="bg-rose-50 border-2 border-rose-300 rounded-3xl p-5 sm:p-6 shadow-md text-rose-950 space-y-2 animate-in fade-in duration-300">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-rose-200 text-rose-800 flex items-center justify-center shrink-0">
                    <AlertCircle className="w-5 h-5 text-rose-700" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-rose-900">Partner Account Suspended</h3>
                    <p className="text-xs text-rose-700">Your partner account has been temporarily suspended. Please reach out to partner support for reactivation.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Top Partner Profile & Performance Executive Card (Refined Light Theme) */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-stone-200/80 shadow-xs space-y-8">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pb-6 border-b border-stone-100">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-6 flex-1">
                  {/* Monogram Avatar with luxury branding look */}
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-gradient-to-tr from-[#800F17] to-[#A31621] text-white font-serif font-bold text-2xl sm:text-3xl flex items-center justify-center shrink-0 shadow-sm border border-red-950/10 select-none relative">
                    <span className="relative z-10">
                      {partner.fullName
                        ? partner.fullName.trim().split(' ').length > 1
                          ? `${partner.fullName.trim().split(' ')[0][0]}${partner.fullName.trim().split(' ').slice(-1)[0][0]}`.toUpperCase()
                          : partner.fullName.slice(0, 2).toUpperCase()
                        : 'WP'}
                    </span>
                    <div className="absolute inset-0 rounded-xl border border-white/10 pointer-events-none" />
                  </div>

                  <div className="space-y-3 flex-1 min-w-0">
                    {/* Status & Tier Badges */}
                    <div className="flex flex-wrap items-center gap-2">
                      {partner.status === 'pending' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-50/80 text-amber-800 text-[10px] font-bold uppercase tracking-wider border border-amber-200/50 shadow-3xs">
                          <Clock className="w-3 h-3 text-amber-600 animate-pulse" />
                          <span>Pending Admin Approval</span>
                        </span>
                      ) : partner.status === 'suspended' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-50/80 text-rose-800 text-[10px] font-bold uppercase tracking-wider border border-rose-200/50 shadow-3xs">
                          <AlertCircle className="w-3 h-3 text-rose-600" />
                          <span>Account Suspended</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50/80 text-emerald-800 text-[10px] font-black uppercase tracking-wider border border-emerald-200/50 shadow-3xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                          <span>Verified Active Partner</span>
                        </span>
                      )}

                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wider border shadow-3xs ${
                        partnerTier.name === 'Diamond Partner' ? 'bg-cyan-50/80 text-cyan-800 border-cyan-200/50' :
                        partnerTier.name === 'Gold Partner' ? 'bg-amber-50/80 text-amber-800 border-amber-200/50' :
                        partnerTier.name === 'Silver Partner' ? 'bg-slate-50/80 text-slate-800 border-slate-200/50' :
                        'bg-orange-50/80 text-orange-800 border-orange-200/50'
                      }`}>
                        <Award className="w-3 h-3 shrink-0" />
                        <span>{partnerTier.name}</span>
                      </span>
                    </div>

                    <h2 className="text-xl sm:text-2xl font-serif font-black text-stone-950 tracking-tight leading-none truncate">
                      {partner.fullName}
                    </h2>

                    {/* Partner Metadata Chips */}
                    <div className="flex flex-wrap items-center gap-2 text-xs pt-1">
                      <div className="inline-flex items-center gap-1.5 bg-orange-50/40 px-2.5 py-1 rounded-lg border border-orange-200/50 shadow-3xs">
                        <Sparkles className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                        <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Partner Code</span>
                        <strong className="text-[#9B111E] font-mono text-xs font-black tracking-wider bg-orange-100/40 px-1.5 py-0.5 rounded border border-orange-200/30">
                          {partner.partnerCode}
                        </strong>
                        <button
                          type="button"
                          onClick={() => copyPartnerCode(partner.partnerCode)}
                          className="p-0.5 hover:bg-stone-100 rounded transition-colors cursor-pointer text-stone-400 hover:text-stone-700"
                          title="Copy Partner Code"
                        >
                          {copiedCode ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>

                      <span className="inline-flex items-center gap-1.5 bg-stone-50/80 px-2.5 py-1 rounded-lg border border-stone-200/50 shadow-3xs text-stone-600 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        <span>{partner.city}, {partner.state}</span>
                      </span>

                      <span className="inline-flex items-center gap-1.5 bg-stone-50/80 px-2.5 py-1 rounded-lg border border-stone-200/50 shadow-3xs text-stone-600 font-medium">
                        <Phone className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        <span>{partner.phone}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Earnings Scheme Highlight Box */}
                <div className="w-full lg:w-auto shrink-0 mt-2 lg:mt-0">
                  <div className="bg-gradient-to-br from-stone-50/60 via-white to-stone-50/40 p-5 sm:p-6 rounded-xl border border-stone-200/80 text-left lg:text-right space-y-2.5 shadow-3xs min-w-[280px]">
                    <div className="text-[10px] text-stone-400 uppercase tracking-widest font-black flex items-center lg:justify-end gap-1.5">
                      <Percent className="w-3 h-3 text-[#D9531E]" />
                      <span>Partner Earnings Model</span>
                    </div>
                    <div className="text-2xl font-black text-[#9B111E] tracking-tight">
                      12% Direct Commission
                    </div>
                    <div className="flex items-center lg:justify-end">
                      <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200/40 text-[10px] font-extrabold px-2 py-0.5 rounded-md">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>+ 4% Instant Customer Cart Discount</span>
                      </span>
                    </div>
                    <div className="text-[10px] text-stone-400 flex items-center lg:justify-end gap-1 font-bold">
                      <Calendar className="w-3.5 h-3.5 text-stone-300 shrink-0" />
                      <span>Payout every Sunday (Bank / UPI)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress to Next Milestone Bar */}
              <div className="space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Tier Progression</span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-black text-[#9B111E] bg-[#9B111E]/5 px-2 py-0.5 rounded border border-[#9B111E]/10 uppercase tracking-wider shrink-0">
                      Next Level: {partnerTier.name}
                    </span>
                  </div>
                  <span className="text-stone-900 font-extrabold font-mono text-sm">
                    ₹{(partner.totalSalesAmount || 0).toLocaleString('en-IN')}{' '}
                    <span className="text-stone-300 font-normal">/</span>{' '}
                    ₹{partnerTier.nextMilestone.toLocaleString('en-IN')}{' '}
                    <span className="text-[10px] font-bold text-stone-400 uppercase ml-1">Goal</span>
                  </span>
                </div>

                <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden border border-stone-200/30">
                  <div
                    className="bg-gradient-to-r from-orange-500 to-[#9B111E] h-full rounded-full transition-all duration-700"
                    style={{ width: `${partnerTier.progress}%` }}
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <span className="text-stone-500 font-medium leading-relaxed max-w-xl">
                    Unlock a higher Partner Tier and reputation badges by spreading your link to more customers!
                  </span>
                  <span className="font-extrabold text-[#9B111E] bg-[#9B111E]/5 px-2.5 py-1 rounded-md border border-[#9B111E]/10 self-start sm:self-auto shrink-0">
                    {partnerTier.progress.toFixed(1)}% Achieved
                  </span>
                </div>
              </div>
            </div>

            {/* Top Level Profile Tab Navigation */}
            <div className="flex border-b border-stone-200 overflow-x-auto no-scrollbar gap-1 pt-2">
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className={`flex items-center gap-2 px-5 py-3.5 text-xs font-black transition-all border-b-2 shrink-0 cursor-pointer ${
                  activeTab === 'overview'
                    ? 'border-[#9B111E] text-[#9B111E] bg-[#9B111E]/5 rounded-t-2xl'
                    : 'border-transparent text-stone-600 hover:text-stone-900 hover:bg-stone-50 rounded-t-2xl'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Overview</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('analytics')}
                className={`flex items-center gap-2 px-5 py-3.5 text-xs font-black transition-all border-b-2 shrink-0 cursor-pointer ${
                  activeTab === 'analytics'
                    ? 'border-[#9B111E] text-[#9B111E] bg-[#9B111E]/5 rounded-t-2xl'
                    : 'border-transparent text-stone-600 hover:text-stone-900 hover:bg-stone-50 rounded-t-2xl'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Analytics & Growth</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('commissions')}
                className={`flex items-center gap-2 px-5 py-3.5 text-xs font-black transition-all border-b-2 shrink-0 cursor-pointer ${
                  activeTab === 'commissions'
                    ? 'border-[#9B111E] text-[#9B111E] bg-[#9B111E]/5 rounded-t-2xl'
                    : 'border-transparent text-stone-600 hover:text-stone-900 hover:bg-stone-50 rounded-t-2xl'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Commissions & Payouts</span>
                {settlements.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-extrabold">
                    {settlements.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('orders')}
                className={`flex items-center gap-2 px-5 py-3.5 text-xs font-black transition-all border-b-2 shrink-0 cursor-pointer ${
                  activeTab === 'orders'
                    ? 'border-[#9B111E] text-[#9B111E] bg-[#9B111E]/5 rounded-t-2xl'
                    : 'border-transparent text-stone-600 hover:text-stone-900 hover:bg-stone-50 rounded-t-2xl'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Customer Orders</span>
                <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-stone-200 text-stone-800 font-extrabold">
                  {referrals.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('toolkit')}
                className={`flex items-center gap-2 px-5 py-3.5 text-xs font-black transition-all border-b-2 shrink-0 cursor-pointer ${
                  activeTab === 'toolkit'
                    ? 'border-[#9B111E] text-[#9B111E] bg-[#9B111E]/5 rounded-t-2xl'
                    : 'border-transparent text-stone-600 hover:text-stone-900 hover:bg-stone-50 rounded-t-2xl'
                }`}
              >
                <Share2 className="w-4 h-4" />
                <span>Marketing Toolkit</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('settings')}
                className={`flex items-center gap-2 px-5 py-3.5 text-xs font-black transition-all border-b-2 shrink-0 cursor-pointer ${
                  activeTab === 'settings'
                    ? 'border-[#9B111E] text-[#9B111E] bg-[#9B111E]/5 rounded-t-2xl'
                    : 'border-transparent text-stone-600 hover:text-stone-900 hover:bg-stone-50 rounded-t-2xl'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>Settings & Bank</span>
              </button>
            </div>

            {/* TAB 1: OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
                {/* 6 Responsive Metric Cards (Delivery-Enforced Real DB values) */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                  <div className="bg-white p-4.5 sm:p-5 rounded-3xl border border-stone-200 shadow-xs space-y-2 hover:border-[#D9531E]/20 transition-all">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Referred Orders</span>
                      <div className="p-1.5 sm:p-2 rounded-xl bg-stone-100 text-stone-700 shrink-0">
                        <ShoppingBag className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-stone-900">
                      {partner.totalOrdersCount || referrals.length}
                    </div>
                    <p className="text-[10px] text-stone-500 font-medium">
                      {deliveredReferrals.length} Delivered · {onHoldReferrals.length} In Transit
                    </p>
                  </div>

                  <div className="bg-white p-4.5 sm:p-5 rounded-3xl border border-stone-200 shadow-xs space-y-2 hover:border-[#D9531E]/20 transition-all">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Gross Sales</span>
                      <div className="p-1.5 sm:p-2 rounded-xl bg-blue-50 text-blue-700 shrink-0">
                        <TrendingUp className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-stone-900">
                      ₹{(partner.totalSalesAmount || 0).toLocaleString('en-IN')}
                    </div>
                    <p className="text-[10px] text-stone-400">Total customer transaction volume</p>
                  </div>

                  {/* Delivered Commission - Strictly for Delivered Orders */}
                  <div className="bg-white p-4.5 sm:p-5 rounded-3xl border border-emerald-200/90 shadow-xs space-y-2 hover:border-emerald-300 transition-all">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Commission Earned</span>
                      <div className="p-1.5 sm:p-2 rounded-xl bg-emerald-50 text-emerald-700 shrink-0">
                        <IndianRupee className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-emerald-600">
                      ₹{deliveredCommission.toLocaleString('en-IN')}
                    </div>
                    <p className="text-[10px] text-emerald-700 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span>Unlocked from delivered orders</span>
                    </p>
                  </div>

                  {/* Amount On Hold - Orders not yet delivered */}
                  <div className="bg-amber-50/90 p-4.5 sm:p-5 rounded-3xl border border-amber-200 shadow-xs space-y-2 hover:border-amber-300 transition-all">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider">Amount On Hold</span>
                      <div className="p-1.5 sm:p-2 rounded-xl bg-amber-100 text-amber-900 shrink-0">
                        <Clock className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-amber-900">
                      ₹{onHoldCommission.toLocaleString('en-IN')}
                    </div>
                    <p className="text-[10px] text-amber-800 font-bold">
                      Order yet to be delivered
                    </p>
                  </div>

                  <div className="bg-rose-50 p-4.5 sm:p-5 rounded-3xl border border-rose-200 shadow-xs space-y-2 hover:border-rose-300 transition-all">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-rose-900 uppercase tracking-wider">Referral Bonus</span>
                      <div className="p-1.5 sm:p-2 rounded-xl bg-rose-100 text-rose-800 shrink-0">
                        <Users className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-rose-700">
                      ₹{(partner.referralBonusEarned || 0).toLocaleString('en-IN')}
                    </div>
                    <p className="text-[10px] text-rose-800 font-bold">Invited woman partners</p>
                  </div>

                  <div className="bg-white p-4.5 sm:p-5 rounded-3xl border border-stone-200 shadow-xs space-y-2 hover:border-[#D9531E]/20 transition-all">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider">Sunday Payout</span>
                      <div className="p-1.5 sm:p-2 rounded-xl bg-amber-100 text-amber-800 shrink-0">
                        <Wallet className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-[#9B111E]">
                      ₹{(partner.pendingCommission || 0).toLocaleString('en-IN')}
                    </div>
                    <p className="text-[10px] text-amber-800 font-bold">Payable on {nextSundayFormatted.split(',')[0]}</p>
                  </div>
                </div>

                {/* Delivery-Based Commission Notice */}
                <div className="bg-linear-to-r from-amber-50 to-orange-50 border border-amber-200/90 rounded-2xl p-3.5 sm:p-4 flex items-start gap-3 shadow-2xs">
                  <div className="p-2 rounded-xl bg-amber-100 text-amber-900 shrink-0 mt-0.5">
                    <Info className="w-4 h-4" />
                  </div>
                  <div className="space-y-0.5 text-xs">
                    <p className="font-extrabold text-stone-900">
                      Commission Delivery Policy:
                    </p>
                    <p className="text-stone-600 leading-relaxed text-[11px] sm:text-xs">
                      Commission (12%) is unlocked and added to your payable balance once customer orders are marked <strong className="text-emerald-800 font-bold">Delivered</strong>. 
                      Orders currently being processed or in transit are shown under <strong className="text-amber-900 font-bold">Amount On Hold</strong> (showing <span className="italic font-semibold text-amber-900">"Order yet to be delivered"</span>) and are credited immediately upon delivery.
                    </p>
                  </div>
                </div>

                 {/* 2-Column Responsive Grid: Referral Suite (7 Cols Stack) & Payout Workflow (5 Cols) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                  {/* Left Column Stack (7 Cols) */}
                  <div className="lg:col-span-7 flex flex-col gap-6">
                    {/* Card 1: Your Official Customer Referral Hub */}
                    <div className="bg-white p-6 sm:p-7 rounded-3xl border border-stone-200/90 shadow-sm flex flex-col justify-between space-y-5 flex-1">
                      <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-4">
                          <div className="flex items-start sm:items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center shrink-0 border border-amber-200">
                              <Share2 className="w-5 h-5 text-[#D9531E]" />
                            </div>
                            <div>
                              <h3 className="text-base sm:text-lg font-extrabold text-stone-900 font-serif">
                                Your Official Customer Referral Link
                              </h3>
                              <p className="text-xs text-stone-600">
                                Customers get an instant <strong className="text-emerald-700">4% discount</strong>, and you earn <strong className="text-[#9B111E]">12% commission</strong> automatically.
                              </p>
                            </div>
                          </div>

                          {copiedLink && (
                            <span className="text-xs text-emerald-700 font-bold flex items-center gap-1 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 shrink-0 self-start sm:self-auto">
                              <Check className="w-3.5 h-3.5 text-emerald-600" /> Link Copied!
                            </span>
                          )}
                        </div>

                        {/* Primary Link Share Container */}
                        <div className="space-y-2">
                          <label className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                            Personal Referral Web Link
                          </label>
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 bg-stone-50 p-2.5 rounded-2xl border border-stone-200">
                            <div className="flex-1 px-3 py-2 text-xs font-mono text-stone-900 break-all select-all font-bold bg-white rounded-xl border border-stone-200 shadow-2xs">
                              {referralLink}
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => copyReferralLink(referralLink)}
                                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-xs whitespace-nowrap"
                              >
                                <Copy className="w-3.5 h-3.5" />
                                <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
                              </button>

                              <a
                                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessages[shareLanguage])}`}
                                target="_blank"
                                rel="noreferrer"
                                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-xs whitespace-nowrap"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                                <span>WhatsApp Share</span>
                              </a>
                            </div>
                          </div>
                        </div>

                        {/* WhatsApp Pre-written Message Language Selector */}
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <span className="text-[11px] font-bold text-stone-500">WhatsApp text language:</span>
                          <div className="inline-flex rounded-xl bg-stone-100 p-1 border border-stone-200/80">
                            {(['marathi', 'hindi', 'english'] as const).map((lang) => (
                              <button
                                key={lang}
                                type="button"
                                onClick={() => setShareLanguage(lang)}
                                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all capitalize cursor-pointer ${
                                  shareLanguage === lang
                                    ? 'bg-white text-[#9B111E] shadow-2xs'
                                    : 'text-stone-600 hover:text-stone-900'
                                }`}
                              >
                                {lang === 'marathi' ? 'मराठी' : lang === 'hindi' ? 'हिंदी' : 'English'}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Checkout Coupon Code Card */}
                      <div className="bg-gradient-to-r from-amber-50/70 to-orange-50/40 p-4 rounded-2xl border border-dashed border-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-0.5">
                          <div className="text-[11px] font-extrabold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                            <Gift className="w-3.5 h-3.5 text-[#D9531E]" />
                            <span>Checkout Coupon Code for Direct Website Visitors</span>
                          </div>
                          <p className="text-xs text-stone-600">
                            Customers ordering on website can enter code <strong className="font-mono text-stone-900 bg-white px-1.5 py-0.5 rounded border border-amber-200 font-bold">{partner.partnerCode}</strong> at checkout.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => copyPartnerCode(partner.partnerCode)}
                          className="px-4 py-2 rounded-xl bg-white hover:bg-stone-50 text-[#9B111E] border border-amber-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-2xs shrink-0 whitespace-nowrap"
                        >
                          {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedCode ? 'Code Copied!' : 'Copy Code'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Card 1B: Invite Another Woman & Earn ₹200 (Minimal & Visible) */}
                    <div className="bg-gradient-to-br from-rose-50/70 via-rose-50/40 to-orange-50/40 rounded-2xl border border-rose-200/80 p-4 sm:p-5 shadow-2xs space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div className="flex items-start sm:items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center shrink-0 border border-rose-200">
                            <Users className="w-4.5 h-4.5 text-rose-700" />
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-sm sm:text-base font-extrabold text-stone-900 font-serif">
                                Invite Another Woman & Earn ₹200!
                              </h3>
                              <span className="text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full border border-rose-200 shrink-0">
                                ₹200 Reward
                              </span>
                            </div>
                            <p className="text-xs text-stone-600 mt-0.5">
                              Share your unique invite link. When they register as a Partner, you get a <strong className="text-rose-700 font-bold">₹200 reward</strong> automatically!
                            </p>
                          </div>
                        </div>

                        {copiedInviteLink && (
                          <span className="text-xs text-emerald-700 font-bold flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 shrink-0 self-start sm:self-center">
                            <Check className="w-3.5 h-3.5 text-emerald-600" /> Link Copied
                          </span>
                        )}
                      </div>

                      {/* Personal Invite Link Bar */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-white p-2 rounded-xl border border-rose-200/80 shadow-2xs">
                        <div className="flex-1 px-3 py-1.5 text-xs font-mono text-stone-900 truncate select-all font-semibold bg-stone-50 rounded-lg border border-stone-200/70">
                          {inviteLink}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            id="copy-invite-link-btn"
                            onClick={() => copyInviteLink(inviteLink)}
                            className="flex-1 sm:flex-none px-3.5 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-2xs whitespace-nowrap"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            <span>{copiedInviteLink ? 'Copied!' : 'Copy Link'}</span>
                          </button>

                          <a
                            href={`https://api.whatsapp.com/send?text=${encodeURIComponent(womanInviteMessage)}`}
                            target="_blank"
                            rel="noreferrer"
                            id="whatsapp-invite-link-btn"
                            className="flex-1 sm:flex-none px-3.5 py-2 rounded-lg bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-2xs whitespace-nowrap"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>WhatsApp</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: How Earnings & Sunday Payouts Work (5 Cols) */}
                  <div className="lg:col-span-5 bg-white p-6 sm:p-7 rounded-3xl border border-stone-200/90 shadow-sm flex flex-col justify-between space-y-5">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between gap-2 border-b border-stone-100 pb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 border border-emerald-200">
                            <HelpCircle className="w-5 h-5 text-emerald-700" />
                          </div>
                          <div>
                            <h4 className="text-base sm:text-lg font-extrabold text-stone-900 font-serif">
                              How Earnings & Payouts Work
                            </h4>
                            <p className="text-xs text-stone-500">100% automated & transparent</p>
                          </div>
                        </div>

                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold shrink-0">
                          <Calendar className="w-3 h-3 text-emerald-600" />
                          Sunday Payout
                        </span>
                      </div>

                      {/* Connected Stepper Timeline */}
                      <div className="space-y-3.5 relative">
                        {/* Step 1 */}
                        <div className="flex items-start gap-3 relative">
                          <div className="w-7 h-7 rounded-full bg-[#9B111E] text-white text-xs font-black flex items-center justify-center shrink-0 shadow-2xs ring-2 ring-amber-100">
                            1
                          </div>
                          <div className="space-y-0.5 flex-1">
                            <h5 className="text-xs sm:text-sm font-bold text-stone-900">
                              Customer Orders with 4% Instant Off
                            </h5>
                            <p className="text-xs text-stone-600 leading-relaxed">
                              When friends or customers order via your link or code, they get an immediate 4% cart discount on snacks.
                            </p>
                          </div>
                        </div>

                        {/* Step 2 */}
                        <div className="flex items-start gap-3 relative">
                          <div className="w-7 h-7 rounded-full bg-amber-600 text-white text-xs font-black flex items-center justify-center shrink-0 shadow-2xs ring-2 ring-amber-100">
                            2
                          </div>
                          <div className="space-y-0.5 flex-1">
                            <h5 className="text-xs sm:text-sm font-bold text-stone-900">
                              12% Commission Unlocked Upon Delivery
                            </h5>
                            <p className="text-xs text-stone-600 leading-relaxed">
                              Orders in transit are tracked safely under <strong>Amount On Hold</strong> (showing <em>Order yet to be delivered</em>). Once marked delivered, your 12% commission is automatically unlocked for Sunday payout.
                            </p>
                          </div>
                        </div>

                        {/* Step 3 */}
                        <div className="flex items-start gap-3 relative">
                          <div className="w-7 h-7 rounded-full bg-emerald-600 text-white text-xs font-black flex items-center justify-center shrink-0 shadow-2xs ring-2 ring-emerald-100">
                            3
                          </div>
                          <div className="space-y-0.5 flex-1">
                            <h5 className="text-xs sm:text-sm font-bold text-stone-900">
                              Sunday Direct Bank / UPI Deposit
                            </h5>
                            <p className="text-xs text-stone-600 leading-relaxed">
                              Weekly balances are transferred to your bank/UPI every Sunday morning with official UTR settlement receipts.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Guarantee Footnote */}
                    <div className="bg-emerald-50/70 p-3 rounded-2xl border border-emerald-200/80 flex items-center gap-2.5 text-[11px] text-emerald-950 font-medium">
                      <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>Zero payout threshold • Direct IMPS/NEFT bank transfer • 100% verified tracking</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: ANALYTICS & GROWTH */}
            {activeTab === 'analytics' && (
              <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
                {/* Detailed Analytics KPI Row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
                  <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-sm space-y-1.5">
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Average Order Value (AOV)</span>
                    <span className="text-2xl sm:text-3xl font-black text-stone-900 block">
                      ₹{averageOrderValue.toLocaleString('en-IN')}
                    </span>
                    <p className="text-[11px] text-stone-500">Average customer cart size</p>
                  </div>

                  <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-sm space-y-1.5">
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Avg Commission / Order</span>
                    <span className="text-2xl sm:text-3xl font-black text-emerald-600 block">
                      ₹{averageCommissionPerOrder.toLocaleString('en-IN')}
                    </span>
                    <p className="text-[11px] text-emerald-700 font-medium">12% direct margin earned</p>
                  </div>

                  <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-sm space-y-1.5">
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Settlement Efficiency</span>
                    <span className="text-2xl sm:text-3xl font-black text-blue-700 block">
                      100%
                    </span>
                    <p className="text-[11px] text-stone-500">Automatic Sunday clearing</p>
                  </div>

                  <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-sm space-y-1.5">
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Current Sales Tier</span>
                    <span className="text-xl sm:text-2xl font-black text-[#9B111E] block truncate">
                      {partnerTier.name}
                    </span>
                    <p className="text-[11px] text-stone-500">{partnerTier.progress}% to next milestone</p>
                  </div>
                </div>

                {/* Partner Sales Tier Roadmap */}
                <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-6 sm:p-8 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
                    <div>
                      <h3 className="text-lg font-black font-serif text-stone-900">
                        Partner Tier Progression & Benefits Roadmap
                      </h3>
                      <p className="text-xs text-stone-500">
                        Higher lifetime sales unlock premium recognition badges, priority customer dispatch, and festive gift boxes.
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold shrink-0 self-start sm:self-auto border border-amber-200">
                      <Award className="w-3.5 h-3.5 text-amber-700" />
                      Current: {partnerTier.name}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Tier 1 */}
                    <div className={`p-5 rounded-2xl border transition-all space-y-3 ${
                      (partner.totalSalesAmount || 0) < 3000
                        ? 'bg-orange-50/80 border-orange-300 ring-2 ring-orange-200'
                        : 'bg-stone-50/80 border-stone-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-orange-950">Bronze Starter</span>
                        {(partner.totalSalesAmount || 0) >= 3000 && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                      </div>
                      <div className="text-base font-bold text-stone-900">₹0 – ₹3,000</div>
                      <ul className="text-xs text-stone-600 space-y-1.5">
                        <li>• 12% standard commission</li>
                        <li>• 4% customer discount</li>
                        <li>• Sunday bank payout</li>
                      </ul>
                    </div>

                    {/* Tier 2 */}
                    <div className={`p-5 rounded-2xl border transition-all space-y-3 ${
                      (partner.totalSalesAmount || 0) >= 3000 && (partner.totalSalesAmount || 0) < 10000
                        ? 'bg-slate-100/90 border-slate-400 ring-2 ring-slate-300'
                        : (partner.totalSalesAmount || 0) >= 10000
                        ? 'bg-stone-50/80 border-stone-200'
                        : 'bg-stone-50/50 border-stone-200 opacity-75'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-900">Silver Partner</span>
                        {(partner.totalSalesAmount || 0) >= 10000 && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                      </div>
                      <div className="text-base font-bold text-stone-900">₹3,000 – ₹10,000</div>
                      <ul className="text-xs text-stone-600 space-y-1.5">
                        <li>• 12% standard commission</li>
                        <li>• Silver verified badge</li>
                        <li>• Priority order packaging</li>
                      </ul>
                    </div>

                    {/* Tier 3 */}
                    <div className={`p-5 rounded-2xl border transition-all space-y-3 ${
                      (partner.totalSalesAmount || 0) >= 10000 && (partner.totalSalesAmount || 0) < 25000
                        ? 'bg-amber-100/90 border-amber-400 ring-2 ring-amber-300'
                        : (partner.totalSalesAmount || 0) >= 25000
                        ? 'bg-stone-50/80 border-stone-200'
                        : 'bg-stone-50/50 border-stone-200 opacity-75'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-amber-950">Gold Partner</span>
                        {(partner.totalSalesAmount || 0) >= 25000 && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                      </div>
                      <div className="text-base font-bold text-stone-900">₹10,000 – ₹25,000</div>
                      <ul className="text-xs text-stone-600 space-y-1.5">
                        <li>• 12% standard commission</li>
                        <li>• Free festive snack gift hamper</li>
                        <li>• Dedicated partner hotline</li>
                      </ul>
                    </div>

                    {/* Tier 4 */}
                    <div className={`p-5 rounded-2xl border transition-all space-y-3 ${
                      (partner.totalSalesAmount || 0) >= 25000
                        ? 'bg-cyan-100/90 border-cyan-400 ring-2 ring-cyan-300'
                        : 'bg-stone-50/50 border-stone-200 opacity-75'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-cyan-950">Diamond Partner</span>
                        {(partner.totalSalesAmount || 0) >= 50000 && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                      </div>
                      <div className="text-base font-bold text-stone-900">₹25,000+</div>
                      <ul className="text-xs text-stone-600 space-y-1.5">
                        <li>• 12% standard commission</li>
                        <li>• Diamond Leader trophy</li>
                        <li>• Annual partner summit pass</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: COMMISSIONS & PAYOUTS */}
            {activeTab === 'commissions' && (
              <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
                {/* Financial Overview Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white p-5 rounded-3xl border border-emerald-200 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Commission Earned</span>
                      <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                        <IndianRupee className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-emerald-600">
                      ₹{deliveredCommission.toLocaleString('en-IN')}
                    </div>
                    <p className="text-[10px] text-emerald-700 font-medium">Unlocked across delivered orders</p>
                  </div>

                  <div className="bg-amber-50/90 p-5 rounded-3xl border border-amber-200 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider">Amount On Hold</span>
                      <div className="p-2 rounded-xl bg-amber-100 text-amber-900">
                        <Clock className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-amber-900">
                      ₹{onHoldCommission.toLocaleString('en-IN')}
                    </div>
                    <p className="text-[10px] text-amber-800 font-bold">Order yet to be delivered</p>
                  </div>

                  <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Total Paid to Bank</span>
                      <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
                        <Building2 className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-blue-700">
                      ₹{totalSettledAmount.toLocaleString('en-IN')}
                    </div>
                    <p className="text-[10px] text-stone-500">Transferred via Sunday bank payouts</p>
                  </div>

                  <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider">Pending Sunday Payout</span>
                      <div className="p-2 rounded-xl bg-amber-100 text-amber-900">
                        <Wallet className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-[#9B111E]">
                      ₹{(partner.pendingCommission || 0).toLocaleString('en-IN')}
                    </div>
                    <p className="text-[10px] text-amber-800 font-bold">Scheduled for deposit on {nextSundayFormatted}</p>
                  </div>
                </div>

                {/* Sunday Settlement Receipts Table */}
                <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-6 sm:p-7 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
                    <div>
                      <h3 className="text-base font-extrabold text-stone-900 font-serif">Sunday Bank Transfer Receipts</h3>
                      <p className="text-xs text-stone-500">Official settlement records transferred directly to your bank account / UPI</p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold self-start sm:self-auto">
                      <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                      Next Payout: {nextSundayFormatted}
                    </span>
                  </div>

                  {settlements.length === 0 ? (
                    <div className="text-center py-12 px-4 rounded-2xl bg-stone-50 border border-dashed border-stone-300 space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
                        <CreditCard className="w-6 h-6 text-emerald-700" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-stone-800">No settlement transfers generated yet</h4>
                        <p className="text-xs text-stone-500 max-w-md mx-auto">
                          Weekly commissions are calculated every Saturday midnight and directly deposited to your verified bank account or UPI every Sunday. Official bank UTR reference numbers will appear here.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="overflow-x-auto border border-stone-200 rounded-2xl">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-stone-200 text-stone-500 uppercase tracking-wider text-[10px] bg-stone-50">
                            <th className="p-3.5 font-bold">Settlement Date</th>
                            <th className="p-3.5 font-bold">Amount Transferred</th>
                            <th className="p-3.5 font-bold">Payment Method</th>
                            <th className="p-3.5 font-bold">Bank UTR / Reference</th>
                            <th className="p-3.5 text-center font-bold">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                          {settlements.map((stl) => (
                            <tr key={stl.id} className="hover:bg-emerald-50/40 transition-colors">
                              <td className="p-3.5 font-semibold text-stone-900">{stl.settlementWeek || stl.settlementDate}</td>
                              <td className="p-3.5 font-black text-emerald-600 text-sm">₹{stl.amount}</td>
                              <td className="p-3.5 text-stone-600">{stl.paymentMethod}</td>
                              <td className="p-3.5 font-mono text-xs text-stone-700">{stl.transactionReference}</td>
                              <td className="p-3.5 text-center">
                                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                  {stl.status || 'Completed'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: CUSTOMER ORDERS */}
            {activeTab === 'orders' && (
              <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-6 sm:p-7 space-y-5 animate-in fade-in duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
                  <div>
                    <h3 className="text-base font-extrabold text-stone-900 font-serif">Referred Customer Orders</h3>
                    <p className="text-xs text-stone-500 font-medium">
                      Every customer purchase with your code generates 12% commission, unlocked upon verified delivery
                    </p>
                  </div>

                  {referrals.length > 0 && (
                    <div className="relative w-full sm:w-64">
                      <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search order # or city..."
                        value={orderSearchTerm}
                        onChange={(e) => setOrderSearchTerm(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 rounded-xl border border-stone-200 text-xs focus:outline-none focus:ring-1 focus:ring-[#9B111E] focus:border-[#9B111E] bg-stone-50"
                      />
                    </div>
                  )}
                </div>

                {/* Delivery Rule Notice */}
                <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-3 sm:p-3.5 flex items-start gap-2.5 text-xs text-stone-700">
                  <Info className="w-4 h-4 text-amber-800 shrink-0 mt-0.5" />
                  <p className="leading-relaxed text-[11px] sm:text-xs">
                    <strong>Delivery-Based Commission Policy:</strong> Commission is only unlocked and credited to your Sunday payout once the order is marked <strong>Delivered</strong>. For pending or in-transit shipments, the amount is held securely as <strong>Amount On Hold</strong> with the message <em>"Order yet to be delivered"</em>.
                  </p>
                </div>

                {referrals.length === 0 ? (
                  <div className="text-center py-12 px-4 rounded-2xl bg-stone-50 border border-dashed border-stone-300 space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
                      <ShoppingBag className="w-6 h-6 text-[#9B111E]" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-stone-800">No referral orders placed yet</h4>
                      <p className="text-xs text-stone-500 max-w-md mx-auto">
                        Share your referral link on WhatsApp Status, Instagram, and with friends & family. Once an order is placed and delivered, your 12% commission unlocks automatically!
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyReferralLink(referralLink)}
                      className="px-4 py-2.5 rounded-xl bg-[#9B111E] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Referral Link</span>
                    </button>
                  </div>
                ) : filteredReferrals.length === 0 ? (
                  <div className="text-center py-8 text-xs text-stone-500">
                    No orders matched your search query "{orderSearchTerm}".
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-stone-200 rounded-2xl">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-stone-200 text-stone-500 uppercase tracking-wider text-[10px] bg-stone-50">
                          <th className="p-3.5 font-bold">Order ID</th>
                          <th className="p-3.5 font-bold">Date</th>
                          <th className="p-3.5 font-bold">Customer Location</th>
                          <th className="p-3.5 text-center font-bold">Delivery Status</th>
                          <th className="p-3.5 text-right font-bold">Order Value</th>
                          <th className="p-3.5 text-right font-bold">12% Commission</th>
                          <th className="p-3.5 text-center font-bold">Payout Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {filteredReferrals.map((ref) => {
                          const isDelivered = Boolean(ref.isDelivered || ref.orderStatus?.toLowerCase() === 'delivered' || ref.status === 'eligible' || ref.status === 'settled');
                          const isCancelled = ref.orderStatus?.toLowerCase() === 'cancelled';

                          return (
                            <tr key={ref.id} className="hover:bg-amber-50/40 transition-colors">
                              <td className="p-3.5 font-bold text-stone-900 font-mono">#{ref.orderNumber}</td>
                              <td className="p-3.5 text-stone-600">{ref.orderDate || new Date(ref.createdAt).toLocaleDateString('en-IN')}</td>
                              <td className="p-3.5 text-stone-600">{ref.customerCity || partner.city || 'Maharashtra'}</td>
                              
                              {/* Delivery Status Column */}
                              <td className="p-3.5 text-center">
                                {isCancelled ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                    Cancelled
                                  </span>
                                ) : isDelivered ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                                    Delivered
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200">
                                    <Clock className="w-3 h-3 text-amber-700 shrink-0" />
                                    {ref.orderStatus ? ref.orderStatus.charAt(0).toUpperCase() + ref.orderStatus.slice(1) : 'Processing / In Transit'}
                                  </span>
                                )}
                              </td>

                              <td className="p-3.5 text-right font-semibold text-stone-900">₹{ref.orderTotal}</td>

                              {/* Commission Column */}
                              <td className="p-3.5 text-right">
                                {isCancelled ? (
                                  <div className="text-right">
                                    <span className="text-xs font-semibold text-stone-400 line-through">₹{ref.partnerCommission}</span>
                                    <span className="block text-[9px] text-rose-700 font-bold">Cancelled</span>
                                  </div>
                                ) : isDelivered ? (
                                  <div className="text-right">
                                    <span className="text-sm font-black text-emerald-600">+₹{ref.partnerCommission}</span>
                                    <span className="block text-[9px] text-emerald-700 font-bold uppercase tracking-wider">✓ Unlocked</span>
                                  </div>
                                ) : (
                                  <div className="text-right">
                                    <span className="text-sm font-bold text-amber-900">₹{ref.partnerCommission}</span>
                                    <span className="inline-block text-[9px] font-extrabold uppercase px-1.5 py-0.5 bg-amber-100 text-amber-900 rounded border border-amber-200">
                                      Amount On Hold
                                    </span>
                                  </div>
                                )}
                              </td>

                              {/* Payout Status Column */}
                              <td className="p-3.5 text-center">
                                {isCancelled ? (
                                  <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold bg-stone-100 text-stone-500">
                                    Order Cancelled
                                  </span>
                                ) : isDelivered ? (
                                  <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                    ref.status === 'settled'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  }`}>
                                    {ref.status === 'settled' ? 'Paid to Bank' : 'Eligible for Sunday'}
                                  </span>
                                ) : (
                                  <div className="text-center space-y-0.5">
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                                      <Clock className="w-3 h-3 text-amber-700 shrink-0" />
                                      On Hold
                                    </span>
                                    <p className="text-[10px] text-amber-800 font-bold whitespace-nowrap">
                                      Order yet to be delivered
                                    </p>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB 5: MARKETING TOOLKIT */}
            {activeTab === 'toolkit' && (
              <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
                {/* Ready-made Social Media Sharing */}
                <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-6 sm:p-7 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
                    <div>
                      <h3 className="text-base font-extrabold text-stone-900 font-serif">Ready-Made Social Media Share Toolkit</h3>
                      <p className="text-xs text-stone-500 font-medium">
                        Copy pre-written attractive messages with your embedded discount link to share on WhatsApp Status, Facebook, and Instagram.
                      </p>
                    </div>

                    <div className="inline-flex rounded-xl bg-stone-100 p-1 border border-stone-200">
                      <button
                        type="button"
                        onClick={() => setShareLanguage('marathi')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                          shareLanguage === 'marathi'
                            ? 'bg-[#9B111E] text-white shadow-xs'
                            : 'text-stone-700 hover:text-stone-900'
                        }`}
                      >
                        मराठी
                      </button>
                      <button
                        type="button"
                        onClick={() => setShareLanguage('hindi')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                          shareLanguage === 'hindi'
                            ? 'bg-[#9B111E] text-white shadow-xs'
                            : 'text-stone-700 hover:text-stone-900'
                        }`}
                      >
                        हिंदी
                      </button>
                      <button
                        type="button"
                        onClick={() => setShareLanguage('english')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                          shareLanguage === 'english'
                            ? 'bg-[#9B111E] text-white shadow-xs'
                            : 'text-stone-700 hover:text-stone-900'
                        }`}
                      >
                        English
                      </button>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-[#FAF6ED] border border-stone-200 space-y-4">
                    <p className="text-xs text-stone-800 font-sans whitespace-pre-line leading-relaxed font-semibold">
                      {shareMessages[shareLanguage]}
                    </p>

                    <div className="flex flex-wrap items-center gap-2.5 pt-4 border-t border-stone-200/60">
                      <a
                        href={`https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessages[shareLanguage])}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Share Directly on WhatsApp</span>
                      </a>
                      
                      <button
                        type="button"
                        onClick={() => {
                          if (navigator.clipboard && navigator.clipboard.writeText) {
                            navigator.clipboard.writeText(shareMessages[shareLanguage]);
                          }
                          setCopiedPromo(true);
                          setTimeout(() => setCopiedPromo(false), 2500);
                        }}
                        className="px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        {copiedPromo ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedPromo ? 'Message Copied!' : 'Copy Message Text'}</span>
                      </button>
                    </div>

                    {copiedPromo && (
                      <p className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-600" /> Promotional text has been successfully copied. You can now paste and share anywhere!
                      </p>
                    )}
                  </div>
                </div>

                {/* Promotional Banners & Social Media Graphics Gallery */}
                <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-6 sm:p-7 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-red-50 text-[#9B111E] flex items-center justify-center shrink-0 border border-red-100">
                        <ImageIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-extrabold text-stone-900 font-serif">
                          Promotional Graphics & Social Media Posters ({womanGraphics.length})
                        </h3>
                        <p className="text-xs text-stone-500 font-medium">
                          Official high-resolution banners and poster images for your WhatsApp Status & Instagram posts.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setLoadingGraphics(true);
                        fetch('/api/woman?action=get_media')
                          .then(res => res.json())
                          .then(data => {
                            const items = data.data || data.media || data.graphics || [];
                            if (Array.isArray(items)) setWomanGraphics(items);
                          })
                          .catch(() => {})
                          .finally(() => setLoadingGraphics(false));
                      }}
                      className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shrink-0"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${loadingGraphics ? 'animate-spin' : ''}`} />
                      <span>Refresh Gallery</span>
                    </button>
                  </div>

                  {loadingGraphics && (
                    <div className="py-12 text-center space-y-2">
                      <div className="w-7 h-7 border-2 border-[#9B111E] border-t-transparent rounded-full animate-spin mx-auto" />
                      <p className="text-xs font-bold text-stone-600">Loading graphics gallery...</p>
                    </div>
                  )}

                  {!loadingGraphics && womanGraphics.length === 0 && (
                    <div className="bg-stone-50 rounded-2xl p-8 text-center border border-stone-200 space-y-2">
                      <div className="w-10 h-10 rounded-full bg-stone-200/70 text-stone-500 flex items-center justify-center mx-auto">
                        <ImageIcon className="w-5 h-5" />
                      </div>
                      <h4 className="text-xs font-black text-stone-800 uppercase tracking-wide">No Promotional Graphics Available</h4>
                      <p className="text-xs text-stone-500 max-w-sm mx-auto font-medium">
                        Graphics added by the admin will automatically appear here for you to download and share.
                      </p>
                    </div>
                  )}

                  {!loadingGraphics && womanGraphics.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      {womanGraphics.map((item) => (
                        <div
                          key={item.id}
                          className="bg-[#FAF6ED]/60 rounded-2xl border border-stone-200 overflow-hidden flex flex-col justify-between group hover:border-[#9B111E]/40 transition-all shadow-2xs"
                        >
                          <div className="p-3.5 space-y-3">
                            <div className="relative w-full h-44 bg-stone-100 rounded-xl overflow-hidden border border-stone-200/80">
                              <img
                                src={item.imageUrl}
                                alt={item.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              <a
                                href={item.imageUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="absolute top-2 right-2 p-1.5 rounded-lg bg-stone-900/80 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Open Image Full Screen"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            </div>

                            <div className="space-y-1.5">
                              <h4 className="text-xs font-black text-stone-900 truncate">{item.title}</h4>
                              <p className="text-[11px] text-stone-600 font-medium leading-relaxed bg-white p-2.5 rounded-xl border border-stone-200/70 line-clamp-3">
                                {item.caption || 'Share this banner on your social media with your referral link!'}
                              </p>
                            </div>
                          </div>

                          <div className="p-3 bg-white border-t border-stone-200/80 flex items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                if (navigator.clipboard) {
                                  navigator.clipboard.writeText(item.imageUrl);
                                }
                                setCopiedGraphicId(item.id);
                                setTimeout(() => setCopiedGraphicId(null), 2000);
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              {copiedGraphicId === item.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                              <span>{copiedGraphicId === item.id ? 'Copied Link' : 'Copy Image Link'}</span>
                            </button>

                            <a
                              href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                                `${item.caption}\n\nOrder with 4% discount: ${referralLink}\nImage: ${item.imageUrl}`
                              )}`}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1.5 rounded-lg bg-[#25D366] hover:bg-[#20bd5a] text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                            >
                              <MessageCircle className="w-3 h-3" />
                              <span>Share</span>
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Women Partner Growth Playbook Cards */}
                <div className="bg-stone-50 rounded-3xl border border-stone-200 p-6 sm:p-8 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 border border-amber-200">
                        <Lightbulb className="w-5 h-5 text-amber-700" />
                      </div>
                      <div>
                        <h3 className="text-base font-black font-serif text-stone-900">
                          Actionable Marketing Strategies for Women Entrepreneurs
                        </h3>
                        <p className="text-xs text-stone-600">
                          Follow these step-by-step techniques to grow regular customers and earn recurring Sunday payouts.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-2.5">
                      <div className="flex items-center gap-2 text-stone-900 font-bold text-sm">
                        <span className="w-6 h-6 rounded-full bg-[#9B111E] text-white text-xs flex items-center justify-center font-bold">1</span>
                        <Clock className="w-4 h-4 text-amber-600" />
                        <span>The 3-Time Daily WhatsApp Status Routine</span>
                      </div>
                      <p className="text-xs text-stone-600 leading-relaxed">
                        <strong>• 8:30 AM:</strong> Post morning tea with chips photo.<br />
                        <strong>• 1:30 PM:</strong> Post your 4% discount coupon link ({referralLink}).<br />
                        <strong>• 6:30 PM:</strong> Share a customer review or snack recommendation.
                      </p>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-2.5">
                      <div className="flex items-center gap-2 text-stone-900 font-bold text-sm">
                        <span className="w-6 h-6 rounded-full bg-[#9B111E] text-white text-xs flex items-center justify-center font-bold">2</span>
                        <Coffee className="w-4 h-4 text-[#D9531E]" />
                        <span>Society Chai & Neighbor Tasting Session</span>
                      </div>
                      <p className="text-xs text-stone-600 leading-relaxed">
                        Serve Aapla Jalgaonwala chips during building meetings or evening tea. Let them taste the wood-fired freshness, then send your 4% discount link on WhatsApp.
                      </p>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-2.5">
                      <div className="flex items-center gap-2 text-stone-900 font-bold text-sm">
                        <span className="w-6 h-6 rounded-full bg-[#9B111E] text-white text-xs flex items-center justify-center font-bold">3</span>
                        <Gift className="w-4 h-4 text-purple-600" />
                        <span>Festive & Family WhatsApp Groups</span>
                      </div>
                      <p className="text-xs text-stone-600 leading-relaxed">
                        Before Diwali, Ganpati, and weddings, share curated snack gift combo packs in family groups across Pune, Mumbai, Nashik, and Bangalore for high-volume orders!
                      </p>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-2.5">
                      <div className="flex items-center gap-2 text-stone-900 font-bold text-sm">
                        <span className="w-6 h-6 rounded-full bg-[#9B111E] text-white text-xs flex items-center justify-center font-bold">4</span>
                        <Instagram className="w-4 h-4 text-pink-600" />
                        <span>Instagram Bio & WhatsApp Description Link</span>
                      </div>
                      <p className="text-xs text-stone-600 leading-relaxed">
                        Add your personal referral URL to your WhatsApp bio and Instagram profile. Point any friends who ask about Jalgaon snacks straight to your link.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 6: SETTINGS & BANK */}
            {activeTab === 'settings' && (
              <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Profile Details Card */}
                  <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-6 sm:p-7 space-y-5">
                    <div className="flex items-center gap-3 border-b border-stone-100 pb-4">
                      <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center shrink-0">
                        <User className="w-5 h-5 text-[#9B111E]" />
                      </div>
                      <div>
                        <h3 className="text-base font-extrabold text-stone-900 font-serif">Partner Profile Details</h3>
                        <p className="text-xs text-stone-500">Your registered businesswoman credentials</p>
                      </div>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-stone-400 block">Full Name</span>
                        <div className="text-sm font-bold text-stone-900">{partner.fullName}</div>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-stone-400 block">Assigned Partner Code</span>
                        <div className="text-sm font-bold font-mono text-[#9B111E]">{partner.partnerCode}</div>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-stone-400 block">Registered Email</span>
                        <div className="text-sm font-bold text-stone-900">{partner.email}</div>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-stone-400 block">Contact Phone Number</span>
                        <div className="text-sm font-bold text-stone-900">{partner.phone}</div>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-stone-400 block">Location</span>
                        <div className="text-sm font-bold text-stone-900">{partner.city}, {partner.state}</div>
                      </div>
                    </div>
                  </div>

                  {/* Verified Bank / UPI Card */}
                  <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-6 sm:p-7 space-y-5">
                    <div className="flex items-center gap-3 border-b border-stone-100 pb-4">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-900 flex items-center justify-center shrink-0">
                        <Building2 className="w-5 h-5 text-emerald-700" />
                      </div>
                      <div>
                        <h3 className="text-base font-extrabold text-stone-900 font-serif">Verified Payout Destination</h3>
                        <p className="text-xs text-stone-500">Commissions are wired directly to this account</p>
                      </div>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-stone-400 block">Account Holder Name</span>
                        <div className="text-sm font-bold text-stone-900">{partner.bankAccountName || partner.fullName}</div>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-stone-400 block">Bank Name</span>
                        <div className="text-sm font-bold text-stone-900">{partner.bankName || 'Verified Partner Bank'}</div>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-stone-400 block">Bank Account Number</span>
                        <div className="text-sm font-bold font-mono text-stone-900">
                          {partner.bankAccountNumber ? `•••• •••• ${partner.bankAccountNumber.slice(-4)}` : 'Verified on File'}
                        </div>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-stone-400 block">IFSC Code</span>
                        <div className="text-sm font-bold font-mono text-stone-900">{partner.ifscCode || 'Verified'}</div>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-stone-400 block">UPI ID for Express Deposit</span>
                        <div className="text-sm font-bold font-mono text-emerald-700">{partner.upiId || 'Verified'}</div>
                      </div>
                    </div>

                    {/* Registration Payment Transaction Receipt */}
                    <div className="mt-4 p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-950">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Onboarding Payment Receipt</span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          ₹{partner.paymentAmount !== undefined ? partner.paymentAmount : 699} Paid
                        </span>
                      </div>

                      <div className="text-xs space-y-1.5 pt-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] text-stone-600 font-semibold">Razorpay Transaction ID:</span>
                          <span className="font-mono text-[11px] font-bold text-stone-900 truncate max-w-[200px]" title={partner.transactionId || partner.paymentRef || 'N/A'}>
                            {partner.transactionId || partner.paymentRef || 'Verified'}
                          </span>
                        </div>

                        {partner.paymentDate && (
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] text-stone-600 font-semibold">Payment Date:</span>
                            <span className="text-[11px] font-semibold text-stone-800">
                              {new Date(partner.paymentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5 font-medium">
                      <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                      <span>
                        Need to update your bank or UPI details? Contact partner support on WhatsApp with your code <strong>{partner.partnerCode}</strong>.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Container>
    </div>
  );
}
