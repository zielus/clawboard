import { describe, it, expect, beforeEach, afterEach } from "vitest";
import type Database from "better-sqlite3";
import { createTestDb } from "@/test/utils";
import { auditsList, auditsCreate } from "./audits";
import { tasksCreate } from "./tasks";
import { activitiesList } from "./activities";

describe("audits operations", () => {
  let db: Database.Database;

  beforeEach(() => {
    db = createTestDb();
  });

  afterEach(() => {
    db.close();
  });

  describe("auditsList", () => {
    it("returns empty array when no audits exist", () => {
      const result = auditsList(db, {});
      expect(result).toEqual([]);
    });

    it("returns all audits when no taskId filter provided", () => {
      // Create two tasks
      const task1 = tasksCreate(db, { title: "Task 1" });
      const task2 = tasksCreate(db, { title: "Task 2" });

      // Create audits for both tasks
      auditsCreate(db, { taskId: task1.id, threatLevel: "safe" });
      auditsCreate(db, { taskId: task2.id, threatLevel: "warning" });

      const result = auditsList(db, {});

      expect(result).toHaveLength(2);
    });

    it("filters audits by taskId when provided", () => {
      // Create two tasks
      const task1 = tasksCreate(db, { title: "Task 1" });
      const task2 = tasksCreate(db, { title: "Task 2" });

      // Create audits for both tasks
      auditsCreate(db, { taskId: task1.id, threatLevel: "safe" });
      auditsCreate(db, { taskId: task1.id, threatLevel: "warning" });
      auditsCreate(db, { taskId: task2.id, threatLevel: "critical" });

      const result = auditsList(db, { taskId: task1.id });

      expect(result).toHaveLength(2);
      expect(result.every((a) => a.task_id === task1.id)).toBe(true);
    });
  });

  describe("auditsCreate", () => {
    it("creates audit with required fields and defaults to safe threat level", () => {
      const task = tasksCreate(db, { title: "Test Task" });

      const result = auditsCreate(db, { taskId: task.id });

      expect(result.id).toBeDefined();
      expect(result.task_id).toBe(task.id);
      expect(result.threat_level).toBe("safe");
      expect(result.content).toBeNull();
      expect(result.created_at).toBeDefined();

      // Verify it was actually inserted
      const audits = auditsList(db, {});
      expect(audits).toHaveLength(1);
      expect(audits[0].id).toBe(result.id);
    });

    it("creates audit with all fields", () => {
      const task = tasksCreate(db, { title: "Test Task" });

      const result = auditsCreate(db, {
        taskId: task.id,
        threatLevel: "critical",
        content: "Security vulnerability found",
      });

      expect(result.task_id).toBe(task.id);
      expect(result.threat_level).toBe("critical");
      expect(result.content).toBe("Security vulnerability found");
    });

    it("creates audit_completed activity when creating audit", () => {
      const task = tasksCreate(db, { title: "Test Task" });

      // Clear activities created by tasksCreate
      db.exec("DELETE FROM activities");

      const result = auditsCreate(db, {
        taskId: task.id,
        threatLevel: "warning",
      });

      const activities = activitiesList(db);
      expect(activities).toHaveLength(1);
      expect(activities[0].type).toBe("audit_completed");
      expect(activities[0].task_id).toBe(task.id);
      expect(activities[0].message).toContain("warning");
    });

    it("throws error when taskId is missing", () => {
      expect(() => auditsCreate(db, {} as any)).toThrow("taskId is required");
      expect(() => auditsCreate(db, { taskId: "" })).toThrow(
        "taskId is required"
      );
    });
  });
});
