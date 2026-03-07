import { Test, TestingModule } from '@nestjs/testing';
import { GroundingGuardService, GroundedProductFact, ValidationResult } from './grounding-guard.service';
import { PrismaService } from '../../../prisma/prisma.service';

// ---------------------------------------------------------------------------
// Prisma mock types
// ---------------------------------------------------------------------------

type MockVariant = { stock: number };

type MockProduct = {
  id: string;
  name: string;
  price: number; // Prisma Decimal — Number() coercion tested via plain number
  isActive: boolean;
  variants: MockVariant[];
};

function buildPrismaMock(): { product: { findMany: jest.Mock } } {
  return {
    product: {
      findMany: jest.fn(),
    },
  };
}

type PrismaMock = ReturnType<typeof buildPrismaMock>;

// ---------------------------------------------------------------------------
// Factory helpers
// ---------------------------------------------------------------------------

function makeDbProduct(overrides: Partial<MockProduct> = {}): MockProduct {
  return {
    id: 'product-uuid-1',
    name: 'Blue Shirt',
    price: 29.99,
    isActive: true,
    variants: [{ stock: 5 }, { stock: 3 }],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('GroundingGuardService', () => {
  let service: GroundingGuardService;
  let prismaMock: PrismaMock;

  beforeEach(async () => {
    prismaMock = buildPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GroundingGuardService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<GroundingGuardService>(GroundingGuardService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // validateProductFacts
  // -------------------------------------------------------------------------

  describe('validateProductFacts', () => {
    it('returns grounded facts for an active in-stock product', async () => {
      prismaMock.product.findMany.mockResolvedValue([makeDbProduct()]);

      const result = await service.validateProductFacts(['product-uuid-1']);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual<GroundedProductFact>({
        id: 'product-uuid-1',
        name: 'Blue Shirt',
        price: 29.99,
        stock: 8, // 5 + 3
        isAvailable: true,
      });
    });

    it('queries Prisma with the correct productIds in the where clause', async () => {
      prismaMock.product.findMany.mockResolvedValue([]);

      await service.validateProductFacts(['id-a', 'id-b']);

      expect(prismaMock.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: { in: ['id-a', 'id-b'] } },
          select: expect.objectContaining({
            id: true,
            name: true,
            price: true,
            isActive: true,
          }),
        }),
      );
    });

    it('returns isAvailable=false and stock=0 when variants array is empty', async () => {
      prismaMock.product.findMany.mockResolvedValue([makeDbProduct({ variants: [] })]);

      const [fact] = await service.validateProductFacts(['product-uuid-1']);

      expect(fact.stock).toBe(0);
      expect(fact.isAvailable).toBe(false);
    });

    it('returns isAvailable=false when all variants have zero stock', async () => {
      prismaMock.product.findMany.mockResolvedValue([
        makeDbProduct({ variants: [{ stock: 0 }, { stock: 0 }] }),
      ]);

      const [fact] = await service.validateProductFacts(['product-uuid-1']);

      expect(fact.stock).toBe(0);
      expect(fact.isAvailable).toBe(false);
    });

    it('returns isAvailable=false when product isActive=false even if stock > 0', async () => {
      prismaMock.product.findMany.mockResolvedValue([
        makeDbProduct({ isActive: false, variants: [{ stock: 10 }] }),
      ]);

      const [fact] = await service.validateProductFacts(['product-uuid-1']);

      expect(fact.isAvailable).toBe(false);
      expect(fact.stock).toBe(10);
    });

    it('sums stock across all variants correctly', async () => {
      prismaMock.product.findMany.mockResolvedValue([
        makeDbProduct({ variants: [{ stock: 1 }, { stock: 4 }, { stock: 7 }] }),
      ]);

      const [fact] = await service.validateProductFacts(['product-uuid-1']);

      expect(fact.stock).toBe(12);
    });

    it('coerces Prisma Decimal price to a JS number', async () => {
      prismaMock.product.findMany.mockResolvedValue([makeDbProduct({ price: 49.95 })]);

      const [fact] = await service.validateProductFacts(['product-uuid-1']);

      expect(fact.price).toBe(49.95);
      expect(typeof fact.price).toBe('number');
    });

    it('returns an empty array when no products match the given IDs', async () => {
      prismaMock.product.findMany.mockResolvedValue([]);

      const result = await service.validateProductFacts(['non-existent-id']);

      expect(result).toEqual([]);
    });

    it('returns facts for multiple products in the order Prisma returns them', async () => {
      prismaMock.product.findMany.mockResolvedValue([
        makeDbProduct({ id: 'p1', name: 'Shirt', price: 20, variants: [{ stock: 2 }] }),
        makeDbProduct({ id: 'p2', name: 'Jeans', price: 60, variants: [{ stock: 1 }] }),
      ]);

      const result = await service.validateProductFacts(['p1', 'p2']);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('p1');
      expect(result[1].id).toBe('p2');
    });
  });

  // -------------------------------------------------------------------------
  // validateOrderIntent
  // -------------------------------------------------------------------------

  describe('validateOrderIntent', () => {
    it('returns valid=true with groundedFacts when all conditions are met', async () => {
      prismaMock.product.findMany.mockResolvedValue([
        makeDbProduct({ price: 29.99, variants: [{ stock: 5 }] }),
      ]);

      const result = await service.validateOrderIntent({
        productId: 'product-uuid-1',
        quantity: 2,
        expectedPrice: 29.99,
      });

      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.groundedFacts.id).toBe('product-uuid-1');
        expect(result.groundedFacts.price).toBe(29.99);
      }
    });

    it('returns valid=false with "not found" reason when product does not exist', async () => {
      prismaMock.product.findMany.mockResolvedValue([]);

      const result = await service.validateOrderIntent({
        productId: 'ghost-product',
        quantity: 1,
        expectedPrice: 10.0,
      });

      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.reason).toContain('not found');
      }
    });

    it('returns valid=false when product isAvailable=false (out of stock)', async () => {
      prismaMock.product.findMany.mockResolvedValue([
        makeDbProduct({ variants: [] }), // stock=0, isAvailable=false
      ]);

      const result: ValidationResult = await service.validateOrderIntent({
        productId: 'product-uuid-1',
        quantity: 1,
        expectedPrice: 29.99,
      });

      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.reason).toContain('out of stock');
      }
    });

    it('returns valid=false when requested quantity exceeds available stock', async () => {
      prismaMock.product.findMany.mockResolvedValue([
        makeDbProduct({ variants: [{ stock: 2 }] }),
      ]);

      const result = await service.validateOrderIntent({
        productId: 'product-uuid-1',
        quantity: 5,
        expectedPrice: 29.99,
      });

      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.reason).toMatch(/Only 2 units available, requested 5/);
      }
    });

    it('returns valid=false when expectedPrice differs from DB price by more than 0.01', async () => {
      prismaMock.product.findMany.mockResolvedValue([
        makeDbProduct({ price: 29.99, variants: [{ stock: 10 }] }),
      ]);

      const result = await service.validateOrderIntent({
        productId: 'product-uuid-1',
        quantity: 1,
        expectedPrice: 25.0,
      });

      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.reason).toContain('Price mismatch');
        expect(result.reason).toContain('29.99');
        expect(result.reason).toContain('25');
      }
    });

    it('returns valid=true when expectedPrice differs by less than 0.01', async () => {
      prismaMock.product.findMany.mockResolvedValue([
        makeDbProduct({ price: 30.0, variants: [{ stock: 10 }] }),
      ]);

      const result = await service.validateOrderIntent({
        productId: 'product-uuid-1',
        quantity: 1,
        expectedPrice: 30.005, // diff = 0.005 < 0.01
      });

      expect(result.valid).toBe(true);
    });

    it('returns valid=false when expectedPrice differs by more than 0.01 (above boundary)', async () => {
      prismaMock.product.findMany.mockResolvedValue([
        makeDbProduct({ price: 29.99, variants: [{ stock: 10 }] }),
      ]);

      const result = await service.validateOrderIntent({
        productId: 'product-uuid-1',
        quantity: 1,
        expectedPrice: 30.01, // diff = 0.02
      });

      expect(result.valid).toBe(false);
    });

    it('returns valid=true when quantity equals exactly the available stock', async () => {
      prismaMock.product.findMany.mockResolvedValue([
        makeDbProduct({ price: 10.0, variants: [{ stock: 3 }] }),
      ]);

      const result = await service.validateOrderIntent({
        productId: 'product-uuid-1',
        quantity: 3,
        expectedPrice: 10.0,
      });

      expect(result.valid).toBe(true);
    });

    it('validates product via validateProductFacts — calls findMany with correct productId', async () => {
      prismaMock.product.findMany.mockResolvedValue([
        makeDbProduct({ id: 'target-id', price: 15.0, variants: [{ stock: 1 }] }),
      ]);

      await service.validateOrderIntent({
        productId: 'target-id',
        quantity: 1,
        expectedPrice: 15.0,
      });

      expect(prismaMock.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: { in: ['target-id'] } },
        }),
      );
    });

    it('inactive product with stock returns valid=false (isAvailable check before quantity)', async () => {
      prismaMock.product.findMany.mockResolvedValue([
        makeDbProduct({ isActive: false, variants: [{ stock: 20 }] }),
      ]);

      const result = await service.validateOrderIntent({
        productId: 'product-uuid-1',
        quantity: 1,
        expectedPrice: 29.99,
      });

      expect(result.valid).toBe(false);
    });
  });
});
