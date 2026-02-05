// src/pages/tasks.tsx
import { useState } from "react";
import { Header } from "@/components/layout/header";
import { KanbanBoard } from "@/components/tasks/kanban-board";
import { ActivityTimeline } from "@/components/activity/activity-timeline";
import { mockTasks, mockActivities } from "@/lib/mock-data";
import type { Task } from "@/lib/types";

export function TasksPage() {
  const [isPaused, setIsPaused] = useState(false);
  const [_selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [tasks] = useState(mockTasks);
  void _selectedTask;

  const handleRefresh = () => {
    console.log("Refreshing data...");
  };

  const handleAddTask = () => {
    console.log("Add new task");
    // TODO: Open task modal
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      <Header
        isPaused={isPaused}
        onTogglePause={() => setIsPaused(!isPaused)}
        onRefresh={handleRefresh}
        onAddTask={handleAddTask}
      />

      <div className="flex flex-1 overflow-hidden">
        <KanbanBoard tasks={tasks} onTaskClick={setSelectedTask} />
        <ActivityTimeline activities={mockActivities} />
      </div>
    </div>
  );
}
