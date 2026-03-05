# Spec 05 — Cart & Checkout

**Status:** DRAFT

**Implemented by:** db-agent, backend-agent, frontend-agent
**Reviewed by:** spec-checker, backend-reviewer, frontend-reviewer, security-reviewer

---

## Cart (Client-Side State)

Cart state is managed client-side (localStorage + React context).
No cart table in the database — cart is only persisted on the client.

### Cart Item Shape

```typescript
interface CartItem {
  productId: string;
  variantId: string | null;
  name: string;
  price: number;         // locked at time of add-to-cart
  imageUrl: string | null;
  quantity: number;
  maxQuantity: number;   // from stock at time of add
}
```

### Cart Operations

- Add item (check stock availability before adding)
- Remove item
- Update quantity (clamp to maxQuantity)
- Clear cart
- Cart persists across page refreshes (localStorage)

---

## Checkout Flow

Checkout works for both guests and registered users. The behavior differs only in Step 1.

### Step 1 — Customer Info

**Guest behavior:**
- All fields entered manually
- After order confirmation: show optional "Create an account to track this order" prompt
  (single click — email already known, only needs a password)

**Registered user behavior:**
- Form pre-filled from `users` profile (full_name, email, phone)
- If the user has saved addresses: show address selector dropdown (default pre-selected)
- User can pick a saved address or enter a new one
- Checkbox: "Save this address to my account" (visible when entering a new address)

Collected fields (same for both paths):
- Full name
- Email
- Phone number (required for COD orders)
- Shipping address: street, city, state/province, zip, country

### Step 2 — Payment Method Selection

Two payment methods:

**COD (Cash on Delivery)**
- No payment processing at checkout
- Order created with `paymentMethod: COD, paymentStatus: PENDING`
- N8N `cod-confirmation` workflow triggered after order creation

**Card Payment**
- Stripe integration
- Client-side: Stripe Elements (`<CardElement>`)
- Backend: create PaymentIntent → return `clientSecret` → frontend confirms
- On confirmation: order created with `paymentStatus: PAID`

### Step 3 — Order Review & Confirm

- Summary of cart items with locked prices
- Shipping cost calculation
- Total price display
- Submit button

---

## Backend — Auth API

```
POST /api/v1/auth/register
  Auth: none
  Body: { email: string; password: string; fullName: string }
  Returns: { accessToken: string; user: UserDto }
  Notes: password min 8 chars, bcrypt hashed

POST /api/v1/auth/login
  Auth: none
  Body: { email: string; password: string }
  Returns: { accessToken: string; user: UserDto }

POST /api/v1/auth/logout
  Auth: required
  Returns: { success: true }

GET /api/v1/auth/me
  Auth: required
  Returns: UserDto (id, email, fullName, phone, role)
```

## Backend — User Profile API

```
PATCH /api/v1/users/me
  Auth: required
  Body: { fullName?: string; phone?: string }
  Returns: updated UserDto

GET /api/v1/users/me/addresses
  Auth: required
  Returns: UserAddressDto[]

POST /api/v1/users/me/addresses
  Auth: required
  Body: { label?, fullName, phone?, street, city, state, zip, country, isDefault? }
  Returns: created UserAddressDto

PATCH /api/v1/users/me/addresses/:id
  Auth: required
  Body: partial address fields + isDefault?
  Returns: updated UserAddressDto
  Notes: setting isDefault=true unsets previous default

DELETE /api/v1/users/me/addresses/:id
  Auth: required
  Returns: { success: true }
```

## Backend — Orders API

### Endpoints

```
POST /api/v1/orders
  Auth: optional (supports guest checkout with guest_email)
  Body: CreateOrderDto
  Returns: { orderId, status, paymentMethod, total }

GET /api/v1/orders/:id
  Auth: required OR guest token
  Returns: order with items

GET /api/v1/orders
  Auth: required (own orders only)
  Returns: paginated order history

POST /api/v1/orders/payment-intent
  Auth: optional
  Body: { cartItems: CartItemDto[] }
  Returns: { clientSecret: string, amount: number }
```

### CreateOrderDto

```typescript
{
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
  stripePaymentIntentId?: string;  // required for CARD
  items: Array<{
    productId: string;
    variantId: string | null;
    quantity: number;
  }>;
}
```

### Order Creation Logic

1. Validate all items — check stock via `InventoryService.checkBatch()`
2. Lock prices from DB (never trust client-submitted prices)
3. Create inventory reservations for all items
4. Create order + order_items in a single Prisma transaction
5. Trigger N8N notification workflow
6. Return order confirmation

### Stock Validation Rules

- If any item is out of stock: return `409 Conflict` with which items failed
- If requested quantity > available stock: return `409 Conflict`
- Prices are ALWAYS taken from DB, never from the request body

---

## Frontend — Cart & Checkout Pages

### Routes

- `/cart` — cart summary page
- `/checkout` — multi-step checkout form
- `/checkout/success?orderId=...` — order confirmation page
- `/login` — login form
- `/register` — registration form
- `/account` — order history (auth required — redirect to `/login` if not)
- `/account/addresses` — saved addresses management (auth required)

### Cart Page Requirements

1. List of cart items with image, name, variant, price, quantity controls
2. Remove item button
3. Order summary (subtotal, shipping estimate, total)
4. "Proceed to Checkout" button
5. Empty cart state with "Continue Shopping" link

### Checkout Page Requirements

1. Multi-step form (Step 1 info → Step 2 payment → Step 3 confirm)
2. Form validation with clear error messages
3. Payment method toggle (COD / Card)
4. Stripe Elements integration for card payment
5. Loading state during order submission
6. Redirect to `/checkout/success` on successful order
7. If authenticated: pre-fill Step 1 from user profile; show saved address selector
8. If authenticated + new address entered: show "Save this address" checkbox
9. If guest: show "Create account to track this order" prompt on `/checkout/success`

### Account Pages Requirements

- `/account` — list all past orders (status, date, total, items summary); link to order detail
- `/account/addresses` — list saved addresses; add / edit / delete; mark as default
- Both pages redirect unauthenticated users to `/login?redirect=<path>`

### SEO for Checkout

```typescript
export const metadata: Metadata = {
  title: 'Checkout | StyleAI Shop',
  robots: { index: false, follow: false },  // no-index checkout pages
};
```

---

## Acceptance Criteria

1. Cart persists across page refreshes
2. Stock is validated before order creation (not trusting client data)
3. Prices are locked from DB on order creation
4. COD order created with correct status
5. Card payment: PaymentIntent created, confirmed client-side, order created on success
6. Order confirmation page shows correct order details
7. Inventory reservation created for each order item
8. Order appears in user's order history (authenticated flow)
9. Guest checkout works without account (guest_email stored)
10. All form fields validated before submission
11. Registration works with email + password; password hashed with bcrypt
12. Login returns JWT; protected routes reject requests without valid token
13. Authenticated checkout pre-fills Step 1 from user profile
14. Authenticated checkout shows saved address selector when addresses exist
15. "Save this address" checkbox stores address to `user_addresses`
16. Setting a new default address unsets the previous default (partial unique index enforced)
17. `/account` requires auth and shows full order history
18. `/account/addresses` allows add / edit / delete / set-default
19. Guest sees "Create account" prompt on order confirmation page
20. No route in the store is blocked for unauthenticated users except `/account` pages
