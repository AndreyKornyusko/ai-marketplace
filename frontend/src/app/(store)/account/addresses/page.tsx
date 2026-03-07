'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import {
  apiGetAddresses,
  apiCreateAddress,
  apiUpdateAddress,
  apiDeleteAddress,
} from '@/lib/auth-api';
import type { UserAddressDto, CreateAddressInput } from '@/lib/auth-api';

const EMPTY_FORM: CreateAddressInput = {
  fullName: '',
  street: '',
  city: '',
  state: '',
  zip: '',
  country: '',
  isDefault: false,
};

export default function AddressesPage(): React.JSX.Element {
  const { user, token, isLoading } = useAuth();
  const router = useRouter();

  const [addresses, setAddresses] = useState<UserAddressDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<CreateAddressInput>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login?redirect=/account/addresses');
    }
  }, [user, isLoading, router]);

  const loadAddresses = (): void => {
    if (!token) return;
    setLoading(true);
    apiGetAddresses(token)
      .then((addrs) => setAddresses(addrs))
      .catch(() => setError('Failed to load addresses'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAddresses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleEdit = (addr: UserAddressDto): void => {
    setEditId(addr.id);
    setForm({
      label: addr.label ?? undefined,
      fullName: addr.fullName,
      phone: addr.phone ?? undefined,
      street: addr.street,
      city: addr.city,
      state: addr.state,
      zip: addr.zip,
      country: addr.country,
      isDefault: addr.isDefault,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string): Promise<void> => {
    if (!token) return;
    if (!confirm('Delete this address?')) return;
    try {
      await apiDeleteAddress(token, id);
      loadAddresses();
    } catch {
      setError('Failed to delete address');
    }
  };

  const handleSetDefault = async (id: string): Promise<void> => {
    if (!token) return;
    try {
      await apiUpdateAddress(token, id, { isDefault: true });
      loadAddresses();
    } catch {
      setError('Failed to update address');
    }
  };

  const handleSave = async (): Promise<void> => {
    if (!token) return;
    setSaving(true);
    try {
      if (editId) {
        await apiUpdateAddress(token, editId, form);
      } else {
        await apiCreateAddress(token, form);
      }
      setShowForm(false);
      setEditId(null);
      setForm(EMPTY_FORM);
      loadAddresses();
    } catch {
      setError('Failed to save address');
    } finally {
      setSaving(false);
    }
  };

  const handleFormChange = (field: keyof CreateAddressInput, value: string | boolean): void => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  if (isLoading || !user) {
    return <div className="py-16 text-center text-gray-500">Loading…</div>;
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/account" className="text-sm text-gray-500 hover:text-gray-900">
            ← Orders
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Saved Addresses</h1>
        </div>
        <button
          type="button"
          onClick={() => { setShowForm(true); setEditId(null); setForm(EMPTY_FORM); }}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700"
        >
          Add Address
        </button>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {loading ? (
        <div className="py-8 text-center text-gray-500">Loading…</div>
      ) : addresses.length === 0 && !showForm ? (
        <p className="text-gray-500">No saved addresses.</p>
      ) : (
        <div className="space-y-3">
          {addresses.map((addr) => (
            <div key={addr.id} className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex items-start justify-between">
                <div>
                  {addr.label && (
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      {addr.label}
                    </p>
                  )}
                  <p className="text-sm font-medium text-gray-900">{addr.fullName}</p>
                  <p className="text-sm text-gray-600">
                    {addr.street}, {addr.city}, {addr.state} {addr.zip}, {addr.country}
                  </p>
                  {addr.isDefault && (
                    <span className="mt-1 inline-block rounded-full bg-gray-900 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                      Default
                    </span>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <button
                    type="button"
                    onClick={() => handleEdit(addr)}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Edit
                  </button>
                  {!addr.isDefault && (
                    <button
                      type="button"
                      onClick={() => handleSetDefault(addr.id)}
                      className="text-xs text-gray-600 hover:text-gray-900"
                    >
                      Set default
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDelete(addr.id)}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="mt-6 rounded-lg border border-gray-300 bg-gray-50 p-4">
          <h2 className="mb-4 text-sm font-semibold text-gray-900">
            {editId ? 'Edit Address' : 'New Address'}
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {(
              [
                { id: 'label', label: 'Label (optional)', required: false },
                { id: 'fullName', label: 'Full Name' },
                { id: 'phone', label: 'Phone (optional)', required: false },
                { id: 'street', label: 'Street', colSpan: true },
                { id: 'city', label: 'City' },
                { id: 'state', label: 'State' },
                { id: 'zip', label: 'ZIP' },
                { id: 'country', label: 'Country' },
              ] as Array<{ id: keyof CreateAddressInput; label: string; required?: boolean; colSpan?: boolean }>
            ).map(({ id, label, required = true, colSpan }) => (
              <div key={id} className={colSpan ? 'sm:col-span-2' : ''}>
                <label htmlFor={`addr-${id}`} className="block text-xs font-medium text-gray-700">
                  {label}
                </label>
                <input
                  id={`addr-${id}`}
                  type="text"
                  required={required}
                  value={(form[id] as string) ?? ''}
                  onChange={(e) => handleFormChange(id, e.target.value)}
                  className="mt-0.5 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                />
              </div>
            ))}
            <div className="sm:col-span-2">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={form.isDefault ?? false}
                  onChange={(e) => handleFormChange('isDefault', e.target.checked)}
                  className="rounded border-gray-300"
                />
                Set as default address
              </label>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => { setShowForm(false); setEditId(null); }}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700 disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
