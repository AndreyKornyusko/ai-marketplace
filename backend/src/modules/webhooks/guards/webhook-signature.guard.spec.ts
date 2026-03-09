import { createHmac } from 'crypto';

import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { WebhookSignatureGuard } from './webhook-signature.guard';

const WEBHOOK_SECRET = 'test-secret-value';

function makeContext(body: object, signature: string | undefined): ExecutionContext {
  const req = {
    body,
    headers: signature !== undefined
      ? { 'x-hub-signature-256': signature }
      : {},
  };

  return {
    switchToHttp: () => ({
      getRequest: () => req,
    }),
  } as unknown as ExecutionContext;
}

function validSignature(body: object): string {
  const bodyStr = JSON.stringify(body);
  const hex = createHmac('sha256', WEBHOOK_SECRET).update(bodyStr).digest('hex');
  return `sha256=${hex}`;
}

describe('WebhookSignatureGuard', () => {
  let guard: WebhookSignatureGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhookSignatureGuard,
        {
          provide: ConfigService,
          useValue: { getOrThrow: () => WEBHOOK_SECRET },
        },
      ],
    }).compile();

    guard = module.get<WebhookSignatureGuard>(WebhookSignatureGuard);
  });

  it('returns true for a valid HMAC signature', () => {
    const body = { orderId: 'order-1', status: 'succeeded' };
    const context = makeContext(body, validSignature(body));

    expect(guard.canActivate(context)).toBe(true);
  });

  it('throws UnauthorizedException when signature header is missing', () => {
    const body = { orderId: 'order-1' };
    const context = makeContext(body, undefined);

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('throws UnauthorizedException when signature header does not start with sha256=', () => {
    const body = { orderId: 'order-1' };
    const context = makeContext(body, 'md5=abc123');

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('throws UnauthorizedException when signature is wrong', () => {
    const body = { orderId: 'order-1' };
    const context = makeContext(body, 'sha256=wronghash');

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('throws UnauthorizedException when body does not match signature', () => {
    const signedBody = { orderId: 'order-1' };
    const differentBody = { orderId: 'order-2' }; // different body

    const context = makeContext(differentBody, validSignature(signedBody));

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });
});
