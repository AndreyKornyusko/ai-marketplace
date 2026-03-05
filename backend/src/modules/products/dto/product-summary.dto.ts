import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class ProductSummaryDto {
  @Expose()
  @ApiProperty()
  id!: string;

  @Expose()
  @ApiProperty()
  slug!: string;

  @Expose()
  @ApiProperty()
  name!: string;

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
  @ApiProperty({ description: 'Sum of all variant stocks' })
  stock!: number;

  @Expose()
  @ApiProperty({ description: 'True when stock > 0 and product is active' })
  isAvailable!: boolean;
}
