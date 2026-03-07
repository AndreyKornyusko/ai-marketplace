import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/types/jwt-payload';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { UserAddressDto } from './dto/user-address.dto';
import { UserDto } from '../auth/dto/user.dto';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Patch('me')
  updateProfile(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateProfileDto,
  ): Promise<UserDto> {
    return this.usersService.updateProfile(user.sub, dto);
  }

  @Get('me/addresses')
  getAddresses(@CurrentUser() user: JwtPayload): Promise<UserAddressDto[]> {
    return this.usersService.getAddresses(user.sub);
  }

  @Post('me/addresses')
  createAddress(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateAddressDto,
  ): Promise<UserAddressDto> {
    return this.usersService.createAddress(user.sub, dto);
  }

  @Patch('me/addresses/:id')
  updateAddress(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateAddressDto,
  ): Promise<UserAddressDto> {
    return this.usersService.updateAddress(user.sub, id, dto);
  }

  @Delete('me/addresses/:id')
  @HttpCode(200)
  async deleteAddress(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ): Promise<{ success: true }> {
    await this.usersService.deleteAddress(user.sub, id);
    return { success: true };
  }
}
