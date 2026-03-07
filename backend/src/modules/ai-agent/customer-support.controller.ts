import {
  Controller,
  Post,
  Body,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import type { StreamEvent } from '@langchain/core/tracers/log_stream';
import { CustomerSupportQueryDto } from './dto/customer-support-query.dto';
import { CustomerSupportResponseDto } from './dto/customer-support-response.dto';
import { CustomerSupportService } from './customer-support.service';
import { CustomerSupportAgent } from './agents/customer-support/customer-support.agent';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt.guard';
import { randomUUID } from 'crypto';

interface AuthenticatedRequest extends Request {
  user?: { id: string; email: string; role: string };
}

@ApiTags('ai')
@Controller('api/v1/ai/customer-support')
@Throttle({ default: { ttl: 60000, limit: 10 } })
export class CustomerSupportController {
  private readonly logger = new Logger(CustomerSupportController.name);

  constructor(
    private readonly customerSupportService: CustomerSupportService,
    private readonly customerSupportAgent: CustomerSupportAgent,
  ) {}

  @Post()
  @UseGuards(OptionalJwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send a message to the customer support agent' })
  @ApiBody({ type: CustomerSupportQueryDto })
  @ApiResponse({ status: 200, type: CustomerSupportResponseDto })
  async chat(
    @Body() dto: CustomerSupportQueryDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<CustomerSupportResponseDto> {
    const conversationId =
      dto.conversationId ?? this.customerSupportService.generateConversationId();
    const userId = req.user?.id;

    this.logger.log(`Customer support [${userId ?? 'anonymous'}] conv:${conversationId}`);

    const result = await this.customerSupportAgent.invoke({
      message: dto.message,
      conversationId,
      userId,
    });

    return {
      conversationId: result.conversationId,
      reply: result.reply,
    };
  }

  @Post('stream')
  @UseGuards(OptionalJwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Stream customer support agent responses via SSE' })
  @ApiBody({ type: CustomerSupportQueryDto })
  @ApiResponse({ status: 200, description: 'SSE stream of agent tokens' })
  async stream(
    @Body() dto: CustomerSupportQueryDto,
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ): Promise<void> {
    const conversationId = dto.conversationId ?? randomUUID();
    const userId = req.user?.id;

    this.logger.log(`Customer support stream [${userId ?? 'anonymous'}] conv:${conversationId}`);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
      const stream = this.customerSupportAgent.getStreamEvents({
        message: dto.message,
        conversationId,
        userId,
      });

      for await (const event of stream as AsyncIterable<StreamEvent>) {
        if (event.event === 'on_chat_model_stream') {
          const content = event.data?.chunk?.content;
          if (content) {
            res.write(`data: ${JSON.stringify({ type: 'token', content })}\n\n`);
          }
        }
        if (event.event === 'on_tool_start') {
          res.write(
            `data: ${JSON.stringify({
              type: 'tool_call',
              name: event.name,
              input: event.data?.input,
            })}\n\n`,
          );
        }
      }

      res.write(`data: ${JSON.stringify({ type: 'done', conversationId })}\n\n`);
    } catch (err: unknown) {
      this.logger.error(
        'Customer support stream error',
        err instanceof Error ? err.stack : String(err),
      );
      res.write(
        `data: ${JSON.stringify({ type: 'error', message: 'An unexpected error occurred. Please try again.' })}\n\n`,
      );
    } finally {
      res.end();
    }
  }
}
