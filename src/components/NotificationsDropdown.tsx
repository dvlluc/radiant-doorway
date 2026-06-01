import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Bell, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { TeamInvitationActions } from "./TeamInvitationActions";
import { useNotifications } from "@/hooks/useNotifications";
import {
  parseNotificationActionUrl,
  shouldSkipNotificationNavigation,
  type AppNotification,
} from "@/lib/notifications";
import { cn } from "@/lib/utils";

interface NotificationsDropdownProps {
  userId: string | null;
}

export function NotificationsDropdown({ userId }: NotificationsDropdownProps) {
  const navigate = useNavigate();
  const {
    previewNotifications,
    unreadCount,
    hasUnread,
    markAsRead,
    deleteNotification,
  } = useNotifications(userId || undefined);

  const handleDelete = (notificationId: string, event?: React.MouseEvent) => {
    event?.stopPropagation();
    void deleteNotification(notificationId);
  };

  const handleNotificationClick = async (notification: AppNotification) => {
    if (notification.type === "team_invitation") {
      return;
    }

    if (!notification.read) {
      await markAsRead(notification.id);
    }

    if (shouldSkipNotificationNavigation(notification)) {
      return;
    }

    if (notification.action_url) {
      navigate(notification.action_url);
    } else {
      navigate("/account?tab=notifications");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 relative">
          <Bell className="w-5 h-5" />
          {hasUnread && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-semibold bg-destructive text-destructive-foreground rounded-full border-2 border-background">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
        {!userId ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Please sign in to view notifications
          </div>
        ) : previewNotifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No notifications
          </div>
        ) : (
          <>
            {previewNotifications.map((notification) => {
              const actionData = parseNotificationActionUrl(notification.action_url);
              const isTeamInvitation =
                notification.type === "team_invitation" &&
                actionData?.type === "team_invitation";

              return (
                <DropdownMenuItem
                  key={notification.id}
                  className={cn(
                    "flex flex-col items-start p-4 transition-colors",
                    !isTeamInvitation && "cursor-pointer hover:bg-muted",
                    !notification.read && "bg-accent/50"
                  )}
                  onClick={() => void handleNotificationClick(notification)}
                  onSelect={(e) => isTeamInvitation && e.preventDefault()}
                >
                  <div className="flex items-start justify-between w-full gap-2">
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{notification.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{notification.message}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDistanceToNow(new Date(notification.created_at), {
                          addSuffix: true,
                        })}
                      </p>
                      {isTeamInvitation && actionData?.invitation_id && (
                        <TeamInvitationActions
                          invitationId={String(actionData.invitation_id)}
                          onAction={() => {
                            handleDelete(notification.id);
                          }}
                        />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {!notification.read && (
                        <div className="w-2 h-2 bg-primary rounded-full" />
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 hover:bg-destructive/10"
                        onClick={(e) => handleDelete(notification.id, e)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </DropdownMenuItem>
              );
            })}
            <DropdownMenuItem
              className="text-center text-sm text-primary cursor-pointer"
              onClick={() => navigate("/account?tab=notifications")}
            >
              View all notifications
              {unreadCount > 0 && (
                <span className="ml-2 text-xs text-muted-foreground">({unreadCount} unread)</span>
              )}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
