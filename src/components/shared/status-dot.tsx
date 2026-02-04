// src/components/shared/status-dot.tsx
import { cn } from "@/lib/utils";

interface StatusDotProps {
  color: string;
  size?: "sm" | "md";
  className?: string;
}

export function StatusDot({ color, size = "md", className }: StatusDotProps) {
  return (
    <span
      className={cn(
        "rounded-full shrink-0",
        size === "sm" ? "size-1.5" : "size-2",
        className
      )}
      style={{ backgroundColor: color }}
    />
  );
}
