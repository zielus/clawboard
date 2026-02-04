# Database Migration Design

**Date:** 2026-02-04
**Status:** Approved

## Overview

Migrate the base infrastructure from clawboard-v1 to the new repo. CLI-only for now, with Hono dependencies ready for future routes.

Based on the six-table schema from the Twitter post, plus our `audits` table for security reviews.

## Schema

7 tables with 2 junction tables for many-to-many relationships:

```sql
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

-- TASK_ASSIGNEES (junction table)
CREATE TABLE IF NOT EXISTS task_assignees (
  task_id  TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, agent_id)
);

-- MESSAGES
CREATE TABLE IF NOT EXISTS messages (
  id            TEXT PRIMARY KEY,
  task_id       TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  from_agent_id TEXT REFERENCES agents(id),
  content       TEXT NOT NULL,
  created_at    TEXT DEFAULT (datetime('now'))
);

-- MESSAGE_ATTACHMENTS (junction table)
CREATE TABLE IF NOT EXISTS message_attachments (
  message_id  TEXT NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  PRIMARY KEY (message_id, document_id)
);

-- DOCUMENTS
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
CREATE INDEX IF NOT EXISTS idx_messages_task ON messages(task_id);
CREATE INDEX IF NOT EXISTS idx_message_attachments_doc ON message_attachments(document_id);
CREATE INDEX IF NOT EXISTS idx_activities_created ON activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(type);
CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(status);
CREATE INDEX IF NOT EXISTS idx_notifications_agent ON notifications(mentioned_agent_id);
CREATE INDEX IF NOT EXISTS idx_notifications_undelivered ON notifications(delivered) WHERE delivered = 0;
```

## Files to Create

```
db/
  schema.sql              # Schema definition

lib/
  db.ts                   # Database connection
  types.ts                # Zod schemas

bin/
  clawboard               # Shell wrapper
  clawboard.ts            # CLI tool
```

## Files to Modify

```
package.json              # Add dependencies + scripts
.gitignore                # Add db/*.db patterns
vite.config.ts            # Add API proxy (ready for later)
CLAUDE.md                 # CLI commands reference
README.md                 # Project overview
```

## Dependencies

**Production:**
- `better-sqlite3` — SQLite driver
- `zod` — validation
- `uuid` — ID generation
- `hono`, `@hono/node-server` — ready for routes later

**Dev:**
- `@types/better-sqlite3`, `@types/uuid` — type definitions
- `tsx` — TypeScript execution
- `concurrently` — dev convenience

## CLI Commands

```bash
clawboard <entity>:<action> '<json>'

# Agents
clawboard agents:list
clawboard agents:create '{"name": "Fury", "role": "Researcher"}'
clawboard agents:update '{"id": "...", "status": "active"}'
clawboard agents:delete '{"id": "..."}'

# Tasks
clawboard tasks:list
clawboard tasks:create '{"title": "Research competitors"}'
clawboard tasks:update '{"id": "...", "status": "in_progress"}'
clawboard tasks:assign '{"id": "...", "agentIds": ["...", "..."]}'
clawboard tasks:delete '{"id": "..."}'

# Messages
clawboard messages:list '{"taskId": "..."}'
clawboard messages:create '{"taskId": "...", "fromAgentId": "...", "content": "..."}'
clawboard messages:attach '{"id": "...", "documentIds": ["..."]}'

# Documents
clawboard documents:list
clawboard documents:create '{"title": "Report", "type": "deliverable", "content": "..."}'
clawboard documents:delete '{"id": "..."}'

# Audits
clawboard audits:create '{"taskId": "...", "threatLevel": "safe", "content": "..."}'

# Activities
clawboard activities:list
clawboard activities:create '{"type": "task_created", "message": "..."}'

# Notifications
clawboard notifications:list '{"agentId": "..."}'
clawboard notifications:create '{"mentionedAgentId": "...", "content": "..."}'
clawboard notifications:deliver '{"id": "..."}'

# Setup
clawboard setup
```

## Key Changes from v1

1. **Multiple assignees** — `task_assignees` junction table instead of single `assignee_id`
2. **Message attachments** — `message_attachments` junction table
3. **Notifications table** — new, for @mentions
4. **Renamed field** — `messages.agent_id` → `messages.from_agent_id`
5. **No routes** — CLI only for now, routes added later
6. **Lib location** — `lib/` instead of `server/lib/`
