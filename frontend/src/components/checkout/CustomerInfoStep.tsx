'use client';

import { useState } from 'react';
import type { UserDto, UserAddressDto } from '@/lib/auth-api';
import type { CustomerInfo } from './CheckoutFlow';

interface FieldProps {
  label: string;
  id: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  errors: Partial<Record<string, string>>;
}

function Field({
  label,
  id,
  value,
  onChange,
  type = 'text',
  required = true,
  errors,
}: FieldProps): React.JSX.Element {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        id={id}
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-900 ${
          errors[id] ? 'border-red-400 focus:border-red-400' : 'border-gray-300 focus:border-gray-900'
        }`}
      />
      {errors[id] && <p className="mt-1 text-xs text-red-600">{errors[id]}</p>}
    </div>
  );
}

interface CustomerInfoStepProps {
  user: UserDto | null;
  savedAddresses: UserAddressDto[];
  onComplete: (info: CustomerInfo) => void;
}

export function CustomerInfoStep({
  user,
  savedAddresses,
  onComplete,
}: CustomerInfoStepProps): React.JSX.Element {
  const defaultAddr = savedAddresses.find((a) => a.isDefault) ?? savedAddresses[0];

  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [selectedAddressId, setSelectedAddressId] = useState<string | 'new'>(
    defaultAddr ? defaultAddr.id : 'new',
  );
  const [street, setStreet] = useState(defaultAddr?.street ?? '');
  const [city, setCity] = useState(defaultAddr?.city ?? '');
  const [state, setState] = useState(defaultAddr?.state ?? '');
  const [zip, setZip] = useState(defaultAddr?.zip ?? '');
  const [country, setCountry] = useState(defaultAddr?.country ?? '');
  const [saveAddress, setSaveAddress] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  const handleAddressSelect = (id: string): void => {
    setSelectedAddressId(id);
    if (id !== 'new') {
      const addr = savedAddresses.find((a) => a.id === id);
      if (addr) {
        setStreet(addr.street);
        setCity(addr.city);
        setState(addr.state);
        setZip(addr.zip);
        setCountry(addr.country);
      }
    } else {
      setStreet('');
      setCity('');
      setState('');
      setZip('');
      setCountry('');
    }
  };

  const validate = (): boolean => {
    const errs: Partial<Record<string, string>> = {};
    if (!fullName.trim()) errs['fullName'] = 'Required';
    if (!email.trim()) errs['email'] = 'Required';
    if (!phone.trim()) errs['phone'] = 'Required';
    if (!street.trim()) errs['street'] = 'Required';
    if (!city.trim()) errs['city'] = 'Required';
    if (!state.trim()) errs['state'] = 'Required';
    if (!zip.trim()) errs['zip'] = 'Required';
    if (!country.trim()) errs['country'] = 'Required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (!validate()) return;
    onComplete({ fullName, email, phone, street, city, state, zip, country, saveAddress });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section>
        <h2 className="mb-4 text-base font-semibold text-gray-900">Contact Information</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Full Name" id="fullName" value={fullName} onChange={setFullName} errors={errors} />
          <Field label="Email" id="email" type="email" value={email} onChange={setEmail} errors={errors} />
          <Field label="Phone" id="phone" type="tel" value={phone} onChange={setPhone} errors={errors} />
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-base font-semibold text-gray-900">Shipping Address</h2>

        {savedAddresses.length > 0 && (
          <div className="mb-4">
            <label htmlFor="addressSelect" className="block text-sm font-medium text-gray-700">
              Saved Addresses
            </label>
            <select
              id="addressSelect"
              value={selectedAddressId}
              onChange={(e) => handleAddressSelect(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
            >
              {savedAddresses.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label ? `${a.label} — ` : ''}{a.street}, {a.city}
                  {a.isDefault ? ' (default)' : ''}
                </option>
              ))}
              <option value="new">Enter a new address</option>
            </select>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Street Address" id="street" value={street} onChange={setStreet} errors={errors} />
          </div>
          <Field label="City" id="city" value={city} onChange={setCity} errors={errors} />
          <Field label="State / Province" id="state" value={state} onChange={setState} errors={errors} />
          <Field label="ZIP / Postal Code" id="zip" value={zip} onChange={setZip} errors={errors} />
          <Field label="Country" id="country" value={country} onChange={setCountry} errors={errors} />
        </div>

        {user !== null && selectedAddressId === 'new' && (
          <label className="mt-3 flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={saveAddress}
              onChange={(e) => setSaveAddress(e.target.checked)}
              className="rounded border-gray-300"
            />
            Save this address to my account
          </label>
        )}
      </section>

      <button
        type="submit"
        className="w-full rounded-lg bg-gray-900 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-700"
      >
        Continue to Payment
      </button>
    </form>
  );
}
