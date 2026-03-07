import type { Metadata } from 'next';
import Link from 'next/link';
import { Providers } from '@/components/Providers';
import { CartNavIcon } from '@/components/cart/CartNavIcon';
import { AuthNavLinks } from '@/components/auth/AuthNavLinks';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'StyleAI Shop',
    template: '%s | StyleAI Shop',
  },
  description: 'Discover the latest fashion, curated by AI. Free shipping on orders over $50.',
  metadataBase: new URL(process.env['NEXT_PUBLIC_SITE_URL'] ?? 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    siteName: 'StyleAI Shop',
    title: 'StyleAI Shop',
    description: 'Discover the latest fashion, curated by AI.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'StyleAI Shop',
    description: 'Discover the latest fashion, curated by AI.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps): React.JSX.Element {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-gray-900">
        <Providers>
          <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/95 backdrop-blur">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
              <Link href="/" className="text-xl font-bold tracking-tight text-gray-900">
                StyleAI Shop
              </Link>
              <nav className="flex items-center gap-6">
                <Link
                  href="/products"
                  className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
                >
                  Products
                </Link>
                <Link
                  href="/support"
                  className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
                >
                  Support
                </Link>
                <AuthNavLinks />
                <CartNavIcon />
              </nav>
            </div>
          </header>
          <main>{children}</main>
          <footer className="mt-16 border-t border-gray-200 bg-gray-50 py-12">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <p className="text-center text-sm text-gray-500">
                &copy; {new Date().getFullYear()} StyleAI Shop. All rights reserved.
              </p>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
