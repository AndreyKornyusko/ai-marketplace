import { createHmac, timingSafeEqual } from 'crypto';

import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

@Injectable()
export class WebhookSignatureGuard implements CanActivate {
  private readonly logger = new Logger(WebhookSignatureGuard.name);

  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const signature = req.headers['x-hub-signature-256'];

    if (typeof signature !== 'string' || !signature.startsWith('sha256=')) {
      this.logger.warn('Missing or malformed X-Hub-Signature-256 header');
      throw new UnauthorizedException('Invalid webhook signature');
    }

    const secret = this.config.getOrThrow<string>('WEBHOOK_SECRET');
    const body = JSON.stringify(req.body);
    const expected = `sha256=${createHmac('sha256', secret)
      .update(body)
      .digest('hex')}`;

    let valid = false;
    try {
      valid = timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expected),
      );
    } catch {
      // Buffer length mismatch — signature is invalid
      valid = false;
    }

    if (!valid) {
      this.logger.warn('Webhook signature verification failed');
      throw new UnauthorizedException('Invalid webhook signature');
    }

    return true;
  }
}
