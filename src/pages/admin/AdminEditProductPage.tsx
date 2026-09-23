'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Link } from '@/lib/linkCompat';
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
  Trash2,
  Search,
  Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CloudinaryUpload } from '@/components/admin/CloudinaryUpload';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ProductVariantsEditor } from '@/components/admin/ProductVariantsEditor';
import { DiwaliComboImagesEditor } from '@/components/admin/DiwaliComboImagesEditor';
import { Product, ProductVariant } from '@/types';

export default function AdminEditProductPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

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
  const [isLoadingProduct, setIsLoadingProduct] = useState(() => Boolean(id));
  const [product, setProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isImageAutoUpdating, setIsImageAutoUpdating] = useState(false);
  const [imageAutoUpdated, setImageAutoUpdated] = useState(false);
  const [isAILoading, setIsAILoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Variations State
  const [variants, setVariants] = useState<ProductVariant[]>([]);

  // Combo Sub-Product Images State (Diwali Box & Curated Bundles)
  const [comboImages, setComboImages] = useState<Record<string, string>>({});
  const [showComboEditor, setShowComboEditor] = useState(false);

  // Form Fields State
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    category: 'banana-chips',
    description: '',
    shortDescription: '',
    price: '',
    mrp: '',
    profit: '',
    netQuantity: '100g',
    flavour: '',
    tags: '',
    stock: '100',
    imageUrl: '',
    ingredients: '',
    isFeatured: false,
    isBestSeller: false,
    isNew: false,
    isAvailable: true,
    seoTitle: '',
    seoDescription: ''
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

  // SEO AI Generator State
  const [isSeoGenerating, setIsSeoGenerating] = useState(false);
  const [seoScore, setSeoScore] = useState<number | null>(null);
  const [seoNotes, setSeoNotes] = useState<string[]>([]);

  const handleGenerateSeoAI = async () => {
    if (!formData.name.trim()) {
      showToast('Please enter a product title first before generating SEO tags.');
      return;
    }
    setIsSeoGenerating(true);
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
        if (json.data.seoScore) setSeoScore(json.data.seoScore);
        if (json.data.improvementNotes) setSeoNotes(json.data.improvementNotes);
        showToast('✨ AI Google SEO Meta Tags generated!');
      } else {
        showToast('Generated SEO metadata with smart defaults.');
      }
    } catch (err) {
      console.error('SEO AI error:', err);
      showToast('Error generating AI SEO tags.');
    } finally {
      setIsSeoGenerating(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleVerifyPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setPinError(null);

    try {
      const res = await fetch('/api/admin/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pinInput })
      });
      const data = await res.json();

      if (data.success) {
        setIsAuthenticated(true);
        localStorage.setItem('ajw_admin_authenticated', 'true');
      } else {
        setPinError(data.message || 'Invalid Security PIN. Please try again.');
      }
    } catch {
      setPinError('Connection error. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Load Categories & Product
  useEffect(() => {
    let isMounted = true;
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.success && Array.isArray(data.data)) {
          setCategories(data.data);
        }
      })
      .catch(() => {});

    if (id) {
      fetch(`/api/products/${id}`)
        .then((res) => res.json())
        .then((res) => {
          if (!isMounted) return;
          if (res.success && res.data) {
            const p: Product = (res.data && (res.data as any).product) ? (res.data as any).product : res.data;
            setProduct(p);
            setFormData({
              name: p.name || '',
              slug: p.slug || '',
              category: p.category || p.categoryId || 'banana-chips',
              description: p.description || '',
              shortDescription: p.shortDescription || '',
              price: String(p.price !== undefined && p.price !== null ? p.price : ''),
              mrp: String(p.mrp !== undefined && p.mrp !== null ? p.mrp : ''),
              profit: String(p.profit !== undefined && p.profit !== null ? p.profit : ''),
              netQuantity: p.netQuantity || '100g',
              flavour: p.flavour || '',
              tags: Array.isArray(p.tags) ? p.tags.join(', ') : (typeof p.tags === 'string' ? p.tags : ''),
              stock: String(p.stock ?? 100),
              imageUrl: p.images?.[0]?.url || p.imageUrl || '',
              ingredients: Array.isArray(p.ingredients) ? p.ingredients.join(', ') : (typeof p.ingredients === 'string' ? p.ingredients : ''),
              isFeatured: !!p.isFeatured,
              isBestSeller: !!p.isBestSeller,
              isNew: !!p.isNew,
              isAvailable: p.isAvailable ?? true,
              seoTitle: p.seoTitle || '',
              seoDescription: p.seoDescription || ''
            });
            if (Array.isArray(p.variants) && p.variants.length > 0) {
              setVariants(p.variants);
            } else {
              setVariants([]);
            }
            if (p.comboImages && typeof p.comboImages === 'object') {
              setComboImages(p.comboImages);
            } else {
              setComboImages({});
            }
          } else {
            showToast('Failed to find product with given ID');
          }
        })
        .catch(() => {
          if (isMounted) showToast('Error loading product');
        })
        .finally(() => {
          if (isMounted) setIsLoadingProduct(false);
        });
    }

    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleGenerateAI = async () => {
    if (!formData.name.trim()) {
      showToast('Please enter a product title before running AI.');
      return;
    }

    setIsAILoading(true);
    try {
      const res = await fetch('/api/admin/generate-copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.name,
          category: formData.category,
          flavour: formData.flavour,
          notes: `${aiAnswers.prepStyle} ${aiAnswers.flavorNotes} ${aiAnswers.targetAudience} ${aiAnswers.dietaryCallouts}`
        })
      });

      const data = await res.json();
      if (data.success && data.data) {
        setFormData((prev) => ({
          ...prev,
          description: data.data.description || prev.description,
          shortDescription: data.data.shortDescription || prev.shortDescription,
          seoTitle: data.data.seoTitle || prev.seoTitle,
          seoDescription: data.data.seoDescription || prev.seoDescription,
          tags: data.data.tags ? data.data.tags.join(', ') : prev.tags
        }));
        showToast('AI enhancement applied!');
        setIsAIWizardOpen(false);
      } else {
        showToast('AI generation notice: Local fallback applied.');
      }
    } catch {
      showToast('Error generating AI copy.');
    } finally {
      setIsAILoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('Product title is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const tagList = formData.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const payload = {
        name: formData.name.trim(),
        slug: formData.slug.trim() || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        category: formData.category,
        categoryId: formData.category,
        description: formData.description,
        shortDescription: formData.shortDescription,
        price: parseFloat(formData.price) || 0,
        mrp: parseFloat(formData.mrp) || parseFloat(formData.price) || 0,
        profit: parseFloat(formData.profit) || 0,
        netQuantity: formData.netQuantity,
        flavour: formData.flavour,
        tags: tagList,
        stock: parseInt(formData.stock, 10) || 0,
        imageUrl: formData.imageUrl,
        images: formData.imageUrl ? [{ url: formData.imageUrl, isPrimary: true, alt: formData.name }] : [],
        variants: variants,
        comboImages: Object.keys(comboImages).length > 0 ? comboImages : undefined,
        ingredients: formData.ingredients,
        isFeatured: formData.isFeatured,
        isBestSeller: formData.isBestSeller,
        isNew: formData.isNew,
        isAvailable: formData.isAvailable,
        seoTitle: formData.seoTitle,
        seoDescription: formData.seoDescription
      };

      const res = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        showToast('Product updated successfully!');
        setTimeout(() => {
          navigate('/admin/products');
        }, 1200);
      } else {
        showToast(data.message || 'Error updating product.');
      }
    } catch (err) {
      showToast('Server error while saving product.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAutoUpdateImage = async (newUrl: string) => {
    const trimmedUrl = (newUrl || '').trim();
    if (!trimmedUrl) {
      setFormData(prev => ({ ...prev, imageUrl: '' }));
      return;
    }

    setFormData(prev => ({ ...prev, imageUrl: trimmedUrl }));
    if (!id) return;

    setIsImageAutoUpdating(true);
    showToast('Auto-updating product image in database...');

    try {
      const tagList = formData.tags
        ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean)
        : (product?.tags || []);

      const payload = {
        name: formData.name.trim() || product?.name || '',
        slug: formData.slug.trim() || product?.slug || (formData.name ? formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : ''),
        category: formData.category || product?.category || 'banana-chips',
        categoryId: formData.category || product?.categoryId || 'banana-chips',
        description: formData.description || product?.description || '',
        shortDescription: formData.shortDescription || product?.shortDescription || '',
        price: parseFloat(formData.price) || (product?.price ?? 0),
        mrp: parseFloat(formData.mrp) || parseFloat(formData.price) || (product?.mrp ?? 0),
        netQuantity: formData.netQuantity || product?.netQuantity || '100g',
        flavour: formData.flavour || product?.flavour || undefined,
        tags: tagList,
        stock: parseInt(formData.stock, 10) || (product?.stock ?? 100),
        imageUrl: trimmedUrl,
        images: [{
          id: `img-${id}-0`,
          url: trimmedUrl,
          alt: formData.name.trim() || product?.name || 'Product Image',
          isPrimary: true
        }],
        variants: variants.length > 0 ? variants : (product?.variants || undefined),
        comboImages: Object.keys(comboImages).length > 0 ? comboImages : (product?.comboImages || undefined),
        ingredients: formData.ingredients || product?.ingredients || '',
        isFeatured: formData.isFeatured,
        isBestSeller: formData.isBestSeller,
        isNew: formData.isNew,
        isAvailable: formData.isAvailable,
        seoTitle: formData.seoTitle || product?.seoTitle || undefined,
        seoDescription: formData.seoDescription || product?.seoDescription || undefined
      };

      const res = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        if (data.data) {
          setProduct(data.data);
        }
        setImageAutoUpdated(true);
        showToast('✨ Product image auto-updated in database!');
        setTimeout(() => setImageAutoUpdated(false), 4000);
      } else {
        showToast(data.message || 'Image uploaded. Click Save Changes to finalize.');
      }
    } catch (err) {
      console.error('Error auto-updating product image in database:', err);
      showToast('Image uploaded. Click Save Changes to save.');
    } finally {
      setIsImageAutoUpdating(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <AdminLayout>
        <div className="max-w-md mx-auto my-16 bg-white p-8 rounded-2xl border border-stone-200 shadow-sm text-center">
          <div className="w-14 h-14 bg-red-50 text-[#9B111E] rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-stone-900 mb-2">Admin Security Verification</h2>
          <p className="text-sm text-stone-600 mb-6">Enter your master PIN code to edit this product.</p>

          <form onSubmit={handleVerifyPin} className="space-y-4">
            <input
              type="password"
              placeholder="Enter PIN (e.g. 1984)"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              className="w-full text-center tracking-widest text-xl px-4 py-3 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#9B111E]"
              autoFocus
            />
            {pinError && <p className="text-xs text-red-600 font-medium">{pinError}</p>}
            <button
              type="submit"
              disabled={isVerifying || !pinInput}
              className="w-full py-3 bg-[#9B111E] hover:bg-[#800A14] text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
            >
              {isVerifying ? 'Verifying...' : 'Unlock Admin Panel'}
            </button>
          </form>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto pb-20 pt-4">
        {/* Toast */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-20 right-6 z-50 bg-stone-900 text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 border border-stone-700"
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span className="text-sm font-medium">{toastMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Link
              to="/admin/products"
              className="p-2 bg-stone-100 hover:bg-stone-200 rounded-xl text-stone-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-stone-900">Edit Product</h1>
              <p className="text-sm text-stone-500">Update item details, pricing, inventory, and images.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || isLoadingProduct}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#9B111E] hover:bg-[#800A14] text-white font-semibold rounded-xl shadow-sm transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSubmitting ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>

        {isLoadingProduct ? (
          <div className="py-24 text-center">
            <div className="w-10 h-10 border-3 border-[#9B111E] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-stone-600 font-medium">Loading product specifications...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Primary Details Card */}
            <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm space-y-6">
              <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2 border-b border-stone-100 pb-3">
                <Package className="w-5 h-5 text-[#9B111E]" />
                <span>Basic Specifications</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase text-stone-600 mb-1.5">
                    Product Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Jalgaon Classic Salted Banana Chips"
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#9B111E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-stone-600 mb-1.5">
                    URL Slug
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="e.g. jalgaon-classic-salted-chips"
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#9B111E] bg-stone-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-stone-600 mb-1.5">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#9B111E] bg-white text-stone-900 font-medium"
                  >
                    <option value="banana-chips">Banana Chips (10 Flavours - ID: 1)</option>
                    <option value="regular-banana-chips">Regular Banana Chips (Family Packs - ID: 5)</option>
                    <option value="khandeshi-farsaan">Khandeshi Farsaan & Namkeen</option>
                    <option value="kitchen-masalas">Kitchen Masalas</option>
                    <option value="potato-chips">Handcrafted Potato Chips</option>
                    <option value="upwas-special">Upwas Special (Fasting)</option>
                    <option value="shravan-special">Shravan Special</option>
                    <option value="combo-packs">Combos & Gift Boxes</option>
                    {categories
                      .filter((c) => !['banana-chips', 'regular-banana-chips', 'khandeshi-farsaan', 'kitchen-masalas', 'potato-chips', 'upwas-special', 'shravan-special', 'combo-packs', 'farsaan', 'masalas', 'combos'].includes(c.slug))
                      .map((c) => (
                        <option key={c.id || c.slug} value={c.slug}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-stone-600 mb-1.5">
                    Flavour Profile
                  </label>
                  <input
                    type="text"
                    value={formData.flavour}
                    onChange={(e) => setFormData({ ...formData, flavour: e.target.value })}
                    placeholder="e.g. Peri Peri, Mint Pudina, Black Salt"
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#9B111E]"
                  />
                </div>
              </div>
            </div>

            {/* Pricing & Inventory Card */}
            <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm space-y-6">
              <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2 border-b border-stone-100 pb-3">
                <span>Pricing & Inventory</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase text-stone-600 mb-1.5">
                    Selling Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="99"
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#9B111E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-stone-600 mb-1.5">
                    MRP (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.mrp}
                    onChange={(e) => setFormData({ ...formData, mrp: e.target.value })}
                    placeholder="120"
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#9B111E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-emerald-700 mb-1.5">
                    Profit Per Unit (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.profit}
                    onChange={(e) => setFormData({ ...formData, profit: e.target.value })}
                    placeholder="e.g. 35"
                    className="w-full px-4 py-2.5 rounded-xl border border-emerald-300 bg-emerald-50/30 text-emerald-900 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                  <span className="text-[10px] text-stone-400 mt-1 block">Net profit per 1 qty sold</span>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-stone-600 mb-1.5">
                    Net Quantity
                  </label>
                  <input
                    type="text"
                    value={formData.netQuantity}
                    onChange={(e) => setFormData({ ...formData, netQuantity: e.target.value })}
                    placeholder="200g"
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#9B111E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-stone-600 mb-1.5">
                    Available Stock
                  </label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    placeholder="100"
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#9B111E]"
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-stone-100">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isAvailable}
                    onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                    className="w-4 h-4 rounded text-[#9B111E] focus:ring-[#9B111E]"
                  />
                  <span className="text-sm font-medium text-stone-800">In Stock / Available</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isFeatured}
                    onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                    className="w-4 h-4 rounded text-[#9B111E] focus:ring-[#9B111E]"
                  />
                  <span className="text-sm font-medium text-stone-800">Featured on Home</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isBestSeller}
                    onChange={(e) => setFormData({ ...formData, isBestSeller: e.target.checked })}
                    className="w-4 h-4 rounded text-[#9B111E] focus:ring-[#9B111E]"
                  />
                  <span className="text-sm font-medium text-stone-800">Best Seller Badge</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isNew}
                    onChange={(e) => setFormData({ ...formData, isNew: e.target.checked })}
                    className="w-4 h-4 rounded text-[#9B111E] focus:ring-[#9B111E]"
                  />
                  <span className="text-sm font-medium text-stone-800">New Launch Badge</span>
                </label>
              </div>
            </div>

            {/* Product Weight Variations & Multi-pack Pricing (MySQL Synced) */}
            <ProductVariantsEditor
              variants={variants}
              onChange={setVariants}
              basePrice={formData.price}
              baseMrp={formData.mrp}
            />

            {/* Media Image Card */}
            <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                  <span>Product Imagery</span>
                </h3>
                {isImageAutoUpdating && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 animate-pulse">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>Auto-updating database...</span>
                  </span>
                )}
                {imageAutoUpdated && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Auto-saved in Database!</span>
                  </span>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-stone-600 mb-1.5">
                    Image URL or Uploaded Asset
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                      onBlur={() => {
                        const trimmed = formData.imageUrl.trim();
                        if (trimmed && trimmed !== (product?.imageUrl || product?.images?.[0]?.url || '')) {
                          handleAutoUpdateImage(trimmed);
                        }
                      }}
                      placeholder="https://... or /uploads/..."
                      className="flex-1 px-4 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#9B111E]"
                    />
                    {formData.imageUrl && (
                      <button
                        type="button"
                        onClick={() => handleAutoUpdateImage(formData.imageUrl.trim())}
                        disabled={isImageAutoUpdating}
                        className="px-3 py-2 text-xs font-bold bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl border border-stone-200 transition-colors shrink-0"
                      >
                        Auto-Save Image
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-stone-50 rounded-xl border border-stone-200">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs text-stone-600 font-medium">Upload new image via Cloudinary / Storage (Auto-saves to DB):</p>
                    <span className="text-[10px] font-bold text-[#9B111E] bg-[#9B111E]/10 px-2 py-0.5 rounded-md">
                      Instant DB Sync
                    </span>
                  </div>
                  <CloudinaryUpload
                    folder="products"
                    label="Upload Product Image"
                    currentValue={formData.imageUrl}
                    onUploadSuccess={(url) => handleAutoUpdateImage(url)}
                    onSuccess={(url) => handleAutoUpdateImage(url)}
                  />
                </div>

                {formData.imageUrl && (
                  <div className="flex items-center gap-4 pt-2">
                    <img
                      src={formData.imageUrl}
                      alt="Preview"
                      className="w-20 h-20 object-cover rounded-xl border border-stone-300 shadow-xs"
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-semibold text-emerald-700">Image attached</p>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                          Live in Database
                        </span>
                      </div>
                      <p className="text-xs text-stone-500 truncate max-w-sm">{formData.imageUrl}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Diwali Combo & Curated Bundles Sub-Product Images Editor */}
            <div className="pt-1">
              {(formData.slug.toLowerCase().includes('diwali') || 
                formData.name.toLowerCase().includes('diwali') || 
                formData.category === 'combo-packs' ||
                id === '32' ||
                Object.keys(comboImages).length > 0 ||
                showComboEditor) ? (
                <DiwaliComboImagesEditor
                  comboImages={comboImages}
                  onChange={setComboImages}
                />
              ) : (
                <div className="bg-amber-50/70 border border-dashed border-amber-300/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 text-xs text-amber-900 font-semibold">
                    <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Does this product have sub-sections or combo pack items? (e.g. Farsan, Sweets, Puja Kit)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowComboEditor(true)}
                    className="px-3 py-1.5 rounded-xl bg-white hover:bg-amber-100 text-stone-800 text-xs font-bold border border-amber-300 shadow-xs transition-colors shrink-0 cursor-pointer"
                  >
                    Open Combo Sub-Product Images Editor
                  </button>
                </div>
              )}
            </div>

            {/* Descriptions & AI Wizard */}
            <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#9B111E]" />
                  <span>Descriptions & AI Enhancer</span>
                </h3>
                <button
                  type="button"
                  onClick={handleGenerateAI}
                  disabled={isAILoading || !formData.name}
                  className="flex items-center gap-2 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isAILoading ? 'Thinking...' : 'AI Enhance Copy'}</span>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-stone-600 mb-1.5">
                    Short Catchy Description
                  </label>
                  <input
                    type="text"
                    value={formData.shortDescription}
                    onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                    placeholder="Crispy, golden, seasoned with authentic Khandeshi spices."
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#9B111E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-stone-600 mb-1.5">
                    Full Product Story & Details
                  </label>
                  <textarea
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Crafted from handpicked Grand Naine bananas directly from the orchards of Jalgaon..."
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#9B111E]"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-stone-600 mb-1.5">
                      Key Ingredients
                    </label>
                    <input
                      type="text"
                      value={formData.ingredients}
                      onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
                      placeholder="Raw Banana, Refined Edible Oil, Rock Salt, Spices"
                      className="w-full px-4 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#9B111E]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-stone-600 mb-1.5">
                      Tags (comma separated)
                    </label>
                    <input
                      type="text"
                      value={formData.tags}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                      placeholder="Crispy, Salted, Fasting, Traditional"
                      className="w-full px-4 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#9B111E]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Search Engine Optimization (SEO) Card */}
            <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm space-y-6" id="seo-options-card">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                    <Search className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-stone-900">Search Engine Optimization (SEO)</h3>
                    <p className="text-xs text-stone-500">Configure Google search metadata, title tags, and search preview snippet.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleGenerateSeoAI}
                  disabled={isSeoGenerating || !formData.name}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                  <span>{isSeoGenerating ? 'Generating Meta Tags...' : 'Auto-Generate AI SEO'}</span>
                </button>
              </div>

              {/* Google SERP Snippet Preview */}
              <div className="bg-stone-50/90 rounded-xl p-4 md:p-5 border border-stone-200/90 space-y-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-stone-500 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-blue-600" /> Google Search Live Preview
                  </span>
                  {seoScore && (
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> SEO Score: {seoScore}/100
                    </span>
                  )}
                </div>

                <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs space-y-1 font-sans">
                  <div className="flex items-center gap-2 text-xs text-stone-600 truncate">
                    <div className="w-4 h-4 rounded-full bg-[#9B111E] text-white flex items-center justify-center text-[9px] font-bold">
                      A
                    </div>
                    <span className="text-stone-900 font-medium truncate">Aapla Jalgaonwala</span>
                    <span className="text-stone-400">›</span>
                    <span className="text-stone-500 truncate">product › {formData.slug || 'product-slug'}</span>
                  </div>

                  <h4 className="text-base font-semibold text-blue-700 hover:underline cursor-pointer truncate leading-snug">
                    {formData.seoTitle || `${formData.name || 'Product Title'} | Buy Online - Aapla Jalgaonwala`}
                  </h4>

                  <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                    {formData.seoDescription || formData.shortDescription || formData.description || 'Order authentic Jalgaon snacks, banana chips and namkeen online from Aapla Jalgaonwala with fast delivery across India. Shop now!'}
                  </p>
                </div>
              </div>

              {/* Inputs for Meta Title and Meta Description */}
              <div className="space-y-5">
                {/* SEO Meta Title Input */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold uppercase text-stone-700 flex items-center gap-1">
                      <span>SEO Meta Title</span>
                      <span className="text-stone-400 font-normal text-[11px]">(50-60 chars target)</span>
                    </label>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                      formData.seoTitle.length >= 50 && formData.seoTitle.length <= 60
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : formData.seoTitle.length > 0 && formData.seoTitle.length < 50
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : formData.seoTitle.length > 60
                        ? 'bg-rose-100 text-rose-800 border border-rose-200'
                        : 'bg-stone-100 text-stone-600'
                    }`}>
                      {formData.seoTitle.length} / 60 chars
                    </span>
                  </div>
                  <input
                    type="text"
                    value={formData.seoTitle}
                    onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
                    placeholder={`${formData.name || 'Product Title'} | Buy Online - Aapla Jalgaonwala`}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#9B111E] text-sm text-stone-900"
                  />
                  <p className="text-[11px] text-stone-500 mt-1">
                    Primary title tag displayed on Google search results. Include main target keywords and brand suffix.
                  </p>
                </div>

                {/* SEO Meta Description Input */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold uppercase text-stone-700 flex items-center gap-1">
                      <span>SEO Meta Description</span>
                      <span className="text-stone-400 font-normal text-[11px]">(140-160 chars target)</span>
                    </label>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                      formData.seoDescription.length >= 140 && formData.seoDescription.length <= 160
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : formData.seoDescription.length > 0 && formData.seoDescription.length < 140
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : formData.seoDescription.length > 160
                        ? 'bg-rose-100 text-rose-800 border border-rose-200'
                        : 'bg-stone-100 text-stone-600'
                    }`}>
                      {formData.seoDescription.length} / 160 chars
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    value={formData.seoDescription}
                    onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
                    placeholder={formData.shortDescription || "Order authentic Jalgaon banana chips and snacks online. Prepared fresh with traditional Khandeshi recipes. Fast shipping across India. Buy now!"}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#9B111E] text-sm text-stone-900"
                  />
                  <p className="text-[11px] text-stone-500 mt-1">
                    Meta snippet describing the snack flavor, heritage, and a compelling call-to-action to boost click-through rates.
                  </p>
                </div>

                {/* AI Insights & Strategy Notes */}
                {seoNotes.length > 0 && (
                  <div className="p-3.5 bg-blue-50/80 rounded-xl border border-blue-200/70 text-xs text-blue-950 space-y-1">
                    <p className="font-bold text-blue-900 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" /> Google Technical Strategy Insights:
                    </p>
                    <ul className="list-disc list-inside space-y-0.5 text-[11px] text-blue-900/90">
                      {seoNotes.map((note, idx) => (
                        <li key={idx}>{note}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-end gap-4">
              <Link
                to="/admin/products"
                className="px-6 py-3 border border-stone-300 text-stone-700 font-semibold rounded-xl hover:bg-stone-100 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-3 bg-[#9B111E] hover:bg-[#800A14] text-white font-bold rounded-xl shadow-md transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Saving Updates...' : 'Update Product'}
              </button>
            </div>
          </form>
        )}
      </div>
    </AdminLayout>
  );
}
