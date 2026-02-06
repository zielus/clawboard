# CLI Operations Unit Tests - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Extract CLI operations into testable modules and add comprehensive integration tests with in-memory SQLite.

**Architecture:** Extract CRUD functions from `bin/clawboard.ts` into `lib/operations/*.ts` modules that accept a database instance as dependency injection. Tests use in-memory SQLite for isolation. CLI becomes a thin wrapper.

**Tech Stack:** Vitest, better-sqlite3, TypeScript

---

### Task 1: VS Code File Nesting Configuration

**Files:**
- Create: `.vscode/settings.json`

**Step 1: Create VS Code settings**

```json
{
  "explorer.fileNesting.enabled": true,
  "explorer.fileNesting.patterns": {
    "*.ts": "${capture}.test.ts, ${capture}.spec.ts",
    "*.tsx": "${capture}.test.tsx, ${capture}.spec.tsx"
  }
}
```

**Step 2: Verify in VS Code**

Open VS Code explorer and confirm file nesting is active (test files collapse under source files).

**Step 3: Commit**

```bash
git add .vscode/settings.json
git commit -m "chore: add VS Code file nesting for test files"
```

---

### Task 2: Test Infrastructure

**Files:**
- Create: `src/test/setup.ts`
- Create: `src/test/utils.ts`

**Step 1: Create test setup placeholder**

```ts
// src/test/setup.ts
// Global Vitest setup - extend as needed
```

**Step 2: Create test utilities**

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
  db.pragma("foreign_keys = ON");
  return db;
}
```

**Step 3: Verify imports work**

Run: `pnpm exec tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add src/test/setup.ts src/test/utils.ts
git commit -m "chore: add test infrastructure with in-memory SQLite helper"
```

---

### Task 3: Extract Agents Operations

**Files:**
- Create: `lib/operations/agents.ts`
- Create: `lib/operations/agents.test.ts`

**Step 1: Write failing test**

```ts
// lib/operations/agents.test.ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import type { Database } from "better-sqlite3";
import { createTestDb } from "@/test/utils";
import { agentsList, agentsCreate, agentsUpdate, agentsDelete } from "./agents";

describe("agents operations", () => {
  let db: Database.Database;

  beforeEach(() => {
    db = createTestDb();
  });

  afterEach(() => {
    db.close();
  });

  describe("agentsList", () => {
    it("returns empty array when no agents exist", () => {
      const result = agentsList(db);
      expect(result).toEqual([]);
    });

    it("returns agents ordered by created_at desc", () => {
      agentsCreate(db, { name: "First" });
      agentsCreate(db, { name: "Second" });
      const result = agentsList(db);
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe("Second");
      expect(result[1].name).toBe("First");
    });
  });

  describe("agentsCreate", () => {
    it("creates agent with required fields only", () => {
      const result = agentsCreate(db, { name: "Test Agent" });
      expect(result.name).toBe("Test Agent");
      expect(result.status).toBe("idle");
      expect(result.role).toBeNull();
      expect(result.id).toBeDefined();
    });

    it("creates agent with all optional fields", () => {
      const result = agentsCreate(db, {
        name: "Full Agent",
        role: "Developer",
        badge: "🚀",
        status: "active",
      });
      expect(result.name).toBe("Full Agent");
      expect(result.role).toBe("Developer");
      expect(result.badge).toBe("🚀");
      expect(result.status).toBe("active");
    });

    it("throws when name is missing", () => {
      expect(() => agentsCreate(db, {} as { name: string })).toThrow("name is required");
    });
  });

  describe("agentsUpdate", () => {
    it("updates single field", () => {
      const agent = agentsCreate(db, { name: "Original" });
      const result = agentsUpdate(db, { id: agent.id, status: "active" });
      expect(result.status).toBe("active");
      expect(result.name).toBe("Original");
    });

    it("updates multiple fields", () => {
      const agent = agentsCreate(db, { name: "Original" });
      const result = agentsUpdate(db, { id: agent.id, name: "Updated", role: "Lead" });
      expect(result.name).toBe("Updated");
      expect(result.role).toBe("Lead");
    });

    it("throws when id is missing", () => {
      expect(() => agentsUpdate(db, {} as { id: string })).toThrow("id is required");
    });

    it("throws when no fields to update", () => {
      const agent = agentsCreate(db, { name: "Test" });
      expect(() => agentsUpdate(db, { id: agent.id })).toThrow("no fields to update");
    });
  });

  describe("agentsDelete", () => {
    it("deletes existing agent", () => {
      const agent = agentsCreate(db, { name: "ToDelete" });
      const result = agentsDelete(db, { id: agent.id });
      expect(result.deleted).toBe(true);
      expect(agentsList(db)).toHaveLength(0);
    });

    it("returns deleted false for non-existent id", () => {
      const result = agentsDelete(db, { id: "non-existent" });
      expect(result.deleted).toBe(false);
    });

    it("throws when id is missing", () => {
      expect(() => agentsDelete(db, {} as { id: string })).toThrow("id is required");
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test lib/operations/agents.test.ts`
Expected: FAIL with "Cannot find module './agents'"

**Step 3: Write implementation**

```ts
// lib/operations/agents.ts
import type { Database } from "better-sqlite3";
import { v4 as uuidv4 } from "uuid";

export interface Agent {
  id: string;
  name: string;
  role: string | null;
  badge: string | null;
  status: string;
  current_task_id: string | null;
  session_key: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateAgentInput {
  name: string;
  role?: string;
  badge?: string;
  status?: string;
}

export interface UpdateAgentInput {
  id: string;
  name?: string;
  role?: string | null;
  badge?: string | null;
  status?: string;
  currentTaskId?: string | null;
  sessionKey?: string | null;
}

export function agentsList(db: Database.Database): Agent[] {
  return db.prepare("SELECT * FROM agents ORDER BY created_at DESC").all() as Agent[];
}

export function agentsCreate(db: Database.Database, input: CreateAgentInput): Agent {
  if (!input.name) {
    throw new Error("name is required");
  }

  const id = uuidv4();
  db.prepare("INSERT INTO agents (id, name, role, badge, status) VALUES (?, ?, ?, ?, ?)").run(
    id,
    input.name,
    input.role || null,
    input.badge || null,
    input.status || "idle"
  );

  return db.prepare("SELECT * FROM agents WHERE id = ?").get(id) as Agent;
}

export function agentsUpdate(db: Database.Database, input: UpdateAgentInput): Agent {
  if (!input.id) {
    throw new Error("id is required");
  }

  const { id, ...updates } = input;
  const fields = Object.keys(updates).filter((k) => updates[k as keyof typeof updates] !== undefined);

  if (fields.length === 0) {
    throw new Error("no fields to update");
  }

  // Convert camelCase to snake_case for DB columns
  const fieldMap: Record<string, string> = {
    currentTaskId: "current_task_id",
    sessionKey: "session_key",
  };

  const setClause = fields.map((f) => `${fieldMap[f] || f} = ?`).join(", ");
  const values = fields.map((f) => updates[f as keyof typeof updates]);

  db.prepare(`UPDATE agents SET ${setClause}, updated_at = datetime('now') WHERE id = ?`).run(
    ...values,
    id
  );

  return db.prepare("SELECT * FROM agents WHERE id = ?").get(id) as Agent;
}

export function agentsDelete(
  db: Database.Database,
  input: { id: string }
): { deleted: boolean; id: string } {
  if (!input.id) {
    throw new Error("id is required");
  }

  const result = db.prepare("DELETE FROM agents WHERE id = ?").run(input.id);
  return { deleted: result.changes > 0, id: input.id };
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test lib/operations/agents.test.ts`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add lib/operations/agents.ts lib/operations/agents.test.ts
git commit -m "feat: extract agents operations with tests"
```

---

### Task 4: Extract Activities Operations

**Files:**
- Create: `lib/operations/activities.ts`
- Create: `lib/operations/activities.test.ts`

**Step 1: Write failing test**

```ts
// lib/operations/activities.test.ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import type { Database } from "better-sqlite3";
import { createTestDb } from "@/test/utils";
import { activitiesList, activitiesCreate, createActivity } from "./activities";

describe("activities operations", () => {
  let db: Database.Database;

  beforeEach(() => {
    db = createTestDb();
  });

  afterEach(() => {
    db.close();
  });

  describe("activitiesList", () => {
    it("returns empty array when no activities exist", () => {
      const result = activitiesList(db);
      expect(result).toEqual([]);
    });

    it("returns activities ordered by created_at desc", () => {
      activitiesCreate(db, { type: "task_created", message: "First" });
      activitiesCreate(db, { type: "task_updated", message: "Second" });
      const result = activitiesList(db);
      expect(result).toHaveLength(2);
      expect(result[0].message).toBe("Second");
    });
  });

  describe("activitiesCreate", () => {
    it("creates activity with required fields", () => {
      const result = activitiesCreate(db, { type: "task_created", message: "Test activity" });
      expect(result.type).toBe("task_created");
      expect(result.message).toBe("Test activity");
      expect(result.agent_id).toBeNull();
      expect(result.task_id).toBeNull();
    });

    it("creates activity with optional fields", () => {
      const result = activitiesCreate(db, {
        type: "message_sent",
        message: "With refs",
        agentId: "agent-1",
        taskId: "task-1",
      });
      expect(result.agent_id).toBe("agent-1");
      expect(result.task_id).toBe("task-1");
    });

    it("throws when type is missing", () => {
      expect(() =>
        activitiesCreate(db, { message: "No type" } as { type: string; message: string })
      ).toThrow("type is required");
    });

    it("throws when message is missing", () => {
      expect(() =>
        activitiesCreate(db, { type: "task_created" } as { type: string; message: string })
      ).toThrow("message is required");
    });
  });

  describe("createActivity (internal helper)", () => {
    it("creates activity without returning it", () => {
      createActivity(db, "task_created", "Internal activity");
      const activities = activitiesList(db);
      expect(activities).toHaveLength(1);
      expect(activities[0].message).toBe("Internal activity");
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test lib/operations/activities.test.ts`
Expected: FAIL with "Cannot find module './activities'"

**Step 3: Write implementation**

```ts
// lib/operations/activities.ts
import type { Database } from "better-sqlite3";
import { v4 as uuidv4 } from "uuid";

export type ActivityType =
  | "task_created"
  | "task_updated"
  | "status_changed"
  | "message_sent"
  | "document_created"
  | "audit_completed";

export interface Activity {
  id: string;
  type: ActivityType;
  agent_id: string | null;
  task_id: string | null;
  message: string;
  created_at: string;
}

export interface CreateActivityInput {
  type: ActivityType;
  message: string;
  agentId?: string;
  taskId?: string;
}

export function activitiesList(db: Database.Database): Activity[] {
  return db.prepare("SELECT * FROM activities ORDER BY created_at DESC").all() as Activity[];
}

export function activitiesCreate(db: Database.Database, input: CreateActivityInput): Activity {
  if (!input.type) {
    throw new Error("type is required");
  }
  if (!input.message) {
    throw new Error("message is required");
  }

  const id = uuidv4();
  db.prepare(
    "INSERT INTO activities (id, type, agent_id, task_id, message) VALUES (?, ?, ?, ?, ?)"
  ).run(id, input.type, input.agentId || null, input.taskId || null, input.message);

  return db.prepare("SELECT * FROM activities WHERE id = ?").get(id) as Activity;
}

// Internal helper used by other operations to auto-create activities
export function createActivity(
  db: Database.Database,
  type: ActivityType,
  message: string,
  agentId?: string,
  taskId?: string
): void {
  const id = uuidv4();
  db.prepare(
    "INSERT INTO activities (id, type, agent_id, task_id, message) VALUES (?, ?, ?, ?, ?)"
  ).run(id, type, agentId || null, taskId || null, message);
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test lib/operations/activities.test.ts`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add lib/operations/activities.ts lib/operations/activities.test.ts
git commit -m "feat: extract activities operations with tests"
```

---

### Task 5: Extract Tasks Operations

**Files:**
- Create: `lib/operations/tasks.ts`
- Create: `lib/operations/tasks.test.ts`

**Step 1: Write failing test**

```ts
// lib/operations/tasks.test.ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import type { Database } from "better-sqlite3";
import { createTestDb } from "@/test/utils";
import {
  tasksList,
  tasksCreate,
  tasksUpdate,
  tasksAssign,
  tasksUnassign,
  tasksDelete,
} from "./tasks";
import { agentsCreate } from "./agents";
import { activitiesList } from "./activities";

describe("tasks operations", () => {
  let db: Database.Database;

  beforeEach(() => {
    db = createTestDb();
  });

  afterEach(() => {
    db.close();
  });

  describe("tasksList", () => {
    it("returns empty array when no tasks exist", () => {
      const result = tasksList(db);
      expect(result).toEqual([]);
    });

    it("returns tasks with empty assignees array", () => {
      tasksCreate(db, { title: "Test Task" });
      const result = tasksList(db);
      expect(result).toHaveLength(1);
      expect(result[0].assignees).toEqual([]);
    });

    it("returns tasks with assignees populated", () => {
      const agent = agentsCreate(db, { name: "Agent" });
      tasksCreate(db, { title: "Test Task", assigneeIds: [agent.id] });
      const result = tasksList(db);
      expect(result[0].assignees).toHaveLength(1);
      expect(result[0].assignees[0].id).toBe(agent.id);
    });
  });

  describe("tasksCreate", () => {
    it("creates task with required fields only", () => {
      const result = tasksCreate(db, { title: "New Task" });
      expect(result.title).toBe("New Task");
      expect(result.status).toBe("inbox");
      expect(result.description).toBeNull();
      expect(result.assignees).toEqual([]);
    });

    it("creates task with all optional fields", () => {
      const agent = agentsCreate(db, { name: "Agent" });
      const result = tasksCreate(db, {
        title: "Full Task",
        description: "Description",
        status: "in_progress",
        assigneeIds: [agent.id],
      });
      expect(result.description).toBe("Description");
      expect(result.status).toBe("in_progress");
      expect(result.assignees).toHaveLength(1);
    });

    it("creates activity on task creation", () => {
      tasksCreate(db, { title: "Test" });
      const activities = activitiesList(db);
      expect(activities).toHaveLength(1);
      expect(activities[0].type).toBe("task_created");
    });

    it("throws when title is missing", () => {
      expect(() => tasksCreate(db, {} as { title: string })).toThrow("title is required");
    });
  });

  describe("tasksUpdate", () => {
    it("updates task fields", () => {
      const task = tasksCreate(db, { title: "Original" });
      const result = tasksUpdate(db, { id: task.id, title: "Updated" });
      expect(result.title).toBe("Updated");
    });

    it("creates status_changed activity when status changes", () => {
      const task = tasksCreate(db, { title: "Task" });
      tasksUpdate(db, { id: task.id, status: "in_progress" });
      const activities = activitiesList(db);
      const statusActivity = activities.find((a) => a.type === "status_changed");
      expect(statusActivity).toBeDefined();
    });

    it("creates task_updated activity for non-status changes", () => {
      const task = tasksCreate(db, { title: "Task" });
      tasksUpdate(db, { id: task.id, title: "New Title" });
      const activities = activitiesList(db);
      const updateActivity = activities.find((a) => a.type === "task_updated");
      expect(updateActivity).toBeDefined();
    });

    it("throws when id is missing", () => {
      expect(() => tasksUpdate(db, {} as { id: string })).toThrow("id is required");
    });
  });

  describe("tasksAssign", () => {
    it("assigns agents to task", () => {
      const task = tasksCreate(db, { title: "Task" });
      const agent = agentsCreate(db, { name: "Agent" });
      const result = tasksAssign(db, { id: task.id, agentIds: [agent.id] });
      expect(result.assignees).toHaveLength(1);
    });

    it("ignores duplicate assignments", () => {
      const task = tasksCreate(db, { title: "Task" });
      const agent = agentsCreate(db, { name: "Agent" });
      tasksAssign(db, { id: task.id, agentIds: [agent.id] });
      tasksAssign(db, { id: task.id, agentIds: [agent.id] });
      const result = tasksList(db);
      expect(result[0].assignees).toHaveLength(1);
    });

    it("throws when id is missing", () => {
      expect(() => tasksAssign(db, { agentIds: ["a"] } as { id: string; agentIds: string[] })).toThrow(
        "id is required"
      );
    });

    it("throws when agentIds is empty", () => {
      const task = tasksCreate(db, { title: "Task" });
      expect(() => tasksAssign(db, { id: task.id, agentIds: [] })).toThrow("agentIds is required");
    });
  });

  describe("tasksUnassign", () => {
    it("removes agents from task", () => {
      const agent = agentsCreate(db, { name: "Agent" });
      const task = tasksCreate(db, { title: "Task", assigneeIds: [agent.id] });
      const result = tasksUnassign(db, { id: task.id, agentIds: [agent.id] });
      expect(result.assignees).toHaveLength(0);
    });

    it("throws when id is missing", () => {
      expect(() =>
        tasksUnassign(db, { agentIds: ["a"] } as { id: string; agentIds: string[] })
      ).toThrow("id is required");
    });
  });

  describe("tasksDelete", () => {
    it("deletes existing task", () => {
      const task = tasksCreate(db, { title: "ToDelete" });
      const result = tasksDelete(db, { id: task.id });
      expect(result.deleted).toBe(true);
      expect(tasksList(db)).toHaveLength(0);
    });

    it("returns deleted false for non-existent id", () => {
      const result = tasksDelete(db, { id: "non-existent" });
      expect(result.deleted).toBe(false);
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test lib/operations/tasks.test.ts`
Expected: FAIL with "Cannot find module './tasks'"

**Step 3: Write implementation**

```ts
// lib/operations/tasks.ts
import type { Database } from "better-sqlite3";
import { v4 as uuidv4 } from "uuid";
import { createActivity } from "./activities";
import type { Agent } from "./agents";

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface TaskWithAssignees extends Task {
  assignees: Agent[];
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  status?: string;
  assigneeIds?: string[];
}

export interface UpdateTaskInput {
  id: string;
  title?: string;
  description?: string | null;
  status?: string;
}

export interface AssignTaskInput {
  id: string;
  agentIds: string[];
}

function getTaskWithAssignees(db: Database.Database, taskId: string): TaskWithAssignees {
  const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(taskId) as Task;
  const assignees = db
    .prepare(
      `SELECT a.* FROM agents a
       JOIN task_assignees ta ON ta.agent_id = a.id
       WHERE ta.task_id = ?`
    )
    .all(taskId) as Agent[];
  return { ...task, assignees };
}

export function tasksList(db: Database.Database): TaskWithAssignees[] {
  const tasks = db.prepare("SELECT * FROM tasks ORDER BY created_at DESC").all() as Task[];
  return tasks.map((task) => {
    const assignees = db
      .prepare(
        `SELECT a.* FROM agents a
         JOIN task_assignees ta ON ta.agent_id = a.id
         WHERE ta.task_id = ?`
      )
      .all(task.id) as Agent[];
    return { ...task, assignees };
  });
}

export function tasksCreate(db: Database.Database, input: CreateTaskInput): TaskWithAssignees {
  if (!input.title) {
    throw new Error("title is required");
  }

  const id = uuidv4();
  db.prepare("INSERT INTO tasks (id, title, description, status) VALUES (?, ?, ?, ?)").run(
    id,
    input.title,
    input.description || null,
    input.status || "inbox"
  );

  if (input.assigneeIds && input.assigneeIds.length > 0) {
    const insertAssignee = db.prepare(
      "INSERT INTO task_assignees (task_id, agent_id) VALUES (?, ?)"
    );
    for (const agentId of input.assigneeIds) {
      insertAssignee.run(id, agentId);
    }
  }

  createActivity(db, "task_created", `Task created: ${input.title}`, undefined, id);

  return getTaskWithAssignees(db, id);
}

export function tasksUpdate(db: Database.Database, input: UpdateTaskInput): TaskWithAssignees {
  if (!input.id) {
    throw new Error("id is required");
  }

  const { id, ...updates } = input;
  const oldTask = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id) as Task | undefined;

  const fields = Object.keys(updates).filter(
    (k) => updates[k as keyof typeof updates] !== undefined
  );

  if (fields.length > 0) {
    const setClause = fields.map((f) => `${f} = ?`).join(", ");
    const values = fields.map((f) => updates[f as keyof typeof updates]);

    db.prepare(`UPDATE tasks SET ${setClause}, updated_at = datetime('now') WHERE id = ?`).run(
      ...values,
      id
    );

    if (updates.status && oldTask && updates.status !== oldTask.status) {
      createActivity(db, "status_changed", `Task status changed to ${updates.status}`, undefined, id);
    } else {
      createActivity(db, "task_updated", `Task updated`, undefined, id);
    }
  }

  return getTaskWithAssignees(db, id);
}

export function tasksAssign(db: Database.Database, input: AssignTaskInput): TaskWithAssignees {
  if (!input.id) {
    throw new Error("id is required");
  }
  if (!input.agentIds || input.agentIds.length === 0) {
    throw new Error("agentIds is required");
  }

  const insertAssignee = db.prepare(
    "INSERT OR IGNORE INTO task_assignees (task_id, agent_id) VALUES (?, ?)"
  );
  for (const agentId of input.agentIds) {
    insertAssignee.run(input.id, agentId);
  }

  db.prepare(`UPDATE tasks SET updated_at = datetime('now') WHERE id = ?`).run(input.id);

  return getTaskWithAssignees(db, input.id);
}

export function tasksUnassign(db: Database.Database, input: AssignTaskInput): TaskWithAssignees {
  if (!input.id) {
    throw new Error("id is required");
  }
  if (!input.agentIds || input.agentIds.length === 0) {
    throw new Error("agentIds is required");
  }

  const deleteAssignee = db.prepare(
    "DELETE FROM task_assignees WHERE task_id = ? AND agent_id = ?"
  );
  for (const agentId of input.agentIds) {
    deleteAssignee.run(input.id, agentId);
  }

  db.prepare(`UPDATE tasks SET updated_at = datetime('now') WHERE id = ?`).run(input.id);

  return getTaskWithAssignees(db, input.id);
}

export function tasksDelete(
  db: Database.Database,
  input: { id: string }
): { deleted: boolean; id: string } {
  if (!input.id) {
    throw new Error("id is required");
  }

  const result = db.prepare("DELETE FROM tasks WHERE id = ?").run(input.id);
  return { deleted: result.changes > 0, id: input.id };
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test lib/operations/tasks.test.ts`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add lib/operations/tasks.ts lib/operations/tasks.test.ts
git commit -m "feat: extract tasks operations with tests"
```

---

### Task 6: Extract Documents Operations

**Files:**
- Create: `lib/operations/documents.ts`
- Create: `lib/operations/documents.test.ts`

**Step 1: Write failing test**

```ts
// lib/operations/documents.test.ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import type { Database } from "better-sqlite3";
import { createTestDb } from "@/test/utils";
import { documentsList, documentsCreate, documentsDelete } from "./documents";
import { activitiesList } from "./activities";

describe("documents operations", () => {
  let db: Database.Database;

  beforeEach(() => {
    db = createTestDb();
  });

  afterEach(() => {
    db.close();
  });

  describe("documentsList", () => {
    it("returns empty array when no documents exist", () => {
      const result = documentsList(db);
      expect(result).toEqual([]);
    });

    it("returns documents ordered by created_at desc", () => {
      documentsCreate(db, { title: "First" });
      documentsCreate(db, { title: "Second" });
      const result = documentsList(db);
      expect(result).toHaveLength(2);
      expect(result[0].title).toBe("Second");
    });
  });

  describe("documentsCreate", () => {
    it("creates document with required fields only", () => {
      const result = documentsCreate(db, { title: "Doc" });
      expect(result.title).toBe("Doc");
      expect(result.content).toBeNull();
      expect(result.type).toBeNull();
    });

    it("creates document with all optional fields", () => {
      const result = documentsCreate(db, {
        title: "Full Doc",
        content: "Content here",
        type: "deliverable",
        taskId: "task-1",
        agentId: "agent-1",
      });
      expect(result.content).toBe("Content here");
      expect(result.type).toBe("deliverable");
      expect(result.task_id).toBe("task-1");
      expect(result.agent_id).toBe("agent-1");
    });

    it("creates activity on document creation", () => {
      documentsCreate(db, { title: "Doc" });
      const activities = activitiesList(db);
      expect(activities).toHaveLength(1);
      expect(activities[0].type).toBe("document_created");
    });

    it("throws when title is missing", () => {
      expect(() => documentsCreate(db, {} as { title: string })).toThrow("title is required");
    });
  });

  describe("documentsDelete", () => {
    it("deletes existing document", () => {
      const doc = documentsCreate(db, { title: "ToDelete" });
      const result = documentsDelete(db, { id: doc.id });
      expect(result.deleted).toBe(true);
      expect(documentsList(db)).toHaveLength(0);
    });

    it("returns deleted false for non-existent id", () => {
      const result = documentsDelete(db, { id: "non-existent" });
      expect(result.deleted).toBe(false);
    });

    it("throws when id is missing", () => {
      expect(() => documentsDelete(db, {} as { id: string })).toThrow("id is required");
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test lib/operations/documents.test.ts`
Expected: FAIL

**Step 3: Write implementation**

```ts
// lib/operations/documents.ts
import type { Database } from "better-sqlite3";
import { v4 as uuidv4 } from "uuid";
import { createActivity } from "./activities";

export type DocumentType = "deliverable" | "research" | "protocol";

export interface Document {
  id: string;
  title: string;
  content: string | null;
  type: DocumentType | null;
  task_id: string | null;
  agent_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateDocumentInput {
  title: string;
  content?: string;
  type?: DocumentType;
  taskId?: string;
  agentId?: string;
}

export function documentsList(db: Database.Database): Document[] {
  return db.prepare("SELECT * FROM documents ORDER BY created_at DESC").all() as Document[];
}

export function documentsCreate(db: Database.Database, input: CreateDocumentInput): Document {
  if (!input.title) {
    throw new Error("title is required");
  }

  const id = uuidv4();
  db.prepare(
    "INSERT INTO documents (id, title, content, type, task_id, agent_id) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(
    id,
    input.title,
    input.content || null,
    input.type || null,
    input.taskId || null,
    input.agentId || null
  );

  createActivity(db, "document_created", `Document created: ${input.title}`, input.agentId, input.taskId);

  return db.prepare("SELECT * FROM documents WHERE id = ?").get(id) as Document;
}

export function documentsDelete(
  db: Database.Database,
  input: { id: string }
): { deleted: boolean; id: string } {
  if (!input.id) {
    throw new Error("id is required");
  }

  const result = db.prepare("DELETE FROM documents WHERE id = ?").run(input.id);
  return { deleted: result.changes > 0, id: input.id };
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test lib/operations/documents.test.ts`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add lib/operations/documents.ts lib/operations/documents.test.ts
git commit -m "feat: extract documents operations with tests"
```

---

### Task 7: Extract Messages Operations

**Files:**
- Create: `lib/operations/messages.ts`
- Create: `lib/operations/messages.test.ts`

**Step 1: Write failing test**

```ts
// lib/operations/messages.test.ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import type { Database } from "better-sqlite3";
import { createTestDb } from "@/test/utils";
import { messagesList, messagesCreate, messagesAttach } from "./messages";
import { tasksCreate } from "./tasks";
import { documentsCreate } from "./documents";
import { agentsCreate } from "./agents";
import { activitiesList } from "./activities";

describe("messages operations", () => {
  let db: Database.Database;

  beforeEach(() => {
    db = createTestDb();
  });

  afterEach(() => {
    db.close();
  });

  describe("messagesList", () => {
    it("returns empty array when no messages exist", () => {
      const result = messagesList(db, {});
      expect(result).toEqual([]);
    });

    it("filters by taskId", () => {
      const task1 = tasksCreate(db, { title: "Task 1" });
      const task2 = tasksCreate(db, { title: "Task 2" });
      messagesCreate(db, { taskId: task1.id, content: "Msg 1" });
      messagesCreate(db, { taskId: task2.id, content: "Msg 2" });
      const result = messagesList(db, { taskId: task1.id });
      expect(result).toHaveLength(1);
      expect(result[0].content).toBe("Msg 1");
    });

    it("includes attachments", () => {
      const task = tasksCreate(db, { title: "Task" });
      const doc = documentsCreate(db, { title: "Doc" });
      const msg = messagesCreate(db, { taskId: task.id, content: "Msg", attachmentIds: [doc.id] });
      const result = messagesList(db, { taskId: task.id });
      expect(result[0].attachments).toHaveLength(1);
      expect(result[0].attachments[0].id).toBe(doc.id);
    });
  });

  describe("messagesCreate", () => {
    it("creates message with required fields", () => {
      const task = tasksCreate(db, { title: "Task" });
      const result = messagesCreate(db, { taskId: task.id, content: "Hello" });
      expect(result.content).toBe("Hello");
      expect(result.task_id).toBe(task.id);
      expect(result.from_agent_id).toBeNull();
    });

    it("creates message with agent and attachments", () => {
      const task = tasksCreate(db, { title: "Task" });
      const agent = agentsCreate(db, { name: "Agent" });
      const doc = documentsCreate(db, { title: "Doc" });
      const result = messagesCreate(db, {
        taskId: task.id,
        content: "With refs",
        fromAgentId: agent.id,
        attachmentIds: [doc.id],
      });
      expect(result.from_agent_id).toBe(agent.id);
      expect(result.attachments).toHaveLength(1);
    });

    it("creates activity on message creation", () => {
      const task = tasksCreate(db, { title: "Task" });
      messagesCreate(db, { taskId: task.id, content: "Msg" });
      const activities = activitiesList(db);
      const msgActivity = activities.find((a) => a.type === "message_sent");
      expect(msgActivity).toBeDefined();
    });

    it("throws when taskId is missing", () => {
      expect(() =>
        messagesCreate(db, { content: "No task" } as { taskId: string; content: string })
      ).toThrow("taskId is required");
    });

    it("throws when content is missing", () => {
      const task = tasksCreate(db, { title: "Task" });
      expect(() =>
        messagesCreate(db, { taskId: task.id } as { taskId: string; content: string })
      ).toThrow("content is required");
    });
  });

  describe("messagesAttach", () => {
    it("attaches documents to message", () => {
      const task = tasksCreate(db, { title: "Task" });
      const msg = messagesCreate(db, { taskId: task.id, content: "Msg" });
      const doc = documentsCreate(db, { title: "Doc" });
      const result = messagesAttach(db, { id: msg.id, documentIds: [doc.id] });
      expect(result.attachments).toHaveLength(1);
    });

    it("ignores duplicate attachments", () => {
      const task = tasksCreate(db, { title: "Task" });
      const doc = documentsCreate(db, { title: "Doc" });
      const msg = messagesCreate(db, { taskId: task.id, content: "Msg", attachmentIds: [doc.id] });
      messagesAttach(db, { id: msg.id, documentIds: [doc.id] });
      const result = messagesList(db, { taskId: task.id });
      expect(result[0].attachments).toHaveLength(1);
    });

    it("throws when id is missing", () => {
      expect(() =>
        messagesAttach(db, { documentIds: ["d"] } as { id: string; documentIds: string[] })
      ).toThrow("id is required");
    });

    it("throws when documentIds is empty", () => {
      const task = tasksCreate(db, { title: "Task" });
      const msg = messagesCreate(db, { taskId: task.id, content: "Msg" });
      expect(() => messagesAttach(db, { id: msg.id, documentIds: [] })).toThrow(
        "documentIds is required"
      );
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test lib/operations/messages.test.ts`
Expected: FAIL

**Step 3: Write implementation**

```ts
// lib/operations/messages.ts
import type { Database } from "better-sqlite3";
import { v4 as uuidv4 } from "uuid";
import { createActivity } from "./activities";
import type { Document } from "./documents";

export interface Message {
  id: string;
  task_id: string;
  from_agent_id: string | null;
  content: string;
  created_at: string;
}

export interface MessageWithAttachments extends Message {
  attachments: Document[];
}

export interface CreateMessageInput {
  taskId: string;
  content: string;
  fromAgentId?: string;
  attachmentIds?: string[];
}

export interface AttachToMessageInput {
  id: string;
  documentIds: string[];
}

function getMessageWithAttachments(db: Database.Database, messageId: string): MessageWithAttachments {
  const message = db.prepare("SELECT * FROM messages WHERE id = ?").get(messageId) as Message;
  const attachments = db
    .prepare(
      `SELECT d.* FROM documents d
       JOIN message_attachments ma ON ma.document_id = d.id
       WHERE ma.message_id = ?`
    )
    .all(messageId) as Document[];
  return { ...message, attachments };
}

export function messagesList(
  db: Database.Database,
  input: { taskId?: string }
): MessageWithAttachments[] {
  let messages: Message[];
  if (input.taskId) {
    messages = db
      .prepare("SELECT * FROM messages WHERE task_id = ? ORDER BY created_at ASC")
      .all(input.taskId) as Message[];
  } else {
    messages = db.prepare("SELECT * FROM messages ORDER BY created_at DESC").all() as Message[];
  }

  return messages.map((msg) => {
    const attachments = db
      .prepare(
        `SELECT d.* FROM documents d
         JOIN message_attachments ma ON ma.document_id = d.id
         WHERE ma.message_id = ?`
      )
      .all(msg.id) as Document[];
    return { ...msg, attachments };
  });
}

export function messagesCreate(
  db: Database.Database,
  input: CreateMessageInput
): MessageWithAttachments {
  if (!input.taskId) {
    throw new Error("taskId is required");
  }
  if (!input.content) {
    throw new Error("content is required");
  }

  const id = uuidv4();
  db.prepare("INSERT INTO messages (id, task_id, from_agent_id, content) VALUES (?, ?, ?, ?)").run(
    id,
    input.taskId,
    input.fromAgentId || null,
    input.content
  );

  if (input.attachmentIds && input.attachmentIds.length > 0) {
    const insertAttachment = db.prepare(
      "INSERT INTO message_attachments (message_id, document_id) VALUES (?, ?)"
    );
    for (const docId of input.attachmentIds) {
      insertAttachment.run(id, docId);
    }
  }

  createActivity(db, "message_sent", `Message sent in task`, input.fromAgentId, input.taskId);

  return getMessageWithAttachments(db, id);
}

export function messagesAttach(
  db: Database.Database,
  input: AttachToMessageInput
): MessageWithAttachments {
  if (!input.id) {
    throw new Error("id is required");
  }
  if (!input.documentIds || input.documentIds.length === 0) {
    throw new Error("documentIds is required");
  }

  const insertAttachment = db.prepare(
    "INSERT OR IGNORE INTO message_attachments (message_id, document_id) VALUES (?, ?)"
  );
  for (const docId of input.documentIds) {
    insertAttachment.run(input.id, docId);
  }

  return getMessageWithAttachments(db, input.id);
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test lib/operations/messages.test.ts`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add lib/operations/messages.ts lib/operations/messages.test.ts
git commit -m "feat: extract messages operations with tests"
```

---

### Task 8: Extract Audits Operations

**Files:**
- Create: `lib/operations/audits.ts`
- Create: `lib/operations/audits.test.ts`

**Step 1: Write failing test**

```ts
// lib/operations/audits.test.ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import type { Database } from "better-sqlite3";
import { createTestDb } from "@/test/utils";
import { auditsList, auditsCreate } from "./audits";
import { tasksCreate } from "./tasks";
import { activitiesList } from "./activities";

describe("audits operations", () => {
  let db: Database.Database;

  beforeEach(() => {
    db = createTestDb();
  });

  afterEach(() => {
    db.close();
  });

  describe("auditsList", () => {
    it("returns empty array when no audits exist", () => {
      const result = auditsList(db, {});
      expect(result).toEqual([]);
    });

    it("filters by taskId", () => {
      const task1 = tasksCreate(db, { title: "Task 1" });
      const task2 = tasksCreate(db, { title: "Task 2" });
      auditsCreate(db, { taskId: task1.id });
      auditsCreate(db, { taskId: task2.id });
      const result = auditsList(db, { taskId: task1.id });
      expect(result).toHaveLength(1);
    });

    it("returns all audits when no taskId", () => {
      const task1 = tasksCreate(db, { title: "Task 1" });
      const task2 = tasksCreate(db, { title: "Task 2" });
      auditsCreate(db, { taskId: task1.id });
      auditsCreate(db, { taskId: task2.id });
      const result = auditsList(db, {});
      expect(result).toHaveLength(2);
    });
  });

  describe("auditsCreate", () => {
    it("creates audit with required fields", () => {
      const task = tasksCreate(db, { title: "Task" });
      const result = auditsCreate(db, { taskId: task.id });
      expect(result.task_id).toBe(task.id);
      expect(result.threat_level).toBe("safe");
      expect(result.content).toBeNull();
    });

    it("creates audit with all fields", () => {
      const task = tasksCreate(db, { title: "Task" });
      const result = auditsCreate(db, {
        taskId: task.id,
        threatLevel: "critical",
        content: "Security issue found",
      });
      expect(result.threat_level).toBe("critical");
      expect(result.content).toBe("Security issue found");
    });

    it("creates activity on audit creation", () => {
      const task = tasksCreate(db, { title: "Task" });
      auditsCreate(db, { taskId: task.id });
      const activities = activitiesList(db);
      const auditActivity = activities.find((a) => a.type === "audit_completed");
      expect(auditActivity).toBeDefined();
    });

    it("throws when taskId is missing", () => {
      expect(() => auditsCreate(db, {} as { taskId: string })).toThrow("taskId is required");
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test lib/operations/audits.test.ts`
Expected: FAIL

**Step 3: Write implementation**

```ts
// lib/operations/audits.ts
import type { Database } from "better-sqlite3";
import { v4 as uuidv4 } from "uuid";
import { createActivity } from "./activities";

export type ThreatLevel = "safe" | "warning" | "critical";

export interface Audit {
  id: string;
  task_id: string;
  threat_level: ThreatLevel | null;
  content: string | null;
  created_at: string;
}

export interface CreateAuditInput {
  taskId: string;
  threatLevel?: ThreatLevel;
  content?: string;
}

export function auditsList(db: Database.Database, input: { taskId?: string }): Audit[] {
  if (input.taskId) {
    return db
      .prepare("SELECT * FROM audits WHERE task_id = ? ORDER BY created_at DESC")
      .all(input.taskId) as Audit[];
  }
  return db.prepare("SELECT * FROM audits ORDER BY created_at DESC").all() as Audit[];
}

export function auditsCreate(db: Database.Database, input: CreateAuditInput): Audit {
  if (!input.taskId) {
    throw new Error("taskId is required");
  }

  const id = uuidv4();
  const threatLevel = input.threatLevel || "safe";

  db.prepare("INSERT INTO audits (id, task_id, threat_level, content) VALUES (?, ?, ?, ?)").run(
    id,
    input.taskId,
    threatLevel,
    input.content || null
  );

  createActivity(db, "audit_completed", `Audit completed: ${threatLevel}`, undefined, input.taskId);

  return db.prepare("SELECT * FROM audits WHERE id = ?").get(id) as Audit;
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test lib/operations/audits.test.ts`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add lib/operations/audits.ts lib/operations/audits.test.ts
git commit -m "feat: extract audits operations with tests"
```

---

### Task 9: Extract Notifications Operations

**Files:**
- Create: `lib/operations/notifications.ts`
- Create: `lib/operations/notifications.test.ts`

**Step 1: Write failing test**

```ts
// lib/operations/notifications.test.ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import type { Database } from "better-sqlite3";
import { createTestDb } from "@/test/utils";
import { notificationsList, notificationsCreate, notificationsDeliver } from "./notifications";
import { agentsCreate } from "./agents";

describe("notifications operations", () => {
  let db: Database.Database;

  beforeEach(() => {
    db = createTestDb();
  });

  afterEach(() => {
    db.close();
  });

  describe("notificationsList", () => {
    it("returns empty array when no notifications exist", () => {
      const result = notificationsList(db, {});
      expect(result).toEqual([]);
    });

    it("filters by agentId", () => {
      const agent1 = agentsCreate(db, { name: "Agent 1" });
      const agent2 = agentsCreate(db, { name: "Agent 2" });
      notificationsCreate(db, { mentionedAgentId: agent1.id, content: "For agent 1" });
      notificationsCreate(db, { mentionedAgentId: agent2.id, content: "For agent 2" });
      const result = notificationsList(db, { agentId: agent1.id });
      expect(result).toHaveLength(1);
      expect(result[0].content).toBe("For agent 1");
    });

    it("returns all notifications when no agentId", () => {
      const agent = agentsCreate(db, { name: "Agent" });
      notificationsCreate(db, { mentionedAgentId: agent.id, content: "Msg 1" });
      notificationsCreate(db, { mentionedAgentId: agent.id, content: "Msg 2" });
      const result = notificationsList(db, {});
      expect(result).toHaveLength(2);
    });
  });

  describe("notificationsCreate", () => {
    it("creates notification", () => {
      const agent = agentsCreate(db, { name: "Agent" });
      const result = notificationsCreate(db, {
        mentionedAgentId: agent.id,
        content: "You were mentioned",
      });
      expect(result.mentioned_agent_id).toBe(agent.id);
      expect(result.content).toBe("You were mentioned");
      expect(result.delivered).toBe(0);
    });

    it("throws when mentionedAgentId is missing", () => {
      expect(() =>
        notificationsCreate(db, { content: "No agent" } as {
          mentionedAgentId: string;
          content: string;
        })
      ).toThrow("mentionedAgentId is required");
    });

    it("throws when content is missing", () => {
      const agent = agentsCreate(db, { name: "Agent" });
      expect(() =>
        notificationsCreate(db, { mentionedAgentId: agent.id } as {
          mentionedAgentId: string;
          content: string;
        })
      ).toThrow("content is required");
    });
  });

  describe("notificationsDeliver", () => {
    it("marks notification as delivered", () => {
      const agent = agentsCreate(db, { name: "Agent" });
      const notification = notificationsCreate(db, {
        mentionedAgentId: agent.id,
        content: "Message",
      });
      const result = notificationsDeliver(db, { id: notification.id });
      expect(result.delivered).toBe(1);
    });

    it("throws when id is missing", () => {
      expect(() => notificationsDeliver(db, {} as { id: string })).toThrow("id is required");
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test lib/operations/notifications.test.ts`
Expected: FAIL

**Step 3: Write implementation**

```ts
// lib/operations/notifications.ts
import type { Database } from "better-sqlite3";
import { v4 as uuidv4 } from "uuid";

export interface Notification {
  id: string;
  mentioned_agent_id: string;
  content: string;
  delivered: number;
  created_at: string;
}

export interface CreateNotificationInput {
  mentionedAgentId: string;
  content: string;
}

export function notificationsList(db: Database.Database, input: { agentId?: string }): Notification[] {
  if (input.agentId) {
    return db
      .prepare("SELECT * FROM notifications WHERE mentioned_agent_id = ? ORDER BY created_at DESC")
      .all(input.agentId) as Notification[];
  }
  return db.prepare("SELECT * FROM notifications ORDER BY created_at DESC").all() as Notification[];
}

export function notificationsCreate(
  db: Database.Database,
  input: CreateNotificationInput
): Notification {
  if (!input.mentionedAgentId) {
    throw new Error("mentionedAgentId is required");
  }
  if (!input.content) {
    throw new Error("content is required");
  }

  const id = uuidv4();
  db.prepare("INSERT INTO notifications (id, mentioned_agent_id, content) VALUES (?, ?, ?)").run(
    id,
    input.mentionedAgentId,
    input.content
  );

  return db.prepare("SELECT * FROM notifications WHERE id = ?").get(id) as Notification;
}

export function notificationsDeliver(db: Database.Database, input: { id: string }): Notification {
  if (!input.id) {
    throw new Error("id is required");
  }

  db.prepare("UPDATE notifications SET delivered = 1 WHERE id = ?").run(input.id);

  return db.prepare("SELECT * FROM notifications WHERE id = ?").get(input.id) as Notification;
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test lib/operations/notifications.test.ts`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add lib/operations/notifications.ts lib/operations/notifications.test.ts
git commit -m "feat: extract notifications operations with tests"
```

---

### Task 10: Create Operations Index

**Files:**
- Create: `lib/operations/index.ts`

**Step 1: Create index file**

```ts
// lib/operations/index.ts
export * from "./activities";
export * from "./agents";
export * from "./audits";
export * from "./documents";
export * from "./messages";
export * from "./notifications";
export * from "./tasks";
```

**Step 2: Verify exports**

Run: `pnpm exec tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add lib/operations/index.ts
git commit -m "feat: add operations index for re-exports"
```

---

### Task 11: Refactor CLI to Use Operations

**Files:**
- Modify: `bin/clawboard.ts`

**Step 1: Run existing CLI to verify current behavior**

Run: `./bin/clawboard agents:list`
Expected: JSON output (empty array or existing agents)

**Step 2: Refactor CLI**

Replace the full content of `bin/clawboard.ts` with:

```ts
#!/usr/bin/env node
// Clawboard CLI - CRUD operations for all entities
// Usage: clawboard entity:action [json-arg]

import Database from "better-sqlite3";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import * as ops from "../lib/operations/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, "..", "db", "clawboard.db");
const SCHEMA_PATH = join(__dirname, "..", "db", "schema.sql");

// Initialize database
const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// Run schema
const schema = readFileSync(SCHEMA_PATH, "utf-8");
db.exec(schema);

// Parse CLI args
const [command, jsonArg] = process.argv.slice(2);

interface Args {
  [key: string]: unknown;
}

function parseArgs(): Args {
  if (!jsonArg) return {};
  try {
    return JSON.parse(jsonArg);
  } catch {
    console.error("Error: Invalid JSON argument");
    process.exit(1);
  }
}

function output(data: unknown): void {
  console.log(JSON.stringify(data, null, 2));
}

function handleError(fn: () => unknown): void {
  try {
    const result = fn();
    output(result);
  } catch (e) {
    console.error(`Error: ${(e as Error).message}`);
    process.exit(1);
  }
}

// ============ SETUP ============

function showSetup(): void {
  const binPath = join(__dirname);
  console.log(`
Clawboard CLI Setup
===================

Add the bin directory to your PATH to use 'clawboard' from anywhere:

  export PATH="${binPath}:$PATH"

You can add this line to your ~/.bashrc or ~/.zshrc file.

Database location: ${DB_PATH}
`);
}

// ============ HELP ============

function showHelp(): void {
  console.log(`
Clawboard CLI - Mission Control for AI Agents

USAGE:
  clawboard <entity:action> [json-arg]

COMMANDS:

  setup                                     Show PATH setup instructions

  AGENTS:
    agents:list                             List all agents
    agents:create '{"name": "...", "role": "...", "badge": "..."}'
    agents:update '{"id": "...", "status": "active"}'
    agents:delete '{"id": "..."}'

  TASKS (supports multiple assignees):
    tasks:list                              List all tasks with assignees
    tasks:create '{"title": "...", "description": "...", "assigneeIds": ["..."]}'
    tasks:update '{"id": "...", "status": "in_progress"}'
    tasks:assign '{"id": "...", "agentIds": ["..."]}'
    tasks:unassign '{"id": "...", "agentIds": ["..."]}'
    tasks:delete '{"id": "..."}'

  MESSAGES (supports attachments):
    messages:list '{"taskId": "..."}'       List messages (optionally by task)
    messages:create '{"taskId": "...", "fromAgentId": "...", "content": "...", "attachmentIds": ["..."]}'
    messages:attach '{"id": "...", "documentIds": ["..."]}'

  DOCUMENTS:
    documents:list                          List all documents
    documents:create '{"title": "...", "type": "deliverable", "content": "..."}'
    documents:delete '{"id": "..."}'

  AUDITS:
    audits:list '{"taskId": "..."}'         List audits (optionally by task)
    audits:create '{"taskId": "...", "threatLevel": "safe", "content": "..."}'

  ACTIVITIES:
    activities:list                         List all activities
    activities:create '{"type": "task_created", "message": "..."}'

  NOTIFICATIONS:
    notifications:list '{"agentId": "..."}'     List notifications (optionally by agent)
    notifications:create '{"mentionedAgentId": "...", "content": "..."}'
    notifications:deliver '{"id": "..."}'       Mark notification as delivered

ACTIVITY TYPES:
  task_created, task_updated, status_changed, message_sent, document_created, audit_completed

TASK STATUSES:
  inbox, assigned, in_progress, review, done

AGENT STATUSES:
  idle, active, blocked

DOCUMENT TYPES:
  deliverable, research, protocol

THREAT LEVELS:
  safe, warning, critical
`);
}

// ============ COMMAND ROUTER ============

const args = parseArgs();

switch (command) {
  case undefined:
  case "help":
  case "--help":
  case "-h":
    showHelp();
    break;

  case "setup":
    showSetup();
    break;

  // Agents
  case "agents:list":
    output(ops.agentsList(db));
    break;
  case "agents:create":
    handleError(() => ops.agentsCreate(db, args as ops.CreateAgentInput));
    break;
  case "agents:update":
    handleError(() => ops.agentsUpdate(db, args as ops.UpdateAgentInput));
    break;
  case "agents:delete":
    handleError(() => ops.agentsDelete(db, args as { id: string }));
    break;

  // Tasks
  case "tasks:list":
    output(ops.tasksList(db));
    break;
  case "tasks:create":
    handleError(() => ops.tasksCreate(db, args as ops.CreateTaskInput));
    break;
  case "tasks:update":
    handleError(() => ops.tasksUpdate(db, args as ops.UpdateTaskInput));
    break;
  case "tasks:assign":
    handleError(() => ops.tasksAssign(db, args as ops.AssignTaskInput));
    break;
  case "tasks:unassign":
    handleError(() => ops.tasksUnassign(db, args as ops.AssignTaskInput));
    break;
  case "tasks:delete":
    handleError(() => ops.tasksDelete(db, args as { id: string }));
    break;

  // Messages
  case "messages:list":
    output(ops.messagesList(db, args as { taskId?: string }));
    break;
  case "messages:create":
    handleError(() => ops.messagesCreate(db, args as ops.CreateMessageInput));
    break;
  case "messages:attach":
    handleError(() => ops.messagesAttach(db, args as ops.AttachToMessageInput));
    break;

  // Documents
  case "documents:list":
    output(ops.documentsList(db));
    break;
  case "documents:create":
    handleError(() => ops.documentsCreate(db, args as ops.CreateDocumentInput));
    break;
  case "documents:delete":
    handleError(() => ops.documentsDelete(db, args as { id: string }));
    break;

  // Audits
  case "audits:list":
    output(ops.auditsList(db, args as { taskId?: string }));
    break;
  case "audits:create":
    handleError(() => ops.auditsCreate(db, args as ops.CreateAuditInput));
    break;

  // Activities
  case "activities:list":
    output(ops.activitiesList(db));
    break;
  case "activities:create":
    handleError(() => ops.activitiesCreate(db, args as ops.CreateActivityInput));
    break;

  // Notifications
  case "notifications:list":
    output(ops.notificationsList(db, args as { agentId?: string }));
    break;
  case "notifications:create":
    handleError(() => ops.notificationsCreate(db, args as ops.CreateNotificationInput));
    break;
  case "notifications:deliver":
    handleError(() => ops.notificationsDeliver(db, args as { id: string }));
    break;

  default:
    console.error(`Unknown command: ${command}`);
    console.error('Run "clawboard help" for usage information.');
    process.exit(1);
}

db.close();
```

**Step 3: Run tests to verify nothing broke**

Run: `pnpm test`
Expected: All tests PASS

**Step 4: Test CLI manually**

Run: `./bin/clawboard agents:list`
Expected: JSON output

Run: `./bin/clawboard agents:create '{"name": "Test CLI"}'`
Expected: JSON with created agent

**Step 5: Commit**

```bash
git add bin/clawboard.ts
git commit -m "refactor: CLI uses extracted operations module"
```

---

### Task 12: Run All Tests and Verify

**Step 1: Run full test suite**

Run: `pnpm test`
Expected: All tests PASS (~50 tests)

**Step 2: Run linter**

Run: `pnpm lint`
Expected: No errors

**Step 3: Run format check**

Run: `pnpm format:check`
Expected: No formatting issues (or run `pnpm format` to fix)

**Step 4: Run build**

Run: `pnpm build`
Expected: Build succeeds

**Step 5: Final commit if any formatting changes**

```bash
git add -A
git commit -m "chore: format and lint fixes"
```

---

## Summary

| Task | Description | Tests |
|------|-------------|-------|
| 1 | VS Code file nesting | - |
| 2 | Test infrastructure | - |
| 3 | Agents operations | 10 |
| 4 | Activities operations | 6 |
| 5 | Tasks operations | 14 |
| 6 | Documents operations | 7 |
| 7 | Messages operations | 10 |
| 8 | Audits operations | 5 |
| 9 | Notifications operations | 7 |
| 10 | Operations index | - |
| 11 | Refactor CLI | - |
| 12 | Final verification | - |

**Total: ~59 test cases**
