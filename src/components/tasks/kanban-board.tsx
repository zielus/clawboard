import type { Task, TaskStatus } from "@/lib/types";
import { KanbanColumn } from "./kanban-column";

type ColumnId = "backlog" | "in_progress" | "review" | "done";

// Map display columns to task statuses
const columns: { id: ColumnId; label: string; statuses: TaskStatus[] }[] = [
  { id: "backlog", label: "Backlog", statuses: ["inbox", "assigned"] },
  { id: "in_progress", label: "In Progress", statuses: ["in_progress"] },
  { id: "review", label: "Review", statuses: ["review"] },
  { id: "done", label: "Done", statuses: ["done"] },
];

interface KanbanBoardProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  onAddTask?: (column: string) => void;
}

export function KanbanBoard({ tasks, onTaskClick, onAddTask }: KanbanBoardProps) {
  return (
    <div className="flex gap-3 overflow-x-auto p-4 flex-1">
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
