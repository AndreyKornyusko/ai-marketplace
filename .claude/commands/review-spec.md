# /review-spec <spec-name>

Checks implementation compliance against a spec. Read-only.

## Usage

```
/review-spec <spec-name>
```

Example: `/review-spec 03-catalog-frontend`

## Orchestrator Instructions

### Step 1 — Gather Context

Read:
1. `specs/<spec-name>.md` — the full spec (source of truth)
2. All implementation files relevant to this spec (Glob for module paths, components, etc.)
3. Related specs if the target spec references them

### Step 2 — Invoke spec-checker

Pass to spec-checker:
- Full content of `specs/<spec-name>.md`
- Full content of all identified implementation files
- Any referenced skill files that define patterns the spec relies on

### Step 3 — Display Report

Output the spec-checker's full compliance table:

```
✅ Criterion N — implemented [file:line]
⚠️ Criterion N — partial: [what is missing]
❌ Criterion N — not implemented
🔴 Conflict    — implementation contradicts spec
```

Followed by the summary:
```
Overall: PASS | NEEDS WORK | BLOCKED
```

### Step 4 — Recommend Next Steps

- If PASS: no action needed
- If NEEDS WORK: list ⚠️ items with suggested agent to invoke
- If BLOCKED: list ❌ and 🔴 items — must fix before any commit
