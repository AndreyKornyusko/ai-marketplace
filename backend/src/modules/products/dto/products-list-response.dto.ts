import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ProductSummaryDto } from './product-summary.dto';

export class PriceRangeDto {
  @Expose()
  @ApiProperty()
  min!: number;

  @Expose()
  @ApiProperty()
  max!: number;
}

export class ProductsMetaFiltersDto {
  @Expose()
  @ApiProperty({ type: [String] })
  categories!: string[];

  @Expose()
  @ApiProperty({ type: PriceRangeDto })
  priceRange!: PriceRangeDto;
}

export class ProductsMetaDto {
  @Expose()
  @ApiProperty()
  total!: number;

  @Expose()
  @ApiProperty()
  page!: number;

  @Expose()
  @ApiProperty()
  limit!: number;

  @Expose()
  @ApiProperty()
  totalPages!: number;

  @Expose()
  @ApiProperty({ type: ProductsMetaFiltersDto })
  filters!: ProductsMetaFiltersDto;
}

export class ProductsListResponseDto {
  @Expose()
  @ApiProperty({ type: [ProductSummaryDto] })
  data!: ProductSummaryDto[];

  @Expose()
  @ApiProperty({ type: ProductsMetaDto })
  meta!: ProductsMetaDto;
}
