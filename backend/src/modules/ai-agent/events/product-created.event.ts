import { ProductForEmbedding } from '../services/embedding.service';

export class ProductCreatedEvent {
  constructor(public readonly product: ProductForEmbedding) {}
}
