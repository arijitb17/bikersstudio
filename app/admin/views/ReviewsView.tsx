// app/admin/views/ReviewsView.tsx
import { useState, useEffect } from 'react';
import { Star, CheckCircle, XCircle,  Trash2 } from 'lucide-react';
import { api } from '../api';
import Image from 'next/image';
interface Review {
  id: string;
  rating: number;
  title: string;
  comment: string;
  images: string[];
  isVerifiedPurchase: boolean;
  isApproved: boolean;
  createdAt: string;
  user: {
    name: string;
    email: string;
  };
  product: {
    name: string;
    slug: string;
  };
}

interface ReviewsViewProps {
  onDelete: (id: string, productName: string) => void;
  refreshTrigger: number;
}

export function ReviewsView({ onDelete, refreshTrigger }: ReviewsViewProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'approved' | 'pending'>('all');

  useEffect(() => {
    loadReviews();
  }, [refreshTrigger, filter]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const data = await api.fetchData<Review[]>('/reviews');
      setReviews(data);
    } catch (err) {
      console.error('Failed to load reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string, currentStatus: boolean) => {
    try {
      await api.saveData(`/reviews/${id}/approve`, { isApproved: !currentStatus }, 'PUT');
      loadReviews();
    } catch {
      alert('Failed to update review status');
    }
  };

  const filteredReviews = reviews.filter(review => {
    if (filter === 'approved') return review.isApproved;
    if (filter === 'pending') return !review.isApproved;
    return true;
  });

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            size={16}
            className={star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Filter Tabs */}
      <div className="mb-6 flex gap-4 border-b">
        <button
          onClick={() => setFilter('all')}
          className={`pb-2 px-4 ${
            filter === 'all'
              ? 'border-b-2 border-blue-600 text-blue-600 font-semibold'
              : 'text-gray-600'
          }`}
        >
          All Reviews ({reviews.length})
        </button>
        <button
          onClick={() => setFilter('approved')}
          className={`pb-2 px-4 ${
            filter === 'approved'
              ? 'border-b-2 border-blue-600 text-blue-600 font-semibold'
              : 'text-gray-600'
          }`}
        >
          Approved ({reviews.filter(r => r.isApproved).length})
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`pb-2 px-4 ${
            filter === 'pending'
              ? 'border-b-2 border-blue-600 text-blue-600 font-semibold'
              : 'text-gray-600'
          }`}
        >
          Pending ({reviews.filter(r => !r.isApproved).length})
        </button>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {filteredReviews.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-500">No reviews found</p>
          </div>
        ) : (
          filteredReviews.map(review => (
            <div key={review.id} className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {renderStars(review.rating)}
                    {review.isVerifiedPurchase && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center gap-1">
                        <CheckCircle size={12} />
                        Verified Purchase
                      </span>
                    )}
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      review.isApproved
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {review.isApproved ? 'Approved' : 'Pending'}
                    </span>
                  </div>
                  
                  <h3 className="font-semibold text-lg text-gray-900 mb-1">
                    {review.title || 'No title'}
                  </h3>
                  
                  <div className="text-sm text-gray-600 mb-2">
                    <span className="font-medium">{review.user.name}</span>
                    <span className="mx-2">•</span>
                    <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                  </div>

                  <div className="text-sm text-blue-600 mb-3">
                    Product: {review.product.name}
                  </div>
                  
                  <p className="text-gray-700 mb-3">{review.comment}</p>

                  {/* Review Images */}
                  {review.images && review.images.length > 0 && (
                    <div className="flex gap-2 mb-3">
                      {review.images.map((img, idx) => (
                        <Image
  key={idx}
  src={img}
  alt={`Review image ${idx + 1}`}
  width={80}
  height={80}
  className="object-cover rounded border"
/>
                      ))}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleApprove(review.id, review.isApproved)}
                    className={`p-2 rounded-lg ${
                      review.isApproved
                        ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200'
                        : 'bg-green-100 text-green-600 hover:bg-green-200'
                    }`}
                    title={review.isApproved ? 'Unapprove' : 'Approve'}
                  >
                    {review.isApproved ? <XCircle size={20} /> : <CheckCircle size={20} />}
                  </button>
                  <button
                    onClick={() => onDelete(review.id, `Review by ${review.user.name}`)}
                    className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                    title="Delete"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
