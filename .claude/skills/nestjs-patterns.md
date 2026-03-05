# NestJS Patterns — StyleAI Shop

Reference guide for all NestJS backend engineers.

## Module Structure

```typescript
// feature.module.ts
@Module({
  imports: [PrismaModule, forwardRef(() => OtherModule)],
  controllers: [FeatureController],
  providers: [FeatureService],
  exports: [FeatureService],
})
export class FeatureModule {}
```

## Controller Pattern

```typescript
@ApiTags('products')
@Controller('api/v1/products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'List products with filters' })
  @ApiResponse({ status: 200, type: ProductListResponseDto })
  async findAll(@Query() query: ProductsQueryDto): Promise<ProductListResponseDto> {
    return this.productsService.findAll(query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<ProductDto> {
    return this.productsService.findOne(id);
  }
}
```

## Service Pattern

```typescript
@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findOne(id: string): Promise<ProductDto> {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException(`Product ${id} not found`);
    return plainToInstance(ProductDto, product, { excludeExtraneousValues: true });
  }
}
```

## DTO Validation

```typescript
export class CreateOrderDto {
  @IsUUID()
  @IsNotEmpty()
  productId: string;

  @IsInt()
  @Min(1)
  @Max(100)
  quantity: number;

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;
}
```

## Response Envelope

All list endpoints return:
```typescript
export class PaginatedResponseDto<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
```

## Guards

```typescript
// JWT guard — applied to protected routes
@UseGuards(JwtAuthGuard)

// Role guard — applied to admin routes
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
```

## Interceptors

```typescript
// Global response serialization
app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

// Global validation pipe
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
}));
```

## Prisma Transactions

```typescript
await this.prisma.$transaction(async (tx) => {
  const order = await tx.order.create({ data: orderData });
  await tx.inventory.update({
    where: { productId: orderData.productId },
    data: { reserved: { increment: orderData.quantity } },
  });
  return order;
});
```

## Error Handling

```typescript
// Correct
throw new NotFoundException('Product not found');
throw new BadRequestException('Invalid quantity');
throw new ForbiddenException('Access denied');
throw new ConflictException('Order already exists');

// Wrong — never throw raw errors
throw new Error('Something failed');  // BAD
```

## Config Service

```typescript
@Injectable()
export class AppConfig {
  constructor(private readonly configService: ConfigService) {}

  get databaseUrl(): string {
    return this.configService.getOrThrow<string>('DATABASE_URL');
  }
}
```
