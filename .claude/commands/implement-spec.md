# /implement-spec <spec-name>

Runs the full implementation cycle for a given spec.

## Usage

```
/implement-spec <spec-name>
```

Example: `/implement-spec 06-order-fulfillment-agent`

## Orchestrator Instructions

You are the orchestrator. Execute the following steps in order:

### Step 1 — Read and Analyze the Spec

Read `specs/<spec-name>.md` in full.
Identify:
- What type of spec is this? (database / backend / frontend / AI agent / N8N / full feature)
- Which agents are needed?
- What is the dependency order?
- Are there any prerequisite specs that must be implemented first?

### Step 2 — Determine Agent Sequence

Use this routing table:

| Spec type         | Agent sequence                                                                  |
|-------------------|---------------------------------------------------------------------------------|
| Database schema   | db-agent → backend-agent (models only)                                          |
| Backend feature   | db-agent (if schema changes) → backend-agent                                    |
| Frontend feature  | frontend-agent                                                                  |
| AI agent          | db-agent? → backend-agent (tools API) → ai-agent-builder                        |
| N8N workflow      | backend-agent (webhook endpoint) → n8n-agent                                    |
| Full feature      | db-agent → backend-agent + frontend-agent (parallel) → ai-agent-builder → n8n-agent |

### Step 3 — Run Implementer Agents (Sequential or Parallel per dependency)

For each implementer agent, pass:
- Full content of `specs/<spec-name>.md`
- Contents of all relevant skill files for that agent's domain
- Full content of existing files being modified
- Output from previous agents (if dependent)

### Step 4 — Run Reviewer Agents (Parallel)

Spawn simultaneously:
- spec-checker (with full spec + all new/modified files)
- backend-reviewer (if backend code was written)
- frontend-reviewer (if frontend code was written)
- security-reviewer (always — include session config, .env.example, webhooks)

### Step 5 — Fix All Red Findings

For every 🔴 finding from any reviewer:
1. Identify which implementer agent is responsible
2. Re-invoke that agent with the finding details and current file content
3. Re-run only the relevant reviewer to confirm fix

Do NOT proceed with ⚠️ or ❌ findings outstanding — fix or escalate.

### Step 6 — Write Tests

Invoke test-writer with:
- All new service files
- Relevant spec for expected behavior
- Priority: AI agent tools first, then services, then controllers

### Step 7 — Run Checks

Execute directly (no agent):
```bash
tsc --noEmit
eslint . --ext .ts,.tsx
```

Fix all type errors and lint errors before proceeding.

### Step 8 — Commit

Only after all reviewers return PASS or NEEDS WORK (no BLOCKED):

```bash
git add -A
git commit -m "feat(<scope>): <description> per spec-<NN>"
```

Scope examples: `db`, `backend`, `frontend`, `agents`, `n8n`, `catalog`, `checkout`
