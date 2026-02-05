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
  Pause,
  Play,
} from "lucide-react";

interface HeaderProps {
  isPaused: boolean;
  onTogglePause: () => void;
  onRefresh: () => void;
  onAddTask: () => void;
}

export function Header({ isPaused, onTogglePause, onRefresh, onAddTask }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    onRefresh();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  return (
    <header className="flex h-14 items-center justify-between border-b border-border/40 px-4">
      {/* Left: Logo + Nav */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Rocket className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold text-foreground">Clawboard</span>
        </div>

        <Tabs defaultValue="tasks" className="hidden md:block">
          <TabsList className="h-8 gap-1 bg-transparent p-0">
            <TabsTrigger value="tasks" className="gap-1.5 h-8 rounded-md px-3 text-sm text-muted-foreground data-[state=active]:bg-accent data-[state=active]:text-foreground">
              <ListTodo className="h-4 w-4" />
              Tasks
            </TabsTrigger>
            <TabsTrigger value="memory" className="gap-1.5 h-8 rounded-md px-3 text-sm text-muted-foreground data-[state=active]:bg-accent data-[state=active]:text-foreground" disabled>
              <Brain className="h-4 w-4" />
              Memory
            </TabsTrigger>
            <TabsTrigger value="docs" className="gap-1.5 h-8 rounded-md px-3 text-sm text-muted-foreground data-[state=active]:bg-accent data-[state=active]:text-foreground" disabled>
              <FileText className="h-4 w-4" />
              Docs
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          className="gap-1.5 h-8 px-3"
          onClick={onAddTask}
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">New Task</span>
        </Button>

        <div className="flex items-center gap-1 ml-2">
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
      </div>
    </header>
  );
}
