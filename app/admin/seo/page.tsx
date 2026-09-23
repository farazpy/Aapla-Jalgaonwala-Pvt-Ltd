'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { PageSeoItem, Product } from '@/types';
import {
  Globe,
  RefreshCw,
  FileText,
  Tag,
  Search,
  Edit2,
  Check,
  X,
  Sparkles,
  Save,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Copy,
  ExternalLink,
  ShieldCheck,
  Zap,
  Layers,
  Cpu,
  ArrowUpRight,
  Code2,
  CheckCircle,
  HelpCircle,
  TrendingUp
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { AdminLayout } from '@/components/admin/AdminLayout';

interface AiSeoResult {
  seoTitle: string;
  seoDescription: string;
  keywords: string;
  ogTitle: string;
  ogDescription: string;
  seoScore: number;
  improvementNotes: string[];
}

export default function AdminSeoPage() {
  const [activeTab, setActiveTab] = useState<'audit' | 'pages' | 'products' | 'categories' | 'technical' | 'improvements'>('audit');
  const [pageSeoList, setPageSeoList] = useState<PageSeoItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [dynamicCategories, setDynamicCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // SEO Analysis Improvements State
  const [isAnalyzingImprovements, setIsAnalyzingImprovements] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);

  // AI State
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [isBulkOptimizing, setIsBulkOptimizing] = useState(false);
  const [lastAiResult, setLastAiResult] = useState<AiSeoResult | null>(null);

  // Selected Items State for Bulk SEO Action
  const [selectedItems, setSelectedItems] = useState<Array<{ type: 'page' | 'product' | 'category'; id: string }>>([]);

  // SERP Preview Toggle
  const [serpDevice, setSerpDevice] = useState<'desktop' | 'mobile'>('desktop');

  // Page SEO Modal State
  const [editingPageSeo, setEditingPageSeo] = useState<PageSeoItem | null>(null);
  const [pageSeoForm, setPageSeoForm] = useState({
    title: '',
    description: '',
    keywords: '',
    ogTitle: '',
    ogDescription: ''
  });
  const [isSavingPageSeo, setIsSavingPageSeo] = useState(false);

  // Product SEO Modal State
  const [editingProductSeo, setEditingProductSeo] = useState<Product | null>(null);
  const [productSeoForm, setProductSeoForm] = useState({
    seoTitle: '',
    seoDescription: '',
    seoKeywords: ''
  });
  const [isSavingProductSeo, setIsSavingProductSeo] = useState(false);

  // Category SEO Modal State
  const [editingCategorySeo, setEditingCategorySeo] = useState<any | null>(null);
  const [categorySeoForm, setCategorySeoForm] = useState({
    title: '',
    description: '',
    keywords: ''
  });
  const [isSavingCategorySeo, setIsSavingCategorySeo] = useState(false);

  // Category Fallback State
  const staticCategories = useMemo(() => [
    { id: 'cat-banana-chips', name: 'Jalgaon Banana Chips', slug: 'banana-chips', count: 10, tagline: 'Crisp & authentic salted banana chips.' },
    { id: 'cat-farsan', name: 'Namkeen & Farsaan', slug: 'farsan', count: 8, tagline: 'Spicy Khandeshi namkeens.' },
    { id: 'cat-masala', name: 'Khandeshi Masala', slug: 'masala', count: 6, tagline: 'Hand-pounded premium spices.' },
    { id: 'cat-upwas', name: 'Upwas Special', slug: 'upwas', count: 5, tagline: 'Fast-compliant crispies.' },
    { id: 'cat-chutney', name: 'Dry Chutneys', slug: 'chutney', count: 4, tagline: 'Flavorful dry spice powders.' }
  ], []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchSeoData = useCallback(async (showLoadingState = false) => {
    if (showLoadingState) setIsLoading(true);
    try {
      const [seoRes, prodRes, catRes] = await Promise.all([
        fetch('/api/seo').then((r) => r.json()),
        fetch('/api/products').then((r) => r.json()),
        fetch('/api/categories').then((r) => r.json()).catch(() => ({ success: false, data: [] }))
      ]);

      if (seoRes.success && Array.isArray(seoRes.data)) {
        setPageSeoList(seoRes.data);
      }
      if (prodRes.success && Array.isArray(prodRes.data)) {
        setProducts(prodRes.data);
      }
      if (catRes.success && Array.isArray(catRes.data)) {
        setDynamicCategories(catRes.data);
      }
    } catch (err) {
      console.error('Error fetching SEO metadata:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSeoData();
  }, [fetchSeoData]);

  const computedCategories = useMemo(() => {
    const list = dynamicCategories.length > 0 ? dynamicCategories : staticCategories;
    return list.map((c: any) => {
      const slugValue = c.slug || c.key || '';
      const prodCount = products.filter(p => 
        p.category?.toLowerCase() === slugValue.toLowerCase() || 
        p.category?.toLowerCase() === c.name?.toLowerCase()
      ).length;
      return {
        id: c.id || `cat-${slugValue}`,
        name: c.name,
        slug: slugValue,
        count: prodCount || c.count || 0,
        tagline: c.tagline || c.description || ''
      };
    });
  }, [dynamicCategories, staticCategories, products]);

  // Selection states helpers
  const toggleSelectItem = (type: 'page' | 'product' | 'category', id: string) => {
    setSelectedItems((prev) => {
      const exists = prev.some((item) => item.type === type && item.id === id);
      if (exists) {
        return prev.filter((item) => !(item.type === type && item.id === id));
      } else {
        return [...prev, { type, id }];
      }
    });
  };

  const isItemSelected = (type: 'page' | 'product' | 'category', id: string) => {
    return selectedItems.some((item) => item.type === type && item.id === id);
  };

  const toggleSelectAllTabItems = () => {
    let currentTabItems: Array<{ type: 'page' | 'product' | 'category'; id: string }> = [];
    if (activeTab === 'pages') {
      currentTabItems = pageSeoList.map(p => ({ type: 'page' as const, id: p.pageKey }));
    } else if (activeTab === 'products') {
      currentTabItems = filteredProducts.map(p => ({ type: 'product' as const, id: p.id }));
    } else if (activeTab === 'categories') {
      currentTabItems = computedCategories.map(c => ({ type: 'category' as const, id: c.slug }));
    }

    const allSelected = currentTabItems.every(item => 
      selectedItems.some(prev => prev.type === item.type && prev.id === item.id)
    );

    if (allSelected) {
      setSelectedItems(prev => prev.filter(p => 
        !currentTabItems.some(item => item.type === p.type && item.id === p.id)
      ));
    } else {
      setSelectedItems(prev => {
        const filtered = prev.filter(p => 
          !currentTabItems.some(item => item.type === p.type && item.id === p.id)
        );
        return [...filtered, ...currentTabItems];
      });
    }
  };

  const isAllTabItemsSelected = () => {
    let currentTabItems: Array<{ type: 'page' | 'product' | 'category'; id: string }> = [];
    if (activeTab === 'pages') {
      currentTabItems = pageSeoList.map(p => ({ type: 'page' as const, id: p.pageKey }));
    } else if (activeTab === 'products') {
      currentTabItems = filteredProducts.map(p => ({ type: 'product' as const, id: p.id }));
    } else if (activeTab === 'categories') {
      currentTabItems = computedCategories.map(c => ({ type: 'category' as const, id: c.slug }));
    }

    if (currentTabItems.length === 0) return false;
    return currentTabItems.every(item => 
      selectedItems.some(prev => prev.type === item.type && prev.id === item.id)
    );
  };

  // Overall SEO Health Audit Math
  const auditMetrics = useMemo(() => {
    const totalPages = pageSeoList.length;
    const totalProducts = products.length;
    const totalCategories = computedCategories.length;
    const totalItems = totalPages + totalProducts + totalCategories;

    if (totalItems === 0) {
      return { score: 100, optimalTitles: 0, optimalDescs: 0, missingKeywords: 0, totalItems: 0, totalPages: 0, totalProducts: 0, totalCategories: 0 };
    }

    let optimalTitles = 0;
    let optimalDescs = 0;
    let missingKeywords = 0;

    pageSeoList.forEach((p) => {
      const tLen = p.seoTitle ? p.seoTitle.length : 0;
      const dLen = p.seoDescription ? p.seoDescription.length : 0;
      if (tLen >= 50 && tLen <= 60) optimalTitles++;
      if (dLen >= 140 && dLen <= 160) optimalDescs++;
      if (!p.keywords || (Array.isArray(p.keywords) && p.keywords.length === 0)) missingKeywords++;
    });

    products.forEach((p) => {
      const title = p.seoTitle || p.name || '';
      const desc = p.seoDescription || p.shortDescription || p.description || '';
      const tLen = title.length;
      const dLen = desc.length;
      if (tLen >= 50 && tLen <= 60) optimalTitles++;
      if (dLen >= 140 && dLen <= 160) optimalDescs++;
    });

    computedCategories.forEach((c) => {
      const existingSeo = pageSeoList.find((p) => p.pageKey === `category-${c.slug}`);
      const title = existingSeo?.seoTitle || `Buy Fresh ${c.name} Online | Aapla Jalgaonwala`;
      const desc = existingSeo?.seoDescription || `${c.name} freshly sourced from Jalgaon. Order high quality, authentic Khandeshi tastes online.`;
      const tLen = title.length;
      const dLen = desc.length;
      if (tLen >= 50 && tLen <= 60) optimalTitles++;
      if (dLen >= 140 && dLen <= 160) optimalDescs++;
      if (!existingSeo?.keywords || (Array.isArray(existingSeo.keywords) && existingSeo.keywords.length === 0)) missingKeywords++;
    });

    const titleScore = (optimalTitles / totalItems) * 45;
    const descScore = (optimalDescs / totalItems) * 45;
    const kwScore = ((totalItems - missingKeywords) / totalItems) * 10;
    const totalScore = Math.min(100, Math.round(titleScore + descScore + kwScore));

    return {
      score: totalScore,
      optimalTitles,
      optimalDescs,
      missingKeywords,
      totalItems,
      totalPages,
      totalProducts,
      totalCategories
    };
  }, [pageSeoList, products, computedCategories]);

  // Single AI Generation Call using Gemini 3.1 Flash Lite
  const handleGenerateAiForPage = async (pageName: string, pageKey: string, currentTitle?: string, currentDesc?: string) => {
    setIsGeneratingAi(true);
    setLastAiResult(null);
    try {
      const res = await fetch('/api/seo/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'page',
          pageKey,
          pageName,
          currentTitle,
          currentDescription: currentDesc
        })
      });
      const json = await res.json();
      if (json.success && json.data) {
        const result: AiSeoResult = json.data;
        setPageSeoForm({
          title: result.seoTitle,
          description: result.seoDescription,
          keywords: result.keywords,
          ogTitle: result.ogTitle,
          ogDescription: result.ogDescription
        });
        setLastAiResult(result);
        showToast('✨ Generated Google-optimized SEO tags with Gemini 3.1 Flash Lite!');
      } else {
        alert(json.error || 'Failed to generate AI SEO');
      }
    } catch (err) {
      console.error('AI SEO generation failed:', err);
      alert('Error connecting to Gemini AI service.');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleGenerateAiForProduct = async (product: Product) => {
    setIsGeneratingAi(true);
    setLastAiResult(null);
    try {
      const res = await fetch('/api/seo/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'product',
          productName: product.name,
          productCategory: product.category,
          productDescription: product.shortDescription || product.description,
          currentTitle: product.seoTitle,
          currentDescription: product.seoDescription
        })
      });
      const json = await res.json();
      if (json.success && json.data) {
        const result: AiSeoResult = json.data;
        setProductSeoForm({
          seoTitle: result.seoTitle,
          seoDescription: result.seoDescription,
          seoKeywords: result.keywords
        });
        setLastAiResult(result);
        showToast('✨ Product SEO optimized with Gemini 3.1 Flash Lite!');
      } else {
        alert(json.error || 'Failed to generate product AI SEO');
      }
    } catch (err) {
      console.error('Product AI SEO error:', err);
      alert('Error connecting to Gemini AI service.');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleGenerateAiForCategory = async (cat: any) => {
    setIsGeneratingAi(true);
    setLastAiResult(null);
    try {
      const res = await fetch('/api/seo/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'category',
          productName: cat.name,
          productCategory: 'Category Listing',
          productDescription: cat.tagline || `${cat.name} freshly sourced from Jalgaon.`,
          currentTitle: categorySeoForm.title,
          currentDescription: categorySeoForm.description
        })
      });
      const json = await res.json();
      if (json.success && json.data) {
        const result: AiSeoResult = json.data;
        setCategorySeoForm({
          title: result.seoTitle,
          description: result.seoDescription,
          keywords: result.keywords
        });
        setLastAiResult(result);
        showToast('✨ Category SEO optimized with Gemini 3.1 Flash Lite!');
      } else {
        alert(json.error || 'Failed to generate category AI SEO');
      }
    } catch (err) {
      console.error('Category AI SEO error:', err);
      alert('Error connecting to Gemini AI service.');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Analyze Entire SEO Performance
  const handleAnalyzeImprovements = async () => {
    setIsAnalyzingImprovements(true);
    setAnalysisResult(null);
    try {
      const res = await fetch('/api/seo/analyze-improvements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (data.success && data.data) {
        setAnalysisResult(data.data);
        showToast('SEO Audit completed! AI improvements identified.');
      } else {
        showToast(data.message || 'Failed to analyze SEO performance.');
      }
    } catch (err: any) {
      console.error(err);
      showToast('Error running SEO performance analysis.');
    } finally {
      setIsAnalyzingImprovements(false);
    }
  };

  // Instantly apply a recommended title and description to a page, product or category
  const handleApplyAIRecommendation = async (item: any) => {
    try {
      if (item.type === 'page') {
        const page = pageSeoList.find(p => p.pageKey === item.id);
        if (!page) return;
        const res = await fetch('/api/seo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...page,
            seoTitle: item.recommendedTitle,
            seoDescription: item.recommendedDescription
          })
        });
        const data = await res.json();
        if (data.success) {
          showToast(`Applied SEO recommendation for page "${item.name}"!`);
          fetchSeoData();
        } else {
          showToast(data.message || 'Failed to apply recommendation.');
        }
      } else if (item.type === 'product') {
        const product = products.find(p => p.id === item.id);
        if (!product) return;
        const res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...product,
            seoTitle: item.recommendedTitle,
            seoDescription: item.recommendedDescription
          })
        });
        const data = await res.json();
        if (data.success) {
          showToast(`Applied SEO recommendation for product "${item.name}"!`);
          fetchSeoData();
        } else {
          showToast(data.message || 'Failed to apply recommendation.');
        }
      } else if (item.type === 'category') {
        const pageKey = `category-${item.id}`;
        let existing = pageSeoList.find(p => p.pageKey === pageKey);
        if (!existing) {
          existing = {
            id: '',
            pageKey,
            pageName: item.name,
            seoTitle: item.recommendedTitle,
            seoDescription: item.recommendedDescription,
            keywords: '',
            ogTitle: item.recommendedTitle,
            ogDescription: item.recommendedDescription,
            ogImage: ''
          };
        } else {
          existing = {
            ...existing,
            seoTitle: item.recommendedTitle,
            seoDescription: item.recommendedDescription
          };
        }
        const res = await fetch('/api/seo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(existing)
        });
        const data = await res.json();
        if (data.success) {
          showToast(`Applied SEO recommendation for category "${item.name}"!`);
          fetchSeoData();
        } else {
          showToast(data.message || 'Failed to apply recommendation.');
        }
      }

      setAnalysisResult((prev: any) => {
        if (!prev) return null;
        return {
          ...prev,
          improvements: prev.improvements.map((imp: any) => 
            imp.id === item.id && imp.type === item.type ? { ...imp, applied: true } : imp
          )
        };
      });
    } catch (err) {
      console.error(err);
      showToast('Error applying AI recommendation.');
    }
  };

  // Bulk AI Optimization Call
  const handleRunBulkAiOptimizer = async (target: 'pages' | 'products' | 'categories' | 'all', itemsToOptimize?: Array<{ type: 'page' | 'product' | 'category'; id: string }>) => {
    const isSelected = !!itemsToOptimize && itemsToOptimize.length > 0;
    const targetLabel = isSelected ? `${itemsToOptimize.length} selected items` : target.toUpperCase();
    
    if (!confirm(`Are you sure you want to run Gemini 3.1 Flash Lite AI optimization on ${targetLabel}? This will update titles to 50-60 chars and descriptions to 140-160 chars.`)) {
      return;
    }

    setIsBulkOptimizing(true);
    try {
      const res = await fetch('/api/seo/bulk-optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          target, 
          items: itemsToOptimize 
        })
      });
      const json = await res.json();
      if (json.success) {
        showToast(`✨ Successfully AI-optimized ${json.data?.updatedCount || 0} entries with Gemini 3.1 Flash Lite!`);
        if (isSelected) {
          setSelectedItems([]);
        }
        fetchSeoData();
      } else {
        alert(json.error || 'Bulk SEO optimization failed');
      }
    } catch (err) {
      console.error('Bulk SEO error:', err);
      alert('Error running bulk AI optimizer.');
    } finally {
      setIsBulkOptimizing(false);
    }
  };

  const handleOpenPageSeoModal = (page: PageSeoItem) => {
    setEditingPageSeo(page);
    setLastAiResult(null);
    setPageSeoForm({
      title: page.seoTitle || '',
      description: page.seoDescription || '',
      keywords: Array.isArray(page.keywords) ? page.keywords.join(', ') : page.keywords || '',
      ogTitle: page.seoTitle || '',
      ogDescription: page.seoDescription || ''
    });
  };

  const handleSavePageSeo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPageSeo) return;
    setIsSavingPageSeo(true);

    try {
      const res = await fetch('/api/seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageKey: editingPageSeo.pageKey,
          pageName: editingPageSeo.pageName,
          seoTitle: pageSeoForm.title,
          seoDescription: pageSeoForm.description,
          keywords: pageSeoForm.keywords.split(',').map((s) => s.trim()).filter(Boolean)
        })
      });
      const json = await res.json();
      if (json.success) {
        showToast('Page SEO metadata saved successfully.');
        setEditingPageSeo(null);
        fetchSeoData();
      } else {
        alert(json.error || 'Failed to save SEO');
      }
    } catch (err) {
      console.error('Error saving SEO:', err);
      alert('Error updating database.');
    } finally {
      setIsSavingPageSeo(false);
    }
  };

  const handleOpenProductSeoModal = (p: Product) => {
    setEditingProductSeo(p);
    setLastAiResult(null);
    setProductSeoForm({
      seoTitle: p.seoTitle || p.name || '',
      seoDescription: p.seoDescription || p.shortDescription || p.description || '',
      seoKeywords: p.flavour ? `${p.flavour}, snacks, ${p.category}` : `${p.category}, jalgaon snacks`
    });
  };

  const handleSaveProductSeo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProductSeo) return;
    setIsSavingProductSeo(true);

    try {
      const res = await fetch(`/api/products/${editingProductSeo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editingProductSeo,
          seoTitle: productSeoForm.seoTitle,
          seoDescription: productSeoForm.seoDescription
        })
      });
      const json = await res.json();
      if (json.success) {
        showToast('Product SEO tags updated.');
        setEditingProductSeo(null);
        fetchSeoData();
      } else {
        alert(json.error || 'Failed to update product SEO');
      }
    } catch (err) {
      console.error('Product SEO save error:', err);
      alert('Error connecting to database.');
    } finally {
      setIsSavingProductSeo(false);
    }
  };

  const handleOpenCategorySeoModal = (cat: any) => {
    setEditingCategorySeo(cat);
    setLastAiResult(null);
    const existingSeo = pageSeoList.find((p) => p.pageKey === `category-${cat.slug}`);
    setCategorySeoForm({
      title: existingSeo?.seoTitle || `Buy Fresh ${cat.name} Online | Aapla Jalgaonwala`,
      description: existingSeo?.seoDescription || `${cat.name} freshly sourced from Jalgaon. Order high quality, authentic Khandeshi tastes online.`,
      keywords: Array.isArray(existingSeo?.keywords) ? existingSeo.keywords.join(', ') : existingSeo?.keywords || `${cat.name}, jalgaon snacks, online order`
    });
  };

  const handleSaveCategorySeo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategorySeo) return;
    setIsSavingCategorySeo(true);

    try {
      const res = await fetch('/api/seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageKey: `category-${editingCategorySeo.slug}`,
          pageName: `Category: ${editingCategorySeo.name}`,
          seoTitle: categorySeoForm.title,
          seoDescription: categorySeoForm.description,
          keywords: categorySeoForm.keywords.split(',').map((s) => s.trim()).filter(Boolean)
        })
      });
      const json = await res.json();
      if (json.success) {
        showToast('Category SEO metadata saved successfully.');
        setEditingCategorySeo(null);
        fetchSeoData();
      } else {
        alert(json.error || 'Failed to save Category SEO');
      }
    } catch (err) {
      console.error('Error saving Category SEO:', err);
      alert('Error updating database.');
    } finally {
      setIsSavingCategorySeo(false);
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);

  // Color helper for Title character count gauge (50-60 optimal)
  const getTitleGaugeColor = (length: number) => {
    if (length >= 50 && length <= 60) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if ((length >= 40 && length < 50) || (length > 60 && length <= 65)) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-rose-600 bg-rose-50 border-rose-200';
  };

  // Color helper for Description character count gauge (140-160 optimal)
  const getDescGaugeColor = (length: number) => {
    if (length >= 140 && length <= 160) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if ((length >= 120 && length < 140) || (length > 160 && length <= 170)) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-rose-600 bg-rose-50 border-rose-200';
  };

  return (
    <AdminLayout
      pageTitle="SEO Manager"
      breadcrumbs={[
        { label: 'Sales & Catalog', href: '/admin' },
        { label: 'SEO Control Room' }
      ]}
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleRunBulkAiOptimizer('all')}
            disabled={isBulkOptimizing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#9B111E] hover:bg-[#800d18] text-white rounded-lg text-xs font-bold transition-all shadow-xs disabled:opacity-50"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isBulkOptimizing ? 'animate-spin' : ''}`} />
            <span>{isBulkOptimizing ? 'AI Optimizing Site...' : 'AI Auto-Optimize All'}</span>
          </button>
          <button
            onClick={() => fetchSeoData(true)}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-stone-200 rounded-lg text-xs font-bold text-stone-700 bg-white hover:bg-stone-50 transition-colors shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#9B111E]' : ''}`} />
            <span>Sync SEO</span>
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed top-5 right-5 z-50 bg-stone-900 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-xl flex items-center gap-2 border border-stone-700 animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Master AI Header Banner */}
        <div className="bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 p-6 rounded-2xl border border-stone-800 text-white shadow-lg space-y-4 relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent pointer-events-none" />
          
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[10px] font-extrabold uppercase tracking-widest">
                  <Cpu className="w-3 h-3 text-amber-400" /> Powered by Gemini 3.1 Flash Lite
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[10px] font-extrabold uppercase tracking-widest">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" /> Google Length Standard
                </span>
              </div>
              <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                Search Engine Optimization & Google Ranking Hub
              </h1>
              <p className="text-xs text-stone-300 leading-relaxed">
                Automate store meta titles (strictly <strong className="text-amber-300">50-60 chars</strong>) and snippet descriptions (strictly <strong className="text-amber-300">140-160 chars</strong>) for maximum Google CTR and search rankings across all routes, categories, and products.
              </p>
            </div>

            <div className="bg-stone-800/80 p-4 rounded-xl border border-stone-700/80 flex items-center gap-5 min-w-[240px]">
              <div className="text-center">
                <p className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">SEO Score</p>
                <p className="text-3xl font-black text-emerald-400">{auditMetrics.score}%</p>
              </div>
              <div className="h-10 w-px bg-stone-700" />
              <div className="space-y-1 text-xs">
                <p className="text-stone-300 flex items-center gap-1.5 font-medium">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span><strong>{auditMetrics.optimalTitles}</strong> Title Optimal</span>
                </p>
                <p className="text-stone-300 flex items-center gap-1.5 font-medium">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span><strong>{auditMetrics.optimalDescs}</strong> Desc Optimal</span>
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex flex-wrap items-center gap-1 pt-2 border-t border-stone-800 text-xs font-bold">
            <button
              onClick={() => setActiveTab('audit')}
              className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                activeTab === 'audit' ? 'bg-[#9B111E] text-white shadow-xs' : 'text-stone-400 hover:text-white hover:bg-stone-800/60'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>SEO Audit & AI Hub</span>
            </button>
            <button
              onClick={() => setActiveTab('pages')}
              className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                activeTab === 'pages' ? 'bg-[#9B111E] text-white shadow-xs' : 'text-stone-400 hover:text-white hover:bg-stone-800/60'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Store Routes ({auditMetrics.totalPages})</span>
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                activeTab === 'products' ? 'bg-[#9B111E] text-white shadow-xs' : 'text-stone-400 hover:text-white hover:bg-stone-800/60'
              }`}
            >
              <Tag className="w-4 h-4" />
              <span>Product Catalog ({auditMetrics.totalProducts})</span>
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                activeTab === 'categories' ? 'bg-[#9B111E] text-white shadow-xs' : 'text-stone-400 hover:text-white hover:bg-stone-800/60'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Category SEO ({computedCategories.length})</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('improvements');
                if (!analysisResult) {
                  handleAnalyzeImprovements();
                }
              }}
              className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                activeTab === 'improvements' ? 'bg-[#9B111E] text-white shadow-xs' : 'text-amber-400 border border-amber-500/20 bg-amber-500/5 hover:text-amber-300 hover:bg-amber-500/10'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>AI Improvements Audit</span>
            </button>
            <button
              onClick={() => setActiveTab('technical')}
              className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                activeTab === 'technical' ? 'bg-[#9B111E] text-white shadow-xs' : 'text-stone-400 hover:text-white hover:bg-stone-800/60'
              }`}
            >
              <Code2 className="w-4 h-4" />
              <span>Sitemap & Schema</span>
            </button>
          </div>
        </div>

        {/* TAB 1: SEO AUDIT & AI HUB */}
        {activeTab === 'audit' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between text-stone-500 text-xs font-bold uppercase tracking-wider">
                  <span>Indexed Routes</span>
                  <Globe className="w-4 h-4 text-[#9B111E]" />
                </div>
                <p className="text-2xl font-black text-stone-900">{auditMetrics.totalItems}</p>
                <p className="text-[11px] text-stone-500">{auditMetrics.totalPages} Pages + {auditMetrics.totalProducts} Products + {auditMetrics.totalCategories} Categories</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between text-stone-500 text-xs font-bold uppercase tracking-wider">
                  <span>Optimal Titles</span>
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                </div>
                <p className="text-2xl font-black text-stone-900">{auditMetrics.optimalTitles}</p>
                <p className="text-[11px] text-stone-500">Strict 50 to 60 characters for SERP fit</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between text-stone-500 text-xs font-bold uppercase tracking-wider">
                  <span>Optimal Descriptions</span>
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                </div>
                <p className="text-2xl font-black text-stone-900">{auditMetrics.optimalDescs}</p>
                <p className="text-[11px] text-stone-500">Strict 140 to 160 characters snippet fit</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between text-stone-500 text-xs font-bold uppercase tracking-wider">
                  <span>Missing Keywords</span>
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                </div>
                <p className="text-2xl font-black text-stone-900">{auditMetrics.missingKeywords}</p>
                <p className="text-[11px] text-stone-500">Entries missing explicit focus keywords</p>
              </div>
            </div>

            {/* AI Batch Actions */}
            <div className="bg-stone-900 text-white p-6 rounded-2xl border border-stone-800 shadow-md space-y-4">
              <div className="flex items-center gap-2 text-amber-400">
                <Zap className="w-5 h-5" />
                <h3 className="font-bold text-sm uppercase tracking-wider">1-Click AI SEO Auto-Optimizers</h3>
              </div>
              <p className="text-xs text-stone-300 max-w-3xl leading-relaxed">
                Run Gemini 3.1 Flash Lite across your catalog to calculate exact character counts, inject localized Jalgaon keywords (e.g. Khandeshi Masala, Crispy Banana Chips), and build high-converting meta snippets.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={() => handleRunBulkAiOptimizer('pages')}
                  disabled={isBulkOptimizing}
                  className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs rounded-xl inline-flex items-center gap-2 shadow-sm transition-all disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Optimize All Store Routes</span>
                </button>
                <button
                  onClick={() => handleRunBulkAiOptimizer('products')}
                  disabled={isBulkOptimizing}
                  className="px-4 py-2.5 bg-stone-800 hover:bg-stone-700 text-white font-bold text-xs rounded-xl border border-stone-700 inline-flex items-center gap-2 shadow-sm transition-all disabled:opacity-50"
                >
                  <Tag className="w-4 h-4 text-amber-400" />
                  <span>Optimize All Catalog Products</span>
                </button>
                <button
                  onClick={() => handleRunBulkAiOptimizer('categories')}
                  disabled={isBulkOptimizing}
                  className="px-4 py-2.5 bg-rose-900 hover:bg-rose-950 text-white font-bold text-xs rounded-xl border border-rose-800 inline-flex items-center gap-2 shadow-sm transition-all disabled:opacity-50"
                >
                  <Layers className="w-4 h-4 text-amber-400" />
                  <span>Optimize All Categories</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: STORE ROUTES SEO */}
        {activeTab === 'pages' && (
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-stone-50/50">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#9B111E]" />
                <h3 className="font-bold text-xs text-stone-950 uppercase tracking-wider">Store Route Meta Attributes</h3>
              </div>
              <Badge variant="saffron" size="sm">MySQL: seo_metadata</Badge>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 text-stone-500 font-bold uppercase text-[9px] tracking-wider border-b border-stone-200">
                  <tr>
                    <th className="p-4 w-10">
                      <input
                        type="checkbox"
                        checked={isAllTabItemsSelected()}
                        onChange={toggleSelectAllTabItems}
                        className="rounded border-stone-300 text-[#9B111E] focus:ring-[#9B111E] w-4 h-4 cursor-pointer"
                      />
                    </th>
                    <th className="p-4">Route Page</th>
                    <th className="p-4">Google Title Tag (50-60 chars)</th>
                    <th className="p-4">Snippet Description (140-160 chars)</th>
                    <th className="p-4 text-center">Health</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-medium text-stone-700">
                  {pageSeoList.map((page) => {
                    const titleLen = page.seoTitle ? page.seoTitle.length : 0;
                    const descLen = page.seoDescription ? page.seoDescription.length : 0;
                    const isTitleOk = titleLen >= 50 && titleLen <= 60;
                    const isDescOk = descLen >= 140 && descLen <= 160;
                    const isPerfect = isTitleOk && isDescOk;
                    const isSel = isItemSelected('page', page.pageKey);

                    return (
                      <tr key={page.id} className={`hover:bg-stone-50/60 transition-colors ${isSel ? 'bg-amber-50/10' : ''}`}>
                        <td className="p-4 w-10">
                          <input
                            type="checkbox"
                            checked={isSel}
                            onChange={() => toggleSelectItem('page', page.pageKey)}
                            className="rounded border-stone-300 text-[#9B111E] focus:ring-[#9B111E] w-4 h-4 cursor-pointer"
                          />
                        </td>
                        <td className="p-4">
                          <div className="font-bold text-stone-900 text-sm">{page.pageName}</div>
                          <div className="text-[10px] font-mono text-[#9B111E]">key: /{page.pageKey}</div>
                        </td>
                        <td className="p-4 max-w-xs">
                          <p className="font-semibold text-stone-950 line-clamp-1">{page.seoTitle}</p>
                          <span className={`inline-block mt-1 px-1.5 py-0.5 text-[9px] font-extrabold rounded border ${getTitleGaugeColor(titleLen)}`}>
                            {titleLen} chars {isTitleOk ? '✓ Optimal' : titleLen < 50 ? '(Too Short)' : '(Too Long)'}
                          </span>
                        </td>
                        <td className="p-4 max-w-sm">
                          <p className="text-stone-600 line-clamp-2 text-[11px] leading-relaxed">{page.seoDescription}</p>
                          <span className={`inline-block mt-1 px-1.5 py-0.5 text-[9px] font-extrabold rounded border ${getDescGaugeColor(descLen)}`}>
                            {descLen} chars {isDescOk ? '✓ Optimal' : descLen < 140 ? '(Too Short)' : '(Too Long)'}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          {isPerfect ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                              <Check className="w-3 h-3 text-emerald-600" /> Great
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 text-[10px] font-bold border border-amber-200">
                              Adjust
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleOpenPageSeoModal(page)}
                            className="px-3 py-1.5 rounded-lg border border-stone-200 hover:bg-stone-100 text-stone-800 text-xs font-bold inline-flex items-center gap-1 transition-all shadow-2xs"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-stone-500" />
                            <span>Edit SEO</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: PRODUCT CATALOG SEO */}
        {activeTab === 'products' && (
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-stone-200 flex flex-wrap items-center justify-between gap-3 bg-stone-50/50">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-[#9B111E]" />
                <h3 className="font-bold text-xs text-stone-950 uppercase tracking-wider">Catalog Product Meta Tags</h3>
              </div>

              <div className="relative min-w-[260px]">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter catalog items..."
                  className="w-full pl-9 pr-3 py-1.5 bg-white border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#9B111E]"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 text-stone-500 font-bold uppercase text-[9px] tracking-wider border-b border-stone-200">
                  <tr>
                    <th className="p-4 w-10">
                      <input
                        type="checkbox"
                        checked={isAllTabItemsSelected()}
                        onChange={toggleSelectAllTabItems}
                        className="rounded border-stone-300 text-[#9B111E] focus:ring-[#9B111E] w-4 h-4 cursor-pointer"
                      />
                    </th>
                    <th className="p-4">Product Name</th>
                    <th className="p-4">Meta Title Tag</th>
                    <th className="p-4">Meta Description</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-medium text-stone-700">
                  {filteredProducts.map((p) => {
                    const title = p.seoTitle || p.name;
                    const desc = p.seoDescription || p.shortDescription || p.description || '';
                    const titleLen = title.length;
                    const descLen = desc.length;
                    const isSel = isItemSelected('product', p.id);

                    return (
                      <tr key={p.id} className={`hover:bg-stone-50/60 transition-colors ${isSel ? 'bg-amber-50/10' : ''}`}>
                        <td className="p-4 w-10">
                          <input
                            type="checkbox"
                            checked={isSel}
                            onChange={() => toggleSelectItem('product', p.id)}
                            className="rounded border-stone-300 text-[#9B111E] focus:ring-[#9B111E] w-4 h-4 cursor-pointer"
                          />
                        </td>
                        <td className="p-4">
                          <div className="font-bold text-stone-900 text-sm line-clamp-1">{p.name}</div>
                          <div className="text-[10px] text-stone-400">/product/{p.slug}</div>
                        </td>
                        <td className="p-4 max-w-xs">
                          <p className="font-semibold text-stone-950 line-clamp-1">{title}</p>
                          <span className={`inline-block mt-1 px-1.5 py-0.5 text-[9px] font-extrabold rounded border ${getTitleGaugeColor(titleLen)}`}>
                            {titleLen} chars
                          </span>
                        </td>
                        <td className="p-4 max-w-sm">
                          <p className="text-stone-600 line-clamp-2 text-[11px] leading-relaxed">{desc}</p>
                          <span className={`inline-block mt-1 px-1.5 py-0.5 text-[9px] font-extrabold rounded border ${getDescGaugeColor(descLen)}`}>
                            {descLen} chars
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleOpenProductSeoModal(p)}
                            className="px-3 py-1.5 rounded-lg border border-stone-200 hover:bg-stone-100 text-stone-800 text-xs font-bold inline-flex items-center gap-1 transition-all shadow-2xs"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-stone-500" />
                            <span>Edit SEO</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: CATEGORY SEO */}
        {activeTab === 'categories' && (
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-bold text-sm text-stone-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#9B111E]" />
                <span>Category & Collection Meta Attributes</span>
              </h3>
              <button
                onClick={toggleSelectAllTabItems}
                className="text-xs font-bold text-[#9B111E] hover:underline"
              >
                {isAllTabItemsSelected() ? 'Unselect All Categories' : 'Select All Categories'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {computedCategories.map((c) => {
                const isSel = isItemSelected('category', c.slug);
                const existingSeo = pageSeoList.find((p) => p.pageKey === `category-${c.slug}`);
                const title = existingSeo?.seoTitle || `Buy Fresh ${c.name} Online | Aapla Jalgaonwala`;
                const desc = existingSeo?.seoDescription || `${c.name} freshly sourced from Jalgaon. Order high quality, authentic Khandeshi tastes online.`;
                const titleLen = title.length;
                const descLen = desc.length;

                return (
                  <div
                    key={c.id}
                    className={`p-5 border rounded-2xl transition-all space-y-3 cursor-pointer ${
                      isSel ? 'border-amber-400 bg-amber-50/5 shadow-xs' : 'border-stone-200 bg-stone-50/30 hover:border-stone-300'
                    }`}
                    onClick={() => toggleSelectItem('category', c.slug)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isSel}
                          onChange={(e) => {
                            e.stopPropagation();
                            toggleSelectItem('category', c.slug);
                          }}
                          className="rounded border-stone-300 text-[#9B111E] focus:ring-[#9B111E] w-4 h-4 cursor-pointer"
                        />
                        <div>
                          <span className="font-bold text-stone-900 text-sm">{c.name}</span>
                          <span className="text-[10px] text-stone-400 font-mono block">slug: {c.slug}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <Badge variant="emerald" size="sm">{c.count} items</Badge>
                        <button
                          onClick={() => handleOpenCategorySeoModal(c)}
                          className="p-1.5 border border-stone-200 hover:bg-white rounded-lg text-stone-700 transition-colors shadow-2xs"
                          title="Edit Category SEO"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-1 bg-white p-3 rounded-xl border border-stone-150 text-xs text-stone-700">
                      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Search Snippet Preview</p>
                      <h4 className="font-bold text-blue-700 truncate">{title}</h4>
                      <p className="text-emerald-700 font-mono text-[10px]">https://aaplajalgaonwala.com/categories#{c.slug}</p>
                      <p className="text-stone-500 line-clamp-2 leading-relaxed text-[11px]">{desc}</p>
                      <div className="flex items-center gap-2 pt-1 border-t border-stone-100 mt-1 text-[10px]">
                        <span className={`inline-block px-1.5 py-0.5 font-bold rounded border ${getTitleGaugeColor(titleLen)}`}>
                          Title: {titleLen} chars
                        </span>
                        <span className={`inline-block px-1.5 py-0.5 font-bold rounded border ${getDescGaugeColor(descLen)}`}>
                          Desc: {descLen} chars
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 5: TECHNICAL SEO, SITEMAP & SCHEMA */}
        {activeTab === 'technical' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Sitemap.xml Box */}
              <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Code2 className="w-5 h-5 text-[#9B111E]" />
                    <h3 className="font-bold text-sm text-stone-900">Dynamic XML Sitemap</h3>
                  </div>
                  <Badge variant="emerald" size="sm">Active</Badge>
                </div>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Automatically updated with all store page routes and catalog products to help Googlebot index new items immediately.
                </p>
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between text-xs font-mono">
                  <span className="text-stone-800 truncate">https://aaplajalgaonwala.com/sitemap.xml</span>
                  <a
                    href="/sitemap.xml"
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 hover:bg-stone-200 rounded-lg text-stone-700 font-sans font-bold flex items-center gap-1 text-[11px]"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-[#9B111E]" /> View XML
                  </a>
                </div>
              </div>

              {/* Robots.txt Box */}
              <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-[#9B111E]" />
                    <h3 className="font-bold text-sm text-stone-900">Robots Directives</h3>
                  </div>
                  <Badge variant="emerald" size="sm">Active</Badge>
                </div>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Controls search crawler access to protect checkout & admin endpoints while encouraging public indexation.
                </p>
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between text-xs font-mono">
                  <span className="text-stone-800 truncate">https://aaplajalgaonwala.com/robots.txt</span>
                  <a
                    href="/robots.txt"
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 hover:bg-stone-200 rounded-lg text-stone-700 font-sans font-bold flex items-center gap-1 text-[11px]"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-[#9B111E]" /> View File
                  </a>
                </div>
              </div>
            </div>

            {/* JSON-LD Structured Data Schema */}
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
              <h3 className="font-bold text-sm text-stone-900 flex items-center gap-2 border-b border-stone-100 pb-3">
                <Globe className="w-4 h-4 text-[#9B111E]" />
                <span>JSON-LD Rich Snippet Schema Preview (Google Search)</span>
              </h3>
              <pre className="p-4 bg-stone-900 text-amber-300 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed">
{`{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "Aapla Jalgaonwala",
  "image": "https://images.unsplash.com/photo-1599490659213-e2b9527bd087",
  "url": "https://aaplajalgaonwala.com",
  "telephone": "+91 9876543210",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Yelwadi, Dehu",
    "addressLocality": "Pune",
    "addressRegion": "Maharashtra",
    "postalCode": "412109",
    "addressCountry": "IN"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.9",
    "reviewCount": "1280"
  }
}`}
              </pre>
            </div>
          </div>
        )}

        {/* TAB 6: AI COMPREHENSIVE IMPROVEMENTS AUDIT */}
        {activeTab === 'improvements' && (
          <div className="space-y-6">
            {/* Header & Quick Action */}
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="font-bold text-sm text-stone-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
                  <span>Comprehensive SEO Performance Audit & Improvements</span>
                </h3>
                <p className="text-xs text-stone-500">
                  Runs an advanced deep-scan audit using Gemini 3.7 Flash across your entire store's pages, categories, and products to detect CTR risks, title truncations, and keyword gaps.
                </p>
              </div>
              <button
                onClick={handleAnalyzeImprovements}
                disabled={isAnalyzingImprovements}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-stone-950 font-extrabold text-xs rounded-xl inline-flex items-center gap-2 shadow-sm transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isAnalyzingImprovements ? 'animate-spin' : ''}`} />
                <span>{isAnalyzingImprovements ? 'Analyzing SEO State...' : 'Rerun Comprehensive AI Audit'}</span>
              </button>
            </div>

            {/* Loading State */}
            {isAnalyzingImprovements && (
              <div className="bg-white p-12 rounded-2xl border border-stone-200 shadow-xs text-center space-y-4">
                <div className="inline-flex p-3 bg-amber-100 rounded-full text-amber-600 animate-bounce">
                  <Sparkles className="w-8 h-8 animate-spin" />
                </div>
                <h3 className="font-extrabold text-stone-950 text-sm">Auditing Your Store's Complete SEO Infrastructure...</h3>
                <p className="text-xs text-stone-500 max-w-md mx-auto leading-relaxed">
                  Gemini 3.7 Flash is analyzing your metadata lengths, keyword alignment, duplicate indexations, and crafting tailored recommendations. Please wait a moment.
                </p>
              </div>
            )}

            {/* Empty State */}
            {!analysisResult && !isAnalyzingImprovements && (
              <div className="bg-white p-12 rounded-2xl border border-stone-200 shadow-xs text-center space-y-4">
                <div className="inline-flex p-4 bg-stone-100 rounded-full text-stone-400">
                  <BarChart3 className="w-10 h-10" />
                </div>
                <h3 className="font-extrabold text-stone-950 text-sm">No SEO Analysis Cache Found</h3>
                <p className="text-xs text-stone-500 max-w-sm mx-auto">
                  Click the button below to trigger the AI SEO Audit and reveal comprehensive improvements for your store.
                </p>
                <button
                  onClick={handleAnalyzeImprovements}
                  className="px-5 py-2.5 bg-[#9B111E] hover:bg-[#800d18] text-white font-black text-xs rounded-xl transition-all inline-flex items-center gap-2 shadow-md"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Show Improvements</span>
                </button>
              </div>
            )}

            {/* Analysis Results */}
            {analysisResult && !isAnalyzingImprovements && (
              <div className="space-y-6 animate-in fade-in duration-500">
                {/* Executive Score & Metric Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Health Score Gauge */}
                  <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs flex flex-col justify-between space-y-4">
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">SEO Health Score</p>
                      <h4 className="text-xs text-stone-500 font-bold leading-tight">Calculated across route metadata & snippet densities.</h4>
                    </div>
                    <div className="flex items-center gap-4 py-2">
                      <div className="text-5xl font-black text-[#9B111E]">
                        {analysisResult.healthScore}%
                      </div>
                      <div className="space-y-1">
                        <span className={`inline-flex px-2 py-0.5 text-[10px] font-bold rounded-full ${
                          analysisResult.healthScore >= 90 ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                          analysisResult.healthScore >= 75 ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                          'bg-rose-50 text-rose-700 border border-rose-100'
                        }`}>
                          {analysisResult.healthScore >= 90 ? 'Excellent' : analysisResult.healthScore >= 75 ? 'Needs Polish' : 'Critical Gaps'}
                        </span>
                        <p className="text-[10px] text-stone-400 font-medium">Goal: 95%+ rank target</p>
                      </div>
                    </div>
                  </div>

                  {/* Issues Overview */}
                  <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs flex flex-col justify-between space-y-4">
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">Audit Alert Gaps</p>
                      <h4 className="text-xs text-stone-500 font-bold leading-tight">Identified non-standard title/description tags.</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-4 py-2">
                      <div className="space-y-1">
                        <p className="text-3xl font-black text-rose-600">{analysisResult.criticalIssuesCount}</p>
                        <p className="text-[10px] text-stone-500 font-bold">Critical Errors</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-3xl font-black text-amber-500">{analysisResult.warningsCount}</p>
                        <p className="text-[10px] text-stone-500 font-bold">Warnings</p>
                      </div>
                    </div>
                  </div>

                  {/* Executive Summary */}
                  <div className="bg-stone-900 text-stone-100 p-6 rounded-2xl border border-stone-800 shadow-xs flex flex-col justify-between space-y-2">
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase font-bold text-amber-400 tracking-widest">Executive Audit Summary</p>
                      <p className="text-xs text-stone-300 leading-relaxed italic pt-1">
                        "{analysisResult.executiveSummary}"
                      </p>
                    </div>
                    <p className="text-[10px] text-stone-500 font-mono">Verified standard compliance: v3.7</p>
                  </div>
                </div>

                {/* Strategy Action Plan & Identified Improvements */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column: Strategic Action Plan */}
                  <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4 h-fit">
                    <h3 className="font-bold text-sm text-stone-900 flex items-center gap-2 border-b border-stone-100 pb-3">
                      <TrendingUp className="w-4 h-4 text-[#9B111E]" />
                      <span>Top 5 Strategic Actions</span>
                    </h3>
                    <div className="space-y-4">
                      {analysisResult.strategicActionPlan && analysisResult.strategicActionPlan.map((action: string, idx: number) => (
                        <div key={idx} className="flex gap-3">
                          <div className="flex-shrink-0 w-5 h-5 bg-stone-100 text-[#9B111E] rounded-full flex items-center justify-center text-[10px] font-black">
                            {idx + 1}
                          </div>
                          <p className="text-xs text-stone-700 leading-relaxed font-medium">
                            {action}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right Column (Span 2): Improvements & Recommended Fixes */}
                  <div className="lg:col-span-2 space-y-4">
                    <h3 className="font-bold text-sm text-stone-900 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-[#9B111E]" />
                      <span>Identified Gaps & AI Fix Recommendations</span>
                    </h3>

                    <div className="space-y-4">
                      {analysisResult.improvements && analysisResult.improvements.map((item: any, idx: number) => {
                        const isApplied = item.applied;
                        return (
                          <div key={idx} className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-4 hover:border-stone-300 transition-all">
                            {/* Card Header */}
                            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-3">
                              <div className="flex items-center gap-2">
                                <Badge variant={item.type === 'product' ? 'purple' : item.type === 'category' ? 'emerald' : 'blue'} size="sm">
                                  {item.type.toUpperCase()}
                                </Badge>
                                <span className="font-black text-stone-900 text-sm">{item.name}</span>
                                <span className="text-[10px] text-stone-400 font-mono">id: {item.id}</span>
                              </div>
                              <span className={`inline-flex px-2 py-0.5 text-[9px] font-bold rounded-full ${
                                item.impact === 'High' ? 'bg-rose-50 text-rose-700 border border-rose-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
                              }`}>
                                {item.impact} Impact
                              </span>
                            </div>

                            {/* Issue Alert */}
                            <div className="p-3 bg-rose-50/50 rounded-xl border border-rose-100/50 flex items-start gap-2.5 text-xs text-stone-700">
                              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                              <p className="leading-relaxed font-medium text-rose-950">
                                <strong className="font-black">Detected Issue:</strong> {item.issue}
                              </p>
                            </div>

                            {/* Side-by-Side Comparison */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                              {/* Current State */}
                              <div className="bg-stone-50 p-4 rounded-xl border border-stone-150 space-y-2 opacity-80">
                                <p className="text-[9px] uppercase font-bold text-stone-400 tracking-wider">Current Metadata</p>
                                <div className="space-y-1.5">
                                  <p className="font-bold text-stone-700 truncate line-clamp-1">{item.currentTitle || '—'}</p>
                                  <p className="text-[10px] font-bold text-stone-400">Length: {item.currentTitle?.length || 0} chars</p>
                                </div>
                                <div className="space-y-1.5 pt-2 border-t border-stone-100">
                                  <p className="text-stone-500 line-clamp-2 leading-relaxed text-[11px]">{item.currentDescription || '—'}</p>
                                  <p className="text-[10px] font-bold text-stone-400">Length: {item.currentDescription?.length || 0} chars</p>
                                </div>
                              </div>

                              {/* AI Recommended State */}
                              <div className="bg-amber-50/10 p-4 rounded-xl border border-amber-200/50 space-y-2 relative">
                                <div className="absolute right-3 top-3">
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[8px] font-bold">
                                    <Sparkles className="w-2.5 h-2.5 text-amber-600" /> Optimal Fit
                                  </span>
                                </div>
                                <p className="text-[9px] uppercase font-bold text-amber-600 tracking-wider">AI Recommended Fix</p>
                                <div className="space-y-1.5">
                                  <p className="font-bold text-blue-700 truncate line-clamp-1">{item.recommendedTitle}</p>
                                  <p className="text-[10px] font-bold text-emerald-600">Length: {item.recommendedTitle.length} chars (Optimal)</p>
                                </div>
                                <div className="space-y-1.5 pt-2 border-t border-stone-100">
                                  <p className="text-stone-700 line-clamp-2 leading-relaxed text-[11px]">{item.recommendedDescription}</p>
                                  <p className="text-[10px] font-bold text-emerald-600">Length: {item.recommendedDescription.length} chars (Optimal)</p>
                                </div>
                              </div>
                            </div>

                            {/* Actions bar */}
                            <div className="flex items-center justify-end gap-2 pt-2">
                              {isApplied ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-black">
                                  <Check className="w-4 h-4 text-emerald-600" />
                                  <span>Applied Successfully!</span>
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleApplyAIRecommendation(item)}
                                  className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white font-extrabold text-xs rounded-xl inline-flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                                >
                                  <Check className="w-3.5 h-3.5 text-amber-400" />
                                  <span>Apply Fix Instantly</span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Floating Selected Bulk Action Bar */}
        {selectedItems.length > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-stone-900 border border-stone-800 text-white px-5 py-4 rounded-2xl shadow-2xl flex flex-wrap items-center gap-6 animate-in slide-in-from-bottom-4 duration-300 max-w-2xl w-full justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-[#9B111E] text-white p-2 rounded-xl text-xs font-black">
                {selectedItems.length}
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-black">Items Selected for Optimization</p>
                <p className="text-[10px] text-stone-400 font-bold">
                  {selectedItems.filter(i => i.type === 'page').length} Pages • {selectedItems.filter(i => i.type === 'product').length} Products • {selectedItems.filter(i => i.type === 'category').length} Categories
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedItems([])}
                className="px-3.5 py-2 hover:bg-stone-800 text-stone-300 rounded-xl text-xs font-bold transition-all"
              >
                Clear Selection
              </button>
              <button
                onClick={() => handleRunBulkAiOptimizer('all', selectedItems)}
                disabled={isBulkOptimizing}
                className="px-4 py-2 bg-[#9B111E] hover:bg-[#800d18] active:scale-95 text-white rounded-xl text-xs font-black inline-flex items-center gap-2 shadow-md transition-all disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                <span>Optimize Selected ({selectedItems.length})</span>
              </button>
            </div>
          </div>
        )}

        {/* Page SEO Modal */}
        {editingPageSeo && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl p-6 max-w-xl w-full shadow-2xl border border-stone-200 space-y-5 my-8">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-[#9B111E]" />
                  <h3 className="font-bold text-sm text-stone-900">
                    Edit SEO: {editingPageSeo.pageName}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingPageSeo(null)}
                  className="p-1 rounded-lg text-stone-400 hover:text-stone-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* AI Auto-Optimizer Bar */}
              <div className="p-4 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent rounded-xl border border-amber-500/30 flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <p className="text-xs font-extrabold text-stone-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>Gemini 3.1 Flash Lite Optimizer</span>
                  </p>
                  <p className="text-[11px] text-stone-600">Auto-calculate exact 50-60 title & 140-160 description chars.</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleGenerateAiForPage(editingPageSeo.pageName, editingPageSeo.pageKey, pageSeoForm.title, pageSeoForm.description)}
                  disabled={isGeneratingAi}
                  className="px-3.5 py-2 bg-[#9B111E] hover:bg-[#800d18] text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isGeneratingAi ? 'animate-spin' : ''}`} />
                  <span>{isGeneratingAi ? 'Generating...' : '✨ Auto-Generate'}</span>
                </button>
              </div>

              {/* Gemini Insights Box if available */}
              {lastAiResult && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1.5 text-xs text-emerald-900">
                  <p className="font-bold flex items-center gap-1.5 text-emerald-800">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>Gemini 3.1 Flash Lite Strategy Insights (Score: {lastAiResult.seoScore}/100)</span>
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-[11px] text-emerald-800">
                    {lastAiResult.improvementNotes.map((note, idx) => (
                      <li key={idx}>{note}</li>
                    ))}
                  </ul>
                </div>
              )}

              <form onSubmit={handleSavePageSeo} className="space-y-4 text-xs">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-stone-800 uppercase tracking-wider text-[10px]">
                      Google Meta Title Tag (50-60 chars optimal)
                    </label>
                    <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded border ${getTitleGaugeColor(pageSeoForm.title.length)}`}>
                      {pageSeoForm.title.length} characters
                    </span>
                  </div>
                  <input
                    type="text"
                    required
                    value={pageSeoForm.title}
                    onChange={(e) => setPageSeoForm({ ...pageSeoForm, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#9B111E] font-medium"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-stone-800 uppercase tracking-wider text-[10px]">
                      Google Meta Description (140-160 chars optimal)
                    </label>
                    <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded border ${getDescGaugeColor(pageSeoForm.description.length)}`}>
                      {pageSeoForm.description.length} characters
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    required
                    value={pageSeoForm.description}
                    onChange={(e) => setPageSeoForm({ ...pageSeoForm, description: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#9B111E] font-medium leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-800 uppercase tracking-wider text-[10px] mb-1">
                    Target Focus Keywords (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={pageSeoForm.keywords}
                    onChange={(e) => setPageSeoForm({ ...pageSeoForm, keywords: e.target.value })}
                    placeholder="e.g. Jalgaon banana chips, farsan, kitchen masalas, buy online"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#9B111E]"
                  />
                </div>

                {/* Google Search SERP Snippet Preview */}
                <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold text-stone-500 uppercase tracking-wider flex items-center gap-1">
                      <Search className="w-3.5 h-3.5 text-[#9B111E]" /> Google Search Snippet Preview
                    </span>
                    <div className="flex items-center bg-stone-200/80 p-0.5 rounded-lg text-[10px] font-bold">
                      <button
                        type="button"
                        onClick={() => setSerpDevice('desktop')}
                        className={`px-2 py-0.5 rounded-md ${serpDevice === 'desktop' ? 'bg-white shadow-2xs text-stone-900' : 'text-stone-600'}`}
                      >
                        Desktop
                      </button>
                      <button
                        type="button"
                        onClick={() => setSerpDevice('mobile')}
                        className={`px-2 py-0.5 rounded-md ${serpDevice === 'mobile' ? 'bg-white shadow-2xs text-stone-900' : 'text-stone-600'}`}
                      >
                        Mobile
                      </button>
                    </div>
                  </div>

                  <div className={`p-3 bg-white rounded-lg border border-stone-200 space-y-1 shadow-2xs ${serpDevice === 'mobile' ? 'max-w-xs' : ''}`}>
                    <p className="text-blue-700 text-sm font-semibold hover:underline truncate cursor-pointer">
                      {pageSeoForm.title || 'Page Title'}
                    </p>
                    <p className="text-emerald-700 text-[11px] font-mono">
                      https://aaplajalgaonwala.com{editingPageSeo.pageKey === 'home' ? '' : `/${editingPageSeo.pageKey}`}
                    </p>
                    <p className="text-stone-600 text-xs line-clamp-2 leading-relaxed">
                      {pageSeoForm.description || 'Snippet description will appear here in Google Search results.'}
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => setEditingPageSeo(null)}
                    className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingPageSeo}
                    className="px-4 py-2 bg-[#9B111E] hover:bg-[#800d18] text-white rounded-xl font-bold flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSavingPageSeo ? 'Saving...' : 'Save Meta Tags'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Product SEO Modal */}
        {editingProductSeo && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl p-6 max-w-xl w-full shadow-2xl border border-stone-200 space-y-5 my-8">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div className="flex items-center gap-2">
                  <Tag className="w-5 h-5 text-[#9B111E]" />
                  <h3 className="font-bold text-sm text-stone-900">
                    Edit Product SEO: {editingProductSeo.name}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingProductSeo(null)}
                  className="p-1 rounded-lg text-stone-400 hover:text-stone-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* AI Auto-Optimizer Bar */}
              <div className="p-4 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent rounded-xl border border-amber-500/30 flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <p className="text-xs font-extrabold text-stone-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>Gemini 3.1 Flash Lite Product Optimizer</span>
                  </p>
                  <p className="text-[11px] text-stone-600">Auto-craft high-ranking title & meta tags.</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleGenerateAiForProduct(editingProductSeo)}
                  disabled={isGeneratingAi}
                  className="px-3.5 py-2 bg-[#9B111E] hover:bg-[#800d18] text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isGeneratingAi ? 'animate-spin' : ''}`} />
                  <span>{isGeneratingAi ? 'Optimizing...' : '✨ Auto-Optimize'}</span>
                </button>
              </div>

              {/* Gemini Insights Box if available */}
              {lastAiResult && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1.5 text-xs text-emerald-900">
                  <p className="font-bold flex items-center gap-1.5 text-emerald-800">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>Gemini 3.1 Flash Lite Strategy Insights (Score: {lastAiResult.seoScore}/100)</span>
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-[11px] text-emerald-800">
                    {lastAiResult.improvementNotes.map((note, idx) => (
                      <li key={idx}>{note}</li>
                    ))}
                  </ul>
                </div>
              )}

              <form onSubmit={handleSaveProductSeo} className="space-y-4 text-xs">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-stone-800 uppercase tracking-wider text-[10px]">
                      Product Title Tag (50-60 chars optimal)
                    </label>
                    <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded border ${getTitleGaugeColor(productSeoForm.seoTitle.length)}`}>
                      {productSeoForm.seoTitle.length} characters
                    </span>
                  </div>
                  <input
                    type="text"
                    required
                    value={productSeoForm.seoTitle}
                    onChange={(e) => setProductSeoForm({ ...productSeoForm, seoTitle: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#9B111E] font-medium"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-stone-800 uppercase tracking-wider text-[10px]">
                      Product Meta Description (140-160 chars optimal)
                    </label>
                    <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded border ${getDescGaugeColor(productSeoForm.seoDescription.length)}`}>
                      {productSeoForm.seoDescription.length} characters
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    required
                    value={productSeoForm.seoDescription}
                    onChange={(e) => setProductSeoForm({ ...productSeoForm, seoDescription: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#9B111E] font-medium leading-relaxed"
                  />
                </div>

                <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
                  <span className="text-[10px] font-extrabold text-stone-500 uppercase tracking-wider">Product SERP Snippet Preview</span>
                  <div className="p-3 bg-white rounded-lg border border-stone-200 space-y-1 shadow-2xs">
                    <p className="text-blue-700 text-sm font-semibold truncate hover:underline cursor-pointer">
                      {productSeoForm.seoTitle || editingProductSeo.name}
                    </p>
                    <p className="text-emerald-700 text-[11px] font-mono">
                      https://aaplajalgaonwala.com/product/{editingProductSeo.slug}
                    </p>
                    <p className="text-stone-600 text-xs line-clamp-2 leading-relaxed">
                      {productSeoForm.seoDescription || editingProductSeo.description}
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => setEditingProductSeo(null)}
                    className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingProductSeo}
                    className="px-4 py-2 bg-[#9B111E] hover:bg-[#800d18] text-white rounded-xl font-bold flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSavingProductSeo ? 'Updating...' : 'Save Product SEO'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Category SEO Modal */}
        {editingCategorySeo && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl p-6 max-w-xl w-full shadow-2xl border border-stone-200 space-y-5 my-8">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-[#9B111E]" />
                  <h3 className="font-bold text-sm text-stone-900">
                    Edit Category SEO: {editingCategorySeo.name}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingCategorySeo(null)}
                  className="p-1 rounded-lg text-stone-400 hover:text-stone-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* AI Auto-Optimizer Bar */}
              <div className="p-4 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent rounded-xl border border-amber-500/30 flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <p className="text-xs font-extrabold text-stone-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>Gemini 3.1 Flash Lite Category Optimizer</span>
                  </p>
                  <p className="text-[11px] text-stone-600">Auto-craft high-ranking titles & meta tags.</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleGenerateAiForCategory(editingCategorySeo)}
                  disabled={isGeneratingAi}
                  className="px-3.5 py-2 bg-[#9B111E] hover:bg-[#800d18] text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isGeneratingAi ? 'animate-spin' : ''}`} />
                  <span>{isGeneratingAi ? 'Optimizing...' : '✨ Auto-Optimize'}</span>
                </button>
              </div>

              {/* Gemini Insights Box if available */}
              {lastAiResult && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1.5 text-xs text-emerald-900">
                  <p className="font-bold flex items-center gap-1.5 text-emerald-800">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>Gemini 3.1 Flash Lite Strategy Insights (Score: {lastAiResult.seoScore}/100)</span>
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-[11px] text-emerald-800">
                    {lastAiResult.improvementNotes.map((note, idx) => (
                      <li key={idx}>{note}</li>
                    ))}
                  </ul>
                </div>
              )}

              <form onSubmit={handleSaveCategorySeo} className="space-y-4 text-xs">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-stone-800 uppercase tracking-wider text-[10px]">
                      Category Title Tag (50-60 chars optimal)
                    </label>
                    <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded border ${getTitleGaugeColor(categorySeoForm.title.length)}`}>
                      {categorySeoForm.title.length} characters
                    </span>
                  </div>
                  <input
                    type="text"
                    required
                    value={categorySeoForm.title}
                    onChange={(e) => setCategorySeoForm({ ...categorySeoForm, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#9B111E] font-medium"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-stone-800 uppercase tracking-wider text-[10px]">
                      Category Meta Description (140-160 chars optimal)
                    </label>
                    <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded border ${getDescGaugeColor(categorySeoForm.description.length)}`}>
                      {categorySeoForm.description.length} characters
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    required
                    value={categorySeoForm.description}
                    onChange={(e) => setCategorySeoForm({ ...categorySeoForm, description: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#9B111E] font-medium leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-800 uppercase tracking-wider text-[10px] mb-1">
                    Target Focus Keywords (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={categorySeoForm.keywords}
                    onChange={(e) => setCategorySeoForm({ ...categorySeoForm, keywords: e.target.value })}
                    placeholder="e.g. banana chips, healthy snacks, crisp namkeen"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#9B111E]"
                  />
                </div>

                <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
                  <span className="text-[10px] font-extrabold text-stone-500 uppercase tracking-wider">Category SERP Snippet Preview</span>
                  <div className="p-3 bg-white rounded-lg border border-stone-200 space-y-1 shadow-2xs">
                    <p className="text-blue-700 text-sm font-semibold truncate hover:underline cursor-pointer">
                      {categorySeoForm.title}
                    </p>
                    <p className="text-emerald-700 text-[11px] font-mono">
                      https://aaplajalgaonwala.com/categories#{editingCategorySeo.slug}
                    </p>
                    <p className="text-stone-600 text-xs line-clamp-2 leading-relaxed">
                      {categorySeoForm.description}
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => setEditingCategorySeo(null)}
                    className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingCategorySeo}
                    className="px-4 py-2 bg-[#9B111E] hover:bg-[#800d18] text-white rounded-xl font-bold flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSavingCategorySeo ? 'Updating...' : 'Save Category SEO'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
