# StyleAI Shop — Claude Code Project Conventions

## Development Workflow

All development follows the agent-driven workflow defined in `.claude/agents/`.
Use slash commands to trigger work:

```
/implement-spec <spec-name>   — implement a full feature from spec
/review-spec <spec-name>      — check compliance against spec
/review-backend [path]        — NestJS code review
/review-frontend [path]       — Next.js code review
/review-security [path|--full]— OWASP security audit
/write-tests <file>           — generate tests for a file
/seed-embeddings              — populate pgvector with product embeddings
/sync-n8n <workflow-name>     — generate/update N8N workflow JSON
/run-checks                   — tsc --noEmit && eslint (final gate)
```

## Implementation Order

See the dependency graph in `.claude/agents/orchestrator.md`:

1. Phase 1 — Infrastructure: `/implement-spec 02-database-schema`
2. Phase 2 — Store Context: `/implement-spec 01-store-context` + `/seed-embeddings`
3. Phase 3 — Core Backend: specs 03 + 04 (backend parts)
4. Phase 4 — Frontend: specs 03 + 04 (frontend parts)
5. Phase 5 — Cart & Checkout: `/implement-spec 05-cart-checkout`
6. Phase 6 — AI Agents: specs 08 + 10 + 06 + 07
7. Phase 7 — Automation: `/implement-spec 09-n8n-workflows`
8. Phase 8 — Monitoring: `/implement-spec 11-monitoring`

## Agent Rules

- Implementer agents (db, backend, frontend, ai-agent-builder, n8n, embedding, test-writer): **write code**
- Reviewer agents (spec-checker, backend-reviewer, frontend-reviewer, security-reviewer): **read only — never write files**
- Orchestrator coordinates — does not write feature code directly

## Languages & Files

- All source code: TypeScript (strict mode — see `.claude/skills/typescript-strict.md`)
- All files: English only
- No `any` types, no `@ts-ignore`

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 App Router + TypeScript + Tailwind + shadcn/ui |
| Backend | NestJS + TypeScript + Prisma |
| Database | PostgreSQL 16 + pgvector |
| AI / Agents | LangChain (TS) + Claude claude-sonnet-4-6 |
| Automation | N8N (self-hosted) |
| Monitoring | Langfuse |

## Commit Convention

```
feat(<scope>): <description> per spec-<NN>
fix(<scope>): <description>
chore(<scope>): <description>
```

Scopes: `db`, `backend`, `frontend`, `agents`, `n8n`, `catalog`, `checkout`, `monitoring`

Only commit after all reviewers return PASS or NEEDS WORK (no BLOCKED).

## Key Files

| File | Purpose |
|------|---------|
| `specs/00-project-overview.md` | Stack, architecture decisions |
| `specs/01-store-context.md` | STORE_PROFILE, CATALOG_SPEC, POLICIES_AND_FAQ |
| `specs/02-database-schema.md` | Full PostgreSQL schema |
| `.claude/agents/orchestrator.md` | Agent coordination logic |
| `.claude/skills/grounding-patterns.md` | GroundingGuard — read before any AI agent work |
| `prisma/schema.prisma` | Prisma data models |
| `n8n-workflows/` | N8N workflow JSONs |

## Before You Start (Human Tasks)

Fill in these files before running any `/implement-spec` command:

1. `specs/00-project-overview.md` — project name and description
2. `specs/01-store-context.md` — product catalog and store policies
3. `.env` — copy from `.env.example` and fill in all values

## Security Non-Negotiables

- Never commit `.env` — use `.env.example` with placeholder values
- All webhook endpoints must verify HMAC signatures
- All AI agent price/stock facts must go through GroundingGuard
- `/review-security --full` before any production deployment
