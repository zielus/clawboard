// src/components/tasks/task-drawer.tsx
import { X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { AgentAvatar } from "@/components/shared/agent-avatar";
import { RelativeTime } from "@/components/shared/relative-time";
import type { Task, Agent, Message, TaskStatus } from "@/lib/types";
import { useState } from "react";

interface TaskDrawerProps {
  task: Task | null;
  messages: Message[];
  agents: Agent[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange?: (taskId: string, status: TaskStatus) => void;
  onAssigneeChange?: (taskId: string, agentId: string | null) => void;
  onAddComment?: (taskId: string, content: string) => void;
}

export function TaskDrawer({
  task,
  messages,
  agents,
  open,
  onOpenChange,
  onStatusChange,
  onAssigneeChange,
  onAddComment,
}: TaskDrawerProps) {
  const [comment, setComment] = useState("");

  if (!task) return null;

  const handleAddComment = () => {
    if (!comment.trim()) return;
    onAddComment?.(task.id, comment.trim());
    setComment("");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px] flex flex-col" showCloseButton={false}>
        <SheetHeader className="flex-row items-center justify-between space-y-0">
          <SheetTitle className="text-lg">{task.title}</SheetTitle>
          <SheetClose asChild>
            <Button variant="ghost" size="icon-sm">
              <X className="size-4" />
            </Button>
          </SheetClose>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto space-y-6 py-4">
          {/* Status & Assignee */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <select
                value={task.status}
                onChange={(e) =>
                  onStatusChange?.(task.id, e.target.value as TaskStatus)
                }
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="inbox">Backlog</option>
                <option value="in_progress">In Progress</option>
                <option value="review">Review</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Assignee</Label>
              <select
                value={task.assignees?.[0]?.id ?? ""}
                onChange={(e) =>
                  onAssigneeChange?.(task.id, e.target.value || null)
                }
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Unassigned</option>
                {agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Description</Label>
            <p className="text-sm text-muted-foreground">
              {task.description || "No description"}
            </p>
          </div>

          <Separator />

          {/* Comments */}
          <div className="space-y-4">
            <Label>Comments</Label>
            {messages.length === 0 ? (
              <p className="text-sm text-muted-foreground">No comments yet</p>
            ) : (
              <div className="space-y-3">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className="rounded-lg border border-border p-3 space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      {msg.fromAgent && (
                        <>
                          <AgentAvatar
                            avatar={msg.fromAgent.avatar}
                            name={msg.fromAgent.name}
                            size="sm"
                          />
                          <span className="text-sm font-medium">
                            {msg.fromAgent.name}
                          </span>
                        </>
                      )}
                      <RelativeTime
                        date={msg.createdAt}
                        className="text-xs text-muted-foreground ml-auto"
                      />
                    </div>
                    <p className="text-sm">{msg.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Add comment */}
        <div className="border-t border-border pt-4 space-y-2">
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Type a comment..."
            rows={2}
          />
          <Button onClick={handleAddComment} disabled={!comment.trim()}>
            Send
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
