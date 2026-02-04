// src/lib/constants.ts

import type { TaskStatus, AgentStatus } from "./types";

export const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
  inbox: "var(--status-backlog)",
  assigned: "var(--status-backlog)",
  in_progress: "var(--status-in-progress)",
  review: "var(--status-review)",
  done: "var(--status-done)",
};

export const AGENT_STATUS_COLORS: Record<AgentStatus, string> = {
  idle: "var(--agent-idle)",
  active: "var(--agent-active)",
  blocked: "var(--agent-blocked)",
};

export const COLUMN_BACKGROUNDS = {
  backlog: "var(--column-bg-backlog)",
  in_progress: "var(--column-bg-in-progress)",
  review: "var(--column-bg-review)",
  done: "var(--column-bg-done)",
} as const;

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  inbox: "Backlog",
  assigned: "Backlog",
  in_progress: "In Progress",
  review: "Review",
  done: "Done",
};

export const AGENT_STATUS_LABELS: Record<AgentStatus, string> = {
  idle: "Idle",
  active: "Active",
  blocked: "Blocked",
};
