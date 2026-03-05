import Link from 'next/link';
import Image from 'next/image';
import type { ProductSummaryDto } from '@/lib/api';

interface FeaturedGridProps {
  products: ProductSummaryDto[];
}

export default function FeaturedGrid({ products }: FeaturedGridProps): React.JSX.Element {
  if (products.length === 0) {
    return (
      <p className="text-center text-gray-500 py-12">No featured products available.</p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product, index) => (
        <Link
          key={product.id}
          href={`/products/${product.slug}`}
          className="group block overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
        >
          <div className="relative aspect-square overflow-hidden bg-gray-100">
            {product.imageUrl !== null ? (
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                priority={index < 4}
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-gray-100">
                <span className="text-4xl text-gray-300">&#128247;</span>
              </div>
            )}
            {!product.isAvailable && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <span className="rounded-full bg-white px-3 py-1 text-sm font-medium text-gray-700">
                  Out of Stock
                </span>
              </div>
            )}
          </div>
          <div className="p-4">
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">
              {product.category}
            </p>
            <h3 className="mb-2 line-clamp-2 text-sm font-semibold text-gray-900 group-hover:text-brand-700">
              {product.name}
            </h3>
            <p className="text-base font-bold text-gray-900">
              ${product.price.toFixed(2)}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
