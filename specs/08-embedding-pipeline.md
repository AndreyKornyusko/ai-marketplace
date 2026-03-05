# Spec 08 — Embedding Pipeline

**Status:** DRAFT

**Implemented by:** db-agent (schema), embedding-agent (pipeline)
**Reviewed by:** spec-checker

---

## Overview

Vector embedding pipeline for semantic product search and RAG.
All product data is embedded and stored in pgvector for retrieval by AI agents.

---

## Embedding Model

```
Model:       voyage-3 (via Anthropic API)
Dimensions:  1024
Input type:  document (for indexing), query (for retrieval)
```

---

## What to Embed

### Products

For each product, embed the following concatenated text:
```
{name}. {description}. Category: {category}. Tags: {tags.join(', ')}.
```

Metadata stored alongside vector:
```json
{
  "productId": "uuid",
  "name": "string",
  "price": 0.00,
  "stock": 0,
  "category": "string",
  "tags": ["string"],
  "isActive": true
}
```

### Policies & FAQ

For each FAQ entry and policy section, embed:
```
Q: {question}
A: {answer}
```

Stored in `policy_embeddings` table:
```json
{
  "section": "shipping | returns | faq",
  "topic": "string"
}
```

---

## Database Tables

### product_embeddings
(See spec-02 for full schema)
- `product_id` — FK to products (unique — one embedding per product)
- `content` — the text that was embedded
- `embedding` — `vector(1024)`
- `metadata` — JSONB

### policy_embeddings

```sql
CREATE TABLE policy_embeddings (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section   VARCHAR(100) NOT NULL,  -- shipping | returns | faq
  topic     VARCHAR(255) NOT NULL,
  content   TEXT NOT NULL,
  embedding vector(1024),
  metadata  JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX ON policy_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 10);
```

---

## EmbeddingService

```typescript
// src/modules/ai-agent/services/embedding.service.ts

@Injectable()
export class EmbeddingService {
  async embedProduct(product: Product): Promise<number[]>;
  async embedProducts(products: Product[]): Promise<EmbeddingRecord[]>;
  async embedPolicyEntry(entry: PolicyEntry): Promise<number[]>;
  async embedQuery(query: string): Promise<number[]>;
}
```

---

## Seed Script

Location: `scripts/seed-embeddings.ts`

Behavior:
1. Fetch all active products from DB
2. Generate embeddings in batches of 20
3. Upsert into `product_embeddings` (idempotent)
4. Fetch all policy entries from `specs/01-store-context.md`
5. Generate embeddings for all policy entries
6. Upsert into `policy_embeddings`
7. Print progress: `Embedding N/total: <name>`
8. Final verification: counts must match

---

## Re-index Triggers

| Trigger | Action |
|---------|--------|
| Product created | Auto-embed via `ProductCreatedEvent` |
| Product name/description updated | Re-embed via `ProductUpdatedEvent` |
| Product deactivated | Update metadata `isActive: false` (keep embedding) |
| Manual `/seed-embeddings` command | Full re-index (upsert — safe to re-run) |

## Event Handlers (NestJS)

```typescript
@OnEvent('product.created')
async handleProductCreated(event: ProductCreatedEvent): Promise<void> {
  await this.embeddingService.embedProduct(event.product);
}

@OnEvent('product.updated')
async handleProductUpdated(event: ProductUpdatedEvent): Promise<void> {
  if (event.fields.includes('name') || event.fields.includes('description')) {
    await this.embeddingService.embedProduct(event.product);
  }
}
```

---

## Rate Limiting

- Voyage-3 API: batch max 128 texts, max 120,000 tokens per minute
- Seed script: process in batches of 20 with 100ms delay between batches
- Retry on 429: exponential backoff (1s, 2s, 4s, max 3 attempts)

---

## Acceptance Criteria

1. Seed script runs without errors on fresh database
2. Embedding count matches product count after seeding
3. Policy embeddings created for all FAQ and policy sections
4. Product creation auto-triggers embedding
5. Product update re-embeds only when name/description changes
6. Semantic search returns relevant products (manual spot-check)
7. IVFFlat index exists and is used by query planner (`EXPLAIN ANALYZE`)
