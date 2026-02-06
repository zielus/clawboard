import type Database from "better-sqlite3";
import { v4 as uuidv4 } from "uuid";
import type { Audit, CreateAuditInput } from "../types";
import { createActivity } from "./activities";

/**
 * List audits, optionally filtered by taskId
 */
export function auditsList(db: Database.Database, input: { taskId?: string }): Audit[] {
  if (input.taskId) {
    const stmt = db.prepare(`
      SELECT id, task_id, threat_level, content, created_at
      FROM audits
      WHERE task_id = ?
      ORDER BY created_at DESC
    `);
    return stmt.all(input.taskId) as Audit[];
  }

  const stmt = db.prepare(`
    SELECT id, task_id, threat_level, content, created_at
    FROM audits
    ORDER BY created_at DESC
  `);
  return stmt.all() as Audit[];
}

/**
 * Create a new audit and return it
 * Also creates an "audit_completed" activity with the threatLevel in the message
 * @throws {Error} "taskId is required" if taskId is missing or empty
 */
export function auditsCreate(db: Database.Database, input: CreateAuditInput): Audit {
  if (!input.taskId || input.taskId.trim() === "") {
    throw new Error("taskId is required");
  }

  const id = uuidv4();
  const threatLevel = input.threatLevel ?? "safe";

  const stmt = db.prepare(`
    INSERT INTO audits (id, task_id, threat_level, content)
    VALUES (?, ?, ?, ?)
  `);

  stmt.run(id, input.taskId, threatLevel, input.content ?? null);

  // Create audit_completed activity
  createActivity(
    db,
    "audit_completed",
    `Audit completed with threat level: ${threatLevel}`,
    undefined,
    input.taskId
  );

  // Fetch and return the created audit
  const selectStmt = db.prepare(`
    SELECT id, task_id, threat_level, content, created_at
    FROM audits
    WHERE id = ?
  `);
  return selectStmt.get(id) as Audit;
}
