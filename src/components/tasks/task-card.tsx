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
            <CardDescription className="line-clamp-2">{task.description}</CardDescription>
          )}
        </div>
      </CardHeader>
      <CardFooter className="justify-between">
        {assignee ? (
          <div className="flex items-center gap-1.5">
            <AgentAvatar avatar={assignee.avatar} name={assignee.name} size="sm" />
            <span className="text-xs text-primary">{assignee.name}</span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">Unassigned</span>
        )}
        <RelativeTime date={task.updatedAt} className="text-xs text-muted-foreground" />
      </CardFooter>
    </Card>
  );
}
