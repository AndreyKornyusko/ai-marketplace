# Spec 10 — GroundingGuard

**Status:** DRAFT

**Implemented by:** backend-agent (service), ai-agent-builder (integration)
**Reviewed by:** spec-checker, backend-reviewer, security-reviewer

---

## Overview

GroundingGuard is a validation middleware/service that ensures AI agent responses
never contain hallucinated product facts (prices, stock levels, product existence).

Every agent tool that deals with products or orders MUST go through GroundingGuard.

---

## Service Interface

```typescript
// src/modules/ai-agent/services/grounding-guard.service.ts

@Injectable()
export class GroundingGuardService {

  // Fetch ground truth for products from DB
  async validateProductFacts(productIds: string[]): Promise<GroundedProductFact[]>;

  // Validate a complete order intent before placing
  async validateOrderIntent(intent: OrderIntent): Promise<ValidationResult>;

  // Validate stock before any modification
  async validateStockAvailability(
    productId: string,
    requestedQuantity: number
  ): Promise<StockValidationResult>;

  // Validate price matches DB before quoting
  async validatePrice(
    productId: string,
    quotedPrice: number,
    tolerance?: number  // default 0.01 for floating point
  ): Promise<PriceValidationResult>;
}
```

---

## Types

```typescript
export interface GroundedProductFact {
  id: string;
  name: string;
  price: number;
  stock: number;
  isActive: boolean;
  isAvailable: boolean;  // isActive && stock > 0
}

export interface OrderIntent {
  productId: string;
  variantId?: string;
  quantity: number;
  expectedPrice: number;  // price the agent intends to quote/charge
}

export type ValidationResult =
  | { valid: true; groundedFacts: GroundedProductFact }
  | { valid: false; reason: string; groundedFacts?: GroundedProductFact };

export interface StockValidationResult {
  available: boolean;
  currentStock: number;
  requestedQuantity: number;
  reason?: string;
}

export interface PriceValidationResult {
  valid: boolean;
  dbPrice: number;
  quotedPrice: number;
  difference: number;
  reason?: string;
}
```

---

## Validation Rules

### validateOrderIntent

1. Product exists and `isActive = true`
2. `stock >= requestedQuantity`
3. `|quotedPrice - dbPrice| <= tolerance` (default 0.01)
4. If variant specified: variant exists and belongs to product, variant has sufficient stock

### validatePrice

1. Fetch price from DB
2. Compare with `quotedPrice`
3. If difference > tolerance: return `valid: false` with both prices
4. Tolerance: `0.01` for normal cases (floating point), `0.00` for payment processing

### validateStockAvailability

1. Fetch current stock from DB (NOT from cache)
2. Also check active `inventory_reservations` to get true available count
3. Available = `product.stock - SUM(active_reservations.quantity)`

---

## Mandatory Integration Points

The following agent tools MUST call GroundingGuard before executing:

| Agent | Tool | Guard Call |
|-------|------|------------|
| OrderFulfillmentAgent | `modify_order_quantity` | `validateStockAvailability` |
| OrderFulfillmentAgent | `cancel_order` | `validateOrderIntent` (pre-check) |
| CustomerSupportAgent | `get_product_details` | `validateProductFacts` (returns grounded data) |
| CustomerSupportAgent | `search_catalog` | `validateProductFacts` on all results |
| Both agents | Any price quote | `validatePrice` |

---

## Logging

Every GroundingGuard validation call must be logged:
```typescript
this.logger.log({
  event: 'grounding_check',
  productId,
  result: validationResult.valid ? 'pass' : 'fail',
  reason: validationResult.valid ? undefined : validationResult.reason,
  agentType,
  userId,
});
```

Failed grounding checks (valid: false) must also be sent to Langfuse as a span event.

---

## Module Registration

```typescript
// ai-agent.module.ts
@Module({
  providers: [
    GroundingGuardService,
    EmbeddingService,
    VectorStoreService,
    OrderFulfillmentAgent,
    CustomerSupportAgent,
  ],
  exports: [GroundingGuardService],
})
export class AiAgentModule {}
```

---

## Acceptance Criteria

1. `GroundingGuardService` injectable in any NestJS module
2. `validateProductFacts` fetches from DB (not cache)
3. `validateOrderIntent` fails if price difference > 0.01
4. `validateOrderIntent` fails if stock insufficient (considering reservations)
5. `validateStockAvailability` accounts for active inventory reservations
6. All validation failures are logged with reason
7. All validation failures emit Langfuse span event
8. OrderFulfillmentAgent cannot bypass grounding (verified by test)
9. CustomerSupportAgent cannot quote a price without calling `validatePrice`
