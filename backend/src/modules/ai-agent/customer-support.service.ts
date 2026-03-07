import { Injectable, Logger } from '@nestjs/common';
import { HumanMessage, AIMessage } from '@langchain/core/messages';
import type { BaseMessage } from '@langchain/core/messages';
import { PrismaService } from '../../prisma/prisma.service';
import { randomUUID } from 'crypto';

const MAX_HISTORY_TURNS = 20; // keep last 20 message pairs per conversation

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
  private readonly histories = new Map<string, BaseMessage[]>();

  constructor(private readonly prisma: PrismaService) {}

  getHistory(conversationId: string): BaseMessage[] {
    return this.histories.get(conversationId) ?? [];
  }

  appendToHistory(conversationId: string, humanText: string, aiText: string): void {
    const history = this.histories.get(conversationId) ?? [];
    history.push(new HumanMessage(humanText), new AIMessage(aiText));
    // Trim to keep only the last MAX_HISTORY_TURNS pairs (each pair = 2 messages)
    const maxMessages = MAX_HISTORY_TURNS * 2;
    if (history.length > maxMessages) {
      history.splice(0, history.length - maxMessages);
    }
    this.histories.set(conversationId, history);
  }

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
