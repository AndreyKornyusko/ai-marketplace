import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { ProductsQueryDto } from './dto/products-query.dto';
import { ProductSummaryDto } from './dto/product-summary.dto';
import { CategoryCountDto } from './dto/category-count.dto';
import { ProductsListResponseDto } from './dto/products-list-response.dto';

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

  // IMPORTANT: literal-segment routes ('categories', 'featured') MUST be declared
  // before any @Get(':id') handler to prevent NestJS matching them as :id values.
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
}
