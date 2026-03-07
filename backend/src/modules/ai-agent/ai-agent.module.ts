import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { EmbeddingService } from './services/embedding.service';
import { VectorStoreService } from './services/vector-store.service';
import { EmbeddingListener } from './listeners/embedding.listener';

@Module({
  imports: [PrismaModule],
  providers: [EmbeddingService, VectorStoreService, EmbeddingListener],
  exports: [EmbeddingService, VectorStoreService],
})
export class AiAgentModule {}
