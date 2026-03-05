# Spec 03 — Catalog Frontend

**Status:** DRAFT

**Implemented by:** backend-agent (API), frontend-agent (UI)
**Reviewed by:** spec-checker, backend-reviewer, frontend-reviewer, security-reviewer

---

## Overview

Product catalog with grid layout, category/price filters, and SEO-optimized static pages.

---

## Backend — Products API

### Endpoints

```
GET /api/v1/products
  Query params:
    category  string   — filter by category slug
    minPrice  number   — minimum price filter
    maxPrice  number   — maximum price filter
    tags      string[] — filter by tags (OR logic)
    page      number   — default 1
    limit     number   — default 20, max 100
    sort      string   — price_asc | price_desc | newest | popular

GET /api/v1/products/categories
  Returns: list of all active categories with product counts

GET /api/v1/products/featured
  Returns: up to 8 featured/active products (no auth required)
```

### Response Shape

```typescript
// GET /api/v1/products
{
  data: ProductSummaryDto[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    filters: { categories: string[]; priceRange: { min: number; max: number } };
  };
}

// ProductSummaryDto
{
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
```

---

## Frontend — Catalog Page

### Routes

- `/` — homepage with featured products
- `/products` — full catalog grid with filters

### Catalog Page Requirements

1. **Product Grid** — responsive grid: 1 col mobile, 2 col tablet, 3-4 col desktop
2. **Filter Sidebar** — category checkboxes, price range slider, tag multi-select
3. **Sort Dropdown** — price asc/desc, newest, popular
4. **Mini Product Card** includes:
   - Product image (next/image, lazy loaded except above fold)
   - Product name
   - Price
   - "In stock" / "Out of stock" badge
   - Quick-add to cart button (client-side, requires `"use client"`)
5. **Pagination** — page-based, URL params preserved (`?page=2`)
6. **Empty state** — friendly message when no products match filters
7. **Loading state** — `<Skeleton>` cards while fetching

### URL State

Filter state must be reflected in URL for shareability:
```
/products?category=hoodies&minPrice=30&maxPrice=100&sort=price_asc&page=1
```

### SEO Requirements

```typescript
// app/(store)/products/page.tsx
export const metadata: Metadata = {
  title: 'Products | StyleAI Shop',
  description: 'Browse our full collection. [Dynamic description with category if filtered]',
  openGraph: { ... },
};
```

### Performance Requirements

- Initial page load: Server Component fetches first page of products
- Filter changes: client-side fetch with SWR (no full page reload)
- Images: lazy load all below-fold product images
- Largest Contentful Paint target: < 2.5s

---

## Acceptance Criteria

1. `GET /api/v1/products` returns paginated, filtered, sorted results
2. `GET /api/v1/products/categories` returns all active categories with counts
3. Catalog page renders server-side with first 20 products
4. All 5 filter types work (category, minPrice, maxPrice, tags, sort)
5. URL updates on filter change, back button restores state
6. Product cards show correct in/out of stock state
7. Page has `generateMetadata()` with title and description
8. Mobile layout works at 375px viewport
