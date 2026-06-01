export interface AppNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  action_url: string | null;
}

export const notificationsQueryKey = (userId: string | undefined) =>
  ["notifications", userId] as const;

export function parseNotificationActionUrl(actionUrl: string | null) {
  if (!actionUrl) return null;
  try {
    return JSON.parse(actionUrl) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function shouldSkipNotificationNavigation(notification: AppNotification) {
  if (notification.type === "team_invitation") return true;
  if (notification.type.toLowerCase().includes("welcome")) return true;
  if (notification.title.toLowerCase().includes("welcome")) return true;
  if (notification.type === "system" && notification.action_url === "/discover") {
    return true;
  }
  if (parseNotificationActionUrl(notification.action_url)) return true;
  return false;
}

export function filterNotificationsByType(
  notifications: AppNotification[],
  filter: "All" | "Unread" | "Booking" | "Events" | "Market" | "Jobs" | "Other"
) {
  switch (filter) {
    case "All":
      return notifications;
    case "Unread":
      return notifications.filter((n) => !n.read);
    case "Booking":
      return notifications.filter((n) => n.type.toLowerCase().includes("booking"));
    case "Events":
      return notifications.filter((n) => n.type.toLowerCase().includes("event"));
    case "Market":
      return notifications.filter((n) => n.type.toLowerCase().includes("market"));
    case "Jobs":
      return notifications.filter((n) => n.type.toLowerCase().includes("job"));
    case "Other":
      return notifications.filter((n) => {
        const type = n.type.toLowerCase();
        return (
          !type.includes("booking") &&
          !type.includes("event") &&
          !type.includes("market") &&
          !type.includes("job")
        );
      });
    default:
      return notifications;
  }
}
