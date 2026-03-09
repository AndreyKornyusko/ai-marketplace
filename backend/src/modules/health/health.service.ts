import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

type StatusOk = 'ok';
type StatusError = 'error';
type StatusNotConfigured = 'not_configured';
type StatusDegraded = 'degraded';
type StatusDown = 'down';

export interface HealthResponse {
  status: StatusOk | StatusDegraded | StatusDown;
  db: StatusOk | StatusError;
  redis: StatusOk | StatusError | StatusNotConfigured;
  langfuse: StatusOk | StatusError | StatusNotConfigured;
  version: string;
  uptime: number;
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async check(): Promise<HealthResponse> {
    const [db, langfuse] = await Promise.all([
      this.checkDb(),
      this.checkLangfuse(),
    ]);

    // Redis is not currently wired into the app; report not_configured
    const redis: StatusNotConfigured = 'not_configured';

    let status: StatusOk | StatusDegraded | StatusDown;
    if (db === 'error') {
      status = 'down';
    } else if (langfuse === 'error') {
      status = 'degraded';
    } else {
      status = 'ok';
    }

    return {
      status,
      db,
      redis,
      langfuse,
      version: process.env['npm_package_version'] ?? '0.1.0',
      uptime: Math.floor(process.uptime()),
    };
  }

  private async checkDb(): Promise<StatusOk | StatusError> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return 'ok';
    } catch (err) {
      this.logger.error('Health check: DB unreachable', { error: String(err) });
      return 'error';
    }
  }

  private async checkLangfuse(): Promise<StatusOk | StatusError | StatusNotConfigured> {
    const secretKey = this.config.get<string>('LANGFUSE_SECRET_KEY');
    const publicKey = this.config.get<string>('LANGFUSE_PUBLIC_KEY');

    if (!secretKey || !publicKey) {
      return 'not_configured';
    }

    const baseUrl =
      this.config.get<string>('LANGFUSE_BASE_URL') ?? 'https://cloud.langfuse.com';

    try {
      const response = await fetch(`${baseUrl}/api/public/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(3000),
      });
      return response.ok ? 'ok' : 'error';
    } catch (err) {
      this.logger.warn('Health check: Langfuse unreachable', { error: String(err) });
      return 'error';
    }
  }
}
