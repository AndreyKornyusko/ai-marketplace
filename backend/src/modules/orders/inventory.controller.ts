import {
  Controller,
  Get,
  Query,
  ForbiddenException,
  Headers,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiHeader } from '@nestjs/swagger';
import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { Throttle } from '@nestjs/throttler';
import { ProductSummaryDto } from '../products/dto/product-summary.dto';
import { InventoryService } from './inventory.service';

class LowStockQueryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  @Type(() => Number)
  threshold?: number;
}

@ApiTags('inventory')
@Controller('api/v1/inventory')
export class InventoryController {
  private readonly logger = new Logger(InventoryController.name);

  constructor(
    private readonly inventoryService: InventoryService,
    private readonly config: ConfigService,
  ) {}

  @Get('low-stock')
  @Throttle({ default: { ttl: 60000, limit: 30 } })
  @ApiOperation({ summary: 'Get products with stock at or below threshold (internal N8N use)' })
  @ApiHeader({ name: 'x-api-key', description: 'Internal API key', required: true })
  @ApiQuery({ name: 'threshold', required: false, type: Number, description: 'Stock threshold (default: 5)' })
  @ApiResponse({ status: 200, type: [ProductSummaryDto] })
  @ApiResponse({ status: 403, description: 'Invalid or missing API key' })
  async getLowStock(
    @Headers('x-api-key') apiKey: string | undefined,
    @Query() query: LowStockQueryDto,
  ): Promise<ProductSummaryDto[]> {
    const expectedKey = this.config.get<string>('INTERNAL_API_KEY');
    if (!expectedKey || apiKey !== expectedKey) {
      this.logger.warn('Low-stock endpoint: invalid API key attempt');
      throw new ForbiddenException('Invalid API key');
    }

    const envThreshold = this.config.get<string>('LOW_STOCK_THRESHOLD');
    const threshold = query.threshold ?? (envThreshold ? parseInt(envThreshold, 10) : 5);

    return this.inventoryService.getLowStockProducts(threshold);
  }
}
