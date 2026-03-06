import type { ProductSummaryDto } from '@/lib/api';
import ProductCard from './ProductCard';

interface RelatedProductsProps {
  products: ProductSummaryDto[];
}

export default function RelatedProducts({ products }: RelatedProductsProps): React.JSX.Element | null {
  if (products.length === 0) return null;

  return (
    <section aria-label="Related products">
      <h2 className="mb-6 text-xl font-semibold text-gray-900">You May Also Like</h2>
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
        {products.map((product) => (
          <div key={product.id} className="w-56 flex-none">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
}
