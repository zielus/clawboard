import { describe, it, expect, beforeEach, afterEach } from "vitest";
import type Database from "better-sqlite3";
import { createTestDb } from "@/test/utils";
import { agentsCreate } from "./agents";
import { activitiesList } from "./activities";
import {
  tasksList,
  tasksCreate,
  tasksUpdate,
  tasksAssign,
  tasksUnassign,
  tasksDelete,
} from "./tasks";
import type { CreateTaskInput, UpdateTaskInput, AssignTaskInput } from "@/lib/types";

describe("tasks operations", () => {
  let db: Database.Database;

  beforeEach(() => {
    db = createTestDb();
  });

  afterEach(() => {
    db.close();
  });

  describe("tasksList", () => {
    it("returns empty array when no tasks exist", () => {
      const tasks = tasksList(db);
      expect(tasks).toEqual([]);
    });

    it("returns tasks with empty assignees array", () => {
      db.exec(`
        INSERT INTO tasks (id, title, status, created_at)
        VALUES ('task-1', 'Test Task', 'backlog', datetime('now'))
      `);

      const tasks = tasksList(db);

      expect(tasks).toHaveLength(1);
      expect(tasks[0].id).toBe("task-1");
      expect(tasks[0].title).toBe("Test Task");
      expect(tasks[0].assignees).toEqual([]);
    });

    it("returns tasks with populated assignees", () => {
      // Create agents
      db.exec(`
        INSERT INTO agents (id, name, status)
        VALUES
          ('agent-1', 'Agent One', 'active'),
          ('agent-2', 'Agent Two', 'idle')
      `);

      // Create task
      db.exec(`
        INSERT INTO tasks (id, title, status, created_at)
        VALUES ('task-1', 'Test Task', 'in_progress', datetime('now'))
      `);

      // Assign agents to task
      db.exec(`
        INSERT INTO task_assignees (task_id, agent_id)
        VALUES
          ('task-1', 'agent-1'),
          ('task-1', 'agent-2')
      `);

      const tasks = tasksList(db);

      expect(tasks).toHaveLength(1);
      expect(tasks[0].assignees).toHaveLength(2);
      expect(tasks[0].assignees.map((a) => a.id).sort()).toEqual(["agent-1", "agent-2"]);
    });

    it("returns tasks ordered by created_at DESC", () => {
      db.exec(`
        INSERT INTO tasks (id, title, status, created_at)
        VALUES
          ('task-1', 'First Task', 'backlog', datetime('now', '-2 minutes')),
          ('task-2', 'Second Task', 'backlog', datetime('now', '-1 minutes')),
          ('task-3', 'Third Task', 'backlog', datetime('now'))
      `);

      const tasks = tasksList(db);

      expect(tasks).toHaveLength(3);
      expect(tasks[0].id).toBe("task-3"); // Newest first
      expect(tasks[1].id).toBe("task-2");
      expect(tasks[2].id).toBe("task-1"); // Oldest last
    });
  });

  describe("tasksCreate", () => {
    it("creates task with required fields only, defaults status to backlog", () => {
      const task = tasksCreate(db, { title: "New Task" });

      expect(task.id).toBeDefined();
      expect(task.title).toBe("New Task");
      expect(task.status).toBe("backlog");
      expect(task.description).toBeNull();
      expect(task.created_at).toBeDefined();
      expect(task.updated_at).toBeDefined();
      expect(task.assignees).toEqual([]);

      // Verify it was actually inserted
      const tasks = tasksList(db);
      expect(tasks).toHaveLength(1);
      expect(tasks[0].id).toBe(task.id);
    });

    it("creates task with all fields including assignees", () => {
      // Create agents first
      const agent1 = agentsCreate(db, { name: "Agent One" });
      const agent2 = agentsCreate(db, { name: "Agent Two" });

      const task = tasksCreate(db, {
        title: "Full Task",
        description: "A detailed description",
        status: "in_progress",
        assigneeIds: [agent1.id, agent2.id],
      });

      expect(task.title).toBe("Full Task");
      expect(task.description).toBe("A detailed description");
      expect(task.status).toBe("in_progress");
      expect(task.assignees).toHaveLength(2);
      expect(task.assignees.map((a) => a.id).sort()).toEqual([agent1.id, agent2.id].sort());
    });

    it("creates task_created activity", () => {
      const task = tasksCreate(db, { title: "Task with Activity" });

      const activities = activitiesList(db);

      expect(activities).toHaveLength(1);
      expect(activities[0].type).toBe("task_created");
      expect(activities[0].task_id).toBe(task.id);
      expect(activities[0].message).toContain("Task with Activity");
    });

    it("throws on missing title", () => {
      expect(() => tasksCreate(db, {} as CreateTaskInput)).toThrow("title is required");
      expect(() => tasksCreate(db, { title: "" })).toThrow("title is required");
    });
  });

  describe("tasksUpdate", () => {
    let taskId: string;

    beforeEach(() => {
      const task = tasksCreate(db, {
        title: "Original Title",
        description: "Original Description",
        status: "backlog",
      });
      taskId = task.id;
      // Clear activities from task creation
      db.exec("DELETE FROM activities");
    });

    it("updates task fields", () => {
      const updated = tasksUpdate(db, {
        id: taskId,
        title: "Updated Title",
        description: "Updated Description",
      });

      expect(updated.title).toBe("Updated Title");
      expect(updated.description).toBe("Updated Description");
      expect(updated.status).toBe("backlog"); // Unchanged
    });

    it("creates status_changed activity on status change", () => {
      tasksUpdate(db, {
        id: taskId,
        status: "in_progress",
      });

      const activities = activitiesList(db);

      expect(activities).toHaveLength(1);
      expect(activities[0].type).toBe("status_changed");
      expect(activities[0].task_id).toBe(taskId);
    });

    it("creates task_updated activity on other changes", () => {
      tasksUpdate(db, {
        id: taskId,
        title: "New Title",
      });

      const activities = activitiesList(db);

      expect(activities).toHaveLength(1);
      expect(activities[0].type).toBe("task_updated");
      expect(activities[0].task_id).toBe(taskId);
    });

    it("throws on missing id", () => {
      expect(() => tasksUpdate(db, { title: "Test" } as UpdateTaskInput)).toThrow("id is required");
      expect(() => tasksUpdate(db, { id: "" })).toThrow("id is required");
    });
  });

  describe("tasksAssign", () => {
    let taskId: string;
    let agent1Id: string;
    let agent2Id: string;

    beforeEach(() => {
      const task = tasksCreate(db, { title: "Task to Assign" });
      taskId = task.id;
      const agent1 = agentsCreate(db, { name: "Agent One" });
      agent1Id = agent1.id;
      const agent2 = agentsCreate(db, { name: "Agent Two" });
      agent2Id = agent2.id;
    });

    it("assigns agents to task", () => {
      const result = tasksAssign(db, {
        id: taskId,
        agentIds: [agent1Id, agent2Id],
      });

      expect(result.assignees).toHaveLength(2);
      expect(result.assignees.map((a) => a.id).sort()).toEqual([agent1Id, agent2Id].sort());
    });

    it("ignores duplicate assignments", () => {
      // First assignment
      tasksAssign(db, { id: taskId, agentIds: [agent1Id] });

      // Assign again (including duplicate)
      const result = tasksAssign(db, {
        id: taskId,
        agentIds: [agent1Id, agent2Id],
      });

      expect(result.assignees).toHaveLength(2);
    });

    it("throws on missing id", () => {
      expect(() => tasksAssign(db, { agentIds: [agent1Id] } as AssignTaskInput)).toThrow(
        "id is required"
      );
      expect(() => tasksAssign(db, { id: "", agentIds: [agent1Id] })).toThrow("id is required");
    });

    it("throws on missing agentIds", () => {
      expect(() => tasksAssign(db, { id: taskId } as AssignTaskInput)).toThrow(
        "agentIds is required"
      );
      expect(() => tasksAssign(db, { id: taskId, agentIds: [] })).toThrow("agentIds is required");
    });
  });

  describe("tasksUnassign", () => {
    let taskId: string;
    let agent1Id: string;
    let agent2Id: string;

    beforeEach(() => {
      const task = tasksCreate(db, { title: "Task to Unassign" });
      taskId = task.id;
      const agent1 = agentsCreate(db, { name: "Agent One" });
      agent1Id = agent1.id;
      const agent2 = agentsCreate(db, { name: "Agent Two" });
      agent2Id = agent2.id;

      // Assign both agents
      tasksAssign(db, { id: taskId, agentIds: [agent1Id, agent2Id] });
    });

    it("removes agent assignments", () => {
      const result = tasksUnassign(db, {
        id: taskId,
        agentIds: [agent1Id],
      });

      expect(result.assignees).toHaveLength(1);
      expect(result.assignees[0].id).toBe(agent2Id);
    });

    it("throws on missing id", () => {
      expect(() => tasksUnassign(db, { agentIds: [agent1Id] } as AssignTaskInput)).toThrow(
        "id is required"
      );
      expect(() => tasksUnassign(db, { id: "", agentIds: [agent1Id] })).toThrow("id is required");
    });

    it("throws on missing agentIds", () => {
      expect(() => tasksUnassign(db, { id: taskId } as AssignTaskInput)).toThrow(
        "agentIds is required"
      );
      expect(() => tasksUnassign(db, { id: taskId, agentIds: [] })).toThrow("agentIds is required");
    });
  });

  describe("tasksDelete", () => {
    it("deletes existing task", () => {
      const task = tasksCreate(db, { title: "To Delete" });

      const result = tasksDelete(db, { id: task.id });

      expect(result.deleted).toBe(true);
      expect(result.id).toBe(task.id);

      // Verify it was actually deleted
      const tasks = tasksList(db);
      expect(tasks).toHaveLength(0);
    });

    it("returns deleted:false for non-existent task", () => {
      const result = tasksDelete(db, { id: "non-existent-id" });

      expect(result.deleted).toBe(false);
      expect(result.id).toBe("non-existent-id");
    });

    it("throws on missing id", () => {
      expect(() => tasksDelete(db, {} as { id: string })).toThrow("id is required");
      expect(() => tasksDelete(db, { id: "" })).toThrow("id is required");
    });
  });
});
