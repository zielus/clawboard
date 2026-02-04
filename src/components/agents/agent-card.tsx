// src/components/agents/agent-card.tsx
import type { Agent } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { AgentAvatar } from "@/components/shared/agent-avatar";
import { RelativeTime } from "@/components/shared/relative-time";
import { StatusDot } from "@/components/shared/status-dot";
import { AGENT_STATUS_COLORS, AGENT_STATUS_LABELS } from "@/lib/constants";

interface AgentCardProps {
  agent: Agent;
}

export function AgentCard({ agent }: AgentCardProps) {
  return (
    <Card size="sm">
      <CardContent className="flex gap-3">
        <AgentAvatar avatar={agent.avatar} name={agent.name} size="md" />
        <div className="flex flex-col min-w-0 flex-1">
          <span className="font-medium text-sm truncate">{agent.name}</span>
          {agent.role && (
            <span className="text-xs text-muted-foreground truncate">
              {agent.role}
            </span>
          )}
          <div className="flex items-center justify-between mt-1">
            <div className="flex items-center gap-1.5">
              <StatusDot color={AGENT_STATUS_COLORS[agent.status]} size="sm" />
              <span className="text-xs text-muted-foreground">
                {AGENT_STATUS_LABELS[agent.status]}
              </span>
            </div>
            <RelativeTime
              date={agent.updatedAt}
              className="text-xs text-muted-foreground"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
