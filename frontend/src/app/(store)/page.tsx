import type { Metadata } from 'next';
import Link from 'next/link';
import FeaturedGrid from '@/components/catalog/FeaturedGrid';
import { fetchFeaturedProducts } from '@/lib/api';

export const metadata: Metadata = {
  title: 'StyleAI Shop — AI-Curated Fashion',
  description:
    'Discover the latest fashion, curated by AI. Thousands of products, personalised for you. Free shipping on orders over $50.',
  openGraph: {
    title: 'StyleAI Shop — AI-Curated Fashion',
    description: 'Discover the latest fashion, curated by AI. Free shipping on orders over $50.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'StyleAI Shop — AI-Curated Fashion',
    description: 'Discover the latest fashion, curated by AI.',
  },
};

export default async function HomePage(): Promise<React.JSX.Element> {
  let featuredProducts = await fetchFeaturedProducts().catch(() => []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Hero */}
      <section className="mb-16 text-center">
        <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
          Fashion, Curated by AI
        </h1>
        <p className="mx-auto mb-8 max-w-2xl text-lg text-gray-600">
          Thousands of styles, filtered to fit your taste. Discover your next favourite piece today.
        </p>
        <Link
          href="/products"
          className="inline-flex items-center rounded-lg bg-gray-900 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
        >
          Shop All Products
        </Link>
      </section>

      {/* Featured Products */}
      <section>
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Featured Products</h2>
          <Link
            href="/products"
            className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
          >
            View all &rarr;
          </Link>
        </div>
        <FeaturedGrid products={featuredProducts} />
      </section>

      {/* Value props */}
      <section className="mt-20 grid grid-cols-1 gap-8 sm:grid-cols-3">
        {[
          { title: 'Free Shipping', body: 'On all orders over $50. No minimum for members.' },
          { title: 'Easy Returns', body: '30-day hassle-free returns on all items.' },
          { title: 'AI Styling', body: 'Personalised recommendations powered by Claude.' },
        ].map((prop) => (
          <div key={prop.title} className="rounded-xl border border-gray-200 bg-gray-50 p-6">
            <h3 className="mb-2 font-semibold text-gray-900">{prop.title}</h3>
            <p className="text-sm text-gray-600">{prop.body}</p>
          </div>
        ))}
      </section>

      {/* Support CTA */}
      <section className="mt-12 rounded-xl bg-blue-50 border border-blue-100 px-8 py-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Need help?</h2>
          <p className="mt-1 text-sm text-gray-600">
            Our AI support assistant can answer questions about products, orders, shipping, and returns.
          </p>
        </div>
        <Link
          href="/support"
          className="shrink-0 inline-flex items-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
        >
          Chat with Support
        </Link>
      </section>
    </div>
  );
}
