import { describe, it, expect, beforeEach, afterEach } from "vitest";
import type Database from "better-sqlite3";
import { createTestDb } from "@/test/utils";
import { activitiesList, activitiesCreate, createActivity } from "./activities.ts";

describe("activities operations", () => {
  let db: Database.Database;

  beforeEach(() => {
    db = createTestDb();
  });

  afterEach(() => {
    db.close();
  });

  describe("activitiesList", () => {
    it("returns empty array when no activities exist", () => {
      const activities = activitiesList(db);
      expect(activities).toEqual([]);
    });

    it("returns activities ordered by created_at DESC", () => {
      // Create activities with different timestamps
      db.exec(`
        INSERT INTO activities (id, type, message, created_at)
        VALUES
          ('act-1', 'task_created', 'First activity', '2024-01-01 10:00:00'),
          ('act-2', 'task_updated', 'Second activity', '2024-01-01 12:00:00'),
          ('act-3', 'status_changed', 'Third activity', '2024-01-01 11:00:00')
      `);

      const activities = activitiesList(db);

      expect(activities).toHaveLength(3);
      expect(activities[0].id).toBe("act-2"); // Latest first
      expect(activities[1].id).toBe("act-3");
      expect(activities[2].id).toBe("act-1"); // Oldest last
    });
  });

  describe("activitiesCreate", () => {
    it("creates activity with required fields only", () => {
      const activity = activitiesCreate(db, {
        type: "task_created",
        message: "Created new task",
      });

      expect(activity.id).toBeDefined();
      expect(activity.type).toBe("task_created");
      expect(activity.message).toBe("Created new task");
      expect(activity.agent_id).toBeNull();
      expect(activity.task_id).toBeNull();
      expect(activity.created_at).toBeDefined();
    });

    it("creates activity with optional agentId", () => {
      // First create an agent
      db.exec(`
        INSERT INTO agents (id, name, status)
        VALUES ('agent-1', 'Test Agent', 'active')
      `);

      const activity = activitiesCreate(db, {
        type: "message_sent",
        message: "Sent a message",
        agentId: "agent-1",
      });

      expect(activity.agent_id).toBe("agent-1");
    });

    it("creates activity with optional taskId", () => {
      // First create a task
      db.exec(`
        INSERT INTO tasks (id, title, status)
        VALUES ('task-1', 'Test Task', 'backlog')
      `);

      const activity = activitiesCreate(db, {
        type: "task_updated",
        message: "Updated task",
        taskId: "task-1",
      });

      expect(activity.task_id).toBe("task-1");
    });

    it("creates activity with all optional fields", () => {
      // Create agent and task
      db.exec(`
        INSERT INTO agents (id, name, status)
        VALUES ('agent-1', 'Test Agent', 'active')
      `);
      db.exec(`
        INSERT INTO tasks (id, title, status)
        VALUES ('task-1', 'Test Task', 'backlog')
      `);

      const activity = activitiesCreate(db, {
        type: "document_created",
        message: "Created document for task",
        agentId: "agent-1",
        taskId: "task-1",
      });

      expect(activity.type).toBe("document_created");
      expect(activity.message).toBe("Created document for task");
      expect(activity.agent_id).toBe("agent-1");
      expect(activity.task_id).toBe("task-1");
    });

    it("throws error when type is missing", () => {
      expect(() =>
        activitiesCreate(db, {
          type: undefined as unknown as "task_created",
          message: "Some message",
        })
      ).toThrow("type is required");
    });

    it("throws error when message is missing", () => {
      expect(() =>
        activitiesCreate(db, {
          type: "task_created",
          message: undefined as unknown as string,
        })
      ).toThrow("message is required");
    });

    it("throws error when message is empty string", () => {
      expect(() =>
        activitiesCreate(db, {
          type: "task_created",
          message: "",
        })
      ).toThrow("message is required");
    });
  });

  describe("createActivity", () => {
    it("creates activity without returning it", () => {
      // Verify no activities exist
      expect(activitiesList(db)).toHaveLength(0);

      // Create activity using helper
      createActivity(db, "task_created", "A new task was created");

      // Verify activity was created by listing
      const activities = activitiesList(db);
      expect(activities).toHaveLength(1);
      expect(activities[0].type).toBe("task_created");
      expect(activities[0].message).toBe("A new task was created");
    });

    it("creates activity with agentId", () => {
      db.exec(`
        INSERT INTO agents (id, name, status)
        VALUES ('agent-1', 'Test Agent', 'active')
      `);

      createActivity(db, "audit_completed", "Audit completed", "agent-1");

      const activities = activitiesList(db);
      expect(activities).toHaveLength(1);
      expect(activities[0].agent_id).toBe("agent-1");
    });

    it("creates activity with taskId", () => {
      db.exec(`
        INSERT INTO tasks (id, title, status)
        VALUES ('task-1', 'Test Task', 'backlog')
      `);

      createActivity(db, "status_changed", "Status changed to in_progress", undefined, "task-1");

      const activities = activitiesList(db);
      expect(activities).toHaveLength(1);
      expect(activities[0].task_id).toBe("task-1");
    });

    it("creates activity with both agentId and taskId", () => {
      db.exec(`
        INSERT INTO agents (id, name, status)
        VALUES ('agent-1', 'Test Agent', 'active')
      `);
      db.exec(`
        INSERT INTO tasks (id, title, status)
        VALUES ('task-1', 'Test Task', 'backlog')
      `);

      createActivity(db, "message_sent", "Agent sent message", "agent-1", "task-1");

      const activities = activitiesList(db);
      expect(activities).toHaveLength(1);
      expect(activities[0].agent_id).toBe("agent-1");
      expect(activities[0].task_id).toBe("task-1");
    });
  });
});
