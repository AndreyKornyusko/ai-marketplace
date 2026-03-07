import { IsArray, IsOptional, IsUUID, ValidateNested, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CartItemInputDto {
  @IsUUID()
  productId!: string;

  @IsOptional()
  @IsUUID()
  variantId!: string | null;

  @IsInt()
  @Min(1)
  quantity!: number;
}

export class CreatePaymentIntentDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CartItemInputDto)
  cartItems!: CartItemInputDto[];
}
