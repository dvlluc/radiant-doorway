import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Calendar, Briefcase, ShoppingBag, Info, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { TeamInvitationActions } from "@/components/TeamInvitationActions";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";
import {
  filterNotificationsByType,
  parseNotificationActionUrl,
  shouldSkipNotificationNavigation,
  type AppNotification,
} from "@/lib/notifications";

type NotificationFilter = "All" | "Unread" | "Booking" | "Events" | "Market" | "Jobs" | "Other";

export function AllNotifications() {
  const [activeFilter, setActiveFilter] = useState<NotificationFilter>("All");
  const { user } = useAuth();
  const { toast } = useToast();
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    isMarkingAllRead,
  } = useNotifications(user?.id);

  const filters: NotificationFilter[] = ["All", "Unread", "Booking", "Other"];

  const handleMarkAllRead = async () => {
    if (unreadCount === 0) {
      toast({
        title: "No unread notifications",
        description: "All notifications are already marked as read",
      });
      return;
    }

    try {
      await markAllAsRead();
      toast({
        title: "Success",
        description: "All notifications marked as read",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to mark notifications as read",
        variant: "destructive",
      });
    }
  };

  const handleDeleteNotification = async (
    e: React.MouseEvent | undefined,
    notificationId: string
  ) => {
    e?.stopPropagation();

    try {
      await deleteNotification(notificationId);
      toast({
        title: "Deleted",
        description: "Notification removed",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete notification",
        variant: "destructive",
      });
    }
  };

  const handleNotificationClick = async (notification: AppNotification) => {
    if (notification.type === "team_invitation") {
      return;
    }

    if (!notification.read) {
      try {
        await markAsRead(notification.id);
      } catch {
        toast({
          title: "Error",
          description: "Failed to update notification",
          variant: "destructive",
        });
        return;
      }
    }

    if (shouldSkipNotificationNavigation(notification)) {
      return;
    }

    if (notification.action_url) {
      window.location.href = notification.action_url;
    }
  };

  const filteredNotifications = filterNotificationsByType(notifications, activeFilter);

  const getNotificationIcon = (type: string) => {
    const lowerType = type.toLowerCase();
    if (lowerType.includes("booking")) return Calendar;
    if (lowerType.includes("event")) return Bell;
    if (lowerType.includes("job")) return Briefcase;
    if (lowerType.includes("market")) return ShoppingBag;
    return Info;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-muted-foreground">
          View and manage all your notifications
        </p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="flex gap-2 flex-wrap">
          {filters.map((filter) => (
            <Button
              key={filter}
              variant={activeFilter === filter ? "default" : "outline"}
              onClick={() => setActiveFilter(filter)}
              size="sm"
              className={cn(
                "transition-colors text-xs sm:text-sm",
                activeFilter === filter
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "hover:bg-muted"
              )}
            >
              {filter}
              {filter === "Unread" && unreadCount > 0 && (
                <span className="ml-1.5 sm:ml-2 px-1.5 sm:px-2 py-0.5 text-xs rounded-full bg-primary-foreground text-primary">
                  {unreadCount}
                </span>
              )}
            </Button>
          ))}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleMarkAllRead}
          disabled={unreadCount === 0 || isMarkingAllRead}
          className="w-full sm:w-auto"
        >
          {isMarkingAllRead ? "Updating…" : "Mark All Read"}
        </Button>
      </div>

      <Card>
        <CardContent className="p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6">
            {activeFilter === "All" ? "All Notifications" : `${activeFilter} Notifications`}
          </h2>

          {filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="w-16 h-16 text-muted-foreground/40 mb-4" />
              <p className="font-medium text-lg mb-1">
                {activeFilter === "All"
                  ? "No notifications yet"
                  : `No ${activeFilter.toLowerCase()} notifications`}
              </p>
              <p className="text-sm text-muted-foreground">
                {activeFilter === "All"
                  ? "You'll see your notifications here when you have any"
                  : "Try selecting a different filter to see other notifications"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredNotifications.map((notification) => {
                const IconComponent = getNotificationIcon(notification.type);
                const actionData = parseNotificationActionUrl(notification.action_url);
                const isTeamInvitation =
                  notification.type === "team_invitation" &&
                  actionData?.type === "team_invitation";

                return (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={cn(
                      "flex items-start gap-4 p-4 rounded-lg border transition-colors cursor-pointer",
                      !notification.read ? "bg-muted/30 hover:bg-muted/50" : "hover:bg-muted/50"
                    )}
                  >
                    <div className="flex-shrink-0">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center",
                          notification.read ? "bg-muted" : "bg-primary/10"
                        )}
                      >
                        <IconComponent
                          className={cn(
                            "w-5 h-5",
                            notification.read ? "text-muted-foreground" : "text-primary"
                          )}
                        />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold">{notification.title}</h3>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {!notification.read && (
                            <div className="w-2 h-2 rounded-full bg-primary" />
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 hover:bg-destructive/10 hover:text-destructive"
                            onClick={(e) => handleDeleteNotification(e, notification.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDistanceToNow(new Date(notification.created_at), {
                          addSuffix: true,
                        })}
                      </p>
                      {isTeamInvitation && actionData?.invitation_id && (
                        <TeamInvitationActions
                          invitationId={String(actionData.invitation_id)}
                          onAction={() => {
                            void deleteNotification(notification.id);
                          }}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
