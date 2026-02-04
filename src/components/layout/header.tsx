// src/components/layout/header.tsx
import { useState } from "react";
import { RefreshCw, Pause, Play, CheckSquare, Brain, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ThemeToggle } from "./theme-toggle";
import { HeaderStats } from "./header-stats";
import { cn } from "@/lib/utils";
import type { TaskStats } from "@/lib/types";

const navItems = [
  { label: "Tasks", href: "/tasks", active: true, icon: CheckSquare },
  { label: "Memory", href: "/memory", disabled: true, icon: Brain },
  { label: "Docs", href: "/docs", disabled: true, icon: FileText },
];

interface HeaderProps {
  stats: TaskStats;
  onRefresh?: () => void;
  isPaused?: boolean;
  onTogglePause?: () => void;
}

export function Header({ stats, onRefresh, isPaused = false, onTogglePause }: HeaderProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    onRefresh?.();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  return (
    <header className="flex h-16 items-center justify-between bg-muted/50 px-4">
      {/* Left: Logo + Nav */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <img src="/logo-no-bg.png" alt="Mission Control" className="size-6" />
          <span className="font-semibold">Mission Control</span>
        </div>

        <nav className="flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                disabled={item.disabled}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors",
                  item.active
                    ? "bg-background text-foreground font-medium shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50",
                  item.disabled && "opacity-50 cursor-not-allowed pointer-events-none"
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Center: Stats */}
      <HeaderStats stats={stats} />

      {/* Right: Controls */}
      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={onTogglePause}
              className={cn(
                "gap-1.5 transition-colors",
                isPaused
                  ? "text-amber-600 hover:text-amber-700"
                  : "text-green-600 hover:text-green-700"
              )}
            >
              {isPaused ? (
                <>
                  <Play className="size-4" />
                  Resume
                </>
              ) : (
                <>
                  <Pause className="size-4" />
                  Pause
                </>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {isPaused ? "Resume agents" : "Pause agents"}
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={handleRefresh}>
              <RefreshCw
                className={cn(
                  "size-4 transition-transform duration-1000",
                  isRefreshing && "animate-spin"
                )}
              />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Refresh data</TooltipContent>
        </Tooltip>

        <ThemeToggle />
      </div>
    </header>
  );
}
