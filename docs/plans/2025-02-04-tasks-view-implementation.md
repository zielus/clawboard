# Tasks View Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the Mission Control tasks page with header, stats, kanban board, task drawer, and activity timeline.

**Architecture:** React components organized by feature (layout, tasks, activity). Mock data initially, WebSocket integration later. All state local to start.

**Tech Stack:** React 19, TypeScript, shadcn/ui components, Tailwind CSS v4, Lucide icons.

---

## Task 1: Add Schema Migration for Avatar Column

**Files:**
- Modify: `db/schema.sql`

**Step 1: Add avatar column to agents table**

In `db/schema.sql`, add the avatar column to the agents table definition:

```sql
-- AGENTS
CREATE TABLE IF NOT EXISTS agents (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  role            TEXT,
  badge           TEXT,
  avatar          TEXT,
  status          TEXT DEFAULT 'idle' CHECK(status IN ('idle', 'active', 'blocked')),
  current_task_id TEXT,
  session_key     TEXT,
  created_at      TEXT DEFAULT (datetime('now')),
  updated_at      TEXT DEFAULT (datetime('now'))
);
```

**Step 2: Commit**

```bash
git add db/schema.sql
git commit -m "feat(db): add avatar column to agents table"
```

---

## Task 2: Create TypeScript Types

**Files:**
- Create: `src/lib/types.ts`

**Step 1: Create type definitions**

```typescript
// src/lib/types.ts

export type AgentStatus = "idle" | "active" | "blocked";

export type TaskStatus = "inbox" | "assigned" | "in_progress" | "review" | "done";

export type ActivityType =
  | "task_created"
  | "task_updated"
  | "status_changed"
  | "message_sent"
  | "document_created"
  | "audit_completed";

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
```

**Step 2: Verify build**

```bash
pnpm build
```

Expected: Build succeeds with no type errors.

**Step 3: Commit**

```bash
git add src/lib/types.ts
git commit -m "feat: add TypeScript type definitions"
```

---

## Task 3: Create Mock Data

**Files:**
- Create: `src/lib/mock-data.ts`

**Step 1: Create mock data file**

```typescript
// src/lib/mock-data.ts
import type { Agent, Task, Activity } from "./types";

export const mockAgents: Agent[] = [
  {
    id: "agent-1",
    name: "Jarvis",
    role: "Squad Lead",
    badge: "Lead",
    avatar: "🤖",
    status: "active",
    currentTaskId: "task-2",
    sessionKey: "agent:main:main",
    createdAt: "2025-01-15T10:00:00Z",
    updatedAt: "2025-02-04T08:30:00Z",
  },
  {
    id: "agent-2",
    name: "Shuri",
    role: "Product Analyst",
    badge: null,
    avatar: "🦊",
    status: "idle",
    currentTaskId: null,
    sessionKey: "agent:product-analyst:main",
    createdAt: "2025-01-15T10:00:00Z",
    updatedAt: "2025-02-04T07:00:00Z",
  },
  {
    id: "agent-3",
    name: "Friday",
    role: "Developer",
    badge: null,
    avatar: "⚡",
    status: "blocked",
    currentTaskId: "task-3",
    sessionKey: "agent:developer:main",
    createdAt: "2025-01-15T10:00:00Z",
    updatedAt: "2025-02-04T09:15:00Z",
  },
];

export const mockTasks: Task[] = [
  {
    id: "task-1",
    title: "Research competitor pricing models",
    description: "Analyze pricing strategies of top 5 competitors in the AI agent space.",
    status: "inbox",
    createdAt: "2025-02-01T10:00:00Z",
    updatedAt: "2025-02-01T10:00:00Z",
    assignees: [],
  },
  {
    id: "task-2",
    title: "Build Mission Control dashboard",
    description: "Create the main dashboard UI with kanban board, activity feed, and agent status.",
    status: "in_progress",
    createdAt: "2025-02-02T14:00:00Z",
    updatedAt: "2025-02-04T08:30:00Z",
    assignees: [mockAgents[0]],
  },
  {
    id: "task-3",
    title: "Fix WebSocket reconnection bug",
    description: "Gateway loses connection after 30 minutes. Need to implement reconnect logic.",
    status: "review",
    createdAt: "2025-02-03T09:00:00Z",
    updatedAt: "2025-02-04T09:15:00Z",
    assignees: [mockAgents[2]],
  },
  {
    id: "task-4",
    title: "Write onboarding documentation",
    description: "Create getting started guide for new users.",
    status: "done",
    createdAt: "2025-01-28T11:00:00Z",
    updatedAt: "2025-02-01T16:00:00Z",
    assignees: [mockAgents[1]],
  },
  {
    id: "task-5",
    title: "Design email templates",
    description: "Create HTML email templates for notifications.",
    status: "assigned",
    createdAt: "2025-02-04T07:00:00Z",
    updatedAt: "2025-02-04T07:00:00Z",
    assignees: [mockAgents[1]],
  },
];

export const mockActivities: Activity[] = [
  {
    id: "activity-1",
    type: "status_changed",
    agentId: "agent-3",
    taskId: "task-3",
    message: "moved to review",
    createdAt: "2025-02-04T09:15:00Z",
    agent: mockAgents[2],
    task: mockTasks[2],
  },
  {
    id: "activity-2",
    type: "message_sent",
    agentId: "agent-1",
    taskId: "task-2",
    message: "commented on",
    createdAt: "2025-02-04T08:30:00Z",
    agent: mockAgents[0],
    task: mockTasks[1],
  },
  {
    id: "activity-3",
    type: "task_created",
    agentId: "agent-2",
    taskId: "task-5",
    message: "created",
    createdAt: "2025-02-04T07:00:00Z",
    agent: mockAgents[1],
    task: mockTasks[4],
  },
  {
    id: "activity-4",
    type: "status_changed",
    agentId: "agent-1",
    taskId: "task-4",
    message: "completed",
    createdAt: "2025-02-01T16:00:00Z",
    agent: mockAgents[0],
    task: mockTasks[3],
  },
];
```

**Step 2: Verify build**

```bash
pnpm build
```

Expected: Build succeeds.

**Step 3: Commit**

```bash
git add src/lib/mock-data.ts
git commit -m "feat: add mock data for development"
```

---

## Task 4: Create Utility Components

**Files:**
- Create: `src/components/shared/agent-avatar.tsx`
- Create: `src/components/shared/relative-time.tsx`

**Step 1: Create agent-avatar component**

```typescript
// src/components/shared/agent-avatar.tsx
import { cn } from "@/lib/utils";

interface AgentAvatarProps {
  avatar: string | null;
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function AgentAvatar({ avatar, name, size = "md", className }: AgentAvatarProps) {
  const sizeClasses = {
    sm: "size-5 text-xs",
    md: "size-6 text-sm",
    lg: "size-8 text-base",
  };

  // Check if avatar is an emoji (starts with emoji or is short)
  const isEmoji = avatar && /^\p{Emoji}/u.test(avatar);

  // Check if avatar is a URL
  const isUrl = avatar && (avatar.startsWith("http://") || avatar.startsWith("https://"));

  if (isUrl) {
    return (
      <img
        src={avatar}
        alt={name}
        className={cn("rounded-full object-cover", sizeClasses[size], className)}
      />
    );
  }

  if (isEmoji) {
    return (
      <span
        className={cn(
          "inline-flex items-center justify-center rounded-full bg-muted",
          sizeClasses[size],
          className
        )}
        title={name}
      >
        {avatar}
      </span>
    );
  }

  // Fallback: show initials
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground font-medium",
        sizeClasses[size],
        className
      )}
      title={name}
    >
      {initials}
    </span>
  );
}
```

**Step 2: Create relative-time component**

```typescript
// src/components/shared/relative-time.tsx
interface RelativeTimeProps {
  date: string;
  className?: string;
}

export function RelativeTime({ date, className }: RelativeTimeProps) {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  let text: string;
  if (diffMins < 1) {
    text = "just now";
  } else if (diffMins < 60) {
    text = `${diffMins}m ago`;
  } else if (diffHours < 24) {
    text = `${diffHours}h ago`;
  } else if (diffDays === 1) {
    text = "yesterday";
  } else if (diffDays < 7) {
    text = `${diffDays}d ago`;
  } else {
    text = then.toLocaleDateString();
  }

  return (
    <time dateTime={date} className={className} title={then.toLocaleString()}>
      {text}
    </time>
  );
}
```

**Step 3: Verify build**

```bash
pnpm build
```

Expected: Build succeeds.

**Step 4: Commit**

```bash
git add src/components/shared/
git commit -m "feat: add agent-avatar and relative-time components"
```

---

## Task 5: Install Additional shadcn Components

**Files:**
- Install: dialog, scroll-area, sheet, toggle, avatar, tooltip

**Step 1: Install components**

```bash
pnpm dlx shadcn@latest add dialog scroll-area sheet toggle avatar tooltip
```

**Step 2: Verify build**

```bash
pnpm build
```

Expected: Build succeeds.

**Step 3: Commit**

```bash
git add src/components/ui/
git commit -m "feat: add shadcn dialog, scroll-area, sheet, toggle, avatar, tooltip"
```

---

## Task 6: Create Theme Toggle Component

**Files:**
- Create: `src/components/layout/theme-toggle.tsx`

**Step 1: Create theme toggle**

```typescript
// src/components/layout/theme-toggle.tsx
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check initial preference
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const stored = localStorage.getItem("theme");
    const initial = stored === "dark" || (!stored && prefersDark);
    setIsDark(initial);
    document.documentElement.classList.toggle("dark", initial);
  }, []);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  return (
    <Button variant="ghost" size="icon" onClick={toggle} title="Toggle theme">
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}
```

**Step 2: Verify build**

```bash
pnpm build
```

Expected: Build succeeds.

**Step 3: Commit**

```bash
git add src/components/layout/theme-toggle.tsx
git commit -m "feat: add theme toggle component"
```

---

## Task 7: Create Header Component

**Files:**
- Create: `src/components/layout/header.tsx`

**Step 1: Create header**

```typescript
// src/components/layout/header.tsx
import { LayoutGrid, RefreshCw, Pause, Play } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Tasks", href: "/tasks", active: true },
  { label: "Projects", href: "/projects", disabled: true },
  { label: "Memory", href: "/memory", disabled: true },
  { label: "Docs", href: "/docs", disabled: true },
  { label: "Agents", href: "/agents", disabled: true },
];

interface HeaderProps {
  onRefresh?: () => void;
  isPaused?: boolean;
  onTogglePause?: () => void;
}

export function Header({ onRefresh, isPaused = false, onTogglePause }: HeaderProps) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-border px-4">
      {/* Left: Logo + Nav */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <LayoutGrid className="size-5 text-primary" />
          <span className="font-semibold">Mission Control</span>
        </div>

        <nav className="flex items-center gap-1">
          {navItems.map((item) => (
            <button
              key={item.label}
              disabled={item.disabled}
              className={cn(
                "px-3 py-1.5 text-sm rounded-md transition-colors",
                item.active
                  ? "bg-muted text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                item.disabled && "opacity-50 cursor-not-allowed pointer-events-none"
              )}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Right: Controls */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onTogglePause}
          className="gap-1.5"
        >
          {isPaused ? (
            <>
              <Play className="size-4" />
              Resume
            </>
          ) : (
            <>
              <Pause className="size-4" />
              Pause
            </>
          )}
        </Button>
        <Button variant="ghost" size="icon" onClick={onRefresh} title="Refresh">
          <RefreshCw className="size-4" />
        </Button>
        <ThemeToggle />
      </div>
    </header>
  );
}
```

**Step 2: Verify build**

```bash
pnpm build
```

Expected: Build succeeds.

**Step 3: Commit**

```bash
git add src/components/layout/header.tsx
git commit -m "feat: add header component with nav and controls"
```

---

## Task 8: Create Stats Row Component

**Files:**
- Create: `src/components/tasks/stats-row.tsx`

**Step 1: Create stats row**

```typescript
// src/components/tasks/stats-row.tsx
import type { TaskStats } from "@/lib/types";
import { cn } from "@/lib/utils";

interface StatProps {
  value: number | string;
  label: string;
  className?: string;
}

function Stat({ value, label, className }: StatProps) {
  return (
    <div className={cn("flex items-baseline gap-2", className)}>
      <span className="text-2xl font-semibold">{value}</span>
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
  );
}

interface StatsRowProps {
  stats: TaskStats;
}

export function StatsRow({ stats }: StatsRowProps) {
  return (
    <div className="flex items-center gap-8 px-4 py-3 border-b border-border">
      <Stat value={stats.backlog} label="Backlog" />
      <Stat value={stats.inProgress} label="In progress" />
      <Stat value={stats.total} label="Total" />
      <Stat value={`${stats.completionPercent}%`} label="Completion" />
    </div>
  );
}
```

**Step 2: Verify build**

```bash
pnpm build
```

Expected: Build succeeds.

**Step 3: Commit**

```bash
git add src/components/tasks/stats-row.tsx
git commit -m "feat: add stats row component"
```

---

## Task 9: Create Action Row Component

**Files:**
- Create: `src/components/tasks/action-row.tsx`

**Step 1: Create action row**

```typescript
// src/components/tasks/action-row.tsx
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Agent } from "@/lib/types";

interface ActionRowProps {
  agents: Agent[];
  selectedAgentId: string | null;
  onAgentSelect: (agentId: string | null) => void;
  onNewTask: () => void;
}

export function ActionRow({
  agents,
  selectedAgentId,
  onAgentSelect,
  onNewTask,
}: ActionRowProps) {
  return (
    <div className="flex items-center gap-4 px-4 py-3">
      <Button onClick={onNewTask} className="gap-1.5">
        <Plus className="size-4" />
        New task
      </Button>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onAgentSelect(null)}
          className={cn(
            "px-3 py-1.5 text-sm rounded-md transition-colors",
            selectedAgentId === null
              ? "bg-muted text-foreground font-medium"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
        >
          All
        </button>
        {agents.map((agent) => (
          <button
            key={agent.id}
            onClick={() => onAgentSelect(agent.id)}
            className={cn(
              "px-3 py-1.5 text-sm rounded-md transition-colors",
              selectedAgentId === agent.id
                ? "bg-muted text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            {agent.name}
          </button>
        ))}
      </div>

      {/* Project filter - disabled for now */}
      <div className="ml-auto">
        <Button variant="outline" size="sm" disabled className="opacity-50">
          All projects
        </Button>
      </div>
    </div>
  );
}
```

**Step 2: Verify build**

```bash
pnpm build
```

Expected: Build succeeds.

**Step 3: Commit**

```bash
git add src/components/tasks/action-row.tsx
git commit -m "feat: add action row with agent filters"
```

---

## Task 10: Create Task Card Component

**Files:**
- Create: `src/components/tasks/task-card.tsx`

**Step 1: Create task card**

```typescript
// src/components/tasks/task-card.tsx
import type { Task, TaskStatus } from "@/lib/types";
import { AgentAvatar } from "@/components/shared/agent-avatar";
import { RelativeTime } from "@/components/shared/relative-time";
import { cn } from "@/lib/utils";

const statusDotColors: Record<TaskStatus, string> = {
  inbox: "bg-blue-500",
  assigned: "bg-blue-500",
  in_progress: "bg-blue-500",
  review: "bg-yellow-500",
  done: "bg-green-500",
};

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
}

export function TaskCard({ task, onClick }: TaskCardProps) {
  const assignee = task.assignees?.[0];

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-lg border border-border bg-card p-3 hover:bg-muted/50 transition-colors"
    >
      {/* Title with status dot */}
      <div className="flex items-start gap-2">
        <span
          className={cn(
            "mt-1.5 size-2 rounded-full shrink-0",
            statusDotColors[task.status]
          )}
        />
        <h3 className="font-medium text-sm line-clamp-2">{task.title}</h3>
      </div>

      {/* Description */}
      {task.description && (
        <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2 ml-4">
          {task.description}
        </p>
      )}

      {/* Footer: Agent + Time */}
      <div className="mt-3 flex items-center justify-between ml-4">
        {assignee ? (
          <div className="flex items-center gap-1.5">
            <AgentAvatar
              avatar={assignee.avatar}
              name={assignee.name}
              size="sm"
            />
            <span className="text-xs text-primary">{assignee.name}</span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">Unassigned</span>
        )}
        <RelativeTime
          date={task.updatedAt}
          className="text-xs text-muted-foreground"
        />
      </div>
    </button>
  );
}
```

**Step 2: Verify build**

```bash
pnpm build
```

Expected: Build succeeds.

**Step 3: Commit**

```bash
git add src/components/tasks/task-card.tsx
git commit -m "feat: add task card component"
```

---

## Task 11: Create Kanban Column Component

**Files:**
- Create: `src/components/tasks/kanban-column.tsx`

**Step 1: Create kanban column**

```typescript
// src/components/tasks/kanban-column.tsx
import { Plus } from "lucide-react";
import type { Task, TaskStatus } from "@/lib/types";
import { TaskCard } from "./task-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const statusDotColors: Record<string, string> = {
  backlog: "bg-blue-500",
  in_progress: "bg-blue-500",
  review: "bg-yellow-500",
  done: "bg-green-500",
};

interface KanbanColumnProps {
  id: string;
  label: string;
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  onAddTask?: () => void;
}

export function KanbanColumn({
  id,
  label,
  tasks,
  onTaskClick,
  onAddTask,
}: KanbanColumnProps) {
  return (
    <div className="flex flex-col min-w-[280px] max-w-[320px]">
      {/* Header */}
      <div className="flex items-center justify-between px-1 py-2">
        <div className="flex items-center gap-2">
          <span className={cn("size-2 rounded-full", statusDotColors[id])} />
          <span className="font-medium text-sm">{label}</span>
          <span className="text-sm text-muted-foreground">{tasks.length}</span>
        </div>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onAddTask}
          title={`Add task to ${label}`}
        >
          <Plus className="size-4" />
        </Button>
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-2 flex-1 overflow-y-auto py-1">
        {tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground px-1">No tasks</p>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onClick={() => onTaskClick?.(task)}
            />
          ))
        )}
      </div>
    </div>
  );
}
```

**Step 2: Verify build**

```bash
pnpm build
```

Expected: Build succeeds.

**Step 3: Commit**

```bash
git add src/components/tasks/kanban-column.tsx
git commit -m "feat: add kanban column component"
```

---

## Task 12: Create Kanban Board Component

**Files:**
- Create: `src/components/tasks/kanban-board.tsx`

**Step 1: Create kanban board**

```typescript
// src/components/tasks/kanban-board.tsx
import type { Task, TaskStatus } from "@/lib/types";
import { KanbanColumn } from "./kanban-column";

// Map display columns to task statuses
const columns = [
  { id: "backlog", label: "Backlog", statuses: ["inbox", "assigned"] as TaskStatus[] },
  { id: "in_progress", label: "In Progress", statuses: ["in_progress"] as TaskStatus[] },
  { id: "review", label: "Review", statuses: ["review"] as TaskStatus[] },
  { id: "done", label: "Done", statuses: ["done"] as TaskStatus[] },
];

interface KanbanBoardProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  onAddTask?: (column: string) => void;
}

export function KanbanBoard({ tasks, onTaskClick, onAddTask }: KanbanBoardProps) {
  return (
    <div className="flex gap-4 overflow-x-auto p-4 flex-1">
      {columns.map((column) => {
        const columnTasks = tasks.filter((t) =>
          column.statuses.includes(t.status)
        );
        return (
          <KanbanColumn
            key={column.id}
            id={column.id}
            label={column.label}
            tasks={columnTasks}
            onTaskClick={onTaskClick}
            onAddTask={() => onAddTask?.(column.id)}
          />
        );
      })}
    </div>
  );
}
```

**Step 2: Verify build**

```bash
pnpm build
```

Expected: Build succeeds.

**Step 3: Commit**

```bash
git add src/components/tasks/kanban-board.tsx
git commit -m "feat: add kanban board component"
```

---

## Task 13: Create Activity Timeline Component

**Files:**
- Create: `src/components/activity/activity-timeline.tsx`

**Step 1: Create activity timeline**

```typescript
// src/components/activity/activity-timeline.tsx
import type { Activity, ActivityType } from "@/lib/types";
import { RelativeTime } from "@/components/shared/relative-time";
import { cn } from "@/lib/utils";

const activityDotColors: Record<ActivityType, string> = {
  task_created: "bg-green-500",
  task_updated: "bg-blue-500",
  status_changed: "bg-yellow-500",
  message_sent: "bg-purple-500",
  document_created: "bg-cyan-500",
  audit_completed: "bg-orange-500",
};

const activityVerbs: Record<ActivityType, string> = {
  task_created: "created",
  task_updated: "updated",
  status_changed: "moved",
  message_sent: "commented on",
  document_created: "created document for",
  audit_completed: "completed audit for",
};

interface ActivityItemProps {
  activity: Activity;
}

function ActivityItem({ activity }: ActivityItemProps) {
  const agentName = activity.agent?.name ?? "Unknown";
  const taskTitle = activity.task?.title ?? "Unknown task";
  const verb = activityVerbs[activity.type];

  return (
    <div className="flex gap-3 py-2">
      <span
        className={cn(
          "mt-1.5 size-2 rounded-full shrink-0",
          activityDotColors[activity.type]
        )}
      />
      <div className="flex flex-col gap-0.5 min-w-0">
        <p className="text-sm">
          <span className="font-medium">{agentName}</span>{" "}
          <span className="text-muted-foreground">{verb}</span>{" "}
          <span className="text-primary truncate">{taskTitle}</span>
        </p>
        <RelativeTime
          date={activity.createdAt}
          className="text-xs text-muted-foreground"
        />
      </div>
    </div>
  );
}

interface ActivityTimelineProps {
  activities: Activity[];
}

export function ActivityTimeline({ activities }: ActivityTimelineProps) {
  return (
    <aside className="w-[280px] border-l border-border flex flex-col">
      <h3 className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Activity
      </h3>
      <div className="flex-1 overflow-y-auto px-4">
        {activities.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recent activity</p>
        ) : (
          activities.map((activity) => (
            <ActivityItem key={activity.id} activity={activity} />
          ))
        )}
      </div>
    </aside>
  );
}
```

**Step 2: Verify build**

```bash
pnpm build
```

Expected: Build succeeds.

**Step 3: Commit**

```bash
git add src/components/activity/activity-timeline.tsx
git commit -m "feat: add activity timeline component"
```

---

## Task 14: Create Task Modal Component

**Files:**
- Create: `src/components/tasks/task-modal.tsx`

**Step 1: Create task modal**

```typescript
// src/components/tasks/task-modal.tsx
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { Agent, TaskStatus } from "@/lib/types";

interface TaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agents: Agent[];
  defaultStatus?: string;
  onSubmit: (data: {
    title: string;
    description: string;
    status: TaskStatus;
    assigneeId: string | null;
  }) => void;
}

export function TaskModal({
  open,
  onOpenChange,
  agents,
  defaultStatus = "inbox",
  onSubmit,
}: TaskModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskStatus>(defaultStatus as TaskStatus);
  const [assigneeId, setAssigneeId] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit({ title: title.trim(), description: description.trim(), status, assigneeId });
    // Reset form
    setTitle("");
    setDescription("");
    setStatus("inbox");
    setAssigneeId(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title..."
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Task description..."
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="inbox">Backlog</option>
                <option value="in_progress">In Progress</option>
                <option value="review">Review</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="assignee">Assignee</Label>
              <select
                id="assignee"
                value={assigneeId ?? ""}
                onChange={(e) => setAssigneeId(e.target.value || null)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Unassigned</option>
                {agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit">Create</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

**Step 2: Verify build**

```bash
pnpm build
```

Expected: Build succeeds.

**Step 3: Commit**

```bash
git add src/components/tasks/task-modal.tsx
git commit -m "feat: add task modal component"
```

---

## Task 15: Create Task Drawer Component

**Files:**
- Create: `src/components/tasks/task-drawer.tsx`

**Step 1: Create task drawer**

```typescript
// src/components/tasks/task-drawer.tsx
import { X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { AgentAvatar } from "@/components/shared/agent-avatar";
import { RelativeTime } from "@/components/shared/relative-time";
import type { Task, Agent, Message, TaskStatus } from "@/lib/types";
import { useState } from "react";

interface TaskDrawerProps {
  task: Task | null;
  messages: Message[];
  agents: Agent[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange?: (taskId: string, status: TaskStatus) => void;
  onAssigneeChange?: (taskId: string, agentId: string | null) => void;
  onAddComment?: (taskId: string, content: string) => void;
}

export function TaskDrawer({
  task,
  messages,
  agents,
  open,
  onOpenChange,
  onStatusChange,
  onAssigneeChange,
  onAddComment,
}: TaskDrawerProps) {
  const [comment, setComment] = useState("");

  if (!task) return null;

  const handleAddComment = () => {
    if (!comment.trim()) return;
    onAddComment?.(task.id, comment.trim());
    setComment("");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px] flex flex-col">
        <SheetHeader className="flex-row items-center justify-between space-y-0">
          <SheetTitle className="text-lg">{task.title}</SheetTitle>
          <SheetClose asChild>
            <Button variant="ghost" size="icon-sm">
              <X className="size-4" />
            </Button>
          </SheetClose>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto space-y-6 py-4">
          {/* Status & Assignee */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <select
                value={task.status}
                onChange={(e) =>
                  onStatusChange?.(task.id, e.target.value as TaskStatus)
                }
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="inbox">Backlog</option>
                <option value="in_progress">In Progress</option>
                <option value="review">Review</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Assignee</Label>
              <select
                value={task.assignees?.[0]?.id ?? ""}
                onChange={(e) =>
                  onAssigneeChange?.(task.id, e.target.value || null)
                }
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Unassigned</option>
                {agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Description</Label>
            <p className="text-sm text-muted-foreground">
              {task.description || "No description"}
            </p>
          </div>

          <Separator />

          {/* Comments */}
          <div className="space-y-4">
            <Label>Comments</Label>
            {messages.length === 0 ? (
              <p className="text-sm text-muted-foreground">No comments yet</p>
            ) : (
              <div className="space-y-3">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className="rounded-lg border border-border p-3 space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      {msg.fromAgent && (
                        <>
                          <AgentAvatar
                            avatar={msg.fromAgent.avatar}
                            name={msg.fromAgent.name}
                            size="sm"
                          />
                          <span className="text-sm font-medium">
                            {msg.fromAgent.name}
                          </span>
                        </>
                      )}
                      <RelativeTime
                        date={msg.createdAt}
                        className="text-xs text-muted-foreground ml-auto"
                      />
                    </div>
                    <p className="text-sm">{msg.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Add comment */}
        <div className="border-t border-border pt-4 space-y-2">
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Type a comment..."
            rows={2}
          />
          <Button onClick={handleAddComment} disabled={!comment.trim()}>
            Send
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
```

**Step 2: Verify build**

```bash
pnpm build
```

Expected: Build succeeds.

**Step 3: Commit**

```bash
git add src/components/tasks/task-drawer.tsx
git commit -m "feat: add task drawer component"
```

---

## Task 16: Create Tasks Page

**Files:**
- Create: `src/pages/tasks.tsx`

**Step 1: Create tasks page**

```typescript
// src/pages/tasks.tsx
import { useState, useMemo } from "react";
import { Header } from "@/components/layout/header";
import { StatsRow } from "@/components/tasks/stats-row";
import { ActionRow } from "@/components/tasks/action-row";
import { KanbanBoard } from "@/components/tasks/kanban-board";
import { ActivityTimeline } from "@/components/activity/activity-timeline";
import { TaskModal } from "@/components/tasks/task-modal";
import { TaskDrawer } from "@/components/tasks/task-drawer";
import { mockAgents, mockTasks, mockActivities } from "@/lib/mock-data";
import type { Task, TaskStats, TaskStatus } from "@/lib/types";

export function TasksPage() {
  const [isPaused, setIsPaused] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [tasks, setTasks] = useState(mockTasks);

  // Filter tasks by selected agent
  const filteredTasks = useMemo(() => {
    if (!selectedAgentId) return tasks;
    return tasks.filter((t) =>
      t.assignees?.some((a) => a.id === selectedAgentId)
    );
  }, [tasks, selectedAgentId]);

  // Calculate stats
  const stats: TaskStats = useMemo(() => {
    const backlog = tasks.filter(
      (t) => t.status === "inbox" || t.status === "assigned"
    ).length;
    const inProgress = tasks.filter((t) => t.status === "in_progress").length;
    const total = tasks.length;
    const done = tasks.filter((t) => t.status === "done").length;
    const completionPercent = total > 0 ? Math.round((done / total) * 100) : 0;
    return { backlog, inProgress, total, completionPercent };
  }, [tasks]);

  const handleRefresh = () => {
    console.log("Refreshing data...");
  };

  const handleCreateTask = (data: {
    title: string;
    description: string;
    status: TaskStatus;
    assigneeId: string | null;
  }) => {
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: data.title,
      description: data.description,
      status: data.status,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      assignees: data.assigneeId
        ? [mockAgents.find((a) => a.id === data.assigneeId)!]
        : [],
    };
    setTasks((prev) => [...prev, newTask]);
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <Header
        isPaused={isPaused}
        onTogglePause={() => setIsPaused(!isPaused)}
        onRefresh={handleRefresh}
      />
      <StatsRow stats={stats} />
      <ActionRow
        agents={mockAgents}
        selectedAgentId={selectedAgentId}
        onAgentSelect={setSelectedAgentId}
        onNewTask={() => setIsModalOpen(true)}
      />

      <div className="flex flex-1 overflow-hidden">
        <KanbanBoard
          tasks={filteredTasks}
          onTaskClick={setSelectedTask}
          onAddTask={(column) => {
            console.log("Add task to column:", column);
            setIsModalOpen(true);
          }}
        />
        <ActivityTimeline activities={mockActivities} />
      </div>

      <TaskModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        agents={mockAgents}
        onSubmit={handleCreateTask}
      />

      <TaskDrawer
        task={selectedTask}
        messages={[]}
        agents={mockAgents}
        open={!!selectedTask}
        onOpenChange={(open) => !open && setSelectedTask(null)}
      />
    </div>
  );
}
```

**Step 2: Verify build**

```bash
pnpm build
```

Expected: Build succeeds.

**Step 3: Commit**

```bash
git add src/pages/tasks.tsx
git commit -m "feat: add tasks page composition"
```

---

## Task 17: Update App.tsx to Use Tasks Page

**Files:**
- Modify: `src/App.tsx`

**Step 1: Update App.tsx**

Replace the entire contents of `src/App.tsx`:

```typescript
// src/App.tsx
import { TasksPage } from "@/pages/tasks";

export function App() {
  return <TasksPage />;
}

export default App;
```

**Step 2: Verify build**

```bash
pnpm build
```

Expected: Build succeeds.

**Step 3: Test visually**

```bash
pnpm dev
```

Open http://localhost:5173 and verify:
- Header shows with logo, nav, controls
- Stats row shows counts
- Kanban board shows columns with cards
- Activity timeline shows on right
- Clicking "New task" opens modal
- Clicking a task card opens drawer
- Theme toggle works

**Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "feat: wire up tasks page as main view"
```

---

## Task 18: Clean Up Unused Files

**Files:**
- Delete: `src/components/component-example.tsx`
- Delete: `src/components/example.tsx`

**Step 1: Remove unused files**

```bash
rm src/components/component-example.tsx src/components/example.tsx
```

**Step 2: Verify build**

```bash
pnpm build
```

Expected: Build succeeds.

**Step 3: Commit**

```bash
git add -A
git commit -m "chore: remove unused example components"
```

---

## Summary

After completing all tasks, you will have:

1. Schema updated with `avatar` column
2. TypeScript types for all entities
3. Mock data for development
4. Shared components: AgentAvatar, RelativeTime
5. Layout components: Header, ThemeToggle
6. Task components: StatsRow, ActionRow, KanbanBoard, KanbanColumn, TaskCard, TaskModal, TaskDrawer
7. Activity components: ActivityTimeline
8. Tasks page composing everything
9. Working UI with mock data

Next steps (future tasks):
- WebSocket integration with Gateway
- Real data fetching
- Task mutations (update status, assignee)
- Comment creation
