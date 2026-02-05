import { cn } from "@/lib/utils";

interface StatusDotProps {
  color: string;
  className?: string;
}

export function StatusDot({ color, className }: StatusDotProps) {
  return (
    <span
      className={cn("h-2 w-2 shrink-0 rounded-full", color, className)}
    />
  );
}
