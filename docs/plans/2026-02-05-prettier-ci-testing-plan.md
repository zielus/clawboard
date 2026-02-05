# Prettier, CI, and Testing Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add Prettier for code formatting, Vitest for unit testing, and GitHub Actions for CI checks on PRs.

**Architecture:** Prettier integrates with existing ESLint via eslint-config-prettier. Vitest uses Vite's config directly. GitHub Actions runs all checks in a single job.

**Tech Stack:** Prettier, Vitest, GitHub Actions, pnpm

---

## Task 1: Install Prettier and Configure

**Files:**

- Create: `.prettierrc`
- Create: `.prettierignore`
- Modify: `package.json` (add scripts and devDependencies)
- Modify: `eslint.config.js` (add prettier config)

**Step 1: Install dependencies**

Run:

```bash
pnpm add -D prettier eslint-config-prettier
```

Expected: Dependencies added to package.json devDependencies

**Step 2: Create Prettier config**

Create `.prettierrc`:

```json
{
  "semi": true,
  "singleQuote": false,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

**Step 3: Create Prettier ignore file**

Create `.prettierignore`:

```
dist/
node_modules/
.worktrees/
pnpm-lock.yaml
*.db
*.db-wal
*.db-shm
```

**Step 4: Add scripts to package.json**

Add to `scripts` section:

```json
"format": "prettier --write .",
"format:check": "prettier --check ."
```

**Step 5: Update ESLint config**

Modify `eslint.config.js` to add prettier at the end of extends array:

```js
import eslintConfigPrettier from 'eslint-config-prettier'

// Add to the first config object's extends array:
extends: [
  js.configs.recommended,
  tseslint.configs.recommended,
  reactHooks.configs.flat.recommended,
  reactRefresh.configs.vite,
  eslintConfigPrettier,  // Add this - must be last
],
```

**Step 6: Verify Prettier works**

Run:

```bash
pnpm format:check
```

Expected: Either passes or shows files that need formatting

**Step 7: Format codebase**

Run:

```bash
pnpm format
```

Expected: All files formatted

**Step 8: Verify lint still works**

Run:

```bash
pnpm lint
```

Expected: No errors (Prettier rules disabled in ESLint)

**Step 9: Commit**

```bash
git add .prettierrc .prettierignore package.json pnpm-lock.yaml eslint.config.js
git commit -m "chore: add prettier with eslint integration"
```

---

## Task 2: Install and Configure Vitest

**Files:**

- Modify: `vite.config.ts` (add test config)
- Modify: `package.json` (add test scripts)

**Step 1: Install Vitest**

Run:

```bash
pnpm add -D vitest
```

Expected: vitest added to devDependencies

**Step 2: Add test config to vite.config.ts**

Modify `vite.config.ts` to add test configuration:

```ts
/// <reference types="vitest" />
import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:18790",
        changeOrigin: true,
      },
    },
  },
  test: {
    globals: true,
    environment: "node",
  },
});
```

**Step 3: Add test scripts to package.json**

Add to `scripts` section:

```json
"test": "vitest run",
"test:watch": "vitest"
```

**Step 4: Commit**

```bash
git add vite.config.ts package.json pnpm-lock.yaml
git commit -m "chore: add vitest configuration"
```

---

## Task 3: Add Smoke Test

**Files:**

- Modify: `src/components/shared/relative-time.tsx` (export getRelativeTime)
- Create: `src/components/shared/relative-time.test.ts`

**Step 1: Export getRelativeTime function**

Modify `src/components/shared/relative-time.tsx` to export the function:

Change:

```ts
function getRelativeTime(dateString: string): string {
```

To:

```ts
export function getRelativeTime(dateString: string): string {
```

**Step 2: Write the test file**

Create `src/components/shared/relative-time.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getRelativeTime } from "./relative-time";

describe("getRelativeTime", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-05T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns 'Just now' for times less than a minute ago", () => {
    const date = new Date("2026-02-05T11:59:30Z").toISOString();
    expect(getRelativeTime(date)).toBe("Just now");
  });

  it("returns minutes ago for times less than an hour", () => {
    const date = new Date("2026-02-05T11:45:00Z").toISOString();
    expect(getRelativeTime(date)).toBe("15m ago");
  });

  it("returns hours ago for times less than a day", () => {
    const date = new Date("2026-02-05T09:00:00Z").toISOString();
    expect(getRelativeTime(date)).toBe("3h ago");
  });

  it("returns days ago for times more than a day", () => {
    const date = new Date("2026-02-03T12:00:00Z").toISOString();
    expect(getRelativeTime(date)).toBe("2d ago");
  });
});
```

**Step 3: Run test to verify it passes**

Run:

```bash
pnpm test
```

Expected: All 4 tests pass

**Step 4: Commit**

```bash
git add src/components/shared/relative-time.tsx src/components/shared/relative-time.test.ts
git commit -m "test: add smoke test for getRelativeTime"
```

---

## Task 4: Add GitHub Actions Workflow

**Files:**

- Create: `.github/workflows/ci.yml`

**Step 1: Create workflow directory**

Run:

```bash
mkdir -p .github/workflows
```

**Step 2: Create CI workflow file**

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  pull_request:
    branches: [master]

jobs:
  check:
    name: Lint, Format, Test, Build
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 9

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "22"
          cache: "pnpm"

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run linter
        run: pnpm lint

      - name: Check formatting
        run: pnpm format:check

      - name: Run tests
        run: pnpm test

      - name: Build
        run: pnpm build
```

**Step 3: Verify workflow syntax**

Run:

```bash
cat .github/workflows/ci.yml
```

Expected: Valid YAML file with all steps

**Step 4: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add GitHub Actions workflow for PR checks"
```

---

## Task 5: Final Verification

**Step 1: Run all checks locally**

Run:

```bash
pnpm lint && pnpm format:check && pnpm test && pnpm build
```

Expected: All commands pass with no errors

**Step 2: Format any remaining files**

If format:check failed in step 1:

```bash
pnpm format
git add -u
git commit -m "style: format codebase with prettier"
```

---

## Summary

After completing all tasks, you will have:

- Prettier configured with ESLint integration
- Vitest configured with a passing smoke test
- GitHub Actions CI that runs lint, format, test, and build on PRs
