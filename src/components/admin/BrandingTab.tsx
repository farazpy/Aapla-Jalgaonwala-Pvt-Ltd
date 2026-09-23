'use client';

import React, { useState, useEffect } from 'react';
import { SiteSettings } from '@/types';
import { DEFAULT_HEADER_LOGO, DEFAULT_HERO_IMAGE } from '@/data/settings';
import { Image as ImageIcon, Save, Check, RefreshCw, Upload, Sparkles, Globe, Phone, Mail, MapPin, MessageSquare, CreditCard, Truck, Trash2, Eye, EyeOff, PlusCircle } from 'lucide-react';
import { CloudinaryUpload } from './CloudinaryUpload';
import { FaviconSuiteManager } from './FaviconSuiteManager';

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

      {/* 2. DEDICATED FAVICON & WEB APP ICONS SUITE */}
      <FaviconSuiteManager
        showToast={showToast}
        mobileWebAppTitle={settings.mobileWebAppTitle || 'AJW'}
        onMobileTitleChange={(newTitle) => {
          setSettings({ ...settings, mobileWebAppTitle: newTitle });
        }}
      />

      {/* 3. HERO SECTION & SHOWCASE CUSTOMIZATION */}
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
                placeholder="Woman Partner Registration"
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1">Secondary Button Link</label>
              <input
                type="text"
                value={settings.heroSecondaryCtaLink || ''}
                onChange={(e) => setSettings({ ...settings, heroSecondaryCtaLink: e.target.value })}
                placeholder="/partner-program"
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
                  src={settings.heroCardImage || DEFAULT_HERO_IMAGE}
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
        <div className="border-b border-stone-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-xs font-bold text-[#D9531E] uppercase tracking-wider">Top Bar Alert & Store Details</span>
            <h2 className="text-xl font-black text-stone-900">Top Header Announcement Bar Alert</h2>
          </div>
          <div className="flex items-center gap-2 bg-stone-50 px-3.5 py-1.5 rounded-full border border-stone-200">
            <span className="text-xs font-bold text-stone-700">Banner Status:</span>
            <span className={`text-xs font-black px-2 py-0.5 rounded-full ${settings.announcementEnabled !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-600'}`}>
              {settings.announcementEnabled !== false ? 'Active (Visible)' : 'Disabled (Hidden)'}
            </span>
          </div>
        </div>

        {/* Live Preview Box */}
        <div className="space-y-2">
          <label className="block text-xs font-black text-stone-700 uppercase tracking-wider">
            Live Preview (How it appears to visitors)
          </label>
          <div className="rounded-2xl overflow-hidden border border-amber-900/40 shadow-xs bg-gradient-to-r from-[#800A14] via-[#9B111E] to-[#B8222F] text-white p-3 text-xs">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-stone-200 text-[11px]">
                <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="font-semibold text-amber-200">Store:</span>
                <span className="truncate max-w-[200px]">Jalgaon & Pune, MH</span>
                <span className="text-amber-400/50">•</span>
                <Phone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>{settings.contactPhone || '+91 70574 46409'}</span>
              </div>

              {settings.announcementEnabled !== false && (
                <div className="flex items-center gap-1.5 bg-amber-950/60 px-3 py-1 rounded-full border border-amber-500/40 text-amber-200 text-xs font-semibold shadow-xs">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse shrink-0" />
                  <span>
                    {settings.announcementTextMarathi || settings.announcementText || '✨ संपूर्ण स्टोअरवर ५% सूट • ₹४१९ पेक्षा जास्त किमतीच्या ऑर्डरवर मोफत शिपिंग'}
                  </span>
                </div>
              )}

              <div className="text-stone-300 text-[11px] hidden sm:block">
                <span>{settings.contactEmail || 'info@aaplajalgaonwala.com'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick 1-Click Preset Templates */}
        <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200/80 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-amber-950 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#9B111E]" />
              <span>Quick 1-Click Alert Templates</span>
            </span>
            <span className="text-[10px] font-bold text-amber-800 bg-amber-200/80 px-2 py-0.5 rounded-md">
              Click any template to apply
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setSettings({
                  ...settings,
                  announcementEnabled: true,
                  announcementText: '✨ 5% Discount Storewide • Free Shipping on Orders above ₹419',
                  announcementTextMarathi: '✨ संपूर्ण स्टोअरवर ५% सूट • ₹४१९ पेक्षा जास्त किमतीच्या ऑर्डरवर मोफत शिपिंग'
                });
              }}
              className="p-2.5 bg-white hover:bg-amber-100/60 border border-amber-200 rounded-xl text-left transition-colors cursor-pointer text-xs group"
            >
              <div className="font-bold text-stone-900 group-hover:text-[#9B111E]">5% OFF + Free Shipping over ₹419</div>
              <div className="text-[11px] text-stone-600 mt-0.5">✨ संपूर्ण स्टोअरवर ५% सूट • ₹४१९ पेक्षा जास्त किमतीच्या ऑर्डरवर मोफत शिपिंग</div>
            </button>

            <button
              type="button"
              onClick={() => {
                setSettings({
                  ...settings,
                  announcementEnabled: true,
                  announcementText: '🔥 Authentic Jalgaon Banana Chips in 10 Flavours • Free Delivery over ₹499 across Maharashtra!',
                  announcementTextMarathi: '🔥 अस्सल जळगाव केळी वेफर्स व नमकीन • ₹३९९ वरील ऑर्डर्सवर मोफत डिलिव्हरी!'
                });
              }}
              className="p-2.5 bg-white hover:bg-amber-100/60 border border-amber-200 rounded-xl text-left transition-colors cursor-pointer text-xs group"
            >
              <div className="font-bold text-stone-900 group-hover:text-[#9B111E]">Authentic Jalgaon Chips + Free Delivery</div>
              <div className="text-[11px] text-stone-600 mt-0.5">🔥 अस्सल जळगाव केळी वेफर्स व नमकीन • ₹३९९ वरील ऑर्डर्सवर मोफत डिलिव्हरी!</div>
            </button>

            <button
              type="button"
              onClick={() => {
                setSettings({
                  ...settings,
                  announcementEnabled: true,
                  announcementText: '🚀 Fast 24-Hour Dispatch • 100% Authentic Khandeshi Taste • Cash on Delivery Available',
                  announcementTextMarathi: '🚀 २४ तासांत जलद डिस्पॅच • १००% अस्सल खान्देशी चव • कॅश ऑन डिलिव्हरी उपलब्ध'
                });
              }}
              className="p-2.5 bg-white hover:bg-amber-100/60 border border-amber-200 rounded-xl text-left transition-colors cursor-pointer text-xs group"
            >
              <div className="font-bold text-stone-900 group-hover:text-[#9B111E]">Fast 24h Dispatch & COD</div>
              <div className="text-[11px] text-stone-600 mt-0.5">🚀 २४ तासांत जलद डिस्पॅच • १००% अस्सल खान्देशी चव • COD उपलब्ध</div>
            </button>

            <button
              type="button"
              onClick={() => {
                setSettings({
                  ...settings,
                  announcementEnabled: true,
                  announcementText: '🌸 Join Women Business Partner Program • Earn 12% Weekly Commission Payout to Bank',
                  announcementTextMarathi: '🌸 महिला बिझनेस पार्टनर बना • दर रविवारी १२% कमिशन थेट बँक खात्यात'
                });
              }}
              className="p-2.5 bg-white hover:bg-amber-100/60 border border-amber-200 rounded-xl text-left transition-colors cursor-pointer text-xs group"
            >
              <div className="font-bold text-stone-900 group-hover:text-[#9B111E]">Women Partner Earnings</div>
              <div className="text-[11px] text-stone-600 mt-0.5">🌸 महिला बिझनेस पार्टनर बना • दर रविवारी १२% कमिशन थेट बँक खात्यात</div>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-stone-50 p-4 rounded-2xl border border-stone-200/80">
              <div>
                <p className="text-xs font-bold text-stone-900">Enable Top Bar Announcement Alert</p>
                <p className="text-[11px] text-stone-500">When enabled, the announcement badge is displayed at the top header of all pages</p>
              </div>
              <input
                type="checkbox"
                checked={settings.announcementEnabled !== false}
                onChange={(e) => setSettings({ ...settings, announcementEnabled: e.target.checked })}
                className="w-5 h-5 text-[#9B111E] rounded-md focus:ring-0 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1 flex items-center justify-between">
                <span>Top Bar Alert Text (Marathi - मराठी)</span>
                <span className="text-[10px] text-[#9B111E] font-bold">Default for Marathi users</span>
              </label>
              <input
                type="text"
                value={settings.announcementTextMarathi || ''}
                placeholder="✨ संपूर्ण स्टोअरवर ५% सूट • ₹४१९ पेक्षा जास्त किमतीच्या ऑर्डरवर मोफत शिपिंग"
                onChange={(e) => setSettings({ ...settings, announcementTextMarathi: e.target.value })}
                className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-900 focus:bg-white focus:ring-2 focus:ring-[#9B111E]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1 flex items-center justify-between">
                <span>Top Bar Alert Text (English)</span>
                <span className="text-[10px] text-stone-500 font-normal">Default for English users</span>
              </label>
              <input
                type="text"
                value={settings.announcementText || ''}
                placeholder="✨ 5% Discount Storewide • Free Shipping on Orders above ₹419"
                onChange={(e) => setSettings({ ...settings, announcementText: e.target.value })}
                className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-900 focus:bg-white focus:ring-2 focus:ring-[#9B111E]"
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

      {/* 5. SHIPPING ZONES & DELIVERY RULES BLOCK */}
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
