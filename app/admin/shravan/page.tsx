'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Product } from '@/types';
import { initialProducts } from '@/data/products';
import {
  Sparkles,
  Search,
  CheckCircle2,
  Filter,
  Package,
  Layers,
  ArrowRight,
  RefreshCw,
  Check,
  X,
  ExternalLink,
  Tag,
  AlertCircle,
  Percent,
  SlidersHorizontal,
  Flame,
  Wheat,
  LayoutGrid,
  List,
  ShieldCheck,
  CheckSquare,
  Square,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function AdminShravanCuratorPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [shravanStatusFilter, setShravanStatusFilter] = useState<'all' | 'in-shravan' | 'not-in-shravan'>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'curator' | 'live-shravan'>('curator');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Bulk Discount Modal
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [bulkDiscountVal, setBulkDiscountVal] = useState<number>(10);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchProducts = useCallback(async (showLoadingState = false) => {
    if (showLoadingState) setIsLoading(true);
    try {
      const res = await fetch('/api/products');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setProducts(json.data);
      } else {
        setProducts(initialProducts);
      }
    } catch (err) {
      console.warn('Failed to load products, using initial fallback', err);
      setProducts(initialProducts);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const res = await fetch('/api/products');
        const json = await res.json();
        if (isMounted) {
          if (json.success && Array.isArray(json.data)) {
            setProducts(json.data);
          } else {
            setProducts(initialProducts);
          }
        }
      } catch (err) {
        if (isMounted) setProducts(initialProducts);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  // Helper: check if a product is considered part of Shravan/Upwas
  const isShravanProduct = (p: Product) => {
    const cat = (p.category || '').toLowerCase();
    const catId = (p.categoryId || '').toLowerCase();
    const isCat = cat === 'shravan-special' || cat === 'shravan' || cat === 'upwas-special' || catId === 'shravan-special' || catId === 'shravan' || catId === 'upwas-special';
    const hasTag = Array.isArray(p.tags) && p.tags.some(t => /shravan|upwas|farali|fasting|sendha/i.test(t));
    const hasName = /shravan|upwas|farali|sendha/i.test(p.name);
    return isCat || hasTag || hasName;
  };

  // Distinct existing categories for filter pills
  const categoriesList = useMemo(() => {
    const cats = new Set<string>();
    products.forEach(p => {
      if (p.category) cats.add(p.category);
    });
    return Array.from(cats);
  }, [products]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.flavour && p.flavour.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.tags && p.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())));

      const matchesCat =
        categoryFilter === 'all' ||
        p.category === categoryFilter ||
        p.categoryId === categoryFilter;

      const isShravan = isShravanProduct(p);
      const matchesStatus =
        shravanStatusFilter === 'all' ||
        (shravanStatusFilter === 'in-shravan' && isShravan) ||
        (shravanStatusFilter === 'not-in-shravan' && !isShravan);

      return matchesSearch && matchesCat && matchesStatus;
    });
  }, [products, searchQuery, categoryFilter, shravanStatusFilter]);

  // Current Shravan items
  const shravanProducts = useMemo(() => {
    return products.filter(p => isShravanProduct(p));
  }, [products]);

  // Selection handlers
  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const selectAllFiltered = () => {
    const ids = filteredProducts.map(p => p.id);
    setSelectedIds(Array.from(new Set([...selectedIds, ...ids])));
  };

  const deselectAll = () => {
    setSelectedIds([]);
  };

  const selectNonShravanOnly = () => {
    const ids = filteredProducts.filter(p => !isShravanProduct(p)).map(p => p.id);
    setSelectedIds(ids);
  };

  // Bulk Actions
  const handleBulkAddToShravan = async () => {
    if (selectedIds.length === 0) return;
    setIsSaving(true);
    try {
      // For each selected product, update its category to 'shravan-special' and append fasting tags
      const updates = {
        category: 'shravan-special',
        tags: ['Shravan Special', 'Upwas Special', 'Sendha Namak', 'Farali Snack', 'Satvik']
      };

      const res = await fetch('/api/admin/products/bulk', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: selectedIds,
          updates
        })
      });

      const json = await res.json();
      if (json.success) {
        showToast(`🎉 Added ${selectedIds.length} products to Shravan Special category!`);
        setSelectedIds([]);
        await fetchProducts();
      } else {
        showToast(`❌ Error updating products: ${json.error?.message || 'Failed'}`);
      }
    } catch (err) {
      console.error(err);
      showToast('❌ Server request failed');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBulkAddShravanTagOnly = async () => {
    if (selectedIds.length === 0) return;
    setIsSaving(true);
    try {
      let count = 0;
      for (const id of selectedIds) {
        const prod = products.find(p => p.id === id);
        if (prod) {
          const currentTags = prod.tags || [];
          const newTags = Array.from(new Set([...currentTags, 'Shravan Special', 'Upwas Farali', 'Sendha Namak']));
          await fetch(`/api/admin/products/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tags: newTags })
          });
          count++;
        }
      }
      showToast(`✨ Attached Shravan Fasting tags to ${count} products!`);
      setSelectedIds([]);
      await fetchProducts();
    } catch (err) {
      console.error(err);
      showToast('❌ Tag update failed');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBulkRemoveFromShravan = async () => {
    if (selectedIds.length === 0) return;
    setIsSaving(true);
    try {
      let count = 0;
      for (const id of selectedIds) {
        const prod = products.find(p => p.id === id);
        if (prod) {
          // If category was shravan-special or upwas-special, revert to banana-chips or potato-chips
          let newCat = prod.category;
          if (newCat === 'shravan-special' || newCat === 'shravan' || newCat === 'upwas-special') {
            newCat = prod.name.toLowerCase().includes('potato') ? 'potato-chips' : 'banana-chips';
          }
          const cleanTags = (prod.tags || []).filter(t => !/shravan|upwas|farali|sendha/i.test(t));

          await fetch(`/api/admin/products/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              category: newCat,
              tags: cleanTags.length > 0 ? cleanTags : ['Fresh', 'Jalgaon']
            })
          });
          count++;
        }
      }
      showToast(`Removed ${count} products from Shravan category`);
      setSelectedIds([]);
      await fetchProducts();
    } catch (err) {
      console.error(err);
      showToast('❌ Removal failed');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSingleToggleShravan = async (product: Product) => {
    const isCurrentlyShravan = isShravanProduct(product);
    setIsSaving(true);
    try {
      if (isCurrentlyShravan) {
        let newCat = product.category;
        if (newCat === 'shravan-special' || newCat === 'shravan' || newCat === 'upwas-special') {
          newCat = product.name.toLowerCase().includes('potato') ? 'potato-chips' : 'banana-chips';
        }
        const cleanTags = (product.tags || []).filter(t => !/shravan|upwas|farali|sendha/i.test(t));
        await fetch(`/api/admin/products/${product.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            category: newCat,
            tags: cleanTags.length > 0 ? cleanTags : ['Fresh', 'Jalgaon']
          })
        });
        showToast(`Removed "${product.name}" from Shravan`);
      } else {
        const currentTags = product.tags || [];
        const newTags = Array.from(new Set([...currentTags, 'Shravan Special', 'Upwas Special', 'Sendha Namak']));
        await fetch(`/api/admin/products/${product.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            category: 'shravan-special',
            tags: newTags
          })
        });
        showToast(`🎉 Added "${product.name}" into Shravan Special!`);
      }
      await fetchProducts();
    } catch (err) {
      console.error(err);
      showToast('❌ Update failed');
    } finally {
      setIsSaving(false);
    }
  };

  const applyBulkDiscount = async () => {
    if (selectedIds.length === 0) return;
    setIsSaving(true);
    try {
      let count = 0;
      for (const id of selectedIds) {
        const prod = products.find(p => p.id === id);
        if (prod) {
          const mrp = prod.mrp || prod.price;
          const discountedPrice = Math.round(mrp * (1 - bulkDiscountVal / 100));
          await fetch(`/api/admin/products/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              price: discountedPrice,
              mrp: mrp,
              discount: bulkDiscountVal
            })
          });
          count++;
        }
      }
      showToast(`Applied ${bulkDiscountVal}% festive discount to ${count} products!`);
      setIsDiscountModalOpen(false);
      setSelectedIds([]);
      await fetchProducts();
    } catch (err) {
      console.error(err);
      showToast('❌ Discount update failed');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AdminLayout
      pageTitle="Shravan Special Curator"
      breadcrumbs={[
        { label: 'Products', href: '/admin/products' },
        { label: 'Shravan Special Curator' }
      ]}
      actions={
        <div className="flex items-center gap-2">
          <Link
            href="/upwas-special"
            target="_blank"
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            <span>View Upwas Storefront</span>
            <ExternalLink className="w-3.5 h-3.5 text-stone-400" />
          </Link>
          <button
            onClick={() => fetchProducts(true)}
            disabled={isLoading}
            className="p-2 rounded-xl bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 text-xs font-bold transition-colors cursor-pointer"
            title="Refresh Products"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#9B111E]' : ''}`} />
          </button>
        </div>
      }
    >
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-5 right-5 z-50 bg-stone-950 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-bold border border-stone-800"
          >
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-6">
        {/* HERO BANNER & STATS */}
        <div className="relative bg-gradient-to-r from-[#9B111E] via-[#800A14] to-[#60050D] rounded-3xl p-6 sm:p-8 text-white overflow-hidden shadow-sm">
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-[11px] font-black uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Festive & Fasting Category Curator</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                Bulk Add Products to Shravan Category
              </h2>
              <p className="text-xs sm:text-sm text-stone-200 font-medium leading-relaxed">
                Select any products from your catalog (banana chips, potato wafers, farali snacks) to immediately curate and publish them into the Holy Shravan & Upwas fasting showcase.
              </p>
            </div>

            {/* Quick Stat Counter Cards */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/15 text-center min-w-[100px]">
                <div className="text-2xl font-black text-amber-300">{products.length}</div>
                <div className="text-[10px] uppercase font-bold text-stone-300 tracking-wider">Total Catalog</div>
              </div>
              <div className="bg-amber-400/20 backdrop-blur-md px-4 py-3 rounded-2xl border border-amber-300/30 text-center min-w-[110px]">
                <div className="text-2xl font-black text-white">{shravanProducts.length}</div>
                <div className="text-[10px] uppercase font-black text-amber-300 tracking-wider">In Shravan</div>
              </div>
              {selectedIds.length > 0 && (
                <div className="bg-emerald-500/30 backdrop-blur-md px-4 py-3 rounded-2xl border border-emerald-400/40 text-center min-w-[100px]">
                  <div className="text-2xl font-black text-emerald-200">{selectedIds.length}</div>
                  <div className="text-[10px] uppercase font-black text-emerald-100 tracking-wider">Selected</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* TOP CONTROLS & TABS */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-stone-200 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Tab selection */}
            <div className="flex items-center gap-1.5 p-1 bg-stone-100 rounded-2xl w-fit">
              <button
                type="button"
                onClick={() => setActiveTab('curator')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                  activeTab === 'curator'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-[#9B111E]" />
                <span>Multi-Product Curator</span>
                <span className="px-1.5 py-0.5 rounded-full bg-stone-200 text-stone-700 text-[10px]">
                  {products.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('live-shravan')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                  activeTab === 'live-shravan'
                    ? 'bg-white text-[#9B111E] shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Active Shravan Products</span>
                <span className="px-1.5 py-0.5 rounded-full bg-[#9B111E] text-white text-[10px]">
                  {shravanProducts.length}
                </span>
              </button>
            </div>

            {/* View Switcher & Selection Counter */}
            <div className="flex items-center gap-2.5">
              <div className="flex items-center p-1 bg-stone-100 rounded-xl border border-stone-200">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg transition-colors ${
                    viewMode === 'grid' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-400 hover:text-stone-700'
                  }`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-lg transition-colors ${
                    viewMode === 'table' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-400 hover:text-stone-700'
                  }`}
                  title="List View"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Search and Filters Bar */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2 border-t border-stone-100">
            {/* Search */}
            <div className="md:col-span-5 relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search products by title, flavour, or tag..."
                className="w-full pl-9 pr-8 py-2.5 bg-stone-50 border border-stone-200 rounded-2xl text-xs font-bold text-stone-900 placeholder:text-stone-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#9B111E]/20 focus:border-[#9B111E]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Category Filter */}
            <div className="md:col-span-4 flex items-center gap-2">
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-2xl text-xs font-bold text-stone-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#9B111E]/20"
              >
                <option value="all">All Source Categories ({products.length})</option>
                {categoriesList.map(cat => (
                  <option key={cat} value={cat}>
                    Category: {cat.replace(/-/g, ' ').toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="md:col-span-3 flex items-center gap-2">
              <select
                value={shravanStatusFilter}
                onChange={e => setShravanStatusFilter(e.target.value as any)}
                className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-2xl text-xs font-bold text-stone-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#9B111E]/20"
              >
                <option value="all">Status: All Products</option>
                <option value="not-in-shravan">⚡ Not in Shravan Yet</option>
                <option value="in-shravan">✨ Already in Shravan ({shravanProducts.length})</option>
              </select>
            </div>
          </div>

          {/* Quick Select Tool Helpers */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-xs font-bold text-stone-600">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] text-stone-400 font-semibold">Select:</span>
              <button
                type="button"
                onClick={selectAllFiltered}
                className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-[11px] font-bold transition-colors"
              >
                Select All Filtered ({filteredProducts.length})
              </button>
              <button
                type="button"
                onClick={selectNonShravanOnly}
                className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-[11px] font-bold transition-colors"
              >
                Select Only Non-Shravan
              </button>
              {selectedIds.length > 0 && (
                <button
                  type="button"
                  onClick={deselectAll}
                  className="px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-[11px] font-bold transition-colors"
                >
                  Clear Selection ({selectedIds.length})
                </button>
              )}
            </div>

            <div className="text-[11px] text-stone-500 font-medium">
              Showing <strong className="text-stone-900 font-bold">{filteredProducts.length}</strong> of {products.length} products
            </div>
          </div>
        </div>

        {/* FLOATING / STICKY BULK ACTION BAR */}
        <AnimatePresence>
          {selectedIds.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="sticky top-4 z-30 bg-stone-900 text-white rounded-3xl p-4 sm:p-5 shadow-2xl border border-stone-700 flex flex-col md:flex-row items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-amber-400 text-stone-950 font-black flex items-center justify-center text-sm shrink-0">
                  {selectedIds.length}
                </div>
                <div>
                  <h4 className="text-sm font-black text-white">
                    {selectedIds.length} {selectedIds.length === 1 ? 'Product' : 'Products'} Selected
                  </h4>
                  <p className="text-[11px] text-stone-300 font-medium">
                    Apply category migration, fasting tags, or festive pricing in 1-click.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleBulkAddToShravan}
                  className="flex-1 md:flex-none px-4 py-2.5 bg-[#9B111E] hover:bg-[#800A14] text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-amber-300" />}
                  <span>Add to Shravan Category</span>
                </button>

                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleBulkAddShravanTagOnly}
                  className="flex-1 md:flex-none px-3.5 py-2.5 bg-stone-800 hover:bg-stone-700 text-amber-300 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 border border-stone-600 transition-colors cursor-pointer disabled:opacity-50"
                  title="Keeps main category but adds Shravan & Upwas tags"
                >
                  <Tag className="w-3.5 h-3.5" />
                  <span>Attach Fasting Tags Only</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsDiscountModalOpen(true)}
                  className="px-3 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border border-stone-600 transition-colors"
                >
                  <Percent className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Set % Discount</span>
                </button>

                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleBulkRemoveFromShravan}
                  className="px-3 py-2.5 bg-red-950/80 hover:bg-red-900 text-red-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border border-red-800 transition-colors cursor-pointer disabled:opacity-50"
                  title="Remove from Shravan collection"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>

                <button
                  type="button"
                  onClick={deselectAll}
                  className="p-2.5 text-stone-400 hover:text-white rounded-xl hover:bg-stone-800 transition-colors"
                  title="Deselect all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* PRODUCTS CONTENT VIEW */}
        {isLoading ? (
          <div className="bg-white rounded-3xl p-16 border border-stone-200 text-center space-y-4">
            <RefreshCw className="w-8 h-8 text-[#9B111E] animate-spin mx-auto" />
            <p className="text-sm font-bold text-stone-600">Loading catalog items for curation...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 border border-stone-200 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
              <Package className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-black text-stone-900">No products match your filters</h3>
              <p className="text-xs text-stone-500 font-medium max-w-sm mx-auto">
                Try clearing your search query or selecting a different source category.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setCategoryFilter('all');
                setShravanStatusFilter('all');
              }}
              className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold"
            >
              Reset Filters
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          /* GRID VIEW */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map(prod => {
              const isSelected = selectedIds.includes(prod.id);
              const inShravan = isShravanProduct(prod);
              const primaryImg = prod.images?.[0]?.url || 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=400&q=80';

              return (
                <div
                  key={prod.id}
                  onClick={() => toggleSelect(prod.id)}
                  className={`
                    relative bg-white rounded-3xl border transition-all duration-200 flex flex-col justify-between overflow-hidden cursor-pointer select-none
                    ${
                      isSelected
                        ? 'border-[#9B111E] ring-2 ring-[#9B111E] shadow-md bg-[#9B111E]/5'
                        : inShravan
                        ? 'border-amber-300 shadow-2xs hover:border-amber-400'
                        : 'border-stone-200 shadow-2xs hover:border-stone-300 hover:shadow-sm'
                    }
                  `}
                >
                  {/* Card Header & Image */}
                  <div>
                    <div className="relative h-44 w-full bg-stone-100 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={primaryImg}
                        alt={prod.name}
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                      />

                      {/* Selection Checkbox Pill */}
                      <div className="absolute top-3 left-3 z-10">
                        <div
                          className={`
                            w-7 h-7 rounded-xl flex items-center justify-center transition-all shadow-md
                            ${
                              isSelected
                                ? 'bg-[#9B111E] text-white ring-2 ring-white'
                                : 'bg-white/90 backdrop-blur-xs text-stone-400 hover:text-stone-700'
                            }
                          `}
                        >
                          {isSelected ? <Check className="w-4 h-4 stroke-[3]" /> : <Square className="w-4 h-4" />}
                        </div>
                      </div>

                      {/* Status Badges */}
                      <div className="absolute top-3 right-3 flex flex-col items-end gap-1">
                        {inShravan ? (
                          <span className="px-2.5 py-1 bg-amber-400 text-stone-950 text-[10px] font-black rounded-full shadow-md flex items-center gap-1 uppercase tracking-wider">
                            <Sparkles className="w-3 h-3 text-stone-900" />
                            <span>In Shravan</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-stone-900/70 backdrop-blur-xs text-white text-[10px] font-bold rounded-full">
                            Regular
                          </span>
                        )}
                        <span className="px-2 py-0.5 bg-white/90 backdrop-blur-xs text-stone-800 text-[10px] font-bold rounded-md capitalize shadow-2xs">
                          {prod.category?.replace(/-/g, ' ')}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 space-y-2">
                      <h4 className="text-sm font-black text-stone-900 line-clamp-1 leading-snug">
                        {prod.name}
                      </h4>
                      {prod.flavour && (
                        <p className="text-[11px] font-bold text-[#9B111E] line-clamp-1">
                          {prod.flavour}
                        </p>
                      )}

                      {/* Tags */}
                      {prod.tags && prod.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {prod.tags.slice(0, 3).map((t, idx) => (
                            <span
                              key={idx}
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                                /shravan|upwas|sendha/i.test(t)
                                  ? 'bg-amber-100 text-amber-900 font-extrabold'
                                  : 'bg-stone-100 text-stone-600'
                              }`}
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="p-4 pt-2 border-t border-stone-100 flex items-center justify-between gap-2">
                    <div>
                      <div className="text-xs font-black text-stone-900">
                        ₹{prod.price}
                        {prod.mrp && prod.mrp > prod.price && (
                          <span className="text-[10px] text-stone-400 line-through font-normal ml-1">
                            ₹{prod.mrp}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-stone-500 font-medium">{prod.netQuantity || '100g'}</span>
                    </div>

                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSingleToggleShravan(prod);
                      }}
                      className={`
                        px-2.5 py-1.5 rounded-xl text-[10px] font-black transition-all flex items-center gap-1 cursor-pointer
                        ${
                          inShravan
                            ? 'bg-amber-100 hover:bg-amber-200 text-amber-900'
                            : 'bg-[#9B111E]/10 hover:bg-[#9B111E] text-[#9B111E] hover:text-white'
                        }
                      `}
                    >
                      {inShravan ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-amber-700" />
                          <span>In Shravan</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3 h-3" />
                          <span>Add to Shravan</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* TABLE VIEW */
          <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 text-[11px] font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-4 w-12 text-center">
                      <button
                        type="button"
                        onClick={selectedIds.length === filteredProducts.length ? deselectAll : selectAllFiltered}
                        className="text-stone-500 hover:text-stone-900"
                      >
                        {selectedIds.length === filteredProducts.length && filteredProducts.length > 0 ? (
                          <CheckSquare className="w-4 h-4 text-[#9B111E]" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th className="p-4">Product Details</th>
                    <th className="p-4">Source Category</th>
                    <th className="p-4">Shravan Status</th>
                    <th className="p-4">Price / MRP</th>
                    <th className="p-4">Stock</th>
                    <th className="p-4 text-right">Quick Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredProducts.map(prod => {
                    const isSelected = selectedIds.includes(prod.id);
                    const inShravan = isShravanProduct(prod);
                    const primaryImg = prod.images?.[0]?.url || 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=150&q=80';

                    return (
                      <tr
                        key={prod.id}
                        onClick={() => toggleSelect(prod.id)}
                        className={`hover:bg-stone-50/80 transition-colors cursor-pointer ${
                          isSelected ? 'bg-[#9B111E]/5' : ''
                        }`}
                      >
                        <td className="p-4 text-center" onClick={e => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => toggleSelect(prod.id)}
                            className="text-stone-400 hover:text-stone-800"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-[#9B111E]" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>
                        </td>

                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-stone-100 overflow-hidden shrink-0 border border-stone-200">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={primaryImg} alt={prod.name} className="w-full h-full object-cover" />
                            </div>
                            <div>
                              <h4 className="font-bold text-stone-900">{prod.name}</h4>
                              <p className="text-[11px] text-stone-500 font-medium">{prod.flavour || prod.netQuantity}</p>
                            </div>
                          </div>
                        </td>

                        <td className="p-4">
                          <span className="px-2.5 py-1 bg-stone-100 text-stone-700 rounded-lg font-bold text-[11px] capitalize">
                            {prod.category?.replace(/-/g, ' ')}
                          </span>
                        </td>

                        <td className="p-4">
                          {inShravan ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 font-black text-[10px] uppercase tracking-wider">
                              <Sparkles className="w-3 h-3 text-amber-700" />
                              <span>In Shravan Special</span>
                            </span>
                          ) : (
                            <span className="text-stone-400 font-medium text-[11px]">Regular Catalog</span>
                          )}
                        </td>

                        <td className="p-4 font-bold text-stone-900">
                          ₹{prod.price}{' '}
                          {prod.mrp && prod.mrp > prod.price && (
                            <span className="text-[10px] text-stone-400 line-through ml-1 font-normal">
                              ₹{prod.mrp}
                            </span>
                          )}
                        </td>

                        <td className="p-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                              (prod.stock || 0) > 10 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            {prod.stock || 0} in stock
                          </span>
                        </td>

                        <td className="p-4 text-right" onClick={e => e.stopPropagation()}>
                          <button
                            type="button"
                            disabled={isSaving}
                            onClick={() => handleSingleToggleShravan(prod)}
                            className={`
                              px-3 py-1.5 rounded-xl text-xs font-black transition-all inline-flex items-center gap-1.5 cursor-pointer
                              ${
                                inShravan
                                  ? 'bg-amber-100 hover:bg-amber-200 text-amber-900'
                                  : 'bg-[#9B111E] hover:bg-[#800A14] text-white'
                              }
                            `}
                          >
                            {inShravan ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>In Shravan</span>
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                                <span>Add to Shravan</span>
                              </>
                            )}
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

        {/* BULK DISCOUNT MODAL */}
        {isDiscountModalOpen && (
          <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-stone-200 shadow-2xl space-y-5">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div className="flex items-center gap-2">
                  <Percent className="w-5 h-5 text-[#9B111E]" />
                  <h3 className="text-base font-black text-stone-900">Set Festive Discount %</h3>
                </div>
                <button onClick={() => setIsDiscountModalOpen(false)} className="text-stone-400 font-bold text-sm">
                  ✕
                </button>
              </div>

              <div className="space-y-4 text-xs font-bold text-stone-800">
                <p className="text-stone-600 font-medium">
                  Apply a bulk festive discount % across all <strong>{selectedIds.length} selected products</strong>. MRP will be preserved and price recalculated.
                </p>

                <div>
                  <label className="block mb-1.5 text-stone-700">Festive Discount Percentage (%)</label>
                  <div className="flex items-center gap-2">
                    {[5, 10, 15, 20, 25].map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setBulkDiscountVal(val)}
                        className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${
                          bulkDiscountVal === val
                            ? 'bg-[#9B111E] text-white shadow-xs'
                            : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                        }`}
                      >
                        {val}%
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    min="1"
                    max="90"
                    value={bulkDiscountVal}
                    onChange={e => setBulkDiscountVal(Number(e.target.value))}
                    className="w-full mt-3 px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl font-bold text-stone-900"
                    placeholder="Custom % (e.g. 12)"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => setIsDiscountModalOpen(false)}
                    className="px-4 py-2 bg-stone-100 text-stone-700 rounded-xl text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={applyBulkDiscount}
                    className="px-5 py-2 bg-[#9B111E] text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md"
                  >
                    {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    <span>Apply {bulkDiscountVal}% Discount</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
