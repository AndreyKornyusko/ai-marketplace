'use client';

import { useState } from 'react';
import type { ProductDetailDto, ProductVariantDto } from '@/lib/api';
import { useCart } from '@/contexts/CartContext';
import VariantSelector from './VariantSelector';

interface AddToCartSectionProps {
  product: ProductDetailDto;
}

export default function AddToCartSection({ product }: AddToCartSectionProps): React.JSX.Element {
  const { addItem } = useCart();
  const [selectedVariant, setSelectedVariant] = useState<ProductVariantDto | null>(
    product.variants.length === 1 ? (product.variants[0] ?? null) : null,
  );
  const [quantity, setQuantity] = useState(1);

  const effectiveStock =
    selectedVariant !== null ? selectedVariant.stock : product.stock;
  const maxQty = Math.min(effectiveStock, 10);
  const isOutOfStock = effectiveStock === 0 || !product.isAvailable;

  const variantRequired = product.variants.length > 1 && selectedVariant === null;
  const canAddToCart = !isOutOfStock && !variantRequired;

  const displayPrice =
    selectedVariant !== null
      ? product.price + selectedVariant.priceDelta
      : product.price;

  const handleAddToCart = (): void => {
    addItem({
      productId: product.id,
      variantId: selectedVariant?.id ?? null,
      name: product.name + (selectedVariant ? ` (${selectedVariant.value})` : ''),
      price: displayPrice,
      imageUrl: product.imageUrl,
      maxQuantity: maxQty,
      quantity,
    });
  };

  return (
    <div className="space-y-5">
      {/* Price */}
      <p className="text-3xl font-bold text-gray-900">${displayPrice.toFixed(2)}</p>

      {/* Variants */}
      {product.variants.length > 0 && (
        <VariantSelector
          variants={product.variants}
          selectedId={selectedVariant?.id ?? null}
          onSelect={setSelectedVariant}
        />
      )}

      {/* Stock indicator */}
      {isOutOfStock ? (
        <p className="text-sm font-medium text-red-600">Out of stock</p>
      ) : effectiveStock <= 5 ? (
        <p className="text-sm font-medium text-amber-600">Only {effectiveStock} left in stock</p>
      ) : (
        <p className="text-sm font-medium text-green-600">In stock</p>
      )}

      {/* Quantity + Add to Cart */}
      <div className="flex items-center gap-3">
        <div className="flex items-center rounded-md border border-gray-300">
          <button
            type="button"
            aria-label="Decrease quantity"
            disabled={quantity <= 1}
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="flex h-10 w-10 items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-40"
          >
            −
          </button>
          <span className="w-10 text-center text-sm font-medium">{quantity}</span>
          <button
            type="button"
            aria-label="Increase quantity"
            disabled={quantity >= maxQty}
            onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
            className="flex h-10 w-10 items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-40"
          >
            +
          </button>
        </div>

        <button
          type="button"
          disabled={!canAddToCart}
          onClick={handleAddToCart}
          className="flex-1 rounded-lg bg-gray-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {variantRequired ? 'Select an option' : isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
}
