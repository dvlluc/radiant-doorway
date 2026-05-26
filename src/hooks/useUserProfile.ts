import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface UserProfile {
  display_name: string;
  avatar_url: string | null;
  first_name: string | null;
  account_type: string;
}

export function useUserProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ['user-profile', userId],
    queryFn: async (): Promise<UserProfile | null> => {
      if (!userId) return null;

      // Batch all queries using Promise.all for parallel execution
      const [roleResult, profileResult, businessResult, brandResult, charityResult] = await Promise.all([
        supabase.from('user_roles').select('account_type').eq('user_id', userId).maybeSingle(),
        supabase.from('profiles').select('first_name, display_name, avatar_url').eq('id', userId).maybeSingle(),
        supabase.from('business_profiles').select('business_name, logo_url, avatar_url').eq('user_id', userId).maybeSingle(),
        supabase.from('brand_profiles').select('brand_name, logo_url, avatar_url').eq('user_id', userId).maybeSingle(),
        supabase.from('charitable_profiles').select('organization_name, logo_url, avatar_url').eq('user_id', userId).maybeSingle(),
      ]);

      const profileData = profileResult.data;

      // Fallback account type resolution when user_roles is missing
      const accountType = roleResult.data?.account_type
        || (charityResult.data?.organization_name ? 'charitable_partner'
          : brandResult.data?.brand_name ? 'brand'
          : businessResult.data?.business_name ? 'business'
          : 'individual');
      
      let displayName = null;
      let avatarUrl = null;

      // Determine display name and avatar based on account type
      if (accountType === 'charitable_partner') {
        displayName = charityResult.data?.organization_name || profileData?.display_name || profileData?.first_name;
        avatarUrl = charityResult.data?.logo_url || charityResult.data?.avatar_url || null;
      } else if (accountType === 'brand') {
        displayName = brandResult.data?.brand_name || profileData?.display_name || profileData?.first_name;
        avatarUrl = brandResult.data?.logo_url || brandResult.data?.avatar_url || null;
      } else if (accountType === 'business') {
        displayName = businessResult.data?.business_name || profileData?.display_name || profileData?.first_name;
        avatarUrl = businessResult.data?.logo_url || businessResult.data?.avatar_url || null;
      } else {
        displayName = profileData?.display_name || profileData?.first_name;
        avatarUrl = profileData?.avatar_url;
      }

      return {
        display_name: displayName || 'User',
        avatar_url: avatarUrl || profileData?.avatar_url || null,
        first_name: profileData?.first_name || null,
        account_type: accountType,
      };
    },
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}
