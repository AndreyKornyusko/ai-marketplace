import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { PrismaModule } from '../../prisma/prisma.module';
import { WebhooksController } from './webhooks.controller';
import { InventoryController } from './inventory.controller';
import { WebhooksService } from './webhooks.service';
import { WebhookSignatureGuard } from './guards/webhook-signature.guard';

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [WebhooksController, InventoryController],
  providers: [WebhooksService, WebhookSignatureGuard],
  exports: [WebhooksService],
})
export class WebhooksModule {}
