'use client';

import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Product } from '@/types';
import {
  Sparkles,
  Tag,
  Search,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Plus,
  Edit2,
  Flame,
  ShieldCheck,
  Star,
  ShoppingBag,
  ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdminShravanPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'shravan_only'>('shravan_only');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/products');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setProducts(json.data);
      }
    } catch (err) {
      console.error('Failed to load products for Shravan curator:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const isShravanItem = (p: Product) => {
    return (
      p.category === 'shravan-special' ||
      p.category === 'upwas-special' ||
      p.categoryId === 'shravan-special' ||
      p.categoryId === 'upwas-special' ||
      (p.tags && p.tags.some((t: string) => /shravan|upwas|farali|sendha/i.test(t))) ||
      /shravan|upwas|farali|sendha|sabudana|rajgira/i.test(p.name)
    );
  };

  const toggleShravanTag = async (product: Product) => {
    setUpdatingId(product.id);
    const hasTag = isShravanItem(product);
    let newTags = [...(product.tags || [])];

    if (hasTag) {
      newTags = newTags.filter((t) => !/shravan|upwas|farali|sendha/i.test(t));
    } else {
      if (!newTags.includes('shravan-special')) newTags.push('shravan-special');
      if (!newTags.includes('upwas')) newTags.push('upwas');
    }

    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...product,
          tags: newTags
        })
      });

      const json = await res.json();
      if (json.success) {
        showToast(hasTag ? `Removed '${product.name}' from Shravan Special` : `Added '${product.name}' to Shravan Special`);
        fetchProducts();
      } else {
        alert('Failed to update product tag.');
      }
    } catch (err) {
      console.error('Error toggling Shravan tag:', err);
      alert('Network error while updating tag.');
    } finally {
      setUpdatingId(null);
    }
  };

  const shravanProducts = products.filter(isShravanItem);
  const displayProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    if (filterMode === 'shravan_only') {
      return matchesSearch && isShravanItem(p);
    }
    return matchesSearch;
  });

  return (
    <AdminLayout
      pageTitle="Shravan & Upwas Special Curator"
      breadcrumbs={[
        { label: 'Admin', href: '/admin' },
        { label: 'Shravan Curator' }
      ]}
      actions={
        <Link
          to="/upwas-special"
          target="_blank"
          className="inline-flex items-center gap-2 px-4 py-2 bg-stone-900 text-amber-300 font-bold text-xs rounded-xl shadow-xs hover:bg-stone-800 transition-all"
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>View Public Upwas Page</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      }
    >
      <div className="space-y-8 max-w-6xl">
        {/* Banner */}
        <div className="p-6 bg-gradient-to-r from-amber-950 via-stone-900 to-amber-950 text-white rounded-3xl border border-amber-800/40 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Fasting Delicacies Curator</span>
            </div>
            <h2 className="text-xl font-black">Shravan & Upwas Delicacies Manager</h2>
            <p className="text-xs text-amber-100/80 leading-relaxed">
              Curate products for holy Shravan month, Ekadashi, Navratri, and Mahashivratri fasts. Items tagged here automatically feature on the dedicated <strong className="text-amber-300">/upwas-special</strong> page.
            </p>
          </div>

          <div className="bg-stone-900/90 p-4 rounded-2xl border border-amber-500/30 shrink-0 text-center min-w-[180px]">
            <div className="text-[10px] text-amber-400 uppercase font-bold tracking-wider">Curated Fasting Items</div>
            <div className="text-2xl font-black text-amber-300 mt-1">{shravanProducts.length} Products</div>
            <div className="text-[10px] text-stone-400 mt-0.5">100% Pure Sendha Namak</div>
          </div>
        </div>

        {toastMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-bold flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Filters and Search Bar */}
        <div className="bg-white p-4 rounded-3xl border border-stone-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search fasting snacks, banana chips, sabudana chivda..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-2xl border border-stone-200 text-xs font-medium text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#9B111E]"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => setFilterMode('shravan_only')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterMode === 'shravan_only'
                  ? 'bg-[#9B111E] text-amber-300 shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              Curated Shravan Items ({shravanProducts.length})
            </button>
            <button
              onClick={() => setFilterMode('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterMode === 'all'
                  ? 'bg-[#9B111E] text-amber-300 shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              All Store Catalog ({products.length})
            </button>
          </div>
        </div>

        {/* Product Cards Grid */}
        {isLoading ? (
          <div className="py-20 text-center">
            <RefreshCw className="w-8 h-8 text-[#9B111E] animate-spin mx-auto mb-3" />
            <p className="text-xs font-bold text-stone-500">Loading catalog items...</p>
          </div>
        ) : displayProducts.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-3xl border border-stone-200 space-y-3">
            <Sparkles className="w-10 h-10 text-stone-300 mx-auto" />
            <h3 className="font-bold text-sm text-stone-800">No items found</h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              {filterMode === 'shravan_only'
                ? 'No products are currently tagged for Shravan Special. Switch to "All Store Catalog" above to tag products!'
                : 'No products match your search keyword.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayProducts.map((p) => {
              const isCurated = isShravanItem(p);
              const isUpdating = updatingId === p.id;

              return (
                <div
                  key={p.id}
                  className={`bg-white rounded-3xl border p-5 space-y-4 transition-all relative overflow-hidden flex flex-col justify-between ${
                    isCurated ? 'border-amber-400 ring-2 ring-amber-400/20 shadow-md' : 'border-stone-200 shadow-xs hover:border-stone-300'
                  }`}
                >
                  {isCurated && (
                    <div className="absolute top-0 right-0 bg-amber-400 text-amber-950 px-3 py-1 rounded-bl-2xl text-[10px] font-black tracking-wider uppercase flex items-center gap-1 shadow-xs">
                      <Sparkles className="w-3 h-3" />
                      <span>Shravan Special</span>
                    </div>
                  )}

                  <div className="flex gap-4 items-start">
                    <div className="w-20 h-20 rounded-2xl bg-stone-100 overflow-hidden border border-stone-200 shrink-0">
                      {p.image ? (
                        <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-stone-300">
                          <ShoppingBag className="w-8 h-8" />
                        </div>
                      )}
                    </div>

                    <div className="space-y-1 min-w-0 flex-1">
                      <h4 className="font-bold text-xs text-stone-900 leading-snug line-clamp-2">{p.name}</h4>
                      <p className="text-[11px] text-stone-500 capitalize">{p.category || 'Uncategorized'}</p>
                      <div className="flex items-center gap-2 pt-1">
                        <span className="font-black text-sm text-[#9B111E]">₹{p.price}</span>
                        {p.mrp > p.price && (
                          <span className="text-xs text-stone-400 line-through">₹{p.mrp}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => toggleShravanTag(p)}
                      disabled={isUpdating}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                        isCurated
                          ? 'bg-amber-100 text-amber-900 hover:bg-amber-200 border border-amber-300'
                          : 'bg-stone-900 text-white hover:bg-stone-800'
                      }`}
                    >
                      {isUpdating ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : isCurated ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
                      ) : (
                        <Plus className="w-3.5 h-3.5 text-amber-400" />
                      )}
                      <span>{isCurated ? 'In Shravan Special' : 'Add to Shravan'}</span>
                    </button>

                    <Link
                      href={`/admin/products/${p.id}`}
                      className="p-2 text-stone-400 hover:text-stone-800 hover:bg-stone-100 rounded-xl transition-all"
                      title="Edit Product Details"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
