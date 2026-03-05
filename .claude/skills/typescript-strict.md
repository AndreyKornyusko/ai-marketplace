# TypeScript Strict Mode — StyleAI Shop

These rules apply to ALL TypeScript files in the project without exception.

## tsconfig.json Requirements

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true
  }
}
```

## Hard Rules — Zero Exceptions

```typescript
// NEVER use any
const data: any = response;           // BAD
const data: ProductDto = response;    // GOOD

// NEVER use @ts-ignore or @ts-expect-error
// @ts-ignore                         // BAD
// Fix the actual type issue instead

// NEVER use non-null assertion unless you've verified it's impossible to be null
const name = user!.name;              // BAD (usually)
const name = user.name ?? 'Unknown'; // GOOD

// NEVER cast to unknown then to specific type to bypass checks
const val = (response as unknown) as MyType;  // BAD — fix the actual type
```

## Utility Types — Use These

```typescript
// Instead of redefining types, use:
type CreateOrderInput = Omit<Order, 'id' | 'createdAt' | 'updatedAt'>;
type UpdateOrderInput = Partial<Pick<Order, 'status' | 'notes'>>;
type OrderSummary = Pick<Order, 'id' | 'status' | 'total'>;

// Readonly for data that should not be mutated
function processOrder(order: Readonly<Order>): void { ... }

// Record for key-value maps
const statusLabels: Record<OrderStatus, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  SHIPPED: 'Shipped',
};
```

## Function Signatures

```typescript
// Always type parameters and return values
async function findProduct(id: string): Promise<Product | null> { ... }

// Arrow functions in services/utilities
const calculateTotal = (items: CartItem[]): number =>
  items.reduce((sum, item) => sum + item.price * item.quantity, 0);

// Event handlers in React
const handleChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
  setValue(event.target.value);
};
```

## Discriminated Unions (for results / errors)

```typescript
type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

function parsePrice(raw: string): Result<number, string> {
  const price = parseFloat(raw);
  if (isNaN(price)) return { success: false, error: 'Invalid price format' };
  return { success: true, data: price };
}
```

## Type Guards

```typescript
function isProduct(value: unknown): value is Product {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'name' in value &&
    'price' in value
  );
}
```

## Enums vs Const Objects

Prefer const objects over TypeScript enums (better tree-shaking):

```typescript
// Preferred
export const OrderStatus = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  SHIPPED: 'SHIPPED',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
} as const;
export type OrderStatus = typeof OrderStatus[keyof typeof OrderStatus];

// Avoid (unless Prisma generates it)
enum OrderStatus { PENDING, CONFIRMED }
```

## Import Organization

```typescript
// 1. Node built-ins
import { createHmac } from 'crypto';

// 2. External packages (alphabetical)
import { Injectable } from '@nestjs/common';
import { z } from 'zod';

// 3. Internal absolute imports
import { PrismaService } from '@/prisma/prisma.service';

// 4. Relative imports
import { CreateOrderDto } from './dto/create-order.dto';
```
