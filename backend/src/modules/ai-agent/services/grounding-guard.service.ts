import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

export interface GroundedProductFact {
  id: string;
  name: string;
  price: number;
  stock: number;
  isAvailable: boolean;
}

export interface OrderIntent {
  productId: string;
  quantity: number;
  expectedPrice: number;
}

export type ValidationResult =
  | { valid: true; groundedFacts: GroundedProductFact }
  | { valid: false; reason: string };

@Injectable()
export class GroundingGuardService {
  constructor(private readonly prisma: PrismaService) {}

  async validateProductFacts(productIds: string[]): Promise<GroundedProductFact[]> {
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        name: true,
        price: true,
        isActive: true,
        variants: { select: { stock: true } },
      },
    });

    return products.map((p) => {
      const stock = p.variants.reduce((s, v) => s + v.stock, 0);
      return {
        id: p.id,
        name: p.name,
        price: Number(p.price),
        stock,
        isAvailable: p.isActive && stock > 0,
      };
    });
  }

  async validateOrderIntent(intent: OrderIntent): Promise<ValidationResult> {
    const facts = await this.validateProductFacts([intent.productId]);
    const product = facts[0];

    if (!product) {
      return { valid: false, reason: 'Product not found in catalog' };
    }
    if (!product.isAvailable) {
      return { valid: false, reason: `${product.name} is currently out of stock` };
    }
    if (intent.quantity > product.stock) {
      return {
        valid: false,
        reason: `Only ${product.stock} units available, requested ${intent.quantity}`,
      };
    }
    if (Math.abs(intent.expectedPrice - product.price) > 0.01) {
      return {
        valid: false,
        reason: `Price mismatch: DB has $${product.price}, agent quoted $${intent.expectedPrice}`,
      };
    }
    return { valid: true, groundedFacts: product };
  }
}
