import { Suspense } from 'react';
import type { Metadata } from 'next';
import { fetchProducts, fetchCategories } from '@/lib/api';
import type { ProductsQueryParams } from '@/lib/api';
import CatalogPage from '@/components/catalog/CatalogPage';
import ProductCardSkeleton from '@/components/catalog/ProductCardSkeleton';

interface ProductsPageSearchParams {
  category?: string;
  minPrice?: string;
  maxPrice?: string;
  tags?: string;
  sort?: string;
  page?: string;
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<ProductsPageSearchParams>;
}): Promise<Metadata> {
  const params = await searchParams;
  const categoryLabel = params.category ? ` — ${params.category}` : '';

  return {
    title: `Products${categoryLabel} | StyleAI Shop`,
    description: `Browse our full collection${categoryLabel}. Free shipping on orders over $50.`,
    openGraph: {
      title: `Products${categoryLabel} | StyleAI Shop`,
      description: `Browse our full collection${categoryLabel}.`,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `Products${categoryLabel} | StyleAI Shop`,
      description: `Browse our full collection${categoryLabel}.`,
    },
  };
}

function parseSearchParams(params: ProductsPageSearchParams): ProductsQueryParams {
  const query: ProductsQueryParams = {};

  if (params.category) query.category = params.category;
  if (params.minPrice) {
    const min = Number(params.minPrice);
    if (!isNaN(min)) query.minPrice = min;
  }
  if (params.maxPrice) {
    const max = Number(params.maxPrice);
    if (!isNaN(max)) query.maxPrice = max;
  }
  if (params.tags) {
    query.tags = params.tags.split(',').filter(Boolean);
  }
  if (params.page) {
    const page = Number(params.page);
    if (!isNaN(page) && page > 0) query.page = page;
  }
  if (
    params.sort === 'price_asc' ||
    params.sort === 'price_desc' ||
    params.sort === 'newest' ||
    params.sort === 'popular'
  ) {
    query.sort = params.sort;
  }

  return query;
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<ProductsPageSearchParams>;
}): Promise<React.JSX.Element> {
  const params = await searchParams;
  const queryParams = parseSearchParams(params);

  const [initialData, categories] = await Promise.all([
    fetchProducts(queryParams).catch(() => ({
      data: [],
      meta: {
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
        filters: { categories: [], priceRange: { min: 0, max: 0 } },
      },
    })),
    fetchCategories().catch(() => []),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {params.category ? params.category : 'All Products'}
        </h1>
        <p className="mt-2 text-gray-600">
          {initialData.meta.total} product{initialData.meta.total !== 1 ? 's' : ''} found
        </p>
      </div>
      <Suspense
        fallback={
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={`skeleton-${i}`} />
            ))}
          </div>
        }
      >
        <CatalogPage initialData={initialData} categories={categories} />
      </Suspense>
    </div>
  );
}
