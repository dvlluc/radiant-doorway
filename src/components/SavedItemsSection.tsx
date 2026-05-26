import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bookmark, Heart, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface SavedPost {
  id: string;
  post_id: string;
  created_at: string;
  posts: {
    id: string;
    content: string;
    image_url: string;
    likes_count: number;
    comments_count: number;
    created_at: string;
    profiles: {
      display_name: string;
      avatar_url: string;
    };
  };
}

export function SavedItemsSection() {
  const [savedPosts, setSavedPosts] = useState<SavedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchSavedPosts();
  }, []);

  const fetchSavedPosts = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // First get saved post IDs
    const { data: savedData, error: savedError } = await supabase
      .from("saved_posts")
      .select("id, post_id, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (savedError || !savedData) {
      console.error("Error fetching saved posts:", savedError);
      setLoading(false);
      return;
    }

    // Get post details
    const postIds = savedData.map(sp => sp.post_id);
    const { data: posts } = await supabase
      .from("posts")
      .select("id, user_id, content, image_url, likes_count, comments_count, created_at")
      .in("id", postIds);

    // Get profiles for posts
    const userIds = [...new Set(posts?.map(p => p.user_id) || [])];
    const [profilesResult, rolesResult, businessResult, brandResult, charityResult] = await Promise.all([
      supabase.from("profiles").select("id, display_name, avatar_url").in("id", userIds),
      supabase.from("user_roles").select("user_id, account_type").in("user_id", userIds),
      supabase.from("business_profiles").select("user_id, business_name, logo_url, avatar_url").in("user_id", userIds),
      supabase.from("brand_profiles").select("user_id, brand_name, logo_url, avatar_url").in("user_id", userIds),
      supabase.from("charitable_profiles").select("user_id, organization_name, logo_url, avatar_url").in("user_id", userIds)
    ]);

    // Create lookup maps
    const profileMap = new Map(profilesResult.data?.map(p => [p.id, p]) || []);
    const accountTypeMap = new Map(rolesResult.data?.map(r => [r.user_id, r.account_type]) || []);
    const businessMap = new Map(businessResult.data?.map(b => [b.user_id, b]) || []);
    const brandMap = new Map(brandResult.data?.map(b => [b.user_id, b]) || []);
    const charityMap = new Map(charityResult.data?.map(c => [c.user_id, c]) || []);

    // Helper to get display name and avatar based on account type
    const getUserInfo = (userId: string) => {
      const accountType = accountTypeMap.get(userId);
      const profile = profileMap.get(userId);
      let displayName = "User";
      let avatarUrl = "";

      if (accountType === "business") {
        const business = businessMap.get(userId);
        displayName = business?.business_name || "Business";
        avatarUrl = business?.logo_url || business?.avatar_url || "";
      } else if (accountType === "brand") {
        const brand = brandMap.get(userId);
        displayName = brand?.brand_name || "Brand";
        avatarUrl = brand?.logo_url || brand?.avatar_url || "";
      } else if (accountType === "charitable_partner") {
        const charity = charityMap.get(userId);
        displayName = charity?.organization_name || "Organization";
        avatarUrl = charity?.logo_url || charity?.avatar_url || "";
      } else {
        displayName = profile?.display_name || "User";
        avatarUrl = profile?.avatar_url || "";
      }

      return { display_name: displayName, avatar_url: avatarUrl };
    };

    const postMap = new Map(posts?.map(p => [p.id, {
      ...p,
      profiles: getUserInfo(p.user_id)
    }]) || []);

    const savedPostsWithData = savedData
      .map(sp => ({
        ...sp,
        posts: postMap.get(sp.post_id)
      }))
      .filter(sp => sp.posts);

    setSavedPosts(savedPostsWithData as any);
    setLoading(false);
  };

  const handleUnsave = async (savedPostId: string, postId: string) => {
    const { error } = await supabase
      .from("saved_posts")
      .delete()
      .eq("id", savedPostId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to remove saved post",
        variant: "destructive",
      });
    } else {
      setSavedPosts((prev) => prev.filter((p) => p.id !== savedPostId));
      toast({
        title: "Post unsaved",
        description: "Post removed from saved items",
      });
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading saved items...</div>;
  }

  if (savedPosts.length === 0) {
    return (
      <div className="text-center py-12">
        <Bookmark className="w-16 h-16 text-muted-foreground/40 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">No saved items yet</h3>
        <p className="text-muted-foreground">
          Posts you save will appear here for easy access
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Saved Items ({savedPosts.length})</h2>
      <div className="grid gap-4">
        {savedPosts.map((savedPost) => {
          const post = savedPost.posts;
          if (!post) return null;

          return (
            <Card key={savedPost.id} className="overflow-hidden">
              <div className="flex gap-4 p-4">
                {post.image_url && (
                  <div
                    className="w-32 h-32 rounded-lg bg-cover bg-center flex-shrink-0"
                    style={{ backgroundImage: `url(${post.image_url})` }}
                  />
                )}
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold">
                        {post.profiles?.display_name || "User"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(post.created_at), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUnsave(savedPost.id, post.id)}
                    >
                      <Bookmark className="w-4 h-4 fill-current" />
                    </Button>
                  </div>
                  <p className="text-sm line-clamp-2">{post.content}</p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Heart className="w-4 h-4" />
                      {post.likes_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="w-4 h-4" />
                      {post.comments_count}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
