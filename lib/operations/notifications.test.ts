import { describe, it, expect, beforeEach, afterEach } from "vitest";
import Database from "better-sqlite3";
import { createTestDb } from "@/test/utils";
import { agentsCreate } from "./agents";
import {
  notificationsList,
  notificationsCreate,
  notificationsDeliver,
} from "./notifications";

describe("notifications operations", () => {
  let db: Database.Database;
  let testAgentId: string;
  let testAgent2Id: string;

  beforeEach(() => {
    db = createTestDb();
    // Create test agents for notifications
    const agent1 = agentsCreate(db, { name: "Agent One" });
    const agent2 = agentsCreate(db, { name: "Agent Two" });
    testAgentId = agent1.id;
    testAgent2Id = agent2.id;
  });

  afterEach(() => {
    db.close();
  });

  describe("notificationsList", () => {
    it("returns empty array when no notifications exist", () => {
      const result = notificationsList(db);
      expect(result).toEqual([]);
    });

    it("returns all notifications when no agentId filter provided", () => {
      // Create notifications for different agents
      notificationsCreate(db, {
        mentionedAgentId: testAgentId,
        content: "Message for agent 1",
      });
      notificationsCreate(db, {
        mentionedAgentId: testAgent2Id,
        content: "Message for agent 2",
      });

      const result = notificationsList(db);

      expect(result).toHaveLength(2);
    });

    it("filters by agentId when provided", () => {
      // Create notifications for different agents
      notificationsCreate(db, {
        mentionedAgentId: testAgentId,
        content: "Message for agent 1",
      });
      notificationsCreate(db, {
        mentionedAgentId: testAgent2Id,
        content: "Message for agent 2",
      });

      const result = notificationsList(db, { agentId: testAgentId });

      expect(result).toHaveLength(1);
      expect(result[0].mentioned_agent_id).toBe(testAgentId);
      expect(result[0].content).toBe("Message for agent 1");
    });
  });

  describe("notificationsCreate", () => {
    it("creates notification with delivered=0 by default", () => {
      const result = notificationsCreate(db, {
        mentionedAgentId: testAgentId,
        content: "You were mentioned in a task",
      });

      expect(result.id).toBeDefined();
      expect(result.mentioned_agent_id).toBe(testAgentId);
      expect(result.content).toBe("You were mentioned in a task");
      expect(result.delivered).toBe(0);
      expect(result.created_at).toBeDefined();

      // Verify it was actually inserted
      const notifications = notificationsList(db);
      expect(notifications).toHaveLength(1);
      expect(notifications[0].id).toBe(result.id);
    });

    it("throws on missing mentionedAgentId", () => {
      expect(() =>
        notificationsCreate(db, { content: "Test" } as any)
      ).toThrow("mentionedAgentId is required");
      expect(() =>
        notificationsCreate(db, { mentionedAgentId: "", content: "Test" })
      ).toThrow("mentionedAgentId is required");
    });

    it("throws on missing content", () => {
      expect(() =>
        notificationsCreate(db, { mentionedAgentId: testAgentId } as any)
      ).toThrow("content is required");
      expect(() =>
        notificationsCreate(db, { mentionedAgentId: testAgentId, content: "" })
      ).toThrow("content is required");
    });
  });

  describe("notificationsDeliver", () => {
    it("marks notification as delivered (delivered=1)", () => {
      // Create a notification
      const notification = notificationsCreate(db, {
        mentionedAgentId: testAgentId,
        content: "Test notification",
      });
      expect(notification.delivered).toBe(0);

      // Deliver it
      const result = notificationsDeliver(db, { id: notification.id });

      expect(result.id).toBe(notification.id);
      expect(result.delivered).toBe(1);

      // Verify persistence
      const notifications = notificationsList(db);
      expect(notifications[0].delivered).toBe(1);
    });

    it("throws on missing id", () => {
      expect(() => notificationsDeliver(db, {} as any)).toThrow(
        "id is required"
      );
      expect(() => notificationsDeliver(db, { id: "" })).toThrow(
        "id is required"
      );
    });
  });
});
