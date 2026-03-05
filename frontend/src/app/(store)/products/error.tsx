'use client';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ProductsError({ error, reset }: ErrorProps): React.JSX.Element {
  return (
    <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="flex flex-col items-center justify-center text-center">
        <h2 className="mb-2 text-2xl font-bold text-gray-900">Something went wrong</h2>
        <p className="mb-6 text-gray-600">
          {error.message ?? 'Failed to load products. Please try again.'}
        </p>
        <button
          onClick={reset}
          className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-700"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
