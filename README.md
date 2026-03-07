# StyleAI Shop

AI-powered fashion marketplace built with Next.js 15, NestJS, PostgreSQL + pgvector, LangChain, and Stripe.

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 App Router + TypeScript + Tailwind CSS |
| Backend | NestJS + TypeScript + Prisma |
| Database | PostgreSQL 16 + pgvector |
| AI / Agents | LangChain (TS) + Claude claude-sonnet-4-6 + Voyage AI |
| Payments | Stripe |
| Monitoring | Langfuse |

## Prerequisites

- Node.js 20+
- PostgreSQL 16 with pgvector extension
- Stripe account (free)
- Voyage AI account (for embeddings)
- Anthropic API key

## Setup

### 1. Install dependencies

```bash
# Root (seed scripts)
npm install

# Backend
cd backend && npm install

# Frontend
cd frontend && npm install
```

### 2. Configure environment

Copy `.env.example` to `.env` and fill in all values:

```bash
cp .env.example .env
```

Key variables:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/aishop
JWT_SECRET=<long-random-string>
ANTHROPIC_API_KEY=sk-ant-...
VOYAGE_API_KEY=pa-...
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_API_URL=http://localhost:3001
PORT=3001
```

Create `frontend/.env.local` for Next.js (required — Next.js reads env from its own directory):

```bash
echo "NEXT_PUBLIC_API_URL=http://localhost:3001" > frontend/.env.local
echo "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_..." >> frontend/.env.local
```

### 3. Set up database

```bash
# Run migrations
npx prisma migrate deploy

# Seed products
npx prisma db seed
```

### 4. Start the project

```bash
# Backend (port 3001)
cd backend && npm run start:dev

# Frontend (port 3000) — in a separate terminal
cd frontend && npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Stripe Testing

### Test Cards

Use these card numbers in the checkout form (no real charges):

| Card number | Behavior |
|---|---|
| `4242 4242 4242 4242` | Payment succeeds |
| `4000 0025 0000 3155` | Requires 3D Secure authentication |
| `4000 0000 0000 9995` | Declined — insufficient funds |
| `4000 0000 0000 0002` | Declined — generic |

For all test cards:
- **Expiry**: any future date (e.g. `12/34`)
- **CVC**: any 3 digits (e.g. `123`)
- **ZIP**: any 5 digits (e.g. `12345`)

### Checkout Flow

1. Add products to cart
2. Proceed to checkout → fill in customer info
3. Select **Credit / Debit Card** — Stripe Elements form appears
4. Enter a test card number and click **Review Order**
5. Stripe confirms the payment, then the order is created
6. Select **Cash on Delivery** to skip card entry entirely

### View Test Payments

Go to [dashboard.stripe.com](https://dashboard.stripe.com) → ensure **Test mode** is ON (toggle in top-right) → Payments.

### Webhook Forwarding (optional)

To receive Stripe events (e.g. `payment_intent.succeeded`) locally:

```bash
brew install stripe/stripe-cli/stripe
stripe login
stripe listen --forward-to localhost:3001/webhooks/stripe
```

The CLI prints a `whsec_...` signing secret — add it to `.env`:

```env
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## Useful Commands

```bash
# Run DB migrations
npx prisma migrate dev

# Seed products
npx prisma db seed

# Seed vector embeddings (requires VOYAGE_API_KEY)
npx ts-node scripts/seed-embeddings.ts

# Type check
cd backend && npm run type-check
cd frontend && npm run type-check

# Lint
cd backend && npm run lint
cd frontend && npm run lint
```

## API

Backend API runs at `http://localhost:3001`.
Swagger docs: `http://localhost:3001/api/docs`
