import {
  IsArray,
  IsEnum,
  IsISO8601,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

// ─── payment-result ─────────────────────────────────────────────────────────

export class PaymentResultDto {
  @IsUUID()
  orderId!: string;

  @IsEnum(['succeeded', 'failed'])
  status!: 'succeeded' | 'failed';

  @IsString()
  @IsNotEmpty()
  transactionId!: string;

  @IsNumber()
  amount!: number;
}

// ─── cod-order-created ───────────────────────────────────────────────────────

export class CodOrderCreatedDto {
  @IsUUID()
  orderId!: string;
}

// ─── cod-confirmation ────────────────────────────────────────────────────────

export class CodConfirmationDto {
  @IsUUID()
  orderId!: string;

  @IsISO8601()
  confirmedAt!: string;
}

// ─── low-stock-acknowledged ──────────────────────────────────────────────────

export class LowStockAcknowledgedDto {
  @IsArray()
  @IsUUID('4', { each: true })
  productIds!: string[];

  @IsISO8601()
  alertedAt!: string;
}

// ─── support-ticket-created ──────────────────────────────────────────────────

export class SupportTicketCreatedDto {
  @IsUUID()
  ticketId!: string;

  @IsOptional()
  @IsUUID()
  customerId!: string | null;

  @IsString()
  @IsNotEmpty()
  conversationId!: string;

  @IsEnum(['order-fulfillment', 'customer-support'])
  agentType!: 'order-fulfillment' | 'customer-support';

  @IsString()
  @IsNotEmpty()
  reason!: string;

  @IsString()
  @IsNotEmpty()
  summary!: string;
}
