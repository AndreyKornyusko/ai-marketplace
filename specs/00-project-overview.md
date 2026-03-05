# Spec 00 — Project Overview

**Status:** DRAFT — fill in before starting Phase 1

---

## Project Name

AI Fashion Shop

## One-Line Description

AI Fashion Shop is a clothing and footwear store where an intelligentassistant helps you find exactly what you need

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui |
| Backend | NestJS, TypeScript, Prisma ORM |
| Database | PostgreSQL 16 + pgvector extension |
| AI / Agents | LangChain (TypeScript), Claude claude-sonnet-4-6 |
| Embeddings | Voyage-3 (via Anthropic) |
| Automation | N8N (self-hosted) |
| Monitoring | Langfuse |
| Containerization | Docker Compose |
| Testing | Vitest + Testing Library |

## Repository Structure

```
/
├── app/                  ← Next.js App Router (frontend)
├── src/                  ← NestJS backend
│   └── modules/
│       ├── auth/
│       ├── products/
│       ├── orders/
│       ├── inventory/
│       ├── ai-agent/
│       └── webhooks/
├── prisma/               ← Prisma schema + migrations
├── n8n-workflows/        ← N8N workflow JSONs
├── scripts/              ← CLI scripts (seed, reindex)
├── specs/                ← Feature specifications (source of truth)
├── .claude/              ← Claude Code agent definitions
└── docker-compose.yml
```

## Architecture Decisions

1. **Monorepo** — frontend and backend co-located for shared types
2. **Agent-driven development** — all features implemented via Claude Code sub-agents
3. **Grounding-first AI** — all product facts validated against DB before agent responses
4. **N8N for automation** — external automation workflows managed separately from core code
5. **pgvector for RAG** — no separate vector DB, embeddings live in PostgreSQL
6. **Optional registration** — the store is fully accessible without an account. Registration is purely opt-in and unlocks three conveniences: order history, saved contact details (name, email, phone), and saved delivery addresses. All browsing, cart, and checkout flows work identically for guests.

## Conventions

- All files in English
- TypeScript strict mode everywhere (see `skills/typescript-strict.md`)
- Conventional commits: `feat/fix/chore/refactor(<scope>): <description>`
- One migration per logical schema change
- Reviewer agents (spec-checker, backend-reviewer, etc.) are read-only

## Auth Model

| Capability | Guest | Registered user |
|------------|-------|----------------|
| Browse catalog | ✅ | ✅ |
| Add to cart | ✅ | ✅ |
| Checkout | ✅ (email required) | ✅ (pre-filled) |
| Order history | ❌ | ✅ |
| Saved contact details | ❌ | ✅ |
| Saved delivery addresses | ❌ | ✅ (multiple) |
| AI support chat | ✅ (anonymous) | ✅ (identified) |

Registration flow: email + password only. No social login in v1.
No forced registration at any point — "Create account" is always optional.

## Environment Variables

See `.env.example` for required variables. Required at minimum:
- `DATABASE_URL`
- `ANTHROPIC_API_KEY`
- `JWT_SECRET`
- `WEBHOOK_SECRET`
- `LANGFUSE_PUBLIC_KEY` / `LANGFUSE_SECRET_KEY`
- `NEXT_PUBLIC_API_URL`
