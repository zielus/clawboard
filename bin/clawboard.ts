// Clawboard CLI - CRUD operations for all entities
// Usage: clawboard entity:action [json-arg]

import Database from "better-sqlite3";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

import * as ops from "../lib/operations/index.js";
import type {
  CreateAgentInput,
  UpdateAgentInput,
  CreateTaskInput,
  UpdateTaskInput,
  AssignTaskInput,
  CreateMessageInput,
  AttachToMessageInput,
  CreateDocumentInput,
  CreateAuditInput,
  CreateActivityInput,
  CreateNotificationInput,
} from "../lib/types.js";

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
    handleError(() => ops.agentsCreate(db, args as CreateAgentInput));
    break;
  case "agents:update":
    handleError(() => ops.agentsUpdate(db, args as UpdateAgentInput));
    break;
  case "agents:delete":
    handleError(() => ops.agentsDelete(db, args as { id: string }));
    break;

  // Tasks
  case "tasks:list":
    output(ops.tasksList(db));
    break;
  case "tasks:create":
    handleError(() => ops.tasksCreate(db, args as CreateTaskInput));
    break;
  case "tasks:update":
    handleError(() => ops.tasksUpdate(db, args as UpdateTaskInput));
    break;
  case "tasks:assign":
    handleError(() => ops.tasksAssign(db, args as AssignTaskInput));
    break;
  case "tasks:unassign":
    handleError(() => ops.tasksUnassign(db, args as AssignTaskInput));
    break;
  case "tasks:delete":
    handleError(() => ops.tasksDelete(db, args as { id: string }));
    break;

  // Messages
  case "messages:list":
    output(ops.messagesList(db, args as { taskId?: string }));
    break;
  case "messages:create":
    handleError(() => ops.messagesCreate(db, args as CreateMessageInput));
    break;
  case "messages:attach":
    handleError(() => ops.messagesAttach(db, args as AttachToMessageInput));
    break;

  // Documents
  case "documents:list":
    output(ops.documentsList(db));
    break;
  case "documents:create":
    handleError(() => ops.documentsCreate(db, args as CreateDocumentInput));
    break;
  case "documents:delete":
    handleError(() => ops.documentsDelete(db, args as { id: string }));
    break;

  // Audits
  case "audits:list":
    output(ops.auditsList(db, args as { taskId?: string }));
    break;
  case "audits:create":
    handleError(() => ops.auditsCreate(db, args as CreateAuditInput));
    break;

  // Activities
  case "activities:list":
    output(ops.activitiesList(db));
    break;
  case "activities:create":
    handleError(() => ops.activitiesCreate(db, args as CreateActivityInput));
    break;

  // Notifications
  case "notifications:list":
    output(ops.notificationsList(db, args as { agentId?: string }));
    break;
  case "notifications:create":
    handleError(() => ops.notificationsCreate(db, args as CreateNotificationInput));
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
