'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiGetOrder } from '@/lib/auth-api';
import type { OrderDto } from '@/lib/auth-api';

export default function CheckoutSuccessPage(): React.JSX.Element {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const { token, user } = useAuth();
  const [order, setOrder] = useState<OrderDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) return;
    apiGetOrder(orderId, token ?? undefined)
      .then((o) => setOrder(o))
      .catch(() => setError('Could not load order details'));
  }, [orderId, token]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
      <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
        <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h1 className="mb-2 text-2xl font-bold text-gray-900">Order Confirmed!</h1>
      <p className="mb-6 text-gray-500">
        Thank you for your order. We&apos;ll send you updates as it progresses.
      </p>

      {orderId && (
        <p className="mb-4 text-sm text-gray-600">
          Order ID: <span className="font-mono font-medium text-gray-900">{orderId}</span>
        </p>
      )}

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {order && (
        <div className="mb-8 rounded-lg border border-gray-200 bg-white p-4 text-left">
          <h2 className="mb-3 text-sm font-semibold text-gray-700">Order Summary</h2>
          <ul className="space-y-1 text-sm text-gray-600">
            {order.items.map((item) => (
              <li key={item.id} className="flex justify-between">
                <span>{item.productName ?? item.productId} × {item.quantity}</span>
                <span>${item.total.toFixed(2)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 border-t border-gray-200 pt-3 flex justify-between text-sm font-semibold">
            <span>Total</span>
            <span>${order.total.toFixed(2)}</span>
          </div>
        </div>
      )}

      {/* Guest create-account prompt */}
      {user === null && (
        <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4 text-left">
          <p className="text-sm font-medium text-blue-900">Track your order</p>
          <p className="mt-1 text-sm text-blue-700">
            Create an account to track this order and view your order history.
          </p>
          <Link
            href="/register"
            className="mt-3 inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Create Account
          </Link>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        {user !== null && (
          <Link
            href="/account"
            className="rounded-lg bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-gray-700"
          >
            View Orders
          </Link>
        )}
        <Link
          href="/products"
          className="rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
