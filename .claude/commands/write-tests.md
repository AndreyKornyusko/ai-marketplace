# /write-tests <file>

Generates unit and integration tests for a given source file.

## Usage

```
/write-tests <file>
```

Example: `/write-tests src/modules/ai-agent/agents/order-fulfillment/order-fulfillment.agent.ts`

## Orchestrator Instructions

### Step 1 — Gather Context

Read:
1. The full target source file
2. Its related spec (match by feature name — e.g. agent file → spec-06 or spec-07)
3. Any dependent services injected into the target (read those too)
4. Existing test setup: `vitest.config.ts` or `jest.config.ts`
5. Existing test examples for style reference: `src/**/*.test.ts` (first 2 results)

### Step 2 — Invoke test-writer

Pass:
- Full content of the source file
- Full content of the relevant spec
- Full content of injected dependency interfaces
- Test framework config
- Example test file for style reference

### Step 3 — Display and Confirm

Output:
- List of test cases that will be written
- Test file path that will be created
- Coverage areas (behaviors tested)

### Step 4 — Write Tests

test-writer creates the test file at the correct path:
- Unit test: `src/modules/<feature>/__tests__/<name>.test.ts`
- Integration test: `src/modules/<feature>/__tests__/<name>.integration.test.ts`

### Step 5 — Verify Tests Run

```bash
npx vitest run <test-file-path>
```

All tests must pass. If any fail, re-invoke test-writer with the failure output.
