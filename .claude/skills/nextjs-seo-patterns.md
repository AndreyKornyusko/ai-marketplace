# Next.js SEO Patterns — StyleAI Shop

Reference guide for all Next.js frontend engineers.

## App Router File Conventions

```
app/
  layout.tsx          ← root layout (global metadata defaults)
  page.tsx            ← home / catalog index
  sitemap.ts          ← dynamic sitemap
  robots.ts           ← robots.txt
  (store)/
    products/
      [slug]/
        page.tsx      ← product detail (SSG)
        loading.tsx
        error.tsx
```

## generateMetadata Pattern

```typescript
// app/(store)/products/[slug]/page.tsx
export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  const product = await getProduct(params.slug);
  return {
    title: `${product.name} | StyleAI Shop`,
    description: product.description.slice(0, 160),
    openGraph: {
      title: product.name,
      description: product.description.slice(0, 160),
      images: [{ url: product.imageUrl, width: 800, height: 600 }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description: product.description.slice(0, 160),
    },
  };
}
```

## generateStaticParams (SSG for product pages)

```typescript
export async function generateStaticParams() {
  const products = await getPublishedProducts();
  return products.map((p) => ({ slug: p.slug }));
}
```

## JSON-LD Structured Data

```typescript
// Product schema
const productJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: product.name,
  description: product.description,
  image: product.imageUrl,
  sku: product.sku,
  offers: {
    '@type': 'Offer',
    price: product.price,
    priceCurrency: 'USD',
    availability: product.stock > 0
      ? 'https://schema.org/InStock'
      : 'https://schema.org/OutOfStock',
  },
};

// In JSX:
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
/>
```

## Breadcrumb JSON-LD

```typescript
const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://example.com' },
    { '@type': 'ListItem', position: 2, name: 'Products', item: 'https://example.com/products' },
    { '@type': 'ListItem', position: 3, name: product.name },
  ],
};
```

## Sitemap

```typescript
// app/sitemap.ts
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getPublishedProducts();
  return [
    { url: 'https://example.com', lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: 'https://example.com/products', lastModified: new Date(), changeFrequency: 'hourly', priority: 0.9 },
    ...products.map((p) => ({
      url: `https://example.com/products/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
  ];
}
```

## Robots

```typescript
// app/robots.ts
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/api/', '/admin/', '/checkout/'] },
    ],
    sitemap: 'https://example.com/sitemap.xml',
  };
}
```

## ISR Revalidation

```typescript
// In server actions or API route handlers:
import { revalidatePath, revalidateTag } from 'next/cache';

// After product update:
revalidatePath(`/products/${slug}`);
revalidateTag('products');

// In fetch calls:
fetch(url, { next: { tags: ['products'], revalidate: 3600 } });
```

## Image Optimization

```typescript
// Always use next/image
import Image from 'next/image';

<Image
  src={product.imageUrl}
  alt={product.name}
  width={800}
  height={600}
  priority={isAboveFold}
  placeholder="blur"
  blurDataURL={product.blurHash}
/>
```
