'use client';

import { useState, useTransition } from 'react';
import type { ReviewsListResponse } from '@/lib/api';
import { fetchProductReviews } from '@/lib/api';
import StarRating from './StarRating';

interface ReviewsListProps {
  slug: string;
  initial: ReviewsListResponse;
}

export default function ReviewsList({ slug, initial }: ReviewsListProps): React.JSX.Element {
  const [data, setData] = useState(initial);
  const [isPending, startTransition] = useTransition();

  const loadPage = (page: number): void => {
    startTransition(() => {
      fetchProductReviews(slug, page, initial.limit)
        .then(setData)
        .catch(() => {
          // keep existing data on error
        });
    });
  };

  return (
    <div>
      <h2 className="mb-6 text-xl font-semibold text-gray-900">
        Customer Reviews
        {data.total > 0 && (
          <span className="ml-2 text-sm font-normal text-gray-500">({data.total})</span>
        )}
      </h2>

      {data.data.length === 0 ? (
        <p className="text-sm text-gray-500">No reviews yet. Be the first to review this product!</p>
      ) : (
        <div className="space-y-6">
          {data.data.map((review) => (
            <div key={review.id} className="border-b border-gray-100 pb-6 last:border-0">
              <div className="mb-1 flex items-center gap-3">
                <StarRating rating={review.rating} size="sm" />
                <span className="text-sm font-medium text-gray-900">{review.reviewerName}</span>
                <time className="text-xs text-gray-400" dateTime={review.createdAt}>
                  {new Date(review.createdAt).toLocaleDateString()}
                </time>
              </div>
              <p className="text-sm text-gray-700">{review.comment}</p>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {data.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            type="button"
            disabled={data.page <= 1 || isPending}
            onClick={() => loadPage(data.page - 1)}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {data.page} of {data.totalPages}
          </span>
          <button
            type="button"
            disabled={data.page >= data.totalPages || isPending}
            onClick={() => loadPage(data.page + 1)}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
