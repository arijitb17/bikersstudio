// components/ReviewsSection.tsx
"use client"

import { useState } from 'react';
import { Star, User, MessageSquare } from 'lucide-react';
import { submitReview } from '@/lib/actions';
import { useRouter } from 'next/navigation';

interface Review {
  id: string;
  rating: number;
  title: string | null;
  comment: string;
  createdAt: Date;
  isVerifiedPurchase: boolean;
  user: {
    name: string | null;
    email: string;
  };
}

interface ReviewsSectionProps {
  productId: string;
  reviews: Review[];
  averageRating: number;
}

export default function ReviewsSection({ productId, reviews, averageRating }: ReviewsSectionProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    if (comment.trim().length < 10) {
      setError('Review must be at least 10 characters long');
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('productId', productId);
      formData.append('rating', rating.toString());
      formData.append('title', title);
      formData.append('comment', comment);

      const result = await submitReview(formData);

      if (result.success) {
        setSuccess('Review submitted successfully!');
        setRating(0);
        setTitle('');
        setComment('');
        setShowReviewForm(false);

        // Refresh the page to show new review
        setTimeout(() => {
          router.refresh();
        }, 1000);
      } else {
        setError(result.error || 'Failed to submit review');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      setError('An error occurred while submitting your review');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate rating distribution
  const ratingDistribution = [5, 4, 3, 2, 1].map(stars => ({
    stars,
    count: reviews.filter(r => r.rating === stars).length,
    percentage: reviews.length > 0
      ? (reviews.filter(r => r.rating === stars).length / reviews.length) * 100
      : 0
  }));

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 lg:p-8 border border-neutral-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-black uppercase tracking-tight text-black flex items-center gap-3">
          <span className="w-1.5 h-7 bg-gradient-to-b from-yellow-400 to-yellow-200 rounded-full"></span>
          Customer Reviews
        </h2>
        <button
          onClick={() => setShowReviewForm(!showReviewForm)}
          className="bg-black hover:bg-neutral-900 text-white px-6 py-2.5 rounded-lg font-bold text-sm uppercase transition-colors border border-transparent hover:border-yellow-400"
        >
          {showReviewForm ? 'Cancel' : 'Write a Review'}
        </button>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg">
          <p className="text-black font-medium">{success}</p>
        </div>
      )}
      {error && (
        <div className="mb-6 p-4 bg-neutral-100 border-l-4 border-black rounded-lg">
          <p className="text-black font-medium">{error}</p>
        </div>
      )}

      {/* Overall Rating Summary */}
      <div className="grid md:grid-cols-2 gap-8 mb-8 pb-8 border-b border-neutral-200">
        {/* Left: Average Rating */}
        <div className="flex flex-col items-center justify-center bg-black rounded-xl p-6 relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                'repeating-linear-gradient(115deg, #facc15 0px, #facc15 2px, transparent 2px, transparent 40px)',
            }}
          />
          <div className="relative flex flex-col items-center">
            <div className="text-5xl font-black text-yellow-400 mb-2 tabular-nums">
              {averageRating.toFixed(1)}
            </div>
            <div className="flex items-center gap-1 mb-2">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-6 h-6 ${
                    i < Math.round(averageRating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-neutral-600'
                  }`}
                />
              ))}
            </div>
            <p className="text-sm text-neutral-400 font-mono">
              Based on {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
            </p>
          </div>
        </div>

        {/* Right: Rating Distribution */}
        <div className="space-y-3">
          {ratingDistribution.map(({ stars, count, percentage }) => (
            <div key={stars} className="flex items-center gap-3">
              <div className="flex items-center gap-1 w-20">
                <span className="text-sm font-medium text-black">{stars}</span>
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              </div>
              <div className="flex-1 bg-neutral-200 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-black h-full rounded-full transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="text-sm text-neutral-600 w-12 text-right font-mono">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Review Form */}
      {showReviewForm && (
        <div className="mb-8 pb-8 border-b border-neutral-200">
          <form onSubmit={handleSubmitReview} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-black mb-2">
                Your Rating *
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= (hoverRating || rating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-neutral-300'
                      }`}
                    />
                  </button>
                ))}
                {rating > 0 && (
                  <span className="ml-2 text-sm font-medium text-black">
                    {rating} {rating === 1 ? 'star' : 'stars'}
                  </span>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="title" className="block text-sm font-bold text-black mb-2">
                Review Title (Optional)
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 text-sm text-black"
                placeholder="Summarize your experience"
                maxLength={100}
              />
            </div>

            <div>
              <label htmlFor="comment" className="block text-sm font-bold text-black mb-2">
                Your Review *
              </label>
              <textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={5}
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 resize-none text-sm text-black"
                placeholder="Share your experience with this product..."
                required
                minLength={10}
              />
              <p className="mt-1 text-xs text-neutral-500 font-mono">
                Minimum 10 characters ({comment.length}/10)
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isSubmitting || rating === 0 || comment.trim().length < 10}
                className="bg-black hover:bg-neutral-900 text-white px-8 py-3 rounded-lg font-bold text-sm uppercase transition-colors disabled:bg-neutral-300 disabled:cursor-not-allowed border border-transparent hover:border-yellow-400"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Review'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowReviewForm(false);
                  setRating(0);
                  setTitle('');
                  setComment('');
                  setError('');
                }}
                className="bg-neutral-100 hover:bg-neutral-200 text-black px-8 py-3 rounded-lg font-bold text-sm uppercase transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-6">
        {reviews.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-8 h-8 text-yellow-400" />
            </div>
            <p className="text-black font-medium">No reviews yet</p>
            <p className="text-sm text-neutral-500 mt-1">Be the first to review this product!</p>
          </div>
        ) : (
          reviews.map((review) => (
            <div
              key={review.id}
              className="bg-neutral-50 rounded-xl p-5 border border-neutral-200 hover:border-yellow-400 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-black text-sm">
                        {review.user.name || 'Anonymous'}
                      </p>
                      {review.isVerifiedPurchase && (
                        <span className="text-xs bg-yellow-400 text-black px-2 py-0.5 rounded-full font-semibold">
                          Verified Purchase
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-500 font-mono">
                      {new Date(review.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < review.rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-neutral-300'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {review.title && (
                <h3 className="font-bold text-black mb-2">{review.title}</h3>
              )}

              <p className="text-sm text-neutral-700 leading-relaxed">
                {review.comment}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}