import { Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ProductVariantDto } from './product-variant.dto';
import { ProductSummaryDto } from './product-summary.dto';

export class ProductDetailDto {
  @Expose()
  @ApiProperty()
  id!: string;

  @Expose()
  @ApiProperty()
  slug!: string;

  @Expose()
  @ApiProperty()
  sku!: string;

  @Expose()
  @ApiProperty()
  name!: string;

  @Expose()
  @ApiProperty()
  description!: string;

  @Expose()
  @ApiProperty({ type: Number })
  price!: number;

  @Expose()
  @ApiProperty({ nullable: true, type: String })
  imageUrl!: string | null;

  @Expose()
  @ApiProperty()
  category!: string;

  @Expose()
  @ApiProperty({ type: [String] })
  tags!: string[];

  @Expose()
  @ApiProperty()
  stock!: number;

  @Expose()
  @ApiProperty()
  isAvailable!: boolean;

  @Expose()
  @Type(() => ProductVariantDto)
  @ApiProperty({ type: [ProductVariantDto] })
  variants!: ProductVariantDto[];

  @Expose()
  @Type(() => ProductSummaryDto)
  @ApiProperty({ type: [ProductSummaryDto], description: 'Up to 4 related products in same category' })
  relatedProducts!: ProductSummaryDto[];

  @Expose()
  @ApiProperty({ nullable: true, type: Number })
  averageRating!: number | null;

  @Expose()
  @ApiProperty()
  reviewCount!: number;
}
