import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';

import { WebhookSignatureGuard } from './guards/webhook-signature.guard';
import { WebhooksService } from './webhooks.service';
import {
  CodConfirmationDto,
  CodOrderCreatedDto,
  LowStockAcknowledgedDto,
  PaymentResultDto,
  SupportTicketCreatedDto,
} from './dto/webhook.dto';

@ApiTags('webhooks')
@Controller('api/v1/webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(private readonly webhooksService: WebhooksService) {}

  // ─── payment-processing workflow ──────────────────────────────────────────

  @Post('payment-result')
  @UseGuards(WebhookSignatureGuard)
  @HttpCode(HttpStatus.OK)
  @ApiSecurity('x-hub-signature-256')
  @ApiOperation({ summary: 'Receive payment result from N8N (Stripe relay)' })
  @ApiResponse({ status: 200, description: 'Received' })
  paymentResult(
    @Body() dto: PaymentResultDto,
  ): { received: true } {
    // Respond immediately; process async
    setImmediate(() => {
      this.webhooksService.handlePaymentResult(dto).catch((err: unknown) => {
        this.logger.error('handlePaymentResult failed', err);
      });
    });
    return { received: true };
  }

  // ─── cod-confirmation workflow ────────────────────────────────────────────

  @Post('cod-order-created')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Called by NestJS order creation to trigger N8N COD workflow',
  })
  @ApiResponse({ status: 200, description: 'Received' })
  codOrderCreated(
    @Body() dto: CodOrderCreatedDto,
  ): { received: true } {
    // This endpoint is the N8N trigger; NestJS uses N8N_COD_WEBHOOK_URL env var
    // to call N8N directly when a COD order is created.
    // This endpoint documents the contract and is used for integration tests.
    this.logger.log(`COD order created notification: ${dto.orderId}`);
    return { received: true };
  }

  @Post('cod-confirmation')
  @UseGuards(WebhookSignatureGuard)
  @HttpCode(HttpStatus.OK)
  @ApiSecurity('x-hub-signature-256')
  @ApiOperation({ summary: 'COD confirmation callback from N8N' })
  @ApiResponse({ status: 200, description: 'Received' })
  codConfirmation(
    @Body() dto: CodConfirmationDto,
  ): { received: true } {
    setImmediate(() => {
      this.webhooksService.handleCodConfirmation(dto).catch((err: unknown) => {
        this.logger.error('handleCodConfirmation failed', err);
      });
    });
    return { received: true };
  }

  // ─── low-stock-alert workflow ─────────────────────────────────────────────

  @Post('low-stock-acknowledged')
  @UseGuards(WebhookSignatureGuard)
  @HttpCode(HttpStatus.OK)
  @ApiSecurity('x-hub-signature-256')
  @ApiOperation({ summary: 'Low-stock alert acknowledged by N8N' })
  @ApiResponse({ status: 200, description: 'Received' })
  lowStockAcknowledged(
    @Body() dto: LowStockAcknowledgedDto,
  ): { received: true } {
    setImmediate(() => {
      this.webhooksService
        .handleLowStockAcknowledged(dto)
        .catch((err: unknown) => {
          this.logger.error('handleLowStockAcknowledged failed', err);
        });
    });
    return { received: true };
  }

  // ─── support-escalation workflow ──────────────────────────────────────────

  @Post('support-ticket-created')
  @UseGuards(WebhookSignatureGuard)
  @HttpCode(HttpStatus.OK)
  @ApiSecurity('x-hub-signature-256')
  @ApiOperation({ summary: 'Support ticket created callback from N8N' })
  @ApiResponse({ status: 200, description: 'Received' })
  supportTicketCreated(
    @Body() dto: SupportTicketCreatedDto,
  ): { received: true } {
    setImmediate(() => {
      this.webhooksService
        .handleSupportTicketCreated(dto)
        .catch((err: unknown) => {
          this.logger.error('handleSupportTicketCreated failed', err);
        });
    });
    return { received: true };
  }
}
