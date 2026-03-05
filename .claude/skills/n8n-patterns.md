# N8N Patterns — StyleAI Shop

Reference guide for N8N workflow engineers.

## Webhook Contract

Every N8N → NestJS call must include an HMAC signature header.

### Signature Generation (N8N side)
```javascript
// N8N Code node — generate HMAC before HTTP request
const crypto = require('crypto');
const body = JSON.stringify($input.all()[0].json);
const signature = crypto
  .createHmac('sha256', $env.WEBHOOK_SECRET)
  .update(body)
  .digest('hex');
return [{ json: { ...($input.all()[0].json), _signature: `sha256=${signature}` } }];
```

### Signature Verification (NestJS side)
```typescript
// webhook-guard.ts
@Injectable()
export class WebhookSignatureGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const signature = req.headers['x-hub-signature-256'] as string;
    const body = JSON.stringify(req.body);
    const expected = `sha256=${crypto
      .createHmac('sha256', process.env.WEBHOOK_SECRET!)
      .update(body)
      .digest('hex')}`;
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  }
}
```

## Workflow JSON Skeleton

```json
{
  "name": "workflow-name",
  "nodes": [
    {
      "id": "webhook-node-id",
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 2,
      "position": [250, 300],
      "parameters": {
        "httpMethod": "POST",
        "path": "your-webhook-path",
        "responseMode": "onReceived",
        "responseData": "{ \"received\": true }"
      }
    }
  ],
  "connections": {},
  "settings": { "executionOrder": "v1" },
  "staticData": null,
  "tags": [{ "name": "styleai-shop" }]
}
```

## The Five Workflows — Contract Summary

### payment-processing
- Trigger: Stripe webhook → N8N
- N8N calls: `POST /api/v1/webhooks/payment-result`
- Payload: `{ orderId, status, transactionId, amount }`
- HMAC header: `X-Hub-Signature-256`

### cod-confirmation
- Trigger: N8N cron (scheduled 1h after COD order)
- N8N calls: `POST /api/v1/webhooks/cod-confirmation`
- Payload: `{ orderId, confirmedAt }`

### order-status-updates
- Trigger: NestJS calls N8N webhook when order status changes
- N8N sends notification (email/SMS via configured channel)
- NestJS calls: `POST <N8N_WEBHOOK_URL>/order-status`
- Payload: `{ orderId, customerId, oldStatus, newStatus }`

### low-stock-alert
- Trigger: N8N polls `GET /api/v1/inventory/low-stock` every 15 minutes
- N8N calls: `POST /api/v1/webhooks/low-stock-acknowledged`
- Alert sent to admin via configured channel (email/Slack)

### support-escalation
- Trigger: AI agent calls NestJS endpoint → NestJS calls N8N
- N8N calls: `POST /api/v1/webhooks/support-ticket-created`
- Payload: `{ ticketId, customerId, conversationId, reason }`

## Error Handling in N8N Workflows

Always add an "Error" branch after HTTP Request nodes:
```
HTTP Request → IF (response.status >= 400) → Error Handler node
                                            → Continue (success path)
```

Error handler should:
1. Log to N8N's execution log
2. Send alert to admin (Slack/email)
3. NOT silently fail

## Credential Management

Never hardcode secrets in workflow JSON. Use N8N credential references:
```json
{
  "credentials": {
    "httpHeaderAuth": { "id": "webhook-secret-cred-id", "name": "StyleAI Webhook Secret" }
  }
}
```
