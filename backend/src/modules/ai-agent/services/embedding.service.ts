import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { VoyageAIClient } from 'voyageai';
import { PrismaService } from '../../../prisma/prisma.service';

export interface EmbeddingRecord {
  productId: string;
  content: string;
  embedding: number[];
  metadata: Record<string, unknown>;
}

export interface PolicyEntry {
  section: string;
  topic: string;
  content: string;
  metadata?: Record<string, unknown>;
}

export interface ProductForEmbedding {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  price: { toNumber(): number } | number;
  isActive: boolean;
  variants: Array<{ name: string; value: string; stock: number }>;
}

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);
  private readonly client: VoyageAIClient;
  private readonly BATCH_SIZE = 20;
  private readonly BATCH_DELAY_MS = 100;
  private readonly MAX_RETRIES = 3;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.client = new VoyageAIClient({
      apiKey: this.configService.getOrThrow<string>('VOYAGE_API_KEY'),
    });
  }

  async embedProduct(product: ProductForEmbedding): Promise<number[]> {
    const content = this.buildProductContent(product);
    const metadata = this.buildProductMetadata(product);
    const [vector] = await this.generateEmbeddings([content], 'document');
    await this.upsertProductEmbedding(product.id, content, vector, metadata);
    return vector;
  }

  async embedProducts(products: ProductForEmbedding[]): Promise<EmbeddingRecord[]> {
    const records: EmbeddingRecord[] = [];

    for (let i = 0; i < products.length; i += this.BATCH_SIZE) {
      const batch = products.slice(i, i + this.BATCH_SIZE);
      const contents = batch.map((p) => this.buildProductContent(p));
      const vectors = await this.generateEmbeddings(contents, 'document');

      for (let j = 0; j < batch.length; j++) {
        const product = batch[j];
        const vector = vectors[j];
        const content = contents[j];
        const metadata = this.buildProductMetadata(product);

        records.push({ productId: product.id, content, embedding: vector, metadata });

        this.logger.log(`Embedding ${i + j + 1}/${products.length}: ${product.name}`);
      }

      if (i + this.BATCH_SIZE < products.length) {
        await this.delay(this.BATCH_DELAY_MS);
      }
    }

    return records;
  }

  async embedPolicyEntry(entry: PolicyEntry): Promise<number[]> {
    const [vector] = await this.generateEmbeddings([entry.content], 'document');
    return vector;
  }

  async embedQuery(query: string): Promise<number[]> {
    const [vector] = await this.generateEmbeddings([query], 'query');
    return vector;
  }

  async upsertProductEmbedding(
    productId: string,
    content: string,
    embedding: number[],
    metadata: Record<string, unknown>,
  ): Promise<void> {
    this.assertFiniteEmbedding(embedding);
    const embeddingLiteral = `[${embedding.join(',')}]`;
    await this.prisma.$executeRaw`
      INSERT INTO product_embeddings (id, product_id, content, embedding, metadata, created_at, updated_at)
      VALUES (gen_random_uuid(), ${productId}::uuid, ${content}, ${embeddingLiteral}::vector, ${JSON.stringify(metadata)}::jsonb, NOW(), NOW())
      ON CONFLICT (product_id) DO UPDATE
        SET content    = EXCLUDED.content,
            embedding  = EXCLUDED.embedding,
            metadata   = EXCLUDED.metadata,
            updated_at = NOW()
    `;
  }

  async updateProductMetadata(
    productId: string,
    patch: Record<string, unknown>,
  ): Promise<void> {
    await this.prisma.$executeRaw`
      UPDATE product_embeddings
      SET metadata   = metadata || ${JSON.stringify(patch)}::jsonb,
          updated_at = NOW()
      WHERE product_id = ${productId}::uuid
    `;
  }

  async upsertPolicyEmbedding(
    entry: PolicyEntry,
    embedding: number[],
  ): Promise<void> {
    this.assertFiniteEmbedding(embedding);
    const embeddingLiteral = `[${embedding.join(',')}]`;
    const metadata = entry.metadata ?? {};
    await this.prisma.$executeRaw`
      INSERT INTO policy_embeddings (id, section, topic, content, embedding, metadata, created_at)
      VALUES (gen_random_uuid(), ${entry.section}, ${entry.topic}, ${entry.content}, ${embeddingLiteral}::vector, ${JSON.stringify(metadata)}::jsonb, NOW())
      ON CONFLICT (section, topic) DO NOTHING
    `;
  }

  private buildProductContent(product: ProductForEmbedding): string {
    return `${product.name}. ${product.description}. Category: ${product.category}. Tags: ${product.tags.join(', ')}.`;
  }

  private buildProductMetadata(product: ProductForEmbedding): Record<string, unknown> {
    const price =
      typeof product.price === 'number' ? product.price : product.price.toNumber();
    const sizesInStock = product.variants
      .filter((v) => v.stock > 0)
      .map((v) => v.value);
    const hasStock = sizesInStock.length > 0;
    const [category, subcategory] = product.category.split(' / ');

    const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);

    return {
      productId: product.id,
      name: product.name,
      price,
      stock: totalStock,
      category: category ?? product.category,
      subcategory: subcategory ?? '',
      tags: product.tags,
      sizesInStock,
      hasStock,
      isActive: product.isActive,
    };
  }

  private async generateEmbeddings(
    texts: string[],
    inputType: 'document' | 'query',
  ): Promise<number[][]> {
    let attempt = 0;
    while (attempt < this.MAX_RETRIES) {
      try {
        const response = await this.client.embed({
          model: 'voyage-3',
          input: texts,
          inputType,
        });
        return (response.data ?? []).map((d: { embedding?: number[] }) => d.embedding ?? []);
      } catch (err: unknown) {
        const status = (err as { status?: number }).status;
        if (status === 429 && attempt < this.MAX_RETRIES - 1) {
          const backoff = Math.pow(2, attempt) * 1000;
          this.logger.warn(`Rate limited — retrying in ${backoff}ms (attempt ${attempt + 1})`);
          await this.delay(backoff);
          attempt++;
        } else {
          throw err;
        }
      }
    }
    throw new ServiceUnavailableException('Embedding service temporarily unavailable — max retries exceeded');
  }

  private assertFiniteEmbedding(embedding: number[]): void {
    if (!embedding.every((n) => Number.isFinite(n))) {
      throw new ServiceUnavailableException('Invalid embedding: non-finite values detected');
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
