import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Clock, MapPin, Star, Bookmark, BookmarkCheck, X, User, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { getCurrencyFromLocation } from "@/utils/currency";
import { ShareDialog } from "@/components/ShareDialog";
import { addServiceToCart, isCartDuplicateError } from "@/lib/booking/cart";
import { useBookingCart, useInvalidateBookingCart } from "@/hooks/useBookingCart";

interface StyleData {
  id: string;
  style_name: string;
  category: string;
  photo_url: string;
  description: string | null;
  services_required: string[] | null;
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

interface FallbackEstimate {
  price: number | null;
  duration: number | null;
  currencySymbol: string | null;
}

interface StyleDetailModalProps {
  styleId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const emptyEstimate: FallbackEstimate = {
  price: null,
  duration: null,
  currencySymbol: null,
};

export function StyleDetailModal({ styleId, open, onOpenChange }: StyleDetailModalProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: bookingCart } = useBookingCart(open ? user?.id : undefined);
  const invalidateBookingCart = useInvalidateBookingCart();
  const styleInCart = styleId ? bookingCart?.productIds.includes(styleId) : false;
  const [style, setStyle] = useState<StyleData | null>(null);
  const [professional, setProfessional] = useState<Professional | null>(null);
  const [avgRating, setAvgRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fallbackEstimate, setFallbackEstimate] = useState<FallbackEstimate>(emptyEstimate);
  const [shareOpen, setShareOpen] = useState(false);
  useEffect(() => {
    if (styleId && open) {
      fetchStyle();
    } else {
      setStyle(null);
      setProfessional(null);
      setAvgRating(0);
      setReviewCount(0);
      setIsSaved(false);
      setFallbackEstimate(emptyEstimate);
      setLoading(true);
    }
  }, [styleId, open]);

  const fetchStyle = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("styles")
      .select("*")
      .eq("id", styleId)
      .single();

    if (error || !data) {
      setLoading(false);
      return;
    }

    setStyle(data);

    const needsFallbackEstimate = data.estimated_price == null || data.estimated_time == null;

    const [businessResult, reviewsResult, savedResult, serviceResult] = await Promise.all([
      supabase
        .from("business_profiles")
        .select("business_name, avatar_url, address, category, user_id")
        .eq("user_id", data.professional_id)
        .single(),
      supabase
        .from("reviews")
        .select("rating")
        .eq("business_id", data.professional_id),
      user
        ? supabase
            .from("saved_styles")
            .select("id")
            .eq("user_id", user.id)
            .eq("style_id", styleId!)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      needsFallbackEstimate
        ? supabase
            .from("services")
            .select("price, duration, currency_symbol")
            .eq("user_id", data.professional_id)
            .eq("is_active", true)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ]);

    if (businessResult.data) {
      setProfessional(businessResult.data);
    }

    if (reviewsResult.data && reviewsResult.data.length > 0) {
      setAvgRating(reviewsResult.data.reduce((sum, review) => sum + review.rating, 0) / reviewsResult.data.length);
      setReviewCount(reviewsResult.data.length);
    } else {
      setAvgRating(0);
      setReviewCount(0);
    }

    setIsSaved(!!savedResult.data);

    if (serviceResult.data) {
      setFallbackEstimate({
        price: serviceResult.data.price,
        duration: serviceResult.data.duration,
        currencySymbol: serviceResult.data.currency_symbol,
      });
    } else {
      setFallbackEstimate(emptyEstimate);
    }

    setLoading(false);
  };

  const toggleSave = async () => {
    if (!user) {
      toast({ title: "Sign in to save styles", variant: "destructive" });
      return;
    }

    if (isSaved) {
      await supabase.from("saved_styles").delete().eq("user_id", user.id).eq("style_id", styleId!);
      setIsSaved(false);
    } else {
      await supabase.from("saved_styles").insert({ user_id: user.id, style_id: styleId! });
      setIsSaved(true);
    }
  };

  const handleAddToCart = async () => {
    if (!style || !professional || !user) {
      if (!user) {
        toast({ title: "Sign in required", description: "Please sign in to book.", variant: "destructive" });
      }
      return;
    }

    if (displayedPrice == null || displayedTime == null) {
      toast({
        title: "Cannot add to cart",
        description: "Price and duration are required for this style.",
        variant: "destructive",
      });
      return;
    }

    if (styleInCart) {
      toast({ title: "Already in cart", description: "This look is already in your cart." });
      return;
    }

    try {
      await addServiceToCart(
        user.id,
        {
          id: style.id,
          name: style.style_name,
          price: displayedPrice,
          duration: displayedTime,
          description: style.description,
          image_url: style.photo_url,
        },
        { id: professional.user_id, name: professional.business_name },
        {
          itemKind: "style",
          styleId: style.id,
          styleName: style.style_name,
          stylePhoto: style.photo_url,
        }
      );
      await invalidateBookingCart(user.id);
      toast({ title: "Added to cart", description: "Saved for 24 hours. Book time from your cart." });
      onOpenChange(false);
      navigate("/cart");
    } catch (error) {
      if (isCartDuplicateError(error)) {
        toast({ title: "Already in cart", description: "This look is already in your cart." });
        return;
      }
      toast({ title: "Error", description: "Could not add to cart.", variant: "destructive" });
    }
  };

  const currency = style ? getCurrencyFromLocation(style.location || "United States") : { symbol: "$" };
  const displayedPrice = style?.estimated_price ?? fallbackEstimate.price;
  const displayedTime = style?.estimated_time ?? fallbackEstimate.duration;
  const displayedCurrencySymbol = fallbackEstimate.currencySymbol || currency.symbol;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[95vw] max-w-[420px] gap-0 overflow-y-auto rounded-2xl border-0 p-0 shadow-2xl [&>button]:hidden">
        {loading ? (
          <div className="flex h-[400px] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
          </div>
        ) : !style ? (
          <div className="px-4 py-16 text-center">
            <p className="text-muted-foreground">Style not found</p>
          </div>
        ) : (
          <>
            <div className="relative">
              <img
                src={style.photo_url}
                alt={style.style_name}
                className="max-h-[380px] w-full object-cover"
              />

              <button
                onClick={() => onOpenChange(false)}
                className="absolute right-3 top-3 rounded-full bg-background/80 p-1.5 backdrop-blur-sm transition-colors hover:bg-background"
              >
                <X className="h-4 w-4" />
              </button>

              <Badge className="absolute left-3 top-3 border-0 bg-background/80 text-xs font-medium capitalize text-foreground backdrop-blur-sm">
                {style.category}
              </Badge>

              <div className="absolute bottom-3 right-3 flex items-center gap-2">
                <button
                  onClick={() => setShareOpen(true)}
                  className="rounded-full bg-background/80 p-2 backdrop-blur-sm transition-colors hover:bg-background"
                >
                  <Share2 className="h-4 w-4" />
                </button>
                <button
                  onClick={toggleSave}
                  className="rounded-full bg-background/80 p-2 backdrop-blur-sm transition-colors hover:bg-background"
                >
                  {isSaved ? <BookmarkCheck className="h-4 w-4 text-primary" /> : <Bookmark className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-4 p-5">
              <h2 className="text-xl font-bold leading-tight tracking-tight">
                {style.style_name}
              </h2>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                <div className="flex min-w-0 items-center gap-1.5">
                  <span className="shrink-0 text-xs font-medium text-muted-foreground">Style by</span>
                  <span className="truncate font-medium">
                    {style.services_required?.length ? style.services_required.join(", ") : "Not added"}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="shrink-0 text-xs font-medium text-muted-foreground">Est. price</span>
                  <span className="font-semibold text-foreground">
                    {displayedPrice != null ? `${displayedCurrencySymbol}${displayedPrice.toFixed(0)}` : "Not added"}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="shrink-0 text-xs font-medium text-muted-foreground">Est. time</span>
                  <span className="inline-flex items-center gap-1 text-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    {displayedTime != null ? `${displayedTime} min` : "Not added"}
                  </span>
                </div>
              </div>

              {style.description && (
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {style.description}
                </p>
              )}

              {professional && (
                <div
                  className="flex cursor-pointer items-center gap-3 rounded-xl bg-muted/50 p-3 transition-colors hover:bg-muted"
                  onClick={() => {
                    onOpenChange(false);
                    navigate(`/professional/${professional.user_id}`);
                  }}
                >
                  <Avatar className="h-10 w-10 border border-border">
                    <AvatarImage src={professional.avatar_url || ""} />
                    <AvatarFallback className="text-xs">
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{professional.business_name}</p>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate">{professional.address}</span>
                      </div>
                    </div>
                    {avgRating > 0 && (
                      <div className="mt-0.5 flex items-center gap-1">
                        <Star className="h-3 w-3 fill-primary text-primary" />
                        <span className="text-xs font-medium">{avgRating.toFixed(1)}</span>
                        <span className="text-xs text-muted-foreground">({reviewCount})</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <Button
                className="h-12 w-full rounded-xl text-sm font-semibold"
                onClick={handleAddToCart}
                disabled={styleInCart}
              >
                {styleInCart ? "Already in cart" : "Add to cart"}
              </Button>
            </div>

            <ShareDialog
              open={shareOpen}
              onOpenChange={setShareOpen}
              postUrl={`${window.location.origin}/explore-styles?style=${styleId}`}
              postCaption={`Check out this look: ${style?.style_name || ""}`}
              title="Share this look"
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
