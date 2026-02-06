import { describe, it, expect, beforeEach, afterEach } from "vitest";
import Database from "better-sqlite3";
import { createTestDb } from "@/test/utils";
import { agentsList, agentsCreate, agentsUpdate, agentsDelete } from "./agents";

describe("agents operations", () => {
  let db: Database.Database;

  beforeEach(() => {
    db = createTestDb();
  });

  afterEach(() => {
    db.close();
  });

  describe("agentsList", () => {
    it("returns empty array when no agents exist", () => {
      const result = agentsList(db);
      expect(result).toEqual([]);
    });

    it("returns agents ordered by created_at desc", () => {
      // Insert agents with different created_at timestamps
      db.exec(`
        INSERT INTO agents (id, name, created_at) VALUES
          ('a1', 'First', datetime('now', '-2 minutes')),
          ('a2', 'Second', datetime('now', '-1 minutes')),
          ('a3', 'Third', datetime('now'))
      `);

      const result = agentsList(db);

      expect(result).toHaveLength(3);
      expect(result[0].name).toBe("Third");
      expect(result[1].name).toBe("Second");
      expect(result[2].name).toBe("First");
    });
  });

  describe("agentsCreate", () => {
    it("creates agent with required fields only, defaults status to idle", () => {
      const result = agentsCreate(db, { name: "Test Agent" });

      expect(result.id).toBeDefined();
      expect(result.name).toBe("Test Agent");
      expect(result.status).toBe("idle");
      expect(result.role).toBeNull();
      expect(result.badge).toBeNull();
      expect(result.created_at).toBeDefined();
      expect(result.updated_at).toBeDefined();

      // Verify it was actually inserted
      const agents = agentsList(db);
      expect(agents).toHaveLength(1);
      expect(agents[0].id).toBe(result.id);
    });

    it("creates agent with all fields", () => {
      const result = agentsCreate(db, {
        name: "Full Agent",
        role: "Developer",
        badge: "senior",
        status: "active",
        sessionKey: "sess-123",
      });

      expect(result.name).toBe("Full Agent");
      expect(result.role).toBe("Developer");
      expect(result.badge).toBe("senior");
      expect(result.status).toBe("active");
      expect(result.session_key).toBe("sess-123");
    });

    it("throws on missing name", () => {
      expect(() => agentsCreate(db, {} as any)).toThrow("name is required");
      expect(() => agentsCreate(db, { name: "" })).toThrow("name is required");
    });
  });

  describe("agentsUpdate", () => {
    let agentId: string;

    beforeEach(() => {
      const agent = agentsCreate(db, { name: "Original Name", role: "Original Role" });
      agentId = agent.id;
    });

    it("updates a single field", () => {
      const result = agentsUpdate(db, { id: agentId, name: "Updated Name" });

      expect(result.name).toBe("Updated Name");
      expect(result.role).toBe("Original Role"); // Unchanged
    });

    it("updates multiple fields", () => {
      const result = agentsUpdate(db, {
        id: agentId,
        name: "New Name",
        role: "New Role",
        status: "active",
        badge: "lead",
      });

      expect(result.name).toBe("New Name");
      expect(result.role).toBe("New Role");
      expect(result.status).toBe("active");
      expect(result.badge).toBe("lead");
    });

    it("can set nullable fields to null", () => {
      const result = agentsUpdate(db, {
        id: agentId,
        role: null,
        currentTaskId: null,
      });

      expect(result.role).toBeNull();
      expect(result.current_task_id).toBeNull();
    });

    it("throws on missing id", () => {
      expect(() => agentsUpdate(db, { name: "Test" } as any)).toThrow("id is required");
      expect(() => agentsUpdate(db, { id: "" })).toThrow("id is required");
    });

    it("throws on no fields to update", () => {
      expect(() => agentsUpdate(db, { id: agentId })).toThrow("no fields to update");
    });
  });

  describe("agentsDelete", () => {
    it("deletes existing agent", () => {
      const agent = agentsCreate(db, { name: "To Delete" });

      const result = agentsDelete(db, { id: agent.id });

      expect(result.deleted).toBe(true);
      expect(result.id).toBe(agent.id);

      // Verify it was actually deleted
      const agents = agentsList(db);
      expect(agents).toHaveLength(0);
    });

    it("returns deleted:false for non-existent agent", () => {
      const result = agentsDelete(db, { id: "non-existent-id" });

      expect(result.deleted).toBe(false);
      expect(result.id).toBe("non-existent-id");
    });

    it("throws on missing id", () => {
      expect(() => agentsDelete(db, {} as any)).toThrow("id is required");
      expect(() => agentsDelete(db, { id: "" })).toThrow("id is required");
    });
  });
});
