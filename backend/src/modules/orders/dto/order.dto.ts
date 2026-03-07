import { Expose, Type } from 'class-transformer';

export class OrderItemDto {
  @Expose()
  id!: string;

  @Expose()
  productId!: string;

  @Expose()
  variantId!: string | null;

  @Expose()
  quantity!: number;

  @Expose()
  unitPrice!: number;

  @Expose()
  total!: number;

  @Expose()
  productName?: string;

  @Expose()
  productImageUrl?: string | null;
}

export class OrderDto {
  @Expose()
  id!: string;

  @Expose()
  status!: string;

  @Expose()
  paymentMethod!: string;

  @Expose()
  paymentStatus!: string;

  @Expose()
  subtotal!: number;

  @Expose()
  shippingTotal!: number;

  @Expose()
  total!: number;

  @Expose()
  guestEmail!: string | null;

  @Expose()
  customerInfo?: unknown;

  @Expose()
  createdAt!: Date;

  @Expose()
  @Type(() => OrderItemDto)
  items!: OrderItemDto[];
}

export class CreateOrderResponseDto {
  orderId!: string;
  status!: string;
  paymentMethod!: string;
  total!: number;
}

export class CartItemDto {
  productId!: string;
  variantId!: string | null;
  quantity!: number;
}

export class PaymentIntentRequestDto {
  items!: CartItemDto[];
}

export class PaymentIntentResponseDto {
  clientSecret!: string;
  amount!: number;
}
