import { ProductForEmbedding } from '../services/embedding.service';

export class ProductDeactivatedEvent {
  constructor(public readonly product: ProductForEmbedding) {}
}
