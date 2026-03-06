const API_BASE = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000';

export interface ProductSummaryDto {
  id: string;
  slug: string;
  name: string;
  price: number;
  imageUrl: string | null;
  category: string;
  tags: string[];
  stock: number;
  isAvailable: boolean;
}

export interface ProductVariantDto {
  id: string;
  name: string;
  value: string;
  priceDelta: number;
  stock: number;
}

export interface ProductDetailDto {
  id: string;
  slug: string;
  sku: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string | null;
  category: string;
  tags: string[];
  stock: number;
  isAvailable: boolean;
  variants: ProductVariantDto[];
  relatedProducts: ProductSummaryDto[];
  averageRating: number | null;
  reviewCount: number;
}

export interface ReviewDto {
  id: string;
  productId: string;
  userId: string | null;
  reviewerName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface ReviewsListResponse {
  data: ReviewDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateReviewInput {
  rating: number;
  comment: string;
  reviewerName: string;
}

export interface ProductsMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  filters: {
    categories: string[];
    priceRange: { min: number; max: number };
  };
}

export interface ProductsListResponse {
  data: ProductSummaryDto[];
  meta: ProductsMeta;
}

export interface CategoryCount {
  category: string;
  count: number;
}

export type SortOption = 'price_asc' | 'price_desc' | 'newest' | 'popular';

export interface ProductsQueryParams {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  tags?: string[];
  page?: number;
  limit?: number;
  sort?: SortOption;
}

// ── Type guards ────────────────────────────────────────────────────────────────

function isProductSummaryDto(value: unknown): value is ProductSummaryDto {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Record<string, unknown>)['id'] === 'string' &&
    typeof (value as Record<string, unknown>)['slug'] === 'string' &&
    typeof (value as Record<string, unknown>)['name'] === 'string' &&
    typeof (value as Record<string, unknown>)['price'] === 'number' &&
    typeof (value as Record<string, unknown>)['category'] === 'string' &&
    Array.isArray((value as Record<string, unknown>)['tags']) &&
    typeof (value as Record<string, unknown>)['stock'] === 'number' &&
    typeof (value as Record<string, unknown>)['isAvailable'] === 'boolean'
  );
}

function isProductsListResponse(value: unknown): value is ProductsListResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    Array.isArray((value as Record<string, unknown>)['data']) &&
    typeof (value as Record<string, unknown>)['meta'] === 'object'
  );
}

function isCategoryCount(value: unknown): value is CategoryCount {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Record<string, unknown>)['category'] === 'string' &&
    typeof (value as Record<string, unknown>)['count'] === 'number'
  );
}

function isProductDetailDto(value: unknown): value is ProductDetailDto {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Record<string, unknown>)['id'] === 'string' &&
    typeof (value as Record<string, unknown>)['slug'] === 'string' &&
    typeof (value as Record<string, unknown>)['name'] === 'string' &&
    typeof (value as Record<string, unknown>)['price'] === 'number' &&
    Array.isArray((value as Record<string, unknown>)['variants'])
  );
}

function isReviewsListResponse(value: unknown): value is ReviewsListResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    Array.isArray((value as Record<string, unknown>)['data']) &&
    typeof (value as Record<string, unknown>)['total'] === 'number'
  );
}

function isReviewDto(value: unknown): value is ReviewDto {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Record<string, unknown>)['id'] === 'string' &&
    typeof (value as Record<string, unknown>)['rating'] === 'number'
  );
}

// ── Query builder ─────────────────────────────────────────────────────────────

function buildQueryString(params: ProductsQueryParams): string {
  const searchParams = new URLSearchParams();

  if (params.category !== undefined && params.category !== '') {
    searchParams.set('category', params.category);
  }
  if (params.minPrice !== undefined) {
    searchParams.set('minPrice', String(params.minPrice));
  }
  if (params.maxPrice !== undefined) {
    searchParams.set('maxPrice', String(params.maxPrice));
  }
  if (params.tags !== undefined && params.tags.length > 0) {
    params.tags.forEach((tag) => searchParams.append('tags', tag));
  }
  if (params.page !== undefined) {
    searchParams.set('page', String(params.page));
  }
  if (params.limit !== undefined) {
    searchParams.set('limit', String(params.limit));
  }
  if (params.sort !== undefined) {
    searchParams.set('sort', params.sort);
  }

  const qs = searchParams.toString();
  return qs ? `?${qs}` : '';
}

// ── API functions ─────────────────────────────────────────────────────────────

export async function fetchProducts(
  params?: ProductsQueryParams,
): Promise<ProductsListResponse> {
  const qs = params ? buildQueryString(params) : '';
  const res = await fetch(`${API_BASE}/api/v1/products${qs}`, {
    next: { tags: ['products'], revalidate: 60 },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch products: ${res.status} ${res.statusText}`);
  }

  const json: unknown = await res.json();
  if (!isProductsListResponse(json)) {
    throw new Error('Unexpected response shape from /api/v1/products');
  }
  return json;
}

export async function fetchCategories(): Promise<CategoryCount[]> {
  const res = await fetch(`${API_BASE}/api/v1/products/categories`, {
    next: { tags: ['categories'], revalidate: 300 },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch categories: ${res.status} ${res.statusText}`);
  }

  const json: unknown = await res.json();
  if (!Array.isArray(json) || !json.every(isCategoryCount)) {
    throw new Error('Unexpected response shape from /api/v1/products/categories');
  }
  return json;
}

export async function fetchFeaturedProducts(): Promise<ProductSummaryDto[]> {
  const res = await fetch(`${API_BASE}/api/v1/products/featured`, {
    next: { tags: ['products', 'featured'], revalidate: 300 },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch featured products: ${res.status} ${res.statusText}`);
  }

  const json: unknown = await res.json();
  if (!Array.isArray(json) || !json.every(isProductSummaryDto)) {
    throw new Error('Unexpected response shape from /api/v1/products/featured');
  }
  return json;
}

export async function fetchProduct(slug: string): Promise<ProductDetailDto> {
  const res = await fetch(`${API_BASE}/api/v1/products/${encodeURIComponent(slug)}`, {
    next: { tags: [`product-${slug}`, 'products'], revalidate: 60 },
  });

  if (res.status === 404) {
    throw new Error('NOT_FOUND');
  }
  if (!res.ok) {
    throw new Error(`Failed to fetch product: ${res.status} ${res.statusText}`);
  }

  const json: unknown = await res.json();
  if (!isProductDetailDto(json)) {
    throw new Error('Unexpected response shape from /api/v1/products/:slug');
  }
  return json;
}

export async function fetchProductReviews(
  slug: string,
  page = 1,
  limit = 20,
): Promise<ReviewsListResponse> {
  const res = await fetch(
    `${API_BASE}/api/v1/products/${encodeURIComponent(slug)}/reviews?page=${page}&limit=${limit}`,
    { next: { tags: [`product-reviews-${slug}`], revalidate: 30 } },
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch reviews: ${res.status} ${res.statusText}`);
  }

  const json: unknown = await res.json();
  if (!isReviewsListResponse(json)) {
    throw new Error('Unexpected response shape from /api/v1/products/:slug/reviews');
  }
  return json;
}

export async function createProductReview(
  productId: string,
  body: CreateReviewInput,
): Promise<ReviewDto> {
  const res = await fetch(`${API_BASE}/api/v1/products/${encodeURIComponent(productId)}/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to submit review: ${res.status} ${text}`);
  }

  const json: unknown = await res.json();
  if (!isReviewDto(json)) {
    throw new Error('Unexpected response shape from POST /api/v1/products/:id/reviews');
  }
  return json;
}

export async function fetchAllProductSlugs(): Promise<string[]> {
  const res = await fetch(`${API_BASE}/api/v1/products?limit=1000`, {
    next: { tags: ['products'], revalidate: 300 },
  });

  if (!res.ok) {
    return [];
  }

  const json: unknown = await res.json();
  if (!isProductsListResponse(json)) {
    return [];
  }
  return json.data.map((p) => p.slug);
}
