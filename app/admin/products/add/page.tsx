'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  RefreshCw, 
  CheckCircle2, 
  Lock, 
  AlertTriangle,
  Sparkles,
  Layers,
  ChevronRight,
  Package,
  FileText,
  Search,
  Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CloudinaryUpload } from '@/components/admin/CloudinaryUpload';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ProductVariantsEditor } from '@/components/admin/ProductVariantsEditor';
import { ProductVariant } from '@/types';

// Simple SEO Component Mock
const PageSEO = ({ title }: { title: string }) => {
  useEffect(() => {
    document.title = title;
  }, [title]);
  return null;
};

export default function AddProductPage() {
  const router = useRouter();

  // Auth check
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('ajw_admin_authenticated') === 'true';
    }
    return false;
  });
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Loading States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAILoading, setIsAILoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Variations State
  const [variants, setVariants] = useState<ProductVariant[]>([]);

  // Form Fields State
  const [formData, setFormData] = useState(() => {
    let initialCategory = 'banana-chips';
    let initialTags = '';
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const catParam = params.get('category');
      if (catParam) {
        initialCategory = catParam;
        if (catParam === 'upwas-special') {
          initialTags = 'Upwas Special, Fasting, Satvik';
        }
      }
    }
    return {
      name: '',
      slug: '',
      category: initialCategory,
      description: '',
      shortDescription: '',
      price: '',
      mrp: '',
      profit: '',
      netQuantity: '100g',
      flavour: '',
      tags: initialTags,
      stock: '100',
      imageUrl: '',
      ingredients: '',
      isFeatured: false,
      isBestSeller: false,
      isNew: true,
      isAvailable: true,
      seoTitle: '',
      seoDescription: ''
    };
  });

  // Dynamic Categories State
  const [categories, setCategories] = useState<{ id: string; name: string; slug: string }[]>([]);

  // AI Smart Copywriter Questionnaire State
  const [isAIWizardOpen, setIsAIWizardOpen] = useState(false);
  const [aiAnswers, setAiAnswers] = useState({
    prepStyle: '',
    flavorNotes: '',
    targetAudience: '',
    dietaryCallouts: ''
  });

  // Media Picker states for direct library selection
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [libraryAssets, setLibraryAssets] = useState<any[]>([]);
  const [isLibraryLoading, setIsLibraryLoading] = useState(false);

  // Fetch categories & check session
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/categories');
        const json = await res.json();
        if (json.success && json.data) {
          setCategories(json.data);
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };

    fetchCategories();
  }, [isAuthenticated]);

  const openMediaPicker = async () => {
    setIsMediaPickerOpen(true);
    setIsLibraryLoading(true);
    try {
      const res = await fetch('/api/admin/cloudinary');
      const json = await res.json();
      if (json.success && json.data) {
        setLibraryAssets(json.data);
      }
    } catch (e) {
      console.error('Error fetching media picker library:', e);
    } finally {
      setIsLibraryLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Auto-fill slug when title changes (unless custom slug is set)
  const handleNameChange = (val: string) => {
    setFormData(prev => {
      const updated = { ...prev, name: val };
      // Only auto-derive slug if the user hasn't explicitly customized it deeply yet
      if (!prev.slug || prev.slug === prev.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')) {
        updated.slug = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      }
      return updated;
    });
  };

  const handleVerifyPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(null);
    setIsVerifying(true);

    try {
      const res = await fetch('/api/admin/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pinInput.trim() })
      });
      const json = await res.json();

      if (json.success) {
        setIsAuthenticated(true);
        if (typeof window !== 'undefined') {
          localStorage.setItem('ajw_admin_authenticated', 'true');
        }
        showToast('Access granted! Opening Creator...');
      } else {
        setPinError('Incorrect PIN.');
      }
    } catch {
      setPinError('Error verifying PIN. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleAIEnhance = async () => {
    if (!formData.name.trim()) {
      alert('Please enter a basic product name first before asking Gemini to write details.');
      return;
    }
    setIsAILoading(true);
    try {
      const res = await fetch('/api/admin/products/ai-enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          category: formData.category,
          prepStyle: aiAnswers.prepStyle,
          flavorNotes: aiAnswers.flavorNotes,
          targetAudience: aiAnswers.targetAudience,
          dietaryCallouts: aiAnswers.dietaryCallouts,
          description: formData.description,
          shortDescription: formData.shortDescription,
          seoTitle: formData.seoTitle,
          seoDescription: formData.seoDescription
        })
      });
      const json = await res.json();
      if (json.success && json.data) {
        const enhanced = json.data;
        setFormData(prev => ({
          ...prev,
          name: enhanced.name || prev.name,
          description: enhanced.description || prev.description,
          shortDescription: enhanced.shortDescription || prev.shortDescription,
          flavour: enhanced.flavour || prev.flavour,
          ingredients: Array.isArray(enhanced.ingredients) ? enhanced.ingredients.join(', ') : prev.ingredients,
          tags: Array.isArray(enhanced.tags) ? enhanced.tags.join(', ') : prev.tags,
          seoTitle: enhanced.seoTitle || prev.seoTitle,
          seoDescription: enhanced.seoDescription || prev.seoDescription,
          slug: enhanced.name ? enhanced.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : prev.slug
        }));
        setIsAIWizardOpen(false);
        showToast('✨ Product content generated and SEO-optimized successfully!');
      } else {
        alert(json.error?.message || 'Failed to generate product content using AI.');
      }
    } catch (err) {
      console.error('Error enhancing product with Gemini:', err);
      alert('An error occurred while connecting to the Gemini AI API.');
    } finally {
      setIsAILoading(false);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Proper validations
    const nameTrimmed = formData.name.trim();
    if (!nameTrimmed) {
      alert('Validation Error: Product name is required.');
      return;
    }
    if (nameTrimmed.length < 3) {
      alert('Validation Error: Product name must be at least 3 characters long.');
      return;
    }

    const priceNum = Number(formData.price);
    if (isNaN(priceNum) || priceNum <= 0) {
      alert('Validation Error: Please enter a valid selling price greater than 0.');
      return;
    }

    const mrpNum = Number(formData.mrp || formData.price);
    if (isNaN(mrpNum) || mrpNum < priceNum) {
      alert('Validation Error: MRP (Maximum Retail Price) cannot be less than the selling price.');
      return;
    }

    const stockNum = Number(formData.stock || 100);
    if (isNaN(stockNum) || stockNum < 0) {
      alert('Validation Error: Stock must be a valid non-negative number.');
      return;
    }

    if (!formData.category) {
      alert('Validation Error: Please select a valid product category.');
      return;
    }

    setIsSubmitting(true);

    const productPayload = {
      name: formData.name.trim(),
      slug: formData.slug.trim() || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      category: formData.category,
      description: formData.description.trim(),
      shortDescription: formData.shortDescription.trim(),
      price: Number(formData.price),
      mrp: Number(formData.mrp || formData.price),
      profit: Number(formData.profit || 0),
      netQuantity: formData.netQuantity.trim(),
      flavour: formData.flavour.trim() || undefined,
      tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
      stock: Number(formData.stock || 100),
      variants: variants,
      images: [{
        id: `img-${Date.now()}`,
        url: formData.imageUrl.trim() || 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=800&q=80',
        alt: formData.name.trim(),
        isPrimary: true
      }],
      ingredients: formData.ingredients.split(',').map(i => i.trim()).filter(Boolean),
      isFeatured: formData.isFeatured,
      isBestSeller: formData.isBestSeller,
      isNew: formData.isNew,
      isAvailable: formData.isAvailable,
      seoTitle: formData.seoTitle.trim() || undefined,
      seoDescription: formData.seoDescription.trim() || undefined
    };

    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productPayload)
      });

      const json = await res.json();

      if (json.success) {
        alert('Product created successfully in MySQL database!');
        router.push('/admin');
      } else {
        alert(json.error?.message || 'Failed to create product.');
      }
    } catch (err) {
      console.error('Error creating product:', err);
      alert('An unexpected error occurred while creating the product.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Lock Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#f6f6f7] flex items-center justify-center p-4">
        <PageSEO title="Verify Admin Pin | Aapla Jalgaonwala" />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-white rounded-xl p-8 border border-[#e3e3e3] shadow-sm text-center space-y-6 animate-in fade-in zoom-in duration-200"
          id="admin-add-lock"
        >
          <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center text-[#9B111E] mx-auto border border-amber-100">
            <Lock className="w-8 h-8" />
          </div>

          <div>
            <span className="inline-block bg-[#fdf2f2] text-[#9B111E] px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-red-100 mb-2">Admin Panel Gate</span>
            <h1 className="text-xl font-bold text-stone-900 tracking-tight">Standalone Product Creator</h1>
            <p className="text-xs text-stone-500 mt-1">Please enter your 4-digit security PIN to unlock this session.</p>
          </div>

          <form onSubmit={handleVerifyPin} className="space-y-4">
            <div>
              <div className="relative max-w-xs mx-auto">
                <input
                  type="password"
                  maxLength={4}
                  required
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="• • • •"
                  className="w-full text-center text-3xl font-black tracking-[0.5em] py-3 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#9B111E] bg-stone-50"
                  id="admin-pin-field"
                />
              </div>
              {pinError && (
                <p className="text-xs font-bold text-red-600 mt-2">{pinError}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isVerifying || pinInput.length < 4}
              className="w-full py-3 rounded-xl bg-[#1a1a1a] hover:bg-[#333] text-white font-bold text-xs shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              id="admin-pin-submit"
            >
              {isVerifying ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
                  <span>Verifying PIN...</span>
                </>
              ) : (
                <span>Unlock Product Creator</span>
              )}
            </button>
          </form>


        </motion.div>
      </div>
    );
  }

  return (
    <AdminLayout
      pageTitle="Add New Product"
      breadcrumbs={[
        { label: 'Products', href: '/admin/products' },
        { label: 'Add New Product' }
      ]}
      actions={
        <button
          onClick={handleSaveProduct}
          disabled={isSubmitting}
          className="px-4 py-1.5 bg-[#9B111E] hover:bg-[#800E19] text-white text-xs font-extrabold rounded-lg flex items-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-50"
          id="standalone-save-btn"
        >
          {isSubmitting ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-300" />
          ) : (
            <Save className="w-3.5 h-3.5 text-amber-300" />
          )}
          <span>Save Product</span>
        </button>
      }
    >
      <PageSEO title="Add New Product | Aapla Jalgaonwala Admin" />

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-50 bg-stone-900 text-white px-5 py-3 rounded-lg shadow-lg text-xs font-semibold flex items-center gap-2 border border-stone-700"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Form Area */}
      <form onSubmit={handleSaveProduct} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Primary Details (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Main info card */}
          <div className="bg-white rounded-xl border border-[#e1e3e5] p-5 md:p-6 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-2.5">
              <h2 className="text-xs font-bold text-stone-500 uppercase tracking-widest flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-stone-400" />
                <span>Product Content</span>
              </h2>
              <span className="text-[10px] bg-purple-50 text-purple-700 font-extrabold px-2 py-0.5 rounded-full border border-purple-100 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-purple-600 animate-pulse" />
                <span>Gemini 3.7 Flash Active</span>
              </span>
            </div>

            {/* AI Assistant Banner */}
            <div className="bg-purple-50/50 border border-purple-100/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white border border-purple-200 flex items-center justify-center text-purple-700 shadow-2xs flex-shrink-0">
                  <Sparkles className="w-4.5 h-4.5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                    <span>AI Smart Copywriter Wizard</span>
                  </h3>
                  <p className="text-[10.5px] text-stone-600 leading-normal mt-0.5">Tell Gemini about your product style, taste notes, benefits, and target audience to auto-write all fields with high SEO optimization.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!formData.name.trim()) {
                    alert('Please enter a basic product title/idea first.');
                    return;
                  }
                  setIsAIWizardOpen(true);
                }}
                className="w-full sm:w-auto px-4 py-2 bg-[#9B111E] hover:bg-[#800E19] text-white text-[11px] font-black rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer flex-shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Launch Copywriter</span>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1.5">Product Title *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Khandeshi Teekha Banana Chips"
                  className="w-full px-3.5 py-2 rounded-lg border border-stone-300 text-stone-900 font-semibold focus:outline-none focus:ring-1 focus:ring-[#9B111E] text-xs bg-stone-50/20"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1.5">URL Slug (Editable)</label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') })}
                    placeholder="khandeshi-teekha-banana-chips"
                    className="w-full px-3.5 py-2 rounded-lg border border-stone-300 text-stone-900 font-mono text-[11px] focus:outline-none focus:ring-1 focus:ring-[#9B111E] bg-stone-50/40"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1.5">Flavour Accent</label>
                  <input
                    type="text"
                    value={formData.flavour}
                    onChange={(e) => setFormData({ ...formData, flavour: e.target.value })}
                    placeholder="e.g. Spicy Red Chilli / Tangy Saffron"
                    className="w-full px-3.5 py-2 rounded-lg border border-stone-300 text-stone-900 text-xs focus:outline-none focus:ring-1 focus:ring-[#9B111E] bg-stone-50/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1.5">Short Card Description</label>
                <textarea
                  rows={2}
                  value={formData.shortDescription}
                  onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                  placeholder="Crisp & crunchy premium banana chips seasoned with traditional Khandeshi spices."
                  className="w-full px-3.5 py-2 rounded-lg border border-stone-300 text-stone-900 text-xs focus:outline-none focus:ring-1 focus:ring-[#9B111E] bg-stone-50/20"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1.5">Detailed Marketing Story / Full Description</label>
                <textarea
                  rows={6}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the quality of ingredients, cooking method, traditional recipe heritage, etc."
                  className="w-full px-3.5 py-2 rounded-lg border border-stone-300 text-stone-900 text-xs focus:outline-none focus:ring-1 focus:ring-[#9B111E] bg-stone-50/20 leading-relaxed"
                />
              </div>
            </div>
          </div>

          {/* Pricing & Stock Card */}
          <div className="bg-white rounded-xl border border-[#e1e3e5] p-5 md:p-6 shadow-sm space-y-4">
            <h2 className="text-xs font-bold text-stone-500 uppercase tracking-widest flex items-center gap-1.5 border-b border-stone-100 pb-2.5">
              <Package className="w-4 h-4 text-stone-400" />
              <span>Pricing & Inventory</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1.5">Selling Price (₹) *</label>
                <input
                  type="number"
                  required
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="99"
                  className="w-full px-3.5 py-2 rounded-lg border border-stone-300 text-stone-900 font-bold focus:outline-none focus:ring-1 focus:ring-[#9B111E] text-xs bg-stone-50/20"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1.5">MRP / Strikeout (₹)</label>
                <input
                  type="number"
                  value={formData.mrp}
                  onChange={(e) => setFormData({ ...formData, mrp: e.target.value })}
                  placeholder="120"
                  className="w-full px-3.5 py-2 rounded-lg border border-stone-300 text-stone-500 focus:outline-none focus:ring-1 focus:ring-[#9B111E] text-xs bg-stone-50/20"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-emerald-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  Profit Per Unit (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.profit}
                  onChange={(e) => setFormData({ ...formData, profit: e.target.value })}
                  placeholder="e.g. 35"
                  className="w-full px-3.5 py-2 rounded-lg border border-emerald-300 text-emerald-900 font-bold focus:outline-none focus:ring-1 focus:ring-emerald-600 text-xs bg-emerald-50/30"
                />
                <span className="text-[10px] text-stone-400 mt-1 block">Net profit per 1 qty sold</span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1.5">Net Weight / Volume</label>
                <input
                  type="text"
                  required
                  value={formData.netQuantity}
                  onChange={(e) => setFormData({ ...formData, netQuantity: e.target.value })}
                  placeholder="e.g. 100g / 250g / 1 Kg"
                  className="w-full px-3.5 py-2 rounded-lg border border-stone-300 text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#9B111E] text-xs bg-stone-50/20"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1.5">Available Stock</label>
                <input
                  type="number"
                  required
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  placeholder="100"
                  className="w-full px-3.5 py-2 rounded-lg border border-stone-300 text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#9B111E] text-xs bg-stone-50/20"
                />
              </div>
            </div>
          </div>

          {/* Weight Variations & Pack Pricing (MySQL Managed) */}
          <ProductVariantsEditor
            variants={variants}
            onChange={setVariants}
            basePrice={formData.price}
            baseMrp={formData.mrp}
          />

          {/* Media & Uploads Card */}
          <div className="bg-white rounded-xl border border-[#e1e3e5] p-5 md:p-6 shadow-sm space-y-4">
            <h2 className="text-xs font-bold text-stone-500 uppercase tracking-widest flex items-center gap-1.5 border-b border-stone-100 pb-2.5">
              <Sparkles className="w-4 h-4 text-stone-400" />
              <span>Product Image Asset</span>
            </h2>

            <CloudinaryUpload
              label="Upload To Cloudinary (Supports JPG, PNG, WEBP, GIF)"
              folder="products"
              currentValue={formData.imageUrl}
              onUploadSuccess={(url) => setFormData(prev => ({ ...prev, imageUrl: url }))}
            />

            <div className="flex justify-between items-center pt-2 border-t border-stone-100">
              <span className="text-[10px] text-stone-400 font-semibold">Already uploaded to Cloudinary?</span>
              <button
                type="button"
                onClick={openMediaPicker}
                className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
              >
                <Package className="w-3.5 h-3.5 text-[#9B111E]" />
                <span>Select from Media Library</span>
              </button>
            </div>

            {isMediaPickerOpen && (
              <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl p-6 max-w-2xl w-full border border-stone-200 shadow-xl space-y-4 max-h-[85vh] flex flex-col">
                  <div className="flex items-center justify-between border-b border-stone-100 pb-3 flex-shrink-0">
                    <div>
                      <h3 className="text-sm font-black text-stone-900">Select Image from Media Library</h3>
                      <p className="text-[10px] text-stone-500 font-medium">Browse and select any media item currently tracked in Cloudinary.</p>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setIsMediaPickerOpen(false)} 
                      className="text-stone-400 hover:text-stone-600 font-bold text-sm"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto pr-1">
                    {isLibraryLoading ? (
                      <div className="py-12 text-center text-stone-500 font-bold text-xs flex items-center justify-center gap-2">
                        <RefreshCw className="w-5 h-5 animate-spin text-[#9B111E]" />
                        <span>Loading asset library...</span>
                      </div>
                    ) : libraryAssets.length === 0 ? (
                      <div className="py-12 text-center text-stone-400 text-xs">
                        No assets found in Media Library. Try uploading first or opening the Media Tab!
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                        {libraryAssets.map((asset) => {
                          const isSelected = formData.imageUrl === asset.url;
                          return (
                            <div
                              key={asset.id}
                              onClick={() => {
                                setFormData(prev => ({ ...prev, imageUrl: asset.url }));
                                setIsMediaPickerOpen(false);
                              }}
                              className={`bg-stone-50 rounded-xl overflow-hidden border cursor-pointer group hover:scale-[1.02] transition-transform flex flex-col justify-between ${isSelected ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-stone-200'}`}
                            >
                              <div className="aspect-square bg-white flex items-center justify-center p-1 border-b border-stone-100">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={asset.url} alt={asset.name} className="w-full h-full object-contain" />
                              </div>
                              <div className="p-2">
                                <p className="text-[10px] font-bold text-stone-700 truncate" title={asset.name}>
                                  {asset.name}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-stone-100 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsMediaPickerOpen(false)}
                      className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Recipe Ingredients Card */}
          <div className="bg-white rounded-xl border border-[#e1e3e5] p-5 md:p-6 shadow-sm space-y-4">
            <h2 className="text-xs font-bold text-stone-500 uppercase tracking-widest flex items-center gap-1.5 border-b border-stone-100 pb-2.5">
              <Layers className="w-4 h-4 text-stone-400" />
              <span>Recipe Ingredients</span>
            </h2>

            <div>
              <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1.5">Ingredients (Comma Separated)</label>
              <input
                type="text"
                value={formData.ingredients}
                onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
                placeholder="Fresh Bananas, Edible Sunflower Oil, Red Chilli Powder, Rock Salt, Turmeric"
                className="w-full px-3.5 py-2 rounded-lg border border-stone-300 text-stone-900 text-xs focus:outline-none focus:ring-1 focus:ring-[#9B111E] bg-stone-50/20"
              />
              <span className="text-[9px] text-stone-400 mt-1 block font-semibold">Separate ingredients using commas to automatically format as structured bullet lists.</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Sidebar Settings (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Status & Catalog Settings */}
          <div className="bg-white rounded-xl border border-[#e1e3e5] p-5 shadow-sm space-y-4">
            <h2 className="text-xs font-bold text-stone-900 uppercase tracking-widest border-b border-stone-100 pb-2">Status & Visibility</h2>

            <div className="space-y-3.5">
              {/* Product Availability Toggle */}
              <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-stone-50 transition-colors">
                <input
                  type="checkbox"
                  checked={formData.isAvailable}
                  onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                  className="w-4 h-4 rounded text-[#9B111E] focus:ring-[#9B111E] accent-[#9B111E]"
                />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-stone-900">In Stock & Available</p>
                  <p className="text-[9px] text-stone-400 leading-normal">Allows customers to add item to checkout cart.</p>
                </div>
              </label>

              {/* Best Seller Toggle */}
              <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-stone-50 transition-colors">
                <input
                  type="checkbox"
                  checked={formData.isBestSeller}
                  onChange={(e) => setFormData({ ...formData, isBestSeller: e.target.checked })}
                  className="w-4 h-4 rounded text-[#9B111E] focus:ring-[#9B111E] accent-[#9B111E]"
                />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-stone-900">Best Seller Tag</p>
                  <p className="text-[9px] text-stone-400 leading-normal">Adds a high-visibility badge to product listings.</p>
                </div>
              </label>

              {/* Featured Toggle */}
              <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-stone-50 transition-colors">
                <input
                  type="checkbox"
                  checked={formData.isFeatured}
                  onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                  className="w-4 h-4 rounded text-[#9B111E] focus:ring-[#9B111E] accent-[#9B111E]"
                />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-stone-900">Featured Item</p>
                  <p className="text-[9px] text-stone-400 leading-normal">Displays product on home page hero carousel or showcase.</p>
                </div>
              </label>

              {/* New Arrival Toggle */}
              <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-stone-50 transition-colors">
                <input
                  type="checkbox"
                  checked={formData.isNew}
                  onChange={(e) => setFormData({ ...formData, isNew: e.target.checked })}
                  className="w-4 h-4 rounded text-[#9B111E] focus:ring-[#9B111E] accent-[#9B111E]"
                />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-stone-900">New Launch Arrival</p>
                  <p className="text-[9px] text-stone-400 leading-normal">Highlights item with a saffron Launch badge.</p>
                </div>
              </label>
            </div>
          </div>

          {/* Product Category Box */}
          <div className="bg-white rounded-xl border border-[#e1e3e5] p-5 shadow-sm space-y-4">
            <h2 className="text-xs font-bold text-stone-900 uppercase tracking-widest border-b border-stone-100 pb-2">Category Assignment</h2>
            
            <div>
              <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1.5">Store Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#9B111E] text-xs bg-white font-semibold"
              >
                {categories.length === 0 ? (
                  <>
                    <option value="banana-chips">Banana Chips</option>
                    <option value="upwas-special">Upwas Special</option>
                    <option value="khandeshi-farsaan">Khandeshi Farsaan</option>
                    <option value="kitchen-masalas">Kitchen Masalas</option>
                    <option value="potato-chips">Potato Chips</option>
                    <option value="combo-packs">Combo Packs & Gifting</option>
                  </>
                ) : (
                  categories.map((c) => (
                    <option key={c.id || c.slug} value={c.slug}>
                      {c.name}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {/* Tags Classification */}
          <div className="bg-white rounded-xl border border-[#e1e3e5] p-5 shadow-sm space-y-4">
            <h2 className="text-xs font-bold text-stone-900 uppercase tracking-widest border-b border-stone-100 pb-2">Tags / Keywords</h2>

            <div>
              <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1.5">Search Keywords</label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="e.g. Fresh, Crunchy, Saffron"
                className="w-full px-3.5 py-2 rounded-lg border border-stone-300 text-stone-900 text-xs focus:outline-none focus:ring-1 focus:ring-[#9B111E] bg-stone-50/20"
              />
              <span className="text-[9px] text-stone-400 mt-1 block font-semibold">Separate keywords with commas to enhance catalog search filters.</span>
            </div>
          </div>

          {/* Google Technical SEO & SERP Optimization */}
          <div className="bg-white rounded-xl border border-[#e1e3e5] p-5 shadow-sm space-y-5" id="seo-options-card">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Search className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-stone-900 uppercase tracking-widest">Search Engine Optimization (SEO)</h2>
                  <p className="text-[10px] text-stone-500">Google search metadata and live SERP snippet preview</p>
                </div>
              </div>
              <button
                type="button"
                onClick={async () => {
                  if (!formData.name.trim()) {
                    showToast('Please enter a product title first before generating SEO.');
                    return;
                  }
                  setIsAILoading(true);
                  try {
                    const res = await fetch('/api/admin/generate-seo', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        productName: formData.name,
                        productCategory: formData.category,
                        productDescription: formData.description || formData.shortDescription,
                        currentTitle: formData.seoTitle,
                        currentDescription: formData.seoDescription
                      })
                    });
                    const json = await res.json();
                    if (json.success && json.data) {
                      setFormData(prev => ({
                        ...prev,
                        seoTitle: json.data.seoTitle || prev.seoTitle,
                        seoDescription: json.data.seoDescription || prev.seoDescription,
                        tags: json.data.keywords ? (prev.tags ? `${prev.tags}, ${json.data.keywords}` : json.data.keywords) : prev.tags
                      }));
                      showToast('✨ AI Google SEO Meta Tags generated!');
                    }
                  } catch (err) {
                    console.error('SEO Error:', err);
                  } finally {
                    setIsAILoading(false);
                  }
                }}
                disabled={isAILoading || !formData.name}
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg text-xs font-bold shadow-2xs transition-all disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                <span>Auto-Generate AI SEO</span>
              </button>
            </div>

            {/* Google Live SERP Preview */}
            <div className="bg-stone-50 rounded-xl p-4 border border-stone-200/80 space-y-1.5">
              <span className="text-[9px] font-extrabold uppercase tracking-widest text-stone-500 flex items-center gap-1">
                <Globe className="w-3 h-3 text-blue-600" /> Google Search Result Preview
              </span>
              <div className="bg-white p-3.5 rounded-lg border border-stone-200 shadow-2xs space-y-1 font-sans">
                <div className="flex items-center gap-1.5 text-[11px] text-stone-600 truncate">
                  <span className="text-stone-900 font-medium">Aapla Jalgaonwala</span>
                  <span className="text-stone-400">›</span>
                  <span className="text-stone-500 truncate">product › {formData.slug || 'product-slug'}</span>
                </div>
                <h4 className="text-sm font-semibold text-blue-700 hover:underline cursor-pointer truncate">
                  {formData.seoTitle || `${formData.name || 'Product'} | Buy Online - Aapla Jalgaonwala`}
                </h4>
                <p className="text-[11px] text-stone-600 line-clamp-2 leading-relaxed">
                  {formData.seoDescription || formData.shortDescription || formData.description || "Order authentic Jalgaon banana chips and snacks online from Aapla Jalgaonwala with fast delivery across India. Shop now!"}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider">SEO Meta Title</label>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    formData.seoTitle.length >= 50 && formData.seoTitle.length <= 60
                      ? 'bg-emerald-100 text-emerald-800'
                      : formData.seoTitle.length > 0 && formData.seoTitle.length < 50
                      ? 'bg-amber-100 text-amber-800'
                      : formData.seoTitle.length > 60
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-stone-100 text-stone-600'
                  }`}>
                    {formData.seoTitle.length} / 60 chars
                  </span>
                </div>
                <input
                  type="text"
                  value={formData.seoTitle}
                  onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
                  placeholder={`${formData.name || 'Product'} | Buy Online - Aapla Jalgaonwala`}
                  className="w-full px-3.5 py-2 rounded-lg border border-stone-300 text-stone-900 text-xs focus:outline-none focus:ring-1 focus:ring-[#9B111E] bg-stone-50/20"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider">SEO Meta Description</label>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    formData.seoDescription.length >= 140 && formData.seoDescription.length <= 160
                      ? 'bg-emerald-100 text-emerald-800'
                      : formData.seoDescription.length > 0 && formData.seoDescription.length < 140
                      ? 'bg-amber-100 text-amber-800'
                      : formData.seoDescription.length > 160
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-stone-100 text-stone-600'
                  }`}>
                    {formData.seoDescription.length} / 160 chars
                  </span>
                </div>
                <textarea
                  rows={3}
                  value={formData.seoDescription}
                  onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
                  placeholder={formData.shortDescription || "SEO page description meta description tag."}
                  className="w-full px-3.5 py-2 rounded-lg border border-stone-300 text-stone-900 text-xs focus:outline-none focus:ring-1 focus:ring-[#9B111E] bg-stone-50/20"
                />
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* AI Smart Copywriter Questionnaire Modal */}
      {isAIWizardOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-6 md:p-8 max-w-2xl w-full border border-stone-200 shadow-2xl space-y-6 max-h-[90vh] flex flex-col my-8"
            id="ai-copywriter-wizard-modal"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-stone-100 pb-4 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-700 shadow-2xs">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-stone-900 flex items-center gap-1.5">
                    <span>AI Smart Copywriter Wizard</span>
                    <span className="text-[9px] bg-purple-100 text-purple-700 font-bold px-1.5 py-0.5 rounded-full">Gemini 3.7 Flash</span>
                  </h3>
                  <p className="text-[10.5px] text-stone-500 font-medium">Answer a few quick questions to generate highly appetizing, SEO-optimized content.</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setIsAIWizardOpen(false)} 
                className="text-stone-400 hover:text-stone-600 font-bold text-sm cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            {/* Questions Form Area */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-5 py-2">
              <div className="flex justify-between items-center bg-amber-50/50 border border-amber-100/60 rounded-xl p-3">
                <span className="text-[10.5px] text-amber-800 font-bold">Short on time? Use our premium sample answers:</span>
                <button
                  type="button"
                  onClick={() => {
                    setAiAnswers({
                      prepStyle: `Crafted from premium handpicked Jalgaon bananas, sliced paper-thin, and crisp-fried in cold-pressed double-filtered sunflower oil according to our ancestral 70-year-old Khandeshi family recipe.`,
                      flavorNotes: `Infused with a fiery blend of special Khandeshi red chilies, black salt, tangy dry mango powder (amchur), and aromatic roasted cumin.`,
                      targetAudience: `An exceptional crunchy companion for evening tea-time, festive celebrations, late-night munching, and snack enthusiasts.`,
                      dietaryCallouts: `100% vegetarian, gluten-free, trans-fat-free, made with zero palm oil, and high in dietary fiber.`
                    });
                  }}
                  className="px-2.5 py-1 bg-[#9B111E] hover:bg-[#800E19] text-white text-[10px] font-extrabold rounded-lg transition-colors cursor-pointer"
                >
                  Auto-Fill Sample
                </button>
              </div>

              {/* Question 1 */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-extrabold text-stone-800 uppercase tracking-wider">
                  1. Preparation Style & Heritage
                </label>
                <p className="text-[10px] text-stone-500 font-medium leading-normal">
                  How is it made? Are there traditional cooking methods, wood-fired techniques, cold-pressed oils, or family recipes?
                </p>
                <textarea
                  rows={2}
                  value={aiAnswers.prepStyle}
                  onChange={(e) => setAiAnswers({ ...aiAnswers, prepStyle: e.target.value })}
                  placeholder="e.g. Crafted with handpicked Jalgaon bananas, fried in wood-fired peanut oil using an authentic family recipe..."
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 text-stone-900 text-xs focus:outline-none focus:ring-1 focus:ring-[#9B111E] bg-stone-50/20"
                />
              </div>

              {/* Question 2 */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-extrabold text-stone-800 uppercase tracking-wider">
                  2. Taste, Aromas & Flavor Profile
                </label>
                <p className="text-[10px] text-stone-500 font-medium leading-normal">
                  Describe the core taste experience. Is it spicy, sweet, tangy, salty, or does it feature specific regional masalas?
                </p>
                <textarea
                  rows={2}
                  value={aiAnswers.flavorNotes}
                  onChange={(e) => setAiAnswers({ ...aiAnswers, flavorNotes: e.target.value })}
                  placeholder="e.g. Robust spicy kick of authentic Khandeshi masalas, rock salt, and a hint of tanginess..."
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 text-stone-900 text-xs focus:outline-none focus:ring-1 focus:ring-[#9B111E] bg-stone-50/20"
                />
              </div>

              {/* Question 3 */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-extrabold text-stone-800 uppercase tracking-wider">
                  3. Target Audience & Perfect Occasion
                </label>
                <p className="text-[10px] text-stone-500 font-medium leading-normal">
                  Who loves this snack most, and when or how should they enjoy it?
                </p>
                <textarea
                  rows={2}
                  value={aiAnswers.targetAudience}
                  onChange={(e) => setAiAnswers({ ...aiAnswers, targetAudience: e.target.value })}
                  placeholder="e.g. Ideal for spice lovers, the perfect crunchy accompaniment for evening tea or social gatherings..."
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 text-stone-900 text-xs focus:outline-none focus:ring-1 focus:ring-[#9B111E] bg-stone-50/20"
                />
              </div>

              {/* Question 4 */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-extrabold text-stone-800 uppercase tracking-wider">
                  4. Dietary & Health Highlights
                </label>
                <p className="text-[10px] text-stone-500 font-medium leading-normal">
                  Is it gluten-free, trans-fat-free, made with zero palm oil, high fiber, or completely vegan?
                </p>
                <textarea
                  rows={2}
                  value={aiAnswers.dietaryCallouts}
                  onChange={(e) => setAiAnswers({ ...aiAnswers, dietaryCallouts: e.target.value })}
                  placeholder="e.g. 100% vegan, gluten-free, zero cholesterol, fried in premium oil, high natural fiber..."
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 text-stone-900 text-xs focus:outline-none focus:ring-1 focus:ring-[#9B111E] bg-stone-50/20"
                />
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between border-t border-stone-100 pt-4 flex-shrink-0">
              <button
                type="button"
                onClick={() => {
                  setAiAnswers({ prepStyle: '', flavorNotes: '', targetAudience: '', dietaryCallouts: '' });
                }}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Clear Answers
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAIWizardOpen(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAIEnhance}
                  disabled={isAILoading}
                  className="px-5 py-2 bg-purple-700 hover:bg-purple-800 disabled:bg-stone-200 disabled:text-stone-400 text-white text-xs font-extrabold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  {isAILoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Gemini is Crafting...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>Write Premium SEO Details</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AdminLayout>
  );
}
