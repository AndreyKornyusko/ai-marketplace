'use client';

import { useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import type { CartItem } from '@/contexts/CartContext';
import { apiCreatePaymentIntent } from '@/lib/auth-api';

const SHIPPING_FLAT = 5.99;
const FREE_SHIPPING_THRESHOLD = 50;

const stripePromise = loadStripe(process.env['NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'] ?? '');

interface PaymentStepProps {
  items: CartItem[];
  subtotal: number;
  token: string | undefined;
  onComplete: (method: 'COD' | 'CARD', stripePaymentIntentId?: string) => void;
  onBack: () => void;
}

// Inner component — must be rendered inside <Elements>
function CardForm({
  onSuccess,
  onBack,
}: {
  onSuccess: (intentId: string) => void;
  onBack: () => void;
}): React.JSX.Element {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async (): Promise<void> => {
    if (!stripe || !elements) return;
    setProcessing(true);
    setError(null);

    const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.origin + '/checkout/success' },
      redirect: 'if_required',
    });

    if (stripeError) {
      setError(stripeError.message ?? 'Payment failed');
      setProcessing(false);
    } else if (paymentIntent) {
      onSuccess(paymentIntent.id);
    }
  };

  return (
    <div className="space-y-4">
      <PaymentElement />
      {error !== null && <p className="text-sm text-red-600">{error}</p>}
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
          onClick={handleConfirm}
          disabled={!stripe || processing}
          className="flex-1 rounded-lg bg-gray-900 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-700 disabled:opacity-60"
        >
          {processing ? 'Processing…' : 'Review Order'}
        </button>
      </div>
    </div>
  );
}

export function PaymentStep({
  items,
  subtotal,
  token,
  onComplete,
  onBack,
}: PaymentStepProps): React.JSX.Element {
  const [method, setMethod] = useState<'COD' | 'CARD'>('COD');
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loadingIntent, setLoadingIntent] = useState(false);
  const [intentError, setIntentError] = useState<string | null>(null);

  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT;
  const total = subtotal + shipping;

  useEffect(() => {
    if (method !== 'CARD') return;
    setLoadingIntent(true);
    setIntentError(null);
    setClientSecret(null);

    const cartItems = items.map((i) => ({
      productId: i.productId,
      variantId: i.variantId,
      quantity: i.quantity,
    }));

    apiCreatePaymentIntent(cartItems, token)
      .then((res) => { setClientSecret(res.clientSecret); })
      .catch(() => { setIntentError('Failed to initialize payment. Please try again.'); })
      .finally(() => { setLoadingIntent(false); });
  }, [method, items, token]);

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
            <dd>
              {shipping === 0 ? (
                <span className="text-green-600">Free</span>
              ) : (
                `$${shipping.toFixed(2)}`
              )}
            </dd>
          </div>
          <div className="flex justify-between border-t border-gray-200 pt-2 font-semibold">
            <dt>Total</dt>
            <dd>${total.toFixed(2)}</dd>
          </div>
        </dl>
      </section>

      {method === 'COD' && (
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
            onClick={() => onComplete('COD')}
            className="flex-1 rounded-lg bg-gray-900 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-700"
          >
            Review Order
          </button>
        </div>
      )}

      {method === 'CARD' && (
        <div>
          {loadingIntent && (
            <p className="text-sm text-gray-500">Initializing payment…</p>
          )}
          {intentError !== null && (
            <p className="text-sm text-red-600">{intentError}</p>
          )}
          {clientSecret !== null && (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <CardForm onSuccess={(id) => onComplete('CARD', id)} onBack={onBack} />
            </Elements>
          )}
        </div>
      )}
    </div>
  );
}
