# /seed-embeddings

Generates and stores embeddings for the full product catalog in pgvector.

## Usage

```
/seed-embeddings
```

## Orchestrator Instructions

### Step 1 — Gather Context

Read:
1. `specs/08-embedding-pipeline.md` — embedding strategy and model config
2. `specs/01-store-context.md` — CATALOG_SPEC (source of truth for products)
3. `prisma/schema.prisma` — confirm vector column exists and has correct dimensions
4. `src/modules/ai-agent/services/embedding.service.ts` — current implementation

### Step 2 — Pre-flight Checks

Verify before running:
- pgvector extension is enabled: `SELECT * FROM pg_extension WHERE extname = 'vector';`
- `product_embeddings` table exists with correct vector dimensions
- Embedding model is configured (check `.env` for API key)
- Products table has data (run `SELECT COUNT(*) FROM products;`)

If any pre-flight fails: output the failure and stop. Do not proceed.

### Step 3 — Invoke embedding-agent

Pass:
- Full content of `specs/08-embedding-pipeline.md`
- Full content of `specs/01-store-context.md`
- Current `embedding.service.ts` content
- Current `prisma/schema.prisma` content
- Pre-flight check results

### Step 4 — Run Seed Script

```bash
npx ts-node scripts/seed-embeddings.ts
```

Monitor output for progress: `Embedding N/total: <product-name>`

### Step 5 — Verify

```bash
psql $DATABASE_URL -c "SELECT COUNT(*) FROM product_embeddings;"
psql $DATABASE_URL -c "SELECT COUNT(*) FROM products;"
```

Counts must match. If not: output mismatch and re-run embedding-agent for missing products.

### Step 6 — Report

```
SEED EMBEDDINGS COMPLETE
Products embedded: N / N
Embedding model: [name]
Vector dimensions: N
Index: [type + parameters]
Verification: PASS | FAIL
```
