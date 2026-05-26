import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface FollowUser {
  id: string;
  display_name: string;
  avatar_url: string;
  account_type: string;
  organization_name?: string;
  brand_name?: string;
  business_name?: string;
}

export function FollowersSection({ userId }: { userId: string }) {
  const [followers, setFollowers] = useState<FollowUser[]>([]);
  const [following, setFollowing] = useState<FollowUser[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchFollowData();
  }, [userId]);

  const fetchFollowData = async () => {
    setLoading(true);

    // Fetch followers
    const { data: followersData } = await supabase
      .from("user_follows")
      .select("follower_id")
      .eq("followed_id", userId);

    // Fetch following
    const { data: followingData } = await supabase
      .from("user_follows")
      .select("followed_id")
      .eq("follower_id", userId);

    const followerIds = followersData?.map((f) => f.follower_id) || [];
    const followingIds = followingData?.map((f) => f.followed_id) || [];

    // Fetch user profiles, roles, and organization names
    if (followerIds.length > 0 || followingIds.length > 0) {
      const allUserIds = [...new Set([...followerIds, ...followingIds])];

      const [profiles, userRoles, businessProfiles, brandProfiles, charitableProfiles] = await Promise.all([
        supabase.from("profiles").select("id, display_name, avatar_url").in("id", allUserIds),
        supabase.from("user_roles").select("user_id, account_type").in("user_id", allUserIds),
        supabase.from("business_profiles").select("user_id, business_name").in("user_id", allUserIds),
        supabase.from("brand_profiles").select("user_id, brand_name").in("user_id", allUserIds),
        supabase.from("charitable_profiles").select("user_id, organization_name").in("user_id", allUserIds)
      ]);

      const profileMap = new Map(profiles.data?.map((p) => [p.id, p]) || []);
      const accountTypeMap = new Map(userRoles.data?.map((r) => [r.user_id, r.account_type]) || []);
      const businessMap = new Map(businessProfiles.data?.map((b) => [b.user_id, b.business_name]) || []);
      const brandMap = new Map(brandProfiles.data?.map((b) => [b.user_id, b.brand_name]) || []);
      const charitableMap = new Map(charitableProfiles.data?.map((c) => [c.user_id, c.organization_name]) || []);

      const mapUserData = (id: string): FollowUser => {
        const profile = profileMap.get(id);
        const accountType = accountTypeMap.get(id);
        const businessName = businessMap.get(id);
        const brandName = brandMap.get(id);
        const orgName = charitableMap.get(id);
        
        // Determine display name - prioritize organizational names for non-individual accounts
        let displayName = "User";
        
        // Check account type first to determine if we should use organizational name
        if (accountType === "business" && businessName) {
          displayName = businessName;
        } else if (accountType === "brand" && brandName) {
          displayName = brandName;
        } else if (accountType === "charitable_partner" && orgName) {
          displayName = orgName;
        } else {
          // For individual accounts, use display_name from profiles
          displayName = profile?.display_name || "User";
        }
        
        // Determine actual account type based on available data
        let finalAccountType = accountType || "individual";
        if (!accountType) {
          if (businessName) finalAccountType = "business";
          else if (brandName) finalAccountType = "brand";
          else if (orgName) finalAccountType = "charitable_partner";
        }

        return {
          id,
          display_name: displayName,
          avatar_url: profile?.avatar_url || "",
          account_type: finalAccountType,
          organization_name: orgName,
          brand_name: brandName,
          business_name: businessName,
        };
      };

      setFollowers(followerIds.map(mapUserData));
      setFollowing(followingIds.map(mapUserData));
    }

    setLoading(false);
  };

  const handleUnfollow = async (followedId: string) => {
    const { error } = await supabase
      .from("user_follows")
      .delete()
      .eq("follower_id", userId)
      .eq("followed_id", followedId);

    if (!error) {
      setFollowing((prev) => prev.filter((u) => u.id !== followedId));
      toast({
        title: "Unfollowed",
        description: "Successfully unfollowed user",
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to unfollow user",
        variant: "destructive",
      });
    }
  };

  const handleNavigateToProfile = (userId: string) => {
    navigate(`/professional/${userId}`);
  };

  if (loading) {
    return (
      <Card className="p-6">
        <p className="text-center text-muted-foreground">Loading...</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <Tabs defaultValue="followers" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="followers">
            Followers ({followers.length})
          </TabsTrigger>
          <TabsTrigger value="following">
            Following ({following.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="followers" className="space-y-4">
          {followers.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No followers yet
            </p>
          ) : (
            followers.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Avatar
                    className="w-12 h-12 cursor-pointer"
                    onClick={() => handleNavigateToProfile(user.id)}
                  >
                    <AvatarImage src={user.avatar_url} />
                    <AvatarFallback>
                      {user.display_name[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <button
                      onClick={() => handleNavigateToProfile(user.id)}
                      className="font-semibold hover:underline hover:text-primary transition-colors"
                    >
                      {user.display_name}
                    </button>
                    {user.account_type !== "individual" && (
                      <p className="text-xs text-muted-foreground capitalize">
                        {user.account_type.replace("_", " ")}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="following" className="space-y-4">
          {following.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Not following anyone yet
            </p>
          ) : (
            following.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Avatar
                    className="w-12 h-12 cursor-pointer"
                    onClick={() => handleNavigateToProfile(user.id)}
                  >
                    <AvatarImage src={user.avatar_url} />
                    <AvatarFallback>
                      {user.display_name[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <button
                      onClick={() => handleNavigateToProfile(user.id)}
                      className="font-semibold hover:underline hover:text-primary transition-colors"
                    >
                      {user.display_name}
                    </button>
                    {user.account_type !== "individual" && (
                      <p className="text-xs text-muted-foreground capitalize">
                        {user.account_type.replace("_", " ")}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleUnfollow(user.id)}
                >
                  Unfollow
                </Button>
              </div>
            ))
          )}
        </TabsContent>
      </Tabs>
    </Card>
  );
}
