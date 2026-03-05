# /sync-n8n <workflow-name>

Generates or updates an N8N workflow JSON and verifies webhook contracts.

## Usage

```
/sync-n8n <workflow-name>
```

Valid workflow names:
- `payment-processing`
- `cod-confirmation`
- `order-status-updates`
- `low-stock-alert`
- `support-escalation`

Example: `/sync-n8n payment-processing`

## Orchestrator Instructions

### Step 1 — Gather Context

Read:
1. `specs/09-n8n-workflows.md` — full workflow spec (all 5 workflows are in this file)
2. `skills/n8n-patterns.md` — webhook contract format and JSON structure
3. Existing workflow JSON if it exists: `n8n-workflows/<workflow-name>.json`
4. The relevant NestJS webhook endpoint — Grep for `@Post` handlers in
   `src/modules/` matching the workflow's inbound webhook path

### Step 2 — Verify Backend Endpoint Exists

Confirm the NestJS webhook receiver endpoint exists before generating the workflow.
If it doesn't exist: output "Backend webhook endpoint missing. Run
/implement-spec 09-n8n-workflows (backend part) first." and stop.

### Step 3 — Invoke n8n-agent

Pass:
- Full content of `specs/09-n8n-workflows.md`
- Full content of `skills/n8n-patterns.md`
- The specific workflow name to generate/update
- Existing workflow JSON (if any) for diffing
- The NestJS webhook endpoint code

### Step 4 — Verify Contracts

n8n-agent performs contract verification:
- [ ] Webhook URL path matches NestJS endpoint exactly
- [ ] HTTP method is POST
- [ ] HMAC header name matches backend validation
- [ ] Payload shape matches NestJS DTO fields
- [ ] Error paths have fallback/error nodes

If any contract check fails: output the mismatch and block until resolved.

### Step 5 — Output Import Instructions

```
SYNC N8N COMPLETE
Workflow: <workflow-name>
File: n8n-workflows/<workflow-name>.json
Contracts: VERIFIED | FAILED

Import instructions:
  1. Open N8N UI → Workflows → Import from file
  2. Select: n8n-workflows/<workflow-name>.json
  3. Configure credentials:
     [list of credential names needed]
  4. Set environment variables:
     WEBHOOK_SECRET=<from .env>
  5. Activate workflow
  6. Test with: curl -X POST <webhook-url> -H "X-Hub-Signature-256: <hmac>" -d '{...}'
```
