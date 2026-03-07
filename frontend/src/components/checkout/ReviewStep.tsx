'use client';

import type { CartItem } from '@/contexts/CartContext';
import type { CustomerInfo } from './CheckoutFlow';

const SHIPPING_FLAT = 5.99;
const FREE_SHIPPING_THRESHOLD = 50;

interface ReviewStepProps {
  customerInfo: CustomerInfo;
  paymentMethod: 'COD' | 'CARD';
  items: CartItem[];
  subtotal: number;
  submitError: string | null;
  submitting: boolean;
  onSubmit: () => void;
  onBack: () => void;
}

export function ReviewStep({
  customerInfo,
  paymentMethod,
  items,
  subtotal,
  submitError,
  submitting,
  onSubmit,
  onBack,
}: ReviewStepProps): React.JSX.Element {
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT;
  const total = subtotal + shipping;

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-gray-700">Shipping To</h2>
        <p className="text-sm text-gray-900">{customerInfo.fullName}</p>
        <p className="text-sm text-gray-600">{customerInfo.email} · {customerInfo.phone}</p>
        <p className="text-sm text-gray-600">
          {customerInfo.street}, {customerInfo.city}, {customerInfo.state} {customerInfo.zip},{' '}
          {customerInfo.country}
        </p>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-gray-700">Payment</h2>
        <p className="text-sm text-gray-900">
          {paymentMethod === 'COD' ? 'Cash on Delivery' : 'Credit / Debit Card'}
        </p>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-gray-700">Items</h2>
        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={`${item.productId}-${item.variantId ?? 'base'}`}
              className="flex justify-between text-sm"
            >
              <span className="text-gray-700">
                {item.name} × {item.quantity}
              </span>
              <span className="font-medium text-gray-900">
                ${(item.price * item.quantity).toFixed(2)}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-3 space-y-1 border-t border-gray-200 pt-3 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Shipping</span>
            <span>
              {shipping === 0 ? <span className="text-green-600">Free</span> : `$${shipping.toFixed(2)}`}
            </span>
          </div>
          <div className="flex justify-between font-semibold text-gray-900">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>
      </section>

      {submitError && (
        <p className="rounded-md bg-red-50 p-3 text-sm text-red-600">{submitError}</p>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={submitting}
          className="flex-1 rounded-lg border border-gray-300 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={submitting}
          className="flex-1 rounded-lg bg-gray-900 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-700 disabled:opacity-50"
        >
          {submitting ? 'Placing Order…' : 'Place Order'}
        </button>
      </div>
    </div>
  );
}
