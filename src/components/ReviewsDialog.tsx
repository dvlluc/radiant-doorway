import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";

interface Review {
  id: string;
  rating: number;
  content: string;
  title?: string;
  created_at: string;
  reviewer: {
    id: string;
    display_name: string | null;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  };
}

interface ReviewsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessId: string;
  businessName: string;
}

export function ReviewsDialog({ open, onOpenChange, businessId, businessName }: ReviewsDialogProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && businessId) {
      fetchReviews();
    }
  }, [open, businessId]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const { data: reviewsData, error: reviewsError } = await supabase
        .from("reviews")
        .select(`
          id,
          rating,
          content,
          title,
          created_at,
          reviewer_id,
          profiles!reviews_reviewer_id_fkey (
            id,
            display_name,
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq("business_id", businessId)
        .order("created_at", { ascending: false });

      if (reviewsError) throw reviewsError;

      const reviewerIds = (reviewsData || []).map((r) => r.reviewer_id).filter(Boolean);

      const [rolesResult, businessResult, brandResult, charityResult] = await Promise.all([
        reviewerIds.length > 0
          ? supabase.from("user_roles").select("user_id, account_type").in("user_id", reviewerIds)
          : Promise.resolve({ data: [] }),
        reviewerIds.length > 0
          ? supabase.from("business_profiles").select("user_id, business_name").in("user_id", reviewerIds)
          : Promise.resolve({ data: [] }),
        reviewerIds.length > 0
          ? supabase.from("brand_profiles").select("user_id, brand_name").in("user_id", reviewerIds)
          : Promise.resolve({ data: [] }),
        reviewerIds.length > 0
          ? supabase.from("charitable_profiles").select("user_id, organization_name").in("user_id", reviewerIds)
          : Promise.resolve({ data: [] }),
      ]);

      const accountTypeMap = new Map(rolesResult.data?.map((r) => [r.user_id, r.account_type]) || []);
      const businessNameMap = new Map(businessResult.data?.map((b) => [b.user_id, b.business_name]) || []);
      const brandNameMap = new Map(brandResult.data?.map((b) => [b.user_id, b.brand_name]) || []);
      const organizationNameMap = new Map(
        charityResult.data?.map((c) => [c.user_id, c.organization_name]) || []
      );

      const getDisplayName = (userId: string, profile: { display_name?: string | null; first_name?: string | null; last_name?: string | null } | null) => {
        const accountType = accountTypeMap.get(userId);
        if (accountType === "business") return businessNameMap.get(userId) || "Business";
        if (accountType === "brand") return brandNameMap.get(userId) || "Brand";
        if (accountType === "charitable_partner") return organizationNameMap.get(userId) || "Organization";
        return (
          profile?.display_name ||
          `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim() ||
          "Anonymous"
        );
      };

      setReviews(
        (reviewsData || []).map((r) => ({
          id: r.id,
          rating: r.rating,
          content: r.content,
          title: r.title,
          created_at: r.created_at,
          reviewer: {
            id: r.profiles?.id || "",
            display_name: getDisplayName(r.reviewer_id, r.profiles),
            first_name: null,
            last_name: null,
            avatar_url: r.profiles?.avatar_url || null,
          },
        }))
      );
    } catch (error) {
      console.error("Error fetching reviews:", error);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const getReviewerName = (reviewer: Review["reviewer"]) => {
    return reviewer.display_name || "Anonymous";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Reviews for {businessName}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[60vh] pr-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">Loading reviews...</p>
            </div>
          ) : reviews.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">No reviews yet</p>
            </div>
          ) : (
            <div className="space-y-6">
              {reviews.map((review) => (
                <div key={review.id} className="border-b border-border pb-6 last:border-0">
                  <div className="flex items-start gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={review.reviewer.avatar_url || undefined} />
                      <AvatarFallback>
                        {getReviewerName(review.reviewer).substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <p className="font-semibold">{getReviewerName(review.reviewer)}</p>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 mb-3">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${
                              star <= review.rating ? "fill-black text-black" : "text-black"
                            }`}
                          />
                        ))}
                      </div>

                      {review.title && <h4 className="font-semibold mb-1">{review.title}</h4>}

                      <p className="text-sm text-foreground whitespace-pre-wrap">{review.content}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
