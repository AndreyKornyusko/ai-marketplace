import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class ReviewDto {
  @Expose()
  @ApiProperty()
  id!: string;

  @Expose()
  @ApiProperty()
  productId!: string;

  @Expose()
  @ApiProperty({ nullable: true, type: String })
  userId!: string | null;

  @Expose()
  @ApiProperty()
  reviewerName!: string;

  @Expose()
  @ApiProperty({ minimum: 1, maximum: 5 })
  rating!: number;

  @Expose()
  @ApiProperty()
  comment!: string;

  @Expose()
  @ApiProperty()
  createdAt!: Date;
}

export class ReviewsListResponseDto {
  @Expose()
  @ApiProperty({ type: [ReviewDto] })
  data!: ReviewDto[];

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
}
