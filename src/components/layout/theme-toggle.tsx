// src/components/layout/theme-toggle.tsx
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check initial preference
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const stored = localStorage.getItem("theme");
    const initial = stored === "dark" || (!stored && prefersDark);
    setIsDark(initial);
    document.documentElement.classList.toggle("dark", initial);
  }, []);

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
