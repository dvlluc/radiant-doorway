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

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  action_url: string | null;
}

interface NotificationsDropdownProps {
  userId: string | null;
}

export function NotificationsDropdown({ userId }: NotificationsDropdownProps) {
  const navigate = useNavigate();
  const { notifications, hasUnread, markAsRead, deleteNotification } = useNotifications(userId || undefined);

  const handleDelete = (notificationId: string, event?: React.MouseEvent) => {
    event?.stopPropagation();
    deleteNotification(notificationId);
  };

  const handleNotificationClick = (notification: NotificationItem) => {
    // Don't handle click for team invitations - they have their own actions
    if (notification.type === 'team_invitation') {
      return;
    }
    
    markAsRead(notification.id);
    // Don't redirect for welcome notifications or system notifications with discover action
    if (notification.type.toLowerCase().includes('welcome') || 
        notification.title.toLowerCase().includes('welcome') ||
        (notification.type === 'system' && notification.action_url === '/discover')) {
      return;
    }
    if (notification.action_url) {
      navigate(notification.action_url);
    } else {
      navigate("/account", { state: { activeSection: "Notifications" } });
    }
  };

  const parseActionUrl = (actionUrl: string | null) => {
    if (!actionUrl) return null;
    try {
      return JSON.parse(actionUrl);
    } catch {
      return null;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 relative">
          <Bell className="w-5 h-5" />
          {hasUnread && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto z-50">
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No notifications
          </div>
        ) : (
          <>
            {notifications.map((notification) => {
              const actionData = parseActionUrl(notification.action_url);
              const isTeamInvitation = notification.type === 'team_invitation' && actionData?.type === 'team_invitation';
              
              return (
                <DropdownMenuItem
                  key={notification.id}
                  className={`flex flex-col items-start p-4 ${!isTeamInvitation ? 'cursor-pointer hover:bg-muted' : ''} transition-colors ${
                    !notification.read ? "bg-accent/50" : ""
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                  onSelect={(e) => isTeamInvitation && e.preventDefault()}
                >
                  <div className="flex items-start justify-between w-full gap-2">
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{notification.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDistanceToNow(new Date(notification.created_at), {
                          addSuffix: true,
                        })}
                      </p>
                       {isTeamInvitation && actionData?.invitation_id && (
                        <TeamInvitationActions
                          invitationId={actionData.invitation_id}
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
              onClick={() => navigate("/account", { state: { activeSection: "Notifications" } })}
            >
              View all notifications
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
