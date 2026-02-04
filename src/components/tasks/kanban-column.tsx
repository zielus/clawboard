// src/components/tasks/kanban-column.tsx
import { Plus } from "lucide-react";
import type { Task } from "@/lib/types";
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
