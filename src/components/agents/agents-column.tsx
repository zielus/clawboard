// src/components/agents/agents-column.tsx
import type { Agent } from "@/lib/types";
import { AgentCard } from "./agent-card";

interface AgentsColumnProps {
  agents: Agent[];
}

export function AgentsColumn({ agents }: AgentsColumnProps) {
  return (
    <aside className="w-[240px] flex flex-col bg-muted/30">
      <h3 className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Agents
      </h3>
      <div className="flex-1 overflow-y-auto px-3 pb-3">
        <div className="flex flex-col gap-2">
          {agents.length === 0 ? (
            <p className="text-sm text-muted-foreground px-1">No agents</p>
          ) : (
            agents.map((agent) => <AgentCard key={agent.id} agent={agent} />)
          )}
        </div>
      </div>
    </aside>
  );
}
