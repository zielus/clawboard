import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GripVertical } from "lucide-react";
import type { Task, TaskStatus } from "@/lib/types";

interface KanbanBoardProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
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
      className="group cursor-grab rounded-lg border-0 bg-card/80 shadow-sm ring-1 ring-border/50 backdrop-blur-sm transition-all hover:bg-card hover:shadow-md hover:ring-border active:cursor-grabbing"
      onClick={onClick}
    >
      <CardContent className="p-2.5">
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-sm font-medium leading-snug text-foreground">{task.title}</h4>
          <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground/50 opacity-0 transition-opacity group-hover:opacity-100" />
        </div>
        {task.description && (
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {task.description}
          </p>
        )}
        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {firstAssignee ? (
              <>
                <Avatar className="h-5 w-5">
                  <AvatarImage src={firstAssignee.avatar || undefined} alt={firstAssignee.name} />
                  <AvatarFallback className="text-[8px]">
                    {getInitials(firstAssignee.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-[11px] text-muted-foreground">
                  {firstAssignee.name.split(" ")[0]}
                </span>
                {task.assignees && task.assignees.length > 1 && (
                  <span className="text-[11px] text-muted-foreground">
                    +{task.assignees.length - 1}
                  </span>
                )}
              </>
            ) : (
              <span className="text-[11px] text-muted-foreground">Unassigned</span>
            )}
          </div>
          <span className="text-[11px] text-muted-foreground">{formatDate(task.createdAt)}</span>
        </div>
      </CardContent>
    </Card>
  );
}

export function KanbanBoard({ tasks, onTaskClick }: KanbanBoardProps) {
  const getTasksByStatus = (status: TaskStatus) => tasks.filter((t) => t.status === status);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex flex-1 gap-4 overflow-x-auto p-4">
        {columns.map((column) => {
          const columnTasks = getTasksByStatus(column.id);
          return (
            <div key={column.id} className="flex h-full min-w-64 flex-1 flex-col">
              <div className="flex items-center gap-2 px-1 pb-3">
                <span className={`h-2.5 w-2.5 rounded-full ${column.color}`} />
                <h3 className="text-sm font-medium text-foreground">{column.title}</h3>
                <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  {columnTasks.length}
                </span>
              </div>
              <ScrollArea className="flex-1">
                <div className="space-y-2 px-1 pb-4">
                  {columnTasks.length > 0 ? (
                    columnTasks.map((task) => (
                      <TaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} />
                    ))
                  ) : (
                    <div className="flex h-20 items-center justify-center rounded-lg border border-dashed border-border/50">
                      <p className="text-xs text-muted-foreground/60">No tasks</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          );
        })}
      </div>
    </div>
  );
}
