import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface UserStats {
  followersCount: number;
  followingCount: number;
  unreadNotifications: number;
  savedPostsCount: number;
  followedEventsCount: number;
  teamMembershipsCount: number;
}

export function useUserStats(userId: string | undefined) {
  return useQuery({
    queryKey: ['user-stats', userId],
    queryFn: async (): Promise<UserStats> => {
      if (!userId) {
        return {
          followersCount: 0,
          followingCount: 0,
          unreadNotifications: 0,
          savedPostsCount: 0,
          followedEventsCount: 0,
          teamMembershipsCount: 0,
        };
      }

      // Batch all count queries in parallel
      const [
        followersResult,
        followingResult,
        notificationsResult,
        savedPostsResult,
        followedEventsResult,
        teamMembersResult,
      ] = await Promise.all([
        supabase.from('user_follows').select('*', { count: 'exact', head: true }).eq('followed_id', userId),
        supabase.from('user_follows').select('*', { count: 'exact', head: true }).eq('follower_id', userId),
        supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('read', false),
        supabase.from('saved_posts').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('followed_events').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('team_members').select('*', { count: 'exact', head: true }).eq('member_id', userId).eq('status', 'accepted'),
      ]);

      return {
        followersCount: followersResult.count || 0,
        followingCount: followingResult.count || 0,
        unreadNotifications: notificationsResult.count || 0,
        savedPostsCount: savedPostsResult.count || 0,
        followedEventsCount: followedEventsResult.count || 0,
        teamMembershipsCount: teamMembersResult.count || 0,
      };
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
}
