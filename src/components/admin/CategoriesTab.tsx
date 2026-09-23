'use client';

import React, { useState, useEffect } from 'react';
import { Category } from '@/types';
import {
  Tag,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  FolderPlus,
  Layers,
  X
} from 'lucide-react';
import { CloudinaryUpload } from '@/components/admin/CloudinaryUpload';

interface CategoriesTabProps {
  onCategoryChange?: () => void;
}

export function CategoriesTab({ onCategoryChange }: CategoriesTabProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Edit vs Create mode
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    image: ''
  });

  // Delete confirmation
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchCategories = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/categories', { cache: 'no-store' });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setCategories(json.data);
      } else {
        setCategories([]);
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
      setErrorMessage('Unable to load product categories. Please refresh.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    fetch('/api/categories', { cache: 'no-store' })
      .then((res) => res.json())
      .then((json) => {
        if (active) {
          if (json.success && Array.isArray(json.data)) {
            setCategories(json.data);
          } else {
            setCategories([]);
          }
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch categories:', err);
        if (active) {
          setErrorMessage('Unable to load product categories. Please refresh.');
          setIsLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      image: category.image || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
    setFormData({ name: '', slug: '', description: '', image: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      if (editingCategory) {
        // Update existing category
        const res = await fetch(`/api/categories/${editingCategory.slug}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        const json = await res.json();
        if (json.success) {
          showToast(`Category "${formData.name}" updated successfully!`);
          handleCancelEdit();
          await fetchCategories();
          if (onCategoryChange) onCategoryChange();
        } else {
          setErrorMessage(json.error?.message || 'Failed to update category.');
        }
      } else {
        // Create new category
        const res = await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        const json = await res.json();
        if (json.success) {
          showToast(`Category "${formData.name}" created successfully!`);
          handleCancelEdit();
          await fetchCategories();
          if (onCategoryChange) onCategoryChange();
        } else {
          setErrorMessage(json.error?.message || 'Failed to create category.');
        }
      }
    } catch (err) {
      console.error('Error saving category:', err);
      setErrorMessage('Network error occurred while saving category.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingCategory) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/categories/${deletingCategory.slug}`, {
        method: 'DELETE'
      });
      const json = await res.json();
      if (json.success) {
        showToast(`Category "${deletingCategory.name}" deleted successfully.`);
        setDeletingCategory(null);
        await fetchCategories();
        if (onCategoryChange) onCategoryChange();
      } else {
        setErrorMessage(json.error?.message || 'Failed to delete category.');
      }
    } catch (err) {
      console.error('Error deleting category:', err);
      setErrorMessage('Network error while deleting category.');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredCategories = categories.filter(
    c =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Toast alert */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-stone-900 text-white px-4 py-3 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2 border border-stone-700 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-[#e1e3e5] p-5 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#9B111E] font-bold text-xs uppercase tracking-wider mb-1">
            <Tag className="w-4 h-4" />
            <span>Product Catalog Hierarchy</span>
          </div>
          <h2 className="text-xl font-bold text-stone-900">Store Categories</h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Add, edit, and manage store categories. Changes automatically update across the storefront catalog and navigation menu.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchCategories}
            disabled={isLoading}
            className="px-3.5 py-2 rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-50 text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Sync Categories</span>
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* WordPress-Style Split Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Form */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-[#e1e3e5] p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <h3 className="font-bold text-sm text-stone-900 flex items-center gap-2">
              {editingCategory ? (
                <>
                  <Edit2 className="w-4 h-4 text-[#9B111E]" />
                  <span>Edit Category</span>
                </>
              ) : (
                <>
                  <FolderPlus className="w-4 h-4 text-[#9B111E]" />
                  <span>Add New Category</span>
                </>
              )}
            </h3>

            {editingCategory && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="text-xs font-bold text-stone-500 hover:text-stone-800 underline"
              >
                Cancel Edit
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-medium">
            <div>
              <label className="block text-stone-800 font-bold mb-1">
                Category Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData(prev => ({
                    ...prev,
                    name: val,
                    // auto-generate slug if in create mode or slug matches old auto-generated
                    slug: editingCategory ? prev.slug : val.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '')
                  }));
                }}
                placeholder="e.g. Khandeshi Farsaan"
                className="w-full px-3.5 py-2 rounded-lg border border-stone-300 font-semibold text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#9B111E]"
              />
              <p className="text-[11px] text-stone-500 mt-1">
                The category title displayed on your store.
              </p>
            </div>

            <div>
              <label className="block text-stone-800 font-bold mb-1">
                Slug (URL Identifier)
              </label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="e.g. khandeshi-farsaan"
                className="w-full px-3.5 py-2 rounded-lg border border-stone-300 font-mono text-stone-800 focus:outline-none focus:ring-1 focus:ring-[#9B111E]"
              />
              <p className="text-[11px] text-stone-500 mt-1">
                URL-friendly unique identifier (e.g., store.com/categories/<strong>{formData.slug || 'category-slug'}</strong>).
              </p>
            </div>

            <div>
              <label className="block text-stone-800 font-bold mb-1">
                Description
              </label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Short description for collection banners and SEO..."
                className="w-full px-3.5 py-2 rounded-lg border border-stone-300 text-stone-800 focus:outline-none focus:ring-1 focus:ring-[#9B111E]"
              />
            </div>

            <div>
              <label className="block text-stone-800 font-bold mb-1">
                Category Banner / Icon Image
              </label>
              <div className="space-y-2">
                <input
                  type="url"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  placeholder="https://res.cloudinary.com/..."
                  className="w-full px-3.5 py-2 rounded-lg border border-stone-300 font-mono text-[11px] text-stone-800 focus:outline-none focus:ring-1 focus:ring-[#9B111E]"
                />

                <CloudinaryUpload
                  folder="categories"
                  label="Upload Category Image"
                  onUploadSuccess={(url) => setFormData({ ...formData, image: url })}
                />

                {formData.image && (
                  <div className="relative w-full h-28 rounded-lg overflow-hidden border border-stone-200 bg-stone-50">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={formData.image}
                      alt="Category Preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, image: '' })}
                      className="absolute top-2 right-2 bg-stone-900/80 text-white p-1 rounded-md hover:bg-red-600 transition-colors"
                      title="Remove image"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                type="submit"
                disabled={isSubmitting || !formData.name.trim()}
                className="flex-1 py-2.5 px-4 rounded-lg bg-[#9B111E] hover:bg-[#800e18] text-white font-bold text-xs shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : editingCategory ? (
                  <>
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Update Category</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add New Category</span>
                  </>
                )}
              </button>

              {editingCategory && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="py-2.5 px-3 rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-100 font-bold text-xs"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Right Column: Categories Table */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-[#e1e3e5] p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
            <h3 className="font-bold text-sm text-stone-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-stone-600" />
              <span>All Store Categories ({categories.length})</span>
            </h3>

            <div className="relative max-w-xs w-full">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search categories..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-stone-200 focus:outline-none focus:ring-1 focus:ring-[#9B111E]"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-stone-500 text-xs font-medium flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-[#9B111E]" />
              <span>Loading categories...</span>
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="py-12 text-center border-2 border-dashed border-stone-200 rounded-xl bg-stone-50/50 p-6">
              <Tag className="w-8 h-8 text-stone-300 mx-auto mb-2" />
              <p className="font-bold text-xs text-stone-700">No Categories Found</p>
              <p className="text-[11px] text-stone-500 mt-1">
                {searchQuery
                  ? 'No categories match your search criteria.'
                  : 'Your categories catalog is empty. Create your first category using the form on the left.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50 text-stone-600 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-2.5 px-3">Banner</th>
                    <th className="py-2.5 px-3">Category Name</th>
                    <th className="py-2.5 px-3">Slug</th>
                    <th className="py-2.5 px-3 text-center">Products</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-medium">
                  {filteredCategories.map((cat) => (
                    <tr key={cat.id || cat.slug} className="hover:bg-stone-50/80 transition-colors">
                      <td className="py-2.5 px-3">
                        {cat.image ? (
                          <div className="w-10 h-10 rounded-lg overflow-hidden border border-stone-200 bg-stone-100">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={cat.image}
                              alt={cat.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-lg border border-stone-200 bg-stone-100 flex items-center justify-center text-stone-400">
                            <ImageIcon className="w-4 h-4" />
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-stone-900">{cat.name}</div>
                        {cat.description && (
                          <div className="text-[11px] text-stone-500 line-clamp-1">{cat.description}</div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-stone-600">
                        {cat.slug}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-stone-100 text-stone-800 border border-stone-200">
                          {cat.productCount ?? 0}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleEdit(cat)}
                            className="p-1.5 rounded-md hover:bg-amber-50 text-amber-700 transition-colors"
                            title="Edit Category"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingCategory(cat)}
                            className="p-1.5 rounded-md hover:bg-red-50 text-red-600 transition-colors"
                            title="Delete Category"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deletingCategory && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-stone-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-5 h-5" />
            </div>

            <div className="text-center">
              <h3 className="font-bold text-stone-900 text-sm">Delete Category?</h3>
              <p className="text-xs text-stone-600 mt-1">
                Are you sure you want to delete category <strong className="text-stone-900">{deletingCategory.name}</strong>?
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingCategory(null)}
                disabled={isDeleting}
                className="flex-1 py-2 px-3 rounded-lg border border-stone-300 font-bold text-xs text-stone-700 hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 py-2 px-3 rounded-lg bg-red-600 hover:bg-red-700 font-bold text-xs text-white shadow-sm flex items-center justify-center gap-1.5"
              >
                {isDeleting ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
