import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [OrdersController, InventoryController],
  providers: [OrdersService, InventoryService],
  exports: [InventoryService],
})
export class OrdersModule {}
