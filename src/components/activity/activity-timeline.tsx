// src/components/activity/activity-timeline.tsx
import type { Activity, ActivityType } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { AgentAvatar } from "@/components/shared/agent-avatar";
import { RelativeTime } from "@/components/shared/relative-time";

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
  const agentAvatar = activity.agent?.avatar ?? null;
  const taskTitle = activity.task?.title ?? "Unknown task";
  const verb = activityVerbs[activity.type];

  return (
    <Card size="sm">
      <CardContent className="flex gap-3">
        <AgentAvatar avatar={agentAvatar} name={agentName} size="sm" />
        <div className="flex flex-col min-w-0 flex-1">
          <p className="text-sm">
            <span className="font-medium">{agentName}</span>{" "}
            <span className="text-muted-foreground">{verb}</span>
          </p>
          <p className="text-sm text-primary truncate">"{taskTitle}"</p>
          <RelativeTime
            date={activity.createdAt}
            className="text-xs text-muted-foreground self-end mt-1"
          />
        </div>
      </CardContent>
    </Card>
  );
}

interface ActivityTimelineProps {
  activities: Activity[];
}

export function ActivityTimeline({ activities }: ActivityTimelineProps) {
  return (
    <aside className="w-[280px] flex flex-col bg-muted/30">
      <h3 className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Activity
      </h3>
      <div className="flex-1 overflow-y-auto px-3 pb-3">
        <div className="flex flex-col gap-2">
          {activities.length === 0 ? (
            <p className="text-sm text-muted-foreground px-1">No recent activity</p>
          ) : (
            activities.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))
          )}
        </div>
      </div>
    </aside>
  );
}
