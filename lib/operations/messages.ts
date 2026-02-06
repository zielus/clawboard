import type Database from "better-sqlite3";
import { v4 as uuidv4 } from "uuid";
import type {
  Message,
  CreateMessageInput,
  AttachToMessageInput,
} from "../types";
import type { Document } from "../types";
import { createActivity } from "./activities";

/**
 * Message with populated attachments
 */
export interface MessageWithAttachments extends Message {
  attachments: Document[];
}

/**
 * Input for filtering messages list
 */
export interface ListMessagesInput {
  taskId?: string;
}

/**
 * Internal helper to get a message with its attachments
 */
function getMessageWithAttachments(
  db: Database.Database,
  messageId: string
): MessageWithAttachments | null {
  const msgStmt = db.prepare(`
    SELECT id, task_id, from_agent_id, content, created_at
    FROM messages
    WHERE id = ?
  `);
  const message = msgStmt.get(messageId) as Message | undefined;

  if (!message) {
    return null;
  }

  const attachmentsStmt = db.prepare(`
    SELECT d.id, d.title, d.content, d.type, d.task_id, d.agent_id, d.created_at, d.updated_at
    FROM documents d
    INNER JOIN message_attachments ma ON ma.document_id = d.id
    WHERE ma.message_id = ?
  `);
  const attachments = attachmentsStmt.all(messageId) as Document[];

  return {
    ...message,
    attachments,
  };
}

/**
 * List messages with their attachments, optionally filtered by taskId
 * Returns messages ordered by created_at descending (newest first)
 */
export function messagesList(
  db: Database.Database,
  input: ListMessagesInput
): MessageWithAttachments[] {
  let query = `
    SELECT id, task_id, from_agent_id, content, created_at
    FROM messages
  `;
  const params: unknown[] = [];

  if (input.taskId) {
    query += " WHERE task_id = ?";
    params.push(input.taskId);
  }

  query += " ORDER BY created_at DESC";

  const messagesStmt = db.prepare(query);
  const messages = (
    params.length > 0 ? messagesStmt.all(...params) : messagesStmt.all()
  ) as Message[];

  if (messages.length === 0) {
    return [];
  }

  // Get all message-document attachments in one query
  const messageIds = messages.map((m) => m.id);
  const placeholders = messageIds.map(() => "?").join(",");
  const attachmentsStmt = db.prepare(`
    SELECT ma.message_id, d.id, d.title, d.content, d.type, d.task_id, d.agent_id, d.created_at, d.updated_at
    FROM message_attachments ma
    INNER JOIN documents d ON d.id = ma.document_id
    WHERE ma.message_id IN (${placeholders})
  `);
  const attachments = attachmentsStmt.all(...messageIds) as (Document & {
    message_id: string;
  })[];

  // Group attachments by message_id
  const attachmentsByMessageId = new Map<string, Document[]>();
  for (const attachment of attachments) {
    const { message_id, ...doc } = attachment;
    if (!attachmentsByMessageId.has(message_id)) {
      attachmentsByMessageId.set(message_id, []);
    }
    attachmentsByMessageId.get(message_id)!.push(doc as Document);
  }

  // Combine messages with their attachments
  return messages.map((message) => ({
    ...message,
    attachments: attachmentsByMessageId.get(message.id) ?? [],
  }));
}

/**
 * Create a new message with optional attachments
 * Also creates a "message_sent" activity
 * @throws {Error} "taskId is required" if taskId is missing or empty
 * @throws {Error} "content is required" if content is missing or empty
 */
export function messagesCreate(
  db: Database.Database,
  input: CreateMessageInput
): MessageWithAttachments {
  if (!input.taskId || input.taskId.trim() === "") {
    throw new Error("taskId is required");
  }
  if (!input.content || input.content.trim() === "") {
    throw new Error("content is required");
  }

  const id = uuidv4();
  const stmt = db.prepare(`
    INSERT INTO messages (id, task_id, from_agent_id, content)
    VALUES (?, ?, ?, ?)
  `);

  stmt.run(id, input.taskId, input.fromAgentId ?? null, input.content);

  // Attach documents if provided
  if (input.attachmentIds && input.attachmentIds.length > 0) {
    const attachStmt = db.prepare(`
      INSERT OR IGNORE INTO message_attachments (message_id, document_id)
      VALUES (?, ?)
    `);
    for (const docId of input.attachmentIds) {
      attachStmt.run(id, docId);
    }
  }

  // Create message_sent activity
  createActivity(
    db,
    "message_sent",
    "Message sent",
    input.fromAgentId,
    input.taskId
  );

  return getMessageWithAttachments(db, id)!;
}

/**
 * Attach documents to an existing message
 * Uses INSERT OR IGNORE to handle duplicate attachments gracefully
 * @throws {Error} "id is required" if id is missing or empty
 * @throws {Error} "documentIds is required" if documentIds is missing or empty
 */
export function messagesAttach(
  db: Database.Database,
  input: AttachToMessageInput
): MessageWithAttachments {
  if (!input.id || input.id.trim() === "") {
    throw new Error("id is required");
  }
  if (!input.documentIds || input.documentIds.length === 0) {
    throw new Error("documentIds is required");
  }

  const stmt = db.prepare(`
    INSERT OR IGNORE INTO message_attachments (message_id, document_id)
    VALUES (?, ?)
  `);

  for (const docId of input.documentIds) {
    stmt.run(input.id, docId);
  }

  return getMessageWithAttachments(db, input.id)!;
}
