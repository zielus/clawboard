import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Agent, AgentStatus } from "@/lib/types";

interface AgentsColumnProps {
  agents: Agent[];
}

const statusConfig: Record<AgentStatus, { label: string; className: string }> = {
  active: {
    label: "Active",
    className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  },
  idle: {
    label: "Idle",
    className: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  },
  blocked: {
    label: "Blocked",
    className: "bg-red-500/20 text-red-400 border-red-500/30",
  },
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

export function AgentsColumn({ agents }: AgentsColumnProps) {
  return (
    <div className="hidden w-64 shrink-0 flex-col border-r border-border bg-card lg:flex">
      <div className="border-b border-border p-4">
        <h2 className="text-sm font-semibold text-foreground">Agents</h2>
        <p className="text-xs text-muted-foreground">{agents.length} team members</p>
      </div>
      <ScrollArea className="flex-1">
        <div className="space-y-1 p-2">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className="group flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-accent"
            >
              <div className="relative">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={agent.avatar || undefined} alt={agent.name} />
                  <AvatarFallback className="bg-muted text-xs">
                    {getInitials(agent.name)}
                  </AvatarFallback>
                </Avatar>
                <span
                  className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card ${
                    agent.status === "active"
                      ? "bg-emerald-500"
                      : agent.status === "idle"
                        ? "bg-amber-500"
                        : "bg-red-500"
                  }`}
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium text-foreground">
                    {agent.name}
                  </span>
                </div>
                <p className="truncate text-xs text-muted-foreground">{agent.role}</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={`text-[10px] px-1.5 py-0 ${statusConfig[agent.status].className}`}
                  >
                    {statusConfig[agent.status].label}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">
                    {getRelativeTime(agent.updatedAt)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
