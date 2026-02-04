// src/components/layout/header.tsx
import { LayoutGrid, RefreshCw, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Tasks", href: "/tasks", active: true },
  { label: "Projects", href: "/projects", disabled: true },
  { label: "Memory", href: "/memory", disabled: true },
  { label: "Docs", href: "/docs", disabled: true },
  { label: "Agents", href: "/agents", disabled: true },
];

interface HeaderProps {
  onRefresh?: () => void;
  isPaused?: boolean;
  onTogglePause?: () => void;
}

export function Header({ onRefresh, isPaused = false, onTogglePause }: HeaderProps) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-border px-4">
      {/* Left: Logo + Nav */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <LayoutGrid className="size-5 text-primary" />
          <span className="font-semibold">Mission Control</span>
        </div>

        <nav className="flex items-center gap-1">
          {navItems.map((item) => (
            <button
              key={item.label}
              disabled={item.disabled}
              className={cn(
                "px-3 py-1.5 text-sm rounded-md transition-colors",
                item.active
                  ? "bg-muted text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                item.disabled && "opacity-50 cursor-not-allowed pointer-events-none"
              )}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Right: Controls */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onTogglePause}
          className="gap-1.5"
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
        <Button variant="ghost" size="icon" onClick={onRefresh} title="Refresh">
          <RefreshCw className="size-4" />
        </Button>
        <ThemeToggle />
      </div>
    </header>
  );
}
