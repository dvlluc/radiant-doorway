import { cn } from "@/lib/utils";

interface NotificationBadgeProps {
  count: number;
  className?: string;
  collapsed?: boolean;
}

/** Shared unread badge for Sidebar and other nav surfaces */
export function NotificationBadge({
  count,
  className,
  collapsed = false,
}: NotificationBadgeProps) {
  if (count <= 0) return null;

  const label = count > 99 ? "99+" : String(count);

  if (collapsed) {
    return (
      <span
        className={cn(
          "absolute top-0 right-0 w-2 h-2 bg-destructive rounded-full border border-background",
          className
        )}
        aria-label={`${count} unread notifications`}
      />
    );
  }

  return (
    <span
      className={cn(
        "ml-auto min-w-[20px] h-5 px-1.5 flex items-center justify-center text-[11px] font-semibold rounded-full bg-destructive text-destructive-foreground",
        className
      )}
      aria-label={`${count} unread notifications`}
    >
      {label}
    </span>
  );
}
