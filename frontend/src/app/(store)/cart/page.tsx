'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/contexts/CartContext';
import type { CartItem } from '@/contexts/CartContext';

const SHIPPING_FLAT = 5.99;
const FREE_SHIPPING_THRESHOLD = 50;

function CartItemRow({ item }: { item: CartItem }): React.JSX.Element {
  const { removeItem, updateQuantity } = useCart();

  return (
    <div className="flex gap-4 py-4">
      <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
        {item.imageUrl ? (
          <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
        ) : (
          <div className="h-full w-full bg-gray-100" />
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">{item.name}</p>
            {item.variantId && (
              <p className="text-xs text-gray-500">Variant selected</p>
            )}
          </div>
          <p className="text-sm font-semibold text-gray-900">
            ${(item.price * item.quantity).toFixed(2)}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center rounded-md border border-gray-300">
            <button
              type="button"
              aria-label="Decrease quantity"
              disabled={item.quantity <= 1}
              onClick={() => updateQuantity(item.productId, item.variantId, item.quantity - 1)}
              className="flex h-8 w-8 items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-40"
            >
              −
            </button>
            <span className="w-8 text-center text-sm">{item.quantity}</span>
            <button
              type="button"
              aria-label="Increase quantity"
              disabled={item.quantity >= item.maxQuantity}
              onClick={() => updateQuantity(item.productId, item.variantId, item.quantity + 1)}
              className="flex h-8 w-8 items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-40"
            >
              +
            </button>
          </div>
          <button
            type="button"
            onClick={() => removeItem(item.productId, item.variantId)}
            className="text-xs text-red-500 hover:text-red-700"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CartPage(): React.JSX.Element {
  const { items, subtotal, clearCart } = useCart();
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : items.length > 0 ? SHIPPING_FLAT : 0;
  const total = subtotal + shipping;

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <h1 className="mb-4 text-2xl font-bold text-gray-900">Your cart is empty</h1>
        <p className="mb-8 text-gray-500">Add some items to get started.</p>
        <Link
          href="/products"
          className="inline-block rounded-lg bg-gray-900 px-6 py-3 text-sm font-semibold text-white hover:bg-gray-700"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Shopping Cart</h1>

      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Items */}
        <div className="flex-1">
          <div className="divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white p-4">
            {items.map((item) => (
              <CartItemRow
                key={`${item.productId}-${item.variantId ?? 'base'}`}
                item={item}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={clearCart}
            className="mt-3 text-sm text-red-500 hover:text-red-700"
          >
            Clear cart
          </button>
        </div>

        {/* Summary */}
        <div className="w-full lg:w-72">
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-base font-semibold text-gray-900">Order Summary</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-600">Subtotal</dt>
                <dd className="font-medium">${subtotal.toFixed(2)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Shipping</dt>
                <dd className="font-medium">
                  {shipping === 0 ? (
                    <span className="text-green-600">Free</span>
                  ) : (
                    `$${shipping.toFixed(2)}`
                  )}
                </dd>
              </div>
              {subtotal < FREE_SHIPPING_THRESHOLD && (
                <p className="text-xs text-gray-500">
                  Add ${(FREE_SHIPPING_THRESHOLD - subtotal).toFixed(2)} more for free shipping
                </p>
              )}
              <div className="border-t border-gray-200 pt-2 flex justify-between font-semibold">
                <dt>Total</dt>
                <dd>${total.toFixed(2)}</dd>
              </div>
            </dl>
            <Link
              href="/checkout"
              className="mt-6 block w-full rounded-lg bg-gray-900 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-gray-700"
            >
              Proceed to Checkout
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
