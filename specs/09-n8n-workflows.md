# Spec 09 — N8N Workflows

**Status:** DRAFT

**Implemented by:** backend-agent (webhook endpoints), n8n-agent (workflow JSONs)
**Reviewed by:** spec-checker, security-reviewer

---

## Overview

Five N8N workflows automate key business events.
All N8N ↔ NestJS communication uses HMAC-signed webhooks.

---

## Workflow 1 — payment-processing

### Purpose
Receives Stripe payment webhooks via N8N and updates order status in NestJS.

### Trigger
Stripe webhook → N8N Webhook node

### Flow
```
Stripe Webhook
  → Verify Stripe signature
  → Extract event type (payment_intent.succeeded / payment_intent.payment_failed)
  → POST /api/v1/webhooks/payment-result (HMAC signed)
  → IF success: update order status to CONFIRMED
  → IF failure: update order status to CANCELLED, notify customer
  → Error path: alert admin
```

### NestJS Endpoint
```
POST /api/v1/webhooks/payment-result
Header: X-Hub-Signature-256: sha256=<hmac>
Body: { orderId: string; status: 'succeeded' | 'failed'; transactionId: string; amount: number }
```

---

## Workflow 2 — cod-confirmation

### Purpose
Schedules and sends order confirmation for COD (Cash on Delivery) orders.

### Trigger
NestJS calls N8N webhook when COD order is created.

### Flow
```
NestJS Webhook (COD order created)
  → Wait 1 hour (N8N Wait node)
  → GET /api/v1/orders/:orderId (verify still PENDING)
  → IF still pending: send confirmation message (email/SMS)
  → POST /api/v1/webhooks/cod-confirmation
  → Error path: alert admin
```

### NestJS Endpoints
```
POST /api/v1/webhooks/cod-order-created  (N8N trigger — called by NestJS)
POST /api/v1/webhooks/cod-confirmation   (N8N → NestJS after confirmation)
Header: X-Hub-Signature-256
Body: { orderId: string; confirmedAt: string }
```

---

## Workflow 3 — order-status-updates

### Purpose
Sends customer notifications when order status changes.

### Trigger
NestJS calls N8N webhook when order status changes.

### Flow
```
NestJS Webhook (status change)
  → Route by newStatus:
    CONFIRMED  → send "Order confirmed" email
    SHIPPED    → send "Order shipped" email with tracking
    DELIVERED  → send "Order delivered" email + review request
    CANCELLED  → send "Order cancelled" email
  → Error path: log + alert admin
```

### NestJS Endpoint (called BY NestJS to trigger N8N)
```
N8N Webhook URL: set as env var N8N_ORDER_STATUS_WEBHOOK_URL
Method: POST
Body: { orderId: string; customerId: string; email: string; oldStatus: string; newStatus: string; trackingNumber?: string }
```

---

## Workflow 4 — low-stock-alert

### Purpose
Monitors inventory and alerts admin when products fall below threshold.

### Trigger
N8N Schedule node — runs every 15 minutes.

### Flow
```
Schedule (every 15 min)
  → GET /api/v1/inventory/low-stock?threshold=5
  → IF results > 0:
    → Format alert message with product list
    → Send to admin (email + optional Slack)
    → POST /api/v1/webhooks/low-stock-acknowledged (mark as alerted to avoid spam)
  → Error path: alert admin via email
```

### NestJS Endpoints
```
GET  /api/v1/inventory/low-stock?threshold=5
  Auth: API key (N8N internal key)
  Returns: [{ productId, name, stock, threshold }]

POST /api/v1/webhooks/low-stock-acknowledged
  Header: X-Hub-Signature-256
  Body: { productIds: string[]; alertedAt: string }
```

---

## Workflow 5 — support-escalation

### Purpose
Creates a support ticket and notifies human agents when AI escalates.

### Trigger
NestJS calls N8N when CustomerSupportAgent or OrderFulfillmentAgent calls `escalate_to_human`.

### Flow
```
NestJS Webhook (escalation event)
  → Create ticket record (POST /api/v1/webhooks/support-ticket-created)
  → Notify human agent (email + optional Slack)
  → Set ticket status to IN_PROGRESS
  → Error path: alert admin
```

### NestJS Endpoint
```
POST /api/v1/webhooks/support-ticket-created
  Header: X-Hub-Signature-256
  Body: {
    ticketId: string;
    customerId: string | null;
    conversationId: string;
    agentType: 'order-fulfillment' | 'customer-support';
    reason: string;
    summary: string;
  }
```

---

## Security Requirements (all workflows)

1. All N8N → NestJS calls include `X-Hub-Signature-256: sha256=<hmac>` header
2. NestJS verifies signature with `WebhookSignatureGuard` before processing
3. Webhook secret stored in N8N credentials (never hardcoded in workflow JSON)
4. Webhook endpoints return `{ received: true }` immediately, process async
5. All webhook endpoints are NOT behind JWT auth (use HMAC instead)

---

## Acceptance Criteria

1. All 5 workflow JSONs exist in `n8n-workflows/`
2. All webhook paths in workflow JSONs match NestJS endpoint paths exactly
3. HMAC signing implemented in all N8N → NestJS calls
4. HMAC verification implemented in all NestJS webhook endpoints
5. Each workflow has error handling paths (no silent failures)
6. Workflows importable into N8N UI without manual editing
