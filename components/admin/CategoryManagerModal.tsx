'use client';

import React, { useState, useEffect } from 'react';
import { Category } from '@/types';
import {
  Tag,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  X,
  Check,
  AlertCircle,
  FolderPlus
} from 'lucide-react';

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoriesUpdated?: (updatedCategories: Category[], selectedSlug?: string) => void;
}

export function CategoryManagerModal({
  isOpen,
  onClose,
  onCategoriesUpdated
}: CategoryManagerModalProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    image: ''
  });

  const fetchCategories = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/categories', { cache: 'no-store' });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setCategories(json.data);
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    if (isOpen) {
      fetch('/api/categories', { cache: 'no-store' })
        .then((res) => res.json())
        .then((json) => {
          if (active) {
            if (json.success && Array.isArray(json.data)) {
              setCategories(json.data);
            }
            setIsLoading(false);
          }
        })
        .catch((err) => {
          console.error('Failed to load categories:', err);
          if (active) setIsLoading(false);
        });
    }
    return () => {
      active = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleEdit = (cat: Category) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || '',
      image: cat.image || ''
    });
  };

  const handleReset = () => {
    setEditingCategory(null);
    setFormData({ name: '', slug: '', description: '', image: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      let savedCategorySlug = '';
      if (editingCategory) {
        const res = await fetch(`/api/categories/${editingCategory.slug}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        const json = await res.json();
        if (json.success) {
          savedCategorySlug = json.data.slug;
        } else {
          setErrorMessage(json.error?.message || 'Failed to update category.');
          setIsSubmitting(false);
          return;
        }
      } else {
        const res = await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        const json = await res.json();
        if (json.success) {
          savedCategorySlug = json.data.slug;
        } else {
          setErrorMessage(json.error?.message || 'Failed to create category.');
          setIsSubmitting(false);
          return;
        }
      }

      handleReset();
      const catRes = await fetch('/api/categories', { cache: 'no-store' });
      const catJson = await catRes.json();
      const updatedList = catJson.data || [];
      setCategories(updatedList);

      if (onCategoriesUpdated) {
        onCategoriesUpdated(updatedList, savedCategorySlug);
      }
    } catch (err) {
      console.error('Error saving category:', err);
      setErrorMessage('Network error while saving category.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (slug: string) => {
    if (!confirm('Are you sure you want to delete this category from MySQL?')) return;
    try {
      const res = await fetch(`/api/categories/${slug}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        const catRes = await fetch('/api/categories', { cache: 'no-store' });
        const catJson = await catRes.json();
        const updatedList = catJson.data || [];
        setCategories(updatedList);
        if (onCategoriesUpdated) {
          onCategoriesUpdated(updatedList);
        }
      }
    } catch (err) {
      console.error('Error deleting category:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-stone-200 max-h-[90vh] flex flex-col space-y-4 animate-in fade-in zoom-in-95">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2 text-[#9B111E]">
            <Tag className="w-5 h-5" />
            <h3 className="font-bold text-stone-900 text-sm">
              Manage Categories (MySQL Database)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="overflow-y-auto space-y-5 pr-1 text-xs">
          {/* Add / Edit Form */}
          <form onSubmit={handleSubmit} className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-3">
            <div className="font-bold text-stone-800 flex items-center justify-between">
              <span>{editingCategory ? `Edit Category: ${editingCategory.name}` : 'Add New Category'}</span>
              {editingCategory && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-[11px] text-stone-500 hover:text-stone-800 underline"
                >
                  Cancel
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-stone-700 font-semibold mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData(prev => ({
                      ...prev,
                      name: val,
                      slug: editingCategory ? prev.slug : val.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '')
                    }));
                  }}
                  placeholder="e.g. Masala Makhana"
                  className="w-full px-3 py-1.5 rounded-lg border border-stone-300 font-semibold focus:outline-none focus:ring-1 focus:ring-[#9B111E]"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">Slug</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="masala-makhana"
                  className="w-full px-3 py-1.5 rounded-lg border border-stone-300 font-mono text-[11px] focus:outline-none focus:ring-1 focus:ring-[#9B111E]"
                />
              </div>
            </div>

            <div>
              <label className="block text-stone-700 font-semibold mb-1">Description</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description..."
                className="w-full px-3 py-1.5 rounded-lg border border-stone-300 text-stone-800 focus:outline-none focus:ring-1 focus:ring-[#9B111E]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              {editingCategory && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-3 py-1.5 rounded-lg border border-stone-300 font-semibold text-stone-700 hover:bg-stone-100"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={isSubmitting || !formData.name.trim()}
                className="px-4 py-1.5 rounded-lg bg-[#9B111E] hover:bg-[#800e18] text-white font-bold transition-all disabled:opacity-50 flex items-center gap-1.5"
              >
                {isSubmitting ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : editingCategory ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <Plus className="w-3.5 h-3.5" />
                )}
                <span>{editingCategory ? 'Update' : 'Add Category'}</span>
              </button>
            </div>
          </form>

          {/* List of existing categories */}
          <div className="space-y-2">
            <div className="font-bold text-stone-800 flex items-center justify-between">
              <span>Existing Categories ({categories.length})</span>
              <button
                type="button"
                onClick={fetchCategories}
                className="text-stone-500 hover:text-stone-800 p-1"
                title="Refresh"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {isLoading ? (
              <div className="py-6 text-center text-stone-400 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-[#9B111E]" />
                <span>Fetching categories...</span>
              </div>
            ) : categories.length === 0 ? (
              <p className="text-stone-400 italic py-2 text-center">No categories found in MySQL.</p>
            ) : (
              <div className="divide-y divide-stone-100 border border-stone-200 rounded-xl overflow-hidden bg-white">
                {categories.map((c) => (
                  <div key={c.id || c.slug} className="p-2.5 flex items-center justify-between hover:bg-stone-50 transition-colors">
                    <div>
                      <span className="font-bold text-stone-900">{c.name}</span>
                      <span className="ml-2 font-mono text-[10px] text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded">
                        {c.slug}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleEdit(c)}
                        className="p-1 text-amber-700 hover:bg-amber-50 rounded"
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(c.slug)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="pt-2 border-t border-stone-100 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-stone-900 text-white rounded-xl font-bold text-xs hover:bg-stone-800"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
