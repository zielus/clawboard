// src/components/layout/theme-toggle.tsx
import { Moon, Sun } from "lucide-react";
import { useLayoutEffect, useState } from "react";
import { Button } from "@/components/ui/button";

function getInitialTheme(): boolean {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const stored = localStorage.getItem("theme");
  return stored === "dark" || (!stored && prefersDark);
}

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(getInitialTheme);

  useLayoutEffect(() => {
    // Sync DOM with state on mount and when isDark changes
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  return (
    <Button variant="ghost" size="icon" onClick={toggle} title="Toggle theme">
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}
