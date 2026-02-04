// src/components/tasks/stats-row.tsx
import type { TaskStats } from "@/lib/types";
import { cn } from "@/lib/utils";

interface StatProps {
  value: number | string;
  label: string;
  className?: string;
}

function Stat({ value, label, className }: StatProps) {
  return (
    <div className={cn("flex items-baseline gap-2", className)}>
      <span className="text-2xl font-semibold">{value}</span>
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
  );
}

interface StatsRowProps {
  stats: TaskStats;
}

export function StatsRow({ stats }: StatsRowProps) {
  return (
    <div className="flex items-center gap-8 px-4 py-3 border-b border-border">
      <Stat value={stats.backlog} label="Backlog" />
      <Stat value={stats.inProgress} label="In progress" />
      <Stat value={stats.total} label="Total" />
      <Stat value={`${stats.completionPercent}%`} label="Completion" />
    </div>
  );
}
