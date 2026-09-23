import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Mail,
  Lock,
  User as UserIcon,
  Phone,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  KeyRound,
  RotateCcw,
  Award,
  TrendingUp,
  ExternalLink,
  HelpCircle
} from 'lucide-react';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

export function AuthModal() {
  const navigate = useNavigate();
  const {
    isAuthModalOpen,
    closeAuthModal,
    authModalTab,
    openAuthModal,
    login,
    signup,
    initiateGoogleOAuth,
    setSession
  } = useAuth();

  const [forgotStep, setForgotStep] = useState<'none' | 'email' | 'otp' | 'reset'>('none');

  // Input states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Partner login states
  const [partnerCode, setPartnerCode] = useState('');
  const [isPartnerLoading, setIsPartnerLoading] = useState(false);

  // Forgot password states
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Loading & status states
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isAuthModalOpen) return null;

  const resetAllFields = () => {
    setErrorMsg('');
    setSuccessMsg('');
    setForgotStep('none');
    setOtpCode('');
    setNewPassword('');
    setConfirmPassword('');
    setPartnerCode('');
  };

  // Partner Login Submit
  const handlePartnerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanCode = partnerCode.trim().toUpperCase();
    if (!cleanCode) {
      setErrorMsg('Please enter your unique Partner Referral Code (e.g. AJW-508080).');
      return;
    }

    if (/^\d{10}$/.test(cleanCode)) {
      setErrorMsg('For account security, login with mobile number is disabled. Please enter your unique Partner Referral Code (e.g. AJW-508080).');
      return;
    }

    setIsPartnerLoading(true);
    try {
      const res = await fetch(`/api/partner-program/partners/${encodeURIComponent(cleanCode)}?codeOnly=true`);
      const json = await res.json();
      if (!res.ok || !json.success || !json.data?.partner) {
        throw new Error(json.error?.message || 'No active partner found with this Referral Code. Please check and try again.');
      }

      const verifiedPartner = json.data.partner;
      localStorage.setItem('ajw_active_partner_code', verifiedPartner.partnerCode);
      setSuccessMsg(`Welcome, ${verifiedPartner.fullName}! Opening your Woman Partner Dashboard...`);
      setTimeout(() => {
        closeAuthModal();
        resetAllFields();
        navigate('/partner-analytics');
      }, 700);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to authenticate partner code.');
    } finally {
      setIsPartnerLoading(false);
    }
  };

  // Main Auth Submit (Login / Signup)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      if (authModalTab === 'signup') {
        if (!name.trim()) {
          setErrorMsg('Please enter your full name');
          setIsLoading(false);
          return;
        }
        if (!email.trim() || !email.includes('@')) {
          setErrorMsg('Please enter a valid email address');
          setIsLoading(false);
          return;
        }
        if (!password || password.length < 6) {
          setErrorMsg('Password must be at least 6 characters');
          setIsLoading(false);
          return;
        }
        const res = await signup(name.trim(), email.trim(), password, phone.trim());
        if (!res.success) {
          setErrorMsg(res.message || 'Signup failed. Please try again.');
        } else {
          setSuccessMsg('Welcome to Aapla Jalgaonwala! Account created successfully.');
          setTimeout(() => {
            closeAuthModal();
            navigate('/account');
          }, 800);
        }
      } else {
        if (!email.trim()) {
          setErrorMsg('Please enter your email address');
          setIsLoading(false);
          return;
        }
        if (!password) {
          setErrorMsg('Please enter your password');
          setIsLoading(false);
          return;
        }
        const res = await login(email.trim(), password);
        if (!res.success) {
          setErrorMsg(res.message || 'Invalid email or password');
        } else {
          setSuccessMsg('Logged in successfully!');
          setTimeout(() => {
            closeAuthModal();
            navigate('/account');
          }, 800);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 1: Send OTP to Email
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Please enter your registered email address.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: email.trim() })
      });

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('text/html') || res.status === 302) {
        setErrorMsg('Third-party cookie access is restricted in this preview frame. Please open the app in a new tab (using the button in the top-right of AI Studio) to request the OTP!');
        return;
      }

      const json = await res.json();
      if (json.success) {
        setSuccessMsg(json.data?.message || 'OTP code sent to your email.');
        setForgotStep('otp');
      } else {
        setErrorMsg(json.error?.message || 'Failed to send OTP code.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error communicating with server.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!otpCode.trim() || otpCode.trim().length !== 6) {
      setErrorMsg('Please enter the 6-digit OTP code sent to your email.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: email.trim(), otp: otpCode.trim() })
      });

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('text/html') || res.status === 302) {
        setErrorMsg('Third-party cookie access is restricted in this preview frame. Please open the app in a new tab to verify your OTP!');
        return;
      }

      const json = await res.json();
      if (json.success) {
        setSuccessMsg('OTP verified successfully! Set your new password below.');
        setForgotStep('reset');
      } else {
        setErrorMsg(json.error?.message || 'Invalid or expired OTP code.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error verifying OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Update Password & Auto Login
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please re-enter your password.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: email.trim(),
          otp: otpCode.trim(),
          newPassword
        })
      });

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('text/html') || res.status === 302) {
        setErrorMsg('Third-party cookie access is restricted in this preview frame. Please open the app in a new tab to complete resetting your password!');
        return;
      }

      const json = await res.json();
      if (json.success && json.data?.user && json.data?.token) {
        setSuccessMsg('Password updated successfully! Logging you in...');
        setSession(json.data.user, json.data.token);
        setTimeout(() => {
          closeAuthModal();
          resetAllFields();
          navigate('/account');
        }, 1000);
      } else {
        setErrorMsg(json.error?.message || 'Failed to update password.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error updating password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    setIsGoogleLoading(true);
    try {
      await initiateGoogleOAuth();
      closeAuthModal();
      navigate('/account');
    } catch (err: any) {
      setErrorMsg(err.message || 'Google authentication was cancelled or interrupted.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          closeAuthModal();
          resetAllFields();
        }
      }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-stone-950/75 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ type: 'spring', damping: 26, stiffness: 360 }}
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-stone-200/90 overflow-hidden my-auto"
      >
        {/* Header Banner */}
        <div className="bg-gradient-to-br from-[#9B111E] via-[#850e19] to-[#55050C] p-6 sm:p-7 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#FFFFFF_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

          <button
            onClick={(e) => { e.stopPropagation(); closeAuthModal(); resetAllFields(); }}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/15 hover:bg-white/25 text-white transition-all cursor-pointer z-10"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex flex-col items-center text-center relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-300/40 text-amber-200 text-[10px] font-black tracking-widest uppercase mb-2.5 backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <span>
                {authModalTab === 'partner' ? 'Women Business Partner Network' : 'Aapla Jalgaonwala Account'}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {forgotStep !== 'none'
                ? 'Reset Your Password'
                : authModalTab === 'partner'
                ? 'Woman Partner Login'
                : authModalTab === 'login'
                ? 'Welcome Back!'
                : 'Join the Snack Family'}
            </h2>

            <p className="text-xs text-amber-100/90 mt-1.5 max-w-xs leading-relaxed font-medium">
              {forgotStep === 'email'
                ? 'Enter your registered email to receive a 6-digit OTP code.'
                : forgotStep === 'otp'
                ? `Enter the 6-digit OTP code sent to ${email}.`
                : forgotStep === 'reset'
                ? 'Set your new password to regain access.'
                : authModalTab === 'partner'
                ? 'Enter your unique Partner Referral Code to view your real-time earnings, orders & Sunday payouts.'
                : authModalTab === 'login'
                ? 'Sign in to access express checkout, saved addresses & order history.'
                : 'Create an account to track shipments & enjoy fresh Jalgaon snacks.'}
            </p>
          </div>
        </div>

        {/* Navigation / 3-Tab Switcher */}
        {forgotStep === 'none' ? (
          <div className="flex bg-stone-100 p-1.5 gap-1 m-4 sm:m-5 mb-0 rounded-2xl border border-stone-200/90">
            <button
              type="button"
              onClick={() => { openAuthModal('login'); setErrorMsg(''); setSuccessMsg(''); }}
              className={`flex-1 py-2 text-[11px] sm:text-xs font-bold text-center rounded-xl transition-all cursor-pointer ${
                authModalTab === 'login'
                  ? 'bg-white text-[#9B111E] shadow-sm font-black'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
              }`}
            >
              <span>Customer Login</span>
            </button>
            <button
              type="button"
              onClick={() => { openAuthModal('signup'); setErrorMsg(''); setSuccessMsg(''); }}
              className={`flex-1 py-2 text-[11px] sm:text-xs font-bold text-center rounded-xl transition-all cursor-pointer ${
                authModalTab === 'signup'
                  ? 'bg-white text-[#9B111E] shadow-sm font-black'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
              }`}
            >
              <span>Sign Up</span>
            </button>
            <button
              type="button"
              onClick={() => { openAuthModal('partner'); setErrorMsg(''); setSuccessMsg(''); }}
              className={`flex-1 py-2 text-[11px] sm:text-xs font-bold text-center rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 ${
                authModalTab === 'partner'
                  ? 'bg-gradient-to-r from-amber-600 to-[#9B111E] text-white shadow-sm font-black'
                  : 'text-amber-900 bg-amber-50/80 hover:bg-amber-100/80 border border-amber-200/60'
              }`}
            >
              <span>🌸</span>
              <span className="truncate">Woman Partner</span>
            </button>
          </div>
        ) : (
          <div className="px-6 pt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={resetAllFields}
              className="text-xs font-bold text-[#D9531E] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>&larr; Back to Login</span>
            </button>

            <span className="text-[10px] font-black uppercase text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300">
              Step {forgotStep === 'email' ? '1/3' : forgotStep === 'otp' ? '2/3' : '3/3'}
            </span>
          </div>
        )}

        <div className="p-5 sm:p-6 space-y-4 bg-white">
          <ErrorBoundary moduleName="AuthModalForm">
            {/* Status Messages */}
            {errorMsg && (
              <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* TAB 3: WOMAN PARTNER LOGIN */}
            {forgotStep === 'none' && authModalTab === 'partner' && (
              <div key="auth-partner-view" className="space-y-4 animate-in fade-in duration-200">
                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50/60 border border-amber-200 text-amber-950 text-xs">
                  <div className="flex items-center gap-2 font-black text-amber-900 mb-1">
                    <Award className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Verified Partner Portal Access</span>
                  </div>
                  <p className="text-[11px] text-amber-800/90 leading-relaxed font-medium">
                    Enter your unique Partner Referral Code (assigned after your ₹699 registration) to access your commission dashboard, track customer orders & download WhatsApp promotional creatives.
                  </p>
                </div>

                <form onSubmit={handlePartnerLogin} className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-stone-800">
                        Partner Referral Code *
                      </label>
                      <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded-md border border-amber-300">
                        Format: AJW-XXXXXX
                      </span>
                    </div>
                    <div className="relative">
                      <Award className="w-4 h-4 text-amber-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. AJW-508080"
                        value={partnerCode}
                        onChange={(e) => setPartnerCode(e.target.value.toUpperCase())}
                        className="w-full pl-10 pr-4 py-3 rounded-2xl border-2 border-amber-300 bg-amber-50/30 text-sm font-mono font-black tracking-wider text-stone-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none uppercase placeholder:normal-case placeholder:font-sans placeholder:font-normal placeholder:tracking-normal placeholder:text-stone-400"
                      />
                    </div>
                    <p className="text-[10px] text-stone-500 mt-1.5 flex items-center gap-1 font-medium">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Protected access. Mobile numbers are not accepted for partner login.</span>
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isPartnerLoading}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#9B111E] via-[#850e19] to-amber-700 hover:brightness-110 text-white text-xs font-extrabold flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg cursor-pointer disabled:opacity-50"
                  >
                    {isPartnerLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Woman Partner Login</span>
                        <ArrowRight className="w-4 h-4 shrink-0" />
                      </>
                    )}
                  </button>
                </form>

                {/* Partner Onboarding Help & Link */}
                <div className="pt-3 border-t border-stone-200 text-center space-y-2">
                  <p className="text-xs text-stone-600 font-medium">
                    Not registered yet as a Woman Business Partner?
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      closeAuthModal();
                      resetAllFields();
                      navigate('/partner-program');
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200/80 text-stone-800 text-xs font-extrabold transition-all cursor-pointer border border-stone-300"
                  >
                    <span>Join Partner Program (₹699 One-Time)</span>
                    <ExternalLink className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  </button>
                </div>
              </div>
            )}

            {/* FORGOT PASSWORD STEP 1: EMAIL INPUT */}
            {forgotStep === 'email' && (
              <form key="auth-forgot-email" onSubmit={handleSendOTP} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Registered Email Address *</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-2xl border border-stone-300 bg-white text-xs font-semibold text-stone-900 focus:ring-2 focus:ring-[#D9531E] outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 rounded-2xl bg-[#9B111E] hover:bg-[#800A14] text-white text-xs font-extrabold flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4 shrink-0" />
                      <span>Send Verification OTP Code</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* FORGOT PASSWORD STEP 2: VERIFY OTP CODE */}
            {forgotStep === 'otp' && (
              <form key="auth-forgot-otp" onSubmit={handleVerifyOTP} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Enter 6-Digit OTP Code *</label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      maxLength={6}
                      required
                      placeholder="e.g. 849201"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      className="w-full pl-10 pr-4 py-3 rounded-2xl border border-stone-300 bg-amber-50/40 text-center font-mono font-black text-lg tracking-[8px] text-stone-900 focus:ring-2 focus:ring-[#D9531E] outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-stone-500 font-medium">Didn't receive the code?</span>
                  <button
                    type="button"
                    onClick={handleSendOTP}
                    disabled={isLoading}
                    className="font-bold text-[#D9531E] hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Resend OTP</span>
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 rounded-2xl bg-[#9B111E] hover:bg-[#800A14] text-white text-xs font-extrabold flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>Verify OTP Code</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* FORGOT PASSWORD STEP 3: SET NEW PASSWORD */}
            {forgotStep === 'reset' && (
              <form key="auth-forgot-reset" onSubmit={handleResetPassword} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">New Password *</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      placeholder="Min 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 rounded-2xl border border-stone-300 bg-white text-xs font-semibold text-stone-900 focus:ring-2 focus:ring-[#D9531E] outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 cursor-pointer p-1"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Re-enter New Password *</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      placeholder="Re-enter password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-stone-300 bg-white text-xs font-semibold text-stone-900 focus:ring-2 focus:ring-[#D9531E] outline-none"
                    />
                  </div>
                </div>

                {/* Password Rules Validation */}
                <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-1.5 text-[11px]">
                  <div className="flex items-center gap-1.5 font-bold">
                    {newPassword.length >= 6 ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-stone-400 shrink-0" />
                    )}
                    <span className={newPassword.length >= 6 ? 'text-emerald-700 font-bold' : 'text-stone-500'}>
                      At least 6 characters
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 font-bold">
                    {confirmPassword && newPassword === confirmPassword ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-stone-400 shrink-0" />
                    )}
                    <span className={confirmPassword && newPassword === confirmPassword ? 'text-emerald-700 font-bold' : 'text-stone-500'}>
                      Passwords match
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || newPassword.length < 6 || newPassword !== confirmPassword}
                  className="w-full py-3.5 rounded-2xl bg-[#9B111E] hover:bg-[#800A14] text-white text-xs font-extrabold flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Update Password & Log In</span>
                      <ArrowRight className="w-4 h-4 shrink-0" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* MAIN CUSTOMER LOGIN / SIGNUP FORM */}
            {forgotStep === 'none' && authModalTab !== 'partner' && (
              <div key="auth-customer-view" className="space-y-4">
                {/* Real Google Login Button */}
                <div>
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={isGoogleLoading || isLoading}
                    className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-2xl bg-white border border-stone-300 hover:border-stone-400 hover:bg-stone-50/80 text-stone-800 text-xs font-extrabold transition-all shadow-xs hover:shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {isGoogleLoading ? (
                      <div className="w-4 h-4 border-2 border-stone-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg className="w-4.5 h-4.5 shrink-0" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.14z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.94H1.24v3.15C3.26 21.36 7.34 24 12 24z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.28 14.26c-.25-.72-.38-1.49-.38-2.26s.13-1.54.38-2.26V6.59H1.24C.45 8.16 0 9.97 0 12s.45 3.84 1.24 5.41l4.04-3.15z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.24 6.59l4.04 3.15c.95-2.84 3.6-4.99 6.72-4.99z"
                        />
                      </svg>
                    )}
                    <span>Continue with Google</span>
                  </button>
                </div>

                <div className="relative flex items-center justify-center py-1">
                  <div className="border-t border-stone-200 w-full" />
                  <span className="bg-white px-3 text-[10px] font-black text-stone-400 uppercase tracking-widest absolute">
                    or use email & password
                  </span>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3.5">
                  {authModalTab === 'signup' && (
                    <div className="space-y-3.5">
                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">Full Name *</label>
                        <div className="relative">
                          <UserIcon className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            required
                            placeholder="e.g. Anand Patil"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-stone-300 bg-white text-xs font-semibold text-stone-900 focus:ring-2 focus:ring-[#D9531E] focus:border-[#D9531E] outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">Mobile Number (Optional)</label>
                        <div className="relative">
                          <Phone className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="tel"
                            placeholder="e.g. 9823012345"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-stone-300 bg-white text-xs font-semibold text-stone-900 focus:ring-2 focus:ring-[#D9531E] focus:border-[#D9531E] outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Email Address *</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-stone-300 bg-white text-xs font-semibold text-stone-900 focus:ring-2 focus:ring-[#D9531E] focus:border-[#D9531E] outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-stone-700">Password *</label>
                      {authModalTab === 'login' && (
                        <button
                          type="button"
                          onClick={() => {
                            setErrorMsg('');
                            setSuccessMsg('');
                            setForgotStep('email');
                          }}
                          className="text-[11px] font-bold text-[#D9531E] hover:underline cursor-pointer"
                        >
                          <span>Forgot Password?</span>
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder={authModalTab === 'signup' ? 'Create password (min 6 chars)' : 'Enter your password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-10 py-2.5 rounded-2xl border border-stone-300 bg-white text-xs font-semibold text-stone-900 focus:ring-2 focus:ring-[#D9531E] focus:border-[#D9531E] outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 cursor-pointer p-1"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || isGoogleLoading}
                    className="w-full py-3.5 rounded-2xl bg-[#9B111E] hover:bg-[#800A14] text-white text-xs font-extrabold flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg cursor-pointer mt-4 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>{authModalTab === 'login' ? 'Sign In to Customer Account' : 'Create My Account'}</span>
                        <ArrowRight className="w-4 h-4 shrink-0" />
                      </>
                    )}
                  </button>
                </form>

                {/* Quick Switch to Woman Partner Login Banner */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      openAuthModal('partner');
                      setErrorMsg('');
                      setSuccessMsg('');
                    }}
                    className="w-full p-3 rounded-2xl bg-amber-50 hover:bg-amber-100/90 border border-amber-200/90 text-stone-800 text-xs font-bold flex items-center justify-between transition-all cursor-pointer group shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center text-sm shrink-0">
                        🌸
                      </span>
                      <div className="text-left">
                        <p className="text-xs font-black text-stone-900 leading-tight">Women Business Partner?</p>
                        <p className="text-[10px] text-amber-800 font-medium">Access partner analytics, commission & payout portal</p>
                      </div>
                    </div>
                    <span className="text-[#9B111E] font-black group-hover:translate-x-0.5 transition-transform flex items-center gap-1 text-[11px] shrink-0">
                      Partner Login &rarr;
                    </span>
                  </button>
                </div>
              </div>
            )}
          </ErrorBoundary>

          {/* Security & Privacy Badge */}
          <div className="pt-3 border-t border-stone-200/70 flex items-center justify-center gap-2 text-stone-500 text-[11px] font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>256-Bit Encrypted & 100% Privacy Protected</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
