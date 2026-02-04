// src/components/tasks/action-row.tsx
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Agent } from "@/lib/types";

interface ActionRowProps {
  agents: Agent[];
  selectedAgentId: string | null;
  onAgentSelect: (agentId: string | null) => void;
  onNewTask: () => void;
}

export function ActionRow({
  agents,
  selectedAgentId,
  onAgentSelect,
  onNewTask,
}: ActionRowProps) {
  return (
    <div className="flex items-center gap-4 px-4 py-3">
      <Button onClick={onNewTask} className="gap-1.5">
        <Plus className="size-4" />
        New task
      </Button>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onAgentSelect(null)}
          className={cn(
            "px-3 py-1.5 text-sm rounded-md transition-colors",
            selectedAgentId === null
              ? "bg-muted text-foreground font-medium"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
        >
          All
        </button>
        {agents.map((agent) => (
          <button
            key={agent.id}
            onClick={() => onAgentSelect(agent.id)}
            className={cn(
              "px-3 py-1.5 text-sm rounded-md transition-colors",
              selectedAgentId === agent.id
                ? "bg-muted text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            {agent.name}
          </button>
        ))}
      </div>

      {/* Project filter - disabled for now */}
      <div className="ml-auto">
        <Button variant="outline" size="sm" disabled className="opacity-50">
          All projects
        </Button>
      </div>
    </div>
  );
}
