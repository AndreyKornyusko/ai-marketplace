import { Expose } from 'class-transformer';

export class UserDto {
  @Expose()
  id!: string;

  @Expose()
  email!: string;

  @Expose()
  fullName!: string;

  @Expose()
  phone!: string | null;

  @Expose()
  role!: string;
}

export class AuthResponseDto {
  accessToken!: string;
  user!: UserDto;
}
