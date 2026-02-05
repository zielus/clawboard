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
      className="group cursor-grab py-0 gap-0 rounded-lg shadow-none ring-0 border border-border bg-card transition-all hover:border-primary/30 hover:bg-accent/50 active:cursor-grabbing"
      onClick={onClick}
    >
      <CardContent className="p-3 px-3">
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
