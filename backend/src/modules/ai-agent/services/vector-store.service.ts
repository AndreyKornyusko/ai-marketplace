import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { EmbeddingService } from './embedding.service';

export interface ProductSearchResult {
  productId: string;
  content: string;
  metadata: Record<string, unknown>;
  similarity: number;
}

export interface PolicySearchResult {
  id: string;
  section: string;
  topic: string;
  content: string;
  metadata: Record<string, unknown>;
  similarity: number;
}

export interface ProductSearchOptions {
  limit?: number;
  stockOnly?: boolean;
  category?: string;
  brand?: string;
}

@Injectable()
export class VectorStoreService {
  private readonly logger = new Logger(VectorStoreService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly embeddingService: EmbeddingService,
  ) {}

  async searchProducts(
    query: string,
    options: ProductSearchOptions = {},
  ): Promise<ProductSearchResult[]> {
    const { limit = 5, stockOnly = true, category, brand } = options;
    const embedding = await this.embeddingService.embedQuery(query);

    // Build WHERE clause using parameterised Prisma.sql fragments — user input is never interpolated via Prisma.raw
    let whereCondition = Prisma.sql`pe.embedding IS NOT NULL`;
    if (stockOnly) {
      whereCondition = Prisma.sql`${whereCondition} AND (pe.metadata->>'hasStock')::boolean = true`;
    }
    if (category !== undefined) {
      whereCondition = Prisma.sql`${whereCondition} AND pe.metadata->>'category' = ${category}`;
    }
    if (brand !== undefined) {
      // Pass as JSON array string — parameterised, not interpolated
      const brandJson = JSON.stringify([brand.toLowerCase()]);
      whereCondition = Prisma.sql`${whereCondition} AND pe.metadata->'tags' @> ${brandJson}::jsonb`;
    }

    // Validate embedding before injecting via Prisma.raw — all values must be finite floats
    this.assertFiniteEmbedding(embedding);
    const embeddingStr = `[${embedding.join(',')}]`;
    const embeddingRaw = Prisma.raw(`'${embeddingStr}'`);

    try {
      const rows = await this.prisma.$queryRaw<
        Array<{
          product_id: string;
          content: string;
          metadata: Record<string, unknown>;
          similarity: number;
        }>
      >`
        SELECT
          pe.product_id,
          pe.content,
          pe.metadata,
          1 - (pe.embedding <=> ${embeddingRaw}::vector) AS similarity
        FROM product_embeddings pe
        WHERE ${whereCondition}
        ORDER BY pe.embedding <=> ${embeddingRaw}::vector
        LIMIT ${limit}
      `;

      return rows.map((r) => ({
        productId: r.product_id,
        content: r.content,
        metadata: r.metadata,
        similarity: Number(r.similarity),
      }));
    } catch (err) {
      this.logger.error('searchProducts failed', err);
      throw err;
    }
  }

  async searchPolicies(
    query: string,
    options: { limit?: number; section?: string } = {},
  ): Promise<PolicySearchResult[]> {
    const { limit = 5, section } = options;
    const embedding = await this.embeddingService.embedQuery(query);

    let whereCondition = Prisma.sql`pe.embedding IS NOT NULL`;
    if (section !== undefined) {
      whereCondition = Prisma.sql`${whereCondition} AND pe.section = ${section}`;
    }

    this.assertFiniteEmbedding(embedding);
    const embeddingStr = `[${embedding.join(',')}]`;
    const embeddingRaw = Prisma.raw(`'${embeddingStr}'`);

    try {
      const rows = await this.prisma.$queryRaw<
        Array<{
          id: string;
          section: string;
          topic: string;
          content: string;
          metadata: Record<string, unknown>;
          similarity: number;
        }>
      >`
        SELECT
          pe.id,
          pe.section,
          pe.topic,
          pe.content,
          pe.metadata,
          1 - (pe.embedding <=> ${embeddingRaw}::vector) AS similarity
        FROM policy_embeddings pe
        WHERE ${whereCondition}
        ORDER BY pe.embedding <=> ${embeddingRaw}::vector
        LIMIT ${limit}
      `;

      return rows.map((r) => ({
        id: r.id,
        section: r.section,
        topic: r.topic,
        content: r.content,
        metadata: r.metadata,
        similarity: Number(r.similarity),
      }));
    } catch (err) {
      this.logger.error('searchPolicies failed', err);
      throw err;
    }
  }

  private assertFiniteEmbedding(embedding: number[]): void {
    if (!embedding.every((n) => Number.isFinite(n))) {
      throw new InternalServerErrorException('Invalid embedding: non-finite values detected');
    }
  }
}
