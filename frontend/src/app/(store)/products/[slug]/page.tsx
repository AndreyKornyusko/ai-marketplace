import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Image from 'next/image';
import { fetchProduct, fetchProductReviews, fetchAllProductSlugs } from '@/lib/api';
import AddToCartSection from '@/components/catalog/AddToCartSection';
import ReviewsList from '@/components/catalog/ReviewsList';
import ReviewForm from '@/components/catalog/ReviewForm';
import RelatedProducts from '@/components/catalog/RelatedProducts';
import StarRating from '@/components/catalog/StarRating';
import Breadcrumbs from '@/components/shared/Breadcrumbs';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  const slugs = await fetchAllProductSlugs().catch(() => []);
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await fetchProduct(slug).catch(() => null);

  if (product === null) {
    return { title: 'Product Not Found | StyleAI Shop' };
  }

  return {
    title: `${product.name} | StyleAI Shop`,
    description: product.description.slice(0, 160),
    openGraph: {
      title: product.name,
      description: product.description.slice(0, 160),
      images:
        product.imageUrl !== null
          ? [{ url: product.imageUrl, width: 800, height: 800 }]
          : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description: product.description.slice(0, 160),
    },
  };
}

export default async function ProductDetailPage({ params }: Props): Promise<React.JSX.Element> {
  const { slug } = await params;

  const product = await fetchProduct(slug).catch((err: unknown) => {
    if (err instanceof Error && err.message === 'NOT_FOUND') return null;
    throw err; // surface genuine network/server errors to error.tsx
  });

  if (product === null) {
    notFound();
  }

  const reviews = await fetchProductReviews(slug, 1, 10).catch(() => ({
    data: [],
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  }));

  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'Products', href: '/products' },
    { label: product.category, href: `/products?category=${encodeURIComponent(product.category)}` },
    { label: product.name },
  ];

  // JSON-LD structured data
  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    sku: product.sku,
    image: product.imageUrl ?? undefined,
    offers: {
      '@type': 'Offer',
      price: product.price.toFixed(2),
      priceCurrency: 'USD',
      availability: product.isAvailable
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
    },
    ...(product.averageRating !== null && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: product.averageRating,
        reviewCount: product.reviewCount,
      },
    }),
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      ...(item.href !== undefined && { item: item.href }),
    })),
  };

  // Escape </script> sequences to prevent stored XSS via JSON-LD injection
  // (JSON.stringify alone does not neutralize </script> in HTML context)
  const safeJsonLd = (obj: unknown): string =>
    JSON.stringify(obj).replace(/<\//g, '<\\/');

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbJsonLd) }}
      />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumbs items={breadcrumbs} />

        {/* Main product grid */}
        <div className="grid grid-cols-1 gap-x-12 gap-y-8 lg:grid-cols-2">
          {/* Images */}
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-gray-100">
            {product.imageUrl !== null ? (
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
                priority
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <span className="text-6xl text-gray-300">&#128247;</span>
              </div>
            )}
          </div>

          {/* Product info */}
          <div className="flex flex-col gap-6">
            {/* Category + Name */}
            <div>
              <span className="mb-2 inline-block rounded-full bg-gray-100 px-3 py-1 text-xs font-medium uppercase tracking-wide text-gray-600">
                {product.category}
              </span>
              <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>

              {/* Rating summary */}
              {product.averageRating !== null && (
                <div className="mt-2 flex items-center gap-2">
                  <StarRating rating={product.averageRating} />
                  <span className="text-sm text-gray-600">
                    {product.averageRating.toFixed(1)} ({product.reviewCount} review
                    {product.reviewCount !== 1 ? 's' : ''})
                  </span>
                </div>
              )}
            </div>

            {/* Description */}
            <p className="leading-relaxed text-gray-600">{product.description}</p>

            {/* Tags */}
            {product.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {product.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Add to cart (client component) */}
            <AddToCartSection product={product} />
          </div>
        </div>

        {/* Reviews section */}
        <div className="mt-16 grid grid-cols-1 gap-12 lg:grid-cols-2">
          <ReviewsList slug={slug} initial={reviews} />
          <ReviewForm productId={product.id} />
        </div>

        {/* Related products */}
        {product.relatedProducts.length > 0 && (
          <div className="mt-16">
            <RelatedProducts products={product.relatedProducts} />
          </div>
        )}
      </div>
    </>
  );
}
