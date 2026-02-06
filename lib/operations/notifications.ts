import type Database from "better-sqlite3";
import { v4 as uuidv4 } from "uuid";
import type { CreateNotificationInput } from "../types";

/**
 * Raw notification type as stored in database (delivered is 0/1 integer)
 */
export interface Notification {
  id: string;
  mentioned_agent_id: string;
  content: string;
  delivered: number;
  created_at: string;
}

/**
 * Input for filtering notifications list
 */
export interface ListNotificationsInput {
  agentId?: string;
}

/**
 * Input for marking notification as delivered
 */
export interface DeliverNotificationInput {
  id: string;
}

/**
 * List notifications, optionally filtered by agentId
 */
export function notificationsList(
  db: Database.Database,
  input?: ListNotificationsInput
): Notification[] {
  if (input?.agentId) {
    const stmt = db.prepare(`
      SELECT id, mentioned_agent_id, content, delivered, created_at
      FROM notifications
      WHERE mentioned_agent_id = ?
      ORDER BY created_at DESC
    `);
    return stmt.all(input.agentId) as Notification[];
  }

  const stmt = db.prepare(`
    SELECT id, mentioned_agent_id, content, delivered, created_at
    FROM notifications
    ORDER BY created_at DESC
  `);
  return stmt.all() as Notification[];
}

/**
 * Create a new notification
 * @throws {Error} "mentionedAgentId is required" if mentionedAgentId is missing or empty
 * @throws {Error} "content is required" if content is missing or empty
 */
export function notificationsCreate(
  db: Database.Database,
  input: CreateNotificationInput
): Notification {
  if (!input.mentionedAgentId || input.mentionedAgentId.trim() === "") {
    throw new Error("mentionedAgentId is required");
  }
  if (!input.content || input.content.trim() === "") {
    throw new Error("content is required");
  }

  const id = uuidv4();

  const stmt = db.prepare(`
    INSERT INTO notifications (id, mentioned_agent_id, content, delivered)
    VALUES (?, ?, ?, 0)
  `);

  stmt.run(id, input.mentionedAgentId, input.content);

  // Return the created notification
  const selectStmt = db.prepare(`
    SELECT id, mentioned_agent_id, content, delivered, created_at
    FROM notifications
    WHERE id = ?
  `);
  return selectStmt.get(id) as Notification;
}

/**
 * Mark a notification as delivered (sets delivered=1)
 * @throws {Error} "id is required" if id is missing or empty
 */
export function notificationsDeliver(
  db: Database.Database,
  input: DeliverNotificationInput
): Notification {
  if (!input.id || input.id.trim() === "") {
    throw new Error("id is required");
  }

  const stmt = db.prepare(`
    UPDATE notifications
    SET delivered = 1
    WHERE id = ?
  `);

  stmt.run(input.id);

  // Return the updated notification
  const selectStmt = db.prepare(`
    SELECT id, mentioned_agent_id, content, delivered, created_at
    FROM notifications
    WHERE id = ?
  `);
  return selectStmt.get(input.id) as Notification;
}
