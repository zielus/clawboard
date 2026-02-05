import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface AgentAvatarProps {
  avatar?: string | null;
  name: string;
  size?: "sm" | "default" | "lg";
  className?: string;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("");
}

export function AgentAvatar({ avatar, name, size = "default", className }: AgentAvatarProps) {
  return (
    <Avatar size={size} className={cn(className)}>
      <AvatarImage src={avatar || undefined} alt={name} />
      <AvatarFallback>{getInitials(name)}</AvatarFallback>
    </Avatar>
  );
}
