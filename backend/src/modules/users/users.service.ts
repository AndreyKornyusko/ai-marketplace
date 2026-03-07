import { Injectable, NotFoundException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { PrismaService } from '../../prisma/prisma.service';
import { UserDto } from '../auth/dto/user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { UserAddressDto } from './dto/user-address.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<UserDto> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: dto,
    });
    return plainToInstance(
      UserDto,
      { id: user.id, email: user.email, fullName: user.fullName, phone: user.phone, role: user.role },
      { excludeExtraneousValues: true },
    );
  }

  async getAddresses(userId: string): Promise<UserAddressDto[]> {
    const addresses = await this.prisma.userAddress.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });
    return addresses.map((a) => this.toAddressDto(a));
  }

  async createAddress(userId: string, dto: CreateAddressDto): Promise<UserAddressDto> {
    if (dto.isDefault === true) {
      await this.prisma.userAddress.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const address = await this.prisma.userAddress.create({
      data: {
        userId,
        label: dto.label,
        fullName: dto.fullName,
        phone: dto.phone,
        street: dto.street,
        city: dto.city,
        state: dto.state,
        zip: dto.zip,
        country: dto.country,
        isDefault: dto.isDefault ?? false,
      },
    });
    return this.toAddressDto(address);
  }

  async updateAddress(userId: string, id: string, dto: UpdateAddressDto): Promise<UserAddressDto> {
    const existing = await this.prisma.userAddress.findFirst({ where: { id, userId } });
    if (existing === null) {
      throw new NotFoundException('Address not found');
    }

    if (dto.isDefault === true) {
      await this.prisma.userAddress.updateMany({
        where: { userId, isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    const address = await this.prisma.userAddress.update({
      where: { id },
      data: dto,
    });
    return this.toAddressDto(address);
  }

  async deleteAddress(userId: string, id: string): Promise<void> {
    const existing = await this.prisma.userAddress.findFirst({ where: { id, userId } });
    if (existing === null) {
      throw new NotFoundException('Address not found');
    }
    await this.prisma.userAddress.delete({ where: { id } });
  }

  private toAddressDto(address: {
    id: string;
    label: string | null;
    fullName: string;
    phone: string | null;
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    isDefault: boolean;
    createdAt: Date;
  }): UserAddressDto {
    return plainToInstance(UserAddressDto, address, { excludeExtraneousValues: true });
  }
}
