import { IsInt, IsNotEmpty, IsString, Min, Max, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateReviewDto {
  @IsInt()
  @Min(1)
  @Max(5)
  @ApiProperty({ minimum: 1, maximum: 5, description: 'Star rating from 1 to 5' })
  rating!: number;

  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(1000)
  @ApiProperty({ minLength: 5, maxLength: 1000 })
  comment!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  @ApiProperty({ minLength: 2, maxLength: 100, description: 'Display name for the reviewer' })
  reviewerName!: string;
}
