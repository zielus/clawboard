import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTheme } from "@/components/theme-provider";
import {
  Rocket,
  RefreshCw,
  Moon,
  Sun,
  ListTodo,
  Brain,
  FileText,
  Plus,
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
  onAddTask: () => void;
}

export function Header({ stats, onRefresh, onAddTask }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    onRefresh();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  return (
    <header className="flex flex-col">
      {/* Main nav row */}
      <div className="flex h-12 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
              <Rocket className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <span className="text-base font-semibold text-foreground">Clawboard</span>
          </div>
          <Tabs defaultValue="tasks" className="hidden md:block">
            <TabsList className="h-7 gap-0.5 bg-transparent p-0">
              <TabsTrigger value="tasks" className="gap-1.5 h-7 rounded-md px-2.5 text-xs text-muted-foreground data-[state=active]:bg-accent data-[state=active]:text-foreground">
                <ListTodo className="h-3.5 w-3.5" />
                Tasks
              </TabsTrigger>
              <TabsTrigger value="memory" className="gap-1.5 h-7 rounded-md px-2.5 text-xs text-muted-foreground data-[state=active]:bg-accent data-[state=active]:text-foreground" disabled>
                <Brain className="h-3.5 w-3.5" />
                Memory
              </TabsTrigger>
              <TabsTrigger value="docs" className="gap-1.5 h-7 rounded-md px-2.5 text-xs text-muted-foreground data-[state=active]:bg-accent data-[state=active]:text-foreground" disabled>
                <FileText className="h-3.5 w-3.5" />
                Docs
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={handleRefresh}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            <span className="sr-only">Refresh</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
            <span className="sr-only">Toggle theme</span>
          </Button>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex h-10 items-center gap-6 px-4">
        <Button
          size="sm"
          className="h-7 gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90"
          onClick={onAddTask}
        >
          <Plus className="h-3.5 w-3.5" />
          New Task
        </Button>

        <div className="flex items-center gap-6 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
            <span className="font-medium text-foreground">{stats.backlog}</span>
            <span className="text-muted-foreground">Backlog</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            <span className="font-medium text-foreground">{stats.inProgress}</span>
            <span className="text-muted-foreground">In Progress</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            <span className="font-medium text-foreground">{stats.review}</span>
            <span className="text-muted-foreground">Review</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span className="font-medium text-foreground">{stats.done}</span>
            <span className="text-muted-foreground">Done</span>
          </div>
        </div>
      </div>
    </header>
  );
}
