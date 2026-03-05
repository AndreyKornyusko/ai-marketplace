# /run-checks

Runs TypeScript type checking and ESLint. No agents. Final quality gate.

## Usage

```
/run-checks
```

## Orchestrator Instructions

No sub-agents for this command. Execute directly.

### Step 1 — TypeScript

```bash
tsc --noEmit
```

If errors: display all errors with file:line references. Do not proceed to lint.
Fix all type errors before continuing (re-invoke the relevant implementer agent with
the exact error output).

### Step 2 — ESLint

```bash
eslint . --ext .ts,.tsx --max-warnings 0
```

If errors or warnings: display all findings. Fix before proceeding.

### Step 3 — Report

```
RUN CHECKS RESULT
TypeScript: PASS | FAIL (N errors)
ESLint:     PASS | FAIL (N errors, N warnings)
Overall:    PASS | FAIL
```

Only report PASS when both TypeScript and ESLint return zero errors.

### Step 4 — On PASS

Output: "All checks passed. Ready to commit."

### Step 5 — On FAIL

Output the errors with the responsible file paths.
Identify which agent to re-invoke to fix each error category:
- Type errors in `src/modules/` → backend-agent
- Type errors in `app/` or `components/` → frontend-agent
- Type errors in `src/modules/ai-agent/` → ai-agent-builder
- ESLint `@typescript-eslint/no-explicit-any` → the relevant implementer agent
