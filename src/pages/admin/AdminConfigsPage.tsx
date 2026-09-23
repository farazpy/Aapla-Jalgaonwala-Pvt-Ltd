import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import {
  SlidersHorizontal,
  Mail,
  Send,
  CreditCard,
  MapPin,
  Save,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Bot,
  Globe,
  Bell,
  ShieldCheck,
  Eye,
  EyeOff,
  Phone,
  Store,
  HelpCircle,
  User as UserIcon,
  Image as ImageIcon,
  Video,
  Plus,
  Trash2,
  Edit,
  Play
} from 'lucide-react';
import { SiteSettings, VideoItem } from '@/types';

export default function AdminConfigsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Test state
  const [isTestingEmail, setIsTestingEmail] = useState(false);
  const [emailTestResult, setEmailTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const [isTestingTelegram, setIsTestingTelegram] = useState(false);
  const [telegramTestResult, setTelegramTestResult] = useState<{
    success: boolean;
    message?: string;
    error?: string;
    debugReason?: string;
    troubleshooting?: string;
    telegramResponse?: any;
  } | null>(null);

  // Password visibility states
  const [showSmtpPass, setShowSmtpPass] = useState(false);
  const [showTelegramToken, setShowTelegramToken] = useState(false);
  const [showRazorpaySecret, setShowRazorpaySecret] = useState(false);
  const [showCloudinarySecret, setShowCloudinarySecret] = useState(false);

  // Video Management State
  const [videoList, setVideoList] = useState<VideoItem[]>([]);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<VideoItem | null>(null);
  const [videoForm, setVideoForm] = useState({
    title: '',
    description: '',
    videoUrl: '',
    thumbnail: '',
    duration: '03:30',
    category: 'Brand Story',
    speaker: 'Saurabh Patil & Jayesh Patil'
  });
  const [isSavingVideo, setIsSavingVideo] = useState(false);

  // Form State
  const [form, setForm] = useState<Partial<SiteSettings>>({
    storeName: 'Aapla Jalgaonwala',
    adminNotificationEmail: 'farazk0792@gmail.com',
    contactEmail: 'info@aaplajalgaonwala.com',
    contactPhone: '+91 70574 46409',
    whatsappNumber: '+91 70574 46409',
    storeAddress: 'Gat No. 12, Jalgaon-Bhusawal Road, Near M.J. College, Jalgaon, Maharashtra 425001',
    storeHours: 'Monday – Sunday: 8:00 AM – 10:00 PM',

    ourStoryHeroImageUrl: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=1600&q=80',
    ourStoryHeroTitle: 'Rooted in Soil. Crafted for Modern Taste.',
    ourStoryHeroSubtitle: 'How two visionaries from Jalgaon connected local farming families directly with snack lovers across India.',

    // SMTP
    enableEmailAlerts: true,
    smtpHost: '',
    smtpPort: 587,
    smtpUser: '',
    smtpPass: '',
    smtpFromEmail: '',
    smtpFromName: 'Aapla Jalgaonwala',

    // Telegram
    enableTelegramAlerts: true,
    telegramBotToken: '',
    telegramChatId: '',

    // Razorpay
    enableRazorpay: true,
    razorpayKeyId: '',
    razorpayKeySecret: '',

    // Google Maps
    googleMapsApiKey: ''
  });

  useEffect(() => {
    fetchConfigs();
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const res = await fetch('/api/media');
      const json = await res.json();
      if (json.success && json.data && Array.isArray(json.data.videos)) {
        setVideoList(json.data.videos);
      }
    } catch (err) {
      console.error('Failed to fetch video media:', err);
    }
  };

  const handleOpenAddVideo = () => {
    setEditingVideo(null);
    setVideoForm({
      title: '',
      description: '',
      videoUrl: '',
      thumbnail: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=800&q=80',
      duration: '03:45',
      category: 'Brand Story',
      speaker: 'Saurabh Patil & Jayesh Patil'
    });
    setIsVideoModalOpen(true);
  };

  const handleOpenEditVideo = (video: VideoItem) => {
    setEditingVideo(video);
    setVideoForm({
      title: video.title || '',
      description: video.description || '',
      videoUrl: video.videoUrl || '',
      thumbnail: video.thumbnail || '',
      duration: video.duration || '03:00',
      category: video.category || 'Brand Story',
      speaker: video.speaker || 'Founders'
    });
    setIsVideoModalOpen(true);
  };

  const handleSaveVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingVideo(true);
    try {
      if (editingVideo) {
        await fetch(`/api/media/${editingVideo.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...videoForm, type: 'video' })
        });
      } else {
        await fetch('/api/media', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...videoForm, type: 'video' })
        });
      }
      setIsVideoModalOpen(false);
      setEditingVideo(null);
      fetchVideos();
    } catch (err) {
      alert('Failed to save video entry.');
    } finally {
      setIsSavingVideo(false);
    }
  };

  const handleDeleteVideo = async (id: string) => {
    if (!confirm('Are you sure you want to delete this video item from Watch Our Story in Action?')) return;
    try {
      await fetch(`/api/media/${id}`, { method: 'DELETE' });
      fetchVideos();
    } catch (err) {
      alert('Failed to delete video item.');
    }
  };

  const fetchConfigs = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/settings');
      const json = await res.json();
      if (json.success && json.data) {
        setForm(prev => ({ ...prev, ...json.data }));
      }
    } catch (err: any) {
      console.error('Failed to load configs:', err);
      setErrorMessage(typeof err?.message === 'string' ? err.message : 'Failed to connect to server to fetch configurations.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const json = await res.json().catch(() => ({ success: false, error: 'Server returned non-JSON response' }));

      if (json.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 4000);
      } else {
        const errText = typeof json.error === 'string'
          ? json.error
          : (json.error?.message || json.message || 'Failed to update system configurations.');
        setErrorMessage(String(errText));
      }
    } catch (err: any) {
      setErrorMessage(typeof err?.message === 'string' ? err.message : 'Error occurred while saving configurations.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestEmail = async () => {
    setIsTestingEmail(true);
    setEmailTestResult(null);
    try {
      const res = await fetch('/api/admin/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.adminNotificationEmail })
      });
      const json = await res.json().catch(() => ({ success: false, error: 'Failed to parse response' }));
      if (json.success) {
        const dest = typeof json.data?.deliveredTo === 'string' ? json.data.deliveredTo : (form.adminNotificationEmail || 'recipient');
        setEmailTestResult({
          success: true,
          message: `Test email sent successfully to ${dest}!`
        });
      } else {
        const errText = typeof json.error === 'string'
          ? json.error
          : (json.error?.message || json.message || 'Failed to send test email.');
        setEmailTestResult({
          success: false,
          message: String(errText)
        });
      }
    } catch (err: any) {
      setEmailTestResult({
        success: false,
        message: typeof err?.message === 'string' ? err.message : 'Connection error while testing email.'
      });
    } finally {
      setIsTestingEmail(false);
    }
  };

  const handleTestTelegram = async () => {
    setIsTestingTelegram(true);
    setTelegramTestResult(null);
    try {
      const res = await fetch('/api/admin/test-telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botToken: form.telegramBotToken,
          chatId: form.telegramChatId
        })
      });
      const json = await res.json().catch(() => ({
        success: false,
        error: { message: `Server error (HTTP ${res.status}).` }
      }));

      if (json.success) {
        const successMsg = typeof json.data?.message === 'string'
          ? json.data.message
          : (typeof json.message === 'string' ? json.message : 'Test message delivered to Telegram chat successfully!');
        setTelegramTestResult({
          success: true,
          message: successMsg,
          telegramResponse: json.data?.telegramResponse || json.telegramResponse || null
        });
      } else {
        const errorMsg = typeof json.error === 'string'
          ? json.error
          : (json.error?.message || json.message || 'Failed to send Telegram message.');
        const details = (json.error && typeof json.error === 'object' && json.error.details) ? json.error.details : (json.details || {});

        setTelegramTestResult({
          success: false,
          error: String(errorMsg),
          debugReason: typeof details.debugReason === 'string'
            ? details.debugReason
            : (details.debugReason ? JSON.stringify(details.debugReason) : 'Telegram API returned error status.'),
          troubleshooting: typeof details.troubleshooting === 'string'
            ? details.troubleshooting
            : (details.troubleshooting ? JSON.stringify(details.troubleshooting) : 'Please verify Bot Token & Chat ID.'),
          telegramResponse: details.telegramResponse || json.telegramResponse || null
        });
      }
    } catch (err: any) {
      setTelegramTestResult({
        success: false,
        error: typeof err?.message === 'string' ? err.message : 'Error testing Telegram connection.',
        debugReason: 'Network failure during communication with server.',
        troubleshooting: 'Check internet connection and server status.'
      });
    } finally {
      setIsTestingTelegram(false);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout pageTitle="System & Integration Configs">
        <div className="p-8 text-center text-stone-500">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#9B111E] mb-3" />
          <p className="text-sm font-semibold">Loading system configurations...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <ErrorBoundary moduleName="AdminConfigsPage">
      <AdminLayout
        pageTitle="System & Integration Configs"
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'System & Integration Configs' }
        ]}
      >
        <div className="max-w-5xl mx-auto pb-16">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="p-2 bg-[#9B111E]/10 rounded-lg text-[#9B111E]">
                  <SlidersHorizontal className="w-5 h-5" />
                </div>
                <h1 className="text-xl font-black text-stone-900 tracking-tight">System & Integration Configs</h1>
              </div>
              <p className="text-xs text-stone-600">
                Manage website SMTP details, admin order notification emails, Telegram bot alerts, payment gateways, and API keys.
              </p>
            </div>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-[#9B111E] hover:bg-[#800e18] text-white text-xs font-bold rounded-xl shadow-md transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{isSaving ? 'Saving Changes...' : 'Save All Configs'}</span>
            </button>
          </div>

          {/* Success / Error Banners */}
          {saveSuccess && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-3 text-xs font-bold animate-fadeIn">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>All system configurations updated and live cache flushed successfully!</span>
            </div>
          )}

          {errorMessage && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-3 text-xs font-bold">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage)}</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-8">
            {/* SECTION 1: ADMIN & STORE NOTIFICATIONS */}
            <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs p-6">
              <div className="flex items-center gap-2.5 pb-4 mb-6 border-b border-stone-100">
                <Store className="w-5 h-5 text-[#9B111E]" />
                <div>
                  <h2 className="text-sm font-black text-stone-900">Admin Notification Email & Store Contacts</h2>
                  <p className="text-[11px] text-stone-500">
                    Where order notifications, website alerts, customer inquiries, and franchise leads get delivered.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2 bg-amber-50/60 p-4 rounded-xl border border-amber-200/60">
                  <label className="block text-xs font-black text-stone-900 mb-1">
                    Admin Notification Email <span className="text-[#9B111E]">(Primary Order Recipient)</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={form.adminNotificationEmail || ''}
                    onChange={(e) => setForm({ ...form, adminNotificationEmail: e.target.value })}
                    placeholder="e.g. farazk0792@gmail.com"
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-xs font-medium focus:ring-2 focus:ring-[#9B111E] bg-white"
                  />
                  <p className="mt-1.5 text-[11px] text-stone-600">
                    Whenever a customer places an order, an instant email with complete order summary will be dispatched to this address.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Store Name</label>
                  <input
                    type="text"
                    value={form.storeName || ''}
                    onChange={(e) => setForm({ ...form, storeName: e.target.value })}
                    placeholder="Aapla Jalgaonwala"
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-xs font-medium focus:ring-2 focus:ring-[#9B111E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Public Contact Email</label>
                  <input
                    type="email"
                    value={form.contactEmail || ''}
                    onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                    placeholder="info@aaplajalgaonwala.com"
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-xs font-medium focus:ring-2 focus:ring-[#9B111E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Support Phone Number</label>
                  <input
                    type="text"
                    value={form.contactPhone || ''}
                    onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                    placeholder="+91 70574 46409"
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-xs font-medium focus:ring-2 focus:ring-[#9B111E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">WhatsApp Order Helpline</label>
                  <input
                    type="text"
                    value={form.whatsappNumber || ''}
                    onChange={(e) => setForm({ ...form, whatsappNumber: e.target.value })}
                    placeholder="+91 70574 46409"
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-xs font-medium focus:ring-2 focus:ring-[#9B111E]"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-stone-700 mb-1">Physical Store Address</label>
                  <input
                    type="text"
                    value={form.storeAddress || ''}
                    onChange={(e) => setForm({ ...form, storeAddress: e.target.value })}
                    placeholder="Full Jalgaon Store Address"
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-xs font-medium focus:ring-2 focus:ring-[#9B111E]"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 2: SMTP EMAIL SETTINGS */}
            <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs p-6">
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-stone-100">
                <div className="flex items-center gap-2.5">
                  <Mail className="w-5 h-5 text-[#9B111E]" />
                  <div>
                    <h2 className="text-sm font-black text-stone-900">Website SMTP Email Server Settings</h2>
                    <p className="text-[11px] text-stone-500">Configure your custom SMTP host to send order confirmations & notifications.</p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.enableEmailAlerts !== false}
                    onChange={(e) => setForm({ ...form, enableEmailAlerts: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-stone-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  <span className="ml-2 text-xs font-bold text-stone-700">
                    {form.enableEmailAlerts !== false ? 'Enabled' : 'Disabled'}
                  </span>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">SMTP Host</label>
                  <input
                    type="text"
                    value={form.smtpHost || ''}
                    onChange={(e) => setForm({ ...form, smtpHost: e.target.value })}
                    placeholder="e.g. smtp.gmail.com or mail.aaplajalgaonwala.com"
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-xs font-medium focus:ring-2 focus:ring-[#9B111E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">SMTP Port</label>
                  <input
                    type="number"
                    value={form.smtpPort || 587}
                    onChange={(e) => setForm({ ...form, smtpPort: Number(e.target.value) })}
                    placeholder="587 or 465"
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-xs font-medium focus:ring-2 focus:ring-[#9B111E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">SMTP Username / Email</label>
                  <input
                    type="text"
                    value={form.smtpUser || ''}
                    onChange={(e) => setForm({ ...form, smtpUser: e.target.value })}
                    placeholder="e.g. orders@aaplajalgaonwala.com"
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-xs font-medium focus:ring-2 focus:ring-[#9B111E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">SMTP Password / App Password</label>
                  <div className="relative">
                    <input
                      type={showSmtpPass ? 'text' : 'password'}
                      value={form.smtpPass || ''}
                      onChange={(e) => setForm({ ...form, smtpPass: e.target.value })}
                      placeholder="••••••••••••••••"
                      className="w-full px-3.5 py-2 pr-10 rounded-xl border border-stone-200 text-xs font-medium focus:ring-2 focus:ring-[#9B111E]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSmtpPass(!showSmtpPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
                    >
                      {showSmtpPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">From Sender Email</label>
                  <input
                    type="email"
                    value={form.smtpFromEmail || ''}
                    onChange={(e) => setForm({ ...form, smtpFromEmail: e.target.value })}
                    placeholder="orders@aaplajalgaonwala.com"
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-xs font-medium focus:ring-2 focus:ring-[#9B111E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">From Sender Display Name</label>
                  <input
                    type="text"
                    value={form.smtpFromName || ''}
                    onChange={(e) => setForm({ ...form, smtpFromName: e.target.value })}
                    placeholder="Aapla Jalgaonwala"
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-xs font-medium focus:ring-2 focus:ring-[#9B111E]"
                  />
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-stone-100 flex items-center justify-between">
                <p className="text-[11px] text-stone-500">
                  Test your SMTP email gateway directly by triggering a test verification email.
                </p>
                <button
                  type="button"
                  onClick={handleTestEmail}
                  disabled={isTestingEmail}
                  className="px-4 py-2 bg-stone-900 hover:bg-black text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isTestingEmail ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>{isTestingEmail ? 'Sending Test Email...' : 'Send Test Email'}</span>
                </button>
              </div>

              {emailTestResult && (
                <div
                  className={`mt-4 p-3 rounded-xl text-xs font-bold flex items-center gap-2.5 ${
                    emailTestResult.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {emailTestResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
                  <span>{typeof emailTestResult.message === 'string' ? emailTestResult.message : JSON.stringify(emailTestResult.message)}</span>
                </div>
              )}
            </div>

            {/* SECTION 3: TELEGRAM BOT ALERTS */}
            <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs p-6">
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-stone-100">
                <div className="flex items-center gap-2.5">
                  <Bot className="w-5 h-5 text-[#9B111E]" />
                  <div>
                    <h2 className="text-sm font-black text-stone-900">Telegram Bot Instant Order Alerts</h2>
                    <p className="text-[11px] text-stone-500">Receive instant push notifications on your Telegram app when an order is placed.</p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.enableTelegramAlerts !== false}
                    onChange={(e) => setForm({ ...form, enableTelegramAlerts: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-stone-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  <span className="ml-2 text-xs font-bold text-stone-700">
                    {form.enableTelegramAlerts !== false ? 'Enabled' : 'Disabled'}
                  </span>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Telegram Bot Token</label>
                  <div className="relative">
                    <input
                      type={showTelegramToken ? 'text' : 'password'}
                      value={form.telegramBotToken || ''}
                      onChange={(e) => setForm({ ...form, telegramBotToken: e.target.value })}
                      placeholder="e.g. 123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                      className="w-full px-3.5 py-2 pr-10 rounded-xl border border-stone-200 text-xs font-medium focus:ring-2 focus:ring-[#9B111E]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowTelegramToken(!showTelegramToken)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
                    >
                      {showTelegramToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Telegram Chat ID / Channel ID</label>
                  <input
                    type="text"
                    value={form.telegramChatId || ''}
                    onChange={(e) => setForm({ ...form, telegramChatId: e.target.value })}
                    placeholder="e.g. 987654321 or -100123456789"
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-xs font-medium focus:ring-2 focus:ring-[#9B111E]"
                  />
                </div>
              </div>

              {/* Telegram setup instructions */}
              <div className="p-4 bg-sky-50/70 rounded-xl border border-sky-200/70 text-xs text-sky-900 mb-4 space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-sky-950">
                  <HelpCircle className="w-4 h-4 text-sky-600" />
                  How to set up Telegram Bot Alerts in 2 minutes:
                </p>
                <ol className="list-decimal pl-5 space-y-1 text-[11px]">
                  <li>Open Telegram and search for <strong>@BotFather</strong>. Send <code>/newbot</code> to get your Bot Token.</li>
                  <li>Start a chat with your new bot and send any message.</li>
                  <li>Search for <strong>@userinfobot</strong> in Telegram to get your numeric <strong>Chat ID</strong>.</li>
                  <li>Paste both values above and click <strong>"Send Test Telegram Alert"</strong>.</li>
                </ol>
              </div>

              <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
                <p className="text-[11px] text-stone-500">Verify your Telegram bot credentials with an instant test message.</p>
                <button
                  type="button"
                  onClick={handleTestTelegram}
                  disabled={isTestingTelegram}
                  className="px-4 py-2 bg-sky-700 hover:bg-sky-800 text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isTestingTelegram ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>{isTestingTelegram ? 'Sending Test Alert...' : 'Send Test Telegram Alert'}</span>
                </button>
              </div>

              {telegramTestResult && (
                <div
                  className={`mt-4 p-4 rounded-2xl border transition-all space-y-3 ${
                    telegramTestResult.success ? 'bg-emerald-50 text-emerald-950 border-emerald-200' : 'bg-rose-50 text-rose-950 border-rose-200'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    {telegramTestResult.success ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-1 flex-1 min-w-0">
                      <h4 className="text-xs font-black">
                        {telegramTestResult.success ? 'Telegram Alert Sent Successfully!' : 'Telegram Delivery Failed'}
                      </h4>
                      <p className="text-xs font-semibold leading-relaxed">
                        {telegramTestResult.success
                          ? String(telegramTestResult.message || 'Telegram test message delivered!')
                          : String(telegramTestResult.error || 'Failed to deliver Telegram test message.')}
                      </p>
                      {Boolean(telegramTestResult.debugReason) && (
                        <div className="mt-2 text-[11px] bg-white/90 p-2.5 rounded-xl border border-stone-200 text-stone-800 font-medium">
                          <span className="font-bold text-stone-900 block">Diagnostic Reason:</span>
                          {String(telegramTestResult.debugReason)}
                        </div>
                      )}
                      {Boolean(telegramTestResult.troubleshooting) && (
                        <div className="mt-2 text-[11px] bg-amber-50/90 p-2.5 rounded-xl border border-amber-200 text-amber-950 font-medium">
                          <span className="font-bold text-amber-950 block">Troubleshooting:</span>
                          {String(telegramTestResult.troubleshooting)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 4: RAZORPAY PAYMENT GATEWAY */}
            <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs p-6">
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-stone-100">
                <div className="flex items-center gap-2.5">
                  <CreditCard className="w-5 h-5 text-[#9B111E]" />
                  <div>
                    <h2 className="text-sm font-black text-stone-900">Razorpay Payment Gateway Settings</h2>
                    <p className="text-[11px] text-stone-500">Configure online payment collection for UPI, Credit/Debit Cards, and NetBanking.</p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.enableRazorpay !== false}
                    onChange={(e) => setForm({ ...form, enableRazorpay: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-stone-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  <span className="ml-2 text-xs font-bold text-stone-700">
                    {form.enableRazorpay !== false ? 'Enabled' : 'Disabled'}
                  </span>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Razorpay Key ID</label>
                  <input
                    type="text"
                    value={form.razorpayKeyId || ''}
                    onChange={(e) => setForm({ ...form, razorpayKeyId: e.target.value })}
                    placeholder="rzp_live_xxxxxxxx or rzp_test_xxxxxxxx"
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-xs font-medium focus:ring-2 focus:ring-[#9B111E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Razorpay Key Secret</label>
                  <div className="relative">
                    <input
                      type={showRazorpaySecret ? 'text' : 'password'}
                      value={form.razorpayKeySecret || ''}
                      onChange={(e) => setForm({ ...form, razorpayKeySecret: e.target.value })}
                      placeholder="••••••••••••••••"
                      className="w-full px-3.5 py-2 pr-10 rounded-xl border border-stone-200 text-xs font-medium focus:ring-2 focus:ring-[#9B111E]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRazorpaySecret(!showRazorpaySecret)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
                    >
                      {showRazorpaySecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 5: GOOGLE MAPS API */}
            <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs p-6">
              <div className="flex items-center gap-2.5 pb-4 mb-6 border-b border-stone-100">
                <MapPin className="w-5 h-5 text-[#9B111E]" />
                <div>
                  <h2 className="text-sm font-black text-stone-900">Google Maps Places API Key</h2>
                  <p className="text-[11px] text-stone-500">
                    Used for address autocomplete on checkout & customer address book pages.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Google Maps API Key</label>
                <input
                  type="text"
                  value={form.googleMapsApiKey || ''}
                  onChange={(e) => setForm({ ...form, googleMapsApiKey: e.target.value })}
                  placeholder="AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-xs font-medium focus:ring-2 focus:ring-[#9B111E]"
                />
                <p className="mt-1.5 text-[11px] text-stone-500">
                  You can also configure <code>VITE_GOOGLE_MAPS_API_KEY</code> in environment variables.
                </p>
              </div>
            </div>

            {/* SECTION 5.5: CLOUDINARY MEDIA CDN SETTINGS */}
            <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs p-6">
              <div className="flex items-center gap-2.5 pb-4 mb-6 border-b border-stone-100">
                <ImageIcon className="w-5 h-5 text-[#9B111E]" />
                <div>
                  <h2 className="text-sm font-black text-stone-900">Cloudinary Media CDN Settings</h2>
                  <p className="text-[11px] text-stone-500">
                    Configure your Cloudinary credentials used for fast CDN image delivery and media uploads.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Cloud Name</label>
                  <input
                    type="text"
                    value={form.cloudinaryCloudName || ''}
                    onChange={(e) => setForm({ ...form, cloudinaryCloudName: e.target.value })}
                    placeholder="e.g. xbtfj9zf"
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-xs font-medium focus:ring-2 focus:ring-[#9B111E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">API Key</label>
                  <input
                    type="text"
                    value={form.cloudinaryApiKey || ''}
                    onChange={(e) => setForm({ ...form, cloudinaryApiKey: e.target.value })}
                    placeholder="e.g. 123456789012345"
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-xs font-medium focus:ring-2 focus:ring-[#9B111E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">API Secret</label>
                  <div className="relative">
                    <input
                      type={showCloudinarySecret ? 'text' : 'password'}
                      value={form.cloudinaryApiSecret || ''}
                      onChange={(e) => setForm({ ...form, cloudinaryApiSecret: e.target.value })}
                      placeholder="••••••••••••••••"
                      className="w-full px-3.5 py-2 pr-10 rounded-xl border border-stone-200 text-xs font-medium focus:ring-2 focus:ring-[#9B111E]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCloudinarySecret(!showCloudinarySecret)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
                    >
                      {showCloudinarySecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 6: USER PROFILE & DEFAULT AVATAR SETTINGS */}
            <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs p-6">
              <div className="flex items-center gap-2.5 pb-4 mb-6 border-b border-stone-100">
                <UserIcon className="w-5 h-5 text-[#9B111E]" />
                <div>
                  <h2 className="text-sm font-black text-stone-900">User Profile & Default Avatar Settings</h2>
                  <p className="text-[11px] text-stone-500">
                    Configure the fallback avatar shown across the website (Navbar, account header, review cards) when a user does not have a Google profile photo.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                {/* Preview Box */}
                <div className="bg-stone-50 rounded-2xl p-5 border border-stone-200 text-center flex flex-col items-center justify-center">
                  <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-3">Live Avatar Preview</span>
                  <div className="relative mb-3">
                    <img
                      src={form.defaultUserAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&h=200&q=80'}
                      alt="Default Avatar Preview"
                      className="w-20 h-20 rounded-full object-cover ring-4 ring-[#9B111E]/20 shadow-md bg-stone-100"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&h=200&q=80';
                      }}
                    />
                  </div>
                  <p className="text-xs font-bold text-stone-800">Sample Customer</p>
                  <p className="text-[10px] text-stone-500">customer@example.com</p>
                </div>

                {/* Input & Presets */}
                <div className="md:col-span-2 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Default User Avatar Image URL
                    </label>
                    <input
                      type="url"
                      value={form.defaultUserAvatar || ''}
                      onChange={(e) => setForm({ ...form, defaultUserAvatar: e.target.value })}
                      placeholder="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&h=200&q=80"
                      className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-xs font-medium focus:ring-2 focus:ring-[#9B111E]"
                    />
                    <p className="mt-1.5 text-[11px] text-stone-500">
                      Enter any image URL or select from our verified modern avatar presets below.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-2">Preset Quick Select</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {[
                        {
                          name: 'Warm Neutral',
                          url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&h=200&q=80'
                        },
                        {
                          name: 'Executive Smile',
                          url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&h=200&q=80'
                        },
                        {
                          name: 'Friendly Smile',
                          url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=200&h=200&q=80'
                        },
                        {
                          name: 'Minimal Vector',
                          url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&h=200&q=80'
                        }
                      ].map((preset) => (
                        <button
                          key={preset.url}
                          type="button"
                          onClick={() => setForm({ ...form, defaultUserAvatar: preset.url })}
                          className={`p-2 rounded-xl border flex items-center gap-2 text-left transition-all cursor-pointer ${
                            form.defaultUserAvatar === preset.url
                              ? 'border-[#9B111E] bg-[#9B111E]/5 ring-1 ring-[#9B111E]'
                              : 'border-stone-200 hover:bg-stone-50'
                          }`}
                        >
                          <img
                            src={preset.url}
                            alt={preset.name}
                            className="w-7 h-7 rounded-full object-cover shrink-0"
                          />
                          <span className="text-[11px] font-semibold text-stone-800 truncate">{preset.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 7: OUR STORY HERO IMAGE & HEADING CONFIGURATION */}
            <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs p-6">
              <div className="flex items-center gap-2.5 pb-4 mb-6 border-b border-stone-100">
                <ImageIcon className="w-5 h-5 text-[#9B111E]" />
                <div>
                  <h2 className="text-sm font-black text-stone-900">Our Story Page Hero Header & Background</h2>
                  <p className="text-[11px] text-stone-500">
                    Manage the main hero banner image and narrative title displayed at the top of the "Our Story" page.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                {/* Image Preview Box */}
                <div className="bg-stone-900 rounded-2xl overflow-hidden relative aspect-video border border-stone-800 shadow-md flex items-center justify-center">
                  <img
                    src={form.ourStoryHeroImageUrl || 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=1600&q=80'}
                    alt="Our Story Hero Preview"
                    className="w-full h-full object-cover opacity-60"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=1600&q=80';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 flex flex-col justify-end text-white">
                    <span className="text-[9px] font-black uppercase text-amber-400 tracking-wider">Hero Banner Preview</span>
                    <h4 className="text-xs font-bold truncate">{form.ourStoryHeroTitle || 'Rooted in Soil. Crafted for Modern Taste.'}</h4>
                  </div>
                </div>

                {/* Form Inputs */}
                <div className="md:col-span-2 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Hero Background Image URL
                    </label>
                    <input
                      type="url"
                      value={form.ourStoryHeroImageUrl || ''}
                      onChange={(e) => setForm({ ...form, ourStoryHeroImageUrl: e.target.value })}
                      placeholder="https://images.unsplash.com/photo-1596040033229-a9821ebd058d?..."
                      className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-xs font-medium focus:ring-2 focus:ring-[#9B111E]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        Hero Title
                      </label>
                      <input
                        type="text"
                        value={form.ourStoryHeroTitle || ''}
                        onChange={(e) => setForm({ ...form, ourStoryHeroTitle: e.target.value })}
                        placeholder="Rooted in Soil. Crafted for Modern Taste."
                        className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-xs font-medium focus:ring-2 focus:ring-[#9B111E]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        Hero Subtitle Narrative
                      </label>
                      <input
                        type="text"
                        value={form.ourStoryHeroSubtitle || ''}
                        onChange={(e) => setForm({ ...form, ourStoryHeroSubtitle: e.target.value })}
                        placeholder="How two visionaries from Jalgaon connected farming families..."
                        className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-xs font-medium focus:ring-2 focus:ring-[#9B111E]"
                      />
                    </div>
                  </div>

                  {/* Our Story Page Section Visibility Toggles */}
                  <div className="pt-4 border-t border-stone-100 space-y-3">
                    <h4 className="text-xs font-black uppercase text-stone-800 tracking-wider">
                      Our Story Page Section Visibility
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Media & Photo Gallery Toggle */}
                      <label className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                        form.showStoryMediaGallery !== false
                          ? 'bg-emerald-50/80 border-emerald-200'
                          : 'bg-stone-50 border-stone-200'
                      }`}>
                        <div className="flex items-center gap-2.5 pr-2">
                          <ImageIcon className={`w-4 h-4 ${form.showStoryMediaGallery !== false ? 'text-emerald-700' : 'text-stone-400'}`} />
                          <div>
                            <p className="text-xs font-bold text-stone-900">Media & Photo Gallery</p>
                            <p className="text-[10px] text-stone-500">Show photo grid section on /our-story</p>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={form.showStoryMediaGallery !== false}
                          onChange={(e) => setForm({ ...form, showStoryMediaGallery: e.target.checked })}
                          className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                        />
                      </label>

                      {/* Watch Story Video Toggle */}
                      <label className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                        form.showStoryVideoSection !== false
                          ? 'bg-emerald-50/80 border-emerald-200'
                          : 'bg-stone-50 border-stone-200'
                      }`}>
                        <div className="flex items-center gap-2.5 pr-2">
                          <Video className={`w-4 h-4 ${form.showStoryVideoSection !== false ? 'text-emerald-700' : 'text-stone-400'}`} />
                          <div>
                            <p className="text-xs font-bold text-stone-900">Watch Story Videos</p>
                            <p className="text-[10px] text-stone-500">Show video player section on /our-story</p>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={form.showStoryVideoSection !== false}
                          onChange={(e) => setForm({ ...form, showStoryVideoSection: e.target.checked })}
                          className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 8: WATCH OUR STORY IN ACTION (VIDEO MANAGER) */}
            <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
                <div className="flex items-center gap-2.5">
                  <Video className="w-5 h-5 text-[#9B111E]" />
                  <div>
                    <h2 className="text-sm font-black text-stone-900">"Watch Our Story in Action" Video Manager</h2>
                    <p className="text-[11px] text-stone-500">
                      Add, edit, or delete video highlights shown on both the Home Page and Our Story page with custom tag badges.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleOpenAddVideo}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer self-start sm:self-auto shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Video</span>
                </button>
              </div>

              {/* Video List Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {videoList.length === 0 ? (
                  <div className="col-span-full py-8 text-center bg-stone-50 rounded-2xl border border-dashed border-stone-300 text-stone-500 text-xs">
                    No video items found. Click "Add New Video" above to create your first entry.
                  </div>
                ) : (
                  videoList.map((vid) => (
                    <div
                      key={vid.id}
                      className="bg-[#FAFAF8] rounded-2xl border border-stone-200/80 overflow-hidden flex flex-col justify-between shadow-2xs group hover:shadow-md transition-all"
                    >
                      <div>
                        <div className="relative h-40 w-full bg-stone-900">
                          <img
                            src={vid.thumbnail}
                            alt={vid.title}
                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                          />
                          <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 bg-amber-400 text-stone-950 text-[10px] font-black rounded-full uppercase tracking-wider shadow-xs">
                            {vid.category || 'Story Highlight'}
                          </span>
                          <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 bg-stone-950/80 text-white text-[10px] font-bold rounded">
                            {vid.duration || '02:30'}
                          </span>
                        </div>

                        <div className="p-4 space-y-1.5">
                          <h4 className="text-xs font-bold text-stone-900 line-clamp-1">{vid.title}</h4>
                          <p className="text-[11px] text-stone-500 line-clamp-2">{vid.description}</p>
                        </div>
                      </div>

                      <div className="px-4 py-3 bg-stone-100/70 border-t border-stone-200/60 flex items-center justify-between text-xs">
                        <span className="text-[10px] text-stone-500 font-medium truncate max-w-[120px]">
                          👤 {vid.speaker || 'Founders'}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEditVideo(vid)}
                            className="p-1.5 text-stone-600 hover:text-[#9B111E] hover:bg-white rounded-lg transition-colors cursor-pointer"
                            title="Edit Video"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteVideo(vid.id)}
                            className="p-1.5 text-stone-600 hover:text-red-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
                            title="Delete Video"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Bottom Save Bar */}
            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={isSaving}
                className="px-8 py-3 bg-[#9B111E] hover:bg-[#800e18] text-white text-xs font-bold rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>{isSaving ? 'Saving Changes...' : 'Save All Configs'}</span>
              </button>
            </div>
          </form>

          {/* Modal for Add / Edit Video */}
          {isVideoModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs animate-fadeIn">
              <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 space-y-5">
                <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                  <h3 className="text-base font-black text-stone-900">
                    {editingVideo ? 'Edit Video Item' : 'Add New Story Video'}
                  </h3>
                  <button
                    onClick={() => setIsVideoModalOpen(false)}
                    className="text-stone-400 hover:text-stone-600 text-lg font-bold"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSaveVideo} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Video Title *</label>
                    <input
                      type="text"
                      required
                      value={videoForm.title}
                      onChange={(e) => setVideoForm({ ...videoForm, title: e.target.value })}
                      placeholder="e.g. From Jalgaon Farms to Pan-India Crunch"
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-medium focus:ring-2 focus:ring-[#9B111E]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Description *</label>
                    <textarea
                      required
                      rows={3}
                      value={videoForm.description}
                      onChange={(e) => setVideoForm({ ...videoForm, description: e.target.value })}
                      placeholder="Brief summary of what this video shows..."
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-medium focus:ring-2 focus:ring-[#9B111E]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">Tag Badge Category *</label>
                      <select
                        value={videoForm.category}
                        onChange={(e) => setVideoForm({ ...videoForm, category: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-bold text-stone-800 focus:ring-2 focus:ring-[#9B111E]"
                      >
                        <option value="Brand Story">BRAND STORY</option>
                        <option value="Behind The Scenes">BEHIND THE SCENES</option>
                        <option value="Event Highlight">EVENT HIGHLIGHT</option>
                        <option value="Farmgate Sourcing">FARMGATE SOURCING</option>
                        <option value="Kitchen Walkthrough">KITCHEN WALKTHROUGH</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">Duration (MM:SS)</label>
                      <input
                        type="text"
                        value={videoForm.duration}
                        onChange={(e) => setVideoForm({ ...videoForm, duration: e.target.value })}
                        placeholder="03:45"
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-medium focus:ring-2 focus:ring-[#9B111E]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">YouTube / Video URL *</label>
                      <input
                        type="text"
                        required
                        value={videoForm.videoUrl}
                        onChange={(e) => setVideoForm({ ...videoForm, videoUrl: e.target.value })}
                        placeholder="https://www.youtube.com/embed/..."
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-medium focus:ring-2 focus:ring-[#9B111E]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">Presenter / Speaker</label>
                      <input
                        type="text"
                        value={videoForm.speaker}
                        onChange={(e) => setVideoForm({ ...videoForm, speaker: e.target.value })}
                        placeholder="Saurabh Patil & Jayesh Patil"
                        className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-xs font-medium focus:ring-2 focus:ring-[#9B111E]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Thumbnail Image URL *</label>
                    <input
                      type="url"
                      required
                      value={videoForm.thumbnail}
                      onChange={(e) => setVideoForm({ ...videoForm, thumbnail: e.target.value })}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-medium focus:ring-2 focus:ring-[#9B111E]"
                    />
                  </div>

                  <div className="pt-3 flex justify-end gap-3 border-t border-stone-100">
                    <button
                      type="button"
                      onClick={() => setIsVideoModalOpen(false)}
                      className="px-4 py-2 text-xs font-bold text-stone-600 hover:bg-stone-100 rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingVideo}
                      className="px-5 py-2 bg-[#9B111E] hover:bg-[#800e18] text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isSavingVideo ? 'Saving...' : editingVideo ? 'Update Video' : 'Add Video Entry'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </AdminLayout>
    </ErrorBoundary>
  );
}
