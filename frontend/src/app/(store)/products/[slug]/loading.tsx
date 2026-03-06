export default function ProductDetailLoading(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 animate-pulse">
      {/* Breadcrumb skeleton */}
      <div className="mb-6 flex gap-2">
        {[60, 80, 100, 140].map((w) => (
          <div key={w} className="h-4 rounded bg-gray-200" style={{ width: w }} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-x-12 gap-y-8 lg:grid-cols-2">
        {/* Image skeleton */}
        <div className="aspect-square rounded-2xl bg-gray-200" />

        {/* Info skeleton */}
        <div className="flex flex-col gap-4">
          <div className="h-5 w-24 rounded bg-gray-200" />
          <div className="h-9 w-3/4 rounded bg-gray-200" />
          <div className="h-4 w-32 rounded bg-gray-200" />
          <div className="space-y-2">
            <div className="h-4 rounded bg-gray-200" />
            <div className="h-4 rounded bg-gray-200" />
            <div className="h-4 w-5/6 rounded bg-gray-200" />
          </div>
          <div className="h-12 rounded-lg bg-gray-200" />
        </div>
      </div>
    </div>
  );
}
