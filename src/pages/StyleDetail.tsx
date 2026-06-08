import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, Clock, MapPin, Star, Bookmark, BookmarkCheck, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StyleCategoriesBadge } from "@/components/StyleCategoriesBadge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { SEO } from "@/components/SEO";
import { getCurrencyFromLocation } from "@/utils/currency";
import { useSmartBack } from "@/hooks/useSmartBack";
import { useCanBookAsCustomer } from "@/hooks/useCanBookAsCustomer";

interface StyleData {
  id: string;
  style_name: string;
  category: string;
  photo_url: string;
  description: string | null;
  services_required: string[];
  estimated_price: number | null;
  estimated_time: number | null;
  location: string | null;
  professional_id: string;
}

interface Professional {
  business_name: string;
  avatar_url: string | null;
  address: string;
  category: string | null;
  user_id: string;
}

interface Review {
  id: string;
  rating: number;
  title: string;
  content: string;
  created_at: string;
  reviewer_name?: string;
}

export default function StyleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const goBack = useSmartBack("/explore-styles");
  const { user } = useAuth();
  const { canBook } = useCanBookAsCustomer();
  const { toast } = useToast();
  const [style, setStyle] = useState<StyleData | null>(null);
  const [professional, setProfessional] = useState<Professional | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchStyle();
  }, [id]);

  const fetchStyle = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("styles")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      setLoading(false);
      return;
    }
    setStyle(data);

    // Fetch professional
    const { data: biz } = await supabase
      .from("business_profiles")
      .select("business_name, avatar_url, address, category, user_id")
      .eq("user_id", data.professional_id)
      .single();
    if (biz) setProfessional(biz);

    // Fetch reviews
    const { data: revs } = await supabase
      .from("reviews")
      .select("id, rating, title, content, created_at, reviewer_id")
      .eq("business_id", data.professional_id)
      .order("created_at", { ascending: false })
      .limit(5);
    
    if (revs && revs.length > 0) {
      const reviewerIds = revs.map(r => r.reviewer_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .in("id", reviewerIds);
      
      const nameMap: Record<string, string> = {};
      (profiles || []).forEach(p => {
        nameMap[p.id] = [p.first_name, p.last_name].filter(Boolean).join(" ") || "Anonymous";
      });

      setReviews(revs.map(r => ({ ...r, reviewer_name: nameMap[r.reviewer_id] })));
      setAvgRating(revs.reduce((sum, r) => sum + r.rating, 0) / revs.length);
    }

    // Check saved
    if (user) {
      const { data: saved } = await supabase
        .from("saved_styles")
        .select("id")
        .eq("user_id", user.id)
        .eq("style_id", id!)
        .maybeSingle();
      setIsSaved(!!saved);
    }

    setLoading(false);
  };

  const toggleSave = async () => {
    if (!user) {
      toast({ title: "Sign in to save styles", variant: "destructive" });
      return;
    }
    if (isSaved) {
      await supabase.from("saved_styles").delete().eq("user_id", user.id).eq("style_id", id!);
      setIsSaved(false);
    } else {
      await supabase.from("saved_styles").insert({ user_id: user.id, style_id: id! });
      setIsSaved(true);
    }
  };

  const handleBookThisLook = () => {
    if (!style || !professional) return;
    navigate(`/booking/${professional.user_id}`, {
      state: {
        fromStyle: true,
        styleId: style.id,
        styleName: style.style_name,
        stylePhoto: style.photo_url,
        servicesRequired: style.services_required,
        estimatedPrice: style.estimated_price,
        estimatedTime: style.estimated_time,
      }
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!style) {
    return (
      <div className="text-center py-16">
        <h2 className="text-xl font-semibold">Style not found</h2>
        <Button variant="outline" onClick={() => navigate("/explore-styles")} className="mt-4">
          Back to Explore
        </Button>
      </div>
    );
  }

  const currency = getCurrencyFromLocation(style.location || "United States");

  return (
    <>
      <SEO title={`${style.style_name} | BelloNecta`} description={style.description || `Book the ${style.style_name} look with a professional on BelloNecta.`} />
      
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back Button */}
        <Button variant="ghost" size="sm" onClick={goBack} className="gap-2 -ml-2">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Image */}
          <div className="relative rounded-xl overflow-hidden">
            <img
              src={style.photo_url}
              alt={style.style_name}
              className="w-full object-cover max-h-[500px] md:max-h-[600px]"
            />
            <StyleCategoriesBadge
              category={style.category}
              className="absolute top-4 left-4"
            />
          </div>

          {/* Details */}
          <div className="space-y-5">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                {style.style_name}
              </h1>
              <div className="flex items-center gap-3 mt-2">
                {style.estimated_price != null && (
                  <span className="text-xl font-semibold">{currency.symbol}{style.estimated_price.toFixed(0)}</span>
                )}
                {style.estimated_time != null && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>{style.estimated_time} min</span>
                  </div>
                )}
              </div>
            </div>

            {style.description && (
              <p className="text-sm text-muted-foreground leading-relaxed">{style.description}</p>
            )}

            {/* Professional Card */}
            {professional && (
              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/professional/${professional.user_id}`)}>
                <CardContent className="p-4 flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={professional.avatar_url || ""} />
                    <AvatarFallback>{professional.business_name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{professional.business_name}</p>
                    <div className="flex items-start gap-1 text-xs text-muted-foreground">
                      <MapPin className="mt-0.5 w-3 h-3 shrink-0" />
                      <span className="break-words">{professional.address}</span>
                    </div>
                    {avgRating > 0 && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <Star className="w-3 h-3 fill-[#C1A46D] text-[#C1A46D]" />
                        <span className="text-xs font-medium">{avgRating.toFixed(1)}</span>
                        <span className="text-xs text-muted-foreground">({reviews.length} reviews)</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Style By */}
            {style.services_required && style.services_required.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Style By</h3>
                <div className="flex flex-wrap gap-2">
                  {style.services_required.map((s, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">{s}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              {canBook && (
                <Button className="flex-1 h-12 text-sm font-semibold" onClick={handleBookThisLook}>
                  Book This Look
                </Button>
              )}
              <Button variant="outline" size="icon" className="h-12 w-12" onClick={toggleSave}>
                {isSaved ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        {reviews.length > 0 && (
          <div className="space-y-4 pt-4">
            <Separator />
            <h2 className="text-lg font-semibold" style={{ fontFamily: "'Playfair Display', serif" }}>
              Reviews of {professional?.business_name}
            </h2>
            <div className="space-y-3">
              {reviews.map(review => (
                <Card key={review.id}>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{review.reviewer_name}</span>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${i < review.rating ? "fill-[#C1A46D] text-[#C1A46D]" : "text-muted"}`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm font-medium">{review.title}</p>
                    <p className="text-xs text-muted-foreground">{review.content}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
