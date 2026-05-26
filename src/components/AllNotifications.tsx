import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Calendar, Briefcase, ShoppingBag, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { TeamInvitationActions } from "@/components/TeamInvitationActions";

type NotificationFilter = "All" | "Unread" | "Booking" | "Events" | "Market" | "Jobs" | "Other";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  created_at: string;
  read: boolean;
  action_url: string | null;
}

export function AllNotifications() {
  const [activeFilter, setActiveFilter] = useState<NotificationFilter>("All");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchNotifications();
      
      // Subscribe to real-time notifications
      const channel = supabase
        .channel('all-notifications')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`
          },
          () => {
            fetchNotifications();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [userId]);

  const fetchUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUserId(session?.user?.id || null);
  };

  const fetchNotifications = async () => {
    if (!userId) return;

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching notifications:", error);
    } else {
      setNotifications(data || []);
    }
  };

  const filters: NotificationFilter[] = ["All", "Unread", "Booking", "Other"];

  const handleMarkAllRead = async () => {
    if (!userId) return;

    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    
    if (unreadIds.length === 0) {
      toast({
        title: "No unread notifications",
        description: "All notifications are already marked as read",
      });
      return;
    }

    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .in("id", unreadIds);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to mark notifications as read",
        variant: "destructive",
      });
    } else {
      fetchNotifications();
      toast({
        title: "Success",
        description: "All notifications marked as read",
      });
    }
  };

  const handleDeleteNotification = async (e: React.MouseEvent | undefined, notificationId: string) => {
    e?.stopPropagation();
    
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", notificationId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete notification",
        variant: "destructive",
      });
    } else {
      fetchNotifications();
      toast({
        title: "Deleted",
        description: "Notification removed",
      });
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

  const handleNotificationClick = async (notification: Notification) => {
    // Don't handle click for team invitations - they have their own actions
    if (notification.type === 'team_invitation') {
      return;
    }

    // Mark as read if unread
    if (!notification.read) {
      await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", notification.id);
      
      fetchNotifications();
    }

    // Don't redirect for welcome notifications or system notifications with discover action
    if (notification.type.toLowerCase().includes('welcome') || 
        notification.title.toLowerCase().includes('welcome') ||
        (notification.type === 'system' && notification.action_url === '/discover')) {
      return;
    }

    // Don't navigate to JSON action URLs
    const actionData = parseActionUrl(notification.action_url);
    if (actionData) return;

    // Navigate to action URL if available
    if (notification.action_url) {
      window.location.href = notification.action_url;
    }
  };

  const getFilteredNotifications = () => {
    if (activeFilter === "All") return notifications;
    if (activeFilter === "Unread") return notifications.filter(n => !n.read);
    if (activeFilter === "Booking") return notifications.filter(n => n.type.toLowerCase().includes("booking"));
    if (activeFilter === "Events") return notifications.filter(n => n.type.toLowerCase().includes("event"));
    if (activeFilter === "Market") return notifications.filter(n => n.type.toLowerCase().includes("market"));
    if (activeFilter === "Jobs") return notifications.filter(n => n.type.toLowerCase().includes("job"));
    if (activeFilter === "Other") {
      return notifications.filter(n => {
        const type = n.type.toLowerCase();
        return !type.includes("booking") && !type.includes("event") && 
               !type.includes("market") && !type.includes("job");
      });
    }
    
    return notifications;
  };

  const filteredNotifications = getFilteredNotifications();

  const getNotificationIcon = (type: string) => {
    const lowerType = type.toLowerCase();
    if (lowerType.includes("booking")) return Calendar;
    if (lowerType.includes("event")) return Bell;
    if (lowerType.includes("job")) return Briefcase;
    if (lowerType.includes("market")) return ShoppingBag;
    return Info; // default for "Other"
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-muted-foreground">
          View and manage all your notifications
        </p>
      </div>

      {/* Filter Tabs */}
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
                activeFilter === filter ? "bg-primary text-primary-foreground hover:bg-primary/90" : "hover:bg-muted"
              )}
            >
              {filter}
              {filter === "Unread" && notifications.filter(n => !n.read).length > 0 && (
                <span className="ml-1.5 sm:ml-2 px-1.5 sm:px-2 py-0.5 text-xs rounded-full bg-primary-foreground text-primary">
                  {notifications.filter(n => !n.read).length}
                </span>
              )}
            </Button>
          ))}
        </div>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={handleMarkAllRead}
          disabled={notifications.filter(n => !n.read).length === 0}
          className="w-full sm:w-auto"
        >
          Mark All Read
        </Button>
      </div>

      {/* Notifications List */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6">
            {activeFilter === "All" ? "All Notifications" : `${activeFilter} Notifications`}
          </h2>
          
          {filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="w-16 h-16 text-muted-foreground/40 mb-4" />
              <p className="font-medium text-lg mb-1">
                {activeFilter === "All" ? "No notifications yet" : `No ${activeFilter.toLowerCase()} notifications`}
              </p>
              <p className="text-sm text-muted-foreground">
                {activeFilter === "All" 
                  ? "You'll see your notifications here when you have any"
                  : `Try selecting a different filter to see other notifications`
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredNotifications.map((notification) => {
                const IconComponent = getNotificationIcon(notification.type);
                const actionData = parseActionUrl(notification.action_url);
                const isTeamInvitation = notification.type === 'team_invitation' && actionData?.type === 'team_invitation';
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
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center",
                        notification.read ? "bg-muted" : "bg-primary/10"
                      )}>
                        <IconComponent className={cn(
                          "w-5 h-5",
                          notification.read ? "text-muted-foreground" : "text-primary"
                        )} />
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
                      <p className="text-sm text-muted-foreground mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </p>
                      {isTeamInvitation && actionData?.invitation_id && (
                        <TeamInvitationActions
                          invitationId={actionData.invitation_id}
                          onAction={() => {
                            handleDeleteNotification(undefined as any, notification.id);
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
