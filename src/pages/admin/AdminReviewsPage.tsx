import React, { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ProductReview, Product } from '@/types';
import {
  Star,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  Edit3,
  MessageSquare,
  Shield,
  Filter,
  Search,
  Plus,
  Save,
  Check,
  AlertCircle,
  CornerDownRight,
  Send,
  Users,
  Settings,
  RefreshCw,
  Eye,
  Lock,
  ThumbsUp,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ReviewSettings {
  reviewsEnabled: boolean;
  reviewSubmissionPermission: 'all' | 'customers_only' | 'verified_buyers_only' | 'disabled';
  reviewAutoApprove: boolean;
  requireReviewComment: boolean;
}

export function AdminReviewsPage() {
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    averageRating: 5.0
  });

  const [settings, setSettings] = useState<ReviewSettings>({
    reviewsEnabled: true,
    reviewSubmissionPermission: 'all',
    reviewAutoApprove: false,
    requireReviewComment: false
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsSavedSuccess, setSettingsSavedSuccess] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [ratingFilter, setRatingFilter] = useState<number | 0>(0);
  const [productFilter, setProductFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Bulk Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkActionRunning, setIsBulkActionRunning] = useState(false);

  // Reply State
  const [replyingReviewId, setReplyingReviewId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  // Edit Review Modal
  const [editingReview, setEditingReview] = useState<ProductReview | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Create Manual Review Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newReview, setNewReview] = useState({
    productId: '',
    customerName: '',
    customerEmail: '',
    rating: 5,
    title: '',
    comment: '',
    isVerified: true,
    status: 'approved' as 'approved' | 'pending',
    adminReply: ''
  });
  const [isCreatingReview, setIsCreatingReview] = useState(false);

  // Fetch Reviews & Settings
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Build query string
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (ratingFilter > 0) params.append('rating', ratingFilter.toString());
      if (productFilter !== 'all') params.append('productId', productFilter);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const [reviewsRes, productsRes] = await Promise.all([
        fetch(`/api/admin/reviews?${params.toString()}`),
        fetch('/api/products')
      ]);

      const reviewsJson = await reviewsRes.json();
      const productsJson = await productsRes.json();

      if (reviewsJson.success && reviewsJson.data) {
        setReviews(reviewsJson.data.reviews || []);
        if (reviewsJson.data.stats) {
          setStats(reviewsJson.data.stats);
        }
        if (reviewsJson.data.settings) {
          setSettings(reviewsJson.data.settings);
        }
      }

      if (productsJson.success && productsJson.data) {
        setProducts(productsJson.data);
      }
    } catch (err) {
      console.warn('Failed to load reviews data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, ratingFilter, productFilter, searchQuery]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    setSettingsSavedSuccess(false);

    try {
      const res = await fetch('/api/admin/reviews/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      const json = await res.json();
      if (json.success) {
        setSettingsSavedSuccess(true);
        setTimeout(() => setSettingsSavedSuccess(false), 3000);
      }
    } catch (err) {
      console.warn('Failed to save settings:', err);
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Quick Status Update
  const handleStatusChange = async (id: string, newStatus: 'approved' | 'rejected' | 'pending') => {
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const json = await res.json();
      if (json.success) {
        setReviews(prev =>
          prev.map(r => (r.id === id ? { ...r, status: newStatus } : r))
        );
        fetchData();
      }
    } catch (err) {
      console.warn('Failed to update review status:', err);
    }
  };

  // Delete Review
  const handleDeleteReview = async (id: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this review?')) return;

    try {
      const res = await fetch(`/api/admin/reviews/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setReviews(prev => prev.filter(r => r.id !== id));
        setSelectedIds(prev => prev.filter(item => item !== id));
        fetchData();
      }
    } catch (err) {
      console.warn('Failed to delete review:', err);
    }
  };

  // Submit Admin Reply
  const handleSendReply = async (id: string) => {
    if (!replyText.trim()) return;
    setIsSubmittingReply(true);

    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminReply: replyText.trim() })
      });
      const json = await res.json();
      if (json.success) {
        setReviews(prev =>
          prev.map(r =>
            r.id === id
              ? { ...r, adminReply: replyText.trim(), adminRepliedAt: new Date().toISOString() }
              : r
          )
        );
        setReplyingReviewId(null);
        setReplyText('');
      }
    } catch (err) {
      console.warn('Failed to submit reply:', err);
    } finally {
      setIsSubmittingReply(false);
    }
  };

  // Bulk Action
  const handleBulkAction = async (action: 'approve' | 'reject' | 'delete') => {
    if (selectedIds.length === 0) return;
    if (action === 'delete' && !window.confirm(`Delete ${selectedIds.length} selected reviews?`)) {
      return;
    }

    setIsBulkActionRunning(true);
    try {
      const res = await fetch('/api/admin/reviews/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ids: selectedIds })
      });
      const json = await res.json();
      if (json.success) {
        setSelectedIds([]);
        fetchData();
      }
    } catch (err) {
      console.warn('Failed to run bulk action:', err);
    } finally {
      setIsBulkActionRunning(false);
    }
  };

  // Save Edit Review Modal
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReview) return;
    setIsSavingEdit(true);

    try {
      const res = await fetch(`/api/admin/reviews/${editingReview.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingReview)
      });
      const json = await res.json();
      if (json.success) {
        setEditingReview(null);
        fetchData();
      }
    } catch (err) {
      console.warn('Failed to save review edit:', err);
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Create Manual Review
  const handleCreateManualReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReview.productId || !newReview.customerName) {
      alert('Please select a product and enter customer name.');
      return;
    }

    setIsCreatingReview(true);
    try {
      const targetProd = products.find(p => p.id === newReview.productId);
      const res = await fetch('/api/admin/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newReview,
          productName: targetProd?.name
        })
      });
      const json = await res.json();
      if (json.success) {
        setIsCreateModalOpen(false);
        setNewReview({
          productId: '',
          customerName: '',
          customerEmail: '',
          rating: 5,
          title: '',
          comment: '',
          isVerified: true,
          status: 'approved',
          adminReply: ''
        });
        fetchData();
      }
    } catch (err) {
      console.warn('Failed to create manual review:', err);
    } finally {
      setIsCreatingReview(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === reviews.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(reviews.map(r => r.id));
    }
  };

  const toggleSelectId = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-8 pb-16">
        {/* Header Title & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-black uppercase tracking-wider text-[#9B111E] bg-[#9B111E]/10 px-2.5 py-0.5 rounded-full">
                Customer Ratings & Feedback
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
              Reviews & Moderation
            </h1>
            <p className="text-xs sm:text-sm text-stone-500">
              Manage real customer star ratings, approve/reject pending reviews, and set access permissions.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              className="p-2.5 bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
              title="Refresh reviews"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="py-2.5 px-4 bg-[#9B111E] hover:bg-[#800A14] text-white rounded-xl text-xs font-bold transition-all shadow-sm hover:shadow flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Review</span>
            </button>
          </div>
        </div>

        {/* 4 Overview KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 bg-white rounded-2xl border border-stone-200/80 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-stone-500">
              <span className="text-xs font-bold uppercase tracking-wider">Total Reviews</span>
              <MessageSquare className="w-4 h-4 text-stone-400" />
            </div>
            <div className="text-2xl font-black text-stone-900">{stats.total}</div>
            <p className="text-[11px] text-stone-400">All submitted feedback</p>
          </div>

          <div className="p-5 bg-white rounded-2xl border border-amber-200/90 shadow-xs space-y-1 bg-amber-50/30">
            <div className="flex items-center justify-between text-amber-800">
              <span className="text-xs font-black uppercase tracking-wider">Pending Moderation</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-black text-amber-700">{stats.pending}</div>
            <p className="text-[11px] text-amber-800/80">Requires approval before publishing</p>
          </div>

          <div className="p-5 bg-white rounded-2xl border border-emerald-200/80 shadow-xs space-y-1 bg-emerald-50/30">
            <div className="flex items-center justify-between text-emerald-800">
              <span className="text-xs font-bold uppercase tracking-wider">Published Live</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-emerald-700">{stats.approved}</div>
            <p className="text-[11px] text-emerald-800/80">Visible on product pages</p>
          </div>

          <div className="p-5 bg-white rounded-2xl border border-stone-200/80 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-stone-500">
              <span className="text-xs font-bold uppercase tracking-wider">Average Rating</span>
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            </div>
            <div className="text-2xl font-black text-stone-900">
              {stats.averageRating ? stats.averageRating.toFixed(1) : '5.0'}★
            </div>
            <p className="text-[11px] text-stone-400">Store-wide score</p>
          </div>
        </div>

        {/* Review Access & Policy Control Settings Box */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200/90 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-stone-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#9B111E]/10 text-[#9B111E] flex items-center justify-center">
                <Settings className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-stone-900">
                  Review Submission & Access Permissions
                </h3>
                <p className="text-xs text-stone-500">
                  Control who can share ratings and choose auto-approval vs strict moderation.
                </p>
              </div>
            </div>

            {settingsSavedSuccess && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Settings Saved</span>
              </motion.div>
            )}
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* 1. Who can submit reviews */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-stone-800">
                  Review Permissions (Who can post)
                </label>
                <select
                  value={settings.reviewSubmissionPermission}
                  onChange={e =>
                    setSettings(prev => ({
                      ...prev,
                      reviewSubmissionPermission: e.target.value as any
                    }))
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs font-semibold text-stone-800 focus:outline-none focus:border-[#9B111E] focus:ring-1 focus:ring-[#9B111E] bg-white cursor-pointer"
                >
                  <option value="all">🌍 Public (Guests & Customers)</option>
                  <option value="customers_only">👤 Logged-in Customers Only</option>
                  <option value="verified_buyers_only">🛡️ Verified Buyers Only</option>
                  <option value="disabled">🔒 Disabled / Private</option>
                </select>
                <p className="text-[11px] text-stone-400">
                  {settings.reviewSubmissionPermission === 'all' && 'Anyone browsing the store can rate and write reviews.'}
                  {settings.reviewSubmissionPermission === 'customers_only' && 'Users must be logged into their account to review.'}
                  {settings.reviewSubmissionPermission === 'verified_buyers_only' && 'Only customers who ordered this snack can submit.'}
                  {settings.reviewSubmissionPermission === 'disabled' && 'Review submission form is locked.'}
                </p>
              </div>

              {/* 2. Moderation Mode */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-stone-800">
                  Publishing Mode
                </label>
                <div className="flex items-center h-10">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.reviewAutoApprove}
                      onChange={e =>
                        setSettings(prev => ({
                          ...prev,
                          reviewAutoApprove: e.target.checked
                        }))
                      }
                      className="w-4 h-4 text-[#9B111E] rounded-sm focus:ring-[#9B111E] accent-[#9B111E] cursor-pointer"
                    />
                    <span className="text-xs font-bold text-stone-800">
                      Auto-Approve Reviews
                    </span>
                  </label>
                </div>
                <p className="text-[11px] text-stone-400">
                  {settings.reviewAutoApprove
                    ? 'Reviews appear live on product pages immediately.'
                    : 'Reviews go into "Pending" queue for admin approval first.'}
                </p>
              </div>

              {/* 3. Mandatory Comment */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-stone-800">
                  Comment Requirement
                </label>
                <div className="flex items-center h-10">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.requireReviewComment}
                      onChange={e =>
                        setSettings(prev => ({
                          ...prev,
                          requireReviewComment: e.target.checked
                        }))
                      }
                      className="w-4 h-4 text-[#9B111E] rounded-sm focus:ring-[#9B111E] accent-[#9B111E] cursor-pointer"
                    />
                    <span className="text-xs font-bold text-stone-800">
                      Require Review Feedback Text
                    </span>
                  </label>
                </div>
                <p className="text-[11px] text-stone-400">
                  {settings.requireReviewComment
                    ? 'Customer must write text feedback (cannot submit star only).'
                    : 'Customer can submit quick star rating without writing text.'}
                </p>
              </div>

              {/* 4. Global Enable Switch */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-stone-800">
                  Global Reviews Status
                </label>
                <div className="flex items-center h-10">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.reviewsEnabled}
                      onChange={e =>
                        setSettings(prev => ({
                          ...prev,
                          reviewsEnabled: e.target.checked
                        }))
                      }
                      className="w-4 h-4 text-[#9B111E] rounded-sm focus:ring-[#9B111E] accent-[#9B111E] cursor-pointer"
                    />
                    <span className="text-xs font-bold text-stone-800">
                      Enable Reviews on Store
                    </span>
                  </label>
                </div>
                <p className="text-[11px] text-stone-400">
                  {settings.reviewsEnabled
                    ? 'Review section is active on all product pages.'
                    : 'Completely hide reviews module store-wide.'}
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSavingSettings}
                className="py-2.5 px-6 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSavingSettings ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 text-amber-300" />
                    <span>Save Review Settings</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Filter and Moderation Bar */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200/80 shadow-xs space-y-4">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-4">
            <div className="flex items-center gap-1.5 p-1 bg-stone-100 rounded-xl overflow-x-auto">
              {[
                { id: 'all', label: 'All Reviews', count: stats.total },
                { id: 'pending', label: 'Pending Moderation', count: stats.pending, isAlert: stats.pending > 0 },
                { id: 'approved', label: 'Published / Approved', count: stats.approved },
                { id: 'rejected', label: 'Rejected', count: stats.rejected }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id as any)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                    statusFilter === tab.id
                      ? 'bg-white text-stone-900 shadow-xs'
                      : 'text-stone-500 hover:text-stone-900'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-md text-[10px] font-black ${
                      tab.isAlert
                        ? 'bg-amber-500 text-white animate-pulse'
                        : statusFilter === tab.id
                        ? 'bg-stone-100 text-stone-800'
                        : 'bg-stone-200 text-stone-600'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Bulk Actions Menu */}
            {selectedIds.length > 0 && (
              <div className="flex items-center gap-2 bg-stone-900 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold animate-in fade-in">
                <span>{selectedIds.length} selected</span>
                <div className="h-4 w-px bg-stone-700 mx-1" />
                <button
                  onClick={() => handleBulkAction('approve')}
                  disabled={isBulkActionRunning}
                  className="text-emerald-400 hover:text-emerald-300 font-bold px-1.5 py-0.5 cursor-pointer"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleBulkAction('reject')}
                  disabled={isBulkActionRunning}
                  className="text-amber-400 hover:text-amber-300 font-bold px-1.5 py-0.5 cursor-pointer"
                >
                  Reject
                </button>
                <button
                  onClick={() => handleBulkAction('delete')}
                  disabled={isBulkActionRunning}
                  className="text-red-400 hover:text-red-300 font-bold px-1.5 py-0.5 cursor-pointer"
                >
                  Delete
                </button>
              </div>
            )}
          </div>

          {/* Search & Select Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            {/* Search */}
            <div className="sm:col-span-6 relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search reviews by reviewer name, email, comments, or product..."
                className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-stone-200 text-xs text-stone-800 focus:outline-none focus:border-[#9B111E]"
              />
            </div>

            {/* Product Filter */}
            <div className="sm:col-span-3">
              <select
                value={productFilter}
                onChange={e => setProductFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs text-stone-700 focus:outline-none focus:border-[#9B111E] bg-white cursor-pointer"
              >
                <option value="all">All Products ({products.length})</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Rating Filter */}
            <div className="sm:col-span-3">
              <select
                value={ratingFilter}
                onChange={e => setRatingFilter(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs text-stone-700 focus:outline-none focus:border-[#9B111E] bg-white cursor-pointer"
              >
                <option value={0}>All Star Ratings</option>
                <option value={5}>5 Stars ⭐⭐⭐⭐⭐</option>
                <option value={4}>4 Stars ⭐⭐⭐⭐</option>
                <option value={3}>3 Stars ⭐⭐⭐</option>
                <option value={2}>2 Stars ⭐⭐</option>
                <option value={1}>1 Star ⭐</option>
              </select>
            </div>
          </div>
        </div>

        {/* Reviews Table / Card List */}
        <div className="bg-white rounded-3xl border border-stone-200/90 shadow-xs overflow-hidden">
          <div className="p-4 bg-stone-50/80 border-b border-stone-200 flex items-center justify-between text-xs font-bold text-stone-600">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={reviews.length > 0 && selectedIds.length === reviews.length}
                onChange={toggleSelectAll}
                className="w-4 h-4 rounded-sm accent-[#9B111E] cursor-pointer"
              />
              <span>Review Details</span>
            </div>
            <span>Actions & Moderation</span>
          </div>

          {isLoading ? (
            <div className="p-12 text-center">
              <div className="w-8 h-8 border-3 border-[#9B111E] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-stone-500 font-bold">Loading reviews...</p>
            </div>
          ) : reviews.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-stone-800">No Reviews Found</h4>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                {searchQuery || productFilter !== 'all' || ratingFilter > 0 || statusFilter !== 'all'
                  ? 'No reviews match your filter criteria. Try clearing some filters.'
                  : 'You do not have any customer reviews yet.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-stone-100">
              {reviews.map(rev => {
                const isSelected = selectedIds.includes(rev.id);
                const isReplying = replyingReviewId === rev.id;

                return (
                  <div
                    key={rev.id}
                    className={`p-5 sm:p-6 transition-colors ${
                      rev.status === 'pending'
                        ? 'bg-amber-50/30 hover:bg-amber-50/50'
                        : isSelected
                        ? 'bg-stone-50'
                        : 'hover:bg-stone-50/60'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                      {/* Left: Checkbox + Content */}
                      <div className="flex items-start gap-3.5 flex-1">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectId(rev.id)}
                          className="w-4 h-4 mt-1 rounded-sm accent-[#9B111E] cursor-pointer"
                        />

                        <div className="space-y-2 flex-1">
                          {/* Product & Status Bar */}
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-black text-stone-900 bg-stone-100 px-2.5 py-1 rounded-lg">
                              {rev.productName || 'Snack Item'}
                            </span>

                            {/* Status Badge */}
                            {rev.status === 'pending' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 text-[11px] font-black">
                                <Clock className="w-3 h-3 text-amber-600" />
                                <span>Pending Approval</span>
                              </span>
                            )}
                            {rev.status === 'approved' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-[11px] font-bold">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Live / Published</span>
                              </span>
                            )}
                            {rev.status === 'rejected' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-300 text-[11px] font-bold">
                                <XCircle className="w-3 h-3 text-red-600" />
                                <span>Rejected</span>
                              </span>
                            )}

                            {rev.isVerified && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold">
                                <Shield className="w-3 h-3 text-blue-600" />
                                <span>Verified Buyer</span>
                              </span>
                            )}
                          </div>

                          {/* Reviewer & Stars */}
                          <div className="flex flex-wrap items-center gap-3 pt-1">
                            <div className="flex items-center gap-1 text-amber-400">
                              {[1, 2, 3, 4, 5].map(s => (
                                <Star
                                  key={s}
                                  className={`w-4 h-4 ${
                                    s <= rev.rating
                                      ? 'fill-amber-400 text-amber-400'
                                      : 'fill-stone-200 text-stone-200'
                                  }`}
                                />
                              ))}
                            </div>

                            <span className="text-xs font-extrabold text-stone-900">
                              {rev.customerName}
                            </span>

                            {rev.customerEmail && (
                              <span className="text-xs text-stone-400">
                                ({rev.customerEmail})
                              </span>
                            )}

                            <span className="text-[11px] text-stone-400">
                              • {new Date(rev.createdAt).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>

                          {/* Title & Comment */}
                          {rev.title && (
                            <h4 className="text-xs sm:text-sm font-black text-stone-900">
                              {rev.title}
                            </h4>
                          )}
                          {rev.comment && (
                            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed max-w-3xl">
                              {rev.comment}
                            </p>
                          )}

                          {/* Official Admin Reply Box */}
                          {rev.adminReply && (
                            <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200 text-xs space-y-1 max-w-2xl mt-2">
                              <div className="flex items-center justify-between text-amber-900 font-extrabold text-[11px]">
                                <span>Official Reply:</span>
                                {rev.adminRepliedAt && (
                                  <span className="text-[10px] text-stone-400 font-normal">
                                    {new Date(rev.adminRepliedAt).toLocaleDateString('en-IN')}
                                  </span>
                                )}
                              </div>
                              <p className="text-stone-700">{rev.adminReply}</p>
                            </div>
                          )}

                          {/* Inline Reply Input */}
                          {isReplying && (
                            <div className="pt-2 max-w-2xl space-y-2">
                              <textarea
                                rows={2}
                                value={replyText}
                                onChange={e => setReplyText(e.target.value)}
                                placeholder="Type official reply from Aapla Jalgaonwala..."
                                className="w-full p-2.5 rounded-xl border border-amber-300 text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-[#9B111E]"
                              />
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleSendReply(rev.id)}
                                  disabled={isSubmittingReply}
                                  className="px-3.5 py-1.5 bg-[#9B111E] text-white rounded-lg text-xs font-bold hover:bg-[#800A14] transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                                >
                                  <Send className="w-3 h-3" />
                                  <span>Post Reply</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setReplyingReviewId(null);
                                    setReplyText('');
                                  }}
                                  className="px-3 py-1.5 bg-stone-100 text-stone-600 rounded-lg text-xs font-bold hover:bg-stone-200 cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Moderation Action Buttons */}
                      <div className="flex flex-wrap lg:flex-col items-center lg:items-end gap-2 shrink-0 pt-2 lg:pt-0">
                        {/* Approval / Rejection switches */}
                        <div className="flex items-center gap-1.5">
                          {rev.status !== 'approved' && (
                            <button
                              onClick={() => handleStatusChange(rev.id, 'approved')}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                              title="Approve and Publish Review"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>
                          )}

                          {rev.status !== 'rejected' && (
                            <button
                              onClick={() => handleStatusChange(rev.id, 'rejected')}
                              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                              title="Reject Review"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          )}
                        </div>

                        {/* Secondary tools */}
                        <div className="flex items-center gap-1 text-stone-500">
                          <button
                            onClick={() => {
                              setReplyingReviewId(rev.id);
                              setReplyText(rev.adminReply || '');
                            }}
                            className="p-2 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer text-stone-600"
                            title="Reply as Admin"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setEditingReview(rev)}
                            className="p-2 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer text-stone-600"
                            title="Edit Review Details"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDeleteReview(rev.id)}
                            className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors cursor-pointer"
                            title="Delete Review"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Edit Review Modal */}
        <AnimatePresence>
          {editingReview && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-stone-200 space-y-5 relative max-h-[90vh] overflow-y-auto"
              >
                <button
                  onClick={() => setEditingReview(null)}
                  className="absolute top-5 right-5 p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100"
                >
                  <X className="w-5 h-5" />
                </button>

                <div>
                  <h3 className="text-xl font-black text-stone-900">
                    Edit Customer Review
                  </h3>
                  <p className="text-xs text-stone-500">
                    ID: {editingReview.id} • Product: {editingReview.productName}
                  </p>
                </div>

                <form onSubmit={handleSaveEdit} className="space-y-4">
                  {/* Rating selector */}
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Rating (1 to 5 Stars)
                    </label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map(s => (
                        <button
                          type="button"
                          key={s}
                          onClick={() => setEditingReview({ ...editingReview, rating: s })}
                          className="p-1 cursor-pointer"
                        >
                          <Star
                            className={`w-6 h-6 ${
                              s <= editingReview.rating
                                ? 'fill-amber-400 text-amber-400'
                                : 'fill-stone-200 text-stone-200'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        Customer Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={editingReview.customerName}
                        onChange={e =>
                          setEditingReview({ ...editingReview, customerName: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:outline-none focus:border-[#9B111E]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        Customer Email
                      </label>
                      <input
                        type="email"
                        value={editingReview.customerEmail || ''}
                        onChange={e =>
                          setEditingReview({ ...editingReview, customerEmail: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:outline-none focus:border-[#9B111E]"
                      />
                    </div>
                  </div>

                  {/* Review Title & Comment */}
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Headline Title
                    </label>
                    <input
                      type="text"
                      value={editingReview.title || ''}
                      onChange={e =>
                        setEditingReview({ ...editingReview, title: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:outline-none focus:border-[#9B111E]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Review Feedback Text
                    </label>
                    <textarea
                      rows={3}
                      value={editingReview.comment || ''}
                      onChange={e =>
                        setEditingReview({ ...editingReview, comment: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:outline-none focus:border-[#9B111E]"
                    />
                  </div>

                  {/* Admin Reply */}
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Official Admin Reply
                    </label>
                    <textarea
                      rows={2}
                      value={editingReview.adminReply || ''}
                      onChange={e =>
                        setEditingReview({ ...editingReview, adminReply: e.target.value })
                      }
                      placeholder="e.g. Thank you for your feedback!"
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:outline-none focus:border-[#9B111E]"
                    />
                  </div>

                  {/* Status and Verification */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        Review Status
                      </label>
                      <select
                        value={editingReview.status}
                        onChange={e =>
                          setEditingReview({ ...editingReview, status: e.target.value as any })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:outline-none focus:border-[#9B111E] bg-white"
                      >
                        <option value="approved">Approved / Live</option>
                        <option value="pending">Pending Moderation</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>

                    <div className="flex items-center pt-5">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editingReview.isVerified}
                          onChange={e =>
                            setEditingReview({ ...editingReview, isVerified: e.target.checked })
                          }
                          className="w-4 h-4 text-[#9B111E] rounded-sm accent-[#9B111E]"
                        />
                        <span className="text-xs font-bold text-stone-800">
                          Mark as Verified Buyer
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-3 pt-3">
                    <button
                      type="button"
                      onClick={() => setEditingReview(null)}
                      className="w-1/3 py-2.5 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingEdit}
                      className="w-2/3 py-2.5 px-4 bg-[#9B111E] hover:bg-[#800A14] text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isSavingEdit ? (
                        <span>Saving...</span>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Save Changes</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Add Review Manually Modal */}
        <AnimatePresence>
          {isCreateModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-stone-200 space-y-5 relative max-h-[90vh] overflow-y-auto"
              >
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="absolute top-5 right-5 p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100"
                >
                  <X className="w-5 h-5" />
                </button>

                <div>
                  <h3 className="text-xl font-black text-stone-900">
                    Add Product Review Manually
                  </h3>
                  <p className="text-xs text-stone-500">
                    Record offline feedback, WhatsApp testimonial, or customer appreciation.
                  </p>
                </div>

                <form onSubmit={handleCreateManualReview} className="space-y-4">
                  {/* Select product */}
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Product *
                    </label>
                    <select
                      required
                      value={newReview.productId}
                      onChange={e => setNewReview({ ...newReview, productId: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs text-stone-800 focus:outline-none focus:border-[#9B111E] bg-white"
                    >
                      <option value="">-- Choose Product --</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Rating */}
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Star Rating (1 to 5) *
                    </label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map(s => (
                        <button
                          type="button"
                          key={s}
                          onClick={() => setNewReview({ ...newReview, rating: s })}
                          className="p-1 cursor-pointer"
                        >
                          <Star
                            className={`w-6 h-6 ${
                              s <= newReview.rating
                                ? 'fill-amber-400 text-amber-400'
                                : 'fill-stone-200 text-stone-200'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        Customer Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={newReview.customerName}
                        onChange={e =>
                          setNewReview({ ...newReview, customerName: e.target.value })
                        }
                        placeholder="e.g. Ramesh Deshmukh"
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:outline-none focus:border-[#9B111E]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        Customer Email
                      </label>
                      <input
                        type="email"
                        value={newReview.customerEmail}
                        onChange={e =>
                          setNewReview({ ...newReview, customerEmail: e.target.value })
                        }
                        placeholder="Optional"
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:outline-none focus:border-[#9B111E]"
                      />
                    </div>
                  </div>

                  {/* Headline & Comment */}
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Review Headline
                    </label>
                    <input
                      type="text"
                      value={newReview.title}
                      onChange={e => setNewReview({ ...newReview, title: e.target.value })}
                      placeholder="e.g. Fresh and authentic!"
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:outline-none focus:border-[#9B111E]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Review Feedback
                    </label>
                    <textarea
                      rows={3}
                      value={newReview.comment}
                      onChange={e => setNewReview({ ...newReview, comment: e.target.value })}
                      placeholder="Feedback details..."
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:outline-none focus:border-[#9B111E]"
                    />
                  </div>

                  {/* Admin Reply */}
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Admin Reply (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={newReview.adminReply}
                      onChange={e => setNewReview({ ...newReview, adminReply: e.target.value })}
                      placeholder="Optional response from Aapla Jalgaonwala team..."
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:outline-none focus:border-[#9B111E]"
                    />
                  </div>

                  {/* Status & Verification */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        Status
                      </label>
                      <select
                        value={newReview.status}
                        onChange={e =>
                          setNewReview({ ...newReview, status: e.target.value as any })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:outline-none focus:border-[#9B111E] bg-white"
                      >
                        <option value="approved">Approved / Live Immediately</option>
                        <option value="pending">Pending Moderation</option>
                      </select>
                    </div>

                    <div className="flex items-center pt-5">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newReview.isVerified}
                          onChange={e =>
                            setNewReview({ ...newReview, isVerified: e.target.checked })
                          }
                          className="w-4 h-4 text-[#9B111E] rounded-sm accent-[#9B111E]"
                        />
                        <span className="text-xs font-bold text-stone-800">
                          Mark Verified Buyer
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-3">
                    <button
                      type="button"
                      onClick={() => setIsCreateModalOpen(false)}
                      className="w-1/3 py-2.5 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isCreatingReview}
                      className="w-2/3 py-2.5 px-4 bg-[#9B111E] hover:bg-[#800A14] text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isCreatingReview ? (
                        <span>Creating...</span>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          <span>Publish Review</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </AdminLayout>
  );
}
