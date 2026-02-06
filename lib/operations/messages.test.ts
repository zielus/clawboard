import { describe, it, expect, beforeEach, afterEach } from "vitest";
import type Database from "better-sqlite3";
import { createTestDb } from "@/test/utils";
import { messagesList, messagesCreate, messagesAttach } from "./messages";
import { tasksCreate } from "./tasks";
import { documentsCreate } from "./documents";
import { agentsCreate } from "./agents";
import { activitiesList } from "./activities";

describe("messages operations", () => {
  let db: Database.Database;

  beforeEach(() => {
    db = createTestDb();
  });

  afterEach(() => {
    db.close();
  });

  describe("messagesList", () => {
    it("returns empty array when no messages exist", () => {
      const result = messagesList(db, {});
      expect(result).toEqual([]);
    });

    it("returns all messages with empty attachments array when unfiltered", () => {
      // Create a task for messages
      const task = tasksCreate(db, { title: "Test Task" });

      // Insert messages directly
      db.exec(`
        INSERT INTO messages (id, task_id, content, created_at)
        VALUES
          ('msg-1', '${task.id}', 'First message', '2024-01-01 10:00:00'),
          ('msg-2', '${task.id}', 'Second message', '2024-01-01 12:00:00')
      `);

      const result = messagesList(db, {});

      expect(result).toHaveLength(2);
      expect(result[0].attachments).toEqual([]);
      expect(result[1].attachments).toEqual([]);
    });

    it("filters messages by taskId", () => {
      // Create two tasks
      const task1 = tasksCreate(db, { title: "Task 1" });
      const task2 = tasksCreate(db, { title: "Task 2" });

      // Insert messages for both tasks
      db.exec(`
        INSERT INTO messages (id, task_id, content)
        VALUES
          ('msg-1', '${task1.id}', 'Task 1 message'),
          ('msg-2', '${task2.id}', 'Task 2 message'),
          ('msg-3', '${task1.id}', 'Another Task 1 message')
      `);

      const result = messagesList(db, { taskId: task1.id });

      expect(result).toHaveLength(2);
      expect(result.every((m) => m.task_id === task1.id)).toBe(true);
    });

    it("includes attachments for messages", () => {
      // Create task
      const task = tasksCreate(db, { title: "Test Task" });

      // Create documents
      const doc1 = documentsCreate(db, { title: "Doc 1" });
      const doc2 = documentsCreate(db, { title: "Doc 2" });

      // Insert message
      db.exec(`
        INSERT INTO messages (id, task_id, content)
        VALUES ('msg-1', '${task.id}', 'Message with attachments')
      `);

      // Attach documents to message
      db.exec(`
        INSERT INTO message_attachments (message_id, document_id)
        VALUES
          ('msg-1', '${doc1.id}'),
          ('msg-1', '${doc2.id}')
      `);

      const result = messagesList(db, {});

      expect(result).toHaveLength(1);
      expect(result[0].attachments).toHaveLength(2);
      expect(result[0].attachments.map((d) => d.id).sort()).toEqual(
        [doc1.id, doc2.id].sort()
      );
    });

    it("returns messages ordered by created_at DESC", () => {
      const task = tasksCreate(db, { title: "Test Task" });

      db.exec(`
        INSERT INTO messages (id, task_id, content, created_at)
        VALUES
          ('msg-1', '${task.id}', 'First', '2024-01-01 10:00:00'),
          ('msg-2', '${task.id}', 'Second', '2024-01-01 12:00:00'),
          ('msg-3', '${task.id}', 'Third', '2024-01-01 11:00:00')
      `);

      const result = messagesList(db, {});

      expect(result).toHaveLength(3);
      expect(result[0].id).toBe("msg-2"); // Latest first
      expect(result[1].id).toBe("msg-3");
      expect(result[2].id).toBe("msg-1"); // Oldest last
    });
  });

  describe("messagesCreate", () => {
    it("creates message with required fields only", () => {
      const task = tasksCreate(db, { title: "Test Task" });

      const result = messagesCreate(db, {
        taskId: task.id,
        content: "Test message content",
      });

      expect(result.id).toBeDefined();
      expect(result.task_id).toBe(task.id);
      expect(result.content).toBe("Test message content");
      expect(result.from_agent_id).toBeNull();
      expect(result.created_at).toBeDefined();
      expect(result.attachments).toEqual([]);

      // Verify it was actually inserted
      const messages = messagesList(db, {});
      expect(messages).toHaveLength(1);
      expect(messages[0].id).toBe(result.id);
    });

    it("creates message with agent", () => {
      const task = tasksCreate(db, { title: "Test Task" });
      const agent = agentsCreate(db, { name: "Test Agent" });

      const result = messagesCreate(db, {
        taskId: task.id,
        content: "Agent message",
        fromAgentId: agent.id,
      });

      expect(result.from_agent_id).toBe(agent.id);
    });

    it("creates message with attachments", () => {
      const task = tasksCreate(db, { title: "Test Task" });
      const doc1 = documentsCreate(db, { title: "Doc 1" });
      const doc2 = documentsCreate(db, { title: "Doc 2" });

      const result = messagesCreate(db, {
        taskId: task.id,
        content: "Message with attachments",
        attachmentIds: [doc1.id, doc2.id],
      });

      expect(result.attachments).toHaveLength(2);
      expect(result.attachments.map((d) => d.id).sort()).toEqual(
        [doc1.id, doc2.id].sort()
      );
    });

    it("creates message_sent activity", () => {
      const task = tasksCreate(db, { title: "Test Task" });
      const agent = agentsCreate(db, { name: "Test Agent" });

      // Clear activities from task creation
      db.exec("DELETE FROM activities");

      messagesCreate(db, {
        taskId: task.id,
        content: "Test message",
        fromAgentId: agent.id,
      });

      const activities = activitiesList(db);

      expect(activities).toHaveLength(1);
      expect(activities[0].type).toBe("message_sent");
      expect(activities[0].agent_id).toBe(agent.id);
      expect(activities[0].task_id).toBe(task.id);
    });

    it("creates message_sent activity without agent", () => {
      const task = tasksCreate(db, { title: "Test Task" });

      // Clear activities from task creation
      db.exec("DELETE FROM activities");

      messagesCreate(db, {
        taskId: task.id,
        content: "Anonymous message",
      });

      const activities = activitiesList(db);

      expect(activities).toHaveLength(1);
      expect(activities[0].type).toBe("message_sent");
      expect(activities[0].agent_id).toBeNull();
      expect(activities[0].task_id).toBe(task.id);
    });

    it("throws error when taskId is missing", () => {
      expect(() =>
        messagesCreate(db, { content: "Test" } as any)
      ).toThrow("taskId is required");
      expect(() =>
        messagesCreate(db, { taskId: "", content: "Test" })
      ).toThrow("taskId is required");
    });

    it("throws error when content is missing", () => {
      const task = tasksCreate(db, { title: "Test Task" });

      expect(() =>
        messagesCreate(db, { taskId: task.id } as any)
      ).toThrow("content is required");
      expect(() =>
        messagesCreate(db, { taskId: task.id, content: "" })
      ).toThrow("content is required");
    });
  });

  describe("messagesAttach", () => {
    it("attaches documents to existing message", () => {
      const task = tasksCreate(db, { title: "Test Task" });
      const doc1 = documentsCreate(db, { title: "Doc 1" });
      const doc2 = documentsCreate(db, { title: "Doc 2" });

      const message = messagesCreate(db, {
        taskId: task.id,
        content: "Test message",
      });

      const result = messagesAttach(db, {
        id: message.id,
        documentIds: [doc1.id, doc2.id],
      });

      expect(result.attachments).toHaveLength(2);
      expect(result.attachments.map((d) => d.id).sort()).toEqual(
        [doc1.id, doc2.id].sort()
      );
    });

    it("ignores duplicate attachments", () => {
      const task = tasksCreate(db, { title: "Test Task" });
      const doc = documentsCreate(db, { title: "Doc 1" });

      const message = messagesCreate(db, {
        taskId: task.id,
        content: "Test message",
        attachmentIds: [doc.id],
      });

      // Attach same document again
      const result = messagesAttach(db, {
        id: message.id,
        documentIds: [doc.id],
      });

      expect(result.attachments).toHaveLength(1);
      expect(result.attachments[0].id).toBe(doc.id);
    });

    it("adds new attachments to existing ones", () => {
      const task = tasksCreate(db, { title: "Test Task" });
      const doc1 = documentsCreate(db, { title: "Doc 1" });
      const doc2 = documentsCreate(db, { title: "Doc 2" });

      const message = messagesCreate(db, {
        taskId: task.id,
        content: "Test message",
        attachmentIds: [doc1.id],
      });

      const result = messagesAttach(db, {
        id: message.id,
        documentIds: [doc2.id],
      });

      expect(result.attachments).toHaveLength(2);
      expect(result.attachments.map((d) => d.id).sort()).toEqual(
        [doc1.id, doc2.id].sort()
      );
    });

    it("throws error when id is missing", () => {
      expect(() =>
        messagesAttach(db, { documentIds: ["doc-1"] } as any)
      ).toThrow("id is required");
      expect(() =>
        messagesAttach(db, { id: "", documentIds: ["doc-1"] })
      ).toThrow("id is required");
    });

    it("throws error when documentIds is missing or empty", () => {
      const task = tasksCreate(db, { title: "Test Task" });
      const message = messagesCreate(db, {
        taskId: task.id,
        content: "Test message",
      });

      expect(() =>
        messagesAttach(db, { id: message.id } as any)
      ).toThrow("documentIds is required");
      expect(() =>
        messagesAttach(db, { id: message.id, documentIds: [] })
      ).toThrow("documentIds is required");
    });
  });
});
