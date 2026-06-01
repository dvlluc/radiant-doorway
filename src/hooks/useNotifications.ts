import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import {
  type AppNotification,
  notificationsQueryKey,
} from "@/lib/notifications";
import { subscribeNotificationsRealtime } from "@/lib/notificationsRealtime";

const PREVIEW_LIMIT = 5;

async function fetchNotifications(userId: string): Promise<AppNotification[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export function useNotifications(userId: string | undefined) {
  const queryClient = useQueryClient();
  const queryKey = notificationsQueryKey(userId);

  const {
    data: notifications = [],
    isLoading,
    isFetching,
  } = useQuery({
    queryKey,
    queryFn: () => fetchNotifications(userId!),
    enabled: !!userId,
    staleTime: 15 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const unreadCount = notifications.filter((n) => !n.read).length;
  const hasUnread = unreadCount > 0;
  const previewNotifications = notifications.slice(0, PREVIEW_LIMIT);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey });
    if (userId) {
      queryClient.invalidateQueries({ queryKey: ["user-stats", userId] });
    }
  };

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", notificationId);

      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      if (!userId) return;

      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", userId)
        .eq("read", false);

      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", notificationId);

      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  useEffect(() => {
    if (!userId) return;
    return subscribeNotificationsRealtime(userId, queryClient);
  }, [userId, queryClient]);

  return {
    notifications,
    previewNotifications,
    unreadCount,
    hasUnread,
    isLoading,
    isFetching,
    markAsRead: markAsReadMutation.mutateAsync,
    markAllAsRead: markAllAsReadMutation.mutateAsync,
    deleteNotification: deleteNotificationMutation.mutateAsync,
    isMarkingAllRead: markAllAsReadMutation.isPending,
  };
}
