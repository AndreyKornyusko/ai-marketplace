# Spec 07 — Customer Support Agent

**Status:** DRAFT

**Implemented by:** backend-agent (API), ai-agent-builder (agent)
**Reviewed by:** spec-checker, backend-reviewer, security-reviewer

---

## Overview

The CustomerSupportAgent handles pre-sale inquiries, product questions, shipping/return
policy questions, and general store FAQs using RAG over the product catalog and policy docs.

---

## Agent Responsibilities

- Answer product questions using semantic search over catalog
- Answer shipping, return, and policy questions using RAG over POLICIES_AND_FAQ
- Help customers find products that match their needs
- Quote product prices (with grounding — always from DB)
- Escalate to OrderFulfillmentAgent for order-specific questions
- Escalate to human for complex issues

---

## Tools

### search_catalog

```typescript
{
  name: 'search_catalog',
  description: 'Search the product catalog using semantic similarity. Use for product recommendations and availability questions.',
  schema: z.object({
    query: z.string(),
    category: z.string().optional(),
    maxResults: z.number().int().min(1).max(10).default(5),
  }),
}
```

### get_product_details

```typescript
{
  name: 'get_product_details',
  description: 'Get full product details including current price and stock. MUST call this before quoting price or availability.',
  schema: z.object({
    productId: z.string().uuid(),
  }),
}
```

### search_policies

```typescript
{
  name: 'search_policies',
  description: 'Search store policies and FAQ for relevant information.',
  schema: z.object({
    query: z.string(),
  }),
}
```

### escalate_to_order_agent

```typescript
{
  name: 'escalate_to_order_agent',
  description: 'Hand off to the OrderFulfillmentAgent when the customer has a specific order inquiry.',
  schema: z.object({
    reason: z.string(),
    orderId: z.string().uuid().optional(),
  }),
}
```

### escalate_to_human

```typescript
{
  name: 'escalate_to_human',
  description: 'Escalate to a human support agent for complex issues.',
  schema: z.object({
    reason: z.string(),
    summary: z.string(),
  }),
}
```

---

## RAG Pipeline

### Product Catalog RAG

- Source: `product_embeddings` table (pgvector)
- Embedding model: voyage-3 (1024 dimensions)
- Top-K: 5 results
- Filter: `stock > 0` by default (can be overridden for "do you carry X?" questions)
- Metadata returned: productId, name, price, stock, category, tags

### Policy RAG

- Source: embedded policy text from `specs/01-store-context.md` POLICIES_AND_FAQ section
- Stored in `policy_embeddings` table (separate from product embeddings)
- Top-K: 3 results

---

## Frontend — Inquiry Form

### Route

- `/support` — Customer support chat interface

### UI Requirements

1. Chat interface with message history
2. Typing indicator during agent processing
3. Product cards rendered in chat when agent recommends products
4. "Talk to human" button (always visible)
5. Streaming response display (token by token)

---

## NestJS Integration

### Endpoint

```
POST /api/v1/ai/customer-support
  Auth: optional (supports anonymous)
  Body: { message: string; conversationId?: string }

GET  /api/v1/ai/customer-support/stream
  Auth: optional
  SSE streaming endpoint
```

---

## Grounding Requirements

- MUST call `get_product_details` before quoting any price
- MUST call `search_catalog` before making product recommendations
- NEVER make up product names, prices, or stock levels

---

## Langfuse Tracing

Every invocation traced with:
- `userId`: authenticated user ID or `anonymous_<sessionId>`
- `sessionId`: conversationId
- Tags: `['customer-support', 'agent', 'rag']`

---

## Acceptance Criteria

1. Agent answers product questions using catalog data (not hallucinated facts)
2. Prices always come from `get_product_details` tool call
3. Policy answers reference actual store policies
4. Escalation to human triggers support ticket creation
5. Chat history maintained per `conversationId`
6. SSE streaming works end-to-end
7. Anonymous users can use the support chat without account
8. Langfuse trace created for every invocation
