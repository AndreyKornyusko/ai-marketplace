import Image from 'next/image';
import Link from 'next/link';
import type { ProductSummaryDto } from '@/lib/api';
import QuickAddButton from './QuickAddButton';

interface ProductCardProps {
  product: ProductSummaryDto;
  priority?: boolean;
}

export default function ProductCard({
  product,
  priority = false,
}: ProductCardProps): React.JSX.Element {
  return (
    <Link
      href={`/products/${product.slug}`}
      className="group block overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        {product.imageUrl !== null ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            priority={priority}
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gray-100">
            <span className="text-4xl text-gray-300">&#128247;</span>
          </div>
        )}

        {/* Stock badge */}
        <div className="absolute left-2 top-2">
          {product.isAvailable ? (
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
              In Stock
            </span>
          ) : (
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
              Out of Stock
            </span>
          )}
        </div>

        {/* Quick add button — visible on hover, isolated client boundary */}
        {product.isAvailable && (
          <div className="absolute bottom-0 left-0 right-0 translate-y-full transition-transform duration-200 group-hover:translate-y-0">
            <QuickAddButton
              productId={product.id}
              productName={product.name}
              price={product.price}
              imageUrl={product.imageUrl}
              maxQuantity={product.stock}
            />
          </div>
        )}
      </div>

      <div className="p-4">
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">
          {product.category}
        </p>
        <h3 className="mb-2 line-clamp-2 text-sm font-semibold text-gray-900 group-hover:text-gray-700">
          {product.name}
        </h3>
        <div className="flex items-center justify-between">
          <p className="text-base font-bold text-gray-900">${product.price.toFixed(2)}</p>
          {product.stock > 0 && product.stock <= 5 && (
            <span className="text-xs text-amber-600">Only {product.stock} left</span>
          )}
        </div>
      </div>
    </Link>
  );
}
