// src/lib/types.ts

export type AgentStatus = "idle" | "active" | "blocked";

export type TaskStatus = "backlog" | "in_progress" | "review" | "done";

export type ActivityType = "created" | "moved" | "commented" | "updated";

export interface Agent {
  id: string;
  name: string;
  role: string | null;
  badge: string | null;
  avatar: string | null;
  status: AgentStatus;
  currentTaskId: string | null;
  sessionKey: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
  assignees?: Agent[];
}

export interface Message {
  id: string;
  taskId: string;
  fromAgentId: string | null;
  content: string;
  createdAt: string;
  fromAgent?: Agent;
}

export interface Activity {
  id: string;
  type: ActivityType;
  agentId: string | null;
  taskId: string | null;
  message: string;
  createdAt: string;
  agent?: Agent;
  task?: Task;
}

export interface TaskStats {
  backlog: number;
  inProgress: number;
  total: number;
  completionPercent: number;
}
