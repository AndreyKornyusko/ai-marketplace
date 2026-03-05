# Grounding Patterns — StyleAI Shop

Reference guide for AI agent engineers. All agents that handle orders or prices MUST implement these patterns.

## The Grounding Problem

LLMs can hallucinate product names, prices, and stock levels.
A customer should never be told a product costs $X if the DB says $Y.
A customer should never be told an item is in stock if it's sold out.

**Rule: Every fact about a product that matters to a customer MUST come from the database, not from the LLM's training data or conversation context.**

## GroundingGuard Service

```typescript
// src/modules/ai-agent/services/grounding-guard.service.ts
@Injectable()
export class GroundingGuardService {
  constructor(private readonly prisma: PrismaService) {}

  async validateProductFacts(productIds: string[]): Promise<GroundedProductFact[]> {
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, price: true, stock: true, isActive: true },
    });

    return products.map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      stock: p.stock,
      isAvailable: p.isActive && p.stock > 0,
    }));
  }

  async validateOrderIntent(intent: OrderIntent): Promise<ValidationResult> {
    const facts = await this.validateProductFacts([intent.productId]);
    const product = facts[0];

    if (!product) {
      return { valid: false, reason: 'Product not found in catalog' };
    }
    if (!product.isAvailable) {
      return { valid: false, reason: `${product.name} is currently out of stock` };
    }
    if (intent.quantity > product.stock) {
      return {
        valid: false,
        reason: `Only ${product.stock} units available, requested ${intent.quantity}`,
      };
    }
    if (Math.abs(intent.expectedPrice - product.price) > 0.01) {
      return {
        valid: false,
        reason: `Price mismatch: DB has $${product.price}, agent quoted $${intent.expectedPrice}`,
      };
    }
    return { valid: true, groundedFacts: product };
  }
}
```

## Mandatory Check Points

### 1. Before Confirming Any Order

```typescript
// In OrderFulfillmentAgent — BEFORE creating the order
const validation = await groundingGuard.validateOrderIntent({
  productId: parsedIntent.productId,
  quantity: parsedIntent.quantity,
  expectedPrice: parsedIntent.price,  // price from agent's context
});

if (!validation.valid) {
  return `I cannot confirm this order: ${validation.reason}. Please verify the details.`;
}

// Only proceed with validation.groundedFacts — not the agent's numbers
const confirmedPrice = validation.groundedFacts!.price;
```

### 2. Before Quoting Stock Availability

```typescript
// In CustomerSupportAgent — before answering stock questions
const stockCheckTool = new DynamicStructuredTool({
  name: 'check_stock_availability',
  description: 'Check real-time stock for a product. MUST call this before saying a product is in/out of stock.',
  schema: z.object({ productId: z.string().uuid() }),
  func: async ({ productId }) => {
    const facts = await groundingGuard.validateProductFacts([productId]);
    return JSON.stringify(facts[0] ?? { error: 'Product not found' });
  },
});
```

### 3. Before Quoting Prices

```typescript
// Price MUST come from the tool call result, never from conversation history
const getPriceTool = new DynamicStructuredTool({
  name: 'get_current_price',
  description: 'Get the current price from the database. ALWAYS call this before quoting a price.',
  schema: z.object({ productId: z.string().uuid() }),
  func: async ({ productId }) => {
    const facts = await groundingGuard.validateProductFacts([productId]);
    return JSON.stringify({ price: facts[0]?.price ?? null });
  },
});
```

## System Prompt Instructions for Agents

Include in every agent's system prompt:

```
GROUNDING RULES (MANDATORY):
1. You MUST call check_stock_availability before telling a customer whether a product is available.
2. You MUST call get_current_price before quoting any price to a customer.
3. You MUST call validate_order before confirming any order.
4. NEVER use prices or stock levels from your training data or conversation history.
5. If a grounding check fails, tell the customer you need to verify and try again.
```

## Types

```typescript
export interface GroundedProductFact {
  id: string;
  name: string;
  price: number;
  stock: number;
  isAvailable: boolean;
}

export interface OrderIntent {
  productId: string;
  quantity: number;
  expectedPrice: number;
}

export type ValidationResult =
  | { valid: true; groundedFacts: GroundedProductFact }
  | { valid: false; reason: string };
```
