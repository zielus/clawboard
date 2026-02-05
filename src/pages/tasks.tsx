// src/pages/tasks.tsx
import { useState, useMemo } from "react";
import { Header } from "@/components/layout/header";
import { AgentsColumn } from "@/components/agents/agents-column";
import { KanbanBoard } from "@/components/tasks/kanban-board";
import { ActivityTimeline } from "@/components/activity/activity-timeline";
import { mockAgents, mockTasks, mockActivities } from "@/lib/mock-data";
import type { Task, TaskStatus } from "@/lib/types";

export function TasksPage() {
  const [isPaused, setIsPaused] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [tasks, setTasks] = useState(mockTasks);

  // Calculate stats for all 4 columns
  const stats = useMemo(() => {
    const backlog = tasks.filter((t) => t.status === "backlog").length;
    const inProgress = tasks.filter((t) => t.status === "in_progress").length;
    const review = tasks.filter((t) => t.status === "review").length;
    const done = tasks.filter((t) => t.status === "done").length;
    return { backlog, inProgress, review, done };
  }, [tasks]);

  const handleRefresh = () => {
    console.log("Refreshing data...");
  };

  const handleAddTask = (status: TaskStatus) => {
    console.log("Add task to column:", status);
    // TODO: Open task modal
  };

  return (
    <div className="flex h-screen flex-col bg-background">
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
          onAddTask={handleAddTask}
        />
        <ActivityTimeline activities={mockActivities} />
      </div>
    </div>
  );
}
