import ProductCardSkeleton from '@/components/catalog/ProductCardSkeleton';

export default function ProductsLoading(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header skeleton */}
      <div className="mb-8">
        <div className="mb-2 h-8 w-48 animate-pulse rounded bg-gray-200" />
        <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Sidebar skeleton */}
        <div className="w-full lg:w-64 lg:shrink-0 space-y-6">
          <div className="h-6 w-20 animate-pulse rounded bg-gray-200" />
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-5 w-full animate-pulse rounded bg-gray-200" />
            ))}
          </div>
          <div className="h-10 w-full animate-pulse rounded bg-gray-200" />
        </div>

        {/* Grid skeleton */}
        <div className="flex-1 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
