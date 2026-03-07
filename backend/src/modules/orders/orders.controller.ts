import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt.guard';
import {
  CurrentUser,
  OptionalCurrentUser,
} from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/types/jwt-payload';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { CreatePaymentIntentDto } from './dto/payment-intent.dto';
import {
  CreateOrderResponseDto,
  OrderDto,
  PaymentIntentResponseDto,
} from './dto/order.dto';

@ApiTags('orders')
@Controller('api/v1/orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @UseGuards(OptionalJwtAuthGuard)
  createOrder(
    @Body() dto: CreateOrderDto,
    @OptionalCurrentUser() user: JwtPayload | undefined,
  ): Promise<CreateOrderResponseDto> {
    return this.ordersService.createOrder(dto, user?.sub ?? null);
  }

  @Post('payment-intent')
  @UseGuards(OptionalJwtAuthGuard)
  createPaymentIntent(
    @Body() dto: CreatePaymentIntentDto,
  ): Promise<PaymentIntentResponseDto> {
    return this.ordersService.createPaymentIntent(dto);
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  listOrders(
    @CurrentUser() user: JwtPayload,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<{ data: OrderDto[]; total: number; page: number; totalPages: number }> {
    return this.ordersService.listOrders(user.sub, page, limit);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  getOrder(
    @Param('id') id: string,
    @OptionalCurrentUser() user: JwtPayload | undefined,
  ): Promise<OrderDto> {
    return this.ordersService.getOrder(id, user?.sub ?? null);
  }
}
