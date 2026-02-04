// src/pages/tasks.tsx
import { useState, useMemo } from "react";
import { Header } from "@/components/layout/header";
import { AgentsColumn } from "@/components/agents/agents-column";
import { KanbanBoard } from "@/components/tasks/kanban-board";
import { ActivityTimeline } from "@/components/activity/activity-timeline";
import { TaskModal } from "@/components/tasks/task-modal";
import { TaskDrawer } from "@/components/tasks/task-drawer";
import { mockAgents, mockTasks, mockActivities } from "@/lib/mock-data";
import type { Task, TaskStats, TaskStatus } from "@/lib/types";

export function TasksPage() {
  const [isPaused, setIsPaused] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [tasks, setTasks] = useState(mockTasks);

  // Calculate stats
  const stats: TaskStats = useMemo(() => {
    const backlog = tasks.filter(
      (t) => t.status === "inbox" || t.status === "assigned"
    ).length;
    const inProgress = tasks.filter((t) => t.status === "in_progress").length;
    const total = tasks.length;
    const done = tasks.filter((t) => t.status === "done").length;
    const completionPercent = total > 0 ? Math.round((done / total) * 100) : 0;
    return { backlog, inProgress, total, completionPercent };
  }, [tasks]);

  const handleRefresh = () => {
    console.log("Refreshing data...");
  };

  const handleCreateTask = (data: {
    title: string;
    description: string;
    status: TaskStatus;
    assigneeId: string | null;
  }) => {
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: data.title,
      description: data.description,
      status: data.status,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      assignees: data.assigneeId
        ? [mockAgents.find((a) => a.id === data.assigneeId)!]
        : [],
    };
    setTasks((prev) => [...prev, newTask]);
  };

  return (
    <div className="flex flex-col h-screen bg-background">
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
          onAddTask={(column) => {
            console.log("Add task to column:", column);
            setIsModalOpen(true);
          }}
        />
        <ActivityTimeline activities={mockActivities} />
      </div>

      <TaskModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        agents={mockAgents}
        onSubmit={handleCreateTask}
      />

      <TaskDrawer
        task={selectedTask}
        messages={[]}
        agents={mockAgents}
        open={!!selectedTask}
        onOpenChange={(open) => !open && setSelectedTask(null)}
      />
    </div>
  );
}
