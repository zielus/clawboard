# Prettier, CI, and Testing Setup

## Overview

Add code formatting with Prettier, CI checks via GitHub Actions, and a basic unit testing setup with Vitest.

## 1. Prettier Setup

### Dependencies

```
prettier
eslint-config-prettier
```

### Configuration (`.prettierrc`)

```json
{
  "semi": true,
  "singleQuote": false,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

### Scripts

```json
"format": "prettier --write .",
"format:check": "prettier --check ."
```

### Ignore file (`.prettierignore`)

```
dist/
node_modules/
.worktrees/
pnpm-lock.yaml
```

### ESLint Integration

Add `eslint-config-prettier` to ESLint config to disable conflicting rules.

## 2. Testing Setup

### Dependencies

```
vitest
```

### Configuration

Add to `vite.config.ts`:

```ts
test: {
  globals: true,
  environment: 'node'
}
```

### Scripts

```json
"test": "vitest run",
"test:watch": "vitest"
```

### Initial Test

Add a smoke test for a utility function (e.g., `getRelativeTime`) to verify the setup works.

## 3. GitHub Actions

### Workflow (`.github/workflows/ci.yml`)

Runs on PRs to master:

1. Checkout code
2. Setup Node + pnpm
3. Install dependencies
4. Run `pnpm lint`
5. Run `pnpm format:check`
6. Run `pnpm test`
7. Run `pnpm build`

All checks in a single job. PR is blocked if any step fails.

## Decisions

- **No local hooks** — CI enforcement preferred over husky/lint-staged to reduce codebase complexity and commit friction
- **Vitest over Jest** — pairs naturally with Vite, zero additional config
- **Unit tests only for now** — component and E2E tests can be added later
