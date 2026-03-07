import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { EmbeddingService } from './services/embedding.service';
import { VectorStoreService } from './services/vector-store.service';
import { GroundingGuardService } from './services/grounding-guard.service';
import { EmbeddingListener } from './listeners/embedding.listener';
import { CustomerSupportService } from './customer-support.service';
import { CustomerSupportController } from './customer-support.controller';
import { CustomerSupportAgent } from './agents/customer-support/customer-support.agent';

@Module({
  imports: [PrismaModule],
  controllers: [CustomerSupportController],
  providers: [
    EmbeddingService,
    VectorStoreService,
    GroundingGuardService,
    EmbeddingListener,
    CustomerSupportService,
    CustomerSupportAgent,
  ],
  exports: [
    EmbeddingService,
    VectorStoreService,
    GroundingGuardService,
    CustomerSupportService,
    CustomerSupportAgent,
  ],
})
export class AiAgentModule {}
