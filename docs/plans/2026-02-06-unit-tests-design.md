# Unit Tests for CLI Operations - Design

## Goal

Add meaningful tests for the CLI database operations to prevent regressions, document behavior, and build confidence before adding more features.

## Decisions Made

- **Test location:** Colocated with source files (`*.test.ts` next to `*.ts`)
- **VS Code file nesting:** Tests collapse under source files in explorer
- **Database strategy:** In-memory SQLite (`:memory:`) - fast, isolated, no cleanup
- **Test infrastructure:** `src/test/setup.ts` + `utils.ts`
- **Schema tests:** Skipped - validated implicitly through operation tests
- **Refactoring:** Extract operations from CLI to `lib/operations/` for testability

## Architecture

### Current State

```
bin/clawboard.ts  # 827 lines, all CRUD logic inline, not exportable
```

### Target State

```
lib/
├── operations/
│   ├── agents.ts           # agentsList, agentsCreate, agentsUpdate, agentsDelete
│   ├── tasks.ts            # tasksList, tasksCreate, tasksUpdate, tasksAssign, etc.
│   ├── messages.ts         # messagesList, messagesCreate, messagesAttach
│   ├── documents.ts        # documentsList, documentsCreate, documentsDelete
│   ├── audits.ts           # auditsList, auditsCreate
│   ├── activities.ts       # activitiesList, activitiesCreate
│   ├── notifications.ts    # notificationsList, notificationsCreate, notificationsDeliver
│   ├── agents.test.ts      # (nested under agents.ts)
│   ├── tasks.test.ts
│   ├── messages.test.ts
│   ├── documents.test.ts
│   ├── audits.test.ts
│   ├── activities.test.ts
│   ├── notifications.test.ts
│   └── index.ts            # re-exports all operations
├── db.ts                   # unchanged
└── types.ts                # unchanged

bin/clawboard.ts            # thin wrapper - arg parsing + calls lib/operations

src/test/
├── setup.ts                # global vitest setup (placeholder)
└── utils.ts                # createTestDb() helper
```

## Database Injection Pattern

All operation functions accept `db` as first parameter:

```ts
import type { Database } from "better-sqlite3";

export function agentsList(db: Database) {
  return db.prepare("SELECT * FROM agents ORDER BY created_at DESC").all();
}

export function agentsCreate(db: Database, input: CreateAgentInput) {
  // ...
}
```

## Test Helper

```ts
// src/test/utils.ts
import Database from "better-sqlite3";
import { readFileSync } from "fs";
import { resolve } from "path";

export function createTestDb(): Database.Database {
  const db = new Database(":memory:");
  const schemaPath = resolve(process.cwd(), "db/schema.sql");
  const schema = readFileSync(schemaPath, "utf-8");
  db.exec(schema);
  return db;
}
```

## Test Coverage

| Entity        | Operations                                     | Test Cases                                      |
| ------------- | ---------------------------------------------- | ----------------------------------------------- |
| Agents        | list, create, update, delete                   | Create with defaults, update partial, delete    |
| Tasks         | list, create, update, assign, unassign, delete | Create with assignees, status change → activity |
| Messages      | list, create, attach                           | Create with attachments, list by taskId         |
| Documents     | list, create, delete                           | Create with type, link to task                  |
| Audits        | list, create                                   | Create with threat level, list by taskId        |
| Activities    | list, create                                   | Auto-created on task changes                    |
| Notifications | list, create, deliver                          | Mark delivered, list by agent                   |

**Edge cases:**

- Optional fields omitted
- Partial updates
- Foreign key constraints
- Activity auto-creation on task status change

## Files Summary

| Action   | File                                   |
| -------- | -------------------------------------- |
| Create   | `.vscode/settings.json`                |
| Create   | `src/test/setup.ts`                    |
| Create   | `src/test/utils.ts`                    |
| Create   | `lib/operations/agents.ts`             |
| Create   | `lib/operations/tasks.ts`              |
| Create   | `lib/operations/messages.ts`           |
| Create   | `lib/operations/documents.ts`          |
| Create   | `lib/operations/audits.ts`             |
| Create   | `lib/operations/activities.ts`         |
| Create   | `lib/operations/notifications.ts`      |
| Create   | `lib/operations/index.ts`              |
| Create   | `lib/operations/agents.test.ts`        |
| Create   | `lib/operations/tasks.test.ts`         |
| Create   | `lib/operations/messages.test.ts`      |
| Create   | `lib/operations/documents.test.ts`     |
| Create   | `lib/operations/audits.test.ts`        |
| Create   | `lib/operations/activities.test.ts`    |
| Create   | `lib/operations/notifications.test.ts` |
| Refactor | `bin/clawboard.ts`                     |
