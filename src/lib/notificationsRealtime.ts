import type { QueryClient } from "@tanstack/react-query";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { notificationsQueryKey } from "@/lib/notifications";

type UserSubscription = {
  channel: RealtimeChannel;
  refCount: number;
};

const subscriptions = new Map<string, UserSubscription>();

function invalidateNotificationQueries(userId: string, queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: notificationsQueryKey(userId) });
  queryClient.invalidateQueries({ queryKey: ["user-stats", userId] });
}

/** One realtime channel per user — safe when multiple components use useNotifications */
export function subscribeNotificationsRealtime(
  userId: string,
  queryClient: QueryClient
): () => void {
  const existing = subscriptions.get(userId);
  if (existing) {
    existing.refCount += 1;
    return () => {
      existing.refCount -= 1;
      if (existing.refCount <= 0) {
        void supabase.removeChannel(existing.channel);
        subscriptions.delete(userId);
      }
    };
  }

  const channel = supabase
    .channel(`notifications-${userId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      },
      () => invalidateNotificationQueries(userId, queryClient)
    )
    .subscribe();

  subscriptions.set(userId, { channel, refCount: 1 });

  return () => {
    const sub = subscriptions.get(userId);
    if (!sub) return;
    sub.refCount -= 1;
    if (sub.refCount <= 0) {
      void supabase.removeChannel(sub.channel);
      subscriptions.delete(userId);
    }
  };
}
