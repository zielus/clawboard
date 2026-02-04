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
