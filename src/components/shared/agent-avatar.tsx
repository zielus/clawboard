// src/components/shared/agent-avatar.tsx
import { cn } from "@/lib/utils";

interface AgentAvatarProps {
  avatar: string | null;
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function AgentAvatar({ avatar, name, size = "md", className }: AgentAvatarProps) {
  const sizeClasses = {
    sm: "size-5 text-xs",
    md: "size-6 text-sm",
    lg: "size-8 text-base",
  };

  // Check if avatar is an emoji (starts with emoji or is short)
  const isEmoji = avatar && /^\p{Emoji}/u.test(avatar);

  // Check if avatar is a URL
  const isUrl = avatar && (avatar.startsWith("http://") || avatar.startsWith("https://"));

  if (isUrl) {
    return (
      <img
        src={avatar}
        alt={name}
        className={cn("rounded-full object-cover", sizeClasses[size], className)}
      />
    );
  }

  if (isEmoji) {
    return (
      <span
        className={cn(
          "inline-flex items-center justify-center rounded-full bg-muted",
          sizeClasses[size],
          className
        )}
        title={name}
      >
        {avatar}
      </span>
    );
  }

  // Fallback: show initials
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground font-medium",
        sizeClasses[size],
        className
      )}
      title={name}
    >
      {initials}
    </span>
  );
}
