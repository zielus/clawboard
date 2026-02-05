# UI Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Migrate v0 Mission Control UI to Clawboard, keeping OKLCH color theme and existing data layer.

**Architecture:** Replace 4 main components (Header, AgentsPanel, KanbanBoard, ActivityFeed) with v0 versions adapted to use Clawboard's types. Update schema and types to simplify statuses.

**Tech Stack:** React 19, Vite, TypeScript, Tailwind CSS v4, shadcn/ui

---

## Task 1: Install Missing shadcn/ui Components

**Files:**
- Install: `tabs` component (used by header navigation)

**Step 1: Install tabs component**

Run:
```bash
cd /Users/zielu/Projects/clawboard && pnpm dlx shadcn@latest add tabs
```
Expected: Component installed to `src/components/ui/tabs.tsx`

**Step 2: Verify installation**

Run:
```bash
ls src/components/ui/tabs.tsx
```
Expected: File exists

**Step 3: Commit**

```bash
git add src/components/ui/tabs.tsx
git commit -m "chore: add tabs component from shadcn/ui"
```

---

## Task 2: Update Schema - Task Status

**Files:**
- Modify: `db/schema.sql:19-26`

**Step 1: Update tasks table CHECK constraint**

In `db/schema.sql`, change:
```sql
status      TEXT DEFAULT 'inbox' CHECK(status IN ('inbox', 'assigned', 'in_progress', 'review', 'done')),
```

To:
```sql
status      TEXT DEFAULT 'backlog' CHECK(status IN ('backlog', 'in_progress', 'review', 'done')),
```

**Step 2: Commit**

```bash
git add db/schema.sql
git commit -m "chore: simplify task status - consolidate inbox/assigned into backlog"
```

---

## Task 3: Update Schema - Activity Type

**Files:**
- Modify: `db/schema.sql:73-80`

**Step 1: Update activities table CHECK constraint**

In `db/schema.sql`, change:
```sql
type       TEXT NOT NULL CHECK(type IN ('task_created', 'task_updated', 'status_changed', 'message_sent', 'document_created', 'audit_completed')),
```

To:
```sql
type       TEXT NOT NULL CHECK(type IN ('created', 'moved', 'commented', 'updated')),
```

**Step 2: Commit**

```bash
git add db/schema.sql
git commit -m "chore: simplify activity types to created/moved/commented/updated"
```

---

## Task 4: Update TypeScript Types

**Files:**
- Modify: `src/lib/types.ts`

**Step 1: Update TaskStatus type**

Change:
```typescript
export type TaskStatus = "inbox" | "assigned" | "in_progress" | "review" | "done";
```

To:
```typescript
export type TaskStatus = "backlog" | "in_progress" | "review" | "done";
```

**Step 2: Update ActivityType type**

Change:
```typescript
export type ActivityType =
  | "task_created"
  | "task_updated"
  | "status_changed"
  | "message_sent"
  | "document_created"
  | "audit_completed";
```

To:
```typescript
export type ActivityType = "created" | "moved" | "commented" | "updated";
```

**Step 3: Commit**

```bash
git add src/lib/types.ts
git commit -m "chore: update TypeScript types to match simplified schema"
```

---

## Task 5: Update Mock Data

**Files:**
- Modify: `src/lib/mock-data.ts`

**Step 1: Update mock data with new statuses and activity types**

Replace entire file with:
```typescript
// src/lib/mock-data.ts
import type { Agent, Task, Activity } from "./types";

export const mockAgents: Agent[] = [
  {
    id: "agent-1",
    name: "Sarah Chen",
    role: "Product Lead",
    badge: "Lead",
    avatar: "https://i.pravatar.cc/150?u=sarah",
    status: "active",
    currentTaskId: "task-2",
    sessionKey: "agent:main:main",
    createdAt: "2025-01-15T10:00:00Z",
    updatedAt: "2025-02-04T08:30:00Z",
  },
  {
    id: "agent-2",
    name: "Marcus Rodriguez",
    role: "Senior Engineer",
    badge: null,
    avatar: "https://i.pravatar.cc/150?u=marcus",
    status: "active",
    currentTaskId: null,
    sessionKey: "agent:product-analyst:main",
    createdAt: "2025-01-15T10:00:00Z",
    updatedAt: "2025-02-04T07:00:00Z",
  },
  {
    id: "agent-3",
    name: "Emily Watson",
    role: "Designer",
    badge: null,
    avatar: "https://i.pravatar.cc/150?u=emily",
    status: "idle",
    currentTaskId: "task-3",
    sessionKey: "agent:developer:main",
    createdAt: "2025-01-15T10:00:00Z",
    updatedAt: "2025-02-04T09:15:00Z",
  },
  {
    id: "agent-4",
    name: "David Kim",
    role: "Backend Developer",
    badge: null,
    avatar: "https://i.pravatar.cc/150?u=david",
    status: "blocked",
    currentTaskId: null,
    sessionKey: "agent:backend:main",
    createdAt: "2025-01-15T10:00:00Z",
    updatedAt: "2025-02-04T06:00:00Z",
  },
  {
    id: "agent-5",
    name: "Lisa Thompson",
    role: "QA Engineer",
    badge: null,
    avatar: "https://i.pravatar.cc/150?u=lisa",
    status: "active",
    currentTaskId: null,
    sessionKey: "agent:qa:main",
    createdAt: "2025-01-15T10:00:00Z",
    updatedAt: "2025-02-04T05:00:00Z",
  },
  {
    id: "agent-6",
    name: "Alex Morgan",
    role: "DevOps",
    badge: null,
    avatar: "https://i.pravatar.cc/150?u=alex",
    status: "idle",
    currentTaskId: null,
    sessionKey: "agent:devops:main",
    createdAt: "2025-01-15T10:00:00Z",
    updatedAt: "2025-02-04T04:00:00Z",
  },
];

export const mockTasks: Task[] = [
  {
    id: "task-1",
    title: "Design system audit",
    description: "Review and document all existing design tokens and component patterns",
    status: "backlog",
    createdAt: "2025-02-03T10:00:00Z",
    updatedAt: "2025-02-03T10:00:00Z",
    assignees: [mockAgents[2]],
  },
  {
    id: "task-2",
    title: "API rate limiting",
    description: "Implement rate limiting for public API endpoints",
    status: "backlog",
    createdAt: "2025-02-04T10:00:00Z",
    updatedAt: "2025-02-04T10:00:00Z",
    assignees: [mockAgents[3]],
  },
  {
    id: "task-3",
    title: "User dashboard redesign",
    description: "Create new wireframes and mockups for the main dashboard",
    status: "in_progress",
    createdAt: "2025-02-02T14:00:00Z",
    updatedAt: "2025-02-04T08:30:00Z",
    assignees: [mockAgents[0]],
  },
  {
    id: "task-4",
    title: "Database optimization",
    description: "Optimize slow queries identified in performance monitoring",
    status: "in_progress",
    createdAt: "2025-02-01T09:00:00Z",
    updatedAt: "2025-02-04T07:00:00Z",
    assignees: [mockAgents[1]],
  },
  {
    id: "task-5",
    title: "Authentication flow",
    description: "Implement OAuth2 social login options",
    status: "review",
    createdAt: "2025-01-30T11:00:00Z",
    updatedAt: "2025-02-03T16:00:00Z",
    assignees: [mockAgents[3]],
  },
  {
    id: "task-6",
    title: "Mobile responsive fixes",
    description: "Fix layout issues on mobile viewports for settings page",
    status: "review",
    createdAt: "2025-01-29T07:00:00Z",
    updatedAt: "2025-02-02T12:00:00Z",
    assignees: [mockAgents[2]],
  },
  {
    id: "task-7",
    title: "CI/CD pipeline setup",
    description: "Configure automated testing and deployment workflows",
    status: "done",
    createdAt: "2025-01-28T10:00:00Z",
    updatedAt: "2025-01-30T15:00:00Z",
    assignees: [mockAgents[5]],
  },
  {
    id: "task-8",
    title: "User onboarding flow",
    description: "Design and implement new user welcome experience",
    status: "done",
    createdAt: "2025-01-25T09:00:00Z",
    updatedAt: "2025-01-28T14:00:00Z",
    assignees: [mockAgents[0]],
  },
  {
    id: "task-9",
    title: "Error tracking integration",
    description: "Set up Sentry for error monitoring and alerting",
    status: "done",
    createdAt: "2025-01-24T08:00:00Z",
    updatedAt: "2025-01-26T11:00:00Z",
    assignees: [mockAgents[4]],
  },
];

export const mockActivities: Activity[] = [
  {
    id: "activity-1",
    type: "moved",
    agentId: "agent-1",
    taskId: "task-3",
    message: "Backlog → In Progress",
    createdAt: "2025-02-04T09:15:00Z",
    agent: mockAgents[0],
    task: mockTasks[2],
  },
  {
    id: "activity-2",
    type: "commented",
    agentId: "agent-2",
    taskId: "task-4",
    message: "Added performance metrics",
    createdAt: "2025-02-04T08:30:00Z",
    agent: mockAgents[1],
    task: mockTasks[3],
  },
  {
    id: "activity-3",
    type: "created",
    agentId: "agent-3",
    taskId: "task-1",
    message: "Design system audit",
    createdAt: "2025-02-04T07:00:00Z",
    agent: mockAgents[2],
    task: mockTasks[0],
  },
  {
    id: "activity-4",
    type: "moved",
    agentId: "agent-4",
    taskId: "task-5",
    message: "In Progress → Review",
    createdAt: "2025-02-04T06:30:00Z",
    agent: mockAgents[3],
    task: mockTasks[4],
  },
  {
    id: "activity-5",
    type: "commented",
    agentId: "agent-5",
    taskId: "task-9",
    message: "All tests passing",
    createdAt: "2025-02-04T05:00:00Z",
    agent: mockAgents[4],
    task: mockTasks[8],
  },
  {
    id: "activity-6",
    type: "moved",
    agentId: "agent-6",
    taskId: "task-7",
    message: "Review → Done",
    createdAt: "2025-02-04T04:00:00Z",
    agent: mockAgents[5],
    task: mockTasks[6],
  },
  {
    id: "activity-7",
    type: "created",
    agentId: "agent-1",
    taskId: "task-2",
    message: "API rate limiting",
    createdAt: "2025-02-04T03:00:00Z",
    agent: mockAgents[0],
    task: mockTasks[1],
  },
  {
    id: "activity-8",
    type: "moved",
    agentId: "agent-2",
    taskId: "task-6",
    message: "In Progress → Review",
    createdAt: "2025-02-04T02:00:00Z",
    agent: mockAgents[1],
    task: mockTasks[5],
  },
];
```

**Step 2: Commit**

```bash
git add src/lib/mock-data.ts
git commit -m "chore: update mock data with new statuses, activity types, and realistic avatars"
```

---

## Task 6: Replace Header Component

**Files:**
- Replace: `src/components/layout/header.tsx`
- Delete: `src/components/layout/header-stats.tsx` (no longer needed)

**Step 1: Replace header.tsx with v0 version adapted for Clawboard**

```typescript
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Rocket,
  Pause,
  Play,
  RefreshCw,
  Moon,
  Sun,
  ListTodo,
  Brain,
  FileText,
} from "lucide-react";

interface Stats {
  backlog: number;
  inProgress: number;
  review: number;
  done: number;
}

interface HeaderProps {
  stats: Stats;
  isPaused: boolean;
  onTogglePause: () => void;
  onRefresh: () => void;
}

export function Header({ stats, isPaused, onTogglePause, onRefresh }: HeaderProps) {
  const [isDark, setIsDark] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    onRefresh();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-card px-4">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Rocket className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold text-foreground">Clawboard</span>
        </div>
        <Tabs defaultValue="tasks" className="hidden md:block">
          <TabsList className="h-8 bg-secondary">
            <TabsTrigger value="tasks" className="gap-1.5 text-xs data-[state=active]:bg-accent">
              <ListTodo className="h-3.5 w-3.5" />
              Tasks
            </TabsTrigger>
            <TabsTrigger value="memory" className="gap-1.5 text-xs data-[state=active]:bg-accent" disabled>
              <Brain className="h-3.5 w-3.5" />
              Memory
            </TabsTrigger>
            <TabsTrigger value="docs" className="gap-1.5 text-xs data-[state=active]:bg-accent" disabled>
              <FileText className="h-3.5 w-3.5" />
              Docs
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="hidden items-center gap-3 lg:flex">
        <div className="flex items-center gap-4 rounded-lg bg-secondary/50 px-4 py-1.5">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-slate-500" />
            <span className="text-xs text-muted-foreground">Backlog</span>
            <span className="text-sm font-semibold text-foreground">{stats.backlog}</span>
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            <span className="text-xs text-muted-foreground">In Progress</span>
            <span className="text-sm font-semibold text-foreground">{stats.inProgress}</span>
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            <span className="text-xs text-muted-foreground">Review</span>
            <span className="text-sm font-semibold text-foreground">{stats.review}</span>
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-xs text-muted-foreground">Done</span>
            <span className="text-sm font-semibold text-foreground">{stats.done}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={onTogglePause}
        >
          {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
          <span className="sr-only">{isPaused ? "Resume" : "Pause"}</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={handleRefresh}
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          <span className="sr-only">Refresh</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={() => setIsDark(!isDark)}
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </div>
    </header>
  );
}
```

**Step 2: Delete header-stats.tsx (consolidated into header)**

```bash
rm src/components/layout/header-stats.tsx
```

**Step 3: Commit**

```bash
git add src/components/layout/header.tsx
git rm src/components/layout/header-stats.tsx
git commit -m "feat: replace header with v0 design - integrated stats, navigation tabs"
```

---

## Task 7: Replace Agents Column Component

**Files:**
- Replace: `src/components/agents/agents-column.tsx`
- Delete: `src/components/agents/agent-card.tsx` (no longer needed - inlined)

**Step 1: Replace agents-column.tsx with v0 version**

```typescript
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Agent, AgentStatus } from "@/lib/types";

interface AgentsColumnProps {
  agents: Agent[];
}

const statusConfig: Record<AgentStatus, { label: string; className: string }> = {
  active: {
    label: "Active",
    className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  },
  idle: {
    label: "Idle",
    className: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  },
  blocked: {
    label: "Blocked",
    className: "bg-red-500/20 text-red-400 border-red-500/30",
  },
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("");
}

function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
}

export function AgentsColumn({ agents }: AgentsColumnProps) {
  return (
    <div className="hidden w-64 shrink-0 flex-col border-r border-border bg-card lg:flex">
      <div className="border-b border-border p-4">
        <h2 className="text-sm font-semibold text-foreground">Agents</h2>
        <p className="text-xs text-muted-foreground">{agents.length} team members</p>
      </div>
      <ScrollArea className="flex-1">
        <div className="space-y-1 p-2">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className="group flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-accent"
            >
              <div className="relative">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={agent.avatar || undefined} alt={agent.name} />
                  <AvatarFallback className="bg-muted text-xs">
                    {getInitials(agent.name)}
                  </AvatarFallback>
                </Avatar>
                <span
                  className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card ${
                    agent.status === "active"
                      ? "bg-emerald-500"
                      : agent.status === "idle"
                        ? "bg-amber-500"
                        : "bg-red-500"
                  }`}
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium text-foreground">
                    {agent.name}
                  </span>
                </div>
                <p className="truncate text-xs text-muted-foreground">{agent.role}</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={`text-[10px] px-1.5 py-0 ${statusConfig[agent.status].className}`}
                  >
                    {statusConfig[agent.status].label}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">
                    {getRelativeTime(agent.updatedAt)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
```

**Step 2: Delete agent-card.tsx (now inlined)**

```bash
rm src/components/agents/agent-card.tsx
```

**Step 3: Commit**

```bash
git add src/components/agents/agents-column.tsx
git rm src/components/agents/agent-card.tsx
git commit -m "feat: replace agents column with v0 design - status badges, relative time"
```

---

## Task 8: Replace Kanban Board Component

**Files:**
- Replace: `src/components/tasks/kanban-board.tsx`
- Delete: `src/components/tasks/kanban-column.tsx` (no longer needed - inlined)
- Delete: `src/components/tasks/task-card.tsx` (no longer needed - inlined)

**Step 1: Replace kanban-board.tsx with v0 version**

```typescript
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, GripVertical } from "lucide-react";
import type { Task, TaskStatus } from "@/lib/types";

interface KanbanBoardProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onAddTask: (status: TaskStatus) => void;
}

const columns: { id: TaskStatus; title: string; color: string }[] = [
  { id: "backlog", title: "Backlog", color: "bg-slate-500" },
  { id: "in_progress", title: "In Progress", color: "bg-blue-500" },
  { id: "review", title: "Review", color: "bg-amber-500" },
  { id: "done", title: "Done", color: "bg-emerald-500" },
];

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("");
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function TaskCard({ task, onClick }: { task: Task; onClick: () => void }) {
  const firstAssignee = task.assignees?.[0];

  return (
    <Card
      className="group cursor-grab border-border bg-card transition-all hover:border-primary/30 hover:bg-accent/50 active:cursor-grabbing"
      onClick={onClick}
    >
      <CardContent className="p-3">
        <div className="mb-2 flex items-start justify-between gap-2">
          <h4 className="text-sm font-medium leading-tight text-foreground">{task.title}</h4>
          <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
        </div>
        {task.description && (
          <p className="mb-3 line-clamp-2 text-xs text-muted-foreground">{task.description}</p>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {firstAssignee ? (
              <>
                <Avatar className="h-5 w-5">
                  <AvatarImage src={firstAssignee.avatar || undefined} alt={firstAssignee.name} />
                  <AvatarFallback className="text-[8px]">
                    {getInitials(firstAssignee.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-[10px] text-muted-foreground">
                  {firstAssignee.name.split(" ")[0]}
                </span>
                {task.assignees && task.assignees.length > 1 && (
                  <span className="text-[10px] text-muted-foreground">
                    +{task.assignees.length - 1}
                  </span>
                )}
              </>
            ) : (
              <span className="text-[10px] text-muted-foreground">Unassigned</span>
            )}
          </div>
          <span className="text-[10px] text-muted-foreground">{formatDate(task.createdAt)}</span>
        </div>
      </CardContent>
    </Card>
  );
}

export function KanbanBoard({ tasks, onTaskClick, onAddTask }: KanbanBoardProps) {
  const getTasksByStatus = (status: TaskStatus) => tasks.filter((t) => t.status === status);

  return (
    <div className="flex flex-1 flex-col bg-background">
      <div className="flex flex-1 gap-4 overflow-x-auto p-4">
        {columns.map((column) => {
          const columnTasks = getTasksByStatus(column.id);
          return (
            <div
              key={column.id}
              className="flex h-full w-72 shrink-0 flex-col rounded-lg bg-secondary/30"
            >
              <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${column.color}`} />
                  <h3 className="text-sm font-medium text-foreground">{column.title}</h3>
                  <span className="rounded-md bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
                    {columnTasks.length}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                  onClick={() => onAddTask(column.id)}
                >
                  <Plus className="h-4 w-4" />
                  <span className="sr-only">Add task to {column.title}</span>
                </Button>
              </div>
              <ScrollArea className="flex-1 p-2">
                <div className="space-y-2">
                  {columnTasks.map((task) => (
                    <TaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} />
                  ))}
                </div>
              </ScrollArea>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

**Step 2: Delete old column and card components**

```bash
rm src/components/tasks/kanban-column.tsx
rm src/components/tasks/task-card.tsx
```

**Step 3: Commit**

```bash
git add src/components/tasks/kanban-board.tsx
git rm src/components/tasks/kanban-column.tsx src/components/tasks/task-card.tsx
git commit -m "feat: replace kanban board with v0 design - inline task cards, column headers"
```

---

## Task 9: Replace Activity Timeline Component

**Files:**
- Replace: `src/components/activity/activity-timeline.tsx`

**Step 1: Replace activity-timeline.tsx with v0 version**

```typescript
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowRight, MessageSquare, Plus, Pencil } from "lucide-react";
import type { Activity, ActivityType } from "@/lib/types";

interface ActivityTimelineProps {
  activities: Activity[];
}

const actionConfig: Record<ActivityType, { icon: typeof ArrowRight; label: string; color: string }> = {
  moved: { icon: ArrowRight, label: "moved", color: "text-blue-400" },
  created: { icon: Plus, label: "created", color: "text-emerald-400" },
  commented: { icon: MessageSquare, label: "commented on", color: "text-amber-400" },
  updated: { icon: Pencil, label: "updated", color: "text-purple-400" },
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("");
}

function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
}

export function ActivityTimeline({ activities }: ActivityTimelineProps) {
  return (
    <div className="hidden w-72 shrink-0 flex-col border-l border-border bg-card xl:flex">
      <div className="border-b border-border p-4">
        <h2 className="text-sm font-semibold text-foreground">Activity</h2>
        <p className="text-xs text-muted-foreground">Recent actions</p>
      </div>
      <ScrollArea className="flex-1">
        <div className="space-y-1 p-2">
          {activities.map((activity) => {
            const config = actionConfig[activity.type];
            const Icon = config.icon;
            const agentName = activity.agent?.name || "Unknown";
            const taskTitle = activity.task?.title || "Unknown task";

            return (
              <div
                key={activity.id}
                className="group rounded-lg p-3 transition-colors hover:bg-accent"
              >
                <div className="flex items-start gap-3">
                  <Avatar className="h-7 w-7">
                    <AvatarImage
                      src={activity.agent?.avatar || undefined}
                      alt={agentName}
                    />
                    <AvatarFallback className="text-[10px]">
                      {getInitials(agentName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs leading-relaxed">
                      <span className="font-medium text-foreground">
                        {agentName.split(" ")[0]}
                      </span>{" "}
                      <span className={`inline-flex items-center gap-1 ${config.color}`}>
                        <Icon className="h-3 w-3" />
                        {config.label}
                      </span>{" "}
                      <span className="font-medium text-foreground">{taskTitle}</span>
                    </p>
                    {activity.message && activity.type === "moved" && (
                      <p className="mt-0.5 text-[10px] text-muted-foreground">{activity.message}</p>
                    )}
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      {getRelativeTime(activity.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/activity/activity-timeline.tsx
git commit -m "feat: replace activity timeline with v0 design - action icons, relative time"
```

---

## Task 10: Update TasksPage

**Files:**
- Modify: `src/pages/tasks.tsx`

**Step 1: Update TasksPage to work with new components and types**

```typescript
// src/pages/tasks.tsx
import { useState, useMemo } from "react";
import { Header } from "@/components/layout/header";
import { AgentsColumn } from "@/components/agents/agents-column";
import { KanbanBoard } from "@/components/tasks/kanban-board";
import { ActivityTimeline } from "@/components/activity/activity-timeline";
import { mockAgents, mockTasks, mockActivities } from "@/lib/mock-data";
import type { Task, TaskStatus } from "@/lib/types";

export function TasksPage() {
  const [isPaused, setIsPaused] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [tasks, setTasks] = useState(mockTasks);

  // Calculate stats for all 4 columns
  const stats = useMemo(() => {
    const backlog = tasks.filter((t) => t.status === "backlog").length;
    const inProgress = tasks.filter((t) => t.status === "in_progress").length;
    const review = tasks.filter((t) => t.status === "review").length;
    const done = tasks.filter((t) => t.status === "done").length;
    return { backlog, inProgress, review, done };
  }, [tasks]);

  const handleRefresh = () => {
    console.log("Refreshing data...");
  };

  const handleAddTask = (status: TaskStatus) => {
    console.log("Add task to column:", status);
    // TODO: Open task modal
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      <Header
        stats={stats}
        isPaused={isPaused}
        onTogglePause={() => setIsPaused(!isPaused)}
        onRefresh={handleRefresh}
      />

      <div className="flex flex-1 overflow-hidden">
        <AgentsColumn agents={mockAgents} />
        <KanbanBoard
          tasks={tasks}
          onTaskClick={setSelectedTask}
          onAddTask={handleAddTask}
        />
        <ActivityTimeline activities={mockActivities} />
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/pages/tasks.tsx
git commit -m "feat: update TasksPage for new component APIs and stats structure"
```

---

## Task 11: Cleanup Unused Files

**Files:**
- Delete: `src/components/shared/status-dot.tsx` (if exists)
- Delete: `src/components/shared/agent-avatar.tsx` (if exists)
- Delete: `src/components/shared/relative-time.tsx` (if exists)
- Delete: `src/components/layout/theme-toggle.tsx` (if exists)

**Step 1: Remove unused shared components**

```bash
rm -f src/components/shared/status-dot.tsx
rm -f src/components/shared/agent-avatar.tsx
rm -f src/components/shared/relative-time.tsx
rm -f src/components/layout/theme-toggle.tsx
```

**Step 2: Check if shared folder is empty and remove if so**

```bash
rmdir src/components/shared 2>/dev/null || true
```

**Step 3: Commit**

```bash
git add -A
git commit -m "chore: remove unused shared components (now inlined in main components)"
```

---

## Task 12: Verify and Test

**Step 1: Run type check**

Run:
```bash
cd /Users/zielu/Projects/clawboard && pnpm build
```
Expected: Build succeeds with no TypeScript errors

**Step 2: Start dev server and visually verify**

Run:
```bash
pnpm dev
```
Expected: App loads at localhost:5173 with new v0-style UI

**Step 3: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: address any remaining type or runtime issues"
```

---

## Summary

| Task | Description |
|------|-------------|
| 1 | Install missing shadcn/ui tabs component |
| 2 | Update schema - task status |
| 3 | Update schema - activity type |
| 4 | Update TypeScript types |
| 5 | Update mock data |
| 6 | Replace Header component |
| 7 | Replace Agents Column component |
| 8 | Replace Kanban Board component |
| 9 | Replace Activity Timeline component |
| 10 | Update TasksPage |
| 11 | Cleanup unused files |
| 12 | Verify and test |
