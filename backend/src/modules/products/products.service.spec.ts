import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Decimal } from '@prisma/client/runtime/library';
import { ProductsService } from './products.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ProductsQueryDto, SortOption } from './dto/products-query.dto';
import { CreateReviewDto } from './dto/create-review.dto';

// ---------------------------------------------------------------------------
// Prisma mock helpers
// ---------------------------------------------------------------------------

type MockProduct = {
  id: string;
  slug: string;
  sku: string;
  name: string;
  description: string;
  price: Decimal;
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
  name: string;
  value: string;
  priceDelta: Decimal;
  stock: number;
};

type MockReview = {
  id: string;
  productId: string;
  userId: string | null;
  reviewerName: string;
  rating: number;
  comment: string;
  createdAt: Date;
};

function makeVariant(overrides: Partial<MockVariant> = {}): MockVariant {
  return {
    id: 'variant-1',
    productId: 'product-1',
    name: 'Size',
    value: 'M',
    priceDelta: new Decimal('0'),
    stock: 10,
    ...overrides,
  };
}

function makeProduct(overrides: Partial<MockProduct> = {}): MockProduct {
  return {
    id: 'product-1',
    slug: 'test-product',
    sku: 'SKU-001',
    name: 'Test Product',
    description: 'A great test product.',
    price: new Decimal('99.99'),
    imageUrl: 'https://example.com/img.jpg',
    category: 'shoes',
    tags: ['running', 'sport'],
    isActive: true,
    createdAt: new Date('2025-01-01T00:00:00Z'),
    variants: [makeVariant()],
    ...overrides,
  };
}

function makeReview(overrides: Partial<MockReview> = {}): MockReview {
  return {
    id: 'review-1',
    productId: 'product-1',
    userId: null,
    reviewerName: 'Jane Doe',
    rating: 4,
    comment: 'Really liked it.',
    createdAt: new Date('2025-03-01T00:00:00Z'),
    ...overrides,
  };
}

// Minimal PrismaService mock — only the model methods we need.
function buildPrismaMock() {
  return {
    product: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
      groupBy: jest.fn(),
    },
    review: {
      findMany: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
      create: jest.fn(),
    },
  };
}

type PrismaMock = ReturnType<typeof buildPrismaMock>;

// ---------------------------------------------------------------------------
// Shared aggregate / categoryRows defaults
// ---------------------------------------------------------------------------

const DEFAULT_PRICE_AGG = {
  _min: { price: new Decimal('9.99') },
  _max: { price: new Decimal('199.99') },
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

    it('should apply minPrice filter as Decimal gte', async () => {
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
        price: { gte: new Decimal(50) },
      });
    });

    it('should apply maxPrice filter as Decimal lte', async () => {
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
        price: { lte: new Decimal(150) },
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
          gte: new Decimal(20),
          lte: new Decimal(200),
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

    it('should map price from Decimal to number', async () => {
      const product = makeProduct({ price: new Decimal('49.95') });
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
        price: new Decimal('19.99'),
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

  // -------------------------------------------------------------------------
  // findBySlug
  // -------------------------------------------------------------------------

  describe('findBySlug', () => {
    it('should return ProductDetailDto with all fields for a known slug', async () => {
      const product = makeProduct();
      const related = [makeProduct({ id: 'product-2', slug: 'related-product' })];
      const reviewAgg = { _avg: { rating: 4.3 }, _count: { id: 7 } };

      prismaMock.product.findUnique.mockResolvedValueOnce(product);
      prismaMock.product.findMany.mockResolvedValueOnce(related); // related products
      prismaMock.review.aggregate.mockResolvedValueOnce(reviewAgg);

      const result = await service.findBySlug('test-product');

      expect(result.slug).toBe('test-product');
      expect(result.sku).toBe('SKU-001');
      expect(result.name).toBe('Test Product');
      expect(result.price).toBe(99.99);
      expect(result.reviewCount).toBe(7);
      expect(result.averageRating).toBe(4.3); // Math.round(4.3 * 10) / 10
      expect(result.relatedProducts).toHaveLength(1);
    });

    it('should query product with slug and isActive:true', async () => {
      prismaMock.product.findUnique.mockResolvedValueOnce(makeProduct());
      prismaMock.product.findMany.mockResolvedValueOnce([]);
      prismaMock.review.aggregate.mockResolvedValueOnce({ _avg: { rating: null }, _count: { id: 0 } });

      await service.findBySlug('test-product');

      expect(prismaMock.product.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { slug: 'test-product', isActive: true },
          include: { variants: true },
        }),
      );
    });

    it('should throw NotFoundException when slug does not match any active product', async () => {
      prismaMock.product.findUnique.mockResolvedValue(null);

      await expect(service.findBySlug('ghost-product')).rejects.toThrow(
        new NotFoundException('Product with slug "ghost-product" not found'),
      );
    });

    it('should set averageRating to null when there are no reviews', async () => {
      prismaMock.product.findUnique.mockResolvedValueOnce(makeProduct());
      prismaMock.product.findMany.mockResolvedValueOnce([]);
      prismaMock.review.aggregate.mockResolvedValueOnce({ _avg: { rating: null }, _count: { id: 0 } });

      const result = await service.findBySlug('test-product');

      expect(result.averageRating).toBeNull();
      expect(result.reviewCount).toBe(0);
    });

    it('should round averageRating to one decimal place', async () => {
      prismaMock.product.findUnique.mockResolvedValueOnce(makeProduct());
      prismaMock.product.findMany.mockResolvedValueOnce([]);
      prismaMock.review.aggregate.mockResolvedValueOnce({ _avg: { rating: 3.666 }, _count: { id: 3 } });

      const result = await service.findBySlug('test-product');

      expect(result.averageRating).toBe(3.7);
    });

    it('should compute isAvailable as false when all variants have zero stock', async () => {
      const product = makeProduct({ variants: [makeVariant({ stock: 0 })] });
      prismaMock.product.findUnique.mockResolvedValueOnce(product);
      prismaMock.product.findMany.mockResolvedValueOnce([]);
      prismaMock.review.aggregate.mockResolvedValueOnce({ _avg: { rating: null }, _count: { id: 0 } });

      const result = await service.findBySlug('test-product');

      expect(result.isAvailable).toBe(false);
      expect(result.stock).toBe(0);
    });

    it('should exclude the requested slug from related products query', async () => {
      const product = makeProduct({ slug: 'test-product', category: 'shoes' });
      prismaMock.product.findUnique.mockResolvedValueOnce(product);
      prismaMock.product.findMany.mockResolvedValueOnce([]);
      prismaMock.review.aggregate.mockResolvedValueOnce({ _avg: { rating: null }, _count: { id: 0 } });

      await service.findBySlug('test-product');

      expect(prismaMock.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            slug: { not: 'test-product' },
            category: 'shoes',
            isActive: true,
          }),
          take: 4,
        }),
      );
    });
  });

  // -------------------------------------------------------------------------
  // getReviews
  // -------------------------------------------------------------------------

  describe('getReviews', () => {
    it('should return ReviewsListResponseDto with paginated reviews', async () => {
      const reviews = [makeReview(), makeReview({ id: 'review-2', rating: 5 })];
      prismaMock.product.findUnique.mockResolvedValueOnce({ id: 'product-1' });
      prismaMock.review.findMany.mockResolvedValueOnce(reviews);
      prismaMock.review.count.mockResolvedValueOnce(15);

      const result = await service.getReviews('test-product', 2, 10);

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(15);
      expect(result.page).toBe(2);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(2); // ceil(15 / 10)
    });

    it('should look up product by slug with isActive:true before fetching reviews', async () => {
      prismaMock.product.findUnique.mockResolvedValueOnce({ id: 'product-1' });
      prismaMock.review.findMany.mockResolvedValueOnce([]);
      prismaMock.review.count.mockResolvedValueOnce(0);

      await service.getReviews('test-product', 1, 5);

      expect(prismaMock.product.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { slug: 'test-product', isActive: true },
          select: { id: true },
        }),
      );
    });

    it('should apply correct skip and take for pagination', async () => {
      prismaMock.product.findUnique.mockResolvedValueOnce({ id: 'product-1' });
      prismaMock.review.findMany.mockResolvedValueOnce([]);
      prismaMock.review.count.mockResolvedValueOnce(0);

      await service.getReviews('test-product', 3, 5);

      expect(prismaMock.review.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { productId: 'product-1' },
          skip: 10, // (3 - 1) * 5
          take: 5,
          orderBy: { createdAt: 'desc' },
        }),
      );
    });

    it('should throw NotFoundException when slug does not match any active product', async () => {
      prismaMock.product.findUnique.mockResolvedValue(null);

      await expect(service.getReviews('unknown-slug', 1, 10)).rejects.toThrow(
        new NotFoundException('Product with slug "unknown-slug" not found'),
      );
    });

    it('should return empty data array and totalPages 0 when product has no reviews', async () => {
      prismaMock.product.findUnique.mockResolvedValueOnce({ id: 'product-1' });
      prismaMock.review.findMany.mockResolvedValueOnce([]);
      prismaMock.review.count.mockResolvedValueOnce(0);

      const result = await service.getReviews('test-product', 1, 10);

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(0);
    });

    it('should map all review fields correctly', async () => {
      const review = makeReview({
        id: 'r-abc',
        productId: 'product-1',
        userId: 'user-42',
        reviewerName: 'Alice',
        rating: 5,
        comment: 'Outstanding quality.',
        createdAt: new Date('2025-06-15T10:00:00Z'),
      });
      prismaMock.product.findUnique.mockResolvedValueOnce({ id: 'product-1' });
      prismaMock.review.findMany.mockResolvedValueOnce([review]);
      prismaMock.review.count.mockResolvedValueOnce(1);

      const result = await service.getReviews('test-product', 1, 10);

      expect(result.data[0]).toMatchObject({
        id: 'r-abc',
        productId: 'product-1',
        userId: 'user-42',
        reviewerName: 'Alice',
        rating: 5,
        comment: 'Outstanding quality.',
      });
    });
  });

  // -------------------------------------------------------------------------
  // createReview
  // -------------------------------------------------------------------------

  describe('createReview', () => {
    const validBody: CreateReviewDto = {
      reviewerName: 'Bob',
      rating: 4,
      comment: 'Very comfortable and durable.',
    };

    it('should create and return a ReviewDto', async () => {
      const createdReview = makeReview({
        id: 'new-review',
        productId: 'product-1',
        reviewerName: 'Bob',
        rating: 4,
        comment: 'Very comfortable and durable.',
      });
      prismaMock.product.findUnique.mockResolvedValueOnce({ id: 'product-1' });
      prismaMock.review.create.mockResolvedValueOnce(createdReview);

      const result = await service.createReview('product-1', validBody);

      expect(result.id).toBe('new-review');
      expect(result.productId).toBe('product-1');
      expect(result.reviewerName).toBe('Bob');
      expect(result.rating).toBe(4);
      expect(result.comment).toBe('Very comfortable and durable.');
    });

    it('should verify product exists with isActive:true before creating review', async () => {
      prismaMock.product.findUnique.mockResolvedValueOnce({ id: 'product-1' });
      prismaMock.review.create.mockResolvedValueOnce(makeReview());

      await service.createReview('product-1', validBody);

      expect(prismaMock.product.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'product-1', isActive: true },
          select: { id: true },
        }),
      );
    });

    it('should pass the correct data to review.create', async () => {
      prismaMock.product.findUnique.mockResolvedValueOnce({ id: 'product-1' });
      prismaMock.review.create.mockResolvedValueOnce(makeReview());

      await service.createReview('product-1', validBody);

      expect(prismaMock.review.create).toHaveBeenCalledWith({
        data: {
          productId: 'product-1',
          reviewerName: 'Bob',
          rating: 4,
          comment: 'Very comfortable and durable.',
        },
      });
    });

    it('should throw NotFoundException when productId does not match any active product', async () => {
      prismaMock.product.findUnique.mockResolvedValue(null);

      await expect(service.createReview('non-existent-id', validBody)).rejects.toThrow(
        new NotFoundException('Product "non-existent-id" not found'),
      );
    });

    it('should not call review.create when product lookup fails', async () => {
      prismaMock.product.findUnique.mockResolvedValueOnce(null);

      await service.createReview('bad-id', validBody).catch(() => undefined);

      expect(prismaMock.review.create).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // findAllSlugs
  // -------------------------------------------------------------------------

  describe('findAllSlugs', () => {
    it('should return an array of slug strings for all active products', async () => {
      prismaMock.product.findMany.mockResolvedValueOnce([
        { slug: 'running-shoe-v1' },
        { slug: 'leather-bag' },
        { slug: 'sport-hat' },
      ]);

      const result = await service.findAllSlugs();

      expect(result).toEqual(['running-shoe-v1', 'leather-bag', 'sport-hat']);
    });

    it('should query only active products selecting slug only', async () => {
      prismaMock.product.findMany.mockResolvedValueOnce([]);

      await service.findAllSlugs();

      expect(prismaMock.product.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        select: { slug: true },
      });
    });

    it('should return an empty array when no active products exist', async () => {
      prismaMock.product.findMany.mockResolvedValueOnce([]);

      const result = await service.findAllSlugs();

      expect(result).toEqual([]);
    });
  });
});
