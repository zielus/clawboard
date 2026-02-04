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
