// Clawboard CLI - CRUD operations for all entities
// Usage: clawboard entity:action [json-arg]

import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, '..', 'db', 'clawboard.db');
const SCHEMA_PATH = join(__dirname, '..', 'db', 'schema.sql');

// Initialize database
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Run schema
const schema = readFileSync(SCHEMA_PATH, 'utf-8');
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
    console.error('Error: Invalid JSON argument');
    process.exit(1);
  }
}

function output(data: unknown): void {
  console.log(JSON.stringify(data, null, 2));
}

function createActivity(
  type: 'task_created' | 'task_updated' | 'status_changed' | 'message_sent' | 'document_created' | 'audit_completed',
  message: string,
  agentId?: string,
  taskId?: string
): void {
  const id = uuidv4();
  db.prepare(
    'INSERT INTO activities (id, type, agent_id, task_id, message) VALUES (?, ?, ?, ?, ?)'
  ).run(id, type, agentId || null, taskId || null, message);
}

// ============ AGENTS ============

function agentsList(): void {
  const agents = db.prepare('SELECT * FROM agents ORDER BY created_at DESC').all();
  output(agents);
}

function agentsCreate(args: Args): void {
  const id = uuidv4();
  const { name, role, badge, status } = args as { name: string; role?: string; badge?: string; status?: string };

  if (!name) {
    console.error('Error: name is required');
    process.exit(1);
  }

  db.prepare(
    'INSERT INTO agents (id, name, role, badge, status) VALUES (?, ?, ?, ?, ?)'
  ).run(id, name, role || null, badge || null, status || 'idle');

  const agent = db.prepare('SELECT * FROM agents WHERE id = ?').get(id);
  output(agent);
}

function agentsUpdate(args: Args): void {
  const { id, ...updates } = args as { id: string; [key: string]: unknown };

  if (!id) {
    console.error('Error: id is required');
    process.exit(1);
  }

  const fields = Object.keys(updates);
  if (fields.length === 0) {
    console.error('Error: no fields to update');
    process.exit(1);
  }

  const setClause = fields.map(f => `${f} = ?`).join(', ');
  const values = fields.map(f => updates[f]);

  db.prepare(`UPDATE agents SET ${setClause}, updated_at = datetime('now') WHERE id = ?`).run(...values, id);

  const agent = db.prepare('SELECT * FROM agents WHERE id = ?').get(id);
  output(agent);
}

function agentsDelete(args: Args): void {
  const { id } = args as { id: string };

  if (!id) {
    console.error('Error: id is required');
    process.exit(1);
  }

  const result = db.prepare('DELETE FROM agents WHERE id = ?').run(id);
  output({ deleted: result.changes > 0, id });
}

// ============ TASKS ============

function tasksList(): void {
  const tasks = db.prepare('SELECT * FROM tasks ORDER BY created_at DESC').all() as Array<{ id: string; [key: string]: unknown }>;

  // Get assignees for each task
  const tasksWithAssignees = tasks.map(task => {
    const assignees = db.prepare(`
      SELECT a.* FROM agents a
      JOIN task_assignees ta ON ta.agent_id = a.id
      WHERE ta.task_id = ?
    `).all(task.id);
    return { ...task, assignees };
  });

  output(tasksWithAssignees);
}

function tasksCreate(args: Args): void {
  const id = uuidv4();
  const { title, description, status, assigneeIds } = args as {
    title: string;
    description?: string;
    status?: string;
    assigneeIds?: string[];
  };

  if (!title) {
    console.error('Error: title is required');
    process.exit(1);
  }

  db.prepare(
    'INSERT INTO tasks (id, title, description, status) VALUES (?, ?, ?, ?)'
  ).run(id, title, description || null, status || 'inbox');

  // Add assignees if provided
  if (assigneeIds && assigneeIds.length > 0) {
    const insertAssignee = db.prepare('INSERT INTO task_assignees (task_id, agent_id) VALUES (?, ?)');
    for (const agentId of assigneeIds) {
      insertAssignee.run(id, agentId);
    }
  }

  // Create activity
  createActivity('task_created', `Task created: ${title}`, undefined, id);

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  const assignees = db.prepare(`
    SELECT a.* FROM agents a
    JOIN task_assignees ta ON ta.agent_id = a.id
    WHERE ta.task_id = ?
  `).all(id);

  output({ ...task as object, assignees });
}

function tasksUpdate(args: Args): void {
  const { id, ...updates } = args as { id: string; assigneeIds?: string[]; [key: string]: unknown };
  delete updates.assigneeIds; // Exclude assigneeIds from SQL update fields

  if (!id) {
    console.error('Error: id is required');
    process.exit(1);
  }

  const oldTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as { status?: string } | undefined;

  const fields = Object.keys(updates);
  if (fields.length > 0) {
    const setClause = fields.map(f => `${f} = ?`).join(', ');
    const values = fields.map(f => updates[f]);

    db.prepare(`UPDATE tasks SET ${setClause}, updated_at = datetime('now') WHERE id = ?`).run(...values, id);

    // Check if status changed
    if (updates.status && oldTask && updates.status !== oldTask.status) {
      createActivity('status_changed', `Task status changed to ${updates.status}`, undefined, id);
    } else if (fields.length > 0) {
      createActivity('task_updated', `Task updated`, undefined, id);
    }
  }

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  const assignees = db.prepare(`
    SELECT a.* FROM agents a
    JOIN task_assignees ta ON ta.agent_id = a.id
    WHERE ta.task_id = ?
  `).all(id);

  output({ ...task as object, assignees });
}

function tasksAssign(args: Args): void {
  const { id, agentIds } = args as { id: string; agentIds: string[] };

  if (!id) {
    console.error('Error: id is required');
    process.exit(1);
  }
  if (!agentIds || agentIds.length === 0) {
    console.error('Error: agentIds is required');
    process.exit(1);
  }

  const insertAssignee = db.prepare('INSERT OR IGNORE INTO task_assignees (task_id, agent_id) VALUES (?, ?)');
  for (const agentId of agentIds) {
    insertAssignee.run(id, agentId);
  }

  db.prepare(`UPDATE tasks SET updated_at = datetime('now') WHERE id = ?`).run(id);

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  const assignees = db.prepare(`
    SELECT a.* FROM agents a
    JOIN task_assignees ta ON ta.agent_id = a.id
    WHERE ta.task_id = ?
  `).all(id);

  output({ ...task as object, assignees });
}

function tasksUnassign(args: Args): void {
  const { id, agentIds } = args as { id: string; agentIds: string[] };

  if (!id) {
    console.error('Error: id is required');
    process.exit(1);
  }
  if (!agentIds || agentIds.length === 0) {
    console.error('Error: agentIds is required');
    process.exit(1);
  }

  const deleteAssignee = db.prepare('DELETE FROM task_assignees WHERE task_id = ? AND agent_id = ?');
  for (const agentId of agentIds) {
    deleteAssignee.run(id, agentId);
  }

  db.prepare(`UPDATE tasks SET updated_at = datetime('now') WHERE id = ?`).run(id);

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  const assignees = db.prepare(`
    SELECT a.* FROM agents a
    JOIN task_assignees ta ON ta.agent_id = a.id
    WHERE ta.task_id = ?
  `).all(id);

  output({ ...task as object, assignees });
}

function tasksDelete(args: Args): void {
  const { id } = args as { id: string };

  if (!id) {
    console.error('Error: id is required');
    process.exit(1);
  }

  const result = db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
  output({ deleted: result.changes > 0, id });
}

// ============ MESSAGES ============

function messagesList(args: Args): void {
  const { taskId } = args as { taskId?: string };

  let messages;
  if (taskId) {
    messages = db.prepare('SELECT * FROM messages WHERE task_id = ? ORDER BY created_at ASC').all(taskId);
  } else {
    messages = db.prepare('SELECT * FROM messages ORDER BY created_at DESC').all();
  }

  // Get attachments for each message
  const messagesWithAttachments = (messages as Array<{ id: string; [key: string]: unknown }>).map(msg => {
    const attachments = db.prepare(`
      SELECT d.* FROM documents d
      JOIN message_attachments ma ON ma.document_id = d.id
      WHERE ma.message_id = ?
    `).all(msg.id);
    return { ...msg, attachments };
  });

  output(messagesWithAttachments);
}

function messagesCreate(args: Args): void {
  const id = uuidv4();
  const { taskId, fromAgentId, content, attachmentIds } = args as {
    taskId: string;
    fromAgentId?: string;
    content: string;
    attachmentIds?: string[];
  };

  if (!taskId) {
    console.error('Error: taskId is required');
    process.exit(1);
  }
  if (!content) {
    console.error('Error: content is required');
    process.exit(1);
  }

  db.prepare(
    'INSERT INTO messages (id, task_id, from_agent_id, content) VALUES (?, ?, ?, ?)'
  ).run(id, taskId, fromAgentId || null, content);

  // Add attachments if provided
  if (attachmentIds && attachmentIds.length > 0) {
    const insertAttachment = db.prepare('INSERT INTO message_attachments (message_id, document_id) VALUES (?, ?)');
    for (const docId of attachmentIds) {
      insertAttachment.run(id, docId);
    }
  }

  // Create activity
  createActivity('message_sent', `Message sent in task`, fromAgentId, taskId);

  const message = db.prepare('SELECT * FROM messages WHERE id = ?').get(id);
  const attachments = db.prepare(`
    SELECT d.* FROM documents d
    JOIN message_attachments ma ON ma.document_id = d.id
    WHERE ma.message_id = ?
  `).all(id);

  output({ ...message as object, attachments });
}

function messagesAttach(args: Args): void {
  const { id, documentIds } = args as { id: string; documentIds: string[] };

  if (!id) {
    console.error('Error: id is required');
    process.exit(1);
  }
  if (!documentIds || documentIds.length === 0) {
    console.error('Error: documentIds is required');
    process.exit(1);
  }

  const insertAttachment = db.prepare('INSERT OR IGNORE INTO message_attachments (message_id, document_id) VALUES (?, ?)');
  for (const docId of documentIds) {
    insertAttachment.run(id, docId);
  }

  const message = db.prepare('SELECT * FROM messages WHERE id = ?').get(id);
  const attachments = db.prepare(`
    SELECT d.* FROM documents d
    JOIN message_attachments ma ON ma.document_id = d.id
    WHERE ma.message_id = ?
  `).all(id);

  output({ ...message as object, attachments });
}

// ============ DOCUMENTS ============

function documentsList(): void {
  const documents = db.prepare('SELECT * FROM documents ORDER BY created_at DESC').all();
  output(documents);
}

function documentsCreate(args: Args): void {
  const id = uuidv4();
  const { title, content, type, taskId, agentId } = args as {
    title: string;
    content?: string;
    type?: 'deliverable' | 'research' | 'protocol';
    taskId?: string;
    agentId?: string;
  };

  if (!title) {
    console.error('Error: title is required');
    process.exit(1);
  }

  db.prepare(
    'INSERT INTO documents (id, title, content, type, task_id, agent_id) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(id, title, content || null, type || null, taskId || null, agentId || null);

  // Create activity
  createActivity('document_created', `Document created: ${title}`, agentId, taskId);

  const document = db.prepare('SELECT * FROM documents WHERE id = ?').get(id);
  output(document);
}

function documentsDelete(args: Args): void {
  const { id } = args as { id: string };

  if (!id) {
    console.error('Error: id is required');
    process.exit(1);
  }

  const result = db.prepare('DELETE FROM documents WHERE id = ?').run(id);
  output({ deleted: result.changes > 0, id });
}

// ============ AUDITS ============

function auditsList(args: Args): void {
  const { taskId } = args as { taskId?: string };

  let audits;
  if (taskId) {
    audits = db.prepare('SELECT * FROM audits WHERE task_id = ? ORDER BY created_at DESC').all(taskId);
  } else {
    audits = db.prepare('SELECT * FROM audits ORDER BY created_at DESC').all();
  }

  output(audits);
}

function auditsCreate(args: Args): void {
  const id = uuidv4();
  const { taskId, threatLevel, content } = args as {
    taskId: string;
    threatLevel?: 'safe' | 'warning' | 'critical';
    content?: string;
  };

  if (!taskId) {
    console.error('Error: taskId is required');
    process.exit(1);
  }

  db.prepare(
    'INSERT INTO audits (id, task_id, threat_level, content) VALUES (?, ?, ?, ?)'
  ).run(id, taskId, threatLevel || 'safe', content || null);

  // Create activity
  createActivity('audit_completed', `Audit completed: ${threatLevel || 'safe'}`, undefined, taskId);

  const audit = db.prepare('SELECT * FROM audits WHERE id = ?').get(id);
  output(audit);
}

// ============ ACTIVITIES ============

function activitiesList(): void {
  const activities = db.prepare('SELECT * FROM activities ORDER BY created_at DESC').all();
  output(activities);
}

function activitiesCreate(args: Args): void {
  const id = uuidv4();
  const { type, message, agentId, taskId } = args as {
    type: 'task_created' | 'task_updated' | 'status_changed' | 'message_sent' | 'document_created' | 'audit_completed';
    message: string;
    agentId?: string;
    taskId?: string;
  };

  if (!type) {
    console.error('Error: type is required');
    process.exit(1);
  }
  if (!message) {
    console.error('Error: message is required');
    process.exit(1);
  }

  db.prepare(
    'INSERT INTO activities (id, type, agent_id, task_id, message) VALUES (?, ?, ?, ?, ?)'
  ).run(id, type, agentId || null, taskId || null, message);

  const activity = db.prepare('SELECT * FROM activities WHERE id = ?').get(id);
  output(activity);
}

// ============ NOTIFICATIONS ============

function notificationsList(args: Args): void {
  const { agentId } = args as { agentId?: string };

  let notifications;
  if (agentId) {
    notifications = db.prepare('SELECT * FROM notifications WHERE mentioned_agent_id = ? ORDER BY created_at DESC').all(agentId);
  } else {
    notifications = db.prepare('SELECT * FROM notifications ORDER BY created_at DESC').all();
  }

  output(notifications);
}

function notificationsCreate(args: Args): void {
  const id = uuidv4();
  const { mentionedAgentId, content } = args as {
    mentionedAgentId: string;
    content: string;
  };

  if (!mentionedAgentId) {
    console.error('Error: mentionedAgentId is required');
    process.exit(1);
  }
  if (!content) {
    console.error('Error: content is required');
    process.exit(1);
  }

  db.prepare(
    'INSERT INTO notifications (id, mentioned_agent_id, content) VALUES (?, ?, ?)'
  ).run(id, mentionedAgentId, content);

  const notification = db.prepare('SELECT * FROM notifications WHERE id = ?').get(id);
  output(notification);
}

function notificationsDeliver(args: Args): void {
  const { id } = args as { id: string };

  if (!id) {
    console.error('Error: id is required');
    process.exit(1);
  }

  db.prepare('UPDATE notifications SET delivered = 1 WHERE id = ?').run(id);

  const notification = db.prepare('SELECT * FROM notifications WHERE id = ?').get(id);
  output(notification);
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
  case 'help':
  case '--help':
  case '-h':
    showHelp();
    break;

  case 'setup':
    showSetup();
    break;

  // Agents
  case 'agents:list':
    agentsList();
    break;
  case 'agents:create':
    agentsCreate(args);
    break;
  case 'agents:update':
    agentsUpdate(args);
    break;
  case 'agents:delete':
    agentsDelete(args);
    break;

  // Tasks
  case 'tasks:list':
    tasksList();
    break;
  case 'tasks:create':
    tasksCreate(args);
    break;
  case 'tasks:update':
    tasksUpdate(args);
    break;
  case 'tasks:assign':
    tasksAssign(args);
    break;
  case 'tasks:unassign':
    tasksUnassign(args);
    break;
  case 'tasks:delete':
    tasksDelete(args);
    break;

  // Messages
  case 'messages:list':
    messagesList(args);
    break;
  case 'messages:create':
    messagesCreate(args);
    break;
  case 'messages:attach':
    messagesAttach(args);
    break;

  // Documents
  case 'documents:list':
    documentsList();
    break;
  case 'documents:create':
    documentsCreate(args);
    break;
  case 'documents:delete':
    documentsDelete(args);
    break;

  // Audits
  case 'audits:list':
    auditsList(args);
    break;
  case 'audits:create':
    auditsCreate(args);
    break;

  // Activities
  case 'activities:list':
    activitiesList();
    break;
  case 'activities:create':
    activitiesCreate(args);
    break;

  // Notifications
  case 'notifications:list':
    notificationsList(args);
    break;
  case 'notifications:create':
    notificationsCreate(args);
    break;
  case 'notifications:deliver':
    notificationsDeliver(args);
    break;

  default:
    console.error(`Unknown command: ${command}`);
    console.error('Run "clawboard help" for usage information.');
    process.exit(1);
}

db.close();
