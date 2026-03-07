import { ProductForEmbedding } from '../services/embedding.service';

export type ProductField = 'name' | 'description' | 'price' | 'category' | 'tags' | 'isActive' | 'imageUrl' | 'stock';

export class ProductUpdatedEvent {
  constructor(
    public readonly product: ProductForEmbedding,
    public readonly fields: ProductField[],
  ) {}
}
