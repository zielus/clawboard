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
import { cn } from "@/lib/utils";
import type { Task, Agent, Message, TaskStatus } from "@/lib/types";
import { useState } from "react";

// Inlined AgentAvatar component
interface AgentAvatarProps {
  avatar: string | null;
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

function AgentAvatar({ avatar, name, size = "md", className }: AgentAvatarProps) {
  const sizeClasses = {
    sm: "size-5 text-xs",
    md: "size-6 text-sm",
    lg: "size-8 text-base",
  };

  const isEmoji = avatar && /^\p{Emoji}/u.test(avatar);
  const isUrl = avatar && (avatar.startsWith("http://") || avatar.startsWith("https://"));

  if (isUrl) {
    return (
      <img
        src={avatar}
        alt={name}
        className={cn("rounded-full object-cover", sizeClasses[size], className)}
      />
    );
  }

  if (isEmoji) {
    return (
      <span
        className={cn(
          "inline-flex items-center justify-center rounded-full bg-muted",
          sizeClasses[size],
          className
        )}
        title={name}
      >
        {avatar}
      </span>
    );
  }

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground font-medium",
        sizeClasses[size],
        className
      )}
      title={name}
    >
      {initials}
    </span>
  );
}

// Inlined RelativeTime component
interface RelativeTimeProps {
  date: string;
  className?: string;
}

function RelativeTime({ date, className }: RelativeTimeProps) {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  let text: string;
  if (diffMins < 1) {
    text = "just now";
  } else if (diffMins < 60) {
    text = `${diffMins}m ago`;
  } else if (diffHours < 24) {
    text = `${diffHours}h ago`;
  } else if (diffDays === 1) {
    text = "yesterday";
  } else if (diffDays < 7) {
    text = `${diffDays}d ago`;
  } else {
    text = then.toLocaleDateString();
  }

  return (
    <time dateTime={date} className={className} title={then.toLocaleString()}>
      {text}
    </time>
  );
}

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
