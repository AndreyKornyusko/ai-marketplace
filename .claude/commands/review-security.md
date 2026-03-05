# /review-security [path|--full]

OWASP A01-A10 security audit. Read-only. 🔴 BLOCKED = do not ship.

## Usage

```
/review-security [path|--full]
```

- `path` — specific file or directory to audit
- `--full` — audit all source files (use before any production release)
- No argument — audit recently changed files (from git diff)

Examples:
- `/review-security src/modules/orders/`
- `/review-security --full`
- `/review-security` ← git diff scope

## Orchestrator Instructions

### Step 1 — Determine Scope

Always include in scope, regardless of target:
- `src/config/` or any session/CORS/helmet configuration
- `.env.example`
- All files matching `*.webhook*.ts` or `*webhook*.ts`
- Auth module: `src/modules/auth/**`

If `--full`: Glob `src/**/*.ts` and `app/**/*.ts`
If path provided: Glob `<path>/**/*.ts`
If no argument: run `git diff --name-only HEAD` to get changed files

### Step 2 — Invoke security-reviewer

Pass:
- Full content of all target files
- Full content of always-in-scope files
- No skill files needed — security-reviewer has built-in OWASP checklist

### Step 3 — Display Report

Output security-reviewer's full findings grouped by OWASP category:
```
🔴 BLOCKED    — critical: [OWASP A0X] [file:line] [impact] [fix]
🔴 Error      — must fix: [OWASP A0X] [file:line] [impact] [fix]
🟡 Warning    — should fix: [OWASP A0X] [description]
🔵 Suggestion — hardening: [description]
```

Followed by:
```
Overall: PASS | NEEDS WORK | BLOCKED
```

### Step 4 — Gate Decision

- If BLOCKED (any 🔴): output "DO NOT COMMIT. Fix all 🔴 findings first."
- If NEEDS WORK: output "Safe to commit. Address 🟡 warnings in follow-up."
- If PASS: output "Security check passed. Safe to commit."
