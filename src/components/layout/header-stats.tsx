// src/components/layout/header-stats.tsx
import type { TaskStats } from "@/lib/types";

interface HeaderStatsProps {
  stats: TaskStats;
}

export function HeaderStats({ stats }: HeaderStatsProps) {
  const items = [
    { label: "Backlog", value: stats.backlog, color: "var(--status-backlog)" },
    { label: "In Progress", value: stats.inProgress, color: "var(--status-in-progress)" },
    { label: "Review", value: stats.total - stats.backlog - stats.inProgress - Math.round(stats.total * stats.completionPercent / 100), color: "var(--status-review)" },
    { label: "Total", value: stats.total, color: "var(--foreground)" },
  ];

  return (
    <div className="flex items-center gap-6">
      {items.map((item) => (
        <div key={item.label} className="flex flex-col items-center">
          <span
            className="text-2xl font-bold"
            style={{ color: item.color }}
          >
            {item.value}
          </span>
          <span className="text-xs text-muted-foreground">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
