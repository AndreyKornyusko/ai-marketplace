import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { PrismaService } from '../../prisma/prisma.service';
import { ProductSummaryDto } from '../products/dto/product-summary.dto';

export interface StockCheckItem {
  productId: string;
  variantId: string | null;
  quantity: number;
}

interface StockResult {
  productId: string;
  variantId: string | null;
  available: number;
  requested: number;
}

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(private readonly prisma: PrismaService) {}

  async checkBatch(items: StockCheckItem[]): Promise<void> {
    const failed: StockResult[] = [];

    for (const item of items) {
      if (item.variantId !== null) {
        const variant = await this.prisma.productVariant.findUnique({
          where: { id: item.variantId },
          select: { stock: true },
        });
        const available = variant?.stock ?? 0;
        if (available < item.quantity) {
          failed.push({
            productId: item.productId,
            variantId: item.variantId,
            available,
            requested: item.quantity,
          });
        }
      } else {
        const product = await this.prisma.product.findUnique({
          where: { id: item.productId },
          include: { variants: true },
        });
        const totalStock =
          product?.variants.reduce((sum, v) => sum + v.stock, 0) ?? 0;
        if (totalStock < item.quantity) {
          failed.push({
            productId: item.productId,
            variantId: null,
            available: totalStock,
            requested: item.quantity,
          });
        }
      }
    }

    if (failed.length > 0) {
      failed.forEach((f) => {
        this.logger.error('Stock reservation failed', {
          productId: f.productId,
          orderId: null,
          requestedQty: f.requested,
          availableQty: f.available,
        });
      });
      throw new ConflictException({ message: 'Insufficient stock', failed });
    }
  }

  async createReservations(
    orderId: string,
    items: StockCheckItem[],
  ): Promise<void> {
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min

    await this.prisma.inventoryReservation.createMany({
      data: items.map((item) => ({
        productId: item.productId,
        orderId,
        quantity: item.quantity,
        expiresAt,
      })),
    });
  }

  async getLowStockProducts(threshold: number): Promise<ProductSummaryDto[]> {
    // Fetch all active products with variants; filter in-memory to avoid raw SQL
    const products = await this.prisma.product.findMany({
      where: { isActive: true },
      include: { variants: true },
    });

    const lowStock = products.filter((p) => {
      const stock = p.variants.reduce((sum, v) => sum + v.stock, 0);
      return stock <= threshold;
    });

    return lowStock.map((p) => {
      const stock = p.variants.reduce((sum, v) => sum + v.stock, 0);
      return plainToInstance(
        ProductSummaryDto,
        {
          id: p.id,
          slug: p.slug,
          name: p.name,
          price: Number(p.price),
          imageUrl: p.imageUrl ?? null,
          category: p.category,
          tags: p.tags,
          stock,
          isAvailable: p.isActive && stock > 0,
        },
        { excludeExtraneousValues: true },
      );
    });
  }
}
