/**
 * Seed Embeddings Script (spec-08)
 *
 * Usage:
 *   cd backend
 *   npx ts-node --project ../tsconfig.scripts.json ../scripts/seed-embeddings.ts
 *
 * Behavior:
 *   1. Fetch all active products from DB (with variants)
 *   2. Generate embeddings in batches of 20
 *   3. Upsert into product_embeddings (idempotent)
 *   4. Embed all policy/FAQ entries from specs/01-store-context.md
 *   5. Upsert into policy_embeddings
 *   6. Verify final counts
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { PrismaClient } from '@prisma/client';
import { VoyageAIClient } from 'voyageai';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const prisma = new PrismaClient();
const voyage = new VoyageAIClient({ apiKey: process.env['VOYAGE_API_KEY'] });

const BATCH_SIZE = 20;
const BATCH_DELAY_MS = 100;
const MAX_RETRIES = 3;

// ─── Types ───────────────────────────────────────────────────────────────────

interface ProductRow {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  price: { toNumber(): number };
  isActive: boolean;
  variants: Array<{ name: string; value: string; stock: number }>;
}

interface PolicyEntry {
  section: string;
  topic: string;
  content: string;
}

// ─── Embedding Helpers ────────────────────────────────────────────────────────

async function generateEmbeddings(
  texts: string[],
  inputType: 'document' | 'query',
): Promise<number[][]> {
  let attempt = 0;
  while (attempt < MAX_RETRIES) {
    try {
      const response = await voyage.embed({
        model: 'voyage-3',
        input: texts,
        inputType,
      });
      return (response.data ?? []).map((d: { embedding?: number[] }) => d.embedding ?? []);
    } catch (err: unknown) {
      const status = (err as { status?: number }).status;
      if (status === 429 && attempt < MAX_RETRIES - 1) {
        const backoff = Math.pow(2, attempt) * 1000;
        console.warn(`Rate limited — retrying in ${backoff}ms (attempt ${attempt + 1})`);
        await delay(backoff);
        attempt++;
      } else {
        throw err;
      }
    }
  }
  throw new Error('Max retries exceeded');
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Product Embedding ────────────────────────────────────────────────────────

function buildProductContent(product: ProductRow): string {
  return `${product.name}. ${product.description}. Category: ${product.category}. Tags: ${product.tags.join(', ')}.`;
}

function buildProductMetadata(product: ProductRow): Record<string, unknown> {
  const price = product.price.toNumber();
  const sizesInStock = product.variants.filter((v) => v.stock > 0).map((v) => v.value);
  const [category, subcategory] = product.category.split(' / ');

  return {
    productId: product.id,
    price,
    category: category ?? product.category,
    subcategory: subcategory ?? '',
    tags: product.tags,
    sizesInStock,
    hasStock: sizesInStock.length > 0,
    isActive: product.isActive,
  };
}

async function seedProductEmbeddings(products: ProductRow[]): Promise<void> {
  console.log(`\nEmbedding ${products.length} products...`);
  let embedded = 0;

  for (let i = 0; i < products.length; i += BATCH_SIZE) {
    const batch = products.slice(i, i + BATCH_SIZE);
    const contents = batch.map(buildProductContent);
    const vectors = await generateEmbeddings(contents, 'document');

    for (let j = 0; j < batch.length; j++) {
      const product = batch[j];
      const vector = vectors[j];
      const content = contents[j];
      const metadata = buildProductMetadata(product);
      const embeddingLiteral = `[${vector.join(',')}]`;

      console.log(`Embedding ${i + j + 1}/${products.length}: ${product.name}`);

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
    }

    if (i + BATCH_SIZE < products.length) {
      await delay(BATCH_DELAY_MS);
    }
  }

  console.log(`Products embedded: ${embedded}/${products.length}`);
}

// ─── Policy Embedding ─────────────────────────────────────────────────────────

function parsePolicyEntries(): PolicyEntry[] {
  const specPath = path.join(__dirname, '..', 'specs', '01-store-context.md');
  const raw = fs.readFileSync(specPath, 'utf-8');
  const entries: PolicyEntry[] = [];

  // Shipping policy
  const shippingMatch = raw.match(/### Shipping Policy\s*```([\s\S]*?)```/);
  if (shippingMatch) {
    const lines = shippingMatch[1]
      .trim()
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    for (const line of lines) {
      entries.push({
        section: 'shipping',
        topic: line.slice(0, 80),
        content: `Q: Shipping policy\nA: ${line}`,
      });
    }
  }

  // Return policy
  const returnMatch = raw.match(/### Return Policy\s*```([\s\S]*?)```/);
  if (returnMatch) {
    const lines = returnMatch[1]
      .trim()
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    for (const line of lines) {
      entries.push({
        section: 'returns',
        topic: line.slice(0, 80),
        content: `Q: Return policy\nA: ${line}`,
      });
    }
  }

  // FAQ entries
  const faqMatch = raw.match(/### FAQ\s*```([\s\S]*?)```/);
  if (faqMatch) {
    const faqText = faqMatch[1];
    const qaRegex = /Q: (.*?)\nA: ([\s\S]*?)(?=\nQ:|$)/g;
    let match: RegExpExecArray | null;
    while ((match = qaRegex.exec(faqText)) !== null) {
      const question = match[1].trim();
      const answer = match[2].trim();
      entries.push({
        section: 'faq',
        topic: question,
        content: `Q: ${question}\nA: ${answer}`,
      });
    }
  }

  return entries;
}

async function seedPolicyEmbeddings(entries: PolicyEntry[]): Promise<void> {
  console.log(`\nEmbedding ${entries.length} policy/FAQ entries...`);

  // Clear existing policy embeddings for clean re-seed
  await prisma.$executeRaw`TRUNCATE TABLE policy_embeddings`;

  for (let i = 0; i < entries.length; i += BATCH_SIZE) {
    const batch = entries.slice(i, i + BATCH_SIZE);
    const contents = batch.map((e) => e.content);
    const vectors = await generateEmbeddings(contents, 'document');

    for (let j = 0; j < batch.length; j++) {
      const entry = batch[j];
      const vector = vectors[j];
      const embeddingLiteral = `[${vector.join(',')}]`;

      console.log(`Policy ${i + j + 1}/${entries.length}: [${entry.section}] ${entry.topic.slice(0, 60)}`);

      await prisma.$executeRaw`
        INSERT INTO policy_embeddings (id, section, topic, content, embedding, metadata, created_at)
        VALUES (gen_random_uuid(), ${entry.section}, ${entry.topic}, ${entry.content}, ${embeddingLiteral}::vector, '{}'::jsonb, NOW())
      `;
    }

    if (i + BATCH_SIZE < entries.length) {
      await delay(BATCH_DELAY_MS);
    }
  }

  console.log(`Policy entries embedded: ${entries.length}`);
}

// ─── Verification ─────────────────────────────────────────────────────────────

async function verify(totalProducts: number, totalPolicies: number): Promise<void> {
  const [productCount, policyCount] = await Promise.all([
    prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) AS count FROM product_embeddings WHERE embedding IS NOT NULL
    `,
    prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) AS count FROM policy_embeddings WHERE embedding IS NOT NULL
    `,
  ]);

  const embeddedProducts = Number(productCount[0]?.count ?? 0);
  const embeddedPolicies = Number(policyCount[0]?.count ?? 0);
  const productMatch = embeddedProducts === totalProducts;
  const policyMatch = embeddedPolicies === totalPolicies;

  console.log('\n─── Verification ───────────────────────────────────────');
  console.log(`Products: ${embeddedProducts}/${totalProducts} — ${productMatch ? 'PASS' : 'FAIL'}`);
  console.log(`Policies: ${embeddedPolicies}/${totalPolicies} — ${policyMatch ? 'PASS' : 'FAIL'}`);
  console.log('────────────────────────────────────────────────────────');

  if (!productMatch || !policyMatch) {
    console.error('Verification FAILED — counts do not match');
    process.exit(1);
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('EMBEDDING AGENT — seed-embeddings.ts');
  console.log(`Model: voyage-3 (1024 dimensions)`);
  console.log(`Batch size: ${BATCH_SIZE}`);

  // 1. Fetch products
  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: { variants: true },
  });
  console.log(`\nFound ${products.length} active products`);

  // 2. Embed products
  await seedProductEmbeddings(products as unknown as ProductRow[]);

  // 3. Parse and embed policies
  const policyEntries = parsePolicyEntries();
  await seedPolicyEmbeddings(policyEntries);

  // 4. Verify
  await verify(products.length, policyEntries.length);

  console.log('\nEMBEDDING AGENT COMPLETE');
  console.log(`Products embedded: ${products.length} / ${products.length}`);
  console.log(`Embedding model: voyage-3 (1024 dimensions)`);
  console.log(`Vector table: product_embeddings, policy_embeddings`);
  console.log(`Index type: ivfflat (vector_cosine_ops)`);
  console.log(`Seed script: scripts/seed-embeddings.ts`);
  console.log(`Verification: COUNT matches yes`);
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
