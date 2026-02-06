import type Database from "better-sqlite3";
import { v4 as uuidv4 } from "uuid";
import type { Activity, ActivityType, CreateActivityInput } from "../types.ts";

/**
 * List all activities ordered by created_at descending (newest first)
 */
export function activitiesList(db: Database.Database): Activity[] {
  const stmt = db.prepare(`
    SELECT id, type, agent_id, task_id, message, created_at
    FROM activities
    ORDER BY created_at DESC
  `);
  return stmt.all() as Activity[];
}

/**
 * Create a new activity and return it
 */
export function activitiesCreate(
  db: Database.Database,
  input: CreateActivityInput
): Activity {
  // Validate required fields
  if (!input.type) {
    throw new Error("type is required");
  }
  if (!input.message) {
    throw new Error("message is required");
  }

  const id = uuidv4();
  const stmt = db.prepare(`
    INSERT INTO activities (id, type, agent_id, task_id, message)
    VALUES (?, ?, ?, ?, ?)
  `);

  stmt.run(id, input.type, input.agentId ?? null, input.taskId ?? null, input.message);

  // Fetch and return the created activity
  const selectStmt = db.prepare(`
    SELECT id, type, agent_id, task_id, message, created_at
    FROM activities
    WHERE id = ?
  `);
  return selectStmt.get(id) as Activity;
}

/**
 * Internal helper to create an activity without returning it.
 * Used by other operations modules to log activities.
 */
export function createActivity(
  db: Database.Database,
  type: ActivityType,
  message: string,
  agentId?: string,
  taskId?: string
): void {
  const id = uuidv4();
  const stmt = db.prepare(`
    INSERT INTO activities (id, type, agent_id, task_id, message)
    VALUES (?, ?, ?, ?, ?)
  `);
  stmt.run(id, type, agentId ?? null, taskId ?? null, message);
}
