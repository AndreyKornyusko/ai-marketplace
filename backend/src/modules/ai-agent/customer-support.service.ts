import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { randomUUID } from 'crypto';

export interface SupportInvokeResult {
  conversationId: string;
  reply: string;
  intermediateSteps?: unknown[];
}

export interface EscalationTicketParams {
  conversationId: string;
  reason: string;
  summary: string;
  userId?: string;
}

@Injectable()
export class CustomerSupportService {
  private readonly logger = new Logger(CustomerSupportService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createEscalationTicket(params: EscalationTicketParams): Promise<void> {
    await this.prisma.supportTicket.create({
      data: {
        userId: params.userId ?? null,
        conversationId: params.conversationId,
        subject: params.reason,
        escalationReason: params.summary,
        status: 'ESCALATED',
      },
    });
    this.logger.log(`Escalation ticket created for conversation ${params.conversationId}`);
  }

  generateAnonymousUserId(sessionId: string): string {
    return `anonymous_${sessionId}`;
  }

  generateConversationId(): string {
    return randomUUID();
  }
}
