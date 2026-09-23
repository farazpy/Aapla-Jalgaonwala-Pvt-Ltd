'use client';

import React, { useState, useEffect } from 'react';
import { SiteSettings } from '@/types';
import { Image as ImageIcon, Save, Check, RefreshCw, Upload, Sparkles, Globe, Phone, Mail, MapPin, MessageSquare, CreditCard, Truck, Trash2, Eye, EyeOff, PlusCircle, Send, SendHorizontal, AlertCircle, CheckCircle2, HelpCircle, Terminal, Info } from 'lucide-react';
import { CloudinaryUpload } from './CloudinaryUpload';

export const BrandingTab: React.FC<{ showToast: (msg: string) => void }> = ({ showToast }) => {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [previewLogo, setPreviewLogo] = useState<string>('');
  const [previewFavicon, setPreviewFavicon] = useState<string>('');

  // Razorpay visibility toggle
  const [showRazorpaySecret, setShowRazorpaySecret] = useState(false);

  // Shipping zone inline editor states
  const [newZoneName, setNewZoneName] = useState('');
  const [newZonePincodes, setNewZonePincodes] = useState('');
  const [newZoneRate, setNewZoneRate] = useState<number>(50);
  const [newZoneFreeAbove, setNewZoneFreeAbove] = useState<number>(499);

  // Favicon generator states
  const [isGeneratingFavicon, setIsGeneratingFavicon] = useState(false);
  const [faviconGenerationResult, setFaviconGenerationResult] = useState<{
    files: string[];
    htmlMarkup: string;
  } | null>(null);

  // Telegram testing & debug states
  const [showTelegramToken, setShowTelegramToken] = useState(false);
  const [isTestingTelegram, setIsTestingTelegram] = useState(false);
  const [telegramTestResult, setTelegramTestResult] = useState<{
    success?: boolean;
    message?: string;
    error?: string;
    debugReason?: string;
    troubleshooting?: string;
    telegramResponse?: any;
  } | null>(null);

  const handleTestTelegram = async () => {
    if (!settings) return;
    setIsTestingTelegram(true);
    setTelegramTestResult(null);

    try {
      const res = await fetch('/api/admin/test-telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botToken: settings.telegramBotToken,
          chatId: settings.telegramChatId
        })
      });

      const json = await res.json().catch(() => ({
        success: false,
        error: { message: `Server returned non-JSON response (HTTP ${res.status}).` }
      }));

      if (json.success) {
        setTelegramTestResult({
          success: true,
          message: typeof json.data?.message === 'string'
            ? json.data.message
            : (typeof json.message === 'string' ? json.message : 'Test message delivered successfully!'),
          telegramResponse: json.data?.telegramResponse || json.telegramResponse || null
        });
        showToast('Telegram test message sent successfully!');
      } else {
        const errorMsg = typeof json.error === 'string'
          ? json.error
          : (json.error?.message || json.message || 'Failed to send Telegram test message.');

        const errorDetails = (json.error && typeof json.error === 'object' && json.error.details)
          ? json.error.details
          : (json.details || {});

        setTelegramTestResult({
          success: false,
          error: String(errorMsg),
          debugReason: typeof errorDetails.debugReason === 'string'
            ? errorDetails.debugReason
            : (errorDetails.debugReason ? String(JSON.stringify(errorDetails.debugReason)) : 'Telegram API returned error status.'),
          troubleshooting: typeof errorDetails.troubleshooting === 'string'
            ? errorDetails.troubleshooting
            : (errorDetails.troubleshooting ? String(JSON.stringify(errorDetails.troubleshooting)) : 'Please verify Bot Token & Chat ID.'),
          telegramResponse: errorDetails.telegramResponse || json.telegramResponse || null
        });
      }
    } catch (err: any) {
      setTelegramTestResult({
        success: false,
        error: `Network Error: ${err?.message || 'Failed to communicate with server.'}`,
        debugReason: 'Could not connect to backend server.',
        troubleshooting: 'Check your internet connection and server status.',
        telegramResponse: null
      });
    } finally {
      setIsTestingTelegram(false);
    }
  };

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/settings');
      const json = await res.json();
      if (json.success && json.data) {
        setSettings(json.data);
        setPreviewLogo(json.data.appLogo || '');
        setPreviewFavicon(json.data.faviconUrl || '');
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await fetch('/api/settings');
        const json = await res.json();
        if (active && json.success && json.data) {
          setSettings(json.data);
          setPreviewLogo(json.data.appLogo || '');
          setPreviewFavicon(json.data.faviconUrl || '');
        }
      } catch (err) {
        console.error('Error fetching settings:', err);
      } finally {
        if (active) setIsLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('File size exceeds 2MB limit. Please choose a smaller image.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setPreviewLogo(base64);
        if (settings) {
          setSettings({ ...settings, appLogo: base64 });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setIsSaving(true);

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      const json = await res.json();
      if (json.success) {
        showToast('App Logo & Site Settings updated live!');
        setSettings(json.data);
      } else {
        alert(json.error || 'Failed to update settings');
      }
    } catch (err) {
      console.error('Error updating settings:', err);
      alert('Error saving settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !settings) {
    return (
      <div className="p-12 text-center text-stone-500 font-medium flex items-center justify-center gap-2">
        <RefreshCw className="w-5 h-5 animate-spin text-[#9B111E]" />
        <span>Loading Site Branding & App Logo settings...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-8 max-w-5xl mx-auto">
      {/* 1. APP LOGO MANAGEMENT BLOCK */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/80 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-stone-100 pb-4">
          <div>
            <span className="text-xs font-bold text-[#D9531E] uppercase tracking-wider">Brand Visual Identity</span>
            <h2 className="text-xl font-black text-stone-900">App Logo & Brand Badge</h2>
            <p className="text-xs text-stone-500">Update your store logo displayed in header, footer, and admin panel.</p>
          </div>
          <span className="px-3 py-1 bg-amber-100 text-amber-900 text-xs font-extrabold rounded-full flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#9B111E]" />
            Live Sync
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Logo Preview Box */}
          <div className="md:col-span-4 flex flex-col items-center justify-center p-6 bg-[#FAF6ED] rounded-2xl border-2 border-dashed border-stone-300 space-y-3 text-center">
            <div className="w-24 h-24 rounded-2xl bg-white border border-stone-200 shadow-md p-2 flex items-center justify-center overflow-hidden">
              {previewLogo ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={previewLogo} alt="App Logo Preview" className="w-full h-full object-contain" />
              ) : (
                <div className="w-full h-full rounded-xl bg-gradient-to-br from-[#9B111E] to-[#D9531E] text-white flex items-center justify-center font-black text-2xl">
                  AJ
                </div>
              )}
            </div>
            <div>
              <p className="text-xs font-bold text-stone-900">{previewLogo ? 'Custom App Logo' : 'Default AJ Badge'}</p>
              <p className="text-[11px] text-stone-500">PNG, JPG, SVG or Base64</p>
            </div>
          </div>

          {/* Logo Source Controls */}
          <div className="md:col-span-8 space-y-4">
            <CloudinaryUpload
              label="Store Logo Image"
              folder="branding"
              currentValue={previewLogo}
              multiple={false}
              onUploadSuccess={(url) => {
                setPreviewLogo(url);
                if (settings) {
                  setSettings({ ...settings, appLogo: url });
                }
              }}
            />

            <CloudinaryUpload
              label="Store Favicon Image (Shows in browser tab & search engine results)"
              folder="branding"
              currentValue={previewFavicon}
              multiple={false}
              onUploadSuccess={(url) => {
                setPreviewFavicon(url);
                if (settings) {
                  setSettings({ ...settings, faviconUrl: url });
                }
              }}
            />

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">Store Name</label>
                <input
                  type="text"
                  value={settings.storeName}
                  onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                  className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-900"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">Brand Tagline</label>
                <input
                  type="text"
                  value={settings.tagline || ''}
                  onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                  placeholder="Authentic Khandeshi Taste"
                  className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-900"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. HERO SECTION & SHOWCASE CUSTOMIZATION */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/80 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-stone-100 pb-4">
          <div>
            <span className="text-xs font-bold text-[#D9531E] uppercase tracking-wider">Homepage Banner & Visuals</span>
            <h2 className="text-xl font-black text-stone-900">Hero Section, Image & Pill Badges</h2>
            <p className="text-xs text-stone-500">Customize the top hero headline, eyebrow badge, call-to-action buttons, and right-side showcase image card.</p>
          </div>
          <span className="px-3 py-1 bg-amber-100 text-amber-900 text-xs font-extrabold rounded-full flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#9B111E]" />
            Live on Home
          </span>
        </div>

        {/* Hero Left Content Customization */}
        <div className="space-y-4">
          <h3 className="text-sm font-black text-stone-900 border-b border-stone-100 pb-2">1. Hero Title & Text</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1">
                Top Eyebrow Pill Badge Text
              </label>
              <input
                type="text"
                value={settings.heroEyebrow || ''}
                onChange={(e) => setSettings({ ...settings, heroEyebrow: e.target.value })}
                placeholder="Rooted in Tradition. Crafted for Modern Taste."
                className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-900"
              />
              <p className="text-[11px] text-stone-500 mt-1">Small badge above the main headline.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1">
                Highlighted Word in Headline (Gradient Accent)
              </label>
              <input
                type="text"
                value={settings.heroTitleHighlight || ''}
                onChange={(e) => setSettings({ ...settings, heroTitleHighlight: e.target.value })}
                placeholder="Jalgaon"
                className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-900"
              />
              <p className="text-[11px] text-stone-500 mt-1">This word inside the title will be colored in brand gradient.</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-800 mb-1">
              Main Hero Headline Title
            </label>
            <input
              type="text"
              value={settings.heroTitle || ''}
              onChange={(e) => setSettings({ ...settings, heroTitle: e.target.value })}
              placeholder="A Taste of Jalgaon in Every Bite."
              className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-800 mb-1">
              Hero Supporting Subtitle / Description
            </label>
            <textarea
              rows={2}
              value={settings.heroSubtitle || ''}
              onChange={(e) => setSettings({ ...settings, heroSubtitle: e.target.value })}
              placeholder="Authentic banana chips, farsaan, masalas and regional flavours crafted for today's generation..."
              className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-900"
            />
          </div>

          {/* CTA Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2">
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1">Primary Button Text</label>
              <input
                type="text"
                value={settings.heroPrimaryCtaText || ''}
                onChange={(e) => setSettings({ ...settings, heroPrimaryCtaText: e.target.value })}
                placeholder="Shop Now"
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1">Primary Button Link</label>
              <input
                type="text"
                value={settings.heroPrimaryCtaLink || ''}
                onChange={(e) => setSettings({ ...settings, heroPrimaryCtaLink: e.target.value })}
                placeholder="/shop"
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1">Secondary Button Text</label>
              <input
                type="text"
                value={settings.heroSecondaryCtaText || ''}
                onChange={(e) => setSettings({ ...settings, heroSecondaryCtaText: e.target.value })}
                placeholder="Our Story"
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1">Secondary Button Link</label>
              <input
                type="text"
                value={settings.heroSecondaryCtaLink || ''}
                onChange={(e) => setSettings({ ...settings, heroSecondaryCtaLink: e.target.value })}
                placeholder="/our-story"
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-900"
              />
            </div>
          </div>
        </div>

        {/* Hero Right Visual Showcase Card & Floating Pill Badge */}
        <div className="pt-4 border-t border-stone-100 space-y-4">
          <h3 className="text-sm font-black text-stone-900 border-b border-stone-100 pb-2">2. Hero Showcase Image & Highlight Badge</h3>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {/* Visual Preview */}
            <div className="md:col-span-4 bg-[#FAF6ED] p-4 rounded-2xl border border-stone-200 text-center space-y-2">
              <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-white border border-stone-200 shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={settings.heroCardImage || 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=1000&q=80'}
                  alt="Hero Showcase Preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 left-2 right-2 bg-black/60 backdrop-blur-xs p-2 rounded-lg text-white text-left">
                  <span className="text-[9px] bg-[#D9531E] px-1.5 py-0.5 rounded font-bold uppercase">
                    {settings.heroCardBadge || 'Hero Special'}
                  </span>
                  <p className="text-xs font-bold truncate">{settings.heroCardTitle || 'Khandeshi Masala Banana Chips'}</p>
                </div>
              </div>
              <p className="text-[11px] font-semibold text-stone-500">Live Hero Card Preview</p>
            </div>

            {/* Controls */}
            <div className="md:col-span-8 space-y-4">
              <CloudinaryUpload
                label="Hero Showcase Card Image"
                folder="hero"
                currentValue={settings.heroCardImage || ''}
                onUploadSuccess={(url) => {
                  if (settings) {
                    setSettings({ ...settings, heroCardImage: url });
                  }
                }}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">Showcase Pill Badge</label>
                  <input
                    type="text"
                    value={settings.heroCardBadge || ''}
                    onChange={(e) => setSettings({ ...settings, heroCardBadge: e.target.value })}
                    placeholder="Hero Special"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">Showcase Title</label>
                  <input
                    type="text"
                    value={settings.heroCardTitle || ''}
                    onChange={(e) => setSettings({ ...settings, heroCardTitle: e.target.value })}
                    placeholder="Khandeshi Masala Banana Chips"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">Showcase Subtitle</label>
                <input
                  type="text"
                  value={settings.heroCardSubtitle || ''}
                  onChange={(e) => setSettings({ ...settings, heroCardSubtitle: e.target.value })}
                  placeholder="Thin, crispy, and tossed in authentic regional spices"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-900"
                />
              </div>

              {/* Floating Highlight Pill Badge */}
              <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-900">Floating Pill Badge (Bottom-Left of Card)</span>
                  <label className="flex items-center gap-2 text-xs font-semibold text-stone-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.heroPillEnabled !== false}
                      onChange={(e) => setSettings({ ...settings, heroPillEnabled: e.target.checked })}
                      className="w-4 h-4 text-[#9B111E] rounded-md focus:ring-0"
                    />
                    <span>Show Badge</span>
                  </label>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 mb-1">Badge Title</label>
                    <input
                      type="text"
                      value={settings.heroPillTitle || ''}
                      onChange={(e) => setSettings({ ...settings, heroPillTitle: e.target.value })}
                      placeholder="10 Unique Flavours"
                      className="w-full px-3 py-1.5 bg-white border border-stone-200 rounded-xl text-xs font-medium text-stone-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 mb-1">Badge Subtitle</label>
                    <input
                      type="text"
                      value={settings.heroPillSubtitle || ''}
                      onChange={(e) => setSettings({ ...settings, heroPillSubtitle: e.target.value })}
                      placeholder="From Peri Peri to Pani Poori"
                      className="w-full px-3 py-1.5 bg-white border border-stone-200 rounded-xl text-xs font-medium text-stone-900"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. ANNOUNCEMENT BAR & STORE DETAILS */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/80 shadow-xs space-y-6">
        <div className="border-b border-stone-100 pb-4">
          <span className="text-xs font-bold text-[#D9531E] uppercase tracking-wider">Store Info & Announcement Bar</span>
          <h2 className="text-xl font-black text-stone-900">Top Announcement Banner & Contact Info</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-stone-50 p-4 rounded-2xl border border-stone-200/80">
              <div>
                <p className="text-xs font-bold text-stone-900">Enable Announcement Banner</p>
                <p className="text-[11px] text-stone-500">Displays announcement message at top of all pages</p>
              </div>
              <input
                type="checkbox"
                checked={settings.announcementEnabled}
                onChange={(e) => setSettings({ ...settings, announcementEnabled: e.target.checked })}
                className="w-5 h-5 text-[#9B111E] rounded-md focus:ring-0 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1">Announcement Text</label>
              <input
                type="text"
                value={settings.announcementText}
                onChange={(e) => setSettings({ ...settings, announcementText: e.target.value })}
                className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1">Legal Name (Pvt Ltd)</label>
              <input
                type="text"
                value={settings.storeLegalNamePvt}
                onChange={(e) => setSettings({ ...settings, storeLegalNamePvt: e.target.value })}
                className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-900"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#9B111E]" />
                <span>Contact Phone</span>
              </label>
              <input
                type="text"
                value={settings.contactPhone}
                onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#9B111E]" />
                <span>Contact Email</span>
              </label>
              <input
                type="email"
                value={settings.contactEmail}
                onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                <span>WhatsApp Number (With Country Code)</span>
              </label>
              <input
                type="text"
                value={settings.whatsappNumber}
                onChange={(e) => setSettings({ ...settings, whatsappNumber: e.target.value })}
                className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-900"
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-stone-800 mb-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#9B111E]" />
              <span>Physical Store Address</span>
            </label>
            <textarea
              rows={2}
              value={settings.storeAddress}
              onChange={(e) => setSettings({ ...settings, storeAddress: e.target.value })}
              className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-900"
            />
          </div>
        </div>
      </div>

      {/* 4. RAZORPAY API CREDENTIALS BLOCK */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/80 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-stone-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 shadow-2xs">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block">Real-time Payments</span>
              <h2 className="text-xl font-black text-stone-900">Razorpay API Keys Configuration</h2>
              <p className="text-xs text-stone-500">Update your API credentials securely to accept instant online payments on checkout.</p>
            </div>
          </div>
          <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-extrabold rounded-full">
            Encrypted Storage
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-extrabold text-stone-800 mb-1.5 uppercase tracking-wider">
              Razorpay Key ID
            </label>
            <input
              type="text"
              value={settings.razorpayKeyId || ''}
              onChange={(e) => setSettings({ ...settings, razorpayKeyId: e.target.value })}
              placeholder="e.g. rzp_test_L2V45WjR..."
              className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#9B111E]"
            />
            <p className="text-[10px] text-stone-500 mt-1.5 font-medium leading-relaxed">
              Retrieve this from your Razorpay Dashboard &gt; Settings &gt; API Keys &gt; Generate Key.
            </p>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-stone-800 mb-1.5 uppercase tracking-wider">
              Razorpay Key Secret
            </label>
            <div className="relative">
              <input
                type={showRazorpaySecret ? 'text' : 'password'}
                value={settings.razorpayKeySecret || ''}
                onChange={(e) => setSettings({ ...settings, razorpayKeySecret: e.target.value })}
                placeholder="••••••••••••••••••••"
                className="w-full pl-4 pr-11 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#9B111E]"
              />
              <button
                type="button"
                onClick={() => setShowRazorpaySecret(!showRazorpaySecret)}
                className="absolute right-3.5 top-2.5 text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                {showRazorpaySecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-stone-500 mt-1.5 font-medium leading-relaxed">
              Required to securely authenticate refunds, Webhooks, and order capture validations.
            </p>
          </div>
        </div>
      </div>

      {/* 5. TELEGRAM BOT ORDER ALERTS & LIVE DEBUG BLOCK */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/80 shadow-xs space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 shadow-2xs">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-sky-600 uppercase tracking-wider block">Instant Mobile Alerts</span>
              <h2 className="text-xl font-black text-stone-900">Telegram Bot Order Notifications</h2>
              <p className="text-xs text-stone-500">Receive instant, formatted order notifications directly in your Telegram app or channel.</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer bg-stone-50 hover:bg-stone-100 px-3.5 py-2 rounded-xl border border-stone-200 text-xs font-bold text-stone-800 transition-colors">
              <input
                type="checkbox"
                checked={settings.enableTelegramAlerts !== false}
                onChange={(e) => setSettings({ ...settings, enableTelegramAlerts: e.target.checked })}
                className="w-4 h-4 text-sky-600 rounded focus:ring-0 cursor-pointer"
              />
              <span>Enable Telegram Alerts</span>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-extrabold text-stone-800 mb-1.5 uppercase tracking-wider">
              Telegram Bot Token
            </label>
            <div className="relative">
              <input
                type={showTelegramToken ? 'text' : 'password'}
                value={settings.telegramBotToken || ''}
                onChange={(e) => setSettings({ ...settings, telegramBotToken: e.target.value })}
                placeholder="e.g. 7123456789:AAE_..."
                className="w-full pl-4 pr-11 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-900 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
              <button
                type="button"
                onClick={() => setShowTelegramToken(!showTelegramToken)}
                className="absolute right-3.5 top-2.5 text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                {showTelegramToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-stone-500 mt-1.5 font-medium leading-relaxed">
              Obtain your HTTP API Bot Token from <b>@BotFather</b> on Telegram.
            </p>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-stone-800 mb-1.5 uppercase tracking-wider">
              Telegram Chat ID / Channel ID
            </label>
            <input
              type="text"
              value={settings.telegramChatId || ''}
              onChange={(e) => setSettings({ ...settings, telegramChatId: e.target.value })}
              placeholder="e.g. 987654321 or -100123456789 or @channelname"
              className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-900 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
            <p className="text-[10px] text-stone-500 mt-1.5 font-medium leading-relaxed">
              Numeric User ID (from <b>@userinfobot</b>), Group ID (starting with <b>-100</b>), or <b>@channelusername</b>.
            </p>
          </div>
        </div>

        {/* Action Button & Alert Preview Box */}
        <div className="space-y-4 pt-2 border-t border-stone-100">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-stone-500 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-sky-500 shrink-0" />
              <span>Instant alerts contain full customer profiles, detailed delivery addresses, items ordered, and COD/Payment status.</span>
            </p>
            <button
              type="button"
              onClick={handleTestTelegram}
              disabled={isTestingTelegram}
              className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isTestingTelegram ? (
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
              ) : (
                <SendHorizontal className="w-4 h-4 text-sky-100" />
              )}
              <span>{isTestingTelegram ? 'Testing Telegram Connection...' : 'Send Test Telegram Alert'}</span>
            </button>
          </div>

          {/* Sample Format Preview */}
          <div className="bg-sky-50/60 border border-sky-200/80 rounded-2xl p-4 text-xs space-y-2">
            <div className="flex items-center justify-between text-sky-900 font-extrabold text-[11px] uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <SendHorizontal className="w-3.5 h-3.5 text-sky-600" />
                <span>Format of New Order Alert Delivered to Telegram</span>
              </span>
              <span className="bg-sky-200/70 text-sky-800 px-2 py-0.5 rounded-md text-[10px] font-mono">HTML Format</span>
            </div>
            <div className="bg-stone-900 text-stone-100 font-mono text-[11px] p-3.5 rounded-xl space-y-1.5 leading-relaxed overflow-x-auto shadow-inner border border-stone-800">
              <p className="text-amber-400 font-bold">🛍️ NEW ORDER PLACED #AJW-2026-1084</p>
              <p className="text-stone-300">🏪 Store: Aapla Jalgaonwala | ⏰ Date: 19 Aug 2026, 03:45 PM IST</p>
              <div className="border-t border-stone-800 pt-1">
                <p className="text-sky-300 font-bold">👤 CUSTOMER INFORMATION</p>
                <p className="text-stone-300">• Name: Rajesh Patil</p>
                <p className="text-stone-300">• Phone: +91 98220 12345</p>
                <p className="text-stone-300">• Email: rajesh.patil@example.com</p>
              </div>
              <div className="border-t border-stone-800 pt-1">
                <p className="text-emerald-300 font-bold">📍 FULL DELIVERY ADDRESS</p>
                <p className="text-stone-300">📍 House/Street: Flat 402, Shivam Pride, Near Golani Market</p>
                <p className="text-stone-300">📍 Area/Society: Navi Peth, Jalgaon</p>
                <p className="text-stone-300">📍 Location: Jalgaon, Maharashtra, PIN: 425001</p>
              </div>
              <div className="border-t border-stone-800 pt-1">
                <p className="text-yellow-300 font-bold">📦 ORDERED ITEMS (2)</p>
                <p className="text-stone-300">  1. Authentic Khandeshi Shev (500g) ↳ 2 pcs × ₹160 = ₹320</p>
                <p className="text-stone-300">  2. Special Jalgaon Banana Chips (250g) ↳ 1 pcs × ₹120 = ₹120</p>
              </div>
              <div className="border-t border-stone-800 pt-1">
                <p className="text-pink-300 font-bold">💵 PAYMENT DETAILS</p>
                <p className="text-stone-300">💳 Payment Mode: Cash on Delivery (COD)</p>
                <p className="text-amber-300">⏳ Payment Status: Pending Payment on Delivery</p>
                <p className="text-amber-200">⚠️ Pending Cash to Collect at Doorstep: ₹440</p>
              </div>
            </div>
          </div>
        </div>

        {/* Telegram Test Result & Debug Console Card */}
        {telegramTestResult && (
          <div
            className={`p-5 rounded-2xl border transition-all space-y-4 ${
              telegramTestResult.success
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                : 'bg-rose-50/70 border-rose-200 text-rose-950'
            }`}
          >
            <div className="flex items-start gap-3">
              {telegramTestResult.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1 flex-1 min-w-0 overflow-hidden">
                <h4 className="text-sm font-black flex items-center justify-between flex-wrap gap-2">
                  <span>
                    {telegramTestResult.success
                      ? '✅ Telegram Connection Verified!'
                      : '❌ Telegram Delivery Failed / Debug Active'}
                  </span>
                  <span
                    className={`text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full border ${
                      telegramTestResult.success
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : 'bg-rose-100 text-rose-800 border-rose-300'
                    }`}
                  >
                    {telegramTestResult.success ? 'HTTP 200 OK' : 'Telegram Error'}
                  </span>
                </h4>
                <p className="text-xs font-bold leading-relaxed break-words">
                  {telegramTestResult.success
                    ? String(telegramTestResult.message || 'Test message delivered!')
                    : String(telegramTestResult.error || 'Telegram alert failed.')}
                </p>

                {/* Diagnostic Summary */}
                {Boolean(telegramTestResult.debugReason) && (
                  <div className="mt-2 text-xs font-medium text-stone-800 bg-white/90 p-3 rounded-xl border border-stone-200 shadow-2xs break-words">
                    <span className="font-extrabold text-stone-900 block mb-0.5">🔍 Diagnostic Summary:</span>
                    {String(telegramTestResult.debugReason)}
                  </div>
                )}

                {/* Troubleshooting Guide */}
                {Boolean(telegramTestResult.troubleshooting) && (
                  <div className="mt-2 text-xs font-medium bg-amber-50/90 text-amber-950 p-3.5 rounded-xl border border-amber-200/90 space-y-1 shadow-2xs break-words">
                    <span className="font-extrabold text-amber-950 block flex items-center gap-1.5">
                      <HelpCircle className="w-4 h-4 text-amber-700 shrink-0" />
                      <span>Troubleshooting Instructions to Resolve This Issue:</span>
                    </span>
                    <p className="whitespace-pre-line text-[11px] leading-relaxed pt-1">
                      {String(telegramTestResult.troubleshooting)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Raw Telegram API JSON Viewer */}
            {telegramTestResult.telegramResponse && (
              <div className="mt-3 pt-3 border-t border-stone-200/80 space-y-1.5 overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-stone-600 shrink-0" />
                    <span>Raw Response Object from Telegram API (api.telegram.org)</span>
                  </span>
                  <span className="text-[10px] text-stone-500 font-mono">json_response</span>
                </div>
                <pre className="p-3.5 bg-stone-900 text-amber-300 font-mono text-[11px] rounded-xl border border-stone-800 overflow-x-auto shadow-inner max-h-56 leading-snug">
                  {typeof telegramTestResult.telegramResponse === 'string'
                    ? telegramTestResult.telegramResponse
                    : JSON.stringify(telegramTestResult.telegramResponse, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 6. SHIPPING ZONES & DELIVERY RULES BLOCK */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/80 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-stone-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 shadow-2xs">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block">Logistics & Deliveries</span>
              <h2 className="text-xl font-black text-stone-900">Shipping Zones & Delivery Rules</h2>
              <p className="text-xs text-stone-500">Configure delivery pricing, supported pincodes, flat rates, and free shipping criteria.</p>
            </div>
          </div>
          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-extrabold rounded-full">
            Active Shipping Rules
          </span>
        </div>

        {/* Existing Zones List */}
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase text-stone-400 tracking-wider">Configured Shipping Zones</h3>
          
          <div className="border border-stone-200 rounded-2xl overflow-hidden bg-stone-50/20">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 font-extrabold uppercase text-[10px] tracking-wider">
                  <th className="p-3.5">Zone Name</th>
                  <th className="p-3.5">Supported Pincodes</th>
                  <th className="p-3.5 text-center">Flat Delivery Rate</th>
                  <th className="p-3.5 text-center">Free Shipping Above</th>
                  <th className="p-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 font-semibold text-stone-800">
                {(settings.shippingZones || []).length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-stone-500 font-medium">
                      No customized shipping zones configured. Local/global rules apply.
                    </td>
                  </tr>
                ) : (
                  (settings.shippingZones || []).map((zone) => (
                    <tr key={zone.id} className="hover:bg-white transition-colors">
                      <td className="p-3.5 font-bold text-stone-900">
                        {zone.name}
                      </td>
                      <td className="p-3.5 max-w-xs">
                        <div className="flex flex-wrap gap-1">
                          {zone.pincodes.map((pin, pidx) => (
                            <span key={pidx} className="px-2 py-0.5 bg-stone-100 text-stone-600 rounded-md text-[10px] font-bold border border-stone-200">
                              {pin}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-3.5 text-center font-extrabold text-stone-900">
                        ₹{zone.rate}
                      </td>
                      <td className="p-3.5 text-center text-emerald-700">
                        {zone.freeDeliveryAbove ? (
                          <span className="font-extrabold">₹{zone.freeDeliveryAbove}+ orders</span>
                        ) : (
                          <span className="text-stone-400 font-medium">Never free</span>
                        )}
                      </td>
                      <td className="p-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            const updatedZones = (settings.shippingZones || []).filter(z => z.id !== zone.id);
                            setSettings({ ...settings, shippingZones: updatedZones });
                            showToast(`Removed zone "${zone.name}"`);
                          }}
                          className="p-1.5 hover:bg-red-50 text-stone-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create New Zone Form */}
        <div className="p-5 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-4">
          <h3 className="text-xs font-black uppercase text-stone-800 tracking-wider flex items-center gap-1.5">
            <PlusCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Add New Custom Shipping Zone</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-[10px] font-extrabold text-stone-600 uppercase tracking-wider mb-1">
                Zone Name
              </label>
              <input
                type="text"
                placeholder="e.g. Local Pincodes"
                value={newZoneName}
                onChange={(e) => setNewZoneName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs font-semibold text-stone-900"
              />
            </div>

            <div>
              <label className="block text-[10px] font-extrabold text-stone-600 uppercase tracking-wider mb-1">
                Flat Shipping Rate (₹)
              </label>
              <input
                type="number"
                placeholder="e.g. 50"
                value={newZoneRate}
                onChange={(e) => setNewZoneRate(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs font-semibold text-stone-900"
              />
            </div>

            <div>
              <label className="block text-[10px] font-extrabold text-stone-600 uppercase tracking-wider mb-1">
                Free Delivery Order Threshold (₹)
              </label>
              <input
                type="number"
                placeholder="e.g. 499 (Optional)"
                value={newZoneFreeAbove || ''}
                onChange={(e) => setNewZoneFreeAbove(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs font-semibold text-stone-900"
              />
            </div>

            <div>
              <label className="block text-[10px] font-extrabold text-stone-600 uppercase tracking-wider mb-1">
                Pincodes list (Comma separated)
              </label>
              <input
                type="text"
                placeholder="e.g. 425001, 425002, 425*"
                value={newZonePincodes}
                onChange={(e) => setNewZonePincodes(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs font-semibold text-stone-900"
              />
            </div>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-stone-200/60">
            <p className="text-[10px] text-stone-500 font-medium leading-normal max-w-xl">
              💡 Use wildcards like <span className="font-bold text-stone-700">425*</span> to match all pincodes beginning with 425. Use <span className="font-bold text-stone-700">*</span> to match all other addresses.
            </p>
            <button
              type="button"
              onClick={() => {
                if (!newZoneName.trim() || !newZonePincodes.trim()) {
                  alert('Please enter Zone Name and Pincodes list.');
                  return;
                }
                const pinArray = newZonePincodes.split(',').map(p => p.trim()).filter(Boolean);
                const newZoneObj = {
                  id: 'zone-' + Date.now(),
                  name: newZoneName,
                  pincodes: pinArray,
                  rate: Number(newZoneRate) || 0,
                  freeDeliveryAbove: newZoneFreeAbove ? Number(newZoneFreeAbove) : undefined
                };
                const updatedZones = [...(settings.shippingZones || []), newZoneObj];
                setSettings({ ...settings, shippingZones: updatedZones });
                
                // Reset form
                setNewZoneName('');
                setNewZonePincodes('');
                setNewZoneRate(50);
                setNewZoneFreeAbove(499);
                showToast(`Zone "${newZoneName}" added successfully!`);
              }}
              className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-black tracking-wide flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <PlusCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Add Zone</span>
            </button>
          </div>
        </div>
      </div>

      {/* SAVE BUTTON BAR */}
      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={isSaving}
          className="px-8 py-3 bg-[#9B111E] hover:bg-[#800A14] text-white rounded-2xl text-xs font-extrabold shadow-md flex items-center gap-2 transition-all disabled:opacity-50"
        >
          {isSaving ? <RefreshCw className="w-4 h-4 animate-spin text-amber-300" /> : <Save className="w-4 h-4 text-amber-300" />}
          <span>{isSaving ? 'Saving Settings...' : 'Save App Logo & Branding Changes'}</span>
        </button>
      </div>
    </form>
  );
};
