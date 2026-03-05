import { ApiProperty } from '@nestjs/swagger';
import { ProductSummaryDto } from './product-summary.dto';

export class PriceRangeDto {
  @ApiProperty()
  min: number;

  @ApiProperty()
  max: number;
}

export class ProductsMetaFiltersDto {
  @ApiProperty({ type: [String] })
  categories: string[];

  @ApiProperty({ type: PriceRangeDto })
  priceRange: PriceRangeDto;
}

export class ProductsMetaDto {
  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;

  @ApiProperty({ type: ProductsMetaFiltersDto })
  filters: ProductsMetaFiltersDto;
}

export class ProductsListResponseDto {
  @ApiProperty({ type: [ProductSummaryDto] })
  data: ProductSummaryDto[];

  @ApiProperty({ type: ProductsMetaDto })
  meta: ProductsMetaDto;
}
