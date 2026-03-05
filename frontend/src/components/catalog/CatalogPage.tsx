'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import type { CategoryCount, ProductsListResponse, ProductsQueryParams } from '@/lib/api';
import { fetchProducts } from '@/lib/api';
import FilterSidebar from './FilterSidebar';
import ProductGrid from './ProductGrid';
import ProductCardSkeleton from './ProductCardSkeleton';
import Pagination from './Pagination';

interface CatalogPageProps {
  initialData: ProductsListResponse;
  categories: CategoryCount[];
}

function filtersToQueryParams(searchParams: URLSearchParams): ProductsQueryParams {
  const page = (() => {
    const p = searchParams.get('page');
    const n = Number(p);
    return !isNaN(n) && n > 0 ? n : 1;
  })();

  const params: ProductsQueryParams = { page };

  const category = searchParams.get('category');
  if (category) params.category = category;

  const minPrice = searchParams.get('minPrice');
  if (minPrice) {
    const min = Number(minPrice);
    if (!isNaN(min)) params.minPrice = min;
  }

  const maxPrice = searchParams.get('maxPrice');
  if (maxPrice) {
    const max = Number(maxPrice);
    if (!isNaN(max)) params.maxPrice = max;
  }

  const tags = searchParams.get('tags');
  if (tags) {
    const tagList = tags.split(',').filter(Boolean);
    if (tagList.length > 0) params.tags = tagList;
  }

  const sort = searchParams.get('sort');
  if (
    sort === 'price_asc' ||
    sort === 'price_desc' ||
    sort === 'newest' ||
    sort === 'popular'
  ) {
    params.sort = sort;
  }

  return params;
}

export default function CatalogPage({
  initialData,
  categories,
}: CatalogPageProps): React.JSX.Element {
  const searchParams = useSearchParams();
  const queryParams = filtersToQueryParams(searchParams);

  const { data, isLoading } = useSWR(
    ['/api/v1/products', queryParams] as const,
    ([, swrParams]: readonly [string, ProductsQueryParams]) => fetchProducts(swrParams),
    { fallbackData: initialData, keepPreviousData: true },
  );

  const products = data?.data ?? [];
  const meta = data?.meta ?? initialData.meta;

  return (
    <div className="flex flex-col gap-8 lg:flex-row">
      {/* Sidebar — reads URL state directly via useSearchParams */}
      <FilterSidebar categories={categories} />

      {/* Main content */}
      <div className="min-w-0 flex-1">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={`skeleton-${i}`} />
            ))}
          </div>
        ) : (
          <ProductGrid products={products} />
        )}

        <Pagination currentPage={meta.page} totalPages={meta.totalPages} />
      </div>
    </div>
  );
}
