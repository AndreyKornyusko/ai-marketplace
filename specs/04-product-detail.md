# Spec 04 — Product Detail Page

**Status:** DRAFT

**Implemented by:** backend-agent (API), frontend-agent (UI)
**Reviewed by:** spec-checker, backend-reviewer, frontend-reviewer, security-reviewer

---

## Backend — Product Detail API

### Endpoints

```
GET /api/v1/products/:slug
  Returns: full product with variants and related products

GET /api/v1/products/:slug/reviews
  Query: page, limit
  Returns: paginated product reviews

POST /api/v1/products/:id/reviews
  Auth: required (JWT)
  Body: { rating: 1-5, comment: string }
  Returns: created review
```

### Response Shape

```typescript
// GET /api/v1/products/:slug
{
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
  relatedProducts: ProductSummaryDto[];  // up to 4, same category
  averageRating: number | null;
  reviewCount: number;
}

// ProductVariantDto
{
  id: string;
  name: string;   // e.g. "Size"
  value: string;  // e.g. "XL"
  priceDelta: number;
  stock: number;
}
```

---

## Frontend — Product Detail Page

### Route

- `/products/[slug]` — SSG with `generateStaticParams()`

### Page Requirements

1. **Product Images** — main image with thumbnail gallery (if multiple)
2. **Product Info**
   - Name, price, category badge
   - Description (full text)
   - In stock / out of stock indicator with exact stock count if ≤ 5
3. **Variant Selector** — if product has variants, show selector UI (buttons or dropdown)
4. **Add to Cart** — button with quantity selector (1 to min(stock, 10))
5. **Reviews Section**
   - Average rating with star display
   - Paginated review list (name, rating, comment, date)
   - Submit review form (authenticated users only)
6. **Related Products** — horizontal scroll of up to 4 mini-cards
7. **Breadcrumbs** — Home > Products > [Category] > [Product Name]

### SEO Requirements

```typescript
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProduct(params.slug);
  return {
    title: `${product.name} | StyleAI Shop`,
    description: product.description.slice(0, 160),
    openGraph: {
      title: product.name,
      description: product.description.slice(0, 160),
      images: [{ url: product.imageUrl }],
    },
  };
}
```

### JSON-LD Requirements

Both `Product` and `BreadcrumbList` schemas must be present:

```json
{
  "@type": "Product",
  "name": "...",
  "offers": { "@type": "Offer", "price": "...", "availability": "..." }
}
```

### SSG Requirements

- `generateStaticParams()` must cover all active products
- Revalidation: `revalidatePath('/products/[slug]')` triggered on product update

---

## Acceptance Criteria

1. Product detail page renders statically (no client-side data fetching for core content)
2. Variant selection updates price display correctly
3. Add to cart button disabled when out of stock
4. Reviews paginate correctly
5. `generateMetadata()` returns product-specific title and description
6. JSON-LD `Product` schema present and valid
7. JSON-LD `BreadcrumbList` schema present
8. Breadcrumb navigation renders correctly
9. Related products link to their own detail pages
10. `generateStaticParams()` covers all active products
