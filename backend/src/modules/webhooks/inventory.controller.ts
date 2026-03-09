import { timingSafeEqual } from 'crypto';

import {
  Controller,
  DefaultValuePipe,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';

import { WebhooksService, type LowStockItem } from './webhooks.service';

@ApiTags('inventory')
@Controller('api/v1/inventory')
export class InventoryController {
  constructor(
    private readonly webhooksService: WebhooksService,
    private readonly config: ConfigService,
  ) {}

  @Get('low-stock')
  @HttpCode(HttpStatus.OK)
  @ApiSecurity('x-api-key')
  @ApiOperation({
    summary: 'Get products below stock threshold (N8N internal API key auth)',
  })
  @ApiResponse({ status: 200, description: 'Low stock product list' })
  getLowStock(
    @Headers('x-api-key') apiKey: string | undefined,
    @Query('threshold', new DefaultValuePipe(5), ParseIntPipe)
    threshold: number,
  ): Promise<LowStockItem[]> {
    const expectedKey = this.config.getOrThrow<string>('N8N_INTERNAL_API_KEY');

    if (typeof apiKey !== 'string') {
      throw new UnauthorizedException('Invalid API key');
    }

    let valid = false;
    try {
      valid = timingSafeEqual(
        Buffer.from(apiKey),
        Buffer.from(expectedKey),
      );
    } catch {
      valid = false;
    }

    if (!valid) {
      throw new UnauthorizedException('Invalid API key');
    }

    return this.webhooksService.getLowStockItems(threshold);
  }
}
