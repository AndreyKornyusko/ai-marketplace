'use client';

import type React from 'react';
import Link from 'next/link';

interface InlineProduct {
  id: string;
  name: string;
  price: number;
  slug?: string;
  inStock?: boolean;
}

interface ProductCardInlineProps {
  product: InlineProduct;
}

export function ProductCardInline({ product }: ProductCardInlineProps): React.JSX.Element {
  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(product.price);

  const isInStock = product.inStock !== false;

  const cardContent = (
    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm hover:border-gray-300 transition-colors">
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium text-gray-900">{product.name}</span>
        <span className="text-sm text-gray-600">{formattedPrice}</span>
      </div>
      <span
        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
          isInStock ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
        }`}
      >
        {isInStock ? 'In Stock' : 'Out of Stock'}
      </span>
    </div>
  );

  if (product.slug) {
    return (
      <Link href={`/products/${product.slug}`} className="block">
        {cardContent}
      </Link>
    );
  }

  // No slug available — link to search by name
  return (
    <Link
      href={`/products?search=${encodeURIComponent(product.name)}`}
      className="block"
    >
      {cardContent}
    </Link>
  );
}
