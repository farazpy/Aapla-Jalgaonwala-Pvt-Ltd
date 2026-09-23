import React, { useState, useEffect, useCallback } from 'react';
import { ProductReview, Product } from '@/types';
import { useAuth } from '@/context/AuthContext';
import {
  Star,
  CheckCircle2,
  ThumbsUp,
  MessageSquare,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  X,
  Send,
  User,
  Filter,
  Check,
  Lock,
  LogIn
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ProductReviewsSectionProps {
  product: Product;
  onReviewSubmitted?: () => void;
}

interface ReviewSettingsInfo {
  reviewsEnabled: boolean;
  reviewSubmissionPermission: 'all' | 'customers_only' | 'verified_buyers_only' | 'disabled';
  reviewAutoApprove: boolean;
  requireReviewComment: boolean;
}

const RATING_LABELS: Record<number, string> = {
  5: 'Excellent! Loved it! ⭐⭐⭐⭐⭐',
  4: 'Very Good! Crunchy & tasty ⭐⭐⭐⭐',
  3: 'Good / Average flavour ⭐⭐⭐',
  2: 'Fair / Could be better ⭐⭐',
  1: 'Poor / Disappointed ⭐'
};

export const ProductReviewsSection: React.FC<ProductReviewsSectionProps> = ({
  product,
  onReviewSubmitted
}) => {
  const { user, openAuthModal } = useAuth();

  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [averageRating, setAverageRating] = useState(5.0);
  const [distribution, setDistribution] = useState<Record<number, number>>({ 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });
  const [percentages, setPercentages] = useState<Record<number, number>>({ 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });
  const [settings, setSettings] = useState<ReviewSettingsInfo>({
    reviewsEnabled: true,
    reviewSubmissionPermission: 'all',
    reviewAutoApprove: false,
    requireReviewComment: false
  });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRatingFilter, setSelectedRatingFilter] = useState<number | null>(null);
  const [visibleCount, setVisibleCount] = useState(9);

  useEffect(() => {
    setVisibleCount(9);
  }, [selectedRatingFilter, product.id]);

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccessMsg, setSubmitSuccessMsg] = useState<string | null>(null);
  const [likedReviews, setLikedReviews] = useState<Record<string, boolean>>({});

  // Fetch reviews
  const fetchReviews = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/products/${product.slug || product.id}/reviews`);
      const json = await res.json();
      if (json.success && json.data) {
        setReviews(json.data.reviews || []);
        setTotalCount(json.data.totalCount || 0);
        setAverageRating(json.data.averageRating || 5.0);
        setDistribution(json.data.distribution || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });
        setPercentages(json.data.percentages || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });
        if (json.data.settings) {
          setSettings(json.data.settings);
        }
      }
    } catch (err) {
      console.warn('Failed to load reviews:', err);
    } finally {
      setIsLoading(false);
    }
  }, [product.slug, product.id]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  useEffect(() => {
    if (user) {
      if (!customerName) setCustomerName(user.name || '');
      if (!customerEmail) setCustomerEmail(user.email || '');
    }
  }, [user, customerName, customerEmail]);

  // Handle review like
  const handleLike = async (reviewId: string) => {
    if (likedReviews[reviewId]) return;
    setLikedReviews(prev => ({ ...prev, [reviewId]: true }));
    setReviews(prev =>
      prev.map(r => (r.id === reviewId ? { ...r, likes: (r.likes || 0) + 1 } : r))
    );
    try {
      await fetch(`/api/reviews/${reviewId}/like`, { method: 'POST' });
    } catch {
      // ignore
    }
  };

  // Handle submit review
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccessMsg(null);

    if (!customerName.trim()) {
      setSubmitError('Please enter your name.');
      return;
    }

    if (!rating || rating < 1 || rating > 5) {
      setSubmitError('Please select a star rating (1 to 5 stars).');
      return;
    }

    if (settings.requireReviewComment && !comment.trim()) {
      setSubmitError('Please share your thoughts in the review comment.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/products/${product.slug || product.id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating,
          title: title.trim() || undefined,
          comment: comment.trim(),
          customerName: customerName.trim(),
          customerEmail: customerEmail.trim() || undefined,
          userId: user?.id
        })
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to submit review');
      }

      setSubmitSuccessMsg(json.message || 'Thank you! Your review has been submitted.');
      
      // Clear form
      setTitle('');
      setComment('');
      setRating(5);

      // Refresh reviews
      setTimeout(() => {
        fetchReviews();
        if (onReviewSubmitted) onReviewSubmitted();
      }, 500);

      // Close modal after delay
      setTimeout(() => {
        setIsModalOpen(false);
        setSubmitSuccessMsg(null);
      }, 2500);
    } catch (err: any) {
      setSubmitError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter reviews
  const filteredReviews = selectedRatingFilter
    ? reviews.filter(r => Math.round(r.rating) === selectedRatingFilter)
    : reviews;

  // Check permissions for review CTA
  const isSubmissionDisabled = !settings.reviewsEnabled || settings.reviewSubmissionPermission === 'disabled';
  const requiresLogin = settings.reviewSubmissionPermission === 'customers_only' && !user;

  return (
    <div id="product-reviews-section" className="space-y-8">
      {/* Top Ratings Overview Card */}
      <div className="bg-stone-50/80 rounded-3xl p-5 sm:p-7 border border-stone-200/80 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Left: Overall Score */}
          <div className="md:col-span-4 flex flex-col items-center justify-center text-center p-4 bg-white rounded-2xl border border-stone-200/60 shadow-xs">
            <span className="text-4xl sm:text-5xl font-black text-stone-900 tracking-tight">
              {averageRating > 0 ? averageRating.toFixed(1) : '5.0'}
            </span>
            <div className="flex items-center gap-1 text-amber-400 my-2">
              {[1, 2, 3, 4, 5].map(star => {
                const filled = star <= Math.round(averageRating);
                return (
                  <Star
                    key={star}
                    className={`w-5 h-5 ${
                      filled ? 'fill-amber-400 text-amber-400' : 'fill-stone-200 text-stone-200'
                    }`}
                  />
                );
              })}
            </div>
            <p className="text-xs font-bold text-stone-700">
              Based on {totalCount} verified {totalCount === 1 ? 'rating' : 'ratings'}
            </p>
            <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[11px] font-bold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>98% Customers Recommend</span>
            </div>
          </div>

          {/* Middle: Star Distribution Bars */}
          <div className="md:col-span-5 space-y-2">
            {[5, 4, 3, 2, 1].map(starLevel => {
              const count = distribution[starLevel] || 0;
              const pct = percentages[starLevel] || 0;
              const isSelected = selectedRatingFilter === starLevel;

              return (
                <button
                  key={starLevel}
                  onClick={() =>
                    setSelectedRatingFilter(isSelected ? null : starLevel)
                  }
                  className={`w-full flex items-center gap-2.5 text-xs py-1 px-2 rounded-xl transition-all text-left ${
                    isSelected
                      ? 'bg-amber-100/70 font-extrabold text-[#9B111E]'
                      : 'hover:bg-white/80 text-stone-600'
                  }`}
                  title={`Filter by ${starLevel} stars`}
                >
                  <div className="flex items-center gap-1 w-10 font-bold shrink-0">
                    <span>{starLevel}</span>
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  </div>

                  <div className="flex-1 h-2.5 bg-stone-200/80 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <span className="w-12 text-right text-[11px] font-semibold text-stone-500 shrink-0">
                    {count} ({pct}%)
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right: Write a Review CTA */}
          <div className="md:col-span-3 flex flex-col justify-center items-center text-center space-y-3 p-3">
            <h4 className="text-sm font-extrabold text-stone-900">
              Enjoyed this snack?
            </h4>
            <p className="text-xs text-stone-500 leading-relaxed">
              Share your feedback & crunch rating with fellow foodies!
            </p>

            {isSubmissionDisabled ? (
              <div className="px-3 py-2 rounded-xl bg-stone-100 border border-stone-200 text-stone-500 text-[11px] font-semibold flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" />
                <span>Reviews are currently closed</span>
              </div>
            ) : requiresLogin ? (
              <button
                onClick={openAuthModal}
                className="w-full py-2.5 px-4 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogIn className="w-4 h-4 text-amber-300" />
                <span>Log In to Rate</span>
              </button>
            ) : (
              <button
                onClick={() => setIsModalOpen(true)}
                className="w-full py-2.5 px-4 bg-[#9B111E] hover:bg-[#800A14] text-white rounded-xl text-xs font-bold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer group"
              >
                <Sparkles className="w-4 h-4 text-amber-300 group-hover:rotate-12 transition-transform" />
                <span>Write a Review</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filter Bar & Active Indicator */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-extrabold text-stone-900">
            Customer Reviews ({filteredReviews.length})
          </h3>
          {selectedRatingFilter && (
            <button
              onClick={() => setSelectedRatingFilter(null)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#9B111E]/10 text-[#9B111E] text-xs font-bold border border-[#9B111E]/20 hover:bg-[#9B111E]/20 transition-colors"
            >
              <span>Showing {selectedRatingFilter}★</span>
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-xs text-stone-500">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>All reviews from genuine customers</span>
        </div>
      </div>

      {/* Reviews List */}
      {isLoading ? (
        <div className="space-y-4 py-6">
          {[1, 2, 3].map(n => (
            <div key={n} className="p-5 bg-stone-50 rounded-2xl animate-pulse space-y-3">
              <div className="flex justify-between items-center">
                <div className="h-4 bg-stone-200 rounded w-32" />
                <div className="h-4 bg-stone-200 rounded w-20" />
              </div>
              <div className="h-3 bg-stone-200 rounded w-full" />
              <div className="h-3 bg-stone-200 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="text-center py-12 px-4 bg-stone-50/60 rounded-3xl border border-stone-200/60">
          <div className="w-12 h-12 rounded-2xl bg-amber-100/80 text-amber-800 flex items-center justify-center mx-auto mb-3">
            <MessageSquare className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-stone-800 mb-1">
            {selectedRatingFilter
              ? `No ${selectedRatingFilter}-star reviews found`
              : 'Be the first to review this product!'}
          </h4>
          <p className="text-xs text-stone-500 max-w-sm mx-auto mb-4">
            {selectedRatingFilter
              ? 'Try selecting a different star filter or clear the filter.'
              : 'Share your flavour experience and help other snack lovers in Jalgaon & across India!'}
          </p>
          {!isSubmissionDisabled && (
            <button
              onClick={() => {
                if (requiresLogin) openAuthModal();
                else setIsModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#9B111E] text-white rounded-xl text-xs font-bold hover:bg-[#800A14] transition-colors shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Leave Your Rating</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6 notranslate">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredReviews.slice(0, visibleCount).map(rev => (
              <div
                key={rev.id}
                className="p-5 sm:p-6 bg-white rounded-2xl border border-stone-200/80 shadow-xs hover:border-stone-300 transition-all flex flex-col justify-between space-y-4 min-h-[180px]"
              >
                <div className="space-y-3">
                  {/* Header: Reviewer, Rating & Date */}
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-[#9B111E] flex items-center justify-center text-white text-xs font-bold uppercase shadow-xs shrink-0">
                        {rev.customerName ? rev.customerName.charAt(0) : 'U'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-xs sm:text-sm font-extrabold text-stone-900 truncate max-w-[120px]">
                            {rev.customerName}
                          </span>
                          {rev.isVerified && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-bold shrink-0">
                              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                              <span>Verified</span>
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-stone-400 block mt-0.5">
                          {new Date(rev.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Stars */}
                    <div className="flex items-center gap-0.5 text-amber-400 shrink-0">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 ${
                            s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'fill-stone-200 text-stone-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Title & Comment */}
                  <div className="space-y-1">
                    {rev.title && (
                      <h5 className="font-extrabold text-xs sm:text-sm text-stone-900 leading-snug">
                        {rev.title}
                      </h5>
                    )}
                    {rev.comment ? (
                      <p className="text-xs sm:text-sm text-stone-600 leading-relaxed break-words line-clamp-4 hover:line-clamp-none transition-all">
                        {rev.comment}
                      </p>
                    ) : (
                      <p className="text-xs text-stone-400 italic">
                        Rated {rev.rating} out of 5 stars
                      </p>
                    )}
                  </div>

                  {/* Admin Official Reply */}
                  {rev.adminReply && (
                    <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200/70 space-y-1 mt-2">
                      <div className="flex items-center gap-1 text-amber-900 font-extrabold text-[10px]">
                        <Sparkles className="w-3 h-3 text-[#9B111E]" />
                        <span>Response from Team</span>
                      </div>
                      <p className="text-[11px] text-stone-700 leading-relaxed">
                        {rev.adminReply}
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer: Helpful feedback */}
                <div className="pt-2 flex items-center justify-between border-t border-stone-100 mt-auto shrink-0">
                  <button
                    onClick={() => handleLike(rev.id)}
                    disabled={likedReviews[rev.id]}
                    className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-lg transition-colors ${
                      likedReviews[rev.id]
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'text-stone-500 hover:text-stone-900 hover:bg-stone-100 cursor-pointer'
                    }`}
                  >
                    <ThumbsUp className="w-3 h-3" />
                    <span>
                      {likedReviews[rev.id] ? 'Helpful!' : `Helpful (${rev.likes || 0})`}
                    </span>
                  </button>

                  <span className="text-[9px] text-stone-400 truncate max-w-[100px]">
                    {product.name}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Load More Button */}
          {filteredReviews.length > visibleCount && (
            <div className="flex justify-center pt-4">
              <button
                onClick={() => setVisibleCount(prev => prev + 9)}
                className="px-6 py-2.5 bg-white border border-stone-200 text-stone-700 hover:text-[#9B111E] hover:border-[#9B111E] rounded-xl text-xs font-black transition-all shadow-xs hover:shadow-sm cursor-pointer flex items-center gap-2 group"
              >
                <span>Load More Reviews</span>
                <span className="text-[10px] px-1.5 py-0.5 bg-stone-100 group-hover:bg-red-50 text-stone-500 group-hover:text-[#9B111E] rounded-md font-bold">
                  {filteredReviews.length - visibleCount} more
                </span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Review Submission Modal Dialog */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-stone-200 space-y-6 relative max-h-[90vh] overflow-y-auto"
            >
              {/* Close Button */}
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-5 right-5 p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-[#9B111E] text-[11px] font-extrabold mb-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Review Submission</span>
                </div>
                <h3 className="text-xl font-black text-stone-900 tracking-tight">
                  Rate & Review Snack
                </h3>
                <p className="text-xs text-stone-500">
                  {product.name}
                </p>
              </div>

              {submitSuccessMsg ? (
                <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-200 text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto mb-2">
                    <Check className="w-6 h-6" />
                  </div>
                  <h4 className="font-black text-emerald-900 text-base">
                    Review Submitted!
                  </h4>
                  <p className="text-xs text-emerald-700 font-medium">
                    {submitSuccessMsg}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmitReview} className="space-y-4">
                  {submitError && (
                    <div className="p-3.5 bg-red-50 rounded-xl border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                      <span>{submitError}</span>
                    </div>
                  )}

                  {/* Interactive Star Rating Selector */}
                  <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200/80 text-center space-y-2">
                    <label className="block text-xs font-black text-stone-900 uppercase tracking-wider">
                      Overall Rating *
                    </label>
                    <div className="flex items-center justify-center gap-2">
                      {[1, 2, 3, 4, 5].map(star => {
                        const active = star <= (hoverRating || rating);
                        return (
                          <button
                            type="button"
                            key={star}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            onClick={() => setRating(star)}
                            className="p-1 cursor-pointer transition-transform hover:scale-125 focus:outline-none"
                          >
                            <Star
                              className={`w-7 h-7 sm:w-8 sm:h-8 transition-colors ${
                                active
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'fill-stone-200 text-stone-200'
                              }`}
                            />
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-xs font-bold text-amber-900">
                      {RATING_LABELS[hoverRating || rating]}
                    </p>
                  </div>

                  {/* Review Headline (Optional) */}
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Review Headline / Title <span className="text-stone-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      placeholder="e.g. Super crispy and authentic Khandeshi masala!"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs sm:text-sm focus:outline-none focus:border-[#9B111E] focus:ring-1 focus:ring-[#9B111E]"
                      maxLength={120}
                    />
                  </div>

                  {/* Review Comment Textarea (Optional or required based on admin policy) */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-bold text-stone-700">
                        Detailed Review Feedback{' '}
                        {settings.requireReviewComment ? (
                          <span className="text-red-500">*</span>
                        ) : (
                          <span className="text-stone-400 font-normal">(Optional)</span>
                        )}
                      </label>
                      <span className="text-[10px] text-stone-400">
                        {comment.length}/500
                      </span>
                    </div>
                    <textarea
                      rows={3}
                      value={comment}
                      onChange={e => setComment(e.target.value)}
                      placeholder="Tell us what you liked about the crunchiness, flavour balance, packaging, or freshness..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs sm:text-sm focus:outline-none focus:border-[#9B111E] focus:ring-1 focus:ring-[#9B111E] resize-none"
                      maxLength={500}
                    />
                  </div>

                  {/* Reviewer Name & Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        Your Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={customerName}
                        onChange={e => setCustomerName(e.target.value)}
                        placeholder="e.g. Rahul Patil"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs sm:text-sm focus:outline-none focus:border-[#9B111E] focus:ring-1 focus:ring-[#9B111E]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        Email Address <span className="text-stone-400 font-normal">(Optional)</span>
                      </label>
                      <input
                        type="email"
                        value={customerEmail}
                        onChange={e => setCustomerEmail(e.target.value)}
                        placeholder="For buyer verification"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs sm:text-sm focus:outline-none focus:border-[#9B111E] focus:ring-1 focus:ring-[#9B111E]"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-stone-50 rounded-xl text-[11px] text-stone-500 space-y-1">
                    <p className="flex items-center gap-1.5 font-semibold text-stone-700">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>
                        {settings.reviewAutoApprove
                          ? 'Instant Publication: Your review will be visible immediately.'
                          : 'Moderated Policy: Your review will appear after quick approval by our team.'}
                      </span>
                    </p>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="w-1/3 py-2.5 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-2/3 py-2.5 px-4 bg-[#9B111E] hover:bg-[#800A14] text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Submitting...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Submit Review</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
