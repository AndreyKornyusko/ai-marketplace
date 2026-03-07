-- ─── Extensions ────────────────────────────────────────────────────────────
-- pgvector: required for vector(1024) embedding column
CREATE EXTENSION IF NOT EXISTS vector;

-- ─── Enums ──────────────────────────────────────────────────────────────────
CREATE TYPE "Role" AS ENUM ('CUSTOMER', 'ADMIN', 'SUPPORT');
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED');
CREATE TYPE "PaymentMethod" AS ENUM ('COD', 'CARD', 'TRANSFER');
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED');
CREATE TYPE "ReservationStatus" AS ENUM ('ACTIVE', 'COMMITTED', 'RELEASED');
CREATE TYPE "TicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'ESCALATED');

-- ─── Products ───────────────────────────────────────────────────────────────
CREATE TABLE "products" (
    "id"          UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug"        VARCHAR(255) NOT NULL,
    "sku"         VARCHAR(100) NOT NULL,
    "name"        VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "price"       DECIMAL(10,2) NOT NULL,
    "category"    VARCHAR(100) NOT NULL,
    "tags"        TEXT[] NOT NULL DEFAULT '{}',
    "image_url"   TEXT,
    "is_active"   BOOLEAN NOT NULL DEFAULT true,
    "created_at"  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"  TIMESTAMPTZ NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "products_price_check" CHECK ("price" >= 0)
);

CREATE UNIQUE INDEX "products_slug_key" ON "products"("slug");
CREATE UNIQUE INDEX "products_sku_key" ON "products"("sku");
CREATE INDEX "idx_products_category" ON "products"("category");
CREATE INDEX "idx_products_is_active" ON "products"("is_active");

-- ─── Product Variants ───────────────────────────────────────────────────────
CREATE TABLE "product_variants" (
    "id"          UUID NOT NULL DEFAULT gen_random_uuid(),
    "product_id"  UUID NOT NULL,
    "name"        VARCHAR(100) NOT NULL,
    "value"       VARCHAR(100) NOT NULL,
    "price_delta" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "stock"       INTEGER NOT NULL DEFAULT 0,
    "sku"         VARCHAR(100) NOT NULL,

    CONSTRAINT "product_variants_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "product_variants_product_id_fkey" FOREIGN KEY ("product_id")
        REFERENCES "products"("id") ON DELETE CASCADE,
    CONSTRAINT "product_variants_stock_check" CHECK ("stock" >= 0)
);

CREATE UNIQUE INDEX "product_variants_sku_key" ON "product_variants"("sku");

-- ─── Product Embeddings ─────────────────────────────────────────────────────
CREATE TABLE "product_embeddings" (
    "id"         UUID NOT NULL DEFAULT gen_random_uuid(),
    "product_id" UUID NOT NULL,
    "content"    TEXT NOT NULL,
    "embedding"  vector(1024),
    "metadata"   JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "product_embeddings_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "product_embeddings_product_id_fkey" FOREIGN KEY ("product_id")
        REFERENCES "products"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "product_embeddings_product_id_key" ON "product_embeddings"("product_id");

-- HNSW index for cosine similarity — works correctly at any dataset size unlike IVFFlat
CREATE INDEX ON "product_embeddings" USING hnsw ("embedding" vector_cosine_ops) WITH (m = 16, ef_construction = 64);

-- ─── Users ──────────────────────────────────────────────────────────────────
CREATE TABLE "users" (
    "id"            UUID NOT NULL DEFAULT gen_random_uuid(),
    "email"         VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "full_name"     VARCHAR(255) NOT NULL,
    "phone"         VARCHAR(50),
    "role"          "Role" NOT NULL DEFAULT 'CUSTOMER',
    "created_at"    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"    TIMESTAMPTZ NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- ─── User Addresses ─────────────────────────────────────────────────────────
CREATE TABLE "user_addresses" (
    "id"         UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id"    UUID NOT NULL,
    "label"      VARCHAR(100),
    "full_name"  VARCHAR(255) NOT NULL,
    "phone"      VARCHAR(50),
    "street"     VARCHAR(255) NOT NULL,
    "city"       VARCHAR(100) NOT NULL,
    "state"      VARCHAR(100) NOT NULL,
    "zip"        VARCHAR(20) NOT NULL,
    "country"    VARCHAR(100) NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "user_addresses_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "user_addresses_user_id_fkey" FOREIGN KEY ("user_id")
        REFERENCES "users"("id") ON DELETE CASCADE
);

-- Enforce at most one default address per user
CREATE UNIQUE INDEX "idx_user_addresses_default" ON "user_addresses"("user_id") WHERE "is_default" = true;
CREATE INDEX "idx_user_addresses_user_id" ON "user_addresses"("user_id");

-- ─── Orders ─────────────────────────────────────────────────────────────────
CREATE TABLE "orders" (
    "id"             UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id"        UUID,
    "guest_email"    VARCHAR(255),
    "status"         "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "payment_method" "PaymentMethod" NOT NULL,
    "payment_status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "subtotal"       DECIMAL(10,2) NOT NULL,
    "shipping_total" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total"          DECIMAL(10,2) NOT NULL,
    "notes"          TEXT,
    "created_at"     TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"     TIMESTAMPTZ NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id")
        REFERENCES "users"("id"),
    CONSTRAINT "orders_total_check" CHECK ("total" = "subtotal" + "shipping_total")
);

CREATE INDEX "idx_orders_user_id" ON "orders"("user_id");
CREATE INDEX "idx_orders_status" ON "orders"("status");

-- ─── Order Items ────────────────────────────────────────────────────────────
CREATE TABLE "order_items" (
    "id"         UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_id"   UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "variant_id" UUID,
    "quantity"   INTEGER NOT NULL,
    "unit_price" DECIMAL(10,2) NOT NULL,
    "total"      DECIMAL(10,2) NOT NULL,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id")
        REFERENCES "orders"("id") ON DELETE CASCADE,
    CONSTRAINT "order_items_product_id_fkey" FOREIGN KEY ("product_id")
        REFERENCES "products"("id") ON DELETE RESTRICT,
    CONSTRAINT "order_items_variant_id_fkey" FOREIGN KEY ("variant_id")
        REFERENCES "product_variants"("id"),
    CONSTRAINT "order_items_quantity_check" CHECK ("quantity" > 0),
    CONSTRAINT "order_items_unit_price_check" CHECK ("unit_price" > 0)
);

CREATE INDEX "idx_order_items_order_id" ON "order_items"("order_id");

-- ─── Inventory Reservations ─────────────────────────────────────────────────
CREATE TABLE "inventory_reservations" (
    "id"         UUID NOT NULL DEFAULT gen_random_uuid(),
    "product_id" UUID NOT NULL,
    "order_id"   UUID,
    "quantity"   INTEGER NOT NULL,
    "status"     "ReservationStatus" NOT NULL DEFAULT 'ACTIVE',
    "expires_at" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_reservations_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "inventory_reservations_product_id_fkey" FOREIGN KEY ("product_id")
        REFERENCES "products"("id"),
    CONSTRAINT "inventory_reservations_order_id_fkey" FOREIGN KEY ("order_id")
        REFERENCES "orders"("id") ON DELETE SET NULL,
    CONSTRAINT "inventory_reservations_quantity_check" CHECK ("quantity" > 0)
);

CREATE INDEX "idx_inventory_reservations_product_id" ON "inventory_reservations"("product_id", "status");
CREATE INDEX "idx_inventory_reservations_expires_at" ON "inventory_reservations"("expires_at");

-- ─── Support Tickets ────────────────────────────────────────────────────────
CREATE TABLE "support_tickets" (
    "id"               UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id"          UUID,
    "guest_email"      VARCHAR(255),
    "order_id"         UUID,
    "conversation_id"  VARCHAR(255),
    "subject"          VARCHAR(255) NOT NULL,
    "status"           "TicketStatus" NOT NULL DEFAULT 'OPEN',
    "escalation_reason" TEXT,
    "created_at"       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"       TIMESTAMPTZ NOT NULL,

    CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "support_tickets_user_id_fkey" FOREIGN KEY ("user_id")
        REFERENCES "users"("id"),
    CONSTRAINT "support_tickets_order_id_fkey" FOREIGN KEY ("order_id")
        REFERENCES "orders"("id") ON DELETE SET NULL
);
