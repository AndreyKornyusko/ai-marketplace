import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EmbeddingService } from '../services/embedding.service';
import { ProductCreatedEvent } from '../events/product-created.event';
import { ProductUpdatedEvent } from '../events/product-updated.event';
import { ProductDeactivatedEvent } from '../events/product-deactivated.event';

@Injectable()
export class EmbeddingListener {
  private readonly logger = new Logger(EmbeddingListener.name);

  constructor(private readonly embeddingService: EmbeddingService) {}

  @OnEvent('product.created')
  async handleProductCreated(event: ProductCreatedEvent): Promise<void> {
    this.logger.log(`Auto-embedding new product: ${event.product.name}`);
    try {
      await this.embeddingService.embedProduct(event.product);
    } catch (err) {
      this.logger.error(`Failed to embed product ${event.product.id}`, err);
    }
  }

  @OnEvent('product.deactivated')
  async handleProductDeactivated(event: ProductDeactivatedEvent): Promise<void> {
    this.logger.log(`Updating embedding metadata for deactivated product: ${event.product.name}`);
    try {
      // Keep the embedding but update isActive: false in metadata (spec-08 re-index triggers)
      await this.embeddingService.updateProductMetadata(event.product.id, { isActive: false });
    } catch (err) {
      this.logger.error(`Failed to update metadata for product ${event.product.id}`, err);
    }
  }

  @OnEvent('product.updated')
  async handleProductUpdated(event: ProductUpdatedEvent): Promise<void> {
    const needsReEmbed =
      event.fields.includes('name') || event.fields.includes('description');

    if (!needsReEmbed) {
      return;
    }

    this.logger.log(`Re-embedding updated product: ${event.product.name}`);
    try {
      await this.embeddingService.embedProduct(event.product);
    } catch (err) {
      this.logger.error(`Failed to re-embed product ${event.product.id}`, err);
    }
  }
}
