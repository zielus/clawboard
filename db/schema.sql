-- Mission Control Schema
-- 7 tables + 2 junction tables

-- AGENTS
CREATE TABLE IF NOT EXISTS agents (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  role            TEXT,
  badge           TEXT,
  avatar          TEXT,
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
  status      TEXT DEFAULT 'backlog' CHECK(status IN ('backlog', 'in_progress', 'review', 'done')),
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
