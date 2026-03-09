import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Langfuse, { LangfuseTraceClient } from 'langfuse';

export interface CreateTraceOptions {
  name: string;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, unknown>;
  tags?: string[];
}

export interface CreateSpanOptions {
  name: string;
  input?: unknown;
  startTime?: Date;
}

export interface EndSpanOptions {
  output?: unknown;
  endTime?: Date;
}

export interface CreateGenerationOptions {
  name: string;
  model: string;
  input?: unknown;
  output?: unknown;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

export interface ScoreOptions {
  name: string;
  value: number;
  comment?: string;
}

/**
 * Thin wrapper around the Langfuse SDK.
 * Gracefully degrades when LANGFUSE_SECRET_KEY is not configured — all methods
 * return no-op objects so callers need no conditional logic.
 */
@Injectable()
export class LangfuseService implements OnModuleDestroy {
  private readonly logger = new Logger(LangfuseService.name);
  private readonly client: Langfuse | null;

  constructor(private readonly config: ConfigService) {
    const secretKey = this.config.get<string>('LANGFUSE_SECRET_KEY');
    const publicKey = this.config.get<string>('LANGFUSE_PUBLIC_KEY');

    if (!secretKey || !publicKey) {
      this.logger.warn(
        'LANGFUSE_SECRET_KEY or LANGFUSE_PUBLIC_KEY not set — Langfuse tracing disabled',
      );
      this.client = null;
      return;
    }

    this.client = new Langfuse({
      publicKey,
      secretKey,
      baseUrl: this.config.get<string>('LANGFUSE_BASE_URL') ?? 'https://cloud.langfuse.com',
    });

    this.logger.log('Langfuse tracing enabled');
  }

  isEnabled(): boolean {
    return this.client !== null;
  }

  createTrace(options: CreateTraceOptions): LangfuseTraceClient | NoopTrace {
    if (!this.client) {
      return new NoopTrace();
    }
    return this.client.trace({
      name: options.name,
      userId: options.userId,
      sessionId: options.sessionId,
      metadata: options.metadata,
      tags: options.tags,
    });
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client) {
      await this.client.flushAsync();
      this.logger.log('Langfuse client flushed');
    }
  }
}

/**
 * No-op span returned when Langfuse is not configured.
 * Implements the minimal surface used by agents so callers do not need null checks.
 */
export class NoopSpan {
  end(_options?: EndSpanOptions): void {
    // no-op
  }
}

/**
 * No-op trace returned when Langfuse is not configured.
 */
export class NoopTrace {
  span(_options: CreateSpanOptions): NoopSpan {
    return new NoopSpan();
  }

  generation(_options: CreateGenerationOptions): void {
    // no-op
  }

  score(_options: ScoreOptions): void {
    // no-op
  }

  event(_options: { name: string; input?: unknown; output?: unknown }): void {
    // no-op
  }
}
