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
