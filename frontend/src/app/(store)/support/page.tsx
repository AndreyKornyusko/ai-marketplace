import type React from 'react';
import type { Metadata } from 'next';
import { SupportChat } from '@/components/support/SupportChat';

export const metadata: Metadata = {
  title: 'Customer Support | StyleAI Shop',
  description:
    'Get help with orders, products, shipping, and returns from our AI-powered support team.',
  openGraph: {
    title: 'Customer Support | StyleAI Shop',
    description:
      'Get help with orders, products, shipping, and returns from our AI-powered support team.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Customer Support | StyleAI Shop',
    description:
      'Get help with orders, products, shipping, and returns from our AI-powered support team.',
  },
};

export default function SupportPage(): React.JSX.Element {
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Customer Support</h1>
        <p className="mt-1 text-gray-500 text-sm">
          Ask our AI assistant about products, shipping, returns, or anything else.
        </p>
      </div>
      <SupportChat />
    </div>
  );
}
