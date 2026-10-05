'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Product, Category } from '@/types';
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  Package,
  RefreshCw,
  AlertTriangle,
  Check,
  X,
  ExternalLink,
  Eye,
  Tag,
  Loader2,
  CheckSquare,
  Square,
  ChevronDown,
  Download,
  Sparkles,
  Layers,
  Sliders,
  Percent
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { AdminLayout } from '@/components/admin/AdminLayout';

export default function AllProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Deletion modal state
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Bulk selection and editing state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  // Field toggles to indicate which fields should be included in bulk edit
  const [bulkFields, setBulkFields] = useState({
    category: false,
    netQuantity: false,
    price: false,
    mrp: false,
    profit: false,
    stock: false,
    isFeatured: false,
    isBestSeller: false,
    isNew: false,
    isAvailable: false,
    flavour: false,
    tags: false,
    variants: false,
  });

  // Target values to apply in bulk edit
  const [bulkValues, setBulkValues] = useState({
    category: '',
    netQuantity: '',
    price: '',
    mrp: '',
    profit: '',
    stock: '',
    isFeatured: false,
    isBestSeller: false,
    isNew: false,
    isAvailable: true,
    flavour: '',
    tags: '',
  });

  // Bulk Variations State
  const [bulkVariantMode, setBulkVariantMode] = useState<'replace' | 'append' | 'update_by_weight' | 'adjust_prices' | 'remove_all'>('replace');
  const [bulkVariantsList, setBulkVariantsList] = useState<Array<{ weight: string; price: number; mrp: number; stock: number }>>([
    { weight: '200g', price: 70, mrp: 80, stock: 100 },
    { weight: '500g', price: 170, mrp: 195, stock: 100 },
    { weight: '1kg', price: 340, mrp: 390, stock: 100 },
  ]);
  const [bulkWeightRules, setBulkWeightRules] = useState<Array<{ targetWeight: string; price: number; mrp: number; stock: number; createIfMissing: boolean }>>([
    { targetWeight: '200g', price: 70, mrp: 80, stock: 100, createIfMissing: true },
    { targetWeight: '500g', price: 170, mrp: 195, stock: 100, createIfMissing: true },
    { targetWeight: '1kg', price: 340, mrp: 390, stock: 100, createIfMissing: true },
  ]);
  const [bulkPriceAdjustment, setBulkPriceAdjustment] = useState<{ type: 'percentage' | 'fixed_increase' | 'fixed_decrease'; value: number }>({
    type: 'percentage',
    value: 10
  });

  const handleSet3PacksPreset = () => {
    setBulkVariantsList([
      { weight: '200g', price: 70, mrp: 80, stock: 100 },
      { weight: '500g', price: 170, mrp: 195, stock: 100 },
      { weight: '1kg', price: 340, mrp: 390, stock: 100 },
    ]);
  };

  const handleSet4StandardPreset = () => {
    setBulkVariantsList([
      { weight: '100g', price: 35, mrp: 40, stock: 100 },
      { weight: '250g', price: 85, mrp: 100, stock: 100 },
      { weight: '500g', price: 170, mrp: 195, stock: 100 },
      { weight: '1kg', price: 340, mrp: 390, stock: 100 },
    ]);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleExportCSV = () => {
    if (products.length === 0) {
      alert('No products available to export.');
      return;
    }

    const headers = [
      'ID',
      'Name',
      'Slug',
      'Category',
      'Price (INR)',
      'MRP (INR)',
      'Stock',
      'Is Available',
      'Is Featured',
      'Is Best Seller',
      'Is New',
      'Flavour',
      'Tags',
      'Description'
    ];

    const escapeCsvCell = (val: any) => {
      if (val === null || val === undefined) return '';
      let str = String(val);
      if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
        str = `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows = products.map((p) => [
      p.id,
      p.name,
      p.slug,
      p.category,
      p.price,
      p.mrp,
      p.stock,
      p.isAvailable ? 'TRUE' : 'FALSE',
      p.isFeatured ? 'TRUE' : 'FALSE',
      p.isBestSeller ? 'TRUE' : 'FALSE',
      p.isNew ? 'TRUE' : 'FALSE',
      p.flavour || '',
      Array.isArray(p.tags) ? p.tags.join(', ') : '',
      p.description || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map(escapeCsvCell).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `aapla_jalgaonwala_products_${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Products catalog exported as CSV successfully.');
  };

  const fetchProducts = useCallback(async (showLoadingState = false) => {
    if (showLoadingState) setIsLoading(true);
    try {
      const res = await fetch('/api/admin/products');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setProducts(json.data);
      }
    } catch (err) {
      console.error('Error loading products:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/categories');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setCategories(json.data);
      }
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      try {
        const [pRes, cRes] = await Promise.all([
          fetch('/api/admin/products').then((r) => r.json()),
          fetch('/api/categories').then((r) => r.json())
        ]);
        if (!ignore) {
          if (pRes.success && Array.isArray(pRes.data)) {
            setProducts(pRes.data);
          }
          if (cRes.success && Array.isArray(cRes.data)) {
            setCategories(cRes.data);
          }
        }
      } catch (err) {
        console.error('Error loading products or categories:', err);
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };
    load();
    return () => {
      ignore = true;
    };
  }, []);

  const handleDeleteProduct = async () => {
    if (!deletingProductId) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/products/${deletingProductId}`, {
        method: 'DELETE'
      });
      const json = await res.json();
      if (json.success) {
        showToast('Product successfully deleted from catalog.');
        setProducts((prev) => prev.filter((p) => p.id !== deletingProductId));
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(deletingProductId);
          return next;
        });
        setDeletingProductId(null);
      } else {
        alert(json.error || 'Failed to delete product.');
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('Error connecting to server. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.flavour && p.flavour.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory =
        categoryFilter === 'all' ||
        p.category === categoryFilter ||
        p.categoryId === categoryFilter ||
        (p.categoryName && p.categoryName.toLowerCase().replace(/\s+/g, '-') === categoryFilter);
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, categoryFilter]);

  const handleBulkUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIds.size === 0) return;

    // Check if at least one field is selected for updating
    const selectedFieldsCount = Object.values(bulkFields).filter(Boolean).length;
    if (selectedFieldsCount === 0) {
      alert('Please check at least one checkbox on the left of the field inputs to bulk update.');
      return;
    }

    setIsBulkUpdating(true);
    try {
      const updates: any = {};
      if (bulkFields.category) {
        if (!bulkValues.category) {
          alert('Please select a category or uncheck the category checkbox.');
          setIsBulkUpdating(false);
          return;
        }
        const foundCat = categories.find(c => c.slug === bulkValues.category || c.id === bulkValues.category);
        updates.category = bulkValues.category;
        if (foundCat) {
          updates.categoryId = String(foundCat.id);
          updates.categoryName = foundCat.name;
        }
      }
      if (bulkFields.netQuantity) updates.netQuantity = bulkValues.netQuantity;
      if (bulkFields.price) updates.price = Number(bulkValues.price);
      if (bulkFields.mrp) updates.mrp = Number(bulkValues.mrp);
      if (bulkFields.profit) updates.profit = Number(bulkValues.profit);
      if (bulkFields.stock) updates.stock = Number(bulkValues.stock);
      if (bulkFields.isFeatured) updates.isFeatured = bulkValues.isFeatured;
      if (bulkFields.isBestSeller) updates.isBestSeller = bulkValues.isBestSeller;
      if (bulkFields.isNew) updates.isNew = bulkValues.isNew;
      if (bulkFields.isAvailable) updates.isAvailable = bulkValues.isAvailable;
      if (bulkFields.flavour) updates.flavour = bulkValues.flavour;
      if (bulkFields.tags) updates.tags = typeof bulkValues.tags === 'string' ? bulkValues.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : bulkValues.tags;
      if (bulkFields.variants) {
        if (bulkVariantMode === 'replace' || bulkVariantMode === 'append') {
          const validVariants = bulkVariantsList.filter(v => v.weight && !isNaN(Number(v.price)));
          if (validVariants.length === 0) {
            alert('Please specify at least one valid variation with a weight and price, or uncheck the Variations checkbox.');
            setIsBulkUpdating(false);
            return;
          }
          updates.variantConfig = {
            mode: bulkVariantMode,
            variants: validVariants.map((v, i) => ({
              id: `var-bulk-${Date.now()}-${i + 1}`,
              weight: v.weight.trim(),
              price: Number(v.price),
              mrp: Number(v.mrp || v.price),
              stock: Number(v.stock ?? 100)
            }))
          };
        } else if (bulkVariantMode === 'update_by_weight') {
          const validRules = bulkWeightRules.filter(r => r.targetWeight && !isNaN(Number(r.price)));
          if (validRules.length === 0) {
            alert('Please configure at least one weight rule with target weight and price.');
            setIsBulkUpdating(false);
            return;
          }
          updates.variantConfig = {
            mode: 'update_by_weight',
            weightRules: validRules.map(r => ({
              targetWeight: r.targetWeight.trim(),
              price: Number(r.price),
              mrp: Number(r.mrp || r.price),
              stock: Number(r.stock ?? 100),
              createIfMissing: Boolean(r.createIfMissing)
            }))
          };
        } else if (bulkVariantMode === 'adjust_prices') {
          updates.variantConfig = {
            mode: 'adjust_prices',
            priceAdjustment: {
              type: bulkPriceAdjustment.type,
              value: Number(bulkPriceAdjustment.value)
            }
          };
        } else if (bulkVariantMode === 'remove_all') {
          updates.variantConfig = {
            mode: 'remove_all'
          };
        }
      }

      const res = await fetch('/api/admin/products/bulk', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: Array.from(selectedIds),
          updates
        })
      });

      const json = await res.json();
      if (json.success) {
        showToast(`Successfully bulk-updated ${selectedIds.size} products.`);
        setIsBulkEditOpen(false);
        setSelectedIds(new Set());
        // Reset field toggles and values
        setBulkFields({
          category: false, netQuantity: false, price: false, mrp: false, stock: false,
          isFeatured: false, isBestSeller: false, isNew: false, isAvailable: false, flavour: false, tags: false, variants: false
        });
        setBulkValues({
          category: '', netQuantity: '', price: '', mrp: '', stock: '',
          isFeatured: false, isBestSeller: false, isNew: false, isAvailable: true, flavour: '', tags: ''
        });
        // Reload products from database
        fetchProducts();
      } else {
        const errMsg = typeof json.error === 'object' && json.error?.message
          ? json.error.message
          : (typeof json.error === 'string' ? json.error : (json.message || 'Failed to bulk update products.'));
        alert(errMsg);
      }
    } catch (err: any) {
      console.error('Bulk update error:', err);
      alert(err.message || 'Error updating products in bulk.');
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredProducts.map((p) => p.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (productId: string, checked: boolean) => {
    const nextSelected = new Set(selectedIds);
    if (checked) {
      nextSelected.add(productId);
    } else {
      nextSelected.delete(productId);
    }
    setSelectedIds(nextSelected);
  };

  return (
    <AdminLayout
      pageTitle="All Products"
      breadcrumbs={[
        { label: 'Products', href: '/admin/products' },
        { label: 'All Products' }
      ]}
      actions={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 border border-stone-200 text-stone-700 rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-stone-500" />
            <span>Export CSV</span>
          </button>
          <Link
            href="/admin/products/add"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#9B111E] hover:bg-[#800d18] text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add New Product</span>
          </Link>
        </div>
      }
    >
      <div className="space-y-4 pb-20">
        {/* Toast */}
        {toastMessage && (
          <div className="fixed top-5 right-5 z-50 bg-stone-900 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xl flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Filter Bar */}
        <div className="bg-white p-4 rounded-xl border border-[#e1e3e5] shadow-xs flex flex-col sm:flex-row gap-3 justify-between items-center">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter products by name or flavour..."
              className="w-full pl-9 pr-4 py-1.5 rounded-lg border border-stone-200 text-xs focus:outline-none focus:ring-1 focus:ring-[#9B111E]"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-stone-200 text-xs font-semibold bg-white text-stone-800 focus:outline-none focus:ring-1 focus:ring-[#9B111E]"
            >
              <option value="all">All Categories ({products.length})</option>
              {categories.map((c) => (
                <option key={c.id || c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>

            <button
              onClick={() => fetchProducts(true)}
              disabled={isLoading}
              className="p-1.5 rounded-lg border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 transition-colors"
              title="Refresh from Database"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#9B111E]' : ''}`} />
            </button>
          </div>
        </div>

        {/* Table Card */}
        <div className="bg-white rounded-xl border border-[#e1e3e5] shadow-xs overflow-hidden">
          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full min-w-[900px] text-left text-xs">
              <thead className="bg-stone-50 border-b border-[#e1e3e5] text-stone-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-4 w-12 text-center">
                    <input
                      type="checkbox"
                      checked={filteredProducts.length > 0 && selectedIds.size === filteredProducts.length}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-stone-300 text-[#9B111E] focus:ring-[#9B111E] w-4 h-4 cursor-pointer"
                    />
                  </th>
                  <th className="p-4">Product details</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Price</th>
                  <th className="p-4">Stock status</th>
                  <th className="p-4">Badges</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e1e3e5] font-medium text-stone-700">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-stone-500">
                      {isLoading ? (
                        <div className="flex items-center justify-center gap-2 font-semibold">
                          <div className="w-5 h-5 border-2 border-[#9B111E] border-t-transparent rounded-full animate-spin" />
                          <span>Loading products catalog...</span>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Package className="w-8 h-8 text-stone-300 mx-auto" />
                          <p className="font-bold text-stone-800">No products found</p>
                          <p className="text-xs text-stone-400">Try adjusting your search query or category filter</p>
                        </div>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => {
                    const imgUrl = p.images[0]?.url || 'https://picsum.photos/seed/jalgaon/200/200';
                    return (
                      <tr key={p.id} className="hover:bg-stone-50/50 transition-colors">
                        <td className="p-4 text-center">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(p.id)}
                            onChange={(e) => handleSelectOne(p.id, e.target.checked)}
                            className="rounded border-stone-300 text-[#9B111E] focus:ring-[#9B111E] w-4 h-4 cursor-pointer"
                          />
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-stone-50 shrink-0 border border-stone-200">
                              <Image src={imgUrl} alt={p.name} fill className="object-cover" referrerPolicy="no-referrer" />
                            </div>
                            <div>
                              <Link
                                href={`/product/${p.slug}`}
                                target="_blank"
                                className="font-bold text-stone-900 hover:text-[#9B111E] line-clamp-1 flex items-center gap-1 group"
                              >
                                <span>{p.name}</span>
                                <ExternalLink className="w-3 h-3 text-stone-300 group-hover:text-[#9B111E] opacity-0 group-hover:opacity-100 transition-opacity" />
                              </Link>
                              <p className="text-[10px] text-stone-400">
                                SKU: {p.id} • {p.netQuantity} {p.flavour ? `• ${p.flavour}` : ''}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded bg-stone-100 text-stone-600 font-semibold uppercase text-[9px] border border-stone-200">
                            {p.category.replace('-', ' ')}
                          </span>
                        </td>

                        <td className="p-4 font-bold">
                          <div className="text-stone-950">₹{p.price}</div>
                          {p.mrp > p.price && (
                            <div className="text-[10px] text-stone-400 line-through">₹{p.mrp}</div>
                          )}
                          <div className="text-[10px] text-emerald-700 font-extrabold mt-0.5">
                            Profit: ₹{p.profit ?? 0}/qty
                          </div>
                        </td>

                        <td className="p-4">
                          {p.isAvailable && p.stock > 0 ? (
                            <span className="text-emerald-700 font-semibold text-xs flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              {p.stock} units
                            </span>
                          ) : (
                            <span className="text-red-600 font-semibold text-xs flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                              Sold out
                            </span>
                          )}
                        </td>

                        <td className="p-4">
                          <div className="flex flex-wrap gap-1">
                            {p.isFeatured && <Badge variant="saffron" size="sm">Featured</Badge>}
                            {p.isBestSeller && <Badge variant="red" size="sm">Best</Badge>}
                            {p.isNew && <Badge variant="green" size="sm">New</Badge>}
                          </div>
                        </td>

                        <td className="p-4 text-right">
                          <div className="inline-flex items-center gap-1">
                            <Link
                              href={`/admin/products/${p.id}`}
                              className="p-1.5 hover:bg-stone-100 text-stone-600 hover:text-[#9B111E] rounded-lg transition-colors border border-transparent hover:border-stone-200"
                              title="Edit Product Details"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </Link>
                            <button
                              onClick={() => setDeletingProductId(p.id)}
                              className="p-1.5 hover:bg-red-50 text-stone-400 hover:text-red-600 rounded-lg transition-colors border border-transparent hover:border-red-100"
                              title="Delete Product"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Floating Bulk Action Bar */}
        {selectedIds.size > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-stone-900/95 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-stone-800 flex flex-col sm:flex-row items-center gap-3.5 max-w-4xl w-11/12 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex-1 text-center sm:text-left">
              <p className="text-xs font-black text-[#E6C687] flex items-center gap-2 justify-center sm:justify-start">
                <CheckSquare className="w-4 h-4 text-emerald-400" />
                <span>{selectedIds.size} Products Selected</span>
              </p>
              <p className="text-[10px] text-stone-400">Bulk edit pricing, variations, stock, categories, or badges</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => {
                  setBulkFields(prev => ({ ...prev, variants: true }));
                  setBulkVariantMode('replace');
                  handleSet3PacksPreset();
                  setIsBulkEditOpen(true);
                }}
                className="flex-1 sm:flex-none px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-stone-950 rounded-xl text-xs font-black transition-colors shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-stone-950" />
                <span>3-Pack Variations</span>
              </button>
              <button
                type="button"
                onClick={() => setIsBulkEditOpen(true)}
                className="flex-1 sm:flex-none px-4 py-2 bg-[#9B111E] hover:bg-[#800d18] text-white rounded-xl text-xs font-bold transition-colors shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Bulk Edit All</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedIds(new Set())}
                className="flex-1 sm:flex-none px-3.5 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Bulk Edit Modal */}
        {isBulkEditOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl p-6 max-w-2xl w-full shadow-2xl border border-stone-200 max-h-[90vh] overflow-y-auto flex flex-col">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-4 shrink-0">
                <div>
                  <h3 className="font-black text-stone-900 text-base">Bulk Edit Products</h3>
                  <p className="text-[10px] text-stone-500">
                    Updating <span className="font-extrabold text-[#9B111E]">{selectedIds.size} products</span>. Check fields on the left to include them in the update.
                  </p>
                </div>
                <button
                  onClick={() => setIsBulkEditOpen(false)}
                  className="p-1.5 hover:bg-stone-100 text-stone-500 rounded-full transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleBulkUpdate} className="space-y-4 flex-1 overflow-y-auto pr-1">
                {/* 1. Category */}
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/60 flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={bulkFields.category}
                    onChange={(e) => setBulkFields(prev => ({ ...prev, category: e.target.checked }))}
                    className="rounded text-[#9B111E] focus:ring-[#9B111E] w-4 h-4 cursor-pointer"
                  />
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold text-stone-600 mb-1">Category</label>
                    <select
                      disabled={!bulkFields.category}
                      value={bulkValues.category}
                      onChange={(e) => setBulkValues(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-3 py-1.5 rounded-lg border border-stone-200 text-xs bg-white text-stone-800 focus:outline-none focus:ring-1 focus:ring-[#9B111E] disabled:bg-stone-100/60 disabled:text-stone-400 font-semibold"
                    >
                      <option value="">-- Choose Category --</option>
                      {categories.map((c) => (
                        <option key={c.id || c.slug} value={c.slug}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 2. Price, MRP and Profit */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/60 flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={bulkFields.price}
                      onChange={(e) => setBulkFields(prev => ({ ...prev, price: e.target.checked }))}
                      className="rounded text-[#9B111E] focus:ring-[#9B111E] w-4 h-4 cursor-pointer"
                    />
                    <div className="flex-1">
                      <label className="block text-[10px] font-bold text-stone-600 mb-1">Base Selling Price (₹)</label>
                      <input
                        type="number"
                        disabled={!bulkFields.price}
                        value={bulkValues.price}
                        onChange={(e) => setBulkValues(prev => ({ ...prev, price: e.target.value }))}
                        placeholder="e.g. 199"
                        className="w-full px-3 py-1.5 rounded-lg border border-stone-200 text-xs focus:outline-none focus:ring-1 focus:ring-[#9B111E] disabled:bg-stone-100/60 disabled:text-stone-400 font-semibold"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/60 flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={bulkFields.mrp}
                      onChange={(e) => setBulkFields(prev => ({ ...prev, mrp: e.target.checked }))}
                      className="rounded text-[#9B111E] focus:ring-[#9B111E] w-4 h-4 cursor-pointer"
                    />
                    <div className="flex-1">
                      <label className="block text-[10px] font-bold text-stone-600 mb-1">Base MRP (₹)</label>
                      <input
                        type="number"
                        disabled={!bulkFields.mrp}
                        value={bulkValues.mrp}
                        onChange={(e) => setBulkValues(prev => ({ ...prev, mrp: e.target.value }))}
                        placeholder="e.g. 249"
                        className="w-full px-3 py-1.5 rounded-lg border border-stone-200 text-xs focus:outline-none focus:ring-1 focus:ring-[#9B111E] disabled:bg-stone-100/60 disabled:text-stone-400 font-semibold"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-emerald-50/40 rounded-xl border border-emerald-200/70 flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={bulkFields.profit}
                      onChange={(e) => setBulkFields(prev => ({ ...prev, profit: e.target.checked }))}
                      className="rounded text-emerald-600 focus:ring-emerald-600 w-4 h-4 cursor-pointer"
                    />
                    <div className="flex-1">
                      <label className="block text-[10px] font-bold text-emerald-800 mb-1">Profit Per Unit (₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        disabled={!bulkFields.profit}
                        value={bulkValues.profit}
                        onChange={(e) => setBulkValues(prev => ({ ...prev, profit: e.target.value }))}
                        placeholder="e.g. 35"
                        className="w-full px-3 py-1.5 rounded-lg border border-emerald-300 bg-white text-xs text-emerald-950 focus:outline-none focus:ring-1 focus:ring-emerald-600 disabled:bg-stone-100/60 disabled:text-stone-400 font-bold"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Stock Status & Weight */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/60 flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={bulkFields.stock}
                      onChange={(e) => setBulkFields(prev => ({ ...prev, stock: e.target.checked }))}
                      className="rounded text-[#9B111E] focus:ring-[#9B111E] w-4 h-4 cursor-pointer"
                    />
                    <div className="flex-1">
                      <label className="block text-[10px] font-bold text-stone-600 mb-1">Stock / Units</label>
                      <input
                        type="number"
                        disabled={!bulkFields.stock}
                        value={bulkValues.stock}
                        onChange={(e) => setBulkValues(prev => ({ ...prev, stock: e.target.value }))}
                        placeholder="e.g. 150"
                        className="w-full px-3 py-1.5 rounded-lg border border-stone-200 text-xs focus:outline-none focus:ring-1 focus:ring-[#9B111E] disabled:bg-stone-100/60 disabled:text-stone-400 font-semibold"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/60 flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={bulkFields.netQuantity}
                      onChange={(e) => setBulkFields(prev => ({ ...prev, netQuantity: e.target.checked }))}
                      className="rounded text-[#9B111E] focus:ring-[#9B111E] w-4 h-4 cursor-pointer"
                    />
                    <div className="flex-1">
                      <label className="block text-[10px] font-bold text-stone-600 mb-1">Weight / Net Quantity</label>
                      <input
                        type="text"
                        disabled={!bulkFields.netQuantity}
                        value={bulkValues.netQuantity}
                        onChange={(e) => setBulkValues(prev => ({ ...prev, netQuantity: e.target.value }))}
                        placeholder="e.g. 150g, Pack of 3"
                        className="w-full px-3 py-1.5 rounded-lg border border-stone-200 text-xs focus:outline-none focus:ring-1 focus:ring-[#9B111E] disabled:bg-stone-100/60 disabled:text-stone-400 font-semibold"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Flavour & Tags */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/60 flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={bulkFields.flavour}
                      onChange={(e) => setBulkFields(prev => ({ ...prev, flavour: e.target.checked }))}
                      className="rounded text-[#9B111E] focus:ring-[#9B111E] w-4 h-4 cursor-pointer"
                    />
                    <div className="flex-1">
                      <label className="block text-[10px] font-bold text-stone-600 mb-1">Flavour / Taste Note</label>
                      <input
                        type="text"
                        disabled={!bulkFields.flavour}
                        value={bulkValues.flavour}
                        onChange={(e) => setBulkValues(prev => ({ ...prev, flavour: e.target.value }))}
                        placeholder="e.g. Spicy Masala, Classic Salted"
                        className="w-full px-3 py-1.5 rounded-lg border border-[#e1e3e5] text-xs focus:outline-none focus:ring-1 focus:ring-[#9B111E] disabled:bg-stone-100/60 disabled:text-stone-400 font-semibold"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-stone-50 rounded-xl border border-[#e1e3e5] flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={bulkFields.tags}
                      onChange={(e) => setBulkFields(prev => ({ ...prev, tags: e.target.checked }))}
                      className="rounded text-[#9B111E] focus:ring-[#9B111E] w-4 h-4 cursor-pointer"
                    />
                    <div className="flex-1">
                      <label className="block text-[10px] font-bold text-stone-600 mb-1">Tags (Comma Separated)</label>
                      <input
                        type="text"
                        disabled={!bulkFields.tags}
                        value={bulkValues.tags}
                        onChange={(e) => setBulkValues(prev => ({ ...prev, tags: e.target.value }))}
                        placeholder="banana-chips, fresh, spicy"
                        className="w-full px-3 py-1.5 rounded-lg border border-stone-200 text-xs focus:outline-none focus:ring-1 focus:ring-[#9B111E] disabled:bg-stone-100/60 disabled:text-stone-400 font-semibold"
                      />
                    </div>
                  </div>
                </div>

                {/* 5. Weight Variations & Pack Pricing */}
                <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-200/90 space-y-3.5">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="bulk-check-variants"
                      checked={bulkFields.variants}
                      onChange={(e) => setBulkFields(prev => ({ ...prev, variants: e.target.checked }))}
                      className="mt-0.5 rounded text-[#9B111E] focus:ring-[#9B111E] w-4 h-4 cursor-pointer"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <label htmlFor="bulk-check-variants" className="text-xs font-black text-stone-850 flex items-center gap-1.5 cursor-pointer">
                          <Package className="w-4 h-4 text-[#9B111E]" />
                          <span>Weight Variations & Pack Pricing</span>
                        </label>
                        {bulkFields.variants && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                            Active for {selectedIds.size} Products
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-stone-500 mt-0.5">
                        Bulk create multi-pack weight options (e.g. 200g, 500g, 1kg) or edit prices of existing variations.
                      </p>
                    </div>
                  </div>

                  {bulkFields.variants && (
                    <div className="space-y-3.5 pt-2 border-t border-amber-200/70 animate-in fade-in duration-200">
                      {/* Mode Tabs */}
                      <div className="flex flex-wrap gap-1.5 bg-stone-100/90 p-1.5 rounded-xl border border-stone-200/80 text-[11px] font-bold">
                        <button
                          type="button"
                          onClick={() => setBulkVariantMode('replace')}
                          className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${bulkVariantMode === 'replace' ? 'bg-white text-[#9B111E] shadow-xs font-extrabold' : 'text-stone-600 hover:text-stone-900'}`}
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Create / Replace Variations</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setBulkVariantMode('append')}
                          className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${bulkVariantMode === 'append' ? 'bg-white text-[#9B111E] shadow-xs font-extrabold' : 'text-stone-600 hover:text-stone-900'}`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add / Merge Packs</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setBulkVariantMode('update_by_weight')}
                          className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${bulkVariantMode === 'update_by_weight' ? 'bg-white text-[#9B111E] shadow-xs font-extrabold' : 'text-stone-600 hover:text-stone-900'}`}
                        >
                          <Sliders className="w-3.5 h-3.5" />
                          <span>Edit Specific Weight Prices</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setBulkVariantMode('adjust_prices')}
                          className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${bulkVariantMode === 'adjust_prices' ? 'bg-white text-[#9B111E] shadow-xs font-extrabold' : 'text-stone-600 hover:text-stone-900'}`}
                        >
                          <Percent className="w-3.5 h-3.5" />
                          <span>Adjust All Prices (±%)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setBulkVariantMode('remove_all')}
                          className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${bulkVariantMode === 'remove_all' ? 'bg-red-50 text-red-700 shadow-xs font-extrabold' : 'text-stone-600 hover:text-red-600'}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove Variations</span>
                        </button>
                      </div>

                      {/* Tab 1 & 2: Replace / Append Table */}
                      {(bulkVariantMode === 'replace' || bulkVariantMode === 'append') && (
                        <div className="space-y-3 bg-white p-3.5 rounded-xl border border-stone-200">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[11px] font-bold text-stone-700">Quick Presets:</span>
                              <button
                                type="button"
                                onClick={handleSet3PacksPreset}
                                className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                <Sparkles className="w-3 h-3 text-amber-600" />
                                <span>3 Packs: 200g (₹70), 500g (₹170), 1kg (₹340)</span>
                              </button>
                              <button
                                type="button"
                                onClick={handleSet4StandardPreset}
                                className="px-2.5 py-1 bg-stone-50 hover:bg-stone-100 text-stone-700 border border-stone-200 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                <span>4 Standard: 100g, 250g, 500g, 1kg</span>
                              </button>
                            </div>
                            <button
                              type="button"
                              onClick={() => setBulkVariantsList(prev => [...prev, { weight: '', price: 0, mrp: 0, stock: 100 }])}
                              className="px-2.5 py-1 bg-[#9B111E] hover:bg-[#800d18] text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Add Pack Row</span>
                            </button>
                          </div>

                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                              <thead>
                                <tr className="border-b border-stone-100 text-stone-400 text-[10px] font-bold uppercase tracking-wider">
                                  <th className="pb-1.5 w-1/4">Pack Weight (e.g. 200g)</th>
                                  <th className="pb-1.5 w-1/5">Selling Price (₹)</th>
                                  <th className="pb-1.5 w-1/5">MRP (₹)</th>
                                  <th className="pb-1.5 w-1/6">Stock Units</th>
                                  <th className="pb-1.5 text-right w-10">Action</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-stone-50">
                                {bulkVariantsList.map((variant, idx) => (
                                  <tr key={idx} className="group">
                                    <td className="py-1.5 pr-2">
                                      <input
                                        type="text"
                                        value={variant.weight}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          setBulkVariantsList(prev => prev.map((item, i) => i === idx ? { ...item, weight: val } : item));
                                        }}
                                        placeholder="e.g. 200g, 500g, 1kg"
                                        className="w-full px-2.5 py-1 rounded-lg border border-stone-200 text-xs font-bold text-stone-800 focus:outline-none focus:ring-1 focus:ring-[#9B111E]"
                                      />
                                    </td>
                                    <td className="py-1.5 pr-2">
                                      <input
                                        type="number"
                                        value={variant.price || ''}
                                        onChange={(e) => {
                                          const val = Number(e.target.value);
                                          setBulkVariantsList(prev => prev.map((item, i) => i === idx ? { ...item, price: val, mrp: item.mrp && item.mrp >= val ? item.mrp : val } : item));
                                        }}
                                        placeholder="70"
                                        className="w-full px-2.5 py-1 rounded-lg border border-stone-200 text-xs font-bold text-stone-800 focus:outline-none focus:ring-1 focus:ring-[#9B111E]"
                                      />
                                    </td>
                                    <td className="py-1.5 pr-2">
                                      <input
                                        type="number"
                                        value={variant.mrp || ''}
                                        onChange={(e) => {
                                          const val = Number(e.target.value);
                                          setBulkVariantsList(prev => prev.map((item, i) => i === idx ? { ...item, mrp: val } : item));
                                        }}
                                        placeholder="80"
                                        className="w-full px-2.5 py-1 rounded-lg border border-stone-200 text-xs font-bold text-stone-800 focus:outline-none focus:ring-1 focus:ring-[#9B111E]"
                                      />
                                    </td>
                                    <td className="py-1.5 pr-2">
                                      <input
                                        type="number"
                                        value={variant.stock ?? 100}
                                        onChange={(e) => {
                                          const val = Number(e.target.value);
                                          setBulkVariantsList(prev => prev.map((item, i) => i === idx ? { ...item, stock: val } : item));
                                        }}
                                        placeholder="100"
                                        className="w-full px-2.5 py-1 rounded-lg border border-stone-200 text-xs font-bold text-stone-800 focus:outline-none focus:ring-1 focus:ring-[#9B111E]"
                                      />
                                    </td>
                                    <td className="py-1.5 text-right">
                                      <button
                                        type="button"
                                        onClick={() => setBulkVariantsList(prev => prev.filter((_, i) => i !== idx))}
                                        className="p-1 hover:bg-red-50 text-stone-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                                        title="Remove row"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Tab 3: Update specific weights */}
                      {bulkVariantMode === 'update_by_weight' && (
                        <div className="space-y-3 bg-white p-3.5 rounded-xl border border-stone-200">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <p className="text-[11px] text-stone-600">
                              Update selling price and MRP for specific pack weights across all selected products.
                            </p>
                            <button
                              type="button"
                              onClick={() => setBulkWeightRules(prev => [...prev, { targetWeight: '', price: 0, mrp: 0, stock: 100, createIfMissing: false }])}
                              className="px-2.5 py-1 bg-[#9B111E] hover:bg-[#800d18] text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Add Weight Rule</span>
                            </button>
                          </div>

                          <div className="space-y-2">
                            {bulkWeightRules.map((rule, idx) => (
                              <div key={idx} className="p-2.5 bg-stone-50 rounded-xl border border-stone-200/70 flex items-center gap-2 flex-wrap text-xs">
                                <div className="w-28">
                                  <label className="block text-[9px] font-bold text-stone-500 uppercase">Target Weight</label>
                                  <input
                                    type="text"
                                    value={rule.targetWeight}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setBulkWeightRules(prev => prev.map((r, i) => i === idx ? { ...r, targetWeight: val } : r));
                                    }}
                                    placeholder="e.g. 200g"
                                    className="w-full px-2 py-1 rounded border border-stone-200 font-bold text-xs"
                                  />
                                </div>
                                <div className="w-24">
                                  <label className="block text-[9px] font-bold text-stone-500 uppercase">New Price (₹)</label>
                                  <input
                                    type="number"
                                    value={rule.price || ''}
                                    onChange={(e) => {
                                      const val = Number(e.target.value);
                                      setBulkWeightRules(prev => prev.map((r, i) => i === idx ? { ...r, price: val, mrp: r.mrp || val } : r));
                                    }}
                                    placeholder="70"
                                    className="w-full px-2 py-1 rounded border border-stone-200 font-bold text-xs"
                                  />
                                </div>
                                <div className="w-24">
                                  <label className="block text-[9px] font-bold text-stone-500 uppercase">New MRP (₹)</label>
                                  <input
                                    type="number"
                                    value={rule.mrp || ''}
                                    onChange={(e) => {
                                      const val = Number(e.target.value);
                                      setBulkWeightRules(prev => prev.map((r, i) => i === idx ? { ...r, mrp: val } : r));
                                    }}
                                    placeholder="80"
                                    className="w-full px-2 py-1 rounded border border-stone-200 font-bold text-xs"
                                  />
                                </div>
                                <div className="w-20">
                                  <label className="block text-[9px] font-bold text-stone-500 uppercase">Stock Units</label>
                                  <input
                                    type="number"
                                    value={rule.stock ?? 100}
                                    onChange={(e) => {
                                      const val = Number(e.target.value);
                                      setBulkWeightRules(prev => prev.map((r, i) => i === idx ? { ...r, stock: val } : r));
                                    }}
                                    placeholder="100"
                                    className="w-full px-2 py-1 rounded border border-stone-200 font-bold text-xs"
                                  />
                                </div>
                                <div className="flex items-center gap-1.5 pt-3 ml-1 flex-1 min-w-[140px]">
                                  <input
                                    type="checkbox"
                                    id={`rule-create-${idx}`}
                                    checked={rule.createIfMissing}
                                    onChange={(e) => {
                                      const checked = e.target.checked;
                                      setBulkWeightRules(prev => prev.map((r, i) => i === idx ? { ...r, createIfMissing: checked } : r));
                                    }}
                                    className="rounded text-[#9B111E] focus:ring-[#9B111E] w-3.5 h-3.5 cursor-pointer"
                                  />
                                  <label htmlFor={`rule-create-${idx}`} className="text-[10px] text-stone-600 font-medium cursor-pointer">
                                    Add if missing
                                  </label>
                                </div>
                                <div className="pt-3">
                                  <button
                                    type="button"
                                    onClick={() => setBulkWeightRules(prev => prev.filter((_, i) => i !== idx))}
                                    className="p-1 text-stone-400 hover:text-red-600 transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Tab 4: Price Adjustment */}
                      {bulkVariantMode === 'adjust_prices' && (
                        <div className="bg-white p-3.5 rounded-xl border border-stone-200 space-y-3">
                          <p className="text-[11px] text-stone-600">
                            Increase or decrease variation prices proportionally across all selected products.
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1">Adjustment Type</label>
                              <select
                                value={bulkPriceAdjustment.type}
                                onChange={(e: any) => setBulkPriceAdjustment(prev => ({ ...prev, type: e.target.value }))}
                                className="w-full px-3 py-1.5 rounded-lg border border-stone-200 text-xs font-bold"
                              >
                                <option value="percentage">Percentage Increase / Discount (%)</option>
                                <option value="fixed_increase">Fixed Rupee Increase (+₹)</option>
                                <option value="fixed_decrease">Fixed Rupee Decrease (-₹)</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1">Value Amount</label>
                              <input
                                type="number"
                                value={bulkPriceAdjustment.value}
                                onChange={(e) => setBulkPriceAdjustment(prev => ({ ...prev, value: Number(e.target.value) }))}
                                placeholder="e.g. 10"
                                className="w-full px-3 py-1.5 rounded-lg border border-stone-200 text-xs font-bold"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Tab 5: Remove Variations */}
                      {bulkVariantMode === 'remove_all' && (
                        <div className="bg-red-50 p-3.5 rounded-xl border border-red-200 text-xs text-red-800 space-y-1">
                          <p className="font-bold flex items-center gap-1.5">
                            <AlertTriangle className="w-4 h-4 text-red-600" />
                            <span>Remove all variation pack options</span>
                          </p>
                          <p className="text-[11px] text-red-600">
                            This will remove all variations from the {selectedIds.size} selected products, resetting them to single-SKU base products.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 6. Sales Badges and Availability */}
                <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/60 space-y-3">
                  <span className="block text-[10px] font-black uppercase text-stone-400 tracking-wider">Badges & Stock Status</span>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Featured */}
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={bulkFields.isFeatured}
                        onChange={(e) => setBulkFields(prev => ({ ...prev, isFeatured: e.target.checked }))}
                        className="rounded text-[#9B111E] focus:ring-[#9B111E] w-3.5 h-3.5 cursor-pointer"
                      />
                      <span className="text-[10px] font-bold text-stone-500 w-24">Featured Badge:</span>
                      <select
                        disabled={!bulkFields.isFeatured}
                        value={bulkValues.isFeatured ? 'true' : 'false'}
                        onChange={(e) => setBulkValues(prev => ({ ...prev, isFeatured: e.target.value === 'true' }))}
                        className="px-2 py-1 rounded border border-stone-200 text-xs bg-white text-stone-800 disabled:bg-stone-100/60 disabled:text-stone-400"
                      >
                        <option value="true">Enable</option>
                        <option value="false">Disable</option>
                      </select>
                    </div>

                    {/* Best Seller */}
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={bulkFields.isBestSeller}
                        onChange={(e) => setBulkFields(prev => ({ ...prev, isBestSeller: e.target.checked }))}
                        className="rounded text-[#9B111E] focus:ring-[#9B111E] w-3.5 h-3.5 cursor-pointer"
                      />
                      <span className="text-[10px] font-bold text-stone-500 w-24">Best Seller Badge:</span>
                      <select
                        disabled={!bulkFields.isBestSeller}
                        value={bulkValues.isBestSeller ? 'true' : 'false'}
                        onChange={(e) => setBulkValues(prev => ({ ...prev, isBestSeller: e.target.value === 'true' }))}
                        className="px-2 py-1 rounded border border-stone-200 text-xs bg-white text-stone-800 disabled:bg-stone-100/60 disabled:text-stone-400"
                      >
                        <option value="true">Enable</option>
                        <option value="false">Disable</option>
                      </select>
                    </div>

                    {/* New Badge */}
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={bulkFields.isNew}
                        onChange={(e) => setBulkFields(prev => ({ ...prev, isNew: e.target.checked }))}
                        className="rounded text-[#9B111E] focus:ring-[#9B111E] w-3.5 h-3.5 cursor-pointer"
                      />
                      <span className="text-[10px] font-bold text-stone-500 w-24">New Badge:</span>
                      <select
                        disabled={!bulkFields.isNew}
                        value={bulkValues.isNew ? 'true' : 'false'}
                        onChange={(e) => setBulkValues(prev => ({ ...prev, isNew: e.target.value === 'true' }))}
                        className="px-2 py-1 rounded border border-stone-200 text-xs bg-white text-stone-800 disabled:bg-stone-100/60 disabled:text-stone-400"
                      >
                        <option value="true">Enable</option>
                        <option value="false">Disable</option>
                      </select>
                    </div>

                    {/* Availability */}
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={bulkFields.isAvailable}
                        onChange={(e) => setBulkFields(prev => ({ ...prev, isAvailable: e.target.checked }))}
                        className="rounded text-[#9B111E] focus:ring-[#9B111E] w-3.5 h-3.5 cursor-pointer"
                      />
                      <span className="text-[10px] font-bold text-stone-500 w-24">Is Available:</span>
                      <select
                        disabled={!bulkFields.isAvailable}
                        value={bulkValues.isAvailable ? 'true' : 'false'}
                        onChange={(e) => setBulkValues(prev => ({ ...prev, isAvailable: e.target.value === 'true' }))}
                        className="px-2 py-1 rounded border border-stone-200 text-xs bg-white text-stone-800 disabled:bg-stone-100/60 disabled:text-stone-400"
                      >
                        <option value="true">Active (Available)</option>
                        <option value="false">Inactive (Hidden)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-3 shrink-0 border-t border-stone-100">
                  <button
                    type="button"
                    disabled={isBulkUpdating}
                    onClick={() => setIsBulkEditOpen(false)}
                    className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 disabled:opacity-50 text-stone-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isBulkUpdating}
                    className="flex-1 py-2.5 bg-[#9B111E] hover:bg-[#800d18] disabled:bg-[#9B111E]/50 text-white rounded-xl text-xs font-bold transition-colors shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {isBulkUpdating ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Applying Updates ({selectedIds.size})...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Apply Changes to {selectedIds.size} Items</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deletingProductId && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-stone-200 space-y-4">
              <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-100">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="text-center space-y-1">
                <h3 className="font-bold text-stone-900 text-base">Delete Product?</h3>
                <p className="text-xs text-stone-500">
                  This action will permanently delete this product and its image references from your store catalog.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setDeletingProductId(null)}
                  className="flex-1 py-2 bg-stone-100 hover:bg-stone-200 disabled:opacity-50 text-stone-700 rounded-xl text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleDeleteProduct}
                  className="flex-1 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-xl text-xs font-bold transition-colors shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Confirm Delete</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
