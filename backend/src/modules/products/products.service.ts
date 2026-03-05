import { Injectable, Logger } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ProductsQueryDto, SortOption } from './dto/products-query.dto';
import { ProductSummaryDto } from './dto/product-summary.dto';
import { CategoryCountDto } from './dto/category-count.dto';
import {
  ProductsListResponseDto,
  ProductsMetaDto,
} from './dto/products-list-response.dto';

type ProductWithVariants = Prisma.ProductGetPayload<{
  include: { variants: true };
}>;

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ProductsQueryDto): Promise<ProductsListResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = { isActive: true };

    if (query.category !== undefined) {
      where.category = query.category;
    }

    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      where.price = {};
      if (query.minPrice !== undefined) {
        where.price.gte = new Prisma.Decimal(query.minPrice);
      }
      if (query.maxPrice !== undefined) {
        where.price.lte = new Prisma.Decimal(query.maxPrice);
      }
    }

    if (query.tags !== undefined && query.tags.length > 0) {
      where.tags = { hasSome: query.tags };
    }

    const orderBy = this.buildOrderBy(query.sort);

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: { variants: true },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.product.count({ where }),
    ]);

    const [priceAgg, categoryRows] = await Promise.all([
      this.prisma.product.aggregate({
        where: { isActive: true },
        _min: { price: true },
        _max: { price: true },
      }),
      this.prisma.product.findMany({
        where: { isActive: true },
        select: { category: true },
        distinct: ['category'],
      }),
    ]);

    const data = products.map((p) => this.toSummaryDto(p));

    const meta: ProductsMetaDto = {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      filters: {
        categories: categoryRows.map((r) => r.category),
        priceRange: {
          min: priceAgg._min.price !== null ? Number(priceAgg._min.price) : 0,
          max: priceAgg._max.price !== null ? Number(priceAgg._max.price) : 0,
        },
      },
    };

    return { data, meta };
  }

  async findCategories(): Promise<CategoryCountDto[]> {
    const groups = await this.prisma.product.groupBy({
      by: ['category'],
      where: { isActive: true },
      _count: { id: true },
      orderBy: { category: 'asc' },
    });

    return groups.map((g) =>
      plainToInstance(
        CategoryCountDto,
        { category: g.category, count: g._count.id },
        { excludeExtraneousValues: true },
      ),
    );
  }

  async findFeatured(): Promise<ProductSummaryDto[]> {
    const products = await this.prisma.product.findMany({
      where: { isActive: true },
      include: { variants: true },
      orderBy: { createdAt: 'desc' },
      take: 8,
    });

    return products.map((p) => this.toSummaryDto(p));
  }

  private toSummaryDto(product: ProductWithVariants): ProductSummaryDto {
    const stock = product.variants.reduce((sum, v) => sum + v.stock, 0);
    const isAvailable = stock > 0 && product.isActive;

    return plainToInstance(
      ProductSummaryDto,
      {
        id: product.id,
        slug: product.slug,
        name: product.name,
        price: Number(product.price),
        imageUrl: product.imageUrl ?? null,
        category: product.category,
        tags: product.tags,
        stock,
        isAvailable,
      },
      { excludeExtraneousValues: true },
    );
  }

  private buildOrderBy(
    sort: SortOption | undefined,
  ): Prisma.ProductOrderByWithRelationInput {
    switch (sort) {
      case SortOption.PRICE_ASC:
        return { price: 'asc' };
      case SortOption.PRICE_DESC:
        return { price: 'desc' };
      case SortOption.NEWEST:
        return { createdAt: 'desc' };
      case SortOption.POPULAR:
        return { orderItems: { _count: 'desc' } };
      default:
        return { createdAt: 'desc' };
    }
  }
}
