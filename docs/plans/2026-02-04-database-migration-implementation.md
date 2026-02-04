# Database Migration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Migrate base infrastructure from clawboard-v1 — database schema, types, and CLI tool — with updated schema supporting multiple assignees, message attachments, and notifications.

**Architecture:** SQLite database with Zod validation. CLI tool (`bin/clawboard`) provides CRUD operations for all entities. Types shared in `lib/`. No HTTP routes yet.

**Tech Stack:** SQLite (better-sqlite3), Zod, UUID, TypeScript, tsx

---

## Task 1: Install Dependencies

**Files:**
- Modify: `package.json`

**Step 1: Install production dependencies**

Run: `pnpm add better-sqlite3 zod uuid hono @hono/node-server`

**Step 2: Install dev dependencies**

Run: `pnpm add -D @types/better-sqlite3 @types/uuid tsx concurrently`

**Step 3: Verify installation**

Run: `pnpm list better-sqlite3 zod uuid`
Expected: All packages listed with versions

**Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml && git commit -m "feat: add database and CLI dependencies"
```

---

## Task 2: Update .gitignore

**Files:**
- Modify: `.gitignore`

**Step 1: Add database patterns to .gitignore**

Add at the end of `.gitignore`:
```
# Database files (schema.sql is tracked, data is not)
db/*.db
db/*.db-shm
db/*.db-wal
```

**Step 2: Commit**

```bash
git add .gitignore && git commit -m "chore: gitignore database files"
```

---

## Task 3: Create Database Schema

**Files:**
- Create: `db/schema.sql`

**Step 1: Create db directory**

Run: `mkdir -p db`

**Step 2: Create schema file**

Create `db/schema.sql`:
```sql
-- Mission Control Schema
-- 7 tables + 2 junction tables

-- AGENTS
CREATE TABLE IF NOT EXISTS agents (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  role            TEXT,
  badge           TEXT,
  status          TEXT DEFAULT 'idle' CHECK(status IN ('idle', 'active', 'blocked')),
  current_task_id TEXT,
  session_key     TEXT,
  created_at      TEXT DEFAULT (datetime('now')),
  updated_at      TEXT DEFAULT (datetime('now'))
);

-- TASKS
CREATE TABLE IF NOT EXISTS tasks (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  description TEXT,
  status      TEXT DEFAULT 'inbox' CHECK(status IN ('inbox', 'assigned', 'in_progress', 'review', 'done')),
  created_at  TEXT DEFAULT (datetime('now')),
  updated_at  TEXT DEFAULT (datetime('now'))
);

-- TASK_ASSIGNEES (junction table for multiple assignees)
CREATE TABLE IF NOT EXISTS task_assignees (
  task_id  TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, agent_id)
);

-- DOCUMENTS (must be before messages for FK reference)
CREATE TABLE IF NOT EXISTS documents (
  id         TEXT PRIMARY KEY,
  title      TEXT NOT NULL,
  content    TEXT,
  type       TEXT CHECK(type IN ('deliverable', 'research', 'protocol')),
  task_id    TEXT REFERENCES tasks(id) ON DELETE SET NULL,
  agent_id   TEXT REFERENCES agents(id),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- MESSAGES
CREATE TABLE IF NOT EXISTS messages (
  id            TEXT PRIMARY KEY,
  task_id       TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  from_agent_id TEXT REFERENCES agents(id),
  content       TEXT NOT NULL,
  created_at    TEXT DEFAULT (datetime('now'))
);

-- MESSAGE_ATTACHMENTS (junction table for message->document links)
CREATE TABLE IF NOT EXISTS message_attachments (
  message_id  TEXT NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  PRIMARY KEY (message_id, document_id)
);

-- AUDITS
CREATE TABLE IF NOT EXISTS audits (
  id           TEXT PRIMARY KEY,
  task_id      TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  threat_level TEXT CHECK(threat_level IN ('safe', 'warning', 'critical')),
  content      TEXT,
  created_at   TEXT DEFAULT (datetime('now'))
);

-- ACTIVITIES
CREATE TABLE IF NOT EXISTS activities (
  id         TEXT PRIMARY KEY,
  type       TEXT NOT NULL CHECK(type IN ('task_created', 'task_updated', 'status_changed', 'message_sent', 'document_created', 'audit_completed')),
  agent_id   TEXT REFERENCES agents(id),
  task_id    TEXT REFERENCES tasks(id) ON DELETE SET NULL,
  message    TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

-- NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
  id                 TEXT PRIMARY KEY,
  mentioned_agent_id TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  content            TEXT NOT NULL,
  delivered          INTEGER DEFAULT 0,
  created_at         TEXT DEFAULT (datetime('now'))
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_task_assignees_agent ON task_assignees(agent_id);
CREATE INDEX IF NOT EXISTS idx_task_assignees_task ON task_assignees(task_id);
CREATE INDEX IF NOT EXISTS idx_messages_task ON messages(task_id);
CREATE INDEX IF NOT EXISTS idx_message_attachments_doc ON message_attachments(document_id);
CREATE INDEX IF NOT EXISTS idx_message_attachments_msg ON message_attachments(message_id);
CREATE INDEX IF NOT EXISTS idx_activities_created ON activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(type);
CREATE INDEX IF NOT EXISTS idx_documents_task ON documents(task_id);
CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(status);
CREATE INDEX IF NOT EXISTS idx_audits_task ON audits(task_id);
CREATE INDEX IF NOT EXISTS idx_notifications_agent ON notifications(mentioned_agent_id);
CREATE INDEX IF NOT EXISTS idx_notifications_undelivered ON notifications(delivered) WHERE delivered = 0;
```

**Step 3: Commit**

```bash
git add db/schema.sql && git commit -m "feat: add database schema"
```

---

## Task 4: Create Database Connection Module

**Files:**
- Create: `lib/db.ts`

**Step 1: Create lib directory**

Run: `mkdir -p lib`

**Step 2: Create database module**

Create `lib/db.ts`:
```typescript
import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, '../db/clawboard.db');
const SCHEMA_PATH = join(__dirname, '../db/schema.sql');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');

    // Run schema
    const schema = readFileSync(SCHEMA_PATH, 'utf-8');
    db.exec(schema);
  }
  return db;
}

export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}
```

**Step 3: Test database initialization**

Run: `npx tsx -e "import { getDb, closeDb } from './lib/db.js'; const db = getDb(); console.log('OK'); closeDb();"`
Expected: "OK" printed, `db/clawboard.db` created

**Step 4: Commit**

```bash
git add lib/db.ts && git commit -m "feat: add database connection module"
```

---

## Task 5: Create Zod Types

**Files:**
- Create: `lib/types.ts`

**Step 1: Create types file**

Create `lib/types.ts`:
```typescript
import { z } from 'zod';

// === ENUMS ===

export const AgentStatus = z.enum(['idle', 'active', 'blocked']);
export type AgentStatus = z.infer<typeof AgentStatus>;

export const TaskStatus = z.enum(['inbox', 'assigned', 'in_progress', 'review', 'done']);
export type TaskStatus = z.infer<typeof TaskStatus>;

export const ThreatLevel = z.enum(['safe', 'warning', 'critical']);
export type ThreatLevel = z.infer<typeof ThreatLevel>;

export const ActivityType = z.enum([
  'task_created',
  'task_updated',
  'status_changed',
  'message_sent',
  'document_created',
  'audit_completed',
]);
export type ActivityType = z.infer<typeof ActivityType>;

export const DocumentType = z.enum(['deliverable', 'research', 'protocol']);
export type DocumentType = z.infer<typeof DocumentType>;

// === AGENTS ===

export const AgentSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string().nullable(),
  badge: z.string().nullable(),
  status: AgentStatus,
  current_task_id: z.string().nullable(),
  session_key: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Agent = z.infer<typeof AgentSchema>;

export const CreateAgentInput = z.object({
  name: z.string().min(1),
  role: z.string().optional(),
  badge: z.string().optional(),
  status: AgentStatus.optional().default('idle'),
  sessionKey: z.string().optional(),
});
export type CreateAgentInput = z.infer<typeof CreateAgentInput>;

export const UpdateAgentInput = z.object({
  id: z.string(),
  name: z.string().min(1).optional(),
  role: z.string().nullable().optional(),
  badge: z.string().nullable().optional(),
  status: AgentStatus.optional(),
  currentTaskId: z.string().nullable().optional(),
  sessionKey: z.string().nullable().optional(),
});
export type UpdateAgentInput = z.infer<typeof UpdateAgentInput>;

// === TASKS ===

export const TaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  status: TaskStatus,
  created_at: z.string(),
  updated_at: z.string(),
});
export type Task = z.infer<typeof TaskSchema>;

export const CreateTaskInput = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  status: TaskStatus.optional().default('inbox'),
  assigneeIds: z.array(z.string()).optional(),
});
export type CreateTaskInput = z.infer<typeof CreateTaskInput>;

export const UpdateTaskInput = z.object({
  id: z.string(),
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  status: TaskStatus.optional(),
});
export type UpdateTaskInput = z.infer<typeof UpdateTaskInput>;

export const AssignTaskInput = z.object({
  id: z.string(),
  agentIds: z.array(z.string()),
});
export type AssignTaskInput = z.infer<typeof AssignTaskInput>;

// === MESSAGES ===

export const MessageSchema = z.object({
  id: z.string(),
  task_id: z.string(),
  from_agent_id: z.string().nullable(),
  content: z.string(),
  created_at: z.string(),
});
export type Message = z.infer<typeof MessageSchema>;

export const CreateMessageInput = z.object({
  taskId: z.string(),
  fromAgentId: z.string().optional(),
  content: z.string().min(1),
  attachmentIds: z.array(z.string()).optional(),
});
export type CreateMessageInput = z.infer<typeof CreateMessageInput>;

export const AttachToMessageInput = z.object({
  id: z.string(),
  documentIds: z.array(z.string()),
});
export type AttachToMessageInput = z.infer<typeof AttachToMessageInput>;

// === DOCUMENTS ===

export const DocumentSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string().nullable(),
  type: DocumentType.nullable(),
  task_id: z.string().nullable(),
  agent_id: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Document = z.infer<typeof DocumentSchema>;

export const CreateDocumentInput = z.object({
  title: z.string().min(1),
  content: z.string().optional(),
  type: DocumentType.optional(),
  taskId: z.string().optional(),
  agentId: z.string().optional(),
});
export type CreateDocumentInput = z.infer<typeof CreateDocumentInput>;

// === AUDITS ===

export const AuditSchema = z.object({
  id: z.string(),
  task_id: z.string(),
  threat_level: ThreatLevel.nullable(),
  content: z.string().nullable(),
  created_at: z.string(),
});
export type Audit = z.infer<typeof AuditSchema>;

export const CreateAuditInput = z.object({
  taskId: z.string(),
  threatLevel: ThreatLevel.optional(),
  content: z.string().optional(),
});
export type CreateAuditInput = z.infer<typeof CreateAuditInput>;

// === ACTIVITIES ===

export const ActivitySchema = z.object({
  id: z.string(),
  type: ActivityType,
  agent_id: z.string().nullable(),
  task_id: z.string().nullable(),
  message: z.string(),
  created_at: z.string(),
});
export type Activity = z.infer<typeof ActivitySchema>;

export const CreateActivityInput = z.object({
  type: ActivityType,
  agentId: z.string().optional(),
  taskId: z.string().optional(),
  message: z.string().min(1),
});
export type CreateActivityInput = z.infer<typeof CreateActivityInput>;

// === NOTIFICATIONS ===

export const NotificationSchema = z.object({
  id: z.string(),
  mentioned_agent_id: z.string(),
  content: z.string(),
  delivered: z.number().transform((v) => Boolean(v)),
  created_at: z.string(),
});
export type Notification = z.infer<typeof NotificationSchema>;

export const CreateNotificationInput = z.object({
  mentionedAgentId: z.string(),
  content: z.string().min(1),
});
export type CreateNotificationInput = z.infer<typeof CreateNotificationInput>;
```

**Step 2: Verify types compile**

Run: `npx tsc lib/types.ts --noEmit --esModuleInterop --module NodeNext --moduleResolution NodeNext`
Expected: No errors

**Step 3: Commit**

```bash
git add lib/types.ts && git commit -m "feat: add Zod schemas for all entities"
```

---

## Task 6: Create CLI Shell Wrapper

**Files:**
- Create: `bin/clawboard`

**Step 1: Create bin directory**

Run: `mkdir -p bin`

**Step 2: Create shell wrapper**

Create `bin/clawboard`:
```bash
#!/usr/bin/env node --import tsx
import './clawboard.ts';
```

**Step 3: Make executable**

Run: `chmod +x bin/clawboard`

**Step 4: Commit**

```bash
git add bin/clawboard && git commit -m "feat: add clawboard CLI shell wrapper"
```

---

## Task 7: Create CLI Tool - Core Structure

**Files:**
- Create: `bin/clawboard.ts`

**Step 1: Create CLI with help and setup commands**

Create `bin/clawboard.ts`:
```typescript
import Database from 'better-sqlite3';
import { v4 as uuid } from 'uuid';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, '../db/clawboard.db');
const SCHEMA_PATH = join(__dirname, '../db/schema.sql');

// Initialize database
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
const schema = readFileSync(SCHEMA_PATH, 'utf-8');
db.exec(schema);

const [command, jsonArg] = process.argv.slice(2);

if (!command) {
  console.log(`Usage: clawboard <entity>:<action> '<json>'

Commands:
  agents:list
  agents:create '{"name": "...", "role": "...", "badge": "..."}'
  agents:update '{"id": "...", "status": "active"}'
  agents:delete '{"id": "..."}'

  tasks:list
  tasks:create '{"title": "...", "description": "..."}'
  tasks:update '{"id": "...", "status": "in_progress"}'
  tasks:assign '{"id": "...", "agentIds": ["...", "..."]}'
  tasks:unassign '{"id": "...", "agentIds": ["..."]}'
  tasks:delete '{"id": "..."}'

  messages:list '{"taskId": "..."}'
  messages:create '{"taskId": "...", "fromAgentId": "...", "content": "..."}'
  messages:attach '{"id": "...", "documentIds": ["..."]}'

  documents:list
  documents:create '{"title": "...", "type": "deliverable", "content": "..."}'
  documents:delete '{"id": "..."}'

  audits:list '{"taskId": "..."}'
  audits:create '{"taskId": "...", "threatLevel": "safe", "content": "..."}'

  activities:list
  activities:create '{"type": "task_created", "message": "..."}'

  notifications:list '{"agentId": "..."}'
  notifications:create '{"mentionedAgentId": "...", "content": "..."}'
  notifications:deliver '{"id": "..."}'

  setup    Show PATH setup instructions
`);
  db.close();
  process.exit(0);
}

if (command === 'setup') {
  const binPath = join(__dirname, 'clawboard');
  console.log(`To add clawboard to your PATH, run:

  sudo ln -sf "${binPath}" /usr/local/bin/clawboard

Or add this to your shell profile (~/.bashrc or ~/.zshrc):

  export PATH="${__dirname}:\$PATH"
`);
  db.close();
  process.exit(0);
}

const [entity, action] = command.split(':');
const input = jsonArg ? JSON.parse(jsonArg) : {};
const now = new Date().toISOString();

// Helper: create activity
function createActivity(type: string, agentId: string | null, taskId: string | null, message: string) {
  db.prepare(`
    INSERT INTO activities (id, type, agent_id, task_id, message, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(uuid(), type, agentId, taskId, message, now);
}

// === AGENTS ===
if (entity === 'agents') {
  if (action === 'list') {
    const agents = db.prepare('SELECT * FROM agents ORDER BY name ASC').all();
    console.log(JSON.stringify(agents, null, 2));
  } else if (action === 'create') {
    const id = uuid();
    db.prepare(`
      INSERT INTO agents (id, name, role, badge, status, session_key, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, input.name, input.role || null, input.badge || null, input.status || 'idle', input.sessionKey || null, now, now);
    const agent = db.prepare('SELECT * FROM agents WHERE id = ?').get(id);
    console.log(JSON.stringify(agent, null, 2));
  } else if (action === 'update') {
    const updates: string[] = ['updated_at = ?'];
    const values: (string | null)[] = [now];
    if (input.name) { updates.push('name = ?'); values.push(input.name); }
    if (input.role !== undefined) { updates.push('role = ?'); values.push(input.role); }
    if (input.badge !== undefined) { updates.push('badge = ?'); values.push(input.badge); }
    if (input.status) { updates.push('status = ?'); values.push(input.status); }
    if (input.currentTaskId !== undefined) { updates.push('current_task_id = ?'); values.push(input.currentTaskId); }
    if (input.sessionKey !== undefined) { updates.push('session_key = ?'); values.push(input.sessionKey); }
    values.push(input.id);
    db.prepare(`UPDATE agents SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    const agent = db.prepare('SELECT * FROM agents WHERE id = ?').get(input.id);
    console.log(JSON.stringify(agent, null, 2));
  } else if (action === 'delete') {
    db.prepare('DELETE FROM agents WHERE id = ?').run(input.id);
    console.log(JSON.stringify({ success: true }));
  }
}

// === TASKS ===
else if (entity === 'tasks') {
  if (action === 'list') {
    const tasks = db.prepare('SELECT * FROM tasks ORDER BY created_at DESC').all();
    // Include assignees for each task
    const tasksWithAssignees = tasks.map((task: any) => {
      const assignees = db.prepare(`
        SELECT a.* FROM agents a
        JOIN task_assignees ta ON ta.agent_id = a.id
        WHERE ta.task_id = ?
      `).all(task.id);
      return { ...task, assignees };
    });
    console.log(JSON.stringify(tasksWithAssignees, null, 2));
  } else if (action === 'create') {
    const id = uuid();
    db.prepare(`
      INSERT INTO tasks (id, title, description, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, input.title, input.description || null, input.status || 'inbox', now, now);

    // Add assignees if provided
    if (input.assigneeIds && input.assigneeIds.length > 0) {
      const insertAssignee = db.prepare('INSERT INTO task_assignees (task_id, agent_id) VALUES (?, ?)');
      for (const agentId of input.assigneeIds) {
        insertAssignee.run(id, agentId);
      }
    }

    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    const assignees = db.prepare(`
      SELECT a.* FROM agents a
      JOIN task_assignees ta ON ta.agent_id = a.id
      WHERE ta.task_id = ?
    `).all(id);
    createActivity('task_created', input.assigneeIds?.[0] || null, id, `Task "${input.title}" created`);
    console.log(JSON.stringify({ ...task, assignees }, null, 2));
  } else if (action === 'update') {
    const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(input.id) as { title: string; status: string } | undefined;
    if (!existing) { console.error('Task not found'); process.exit(1); }
    const updates: string[] = ['updated_at = ?'];
    const values: (string | null)[] = [now];
    if (input.title) { updates.push('title = ?'); values.push(input.title); }
    if (input.description !== undefined) { updates.push('description = ?'); values.push(input.description); }
    if (input.status) { updates.push('status = ?'); values.push(input.status); }
    values.push(input.id);
    db.prepare(`UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(input.id);
    if (input.status && input.status !== existing.status) {
      createActivity('status_changed', null, input.id, `Task "${existing.title}" moved to ${input.status}`);
    }
    console.log(JSON.stringify(task, null, 2));
  } else if (action === 'assign') {
    const insertAssignee = db.prepare('INSERT OR IGNORE INTO task_assignees (task_id, agent_id) VALUES (?, ?)');
    for (const agentId of input.agentIds) {
      insertAssignee.run(input.id, agentId);
    }
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(input.id);
    const assignees = db.prepare(`
      SELECT a.* FROM agents a
      JOIN task_assignees ta ON ta.agent_id = a.id
      WHERE ta.task_id = ?
    `).all(input.id);
    console.log(JSON.stringify({ ...task, assignees }, null, 2));
  } else if (action === 'unassign') {
    const deleteAssignee = db.prepare('DELETE FROM task_assignees WHERE task_id = ? AND agent_id = ?');
    for (const agentId of input.agentIds) {
      deleteAssignee.run(input.id, agentId);
    }
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(input.id);
    const assignees = db.prepare(`
      SELECT a.* FROM agents a
      JOIN task_assignees ta ON ta.agent_id = a.id
      WHERE ta.task_id = ?
    `).all(input.id);
    console.log(JSON.stringify({ ...task, assignees }, null, 2));
  } else if (action === 'delete') {
    db.prepare('DELETE FROM tasks WHERE id = ?').run(input.id);
    console.log(JSON.stringify({ success: true }));
  }
}

// === MESSAGES ===
else if (entity === 'messages') {
  if (action === 'list') {
    if (!input.taskId) { console.error('taskId required'); process.exit(1); }
    const messages = db.prepare('SELECT * FROM messages WHERE task_id = ? ORDER BY created_at ASC').all(input.taskId);
    // Include attachments for each message
    const messagesWithAttachments = messages.map((msg: any) => {
      const attachments = db.prepare(`
        SELECT d.* FROM documents d
        JOIN message_attachments ma ON ma.document_id = d.id
        WHERE ma.message_id = ?
      `).all(msg.id);
      return { ...msg, attachments };
    });
    console.log(JSON.stringify(messagesWithAttachments, null, 2));
  } else if (action === 'create') {
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(input.taskId) as { title: string } | undefined;
    if (!task) { console.error('Task not found'); process.exit(1); }
    const id = uuid();
    db.prepare(`
      INSERT INTO messages (id, task_id, from_agent_id, content, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, input.taskId, input.fromAgentId || null, input.content, now);

    // Add attachments if provided
    if (input.attachmentIds && input.attachmentIds.length > 0) {
      const insertAttachment = db.prepare('INSERT INTO message_attachments (message_id, document_id) VALUES (?, ?)');
      for (const docId of input.attachmentIds) {
        insertAttachment.run(id, docId);
      }
    }

    const message = db.prepare('SELECT * FROM messages WHERE id = ?').get(id);
    let actorName = 'Someone';
    if (input.fromAgentId) {
      const agent = db.prepare('SELECT * FROM agents WHERE id = ?').get(input.fromAgentId) as { name: string } | undefined;
      if (agent) actorName = agent.name;
    }
    createActivity('message_sent', input.fromAgentId || null, input.taskId, `${actorName} commented on "${task.title}"`);
    console.log(JSON.stringify(message, null, 2));
  } else if (action === 'attach') {
    const insertAttachment = db.prepare('INSERT OR IGNORE INTO message_attachments (message_id, document_id) VALUES (?, ?)');
    for (const docId of input.documentIds) {
      insertAttachment.run(input.id, docId);
    }
    const message = db.prepare('SELECT * FROM messages WHERE id = ?').get(input.id);
    const attachments = db.prepare(`
      SELECT d.* FROM documents d
      JOIN message_attachments ma ON ma.document_id = d.id
      WHERE ma.message_id = ?
    `).all(input.id);
    console.log(JSON.stringify({ ...message, attachments }, null, 2));
  }
}

// === DOCUMENTS ===
else if (entity === 'documents') {
  if (action === 'list') {
    const docs = db.prepare('SELECT * FROM documents ORDER BY created_at DESC').all();
    console.log(JSON.stringify(docs, null, 2));
  } else if (action === 'create') {
    const id = uuid();
    db.prepare(`
      INSERT INTO documents (id, title, content, type, task_id, agent_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, input.title, input.content || null, input.type || null, input.taskId || null, input.agentId || null, now, now);
    const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(id);
    let actorName = 'Someone';
    if (input.agentId) {
      const agent = db.prepare('SELECT * FROM agents WHERE id = ?').get(input.agentId) as { name: string } | undefined;
      if (agent) actorName = agent.name;
    }
    createActivity('document_created', input.agentId || null, input.taskId || null, `${actorName} created document "${input.title}"`);
    console.log(JSON.stringify(doc, null, 2));
  } else if (action === 'delete') {
    db.prepare('DELETE FROM documents WHERE id = ?').run(input.id);
    console.log(JSON.stringify({ success: true }));
  }
}

// === AUDITS ===
else if (entity === 'audits') {
  if (action === 'list') {
    if (!input.taskId) { console.error('taskId required'); process.exit(1); }
    const audits = db.prepare('SELECT * FROM audits WHERE task_id = ? ORDER BY created_at DESC').all(input.taskId);
    console.log(JSON.stringify(audits, null, 2));
  } else if (action === 'create') {
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(input.taskId) as { title: string } | undefined;
    if (!task) { console.error('Task not found'); process.exit(1); }
    const id = uuid();
    db.prepare(`
      INSERT INTO audits (id, task_id, threat_level, content, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, input.taskId, input.threatLevel || null, input.content || null, now);
    const audit = db.prepare('SELECT * FROM audits WHERE id = ?').get(id);
    createActivity('audit_completed', null, input.taskId, `Audit completed for "${task.title}" - ${input.threatLevel || 'unknown'}`);
    console.log(JSON.stringify(audit, null, 2));
  }
}

// === ACTIVITIES ===
else if (entity === 'activities') {
  if (action === 'list') {
    const limit = input.limit || 50;
    const activities = db.prepare('SELECT * FROM activities ORDER BY created_at DESC LIMIT ?').all(limit);
    console.log(JSON.stringify(activities, null, 2));
  } else if (action === 'create') {
    const id = uuid();
    db.prepare(`
      INSERT INTO activities (id, type, agent_id, task_id, message, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, input.type, input.agentId || null, input.taskId || null, input.message, now);
    const activity = db.prepare('SELECT * FROM activities WHERE id = ?').get(id);
    console.log(JSON.stringify(activity, null, 2));
  }
}

// === NOTIFICATIONS ===
else if (entity === 'notifications') {
  if (action === 'list') {
    let query = 'SELECT * FROM notifications';
    const params: (string | number)[] = [];
    if (input.agentId) {
      query += ' WHERE mentioned_agent_id = ?';
      params.push(input.agentId);
    }
    if (input.undeliveredOnly) {
      query += params.length ? ' AND delivered = 0' : ' WHERE delivered = 0';
    }
    query += ' ORDER BY created_at DESC';
    if (input.limit) {
      query += ' LIMIT ?';
      params.push(input.limit);
    }
    const notifications = db.prepare(query).all(...params);
    console.log(JSON.stringify(notifications, null, 2));
  } else if (action === 'create') {
    const id = uuid();
    db.prepare(`
      INSERT INTO notifications (id, mentioned_agent_id, content, delivered, created_at)
      VALUES (?, ?, ?, 0, ?)
    `).run(id, input.mentionedAgentId, input.content, now);
    const notification = db.prepare('SELECT * FROM notifications WHERE id = ?').get(id);
    console.log(JSON.stringify(notification, null, 2));
  } else if (action === 'deliver') {
    db.prepare('UPDATE notifications SET delivered = 1 WHERE id = ?').run(input.id);
    const notification = db.prepare('SELECT * FROM notifications WHERE id = ?').get(input.id);
    console.log(JSON.stringify(notification, null, 2));
  }
}

else {
  console.error(`Unknown command: ${command}`);
  process.exit(1);
}

db.close();
```

**Step 2: Test CLI help**

Run: `./bin/clawboard`
Expected: Help text printed

**Step 3: Commit**

```bash
git add bin/clawboard.ts && git commit -m "feat: add clawboard CLI tool"
```

---

## Task 8: Test CLI Operations

**Step 1: Test agents CRUD**

```bash
# Create agent
./bin/clawboard agents:create '{"name": "Fury", "role": "Researcher", "badge": "SPC"}'

# List agents
./bin/clawboard agents:list

# Update agent (use id from previous output)
./bin/clawboard agents:update '{"id": "<id>", "status": "active"}'

# Create second agent
./bin/clawboard agents:create '{"name": "Friday", "role": "Developer"}'
```

Expected: JSON output for each command

**Step 2: Test tasks with multiple assignees**

```bash
# Create task with assignees
./bin/clawboard tasks:create '{"title": "Research competitors", "assigneeIds": ["<fury-id>", "<friday-id>"]}'

# List tasks (should show assignees array)
./bin/clawboard tasks:list

# Assign more agents
./bin/clawboard tasks:assign '{"id": "<task-id>", "agentIds": ["<agent-id>"]}'

# Unassign
./bin/clawboard tasks:unassign '{"id": "<task-id>", "agentIds": ["<agent-id>"]}'
```

Expected: Tasks include `assignees` array

**Step 3: Test messages with attachments**

```bash
# Create document
./bin/clawboard documents:create '{"title": "Research Notes", "type": "research", "content": "# Notes\n..."}'

# Create message with attachment
./bin/clawboard messages:create '{"taskId": "<task-id>", "fromAgentId": "<fury-id>", "content": "See attached", "attachmentIds": ["<doc-id>"]}'

# List messages (should show attachments)
./bin/clawboard messages:list '{"taskId": "<task-id>"}'
```

Expected: Messages include `attachments` array

**Step 4: Test notifications**

```bash
# Create notification
./bin/clawboard notifications:create '{"mentionedAgentId": "<fury-id>", "content": "You were mentioned in a task"}'

# List notifications
./bin/clawboard notifications:list '{"agentId": "<fury-id>"}'

# Mark as delivered
./bin/clawboard notifications:deliver '{"id": "<notification-id>"}'
```

Expected: Notification delivered status changes

**Step 5: Clean up test database**

Run: `rm db/clawboard.db*`

---

## Task 9: Update Vite Config for API Proxy

**Files:**
- Modify: `vite.config.ts`

**Step 1: Add proxy configuration**

Update `vite.config.ts`:
```typescript
import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:18790',
        changeOrigin: true,
      },
    },
  },
})
```

**Step 2: Commit**

```bash
git add vite.config.ts && git commit -m "feat: add API proxy for future routes"
```

---

## Task 10: Update CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

**Step 1: Update with CLI reference**

Update `CLAUDE.md`:
```markdown
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # Start development server (frontend)
pnpm build        # Type-check and build for production
pnpm lint         # Run ESLint
pnpm preview      # Preview production build
```

## CLI Tool

The `clawboard` CLI provides database operations for agents to interact with the system.

```bash
# Setup (add to PATH)
./bin/clawboard setup

# Agents
./bin/clawboard agents:list
./bin/clawboard agents:create '{"name": "Fury", "role": "Researcher"}'
./bin/clawboard agents:update '{"id": "...", "status": "active"}'
./bin/clawboard agents:delete '{"id": "..."}'

# Tasks (supports multiple assignees)
./bin/clawboard tasks:list
./bin/clawboard tasks:create '{"title": "...", "assigneeIds": ["...", "..."]}'
./bin/clawboard tasks:update '{"id": "...", "status": "in_progress"}'
./bin/clawboard tasks:assign '{"id": "...", "agentIds": ["..."]}'
./bin/clawboard tasks:unassign '{"id": "...", "agentIds": ["..."]}'
./bin/clawboard tasks:delete '{"id": "..."}'

# Messages (supports attachments)
./bin/clawboard messages:list '{"taskId": "..."}'
./bin/clawboard messages:create '{"taskId": "...", "fromAgentId": "...", "content": "..."}'
./bin/clawboard messages:attach '{"id": "...", "documentIds": ["..."]}'

# Documents
./bin/clawboard documents:list
./bin/clawboard documents:create '{"title": "...", "type": "deliverable", "content": "..."}'
./bin/clawboard documents:delete '{"id": "..."}'

# Audits
./bin/clawboard audits:list '{"taskId": "..."}'
./bin/clawboard audits:create '{"taskId": "...", "threatLevel": "safe", "content": "..."}'

# Activities
./bin/clawboard activities:list
./bin/clawboard activities:create '{"type": "task_created", "message": "..."}'

# Notifications
./bin/clawboard notifications:list '{"agentId": "..."}'
./bin/clawboard notifications:create '{"mentionedAgentId": "...", "content": "..."}'
./bin/clawboard notifications:deliver '{"id": "..."}'
```

## Adding shadcn/ui Components

```bash
pnpm dlx shadcn@latest add <component-name>
```

Components are installed to `src/components/ui/`. The project uses the `radix-vega` style with `zinc` as the base color.

## Architecture

- **React 19** with Vite 7 and TypeScript
- **Tailwind CSS v4** via `@tailwindcss/vite` plugin (no separate config file)
- **shadcn/ui** components using Radix UI primitives and `class-variance-authority` for variants
- **SQLite** database via better-sqlite3 for local data storage
- **Path alias**: `@/` maps to `src/`

## Project Structure

```
bin/
├── clawboard               # CLI shell wrapper
└── clawboard.ts            # CLI implementation

db/
├── schema.sql              # Database schema
└── clawboard.db            # SQLite database (gitignored)

lib/
├── db.ts                   # Database connection
└── types.ts                # Zod schemas

src/
├── components/
│   └── ui/                 # shadcn/ui components
├── lib/
│   └── utils.ts            # cn() utility for className merging
├── App.tsx                 # Root component
├── main.tsx                # Entry point
└── index.css               # Tailwind imports and CSS variables (theme)
```

## Database Schema

7 tables: agents, tasks, messages, documents, audits, activities, notifications
2 junction tables: task_assignees, message_attachments

See `db/schema.sql` for full schema.

## Styling

- Theme colors defined as CSS variables in `src/index.css` using OKLCH color space
- Dark mode via `.dark` class on parent element
- Use `cn()` from `@/lib/utils` to merge Tailwind classes
- Inter Variable font is the default sans-serif
```

**Step 2: Commit**

```bash
git add CLAUDE.md && git commit -m "docs: update CLAUDE.md with CLI reference"
```

---

## Task 11: Update README.md

**Files:**
- Modify: `README.md`

**Step 1: Update README**

Update `README.md`:
```markdown
# ClawBoard

Mission Control for coordinating AI agents. Track tasks, messages, documents, and activities across multiple agents.

## Quick Start

```bash
# Install dependencies
pnpm install

# Run CLI tool
./bin/clawboard agents:list

# Add to PATH (optional)
./bin/clawboard setup
```

## CLI Usage

```bash
clawboard <entity>:<action> '<json>'
```

See `CLAUDE.md` for full command reference.

## Database

SQLite database at `db/clawboard.db`. Schema in `db/schema.sql`.

Tables: agents, tasks, messages, documents, audits, activities, notifications

## Development

```bash
pnpm dev      # Start frontend dev server
pnpm build    # Build for production
pnpm lint     # Run linter
```
```

**Step 2: Commit**

```bash
git add README.md && git commit -m "docs: update README with project overview"
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Install dependencies | `package.json` |
| 2 | Update .gitignore | `.gitignore` |
| 3 | Create database schema | `db/schema.sql` |
| 4 | Create database module | `lib/db.ts` |
| 5 | Create Zod types | `lib/types.ts` |
| 6 | Create CLI wrapper | `bin/clawboard` |
| 7 | Create CLI tool | `bin/clawboard.ts` |
| 8 | Test CLI operations | (manual testing) |
| 9 | Update Vite config | `vite.config.ts` |
| 10 | Update CLAUDE.md | `CLAUDE.md` |
| 11 | Update README.md | `README.md` |

Total: 11 tasks with frequent commits.
