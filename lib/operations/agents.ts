import Database from "better-sqlite3";
import { v4 as uuidv4 } from "uuid";
import type { Agent, CreateAgentInput, UpdateAgentInput } from "../types";

/**
 * List all agents ordered by created_at descending
 */
export function agentsList(db: Database.Database): Agent[] {
  const stmt = db.prepare(`
    SELECT id, name, role, badge, avatar, status, current_task_id, session_key, created_at, updated_at
    FROM agents
    ORDER BY created_at DESC
  `);
  return stmt.all() as Agent[];
}

/**
 * Create a new agent
 * @throws {Error} "name is required" if name is missing or empty
 */
export function agentsCreate(
  db: Database.Database,
  input: CreateAgentInput
): Agent {
  if (!input.name || input.name.trim() === "") {
    throw new Error("name is required");
  }

  const id = uuidv4();
  const status = input.status ?? "idle";

  const stmt = db.prepare(`
    INSERT INTO agents (id, name, role, badge, status, session_key)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    input.name,
    input.role ?? null,
    input.badge ?? null,
    status,
    input.sessionKey ?? null
  );

  // Return the created agent
  const selectStmt = db.prepare(`
    SELECT id, name, role, badge, avatar, status, current_task_id, session_key, created_at, updated_at
    FROM agents
    WHERE id = ?
  `);
  return selectStmt.get(id) as Agent;
}

/**
 * Update an existing agent
 * @throws {Error} "id is required" if id is missing or empty
 * @throws {Error} "no fields to update" if only id is provided
 */
export function agentsUpdate(
  db: Database.Database,
  input: UpdateAgentInput
): Agent {
  if (!input.id || input.id.trim() === "") {
    throw new Error("id is required");
  }

  // Build dynamic update query
  const updates: string[] = [];
  const values: unknown[] = [];

  if (input.name !== undefined) {
    updates.push("name = ?");
    values.push(input.name);
  }
  if (input.role !== undefined) {
    updates.push("role = ?");
    values.push(input.role);
  }
  if (input.badge !== undefined) {
    updates.push("badge = ?");
    values.push(input.badge);
  }
  if (input.status !== undefined) {
    updates.push("status = ?");
    values.push(input.status);
  }
  if (input.currentTaskId !== undefined) {
    updates.push("current_task_id = ?");
    values.push(input.currentTaskId);
  }
  if (input.sessionKey !== undefined) {
    updates.push("session_key = ?");
    values.push(input.sessionKey);
  }

  if (updates.length === 0) {
    throw new Error("no fields to update");
  }

  // Always update updated_at
  updates.push("updated_at = datetime('now')");
  values.push(input.id);

  const stmt = db.prepare(`
    UPDATE agents
    SET ${updates.join(", ")}
    WHERE id = ?
  `);

  stmt.run(...values);

  // Return the updated agent
  const selectStmt = db.prepare(`
    SELECT id, name, role, badge, avatar, status, current_task_id, session_key, created_at, updated_at
    FROM agents
    WHERE id = ?
  `);
  return selectStmt.get(input.id) as Agent;
}

/**
 * Delete an agent
 * @throws {Error} "id is required" if id is missing or empty
 * @returns {deleted: boolean, id: string}
 */
export function agentsDelete(
  db: Database.Database,
  input: { id: string }
): { deleted: boolean; id: string } {
  if (!input.id || input.id.trim() === "") {
    throw new Error("id is required");
  }

  const stmt = db.prepare("DELETE FROM agents WHERE id = ?");
  const result = stmt.run(input.id);

  return {
    deleted: result.changes > 0,
    id: input.id,
  };
}
