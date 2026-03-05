import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CategoryCountDto {
  @Expose()
  @ApiProperty()
  category!: string;

  @Expose()
  @ApiProperty()
  count!: number;
}
