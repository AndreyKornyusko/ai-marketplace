'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { apiCreateOrder, apiGetAddresses } from '@/lib/auth-api';
import type { UserAddressDto } from '@/lib/auth-api';
import { CustomerInfoStep } from './CustomerInfoStep';
import { PaymentStep } from './PaymentStep';
import { ReviewStep } from './ReviewStep';

export interface CustomerInfo {
  fullName: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  saveAddress: boolean;
}

type Step = 1 | 2 | 3;

const STEP_LABELS: Record<Step, string> = {
  1: 'Customer Info',
  2: 'Payment',
  3: 'Review & Confirm',
};

export function CheckoutFlow(): React.JSX.Element {
  const { items, subtotal, clearCart } = useCart();
  const { user, token } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<Step>(1);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'CARD'>('COD');
  const [stripePaymentIntentId, setStripePaymentIntentId] = useState<string | undefined>();
  const [savedAddresses, setSavedAddresses] = useState<UserAddressDto[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (user && token) {
      apiGetAddresses(token)
        .then((addrs) => setSavedAddresses(addrs))
        .catch(() => {/* non-critical */});
    }
  }, [user, token]);

  useEffect(() => {
    if (items.length === 0) {
      router.push('/cart');
    }
  }, [items.length, router]);

  if (items.length === 0) {
    return <p className="text-gray-500">Redirecting to cart…</p>;
  }

  const handleStep1Complete = (info: CustomerInfo): void => {
    setCustomerInfo(info);
    setStep(2);
  };

  const handleStep2Complete = (method: 'COD' | 'CARD', intentId?: string): void => {
    setPaymentMethod(method);
    setStripePaymentIntentId(intentId);
    setStep(3);
  };

  const handleSubmitOrder = async (): Promise<void> => {
    if (!customerInfo) return;
    setSubmitting(true);
    setSubmitError(null);

    try {
      const result = await apiCreateOrder(
        {
          customerInfo: {
            fullName: customerInfo.fullName,
            email: customerInfo.email,
            phone: customerInfo.phone,
            address: {
              street: customerInfo.street,
              city: customerInfo.city,
              state: customerInfo.state,
              zip: customerInfo.zip,
              country: customerInfo.country,
            },
          },
          paymentMethod,
          stripePaymentIntentId,
          items: items.map((i) => ({
            productId: i.productId,
            variantId: i.variantId,
            quantity: i.quantity,
          })),
        },
        token ?? undefined,
      );

      clearCart();
      router.push(`/checkout/success?orderId=${result.orderId}`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Order submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* Step indicator */}
      <nav className="mb-8 flex items-center gap-2">
        {([1, 2, 3] as Step[]).map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                step === s
                  ? 'bg-gray-900 text-white'
                  : step > s
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-600'
              }`}
            >
              {step > s ? '✓' : s}
            </div>
            <span className={`text-sm ${step === s ? 'font-medium text-gray-900' : 'text-gray-500'}`}>
              {STEP_LABELS[s]}
            </span>
            {s < 3 && <span className="mx-2 text-gray-300">›</span>}
          </div>
        ))}
      </nav>

      {step === 1 && (
        <CustomerInfoStep
          user={user}
          savedAddresses={savedAddresses}
          onComplete={handleStep1Complete}
        />
      )}
      {step === 2 && (
        <PaymentStep
          items={items}
          subtotal={subtotal}
          token={token ?? undefined}
          onComplete={handleStep2Complete}
          onBack={() => setStep(1)}
        />
      )}
      {step === 3 && customerInfo && (
        <ReviewStep
          customerInfo={customerInfo}
          paymentMethod={paymentMethod}
          items={items}
          subtotal={subtotal}
          submitError={submitError}
          submitting={submitting}
          onSubmit={handleSubmitOrder}
          onBack={() => setStep(2)}
        />
      )}
    </div>
  );
}
