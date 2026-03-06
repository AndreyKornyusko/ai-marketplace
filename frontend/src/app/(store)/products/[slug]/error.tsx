'use client';

import Link from 'next/link';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ProductDetailError({ reset }: ErrorProps): React.JSX.Element {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
      <p className="mb-4 text-gray-500">Something went wrong loading this product.</p>
      <div className="flex justify-center gap-4">
        <button
          type="button"
          onClick={reset}
          className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-700"
        >
          Try again
        </button>
        <Link
          href="/products"
          className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          Back to Products
        </Link>
      </div>
    </div>
  );
}
