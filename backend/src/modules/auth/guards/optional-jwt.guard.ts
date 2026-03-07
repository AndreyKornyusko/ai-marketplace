import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  // Returns undefined instead of throwing when no token present
  handleRequest<T>(_err: unknown, user: T): T {
    return user;
  }
}
