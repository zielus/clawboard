import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTheme } from "@/components/theme-provider";
import {
  Rocket,
  Pause,
  Play,
  RefreshCw,
  Moon,
  Sun,
  ListTodo,
  Brain,
  FileText,
} from "lucide-react";

interface Stats {
  backlog: number;
  inProgress: number;
  review: number;
  done: number;
}

interface HeaderProps {
  stats: Stats;
  isPaused: boolean;
  onTogglePause: () => void;
  onRefresh: () => void;
}

export function Header({ stats, isPaused, onTogglePause, onRefresh }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    onRefresh();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-card px-4">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Rocket className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold text-foreground">Clawboard</span>
        </div>
        <Tabs defaultValue="tasks" className="hidden md:block">
          <TabsList className="h-8 bg-secondary">
            <TabsTrigger value="tasks" className="gap-1.5 text-xs data-[state=active]:bg-accent">
              <ListTodo className="h-3.5 w-3.5" />
              Tasks
            </TabsTrigger>
            <TabsTrigger value="memory" className="gap-1.5 text-xs data-[state=active]:bg-accent" disabled>
              <Brain className="h-3.5 w-3.5" />
              Memory
            </TabsTrigger>
            <TabsTrigger value="docs" className="gap-1.5 text-xs data-[state=active]:bg-accent" disabled>
              <FileText className="h-3.5 w-3.5" />
              Docs
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="hidden items-center gap-3 lg:flex">
        <div className="flex items-center gap-4 rounded-lg bg-secondary/50 px-4 py-1.5">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-slate-500" />
            <span className="text-xs text-muted-foreground">Backlog</span>
            <span className="text-sm font-semibold text-foreground">{stats.backlog}</span>
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            <span className="text-xs text-muted-foreground">In Progress</span>
            <span className="text-sm font-semibold text-foreground">{stats.inProgress}</span>
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            <span className="text-xs text-muted-foreground">Review</span>
            <span className="text-sm font-semibold text-foreground">{stats.review}</span>
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-xs text-muted-foreground">Done</span>
            <span className="text-sm font-semibold text-foreground">{stats.done}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={onTogglePause}
        >
          {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
          <span className="sr-only">{isPaused ? "Resume" : "Pause"}</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={handleRefresh}
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          <span className="sr-only">Refresh</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </div>
    </header>
  );
}
