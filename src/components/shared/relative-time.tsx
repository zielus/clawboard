// src/components/shared/relative-time.tsx
interface RelativeTimeProps {
  date: string;
  className?: string;
}

export function RelativeTime({ date, className }: RelativeTimeProps) {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  let text: string;
  if (diffMins < 1) {
    text = "just now";
  } else if (diffMins < 60) {
    text = `${diffMins}m ago`;
  } else if (diffHours < 24) {
    text = `${diffHours}h ago`;
  } else if (diffDays === 1) {
    text = "yesterday";
  } else if (diffDays < 7) {
    text = `${diffDays}d ago`;
  } else {
    text = then.toLocaleDateString();
  }

  return (
    <time dateTime={date} className={className} title={then.toLocaleString()}>
      {text}
    </time>
  );
}
