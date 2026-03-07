import { Expose } from 'class-transformer';

export class UserAddressDto {
  @Expose()
  id!: string;

  @Expose()
  label!: string | null;

  @Expose()
  fullName!: string;

  @Expose()
  phone!: string | null;

  @Expose()
  street!: string;

  @Expose()
  city!: string;

  @Expose()
  state!: string;

  @Expose()
  zip!: string;

  @Expose()
  country!: string;

  @Expose()
  isDefault!: boolean;

  @Expose()
  createdAt!: Date;
}
