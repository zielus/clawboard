# UI Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Improve visual hierarchy so important details are easier to spot at a glance.

**Architecture:** Three-column layout (Agents | Kanban | Activity) with stats moved to header, consistent Card-based styling for agent cards and activity items, centralized color system via CSS variables and TypeScript constants.

**Tech Stack:** React 19, Tailwind CSS v4, shadcn/ui components, Lucide icons

---

## Task 1: Add CSS Variables for Status Colors

**Files:**
- Modify: `src/index.css:8-41` (add variables to `:root`)
- Modify: `src/index.css:43-75` (add variables to `.dark`)

**Step 1: Add status color variables to `:root`**

Add after line 31 (after `--radius`), before the sidebar variables:

```css
    --status-backlog: oklch(0.55 0.01 260);
    --status-in-progress: oklch(0.65 0.20 250);
    --status-review: oklch(0.75 0.15 85);
    --status-done: oklch(0.65 0.17 145);
    --agent-idle: oklch(0.55 0.01 260);
    --agent-active: oklch(0.65 0.17 145);
    --agent-blocked: oklch(0.60 0.20 25);
    --column-bg-backlog: oklch(0.55 0.01 260 / 5%);
    --column-bg-in-progress: oklch(0.65 0.20 250 / 5%);
    --column-bg-review: oklch(0.75 0.15 85 / 5%);
    --column-bg-done: oklch(0.65 0.17 145 / 5%);
```

**Step 2: Add status color variables to `.dark`**

Add after `--chart-5` in `.dark` section:

```css
    --status-backlog: oklch(0.60 0.01 260);
    --status-in-progress: oklch(0.70 0.18 250);
    --status-review: oklch(0.80 0.13 85);
    --status-done: oklch(0.70 0.15 145);
    --agent-idle: oklch(0.60 0.01 260);
    --agent-active: oklch(0.70 0.15 145);
    --agent-blocked: oklch(0.65 0.18 25);
    --column-bg-backlog: oklch(0.60 0.01 260 / 8%);
    --column-bg-in-progress: oklch(0.70 0.18 250 / 8%);
    --column-bg-review: oklch(0.80 0.13 85 / 8%);
    --column-bg-done: oklch(0.70 0.15 145 / 8%);
```

**Step 3: Run dev server to verify no CSS errors**

Run: `pnpm dev`
Expected: Server starts without CSS parsing errors

**Step 4: Commit**

```bash
git add src/index.css
git commit -m "feat: add CSS variables for status colors and column backgrounds"
```

---

## Task 2: Create Constants File

**Files:**
- Create: `src/lib/constants.ts`

**Step 1: Create constants file with color mappings**

```typescript
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
```

**Step 2: Verify TypeScript compiles**

Run: `pnpm build`
Expected: Build succeeds with no type errors

**Step 3: Commit**

```bash
git add src/lib/constants.ts
git commit -m "feat: add color constants for task and agent statuses"
```

---

## Task 3: Create StatusDot Component

**Files:**
- Create: `src/components/shared/status-dot.tsx`

**Step 1: Create the StatusDot component**

```typescript
// src/components/shared/status-dot.tsx
import { cn } from "@/lib/utils";

interface StatusDotProps {
  color: string;
  size?: "sm" | "md";
  className?: string;
}

export function StatusDot({ color, size = "md", className }: StatusDotProps) {
  return (
    <span
      className={cn(
        "rounded-full shrink-0",
        size === "sm" ? "size-1.5" : "size-2",
        className
      )}
      style={{ backgroundColor: color }}
    />
  );
}
```

**Step 2: Verify the component renders**

Run: `pnpm dev`
Expected: No errors, component can be imported

**Step 3: Commit**

```bash
git add src/components/shared/status-dot.tsx
git commit -m "feat: add reusable StatusDot component"
```

---

## Task 4: Refactor TaskCard to Use shadcn Card

**Files:**
- Modify: `src/components/tasks/task-card.tsx`

**Step 1: Rewrite TaskCard using Card components**

```typescript
// src/components/tasks/task-card.tsx
import type { Task } from "@/lib/types";
import { AgentAvatar } from "@/components/shared/agent-avatar";
import { RelativeTime } from "@/components/shared/relative-time";
import { StatusDot } from "@/components/shared/status-dot";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { TASK_STATUS_COLORS } from "@/lib/constants";

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
}

export function TaskCard({ task, onClick }: TaskCardProps) {
  const assignee = task.assignees?.[0];

  return (
    <Card
      size="sm"
      className="cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={onClick}
    >
      <CardHeader className="flex-row items-start gap-2">
        <StatusDot color={TASK_STATUS_COLORS[task.status]} className="mt-1" />
        <div className="flex flex-col gap-1 min-w-0">
          <CardTitle className="line-clamp-2">{task.title}</CardTitle>
          {task.description && (
            <CardDescription className="line-clamp-2">
              {task.description}
            </CardDescription>
          )}
        </div>
      </CardHeader>
      <CardFooter className="justify-between">
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
      </CardFooter>
    </Card>
  );
}
```

**Step 2: Verify TaskCard renders correctly**

Run: `pnpm dev`
Expected: Task cards display with Card styling, status dot, title, description, assignee, and timestamp

**Step 3: Commit**

```bash
git add src/components/tasks/task-card.tsx
git commit -m "refactor: TaskCard to use shadcn Card components and StatusDot"
```

---

## Task 5: Update KanbanColumn with Background Colors

**Files:**
- Modify: `src/components/tasks/kanban-column.tsx`

**Step 1: Update KanbanColumn to use StatusDot and column backgrounds**

```typescript
// src/components/tasks/kanban-column.tsx
import { Plus } from "lucide-react";
import type { Task } from "@/lib/types";
import { TaskCard } from "./task-card";
import { StatusDot } from "@/components/shared/status-dot";
import { Button } from "@/components/ui/button";
import { TASK_STATUS_COLORS, COLUMN_BACKGROUNDS } from "@/lib/constants";

type ColumnId = "backlog" | "in_progress" | "review" | "done";

interface KanbanColumnProps {
  id: ColumnId;
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
  // Map column id to status color
  const dotColor = id === "backlog"
    ? TASK_STATUS_COLORS.inbox
    : TASK_STATUS_COLORS[id as keyof typeof TASK_STATUS_COLORS];

  return (
    <div
      className="flex flex-col min-w-[280px] max-w-[320px] rounded-lg p-2"
      style={{ backgroundColor: COLUMN_BACKGROUNDS[id] }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-1 py-2">
        <div className="flex items-center gap-2">
          <StatusDot color={dotColor} />
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

**Step 2: Update KanbanBoard to add gap between columns**

Modify `src/components/tasks/kanban-board.tsx` to add gap:

```typescript
// In the return statement, change the container div className:
<div className="flex gap-3 flex-1 overflow-x-auto p-4">
```

**Step 3: Verify columns have tinted backgrounds**

Run: `pnpm dev`
Expected: Each kanban column has a subtle tinted background matching its status color

**Step 4: Commit**

```bash
git add src/components/tasks/kanban-column.tsx src/components/tasks/kanban-board.tsx
git commit -m "feat: add column backgrounds and StatusDot to KanbanColumn"
```

---

## Task 6: Create AgentCard Component

**Files:**
- Create: `src/components/agents/agent-card.tsx`

**Step 1: Create the AgentCard component**

```typescript
// src/components/agents/agent-card.tsx
import type { Agent } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { AgentAvatar } from "@/components/shared/agent-avatar";
import { RelativeTime } from "@/components/shared/relative-time";
import { StatusDot } from "@/components/shared/status-dot";
import { AGENT_STATUS_COLORS, AGENT_STATUS_LABELS } from "@/lib/constants";

interface AgentCardProps {
  agent: Agent;
}

export function AgentCard({ agent }: AgentCardProps) {
  return (
    <Card size="sm">
      <CardContent className="flex gap-3">
        <AgentAvatar avatar={agent.avatar} name={agent.name} size="md" />
        <div className="flex flex-col min-w-0 flex-1">
          <span className="font-medium text-sm truncate">{agent.name}</span>
          {agent.role && (
            <span className="text-xs text-muted-foreground truncate">
              {agent.role}
            </span>
          )}
          <div className="flex items-center justify-between mt-1">
            <div className="flex items-center gap-1.5">
              <StatusDot color={AGENT_STATUS_COLORS[agent.status]} size="sm" />
              <span className="text-xs text-muted-foreground">
                {AGENT_STATUS_LABELS[agent.status]}
              </span>
            </div>
            <RelativeTime
              date={agent.updatedAt}
              className="text-xs text-muted-foreground"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

**Step 2: Verify component compiles**

Run: `pnpm build`
Expected: Build succeeds with no type errors

**Step 3: Commit**

```bash
git add src/components/agents/agent-card.tsx
git commit -m "feat: add AgentCard component"
```

---

## Task 7: Create AgentsColumn Component

**Files:**
- Create: `src/components/agents/agents-column.tsx`

**Step 1: Create the AgentsColumn component**

```typescript
// src/components/agents/agents-column.tsx
import type { Agent } from "@/lib/types";
import { AgentCard } from "./agent-card";

interface AgentsColumnProps {
  agents: Agent[];
}

export function AgentsColumn({ agents }: AgentsColumnProps) {
  return (
    <aside className="w-[240px] flex flex-col bg-muted/30">
      <h3 className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Agents
      </h3>
      <div className="flex-1 overflow-y-auto px-3 pb-3">
        <div className="flex flex-col gap-2">
          {agents.length === 0 ? (
            <p className="text-sm text-muted-foreground px-1">No agents</p>
          ) : (
            agents.map((agent) => <AgentCard key={agent.id} agent={agent} />)
          )}
        </div>
      </div>
    </aside>
  );
}
```

**Step 2: Verify component compiles**

Run: `pnpm build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/components/agents/agents-column.tsx
git commit -m "feat: add AgentsColumn component"
```

---

## Task 8: Restyle ActivityTimeline with Cards

**Files:**
- Modify: `src/components/activity/activity-timeline.tsx`

**Step 1: Update ActivityTimeline to use Card components and avatars**

```typescript
// src/components/activity/activity-timeline.tsx
import type { Activity, ActivityType } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { AgentAvatar } from "@/components/shared/agent-avatar";
import { RelativeTime } from "@/components/shared/relative-time";

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
  const agentAvatar = activity.agent?.avatar ?? null;
  const taskTitle = activity.task?.title ?? "Unknown task";
  const verb = activityVerbs[activity.type];

  return (
    <Card size="sm">
      <CardContent className="flex gap-3">
        <AgentAvatar avatar={agentAvatar} name={agentName} size="sm" />
        <div className="flex flex-col min-w-0 flex-1">
          <p className="text-sm">
            <span className="font-medium">{agentName}</span>{" "}
            <span className="text-muted-foreground">{verb}</span>
          </p>
          <p className="text-sm text-primary truncate">"{taskTitle}"</p>
          <RelativeTime
            date={activity.createdAt}
            className="text-xs text-muted-foreground self-end mt-1"
          />
        </div>
      </CardContent>
    </Card>
  );
}

interface ActivityTimelineProps {
  activities: Activity[];
}

export function ActivityTimeline({ activities }: ActivityTimelineProps) {
  return (
    <aside className="w-[280px] flex flex-col bg-muted/30">
      <h3 className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Activity
      </h3>
      <div className="flex-1 overflow-y-auto px-3 pb-3">
        <div className="flex flex-col gap-2">
          {activities.length === 0 ? (
            <p className="text-sm text-muted-foreground px-1">No recent activity</p>
          ) : (
            activities.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))
          )}
        </div>
      </div>
    </aside>
  );
}
```

**Step 2: Verify activity timeline renders with cards**

Run: `pnpm dev`
Expected: Activity items display in cards with avatar, agent name, action, task title, and right-aligned timestamp

**Step 3: Commit**

```bash
git add src/components/activity/activity-timeline.tsx
git commit -m "refactor: ActivityTimeline to use Card components and avatars"
```

---

## Task 9: Create Header Stats Component

**Files:**
- Create: `src/components/layout/header-stats.tsx`

**Step 1: Create the HeaderStats component**

```typescript
// src/components/layout/header-stats.tsx
import type { TaskStats } from "@/lib/types";

interface HeaderStatsProps {
  stats: TaskStats;
}

export function HeaderStats({ stats }: HeaderStatsProps) {
  const items = [
    { label: "Backlog", value: stats.backlog, color: "var(--status-backlog)" },
    { label: "In Progress", value: stats.inProgress, color: "var(--status-in-progress)" },
    { label: "Review", value: stats.total - stats.backlog - stats.inProgress - Math.round(stats.total * stats.completionPercent / 100), color: "var(--status-review)" },
    { label: "Total", value: stats.total, color: "var(--foreground)" },
  ];

  return (
    <div className="flex items-center gap-6">
      {items.map((item) => (
        <div key={item.label} className="flex flex-col items-center">
          <span
            className="text-2xl font-bold"
            style={{ color: item.color }}
          >
            {item.value}
          </span>
          <span className="text-xs text-muted-foreground">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
```

**Step 2: Verify component compiles**

Run: `pnpm build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/components/layout/header-stats.tsx
git commit -m "feat: add HeaderStats component for centered stats display"
```

---

## Task 10: Redesign Header Component

**Files:**
- Modify: `src/components/layout/header.tsx`

**Step 1: Rewrite Header with new layout**

```typescript
// src/components/layout/header.tsx
import { useState } from "react";
import { RefreshCw, Pause, Play, CheckSquare, Brain, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ThemeToggle } from "./theme-toggle";
import { HeaderStats } from "./header-stats";
import { cn } from "@/lib/utils";
import type { TaskStats } from "@/lib/types";

const navItems = [
  { label: "Tasks", href: "/tasks", active: true, icon: CheckSquare },
  { label: "Memory", href: "/memory", disabled: true, icon: Brain },
  { label: "Docs", href: "/docs", disabled: true, icon: FileText },
];

interface HeaderProps {
  stats: TaskStats;
  onRefresh?: () => void;
  isPaused?: boolean;
  onTogglePause?: () => void;
}

export function Header({ stats, onRefresh, isPaused = false, onTogglePause }: HeaderProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    onRefresh?.();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  return (
    <header className="flex h-16 items-center justify-between bg-muted/50 px-4">
      {/* Left: Logo + Nav */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <img src="/logo-no-bg.png" alt="Mission Control" className="size-6" />
          <span className="font-semibold">Mission Control</span>
        </div>

        <nav className="flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                disabled={item.disabled}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors",
                  item.active
                    ? "bg-background text-foreground font-medium shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50",
                  item.disabled && "opacity-50 cursor-not-allowed pointer-events-none"
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Center: Stats */}
      <HeaderStats stats={stats} />

      {/* Right: Controls */}
      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={onTogglePause}
              className={cn(
                "gap-1.5 transition-colors",
                isPaused
                  ? "text-amber-600 hover:text-amber-700"
                  : "text-green-600 hover:text-green-700"
              )}
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
          </TooltipTrigger>
          <TooltipContent>
            {isPaused ? "Resume agents" : "Pause agents"}
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={handleRefresh}>
              <RefreshCw
                className={cn(
                  "size-4 transition-transform duration-1000",
                  isRefreshing && "animate-spin"
                )}
              />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Refresh data</TooltipContent>
        </Tooltip>

        <ThemeToggle />
      </div>
    </header>
  );
}
```

**Step 2: Verify header renders correctly**

Run: `pnpm dev`
Expected: Header shows with taller height, muted background, nav icons, centered stats, colored pause/resume button, rotating refresh

**Step 3: Commit**

```bash
git add src/components/layout/header.tsx
git commit -m "refactor: Header with centered stats, nav icons, tooltips, and animations"
```

---

## Task 11: Update Tasks Page Layout

**Files:**
- Modify: `src/pages/tasks.tsx`

**Step 1: Update TasksPage with three-column layout**

```typescript
// src/pages/tasks.tsx
import { useState, useMemo } from "react";
import { Header } from "@/components/layout/header";
import { AgentsColumn } from "@/components/agents/agents-column";
import { KanbanBoard } from "@/components/tasks/kanban-board";
import { ActivityTimeline } from "@/components/activity/activity-timeline";
import { TaskModal } from "@/components/tasks/task-modal";
import { TaskDrawer } from "@/components/tasks/task-drawer";
import { mockAgents, mockTasks, mockActivities } from "@/lib/mock-data";
import type { Task, TaskStats, TaskStatus } from "@/lib/types";

export function TasksPage() {
  const [isPaused, setIsPaused] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [tasks, setTasks] = useState(mockTasks);

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

**Step 2: Verify three-column layout works**

Run: `pnpm dev`
Expected: Page shows Agents column on left, Kanban in center, Activity on right. Stats are in header. No StatsRow or ActionRow.

**Step 3: Commit**

```bash
git add src/pages/tasks.tsx
git commit -m "refactor: TasksPage with three-column layout and stats in header"
```

---

## Task 12: Remove Deprecated Components

**Files:**
- Delete: `src/components/tasks/stats-row.tsx`
- Delete: `src/components/tasks/action-row.tsx`

**Step 1: Delete stats-row.tsx**

```bash
rm src/components/tasks/stats-row.tsx
```

**Step 2: Delete action-row.tsx**

```bash
rm src/components/tasks/action-row.tsx
```

**Step 3: Verify app still builds**

Run: `pnpm build`
Expected: Build succeeds with no errors about missing imports

**Step 4: Commit**

```bash
git add -A
git commit -m "chore: remove deprecated StatsRow and ActionRow components"
```

---

## Task 13: Final Visual QA and Polish

**Files:**
- Various adjustments as needed

**Step 1: Run the app and check all views**

Run: `pnpm dev`
Check:
- Header height, background, nav icons, centered stats, button colors and animations
- Agents column with cards showing avatar, name, role, status dot + label, timestamp
- Kanban columns with tinted backgrounds, status dots, gap between columns
- Task cards with Card styling, status dot, title, description, assignee, timestamp
- Activity timeline with cards matching agent card style

**Step 2: Fix any visual issues found**

Make adjustments as needed to spacing, colors, or typography.

**Step 3: Run build to ensure no errors**

Run: `pnpm build`
Expected: Build succeeds

**Step 4: Final commit**

```bash
git add -A
git commit -m "polish: final visual adjustments for UI redesign"
```

---

## Summary

After completing all tasks, you will have:

1. **Color System**: CSS variables + TypeScript constants for consistent status colors
2. **StatusDot Component**: Reusable colored dots across the app
3. **Header Redesign**: Taller, muted background, nav with icons, centered stats, animated controls with tooltips
4. **Three-Column Layout**: Agents | Kanban | Activity
5. **AgentCard + AgentsColumn**: Display-only agent list with status info
6. **Task Cards**: Using shadcn Card components with status dots
7. **Kanban Columns**: Tinted backgrounds, no separator lines
8. **Activity Timeline**: Card-based styling matching agents column
9. **Cleanup**: Removed deprecated StatsRow and ActionRow
