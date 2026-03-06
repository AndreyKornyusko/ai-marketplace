'use client';

import { useState } from 'react';
import { createProductReview } from '@/lib/api';

interface ReviewFormProps {
  productId: string;
  onSuccess?: () => void;
}

export default function ReviewForm({ productId, onSuccess }: ReviewFormProps): React.JSX.Element {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewerName, setReviewerName] = useState('');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (rating === 0) {
      setError('Please select a star rating.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await createProductReview(productId, { rating, comment, reviewerName });
      setSubmitted(true);
      onSuccess?.();
    } catch {
      setError('Failed to submit your review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="rounded-lg bg-green-50 p-4 text-sm text-green-800">
        Thank you for your review! It has been submitted successfully.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Write a Review</h3>

      {/* Star picker */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Rating</label>
        <div className="flex gap-1" role="group" aria-label="Select star rating">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              aria-label={`${star} star${star > 1 ? 's' : ''}`}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="text-2xl transition-colors"
            >
              <span className={(hoverRating || rating) >= star ? 'text-amber-400' : 'text-gray-300'}>
                ★
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Name */}
      <div>
        <label htmlFor="reviewerName" className="mb-1 block text-sm font-medium text-gray-700">
          Your Name
        </label>
        <input
          id="reviewerName"
          type="text"
          required
          minLength={2}
          maxLength={100}
          value={reviewerName}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReviewerName(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
        />
      </div>

      {/* Comment */}
      <div>
        <label htmlFor="comment" className="mb-1 block text-sm font-medium text-gray-700">
          Review
        </label>
        <textarea
          id="comment"
          required
          minLength={5}
          maxLength={1000}
          rows={4}
          value={comment}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setComment(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
        />
      </div>

      {error !== null && (
        <p className="text-sm text-red-600" role="alert">{error}</p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-700 disabled:opacity-50"
      >
        {isSubmitting ? 'Submitting…' : 'Submit Review'}
      </button>
    </form>
  );
}
