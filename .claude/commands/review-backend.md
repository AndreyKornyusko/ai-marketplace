# /review-backend [path]

NestJS code review. Read-only. Reports 🔴🟡🔵 findings.

## Usage

```
/review-backend [path]
```

- `path` — optional. File or directory to review. Defaults to `src/` if omitted.

Examples:
- `/review-backend src/modules/orders/`
- `/review-backend src/modules/ai-agent/services/grounding-guard.service.ts`
- `/review-backend` ← reviews all of src/

## Orchestrator Instructions

### Step 1 — Collect Files

If path provided:
- If directory: Glob `<path>/**/*.ts`
- If file: read that file directly

If no path: Glob `src/**/*.ts` (exclude `*.test.ts` and `*.spec.ts`)

Also always include:
- `skills/nestjs-patterns.md`
- `skills/typescript-strict.md`

### Step 2 — Invoke backend-reviewer

Pass:
- Full content of all target TypeScript files
- Content of `skills/nestjs-patterns.md`
- Content of `skills/typescript-strict.md`

### Step 3 — Display Report

Output backend-reviewer's full findings:
```
🔴 Error      — [file:line] [description] [fix required]
🟡 Warning    — [file:line] [description]
🔵 Suggestion — [description]
```

Followed by:
```
Overall: PASS | NEEDS WORK | BLOCKED
```

### Step 4 — Recommend Actions

- If BLOCKED: list 🔴 items with exact fix instructions
- Do not auto-fix — present findings to developer for review
