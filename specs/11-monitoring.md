# Spec 11 — Monitoring & Observability

**Status:** DRAFT

**Implemented by:** backend-agent (instrumentation), ai-agent-builder (Langfuse tracing)
**Reviewed by:** spec-checker, security-reviewer

---

## Overview

Three monitoring concerns:
1. **Langfuse** — LLM tracing (agent runs, tool calls, latency, costs)
2. **Low-stock alerts** — inventory monitoring via N8N workflow-4
3. **Error handling** — structured error logging and alerting

---

## Langfuse Integration

### Setup

```typescript
// src/modules/ai-agent/langfuse.service.ts
import Langfuse from 'langfuse';

@Injectable()
export class LangfuseService {
  private readonly client: Langfuse;

  constructor(private readonly config: ConfigService) {
    this.client = new Langfuse({
      publicKey: config.getOrThrow('LANGFUSE_PUBLIC_KEY'),
      secretKey: config.getOrThrow('LANGFUSE_SECRET_KEY'),
      baseUrl: config.get('LANGFUSE_BASE_URL', 'https://cloud.langfuse.com'),
    });
  }
}
```

### What to Trace

Every AI agent invocation creates a Langfuse trace:

```typescript
const trace = langfuse.trace({
  name: 'order-fulfillment-agent',
  userId: userId,
  sessionId: conversationId,
  metadata: { orderId, messageCount: history.length },
  tags: ['order-fulfillment', 'production'],
});

// Each tool call creates a span
const span = trace.span({
  name: 'check_stock_batch',
  input: { productIds },
  startTime: new Date(),
});
span.end({ output: stockResults });

// Each LLM call creates a generation
const generation = trace.generation({
  name: 'agent-step',
  model: 'claude-sonnet-4-6',
  input: messages,
  output: response,
  usage: { promptTokens, completionTokens },
});
```

### Trace Requirements

| Agent | Required trace fields |
|-------|-----------------------|
| OrderFulfillmentAgent | `userId`, `sessionId`, `orderId` (if applicable) |
| CustomerSupportAgent | `userId` or `anonymous_<id>`, `sessionId` |
| GroundingGuard failures | Span event on parent trace with `name: 'grounding_failure'` |

### Langfuse Scores

After each conversation ends, score the trace:
```typescript
trace.score({ name: 'escalated', value: wasEscalated ? 1 : 0 });
trace.score({ name: 'grounding_failures', value: groundingFailureCount });
```

---

## Low-Stock Alerts

Handled by N8N workflow-4 (`low-stock-alert`). See `specs/09-n8n-workflows.md`.

### NestJS Side — Low Stock Endpoint

```
GET /api/v1/inventory/low-stock?threshold=5
  Auth: API key (internal — N8N only)
  Returns: ProductSummaryDto[] — products with stock <= threshold
```

### Alert Threshold

Default threshold: 5 units. Configurable via env var `LOW_STOCK_THRESHOLD`.

### Alert Cooldown

After alerting for a product, do not alert again for 4 hours.
Use `low_stock_alerts` table to track:
```sql
CREATE TABLE low_stock_alerts (
  product_id UUID NOT NULL REFERENCES products(id),
  alerted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (product_id)
  -- upsert on product_id to update timestamp
);
```

---

## Structured Error Logging

### NestJS Logger Setup

```typescript
// main.ts
app.useLogger(new ConsoleLogger());  // or Winston/Pino in production

// In services
private readonly logger = new Logger(ServiceName.name);

this.logger.error('Order creation failed', {
  orderId,
  userId,
  error: error.message,
  stack: error.stack,
});
```

### Error Events to Log

| Event | Level | Required fields |
|-------|-------|----------------|
| Order creation failed | ERROR | orderId, userId, error |
| Payment webhook received invalid signature | WARN | ip, timestamp |
| AI agent grounding check failed | WARN | productId, agentType, userId |
| AI agent escalation triggered | INFO | agentType, userId, reason |
| Stock reservation failed | ERROR | productId, orderId, requestedQty, availableQty |
| N8N webhook call failed | ERROR | workflow, statusCode, body |

### What NOT to Log

- Passwords or password hashes
- Full credit card numbers
- JWT tokens or secrets
- Full request bodies for payment endpoints

---

## Health Check Endpoint

```
GET /api/v1/health
  Returns: {
    status: 'ok' | 'degraded' | 'down',
    db: 'ok' | 'error',
    redis: 'ok' | 'error' | 'not_configured',
    langfuse: 'ok' | 'error' | 'not_configured',
    version: string,
    uptime: number
  }
```

---

## Acceptance Criteria

1. Every AI agent invocation creates a Langfuse trace with correct userId/sessionId
2. All tool calls create Langfuse spans with input/output
3. Grounding failures emit Langfuse span events
4. `GET /api/v1/inventory/low-stock` returns correct products
5. Low-stock alert cooldown prevents duplicate alerts within 4 hours
6. Error events logged at correct severity levels
7. No secrets (passwords, tokens) appear in logs
8. `GET /api/v1/health` returns 200 with DB status
