const API_BASE = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000';

export interface UserDto {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  role: string;
}

export interface AuthResponse {
  accessToken: string;
  user: UserDto;
}

export interface UserAddressDto {
  id: string;
  label: string | null;
  fullName: string;
  phone: string | null;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  isDefault: boolean;
  createdAt: string;
}

export interface OrderItemDto {
  id: string;
  productId: string;
  variantId: string | null;
  quantity: number;
  unitPrice: number;
  total: number;
  productName?: string;
  productImageUrl?: string | null;
}

export interface OrderDto {
  id: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  subtotal: number;
  shippingTotal: number;
  total: number;
  guestEmail: string | null;
  customerInfo?: {
    fullName: string;
    email: string;
    phone: string;
    address: {
      street: string;
      city: string;
      state: string;
      zip: string;
      country: string;
    };
  };
  createdAt: string;
  items: OrderItemDto[];
}

export interface CreateOrderResponse {
  orderId: string;
  status: string;
  paymentMethod: string;
  total: number;
}

export interface CreateOrderInput {
  customerInfo: {
    fullName: string;
    email: string;
    phone: string;
    address: {
      street: string;
      city: string;
      state: string;
      zip: string;
      country: string;
    };
  };
  paymentMethod: 'COD' | 'CARD';
  stripePaymentIntentId?: string;
  items: Array<{
    productId: string;
    variantId: string | null;
    quantity: number;
  }>;
}

export interface CreateAddressInput {
  label?: string;
  fullName: string;
  phone?: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  isDefault?: boolean;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function authHeaders(token: string): Record<string, string> {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

// ── Auth ───────────────────────────────────────────────────────────────────────

export async function apiRegister(
  email: string,
  password: string,
  fullName: string,
): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/api/v1/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, fullName }),
  });
  return handleResponse<AuthResponse>(res);
}

export async function apiLogin(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return handleResponse<AuthResponse>(res);
}

export async function apiGetMe(token: string): Promise<UserDto> {
  const res = await fetch(`${API_BASE}/api/v1/auth/me`, {
    headers: authHeaders(token),
  });
  return handleResponse<UserDto>(res);
}

// ── User Profile ───────────────────────────────────────────────────────────────

export async function apiUpdateProfile(
  token: string,
  data: { fullName?: string; phone?: string },
): Promise<UserDto> {
  const res = await fetch(`${API_BASE}/api/v1/users/me`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  return handleResponse<UserDto>(res);
}

export async function apiGetAddresses(token: string): Promise<UserAddressDto[]> {
  const res = await fetch(`${API_BASE}/api/v1/users/me/addresses`, {
    headers: authHeaders(token),
  });
  return handleResponse<UserAddressDto[]>(res);
}

export async function apiCreateAddress(
  token: string,
  data: CreateAddressInput,
): Promise<UserAddressDto> {
  const res = await fetch(`${API_BASE}/api/v1/users/me/addresses`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  return handleResponse<UserAddressDto>(res);
}

export async function apiUpdateAddress(
  token: string,
  id: string,
  data: Partial<CreateAddressInput>,
): Promise<UserAddressDto> {
  const res = await fetch(`${API_BASE}/api/v1/users/me/addresses/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  return handleResponse<UserAddressDto>(res);
}

export async function apiDeleteAddress(token: string, id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/v1/users/me/addresses/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  await handleResponse<{ success: true }>(res);
}

// ── Orders ─────────────────────────────────────────────────────────────────────

export async function apiCreateOrder(
  input: CreateOrderInput,
  token?: string,
): Promise<CreateOrderResponse> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}/api/v1/orders`, {
    method: 'POST',
    headers,
    body: JSON.stringify(input),
  });
  return handleResponse<CreateOrderResponse>(res);
}

export async function apiGetOrder(id: string, token?: string): Promise<OrderDto> {
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}/api/v1/orders/${encodeURIComponent(id)}`, { headers });
  return handleResponse<OrderDto>(res);
}

export async function apiListOrders(token: string, page = 1): Promise<{ data: OrderDto[]; total: number; page: number; totalPages: number }> {
  const res = await fetch(`${API_BASE}/api/v1/orders?page=${page}&limit=10`, {
    headers: authHeaders(token),
  });
  return handleResponse<{ data: OrderDto[]; total: number; page: number; totalPages: number }>(res);
}

export async function apiCreatePaymentIntent(
  cartItems: Array<{ productId: string; variantId: string | null; quantity: number }>,
  token?: string,
): Promise<{ clientSecret: string; amount: number }> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}/api/v1/orders/payment-intent`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ cartItems }),
  });
  return handleResponse<{ clientSecret: string; amount: number }>(res);
}
