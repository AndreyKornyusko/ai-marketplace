# /review-frontend [path]

Next.js/React code review. Read-only. Reports 🔴🟡🔵 findings.

## Usage

```
/review-frontend [path]
```

- `path` — optional. File or directory to review. Defaults to `app/` and `components/` if omitted.

Examples:
- `/review-frontend app/(store)/products/`
- `/review-frontend components/catalog/ProductGrid.tsx`
- `/review-frontend` ← reviews all of app/ and components/

## Orchestrator Instructions

### Step 1 — Collect Files

If path provided:
- If directory: Glob `<path>/**/*.tsx` and `<path>/**/*.ts`
- If file: read that file directly

If no path: Glob `app/**/*.tsx`, `app/**/*.ts`, `components/**/*.tsx`

Always include:
- `skills/nextjs-seo-patterns.md`
- `skills/typescript-strict.md`

### Step 2 — Invoke frontend-reviewer

Pass:
- Full content of all target TSX/TS files
- Content of `skills/nextjs-seo-patterns.md`
- Content of `skills/typescript-strict.md`

### Step 3 — Display Report

Output frontend-reviewer's full findings:
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
