'use client';

import { useState } from 'react';
import type { CartItem } from '@/contexts/CartContext';

const SHIPPING_FLAT = 5.99;
const FREE_SHIPPING_THRESHOLD = 50;

interface PaymentStepProps {
  items: CartItem[];
  subtotal: number;
  token: string | undefined;
  onComplete: (method: 'COD' | 'CARD', stripePaymentIntentId?: string) => void;
  onBack: () => void;
}

export function PaymentStep({
  subtotal,
  onComplete,
  onBack,
}: PaymentStepProps): React.JSX.Element {
  const [method, setMethod] = useState<'COD' | 'CARD'>('COD');
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT;
  const total = subtotal + shipping;

  const handleContinue = (): void => {
    // For CARD: in a real integration the Stripe PaymentIntent would be confirmed here
    // and its ID passed to onComplete. For now COD goes straight through,
    // CARD shows a placeholder until Stripe Elements is wired with a real publishable key.
    onComplete(method);
  };

  return (
    <div className="space-y-6">
      <section>
        <h2 className="mb-4 text-base font-semibold text-gray-900">Payment Method</h2>
        <div className="space-y-3">
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-300 p-4 hover:border-gray-400 has-[:checked]:border-gray-900 has-[:checked]:bg-gray-50">
            <input
              type="radio"
              name="paymentMethod"
              value="COD"
              checked={method === 'COD'}
              onChange={() => setMethod('COD')}
              className="mt-0.5"
            />
            <div>
              <p className="text-sm font-medium text-gray-900">Cash on Delivery</p>
              <p className="text-xs text-gray-500">Pay when your order arrives</p>
            </div>
          </label>

          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-300 p-4 hover:border-gray-400 has-[:checked]:border-gray-900 has-[:checked]:bg-gray-50">
            <input
              type="radio"
              name="paymentMethod"
              value="CARD"
              checked={method === 'CARD'}
              onChange={() => setMethod('CARD')}
              className="mt-0.5"
            />
            <div>
              <p className="text-sm font-medium text-gray-900">Credit / Debit Card</p>
              <p className="text-xs text-gray-500">Secured by Stripe</p>
            </div>
          </label>
        </div>

        {method === 'CARD' && (
          <div className="mt-4 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4">
            <p className="text-sm text-gray-500">
              Stripe card element will appear here once{' '}
              <code className="rounded bg-gray-100 px-1 text-xs">NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code>{' '}
              is configured.
            </p>
          </div>
        )}
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-gray-700">Order Total</h2>
        <dl className="space-y-1 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-600">Subtotal</dt>
            <dd>${subtotal.toFixed(2)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-600">Shipping</dt>
            <dd>{shipping === 0 ? <span className="text-green-600">Free</span> : `$${shipping.toFixed(2)}`}</dd>
          </div>
          <div className="flex justify-between border-t border-gray-200 pt-2 font-semibold">
            <dt>Total</dt>
            <dd>${total.toFixed(2)}</dd>
          </div>
        </dl>
      </section>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 rounded-lg border border-gray-300 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleContinue}
          className="flex-1 rounded-lg bg-gray-900 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-700"
        >
          Review Order
        </button>
      </div>
    </div>
  );
}
