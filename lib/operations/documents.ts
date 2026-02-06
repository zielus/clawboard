import type Database from "better-sqlite3";
import { v4 as uuidv4 } from "uuid";
import type { Document, CreateDocumentInput } from "../types";
import { createActivity } from "./activities";

/**
 * List all documents ordered by created_at descending (newest first)
 */
export function documentsList(db: Database.Database): Document[] {
  const stmt = db.prepare(`
    SELECT id, title, content, type, task_id, agent_id, created_at, updated_at
    FROM documents
    ORDER BY created_at DESC
  `);
  return stmt.all() as Document[];
}

/**
 * Create a new document and return it
 * Also creates a "document_created" activity
 * @throws {Error} "title is required" if title is missing or empty
 */
export function documentsCreate(
  db: Database.Database,
  input: CreateDocumentInput
): Document {
  if (!input.title || input.title.trim() === "") {
    throw new Error("title is required");
  }

  const id = uuidv4();
  const stmt = db.prepare(`
    INSERT INTO documents (id, title, content, type, task_id, agent_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    input.title,
    input.content ?? null,
    input.type ?? null,
    input.taskId ?? null,
    input.agentId ?? null
  );

  // Create activity for document creation
  createActivity(
    db,
    "document_created",
    `Document created: ${input.title}`,
    input.agentId,
    input.taskId
  );

  // Fetch and return the created document
  const selectStmt = db.prepare(`
    SELECT id, title, content, type, task_id, agent_id, created_at, updated_at
    FROM documents
    WHERE id = ?
  `);
  return selectStmt.get(id) as Document;
}

/**
 * Delete a document
 * @throws {Error} "id is required" if id is missing or empty
 * @returns {deleted: boolean, id: string}
 */
export function documentsDelete(
  db: Database.Database,
  input: { id: string }
): { deleted: boolean; id: string } {
  if (!input.id || input.id.trim() === "") {
    throw new Error("id is required");
  }

  const stmt = db.prepare("DELETE FROM documents WHERE id = ?");
  const result = stmt.run(input.id);

  return {
    deleted: result.changes > 0,
    id: input.id,
  };
}
