import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { plainToInstance } from 'class-transformer';
import Stripe from 'stripe';
import { PrismaService } from '../../prisma/prisma.service';
import { InventoryService } from './inventory.service';
import { CreateOrderDto } from './dto/create-order.dto';
import {
  CreateOrderResponseDto,
  OrderDto,
  OrderItemDto,
  PaymentIntentResponseDto,
} from './dto/order.dto';
import { CreatePaymentIntentDto } from './dto/payment-intent.dto';

const SHIPPING_FLAT = 5.99;
const FREE_SHIPPING_THRESHOLD = 50;

@Injectable()
export class OrdersService {
  private readonly stripe: Stripe | null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly inventory: InventoryService,
    private readonly config: ConfigService,
  ) {
    const stripeKey = this.config.get<string>('STRIPE_SECRET_KEY');
    this.stripe = stripeKey ? new Stripe(stripeKey) : null;
  }

  async createOrder(
    dto: CreateOrderDto,
    userId: string | null,
  ): Promise<CreateOrderResponseDto> {
    if (dto.items.length === 0) {
      throw new BadRequestException('Order must have at least one item');
    }

    if (dto.paymentMethod === 'CARD' && !dto.stripePaymentIntentId) {
      throw new BadRequestException(
        'stripePaymentIntentId required for CARD payment',
      );
    }

    // 1. Validate stock
    await this.inventory.checkBatch(dto.items);

    // 2. Lock prices from DB
    const productIds = dto.items.map((i) => i.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
      include: { variants: true },
    });

    type PriceRow = { unitPrice: number; productId: string; variantId: string | null };
    const lineItems: PriceRow[] = dto.items.map((item) => {
      const product = products.find((p) => p.id === item.productId);
      if (!product) {
        throw new NotFoundException(`Product ${item.productId} not found`);
      }

      let unitPrice = Number(product.price);
      if (item.variantId !== null) {
        const variant = product.variants.find((v) => v.id === item.variantId);
        if (!variant) {
          throw new NotFoundException(`Variant ${item.variantId} not found`);
        }
        unitPrice += Number(variant.priceDelta);
      }
      return { productId: item.productId, variantId: item.variantId, unitPrice };
    });

    const subtotal = lineItems.reduce(
      (sum, row, idx) => sum + row.unitPrice * (dto.items[idx]?.quantity ?? 0),
      0,
    );
    const shippingTotal = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT;
    const total = subtotal + shippingTotal;

    // 3. Create order + items in transaction
    const order = await this.prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          userId,
          guestEmail: userId === null ? dto.customerInfo.email : null,
          paymentMethod: dto.paymentMethod === 'COD' ? 'COD' : 'CARD',
          paymentStatus:
            dto.paymentMethod === 'CARD' ? 'PAID' : 'PENDING',
          subtotal,
          shippingTotal,
          total,
          notes: JSON.stringify({ customerInfo: dto.customerInfo }),
          items: {
            create: dto.items.map((item, idx) => {
              const row = lineItems[idx];
              if (!row) throw new Error('Line item mismatch');
              return {
                productId: item.productId,
                variantId: item.variantId ?? undefined,
                quantity: item.quantity,
                unitPrice: row.unitPrice,
                total: row.unitPrice * item.quantity,
              };
            }),
          },
        },
      });
      return created;
    });

    // 4. Create inventory reservations
    await this.inventory.createReservations(order.id, dto.items);

    return {
      orderId: order.id,
      status: order.status,
      paymentMethod: order.paymentMethod,
      total: Number(order.total),
    };
  }

  async getOrder(orderId: string, userId: string | null): Promise<OrderDto> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: { product: true },
        },
      },
    });

    if (order === null) {
      throw new NotFoundException('Order not found');
    }

    if (userId !== null && order.userId !== userId) {
      throw new NotFoundException('Order not found');
    }

    const customerInfo: unknown = order.notes
      ? (() => {
          try {
            const parsed = JSON.parse(order.notes) as Record<string, unknown>;
            return parsed['customerInfo'];
          } catch {
            return null;
          }
        })()
      : null;

    return plainToInstance(
      OrderDto,
      {
        id: order.id,
        status: order.status,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        subtotal: Number(order.subtotal),
        shippingTotal: Number(order.shippingTotal),
        total: Number(order.total),
        guestEmail: order.guestEmail,
        customerInfo,
        createdAt: order.createdAt,
        items: order.items.map((item) =>
          plainToInstance(
            OrderItemDto,
            {
              id: item.id,
              productId: item.productId,
              variantId: item.variantId,
              quantity: item.quantity,
              unitPrice: Number(item.unitPrice),
              total: Number(item.total),
              productName: item.product.name,
              productImageUrl: item.product.imageUrl,
            },
            { excludeExtraneousValues: true },
          ),
        ),
      },
      { excludeExtraneousValues: true },
    );
  }

  async listOrders(userId: string, page: number, limit: number): Promise<{ data: OrderDto[]; total: number; page: number; totalPages: number }> {
    const skip = (page - 1) * limit;
    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where: { userId },
        include: { items: { include: { product: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.order.count({ where: { userId } }),
    ]);

    const data = orders.map((order) => {
      const customerInfo: unknown = order.notes
        ? (() => {
            try {
              const parsed = JSON.parse(order.notes) as Record<string, unknown>;
              return parsed['customerInfo'];
            } catch {
              return null;
            }
          })()
        : null;

      return plainToInstance(
        OrderDto,
        {
          id: order.id,
          status: order.status,
          paymentMethod: order.paymentMethod,
          paymentStatus: order.paymentStatus,
          subtotal: Number(order.subtotal),
          shippingTotal: Number(order.shippingTotal),
          total: Number(order.total),
          guestEmail: order.guestEmail,
          customerInfo,
          createdAt: order.createdAt,
          items: order.items.map((item) =>
            plainToInstance(
              OrderItemDto,
              {
                id: item.id,
                productId: item.productId,
                variantId: item.variantId,
                quantity: item.quantity,
                unitPrice: Number(item.unitPrice),
                total: Number(item.total),
                productName: item.product.name,
                productImageUrl: item.product.imageUrl,
              },
              { excludeExtraneousValues: true },
            ),
          ),
        },
        { excludeExtraneousValues: true },
      );
    });

    return { data, total, page, totalPages: Math.ceil(total / limit) };
  }

  async createPaymentIntent(
    dto: CreatePaymentIntentDto,
  ): Promise<PaymentIntentResponseDto> {
    if (!this.stripe) {
      throw new BadRequestException('Stripe is not configured');
    }

    const productIds = dto.cartItems.map((i) => i.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
      include: { variants: true },
    });

    const subtotal = dto.cartItems.reduce((sum, item) => {
      const product = products.find((p) => p.id === item.productId);
      if (!product) return sum;
      let price = Number(product.price);
      if (item.variantId !== null) {
        const variant = product.variants.find((v) => v.id === item.variantId);
        if (variant) price += Number(variant.priceDelta);
      }
      return sum + price * item.quantity;
    }, 0);

    const shippingTotal =
      subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT;
    const total = subtotal + shippingTotal;
    const amountCents = Math.round(total * 100);

    const intent = await this.stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
    });

    if (!intent.client_secret) {
      throw new BadRequestException('Failed to create payment intent');
    }

    return { clientSecret: intent.client_secret, amount: amountCents };
  }
}
