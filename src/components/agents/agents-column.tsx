import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { Agent, AgentStatus } from "@/lib/types";

interface AgentsColumnProps {
  agents: Agent[];
}

const statusColors: Record<AgentStatus, string> = {
  active: "bg-emerald-500",
  idle: "bg-amber-500",
  blocked: "bg-red-500",
};

const statusLabels: Record<AgentStatus, string> = {
  active: "Active",
  idle: "Idle",
  blocked: "Blocked",
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
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export function AgentsColumn({ agents }: AgentsColumnProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <div className="hidden w-14 shrink-0 flex-col items-center py-3 lg:flex">
        <ScrollArea className="flex-1 w-full">
          <div className="flex flex-col items-center gap-2 px-2">
            {agents.map((agent) => (
              <Tooltip key={agent.id}>
                <TooltipTrigger asChild>
                  <button className="group relative rounded-full transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <Avatar className="h-9 w-9 ring-2 ring-transparent transition-all group-hover:ring-accent">
                      <AvatarImage src={agent.avatar || undefined} alt={agent.name} />
                      <AvatarFallback className="bg-muted text-xs">
                        {getInitials(agent.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background ${statusColors[agent.status]}`}
                    />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="p-3">
                  <div className="flex flex-col gap-1">
                    <span className="font-medium text-sm">{agent.name}</span>
                    <span className="text-xs text-muted-foreground">{agent.role}</span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`h-2 w-2 rounded-full ${statusColors[agent.status]}`} />
                      <span className="text-xs">{statusLabels[agent.status]}</span>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs text-muted-foreground">
                        {getRelativeTime(agent.updatedAt)}
                      </span>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </ScrollArea>
      </div>
    </TooltipProvider>
  );
}
