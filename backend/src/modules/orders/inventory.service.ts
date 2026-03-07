import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

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
}
