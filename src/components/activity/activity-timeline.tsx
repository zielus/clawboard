import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowRight, MessageSquare, Plus, Pencil } from "lucide-react";
import type { Activity, ActivityType } from "@/lib/types";

interface ActivityTimelineProps {
  activities: Activity[];
}

const actionConfig: Record<ActivityType, { icon: typeof ArrowRight; label: string; color: string }> = {
  moved: { icon: ArrowRight, label: "moved", color: "text-blue-400" },
  created: { icon: Plus, label: "created", color: "text-emerald-400" },
  commented: { icon: MessageSquare, label: "commented on", color: "text-amber-400" },
  updated: { icon: Pencil, label: "updated", color: "text-purple-400" },
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("");
}

function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
}

export function ActivityTimeline({ activities }: ActivityTimelineProps) {
  return (
    <div className="hidden w-72 shrink-0 flex-col border-l border-border bg-card xl:flex">
      <div className="border-b border-border p-4">
        <h2 className="text-sm font-semibold text-foreground">Activity</h2>
        <p className="text-xs text-muted-foreground">Recent actions</p>
      </div>
      <ScrollArea className="flex-1">
        <div className="space-y-1 p-2">
          {activities.map((activity) => {
            const config = actionConfig[activity.type];
            const Icon = config.icon;
            const agentName = activity.agent?.name || "Unknown";
            const taskTitle = activity.task?.title || "Unknown task";

            return (
              <div
                key={activity.id}
                className="group rounded-lg p-3 transition-colors hover:bg-accent"
              >
                <div className="flex items-start gap-3">
                  <Avatar className="h-7 w-7">
                    <AvatarImage
                      src={activity.agent?.avatar || undefined}
                      alt={agentName}
                    />
                    <AvatarFallback className="text-[10px]">
                      {getInitials(agentName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs leading-relaxed">
                      <span className="font-medium text-foreground">
                        {agentName.split(" ")[0]}
                      </span>{" "}
                      <span className={`inline-flex items-center gap-1 ${config.color}`}>
                        <Icon className="h-3 w-3" />
                        {config.label}
                      </span>{" "}
                      <span className="font-medium text-foreground">{taskTitle}</span>
                    </p>
                    {activity.message && activity.type === "moved" && (
                      <p className="mt-0.5 text-[10px] text-muted-foreground">{activity.message}</p>
                    )}
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      {getRelativeTime(activity.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
