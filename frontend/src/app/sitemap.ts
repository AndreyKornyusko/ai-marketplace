import type { MetadataRoute } from 'next';
import { fetchProducts } from '@/lib/api';

const SITE_URL = process.env['NEXT_PUBLIC_SITE_URL'] ?? 'http://localhost:3000';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let productEntries: MetadataRoute.Sitemap = [];

  try {
    const response = await fetchProducts({ limit: 100, page: 1 });
    productEntries = response.data.map((product) => ({
      url: `${SITE_URL}/products/${product.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

    // If there are more pages, fetch them
    if (response.meta.totalPages > 1) {
      const remainingPages = await Promise.all(
        Array.from({ length: response.meta.totalPages - 1 }, (_, i) =>
          fetchProducts({ limit: 100, page: i + 2 }),
        ),
      );
      const additionalEntries = remainingPages.flatMap((r) =>
        r.data.map((product) => ({
          url: `${SITE_URL}/products/${product.slug}`,
          lastModified: new Date(),
          changeFrequency: 'weekly' as const,
          priority: 0.8,
        })),
      );
      productEntries = [...productEntries, ...additionalEntries];
    }
  } catch {
    // If API is unavailable during build, continue with static routes only
  }

  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${SITE_URL}/products`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    ...productEntries,
  ];
}
