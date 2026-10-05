'use client';

import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { 
  Gift, 
  Sparkles, 
  Upload, 
  Trash2, 
  Plus, 
  CheckCircle2, 
  Save, 
  ArrowLeft,
  Image as ImageIcon,
  DollarSign,
  FileText
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface ComboItem {
  id?: string;
  name: string;
  weight: string;
  desc: string;
  img: string;
  badge: string;
  isGift?: boolean;
}

interface NavratriOfferConfig {
  featuredImage: string;
  price: number;
  description: string;
  products: ComboItem[];
}

const DEFAULT_CONFIG: NavratriOfferConfig = {
  featuredImage: 'https://images.unsplash.com/photo-1605000797439-7ab1434893e2?auto=format&fit=crop&w=1200&q=80',
  price: 599,
  description: 'Special Navratri Festivity Pack containing 500g Salted Banana Chips, 500g Spicy Masala Banana Chips, 500g Sweet Potato Chivda, 500g Spicy Potato Chivda, and a FREE pack of nutritious Rajgira Ladoos! Made 100% Satvik with Sendha Namak (Rock Salt) in separate dedicated frying lines.',
  products: [
    {
      id: 'item_1',
      name: 'Sendha Namak Rock Salt Banana Chips (५०० ग्रॅम)',
      weight: '500g Pack',
      desc: 'Melt-in-your-mouth wafer thin raw banana wafers salted with pure Himalayan Sendha Namak (Rock Salt).',
      img: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=400&q=80',
      badge: 'Fasting Approved'
    },
    {
      id: 'item_2',
      name: 'Spicy Masala Fasting Banana Chips (५०० ग्रॅम)',
      weight: '500g Pack',
      desc: 'Crispy raw banana wafers tossed with fast-compliant spicy red chilli powder and rock salt.',
      img: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=400&q=80',
      badge: 'Spicy Delight'
    },
    {
      id: 'item_3',
      name: 'Meetha Farali Potato Batata Chivda (५०० ग्रॅम)',
      weight: '500g Pack',
      desc: 'Crisp hand-grated Jalgaon potato salli blended with premium cashew nuts, sweet raisins, and roasted peanuts.',
      img: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=400&q=80',
      badge: 'Sweet & Crunchy'
    },
    {
      id: 'item_4',
      name: 'Teekha Farali Potato Batata Chivda (५०० ग्रॅम)',
      weight: '500g Pack',
      desc: 'Thin golden matchstick potato salli seasoned with a spicy Navratri spice mix and crunchy rock salt.',
      img: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=400&q=80',
      badge: 'Spicy & Savoury'
    },
    {
      id: 'item_5',
      name: 'Poushtik Rajgira Ladoo Pack (मोफत भेट)',
      weight: 'FREE GIFT (250g)',
      desc: 'Pure handcrafted Amaranth (Rajgira) ladoos rolled in wholesome organic jaggery.',
      img: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=400&q=80',
      badge: 'Free Fasting Gift',
      isGift: true
    }
  ]
};

export default function AdminNavratriOfferPage() {
  const [config, setConfig] = useState<NavratriOfferConfig>(DEFAULT_CONFIG);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Upload progress indicators
  const [uploadingTarget, setUploadingTarget] = useState<string | null>(null); // 'featured' or `product-${index}`

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/navratri-offer?_t=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) {
        const text = await res.text();
        try {
          const json = JSON.parse(text);
          if (json.success && json.data && Array.isArray(json.data.products)) {
            setConfig(json.data);
          }
        } catch {
          // Keep DEFAULT_CONFIG on non-JSON response
        }
      }
    } catch {
      // Keep DEFAULT_CONFIG
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;

    setIsSaving(true);
    setSaveSuccess(false);
    setErrorMessage(null);

    try {
      let saved = false;
      // 1. Try primary endpoint /api/admin/navratri-offer
      try {
        const res = await fetch('/api/admin/navratri-offer', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(config)
        });
        if (res.ok) {
          const text = await res.text();
          try {
            const json = JSON.parse(text);
            if (json.success || res.status === 200 || res.status === 201) {
              saved = true;
            }
          } catch {
            saved = res.ok;
          }
        }
      } catch {
        // Continue to fallback
      }

      // 2. Fallback to /api/navratri-offer if primary not reachable or returned 404
      if (!saved) {
        try {
          const res = await fetch('/api/navratri-offer', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(config)
          });
          if (res.ok) {
            saved = true;
          }
        } catch {
          // Continue to settings sync
        }
      }

      // 3. Fallback sync to /api/settings
      if (!saved) {
        try {
          const res = await fetch('/api/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ navratri_offer_config: config })
          });
          if (res.ok) {
            saved = true;
          }
        } catch {
          // Handled below
        }
      }

      if (saved) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 4000);
      } else {
        setErrorMessage('Failed to save configuration. Please ensure server build is deployed.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  // Safe S3 / TeleCloud file upload
  const handleImageUpload = async (file: File, target: string, productIndex?: number) => {
    setUploadingTarget(target);
    try {
      const formData = new FormData();
      formData.append('files', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const json = await res.json();

      if (res.ok && json.success) {
        const uploadedUrl = json.urls?.[0] || json.data?.results?.[0]?.url || json.data?.items?.[0]?.url || json.results?.[0]?.url;
        if (uploadedUrl) {
          if (target === 'featured') {
            setConfig(prev => prev ? { ...prev, featuredImage: uploadedUrl } : null);
          } else if (target.startsWith('product-') && productIndex !== undefined) {
            setConfig(prev => {
              if (!prev) return null;
              const updatedProducts = [...prev.products];
              updatedProducts[productIndex] = {
                ...updatedProducts[productIndex],
                img: uploadedUrl
              };
              return { ...prev, products: updatedProducts };
            });
          }
        } else {
          alert('Upload completed but S3 CDN returned an empty URL response.');
        }
      } else {
        alert(json.error || 'Failed to upload image to S3.');
      }
    } catch (err: any) {
      console.error('[Upload Error]', err);
      alert(`Network error during S3 upload: ${err.message || err}`);
    } finally {
      setUploadingTarget(null);
    }
  };

  const handleProductChange = (index: number, field: keyof ComboItem, value: any) => {
    if (!config) return;
    const updatedProducts = [...config.products];
    updatedProducts[index] = {
      ...updatedProducts[index],
      [field]: value
    };
    setConfig({ ...config, products: updatedProducts });
  };

  const handleAddProduct = () => {
    if (!config) return;
    const newItem: ComboItem = {
      id: `item-${Date.now()}`,
      name: 'New Festive Pack Item',
      weight: '500g Pack',
      desc: 'Mouthwatering festive premium snack prepared fresh with rock salt.',
      img: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=400&q=80',
      badge: 'Fasting Special',
      isGift: false
    };
    setConfig({
      ...config,
      products: [...config.products, newItem]
    });
  };

  const handleRemoveProduct = (index: number) => {
    if (!config) return;
    if (config.products.length <= 1) {
      alert('You must have at least one product in the combo.');
      return;
    }
    const updatedProducts = config.products.filter((_, i) => i !== index);
    setConfig({ ...config, products: updatedProducts });
  };

  if (isLoading || !config) {
    return (
      <AdminLayout pageTitle="Navratri Offer Curator">
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-3 border-[#9B111E] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-black text-stone-500 uppercase tracking-widest">Loading configuration from database...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      pageTitle="Navratri Special Offer Manager"
      breadcrumbs={[
        { label: 'Admin', href: '/admin' },
        { label: 'Navratri Offer Mgr' }
      ]}
    >
      <div className="max-w-4xl space-y-6">
        {/* Banner header */}
        <div className="p-6 bg-gradient-to-r from-orange-950 via-stone-900 to-orange-950 text-white rounded-3xl border border-orange-800/40 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 text-orange-300 text-xs font-bold border border-orange-500/30">
              <Gift className="w-3.5 h-3.5 text-orange-400" />
              <span>Durable Storefront Promotions</span>
            </div>
            <h2 className="text-xl font-black">Navratri Offer Page Curator</h2>
            <p className="text-xs text-orange-100/80 leading-relaxed">
              Dynamically modify the featured images, pricing, descriptions, and item items of the special Navratri Pack. Uploaded media is stored directly on your durable S3 storage.
            </p>
          </div>
          <Link
            to="/navratri-offer"
            target="_blank"
            className="px-4 py-2 bg-white text-orange-900 font-extrabold text-xs rounded-xl shadow-sm hover:bg-stone-50 transition-all flex items-center gap-2"
          >
            <span>View Live Offer Page</span>
            <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
          </Link>
        </div>

        {errorMessage && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-900 rounded-2xl text-xs font-bold">
            {errorMessage}
          </div>
        )}

        {saveSuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-bold flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>Navratri Festive Offer configuration successfully updated and synced across database!</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Main Combo Details Card */}
          <div className="bg-white rounded-2xl border border-stone-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
              <Sparkles className="w-4 h-4 text-[#9B111E]" />
              <h3 className="text-sm font-black text-stone-900 uppercase tracking-wide">Main Combo Information</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-black text-stone-700 uppercase">Festival Price (₹)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 font-extrabold text-xs">₹</span>
                  <input
                    type="number"
                    value={config.price}
                    onChange={(e) => setConfig({ ...config, price: Number(e.target.value) })}
                    className="w-full pl-8 pr-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-orange-500"
                    placeholder="599"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-stone-700 uppercase">Regular Price (MRP: ₹)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 font-extrabold text-xs">₹</span>
                  <input
                    type="number"
                    value={Math.round(config.price * 1.5)}
                    disabled
                    className="w-full pl-8 pr-3 py-2.5 bg-stone-100 border border-stone-200 rounded-xl text-stone-400 text-xs font-bold cursor-not-allowed"
                    placeholder="899"
                  />
                </div>
                <span className="text-[10px] text-stone-400 font-bold block">Auto-calculated as 1.5x price</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-black text-stone-700 uppercase">Main Combo Description</label>
              <textarea
                value={config.description}
                onChange={(e) => setConfig({ ...config, description: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-orange-500 min-h-[80px]"
                placeholder="Enter complete overview of what is provided in this combo..."
                required
              />
            </div>

            {/* Featured Image upload and preview */}
            <div className="space-y-3.5">
              <label className="text-xs font-black text-stone-700 uppercase block">Featured Promo Image (S3 CDN)</label>
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <div className="w-full sm:w-48 aspect-video sm:aspect-square bg-stone-100 rounded-2xl overflow-hidden border border-stone-200 flex items-center justify-center shrink-0">
                  {config.featuredImage ? (
                    <img src={config.featuredImage} alt="Featured Promo" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-stone-300" />
                  )}
                </div>

                <div className="space-y-3 flex-1 w-full">
                  <div className="relative">
                    <input
                      type="text"
                      value={config.featuredImage}
                      onChange={(e) => setConfig({ ...config, featuredImage: e.target.value })}
                      className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-orange-500"
                      placeholder="https://..."
                    />
                  </div>

                  <div className="relative inline-flex items-center">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file, 'featured');
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      disabled={uploadingTarget !== null}
                    />
                    <button
                      type="button"
                      className="px-4 py-2.5 rounded-xl border border-stone-300 hover:border-orange-500 text-stone-700 bg-white font-black text-xs flex items-center gap-2 cursor-pointer transition-all"
                    >
                      <Upload className="w-4 h-4 text-orange-600" />
                      <span>{uploadingTarget === 'featured' ? 'Uploading to S3...' : 'Upload Featured Image to S3'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Combo Products List Editor */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-2.5">
              <h3 className="text-xs font-black text-stone-900 uppercase tracking-widest flex items-center gap-2">
                <FileText className="w-4 h-4 text-orange-600" />
                <span>Combo Items List ({config.products.length})</span>
              </h3>
              <button
                type="button"
                onClick={handleAddProduct}
                className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item Item</span>
              </button>
            </div>

            <div className="space-y-5">
              {config.products.map((item, index) => (
                <div key={item.id || index} className="p-4 bg-white border border-stone-200 rounded-2xl shadow-2xs space-y-4 relative">
                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={() => handleRemoveProduct(index)}
                    className="absolute top-4 right-4 p-1.5 text-stone-400 hover:text-red-600 hover:bg-stone-50 rounded-lg transition-colors cursor-pointer"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-2 pb-2 border-b border-stone-100">
                    <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-800 text-[10px] font-black flex items-center justify-center font-mono">
                      {index + 1}
                    </span>
                    <h4 className="text-xs font-extrabold text-stone-900">Item Detail Configuration</h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-stone-500 uppercase">Item Name</label>
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => handleProductChange(index, 'name', e.target.value)}
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-orange-500"
                        placeholder="e.g. Salted Banana Chips"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-stone-500 uppercase">Weight / Qty</label>
                      <input
                        type="text"
                        value={item.weight}
                        onChange={(e) => handleProductChange(index, 'weight', e.target.value)}
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-orange-500"
                        placeholder="e.g. 500g Pack"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-stone-500 uppercase">Badge Label</label>
                      <input
                        type="text"
                        value={item.badge}
                        onChange={(e) => handleProductChange(index, 'badge', e.target.value)}
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-orange-500"
                        placeholder="e.g. Fasting Approved"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-stone-500 uppercase">Short Description</label>
                    <input
                      type="text"
                      value={item.desc}
                      onChange={(e) => handleProductChange(index, 'desc', e.target.value)}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-orange-500"
                      placeholder="Enter short description..."
                      required
                    />
                  </div>

                  {/* Gift Toggle and Image editing */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                    <div className="md:col-span-4 flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id={`gift-${index}`}
                        checked={!!item.isGift}
                        onChange={(e) => handleProductChange(index, 'isGift', e.target.checked)}
                        className="w-4 h-4 text-orange-600 border-stone-300 rounded focus:ring-orange-500 cursor-pointer"
                      />
                      <label htmlFor={`gift-${index}`} className="text-xs font-black text-stone-800 uppercase cursor-pointer select-none">
                        Mark as Free Gift 🎁
                      </label>
                    </div>

                    <div className="md:col-span-8 space-y-2">
                      <label className="text-[10px] font-bold text-stone-500 uppercase block">Product Thumbnail Image (S3 URL)</label>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-stone-100 overflow-hidden shrink-0 border border-stone-200">
                          {item.img ? (
                            <img src={item.img} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon className="w-6 h-6 m-3 text-stone-300" />
                          )}
                        </div>
                        <input
                          type="text"
                          value={item.img}
                          onChange={(e) => handleProductChange(index, 'img', e.target.value)}
                          className="flex-1 px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 text-xs font-mono focus:outline-none"
                          placeholder="Image URL"
                        />
                        <div className="relative inline-flex">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleImageUpload(file, `product-${index}`, index);
                            }}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          <button
                            type="button"
                            className="px-3 py-2 rounded-xl border border-stone-200 hover:border-orange-500 text-stone-700 bg-white font-bold text-xs shrink-0 cursor-pointer"
                          >
                            {uploadingTarget === `product-${index}` ? '...' : 'S3 Upload'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form Actions Footer */}
          <div className="pt-4 border-t border-stone-200/80 flex items-center justify-end gap-3.5">
            <Link
              to="/admin"
              className="px-4 py-2.5 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-700 text-xs font-black transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-extrabold flex items-center gap-2 cursor-pointer shadow-md active:scale-95 disabled:opacity-60 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving Changes...' : 'Save Configuration'}</span>
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
