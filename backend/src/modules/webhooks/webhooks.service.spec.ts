import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../../prisma/prisma.service';
import { WebhooksService } from './webhooks.service';
import type { PaymentResultDto, CodConfirmationDto, LowStockAcknowledgedDto, SupportTicketCreatedDto } from './dto/webhook.dto';

const mockPrisma = {
  order: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  productVariant: {
    findMany: jest.fn(),
  },
  supportTicket: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
};

describe('WebhooksService', () => {
  let service: WebhooksService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhooksService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<WebhooksService>(WebhooksService);
    jest.clearAllMocks();
  });

  describe('handlePaymentResult', () => {
    it('confirms order on succeeded payment', async () => {
      const order = { id: 'order-1', status: 'PENDING' };
      mockPrisma.order.findUnique.mockResolvedValue(order);
      mockPrisma.order.update.mockResolvedValue({ ...order, status: 'CONFIRMED' });

      const dto: PaymentResultDto = {
        orderId: 'order-1',
        status: 'succeeded',
        transactionId: 'pi_123',
        amount: 50.00,
      };

      await service.handlePaymentResult(dto);

      expect(mockPrisma.order.update).toHaveBeenCalledWith({
        where: { id: 'order-1' },
        data: { status: 'CONFIRMED', paymentStatus: 'PAID' },
      });
    });

    it('cancels order on failed payment', async () => {
      const order = { id: 'order-1', status: 'PENDING' };
      mockPrisma.order.findUnique.mockResolvedValue(order);
      mockPrisma.order.update.mockResolvedValue({ ...order, status: 'CANCELLED' });

      const dto: PaymentResultDto = {
        orderId: 'order-1',
        status: 'failed',
        transactionId: 'pi_123',
        amount: 50.00,
      };

      await service.handlePaymentResult(dto);

      expect(mockPrisma.order.update).toHaveBeenCalledWith({
        where: { id: 'order-1' },
        data: { status: 'CANCELLED', paymentStatus: 'FAILED' },
      });
    });

    it('throws NotFoundException when order does not exist', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(null);

      const dto: PaymentResultDto = {
        orderId: 'non-existent',
        status: 'succeeded',
        transactionId: 'pi_123',
        amount: 50.00,
      };

      await expect(service.handlePaymentResult(dto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('handleCodConfirmation', () => {
    it('confirms a PENDING COD order', async () => {
      const order = { id: 'order-2', status: 'PENDING' };
      mockPrisma.order.findUnique.mockResolvedValue(order);
      mockPrisma.order.update.mockResolvedValue({ ...order, status: 'CONFIRMED' });

      const dto: CodConfirmationDto = {
        orderId: 'order-2',
        confirmedAt: '2024-01-01T12:00:00.000Z',
      };

      await service.handleCodConfirmation(dto);

      expect(mockPrisma.order.update).toHaveBeenCalledWith({
        where: { id: 'order-2' },
        data: { status: 'CONFIRMED' },
      });
    });

    it('skips confirmation if order is no longer PENDING', async () => {
      const order = { id: 'order-2', status: 'CANCELLED' };
      mockPrisma.order.findUnique.mockResolvedValue(order);

      const dto: CodConfirmationDto = {
        orderId: 'order-2',
        confirmedAt: '2024-01-01T12:00:00.000Z',
      };

      await service.handleCodConfirmation(dto);

      expect(mockPrisma.order.update).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when order does not exist', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(null);

      const dto: CodConfirmationDto = {
        orderId: 'non-existent',
        confirmedAt: '2024-01-01T12:00:00.000Z',
      };

      await expect(service.handleCodConfirmation(dto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getLowStockItems', () => {
    it('returns active products below threshold', async () => {
      mockPrisma.productVariant.findMany.mockResolvedValue([
        {
          stock: 3,
          name: 'Size',
          value: 'M',
          product: { id: 'prod-1', name: 'T-Shirt', isActive: true },
        },
        {
          stock: 1,
          name: 'Color',
          value: 'Blue',
          product: { id: 'prod-2', name: 'Hoodie', isActive: false }, // inactive — should be filtered
        },
      ]);

      const result = await service.getLowStockItems(5);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        productId: 'prod-1',
        stock: 3,
        threshold: 5,
      });
    });
  });

  describe('handleLowStockAcknowledged', () => {
    it('handles acknowledgement without throwing', async () => {
      const dto: LowStockAcknowledgedDto = {
        productIds: ['prod-1', 'prod-2'],
        alertedAt: '2024-01-01T12:00:00.000Z',
      };

      await expect(service.handleLowStockAcknowledged(dto)).resolves.toBeUndefined();
    });
  });

  describe('handleSupportTicketCreated', () => {
    it('creates a support ticket', async () => {
      mockPrisma.supportTicket.findUnique.mockResolvedValue(null);
      mockPrisma.supportTicket.create.mockResolvedValue({ id: 'ticket-1' });

      const dto: SupportTicketCreatedDto = {
        ticketId: 'ticket-1',
        customerId: 'user-1',
        conversationId: 'conv-abc',
        agentType: 'customer-support',
        reason: 'Refund requested',
        summary: 'Customer wants a refund for order #123',
      };

      await service.handleSupportTicketCreated(dto);

      expect(mockPrisma.supportTicket.create).toHaveBeenCalledWith({
        data: {
          id: 'ticket-1',
          userId: 'user-1',
          conversationId: 'conv-abc',
          subject: '[customer-support] Refund requested',
          escalationReason: 'Refund requested',
          status: 'IN_PROGRESS',
        },
      });
    });

    it('is idempotent — skips creation if ticket already exists', async () => {
      mockPrisma.supportTicket.findUnique.mockResolvedValue({ id: 'ticket-1' });

      const dto: SupportTicketCreatedDto = {
        ticketId: 'ticket-1',
        customerId: null,
        conversationId: 'conv-abc',
        agentType: 'order-fulfillment',
        reason: 'Cannot find order',
        summary: 'Order lookup failed',
      };

      await service.handleSupportTicketCreated(dto);

      expect(mockPrisma.supportTicket.create).not.toHaveBeenCalled();
    });
  });
});
