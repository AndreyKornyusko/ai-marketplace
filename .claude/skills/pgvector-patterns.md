# pgvector Patterns — StyleAI Shop

Reference guide for database and embedding engineers.

## Setup

```sql
-- Enable extension (run once)
CREATE EXTENSION IF NOT EXISTS vector;
```

```prisma
// schema.prisma
model ProductEmbedding {
  id        String   @id @default(uuid())
  productId String   @unique
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  content   String                          // text that was embedded
  embedding Unsupported("vector(1024)")?   // voyage-3 dimensions
  metadata  Json                            // { price, stock, category, tags }
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("product_embeddings")
}
```

## Index Creation

```sql
-- IVFFlat (good for up to ~1M rows)
CREATE INDEX ON product_embeddings
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);   -- sqrt(row_count) is a good starting point

-- HNSW (better recall, more memory — for larger datasets)
CREATE INDEX ON product_embeddings
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
```

## Similarity Search

```typescript
// Cosine similarity (most common for embeddings)
async searchSimilar(
  embedding: number[],
  limit = 5,
  stockOnly = true
): Promise<SearchResult[]> {
  const stockFilter = stockOnly ? `AND (metadata->>'stock')::int > 0` : '';
  return this.prisma.$queryRaw<SearchResult[]>`
    SELECT
      pe.id,
      pe.product_id,
      pe.content,
      pe.metadata,
      1 - (pe.embedding <=> ${embedding}::vector) AS similarity
    FROM product_embeddings pe
    WHERE pe.embedding IS NOT NULL
      ${Prisma.raw(stockFilter)}
    ORDER BY pe.embedding <=> ${embedding}::vector
    LIMIT ${limit}
  `;
}
```

## Distance Operators

| Operator | Distance Type     | Use Case               |
|----------|-------------------|------------------------|
| `<=>`    | Cosine            | Semantic similarity    |
| `<->`    | Euclidean (L2)    | Spatial / image search |
| `<#>`    | Negative inner product | Dot product similarity |

Always use `<=>` (cosine) for text/semantic embeddings.

## Batch Insert

```typescript
async bulkUpsertEmbeddings(records: EmbeddingRecord[]): Promise<void> {
  const BATCH_SIZE = 20;
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map((r) =>
        this.prisma.$executeRaw`
          INSERT INTO product_embeddings (id, product_id, content, embedding, metadata)
          VALUES (${r.id}, ${r.productId}, ${r.content}, ${r.embedding}::vector, ${r.metadata}::jsonb)
          ON CONFLICT (product_id) DO UPDATE
            SET content = EXCLUDED.content,
                embedding = EXCLUDED.embedding,
                metadata = EXCLUDED.metadata,
                updated_at = NOW()
        `
      )
    );
  }
}
```

## Filtered Search (metadata JSON filtering)

```sql
-- Filter by category
SELECT id, content, 1 - (embedding <=> $1::vector) AS similarity
FROM product_embeddings
WHERE metadata->>'category' = 'shoes'
  AND (metadata->>'stock')::int > 0
ORDER BY embedding <=> $1::vector
LIMIT 5;
```

## Index Tuning

- Set `ivfflat.probes` higher for better recall at query time: `SET ivfflat.probes = 10;`
- Default `probes = 1` is fast but may miss results
- Recommended: `probes = sqrt(lists)` for balanced accuracy/speed
- Rebuild index after bulk inserts: `REINDEX INDEX <index_name>;`

## Verification Query

```sql
-- Check embedding completeness
SELECT
  (SELECT COUNT(*) FROM products) AS total_products,
  (SELECT COUNT(*) FROM product_embeddings WHERE embedding IS NOT NULL) AS embedded_products;
```
