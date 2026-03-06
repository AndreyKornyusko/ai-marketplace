import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class ProductVariantDto {
  @Expose()
  @ApiProperty()
  id!: string;

  @Expose()
  @ApiProperty({ description: 'Variant dimension name, e.g. "Size"' })
  name!: string;

  @Expose()
  @ApiProperty({ description: 'Variant dimension value, e.g. "XL"' })
  value!: string;

  @Expose()
  @ApiProperty({ type: Number, description: 'Price adjustment relative to base price' })
  priceDelta!: number;

  @Expose()
  @ApiProperty()
  stock!: number;
}
