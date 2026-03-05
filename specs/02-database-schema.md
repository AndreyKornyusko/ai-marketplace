# Spec 02 — Database Schema

**Status:** DRAFT — fill in before Phase 1

**Implemented by:** db-agent
**Reviewed by:** spec-checker

---

## Extensions Required

```sql
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

## Tables

### products

```sql
CREATE TABLE products (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        VARCHAR(255) UNIQUE NOT NULL,
  sku         VARCHAR(100) UNIQUE NOT NULL,
  name        VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  price       DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  category    VARCHAR(100) NOT NULL,
  tags        TEXT[] NOT NULL DEFAULT '{}',
  image_url   TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### product_variants

```sql
CREATE TABLE product_variants (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name       VARCHAR(100) NOT NULL,  -- e.g. "Size", "Color"
  value      VARCHAR(100) NOT NULL,  -- e.g. "XL", "Red"
  price_delta DECIMAL(10, 2) NOT NULL DEFAULT 0,
  stock      INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  sku        VARCHAR(100) UNIQUE NOT NULL
);
```

### product_embeddings

```sql
CREATE TABLE product_embeddings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID UNIQUE NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  embedding   vector(1024),  -- voyage-3 dimensions
  metadata    JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX ON product_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

### users

Registration is optional. Guests can browse and checkout without an account.
Registered users gain: order history, saved contact details, saved delivery addresses.

```sql
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name     VARCHAR(255) NOT NULL,
  phone         VARCHAR(50),                              -- saved contact detail (optional)
  role          VARCHAR(50) NOT NULL DEFAULT 'customer',  -- customer | admin
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### user_addresses

Registered users can save multiple delivery addresses. One is marked as default.

```sql
CREATE TABLE user_addresses (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label       VARCHAR(100),               -- e.g. "Home", "Work" (optional, user-defined)
  full_name   VARCHAR(255) NOT NULL,      -- recipient name (may differ from account name)
  phone       VARCHAR(50),
  street      VARCHAR(255) NOT NULL,
  city        VARCHAR(100) NOT NULL,
  state       VARCHAR(100) NOT NULL,
  zip         VARCHAR(20) NOT NULL,
  country     VARCHAR(100) NOT NULL,
  is_default  BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enforce only one default address per user
CREATE UNIQUE INDEX idx_user_addresses_default
  ON user_addresses(user_id)
  WHERE is_default = true;
```

### orders

```sql
CREATE TYPE order_status AS ENUM (
  'PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'
);

CREATE TYPE payment_method AS ENUM ('COD', 'CARD', 'TRANSFER');
CREATE TYPE payment_status AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED');

CREATE TABLE orders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id),
  guest_email     VARCHAR(255),
  status          order_status NOT NULL DEFAULT 'PENDING',
  payment_method  payment_method NOT NULL,
  payment_status  payment_status NOT NULL DEFAULT 'PENDING',
  subtotal        DECIMAL(10, 2) NOT NULL,
  shipping_total  DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total           DECIMAL(10, 2) NOT NULL,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### order_items

```sql
CREATE TABLE order_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id  UUID NOT NULL REFERENCES products(id),
  variant_id  UUID REFERENCES product_variants(id),
  quantity    INTEGER NOT NULL CHECK (quantity > 0),
  unit_price  DECIMAL(10, 2) NOT NULL,  -- locked at time of order
  total       DECIMAL(10, 2) NOT NULL
);
```

### inventory_reservations

```sql
CREATE TYPE reservation_status AS ENUM ('ACTIVE', 'COMMITTED', 'RELEASED');

CREATE TABLE inventory_reservations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID NOT NULL REFERENCES products(id),
  order_id    UUID REFERENCES orders(id),
  quantity    INTEGER NOT NULL CHECK (quantity > 0),
  status      reservation_status NOT NULL DEFAULT 'ACTIVE',
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### support_tickets

```sql
CREATE TYPE ticket_status AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'ESCALATED');

CREATE TABLE support_tickets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id),
  guest_email     VARCHAR(255),
  order_id        UUID REFERENCES orders(id),
  conversation_id VARCHAR(255),
  subject         VARCHAR(255) NOT NULL,
  status          ticket_status NOT NULL DEFAULT 'OPEN',
  escalation_reason TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## Indexes

```sql
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_inventory_reservations_product_id ON inventory_reservations(product_id, status);
CREATE INDEX idx_user_addresses_user_id ON user_addresses(user_id);
```

## Prisma Model Mapping

All tables above must have corresponding Prisma models in `prisma/schema.prisma`.
Use `@map` to map camelCase Prisma fields to snake_case DB columns.

## Acceptance Criteria

1. All tables created without errors on fresh `prisma migrate dev`
2. pgvector extension loads and `vector(1024)` column accepts data
3. IVFFlat index created on `product_embeddings.embedding`
4. Seed script populates products and product_variants tables
5. All foreign key constraints enforced
6. All `CHECK` constraints enforced
7. `user_addresses` partial unique index enforces at most one `is_default = true` per user
8. `users.phone` is nullable (registration does not require a phone number)
