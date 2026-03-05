import type { ProductSummaryDto } from '@/lib/api';
import ProductCard from './ProductCard';

interface ProductGridProps {
  products: ProductSummaryDto[];
}

export default function ProductGrid({ products }: ProductGridProps): React.JSX.Element {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="mb-2 text-2xl font-semibold text-gray-700">No products found</p>
        <p className="text-gray-500">Try adjusting your filters to find what you&apos;re looking for.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
