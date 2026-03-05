export default function ProductCardSkeleton(): React.JSX.Element {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* Image skeleton */}
      <div className="aspect-square animate-pulse bg-gray-200" />

      {/* Content skeleton */}
      <div className="p-4">
        <div className="mb-1 h-3 w-16 animate-pulse rounded bg-gray-200" />
        <div className="mb-2 h-4 w-full animate-pulse rounded bg-gray-200" />
        <div className="mb-1 h-4 w-3/4 animate-pulse rounded bg-gray-200" />
        <div className="h-5 w-20 animate-pulse rounded bg-gray-200" />
      </div>
    </div>
  );
}
