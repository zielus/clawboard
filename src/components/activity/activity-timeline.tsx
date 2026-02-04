// src/components/activity/activity-timeline.tsx
import type { Activity, ActivityType } from "@/lib/types";
import { RelativeTime } from "@/components/shared/relative-time";
import { cn } from "@/lib/utils";

const activityDotColors: Record<ActivityType, string> = {
  task_created: "bg-green-500",
  task_updated: "bg-blue-500",
  status_changed: "bg-yellow-500",
  message_sent: "bg-purple-500",
  document_created: "bg-cyan-500",
  audit_completed: "bg-orange-500",
};

const activityVerbs: Record<ActivityType, string> = {
  task_created: "created",
  task_updated: "updated",
  status_changed: "moved",
  message_sent: "commented on",
  document_created: "created document for",
  audit_completed: "completed audit for",
};

interface ActivityItemProps {
  activity: Activity;
}

function ActivityItem({ activity }: ActivityItemProps) {
  const agentName = activity.agent?.name ?? "Unknown";
  const taskTitle = activity.task?.title ?? "Unknown task";
  const verb = activityVerbs[activity.type];

  return (
    <div className="flex gap-3 py-2">
      <span
        className={cn(
          "mt-1.5 size-2 rounded-full shrink-0",
          activityDotColors[activity.type]
        )}
      />
      <div className="flex flex-col gap-0.5 min-w-0">
        <p className="text-sm">
          <span className="font-medium">{agentName}</span>{" "}
          <span className="text-muted-foreground">{verb}</span>{" "}
          <span className="text-primary truncate">{taskTitle}</span>
        </p>
        <RelativeTime
          date={activity.createdAt}
          className="text-xs text-muted-foreground"
        />
      </div>
    </div>
  );
}

interface ActivityTimelineProps {
  activities: Activity[];
}

export function ActivityTimeline({ activities }: ActivityTimelineProps) {
  return (
    <aside className="w-[280px] border-l border-border flex flex-col">
      <h3 className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Activity
      </h3>
      <div className="flex-1 overflow-y-auto px-4">
        {activities.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recent activity</p>
        ) : (
          activities.map((activity) => (
            <ActivityItem key={activity.id} activity={activity} />
          ))
        )}
      </div>
    </aside>
  );
}
