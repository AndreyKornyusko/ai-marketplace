import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { ProductsQueryDto } from './dto/products-query.dto';
import { ProductSummaryDto } from './dto/product-summary.dto';
import { ProductDetailDto } from './dto/product-detail.dto';
import { CategoryCountDto } from './dto/category-count.dto';
import { ProductsListResponseDto } from './dto/products-list-response.dto';
import { PaginationDto } from './dto/pagination.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewDto, ReviewsListResponseDto } from './dto/review.dto';

@ApiTags('products')
@Controller('api/v1/products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'List products with filters and pagination' })
  @ApiResponse({ status: 200, type: ProductsListResponseDto })
  @ApiQuery({ name: 'category', required: false, type: String })
  @ApiQuery({ name: 'minPrice', required: false, type: Number })
  @ApiQuery({ name: 'maxPrice', required: false, type: Number })
  @ApiQuery({ name: 'tags', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({
    name: 'sort',
    required: false,
    enum: ['price_asc', 'price_desc', 'newest', 'popular'],
  })
  async findAll(
    @Query() query: ProductsQueryDto,
  ): Promise<ProductsListResponseDto> {
    return this.productsService.findAll(query);
  }

  // IMPORTANT: literal-segment routes MUST be declared before any @Get(':slug')
  // handler to prevent NestJS matching them as :slug values.
  @Get('categories')
  @ApiOperation({ summary: 'List all active categories with product counts' })
  @ApiResponse({ status: 200, type: [CategoryCountDto] })
  async findCategories(): Promise<CategoryCountDto[]> {
    return this.productsService.findCategories();
  }

  @Get('featured')
  @ApiOperation({ summary: 'Get up to 8 featured active products' })
  @ApiResponse({ status: 200, type: [ProductSummaryDto] })
  async findFeatured(): Promise<ProductSummaryDto[]> {
    return this.productsService.findFeatured();
  }

  @Get(':slug/reviews')
  @ApiOperation({ summary: 'Get paginated reviews for a product' })
  @ApiResponse({ status: 200, type: ReviewsListResponseDto })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @ApiParam({ name: 'slug', type: String })
  async getReviews(
    @Param('slug') slug: string,
    @Query() pagination: PaginationDto,
  ): Promise<ReviewsListResponseDto> {
    return this.productsService.getReviews(slug, pagination.page ?? 1, pagination.limit ?? 20);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get full product detail by slug' })
  @ApiResponse({ status: 200, type: ProductDetailDto })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @ApiParam({ name: 'slug', type: String })
  async findBySlug(@Param('slug') slug: string): Promise<ProductDetailDto> {
    return this.productsService.findBySlug(slug);
  }

  @Post(':id/reviews')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { ttl: 3600000, limit: 5 } })
  @ApiOperation({ summary: 'Submit a review for a product' })
  @ApiResponse({ status: 201, type: ReviewDto })
  @ApiResponse({ status: 400, description: 'Invalid UUID or validation error' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  // TODO: add @UseGuards(JwtAuthGuard) when auth module is implemented (spec-05)
  async createReview(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: CreateReviewDto,
  ): Promise<ReviewDto> {
    return this.productsService.createReview(id, body);
  }
}
