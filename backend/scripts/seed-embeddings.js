#!/usr/bin/env node
// Seed product embeddings into pgvector.
// Usage: node scripts/seed-embeddings.js
// Loads env from ../../.env (repo root) then backend/.env

const path = require('path');
const fs = require('fs');

// Load .env files — root first, then backend (backend overrides root)
function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim().replace(/^['"]|['"]$/g, '');
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnv(path.resolve(__dirname, '../../.env'));
loadEnv(path.resolve(__dirname, '../.env'));

const { PrismaClient } = require('@prisma/client');
const { VoyageAIClient } = require('voyageai');

const BATCH_SIZE = 20;
const BATCH_DELAY_MS = 200;
const MODEL = 'voyage-3';

const prisma = new PrismaClient();
const voyage = new VoyageAIClient({ apiKey: process.env.VOYAGE_API_KEY });

function buildContent(product) {
  const tags = Array.isArray(product.tags) ? product.tags.join(', ') : '';
  return `${product.name}. ${product.description}. Category: ${product.category}. Tags: ${tags}.`;
}

function buildMetadata(product) {
  const price = typeof product.price === 'object' ? Number(product.price) : product.price;
  const variants = product.variants ?? [];
  const sizesInStock = variants.filter((v) => v.stock > 0).map((v) => v.value);
  const hasStock = sizesInStock.length > 0;
  const [category, subcategory] = (product.category ?? '').split(' / ');
  const totalStock = variants.reduce((s, v) => s + v.stock, 0);
  return {
    productId: product.id,
    name: product.name,
    price,
    stock: totalStock,
    category: category ?? product.category,
    subcategory: subcategory ?? '',
    tags: product.tags ?? [],
    sizesInStock,
    hasStock,
    isActive: product.isActive,
  };
}

async function generateEmbeddings(texts, inputType) {
  const response = await voyage.embed({ model: MODEL, input: texts, inputType });
  return (response.data ?? []).map((d) => d.embedding ?? []);
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const voyageKey = process.env.VOYAGE_API_KEY;
  if (!voyageKey) {
    console.error('ERROR: VOYAGE_API_KEY is not set');
    process.exit(1);
  }

  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: { variants: { select: { name: true, value: true, stock: true } } },
  });

  console.log(`Found ${products.length} active products to embed`);

  let embedded = 0;
  for (let i = 0; i < products.length; i += BATCH_SIZE) {
    const batch = products.slice(i, i + BATCH_SIZE);
    const contents = batch.map(buildContent);

    const vectors = await generateEmbeddings(contents, 'document');

    for (let j = 0; j < batch.length; j++) {
      const product = batch[j];
      const vector = vectors[j];
      const content = contents[j];
      const metadata = buildMetadata(product);
      const embeddingLiteral = `[${vector.join(',')}]`;

      await prisma.$executeRaw`
        INSERT INTO product_embeddings (id, product_id, content, embedding, metadata, created_at, updated_at)
        VALUES (gen_random_uuid(), ${product.id}::uuid, ${content}, ${embeddingLiteral}::vector, ${JSON.stringify(metadata)}::jsonb, NOW(), NOW())
        ON CONFLICT (product_id) DO UPDATE
          SET content    = EXCLUDED.content,
              embedding  = EXCLUDED.embedding,
              metadata   = EXCLUDED.metadata,
              updated_at = NOW()
      `;

      embedded++;
      console.log(`Embedding ${embedded}/${products.length}: ${product.name}`);
    }

    if (i + BATCH_SIZE < products.length) {
      await delay(BATCH_DELAY_MS);
    }
  }

  // Verify
  const [embCount] = await prisma.$queryRaw`SELECT COUNT(*)::int as count FROM product_embeddings`;
  console.log(`\nSEED EMBEDDINGS COMPLETE`);
  console.log(`Products embedded: ${embedded} / ${products.length}`);
  console.log(`Embedding model:   ${MODEL}`);
  console.log(`DB count:          ${embCount.count}`);
  console.log(`Verification:      ${embCount.count >= products.length ? 'PASS' : 'FAIL'}`);
}

main()
  .catch((err) => { console.error('Seed failed:', err); process.exit(1); })
  .finally(() => prisma.$disconnect());
