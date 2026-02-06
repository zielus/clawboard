import { describe, it, expect, beforeEach, afterEach } from "vitest";
import type Database from "better-sqlite3";
import { createTestDb } from "@/test/utils";
import { documentsList, documentsCreate, documentsDelete } from "./documents";
import { activitiesList } from "./activities";

describe("documents operations", () => {
  let db: Database.Database;

  beforeEach(() => {
    db = createTestDb();
  });

  afterEach(() => {
    db.close();
  });

  describe("documentsList", () => {
    it("returns empty array when no documents exist", () => {
      const result = documentsList(db);
      expect(result).toEqual([]);
    });

    it("returns documents ordered by created_at DESC", () => {
      // Insert documents with different timestamps
      db.exec(`
        INSERT INTO documents (id, title, created_at) VALUES
          ('doc-1', 'First Doc', '2024-01-01 10:00:00'),
          ('doc-2', 'Second Doc', '2024-01-01 12:00:00'),
          ('doc-3', 'Third Doc', '2024-01-01 11:00:00')
      `);

      const result = documentsList(db);

      expect(result).toHaveLength(3);
      expect(result[0].id).toBe("doc-2"); // Latest first
      expect(result[1].id).toBe("doc-3");
      expect(result[2].id).toBe("doc-1"); // Oldest last
    });
  });

  describe("documentsCreate", () => {
    it("creates document with required fields only", () => {
      const result = documentsCreate(db, { title: "Test Document" });

      expect(result.id).toBeDefined();
      expect(result.title).toBe("Test Document");
      expect(result.content).toBeNull();
      expect(result.type).toBeNull();
      expect(result.task_id).toBeNull();
      expect(result.agent_id).toBeNull();
      expect(result.created_at).toBeDefined();
      expect(result.updated_at).toBeDefined();

      // Verify it was actually inserted
      const documents = documentsList(db);
      expect(documents).toHaveLength(1);
      expect(documents[0].id).toBe(result.id);
    });

    it("creates document with all optional fields", () => {
      // Create agent and task for foreign keys
      db.exec(`
        INSERT INTO agents (id, name, status)
        VALUES ('agent-1', 'Test Agent', 'active')
      `);
      db.exec(`
        INSERT INTO tasks (id, title, status)
        VALUES ('task-1', 'Test Task', 'backlog')
      `);

      const result = documentsCreate(db, {
        title: "Full Document",
        content: "Document content here",
        type: "deliverable",
        taskId: "task-1",
        agentId: "agent-1",
      });

      expect(result.title).toBe("Full Document");
      expect(result.content).toBe("Document content here");
      expect(result.type).toBe("deliverable");
      expect(result.task_id).toBe("task-1");
      expect(result.agent_id).toBe("agent-1");
    });

    it("creates document_created activity when creating document", () => {
      // Create agent and task
      db.exec(`
        INSERT INTO agents (id, name, status)
        VALUES ('agent-1', 'Test Agent', 'active')
      `);
      db.exec(`
        INSERT INTO tasks (id, title, status)
        VALUES ('task-1', 'Test Task', 'backlog')
      `);

      const result = documentsCreate(db, {
        title: "Doc with Activity",
        agentId: "agent-1",
        taskId: "task-1",
      });

      const activities = activitiesList(db);
      expect(activities).toHaveLength(1);
      expect(activities[0].type).toBe("document_created");
      expect(activities[0].agent_id).toBe("agent-1");
      expect(activities[0].task_id).toBe("task-1");
      expect(activities[0].message).toContain("Doc with Activity");
    });

    it("creates document_created activity without agent or task", () => {
      const result = documentsCreate(db, {
        title: "Standalone Doc",
      });

      const activities = activitiesList(db);
      expect(activities).toHaveLength(1);
      expect(activities[0].type).toBe("document_created");
      expect(activities[0].agent_id).toBeNull();
      expect(activities[0].task_id).toBeNull();
    });

    it("throws error when title is missing", () => {
      expect(() => documentsCreate(db, {} as any)).toThrow("title is required");
      expect(() => documentsCreate(db, { title: "" })).toThrow(
        "title is required"
      );
    });
  });

  describe("documentsDelete", () => {
    it("deletes existing document", () => {
      const doc = documentsCreate(db, { title: "To Delete" });

      const result = documentsDelete(db, { id: doc.id });

      expect(result.deleted).toBe(true);
      expect(result.id).toBe(doc.id);

      // Verify it was actually deleted
      const documents = documentsList(db);
      expect(documents).toHaveLength(0);
    });

    it("returns deleted:false for non-existent document", () => {
      const result = documentsDelete(db, { id: "non-existent-id" });

      expect(result.deleted).toBe(false);
      expect(result.id).toBe("non-existent-id");
    });

    it("throws error when id is missing", () => {
      expect(() => documentsDelete(db, {} as any)).toThrow("id is required");
      expect(() => documentsDelete(db, { id: "" })).toThrow("id is required");
    });
  });
});
