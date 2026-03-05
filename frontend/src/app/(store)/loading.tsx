export default function StoreLoading(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Hero skeleton */}
      <div className="mb-16 flex flex-col items-center gap-4">
        <div className="h-12 w-2/3 animate-pulse rounded bg-gray-200" />
        <div className="h-6 w-1/2 animate-pulse rounded bg-gray-200" />
        <div className="h-12 w-40 animate-pulse rounded bg-gray-200" />
      </div>

      {/* Featured grid skeleton */}
      <div className="mb-8 h-8 w-48 animate-pulse rounded bg-gray-200" />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <div className="aspect-square animate-pulse bg-gray-200" />
            <div className="p-4 space-y-2">
              <div className="h-3 w-16 animate-pulse rounded bg-gray-200" />
              <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
              <div className="h-5 w-20 animate-pulse rounded bg-gray-200" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
