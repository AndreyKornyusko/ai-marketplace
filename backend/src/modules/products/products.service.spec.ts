import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { ProductsService } from './products.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ProductsQueryDto, SortOption } from './dto/products-query.dto';

// ---------------------------------------------------------------------------
// Prisma mock helpers
// ---------------------------------------------------------------------------

type MockProduct = {
  id: string;
  slug: string;
  name: string;
  price: Prisma.Decimal;
  imageUrl: string | null;
  category: string;
  tags: string[];
  isActive: boolean;
  createdAt: Date;
  variants: MockVariant[];
};

type MockVariant = {
  id: string;
  productId: string;
  stock: number;
};

function makeVariant(overrides: Partial<MockVariant> = {}): MockVariant {
  return {
    id: 'variant-1',
    productId: 'product-1',
    stock: 10,
    ...overrides,
  };
}

function makeProduct(overrides: Partial<MockProduct> = {}): MockProduct {
  return {
    id: 'product-1',
    slug: 'test-product',
    name: 'Test Product',
    price: new Prisma.Decimal('99.99'),
    imageUrl: 'https://example.com/img.jpg',
    category: 'shoes',
    tags: ['running', 'sport'],
    isActive: true,
    createdAt: new Date('2025-01-01T00:00:00Z'),
    variants: [makeVariant()],
    ...overrides,
  };
}

// Minimal PrismaService mock — only the product model methods we need.
function buildPrismaMock() {
  return {
    product: {
      findMany: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
      groupBy: jest.fn(),
    },
  };
}

type PrismaMock = ReturnType<typeof buildPrismaMock>;

// ---------------------------------------------------------------------------
// Shared aggregate / categoryRows defaults
// ---------------------------------------------------------------------------

const DEFAULT_PRICE_AGG = {
  _min: { price: new Prisma.Decimal('9.99') },
  _max: { price: new Prisma.Decimal('199.99') },
};

const DEFAULT_CATEGORY_ROWS = [{ category: 'shoes' }, { category: 'bags' }];

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('ProductsService', () => {
  let service: ProductsService;
  let prismaMock: PrismaMock;

  beforeEach(async () => {
    prismaMock = buildPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // findAll — pagination and meta
  // -------------------------------------------------------------------------

  describe('findAll', () => {
    it('should return paginated products with correct meta', async () => {
      const products = [makeProduct(), makeProduct({ id: 'product-2', slug: 'product-2' })];
      const total = 42;

      prismaMock.product.findMany
        .mockResolvedValueOnce(products)   // first call: product list
        .mockResolvedValueOnce(DEFAULT_CATEGORY_ROWS); // second call: distinct categories
      prismaMock.product.count.mockResolvedValueOnce(total);
      prismaMock.product.aggregate.mockResolvedValueOnce(DEFAULT_PRICE_AGG);

      const query: ProductsQueryDto = { page: 2, limit: 10 };
      const result = await service.findAll(query);

      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(42);
      expect(result.meta.page).toBe(2);
      expect(result.meta.limit).toBe(10);
      expect(result.meta.totalPages).toBe(5); // ceil(42 / 10)

      // Verify skip / take were forwarded correctly
      const [listCall] = prismaMock.product.findMany.mock.calls as [
        Parameters<PrismaMock['product']['findMany']>[0],
        ...unknown[]
      ][];
      expect(listCall[0]).toMatchObject({ skip: 10, take: 10 });
    });

    it('should default page to 1 and limit to 20 when not provided', async () => {
      prismaMock.product.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      prismaMock.product.count.mockResolvedValueOnce(0);
      prismaMock.product.aggregate.mockResolvedValueOnce({
        _min: { price: null },
        _max: { price: null },
      });

      const query: ProductsQueryDto = {};
      const result = await service.findAll(query);

      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(20);
      expect(result.meta.totalPages).toBe(0); // ceil(0/20)

      const [listCall] = prismaMock.product.findMany.mock.calls as [
        Parameters<PrismaMock['product']['findMany']>[0],
        ...unknown[]
      ][];
      expect(listCall[0]).toMatchObject({ skip: 0, take: 20 });
    });

    it('should fall back to priceRange {min:0, max:0} when aggregate returns nulls', async () => {
      prismaMock.product.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      prismaMock.product.count.mockResolvedValueOnce(0);
      prismaMock.product.aggregate.mockResolvedValueOnce({
        _min: { price: null },
        _max: { price: null },
      });

      const result = await service.findAll({});

      expect(result.meta.filters.priceRange).toEqual({ min: 0, max: 0 });
    });

    it('should populate meta.filters.categories from distinct category rows', async () => {
      prismaMock.product.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ category: 'hats' }, { category: 'belts' }]);
      prismaMock.product.count.mockResolvedValueOnce(0);
      prismaMock.product.aggregate.mockResolvedValueOnce(DEFAULT_PRICE_AGG);

      const result = await service.findAll({});

      expect(result.meta.filters.categories).toEqual(['hats', 'belts']);
    });

    // -----------------------------------------------------------------------
    // Category filter
    // -----------------------------------------------------------------------

    it('should apply category filter to the where clause', async () => {
      prismaMock.product.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce(DEFAULT_CATEGORY_ROWS);
      prismaMock.product.count.mockResolvedValueOnce(0);
      prismaMock.product.aggregate.mockResolvedValueOnce(DEFAULT_PRICE_AGG);

      const query: ProductsQueryDto = { category: 'shoes' };
      await service.findAll(query);

      const [listCall] = prismaMock.product.findMany.mock.calls as [
        Parameters<PrismaMock['product']['findMany']>[0],
        ...unknown[]
      ][];
      expect(listCall[0].where).toMatchObject({ category: 'shoes', isActive: true });

      // count must receive the same where
      const [countCall] = prismaMock.product.count.mock.calls as [
        Parameters<PrismaMock['product']['count']>[0],
        ...unknown[]
      ][];
      expect(countCall[0].where).toMatchObject({ category: 'shoes', isActive: true });
    });

    it('should not add category to where clause when category is undefined', async () => {
      prismaMock.product.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      prismaMock.product.count.mockResolvedValueOnce(0);
      prismaMock.product.aggregate.mockResolvedValueOnce(DEFAULT_PRICE_AGG);

      await service.findAll({});

      const [listCall] = prismaMock.product.findMany.mock.calls as [
        Parameters<PrismaMock['product']['findMany']>[0],
        ...unknown[]
      ][];
      expect(listCall[0].where).not.toHaveProperty('category');
    });

    // -----------------------------------------------------------------------
    // Price range filter
    // -----------------------------------------------------------------------

    it('should apply minPrice filter as Prisma.Decimal gte', async () => {
      prismaMock.product.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      prismaMock.product.count.mockResolvedValueOnce(0);
      prismaMock.product.aggregate.mockResolvedValueOnce(DEFAULT_PRICE_AGG);

      await service.findAll({ minPrice: 50 });

      const [listCall] = prismaMock.product.findMany.mock.calls as [
        Parameters<PrismaMock['product']['findMany']>[0],
        ...unknown[]
      ][];
      expect(listCall[0].where).toMatchObject({
        price: { gte: new Prisma.Decimal(50) },
      });
    });

    it('should apply maxPrice filter as Prisma.Decimal lte', async () => {
      prismaMock.product.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      prismaMock.product.count.mockResolvedValueOnce(0);
      prismaMock.product.aggregate.mockResolvedValueOnce(DEFAULT_PRICE_AGG);

      await service.findAll({ maxPrice: 150 });

      const [listCall] = prismaMock.product.findMany.mock.calls as [
        Parameters<PrismaMock['product']['findMany']>[0],
        ...unknown[]
      ][];
      expect(listCall[0].where).toMatchObject({
        price: { lte: new Prisma.Decimal(150) },
      });
    });

    it('should apply both minPrice and maxPrice when both are provided', async () => {
      prismaMock.product.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      prismaMock.product.count.mockResolvedValueOnce(0);
      prismaMock.product.aggregate.mockResolvedValueOnce(DEFAULT_PRICE_AGG);

      await service.findAll({ minPrice: 20, maxPrice: 200 });

      const [listCall] = prismaMock.product.findMany.mock.calls as [
        Parameters<PrismaMock['product']['findMany']>[0],
        ...unknown[]
      ][];
      expect(listCall[0].where).toMatchObject({
        price: {
          gte: new Prisma.Decimal(20),
          lte: new Prisma.Decimal(200),
        },
      });
    });

    it('should not add price to where clause when neither minPrice nor maxPrice is provided', async () => {
      prismaMock.product.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      prismaMock.product.count.mockResolvedValueOnce(0);
      prismaMock.product.aggregate.mockResolvedValueOnce(DEFAULT_PRICE_AGG);

      await service.findAll({});

      const [listCall] = prismaMock.product.findMany.mock.calls as [
        Parameters<PrismaMock['product']['findMany']>[0],
        ...unknown[]
      ][];
      expect(listCall[0].where).not.toHaveProperty('price');
    });

    // -----------------------------------------------------------------------
    // Tags filter
    // -----------------------------------------------------------------------

    it('should apply tags hasSome filter when tags array is non-empty', async () => {
      prismaMock.product.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      prismaMock.product.count.mockResolvedValueOnce(0);
      prismaMock.product.aggregate.mockResolvedValueOnce(DEFAULT_PRICE_AGG);

      await service.findAll({ tags: ['running', 'trail'] });

      const [listCall] = prismaMock.product.findMany.mock.calls as [
        Parameters<PrismaMock['product']['findMany']>[0],
        ...unknown[]
      ][];
      expect(listCall[0].where).toMatchObject({
        tags: { hasSome: ['running', 'trail'] },
      });
    });

    it('should not add tags to where clause when tags array is empty', async () => {
      prismaMock.product.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      prismaMock.product.count.mockResolvedValueOnce(0);
      prismaMock.product.aggregate.mockResolvedValueOnce(DEFAULT_PRICE_AGG);

      await service.findAll({ tags: [] });

      const [listCall] = prismaMock.product.findMany.mock.calls as [
        Parameters<PrismaMock['product']['findMany']>[0],
        ...unknown[]
      ][];
      expect(listCall[0].where).not.toHaveProperty('tags');
    });

    it('should not add tags to where clause when tags is undefined', async () => {
      prismaMock.product.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      prismaMock.product.count.mockResolvedValueOnce(0);
      prismaMock.product.aggregate.mockResolvedValueOnce(DEFAULT_PRICE_AGG);

      await service.findAll({});

      const [listCall] = prismaMock.product.findMany.mock.calls as [
        Parameters<PrismaMock['product']['findMany']>[0],
        ...unknown[]
      ][];
      expect(listCall[0].where).not.toHaveProperty('tags');
    });

    // -----------------------------------------------------------------------
    // Sort / orderBy
    // -----------------------------------------------------------------------

    it('should apply orderBy price asc for sort=price_asc', async () => {
      prismaMock.product.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      prismaMock.product.count.mockResolvedValueOnce(0);
      prismaMock.product.aggregate.mockResolvedValueOnce(DEFAULT_PRICE_AGG);

      await service.findAll({ sort: SortOption.PRICE_ASC });

      const [listCall] = prismaMock.product.findMany.mock.calls as [
        Parameters<PrismaMock['product']['findMany']>[0],
        ...unknown[]
      ][];
      expect(listCall[0].orderBy).toEqual({ price: 'asc' });
    });

    it('should apply orderBy price desc for sort=price_desc', async () => {
      prismaMock.product.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      prismaMock.product.count.mockResolvedValueOnce(0);
      prismaMock.product.aggregate.mockResolvedValueOnce(DEFAULT_PRICE_AGG);

      await service.findAll({ sort: SortOption.PRICE_DESC });

      const [listCall] = prismaMock.product.findMany.mock.calls as [
        Parameters<PrismaMock['product']['findMany']>[0],
        ...unknown[]
      ][];
      expect(listCall[0].orderBy).toEqual({ price: 'desc' });
    });

    it('should apply orderBy createdAt desc for sort=newest', async () => {
      prismaMock.product.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      prismaMock.product.count.mockResolvedValueOnce(0);
      prismaMock.product.aggregate.mockResolvedValueOnce(DEFAULT_PRICE_AGG);

      await service.findAll({ sort: SortOption.NEWEST });

      const [listCall] = prismaMock.product.findMany.mock.calls as [
        Parameters<PrismaMock['product']['findMany']>[0],
        ...unknown[]
      ][];
      expect(listCall[0].orderBy).toEqual({ createdAt: 'desc' });
    });

    it('should apply orderBy orderItems._count desc for sort=popular', async () => {
      prismaMock.product.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      prismaMock.product.count.mockResolvedValueOnce(0);
      prismaMock.product.aggregate.mockResolvedValueOnce(DEFAULT_PRICE_AGG);

      await service.findAll({ sort: SortOption.POPULAR });

      const [listCall] = prismaMock.product.findMany.mock.calls as [
        Parameters<PrismaMock['product']['findMany']>[0],
        ...unknown[]
      ][];
      expect(listCall[0].orderBy).toEqual({ orderItems: { _count: 'desc' } });
    });

    it('should default to orderBy createdAt desc when sort is undefined', async () => {
      prismaMock.product.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      prismaMock.product.count.mockResolvedValueOnce(0);
      prismaMock.product.aggregate.mockResolvedValueOnce(DEFAULT_PRICE_AGG);

      await service.findAll({});

      const [listCall] = prismaMock.product.findMany.mock.calls as [
        Parameters<PrismaMock['product']['findMany']>[0],
        ...unknown[]
      ][];
      expect(listCall[0].orderBy).toEqual({ createdAt: 'desc' });
    });

    // -----------------------------------------------------------------------
    // isActive guard
    // -----------------------------------------------------------------------

    it('should always include isActive:true in the where clause', async () => {
      prismaMock.product.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      prismaMock.product.count.mockResolvedValueOnce(0);
      prismaMock.product.aggregate.mockResolvedValueOnce(DEFAULT_PRICE_AGG);

      await service.findAll({ category: 'hats', minPrice: 10 });

      const [listCall] = prismaMock.product.findMany.mock.calls as [
        Parameters<PrismaMock['product']['findMany']>[0],
        ...unknown[]
      ][];
      expect(listCall[0].where).toMatchObject({ isActive: true });
    });
  });

  // -------------------------------------------------------------------------
  // findCategories
  // -------------------------------------------------------------------------

  describe('findCategories', () => {
    it('should return grouped categories with counts', async () => {
      prismaMock.product.groupBy.mockResolvedValueOnce([
        { category: 'bags', _count: { id: 5 } },
        { category: 'shoes', _count: { id: 12 } },
      ]);

      const result = await service.findCategories();

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({ category: 'bags', count: 5 });
      expect(result[1]).toMatchObject({ category: 'shoes', count: 12 });
    });

    it('should query only active products ordered by category asc', async () => {
      prismaMock.product.groupBy.mockResolvedValueOnce([]);

      await service.findCategories();

      expect(prismaMock.product.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          by: ['category'],
          where: { isActive: true },
          _count: { id: true },
          orderBy: { category: 'asc' },
        }),
      );
    });

    it('should return an empty array when no active products exist', async () => {
      prismaMock.product.groupBy.mockResolvedValueOnce([]);

      const result = await service.findCategories();

      expect(result).toEqual([]);
    });
  });

  // -------------------------------------------------------------------------
  // findFeatured
  // -------------------------------------------------------------------------

  describe('findFeatured', () => {
    it('should return up to 8 active products ordered by createdAt desc', async () => {
      const featured = Array.from({ length: 8 }, (_, i) =>
        makeProduct({ id: `product-${i}`, slug: `product-${i}` }),
      );
      prismaMock.product.findMany.mockResolvedValueOnce(featured);

      const result = await service.findFeatured();

      expect(result).toHaveLength(8);
      expect(prismaMock.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
          take: 8,
          include: { variants: true },
        }),
      );
    });

    it('should return fewer than 8 products when fewer active products exist', async () => {
      const featured = [makeProduct(), makeProduct({ id: 'product-2', slug: 'product-2' })];
      prismaMock.product.findMany.mockResolvedValueOnce(featured);

      const result = await service.findFeatured();

      expect(result).toHaveLength(2);
    });

    it('should return an empty array when no active products exist', async () => {
      prismaMock.product.findMany.mockResolvedValueOnce([]);

      const result = await service.findFeatured();

      expect(result).toEqual([]);
    });
  });

  // -------------------------------------------------------------------------
  // toSummaryDto (exercised via findFeatured)
  // -------------------------------------------------------------------------

  describe('toSummaryDto (via findFeatured)', () => {
    it('should compute stock as the sum of all variant stocks', async () => {
      const product = makeProduct({
        variants: [
          makeVariant({ id: 'v1', stock: 3 }),
          makeVariant({ id: 'v2', stock: 7 }),
          makeVariant({ id: 'v3', stock: 5 }),
        ],
      });
      prismaMock.product.findMany.mockResolvedValueOnce([product]);

      const [result] = await service.findFeatured();

      expect(result.stock).toBe(15);
    });

    it('should set isAvailable to true when stock > 0 and product is active', async () => {
      const product = makeProduct({
        isActive: true,
        variants: [makeVariant({ stock: 1 })],
      });
      prismaMock.product.findMany.mockResolvedValueOnce([product]);

      const [result] = await service.findFeatured();

      expect(result.isAvailable).toBe(true);
    });

    it('should set isAvailable to false when stock is 0', async () => {
      const product = makeProduct({
        isActive: true,
        variants: [makeVariant({ stock: 0 })],
      });
      prismaMock.product.findMany.mockResolvedValueOnce([product]);

      const [result] = await service.findFeatured();

      expect(result.isAvailable).toBe(false);
    });

    it('should set isAvailable to false when product is inactive even if stock > 0', async () => {
      const product = makeProduct({
        isActive: false,
        variants: [makeVariant({ stock: 20 })],
      });
      prismaMock.product.findMany.mockResolvedValueOnce([product]);

      const [result] = await service.findFeatured();

      expect(result.isAvailable).toBe(false);
    });

    it('should set stock to 0 and isAvailable to false when product has no variants', async () => {
      const product = makeProduct({ variants: [] });
      prismaMock.product.findMany.mockResolvedValueOnce([product]);

      const [result] = await service.findFeatured();

      expect(result.stock).toBe(0);
      expect(result.isAvailable).toBe(false);
    });

    it('should map price from Prisma.Decimal to number', async () => {
      const product = makeProduct({ price: new Prisma.Decimal('49.95') });
      prismaMock.product.findMany.mockResolvedValueOnce([product]);

      const [result] = await service.findFeatured();

      expect(result.price).toBe(49.95);
      expect(typeof result.price).toBe('number');
    });

    it('should expose imageUrl as null when product has no image', async () => {
      const product = makeProduct({ imageUrl: null });
      prismaMock.product.findMany.mockResolvedValueOnce([product]);

      const [result] = await service.findFeatured();

      expect(result.imageUrl).toBeNull();
    });

    it('should map all scalar fields correctly', async () => {
      const product = makeProduct({
        id: 'abc-123',
        slug: 'my-product',
        name: 'My Product',
        price: new Prisma.Decimal('19.99'),
        imageUrl: 'https://cdn.example.com/photo.png',
        category: 'accessories',
        tags: ['new', 'sale'],
        variants: [makeVariant({ stock: 4 })],
      });
      prismaMock.product.findMany.mockResolvedValueOnce([product]);

      const [result] = await service.findFeatured();

      expect(result).toMatchObject({
        id: 'abc-123',
        slug: 'my-product',
        name: 'My Product',
        price: 19.99,
        imageUrl: 'https://cdn.example.com/photo.png',
        category: 'accessories',
        tags: ['new', 'sale'],
        stock: 4,
        isAvailable: true,
      });
    });
  });
});
