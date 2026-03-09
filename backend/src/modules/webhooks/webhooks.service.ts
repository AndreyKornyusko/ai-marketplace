import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import type {
  CodConfirmationDto,
  LowStockAcknowledgedDto,
  PaymentResultDto,
  SupportTicketCreatedDto,
} from './dto/webhook.dto';

export interface LowStockItem {
  productId: string;
  name: string;
  stock: number;
  threshold: number;
}

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(private readonly prisma: PrismaService) {}

  async handlePaymentResult(dto: PaymentResultDto): Promise<void> {
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
    });

    if (!order) {
      throw new NotFoundException(`Order ${dto.orderId} not found`);
    }

    if (dto.status === 'succeeded') {
      await this.prisma.order.update({
        where: { id: dto.orderId },
        data: {
          status: 'CONFIRMED',
          paymentStatus: 'PAID',
        },
      });
      this.logger.log(
        `Order ${dto.orderId} confirmed. Transaction: ${dto.transactionId}`,
      );
    } else {
      await this.prisma.order.update({
        where: { id: dto.orderId },
        data: {
          status: 'CANCELLED',
          paymentStatus: 'FAILED',
        },
      });
      this.logger.log(
        `Order ${dto.orderId} cancelled due to failed payment. Transaction: ${dto.transactionId}`,
      );
    }
  }

  async handleCodConfirmation(dto: CodConfirmationDto): Promise<void> {
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
    });

    if (!order) {
      throw new NotFoundException(`Order ${dto.orderId} not found`);
    }

    if (order.status === 'PENDING') {
      await this.prisma.order.update({
        where: { id: dto.orderId },
        data: { status: 'CONFIRMED' },
      });
      this.logger.log(
        `COD order ${dto.orderId} confirmed at ${dto.confirmedAt}`,
      );
    } else {
      this.logger.log(
        `COD order ${dto.orderId} status is ${order.status}, skipping confirmation`,
      );
    }
  }

  async getLowStockItems(threshold: number): Promise<LowStockItem[]> {
    const variants = await this.prisma.productVariant.findMany({
      where: { stock: { lte: threshold } },
      include: { product: { select: { id: true, name: true, isActive: true } } },
    });

    return variants
      .filter((v) => v.product.isActive)
      .map((v) => ({
        productId: v.product.id,
        name: `${v.product.name} — ${v.name}: ${v.value}`,
        stock: v.stock,
        threshold,
      }));
  }

  async handleLowStockAcknowledged(
    dto: LowStockAcknowledgedDto,
  ): Promise<void> {
    this.logger.log(
      `Low-stock alert acknowledged for ${dto.productIds.length} products at ${dto.alertedAt}`,
    );
    // No DB state change needed — acknowledgement is a no-op for now.
    // Future: write to an alert_log table to suppress duplicates.
  }

  async handleSupportTicketCreated(
    dto: SupportTicketCreatedDto,
  ): Promise<void> {
    // Check if a ticket with this ID already exists (idempotency)
    const existing = await this.prisma.supportTicket.findUnique({
      where: { id: dto.ticketId },
    });

    if (existing) {
      this.logger.log(
        `Support ticket ${dto.ticketId} already exists, skipping creation`,
      );
      return;
    }

    await this.prisma.supportTicket.create({
      data: {
        id: dto.ticketId,
        userId: dto.customerId ?? undefined,
        conversationId: dto.conversationId,
        subject: `[${dto.agentType}] ${dto.reason}`,
        escalationReason: dto.reason,
        status: 'IN_PROGRESS',
      },
    });

    this.logger.log(
      `Support ticket ${dto.ticketId} created for agent ${dto.agentType}. Reason: ${dto.reason}`,
    );
  }
}
