import { useNavigate } from "react-router-dom";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";
import { ReviewsDialog } from "@/components/ReviewsDialog";
import { useState, useRef } from "react";
import logoIcon from "@/assets/bellonecta-icon.jpg";

interface Business {
  id: string;
  user_id: string;
  business_name: string;
  category: string | null;
  address: string;
  avatar_url: string | null;
  about_us: string | null;
  directory_photo?: string | null;
  appointment_booking_enabled?: boolean;
  averageRating?: number;
  reviewCount?: number;
}

interface Props {
  businesses: Business[];
  loading: boolean;
  hasResults: boolean;
}

export default function FeaturedProfessionals({ businesses, loading, hasResults }: Props) {
  const navigate = useNavigate();
  const [reviewsDialogOpen, setReviewsDialogOpen] = useState(false);
  const [selectedBusinessForReviews, setSelectedBusinessForReviews] = useState<{ id: string; name: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
  };

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = el.clientWidth / 4;
    el.scrollBy({ left: direction === "left" ? -cardWidth * 2 : cardWidth * 2, behavior: "smooth" });
    setTimeout(checkScroll, 350);
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl md:text-3xl font-bold font-playfair">Featured Professionals</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => scroll("left")}
            disabled={!canScrollLeft}
            className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-foreground hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => scroll("right")}
            disabled={!canScrollRight}
            className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-foreground hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading businesses...</div>
      ) : !hasResults ? (
        <div className="text-center py-12 text-muted-foreground">
          {businesses.length === 0
            ? "No businesses registered yet. Be the first to join!"
            : "No results found. Try a different search."}
        </div>
      ) : (
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex gap-4 md:gap-6 overflow-x-auto scrollbar-hide scroll-smooth px-1 md:px-0 -mx-1 md:mx-0"
        >
          {businesses.map((business) => (
            <div
              key={business.id}
              className="cursor-pointer group flex-shrink-0 w-[72vw] sm:w-[45vw] md:w-[calc(25%-18px)]"
              onClick={() => navigate(`/professional/${business.user_id}`)}
            >
              <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-muted">
                {business.directory_photo || business.avatar_url ? (
                  <img
                    src={business.directory_photo || business.avatar_url || ''}
                    alt={business.business_name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <img src={logoIcon} alt="BelloNecta" className="w-16 h-16 rounded-xl object-contain opacity-40" />
                  </div>
                )}
              </div>

              <div className="pt-3 space-y-1">
                <h3 className="font-semibold text-sm text-foreground line-clamp-1">
                  {business.business_name}
                </h3>
                <div className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-foreground text-foreground" />
                  <span className="text-sm font-medium text-foreground">
                    {business.averageRating ? business.averageRating.toFixed(1) : '0.0'}
                  </span>
                  <span
                    className="text-sm text-muted-foreground cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (business.reviewCount && business.reviewCount > 0) {
                        setSelectedBusinessForReviews({ id: business.user_id, name: business.business_name });
                        setReviewsDialogOpen(true);
                      }
                    }}
                  >
                    ({business.reviewCount?.toLocaleString() || 0})
                  </span>
                </div>

                <p className="text-xs text-muted-foreground line-clamp-1">
                  {business.address}
                </p>

                {business.category && (
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {business.category}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedBusinessForReviews && (
        <ReviewsDialog
          open={reviewsDialogOpen}
          onOpenChange={setReviewsDialogOpen}
          businessId={selectedBusinessForReviews.id}
          businessName={selectedBusinessForReviews.name}
        />
      )}
    </section>
  );
}
