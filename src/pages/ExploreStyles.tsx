import { useState, useEffect, useCallback, memo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Heart, Bookmark, BookmarkCheck, MapPin, Clock, Search, X, Star, Share2, User, Scissors } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { SEO } from "@/components/SEO";
import { getCurrencyFromLocation } from "@/utils/currency";
import { StyleDetailModal } from "@/components/StyleDetailModal";
import { ShareDialog } from "@/components/ShareDialog";

interface Style {
  id: string;
  style_name: string;
  category: string;
  photo_url: string;
  description: string | null;
  estimated_price: number | null;
  estimated_time: number | null;
  location: string | null;
  professional_id: string;
  services_required: string[] | null;
  professional_name?: string;
  avatar_url?: string | null;
  avg_rating?: number;
  review_count?: number;
}

const categories = [
  { value: "all", label: "All" },
  { value: "hair", label: "Hairstyles" },
  { value: "braids", label: "Braids" },
  { value: "barber", label: "Barber" },
  { value: "nails", label: "Nails" },
  { value: "makeup", label: "Makeup" },
  { value: "lashes", label: "Lashes" },
];

const StyleCard = memo(({ style, isSaved, onSave, onNavigate, onShare }: {
  style: Style;
  isSaved: boolean;
  onSave: (id: string) => void;
  onNavigate: (id: string) => void;
  onShare: (id: string, name: string) => void;
}) => {
  const currency = getCurrencyFromLocation(style.location || "United States");
  const navigate = useNavigate();

  return (
    <div className="group flex flex-col bg-card rounded-xl overflow-hidden border border-border hover:shadow-lg transition-all duration-300 h-full">
      <div className="relative cursor-pointer" onClick={() => onNavigate(style.id)}>
        <img
          src={style.photo_url}
          alt={style.style_name}
          className="w-full h-52 object-cover"
          loading="lazy"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <Badge className="absolute top-3 left-3 bg-background/90 text-foreground text-[10px] uppercase tracking-wider border-0 opacity-0 group-hover:opacity-100 transition-opacity">
          {style.category}
        </Badge>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onShare(style.id, style.style_name);
          }}
          className="absolute top-3 right-3 p-2 rounded-full bg-background/90 hover:bg-background transition-all opacity-0 group-hover:opacity-100"
        >
          <Share2 className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      <div className="p-3 space-y-1.5 flex flex-col flex-1">
        <h3 className="font-semibold text-sm leading-tight">{style.style_name}</h3>
        
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">by</span>
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/professional/${style.professional_id}`); }}
            className="text-xs font-medium text-foreground hover:text-primary hover:underline transition-colors truncate"
          >
            {style.professional_name || "Professional"}
          </button>
        </div>

        {(style.avg_rating != null && style.avg_rating > 0) && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
            <span className="font-medium text-foreground">{style.avg_rating.toFixed(1)}</span>
            {style.review_count != null && style.review_count > 0 && (
              <span>({style.review_count} {style.review_count === 1 ? 'review' : 'reviews'})</span>
            )}
          </div>
        )}

        {style.location && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="truncate">{style.location.split(',')[0].trim()}</span>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onSave(style.id); }}
              className="p-1"
            >
              {isSaved ? (
                <BookmarkCheck className="w-4 h-4 text-primary" />
              ) : (
                <Bookmark className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
          </div>
        )}

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-0.5">
          <span className="text-sm font-semibold text-foreground">
            From {currency.symbol}{(style.estimated_price ?? 0).toFixed(0)}
          </span>
          {style.estimated_time != null && (
            <>
              <span>•</span>
              <span>{style.estimated_time} min</span>
            </>
          )}
        </div>

        <Button
          size="sm"
          className="w-full text-xs h-8 mt-auto"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/booking/${style.professional_id}`, {
              state: {
                fromStyle: true,
                styleId: style.id,
                styleName: style.style_name,
                stylePhoto: style.photo_url,
                servicesRequired: style.services_required || [],
                estimatedPrice: style.estimated_price,
                estimatedTime: style.estimated_time,
              }
            });
          }}
        >
          Book This Look
        </Button>
      </div>
    </div>
  );
});
StyleCard.displayName = "StyleCard";

export default function ExploreStyles() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [styles, setStyles] = useState<Style[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [styleSearch, setStyleSearch] = useState("");
  const [professionalSearch, setProfessionalSearch] = useState("");
  const [locationSearch, setLocationSearch] = useState("");
  const [selectedStyleId, setSelectedStyleId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareStyle, setShareStyle] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    fetchStyles();
  }, [activeCategory]);

  useEffect(() => {
    if (user) fetchSavedStyles();
  }, [user]);

  const fetchStyles = async () => {
    setLoading(true);
    let query = supabase.from("styles").select("*").order("created_at", { ascending: false });
    if (activeCategory !== "all") {
      query = query.eq("category", activeCategory);
    }
    const { data, error } = await query;
    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    // Fetch professional names
    const professionalIds = [...new Set((data || []).map(s => s.professional_id))];
    let profileMap: Record<string, { name: string; avatar: string | null }> = {};
    let reviewMap: Record<string, { avg: number; count: number }> = {};
    
    if (professionalIds.length > 0) {
      const [bizResult, reviewResult] = await Promise.all([
        supabase
          .from("business_profiles")
          .select("user_id, business_name, avatar_url")
          .in("user_id", professionalIds),
        supabase
          .from("reviews")
          .select("business_id, rating")
          .in("business_id", professionalIds),
      ]);
      
      (bizResult.data || []).forEach(bp => {
        profileMap[bp.user_id] = { name: bp.business_name, avatar: bp.avatar_url };
      });

      // Aggregate reviews per professional
      (reviewResult.data || []).forEach(r => {
        if (!r.business_id) return;
        if (!reviewMap[r.business_id]) {
          reviewMap[r.business_id] = { avg: 0, count: 0 };
        }
        reviewMap[r.business_id].count++;
        reviewMap[r.business_id].avg += r.rating;
      });
      Object.keys(reviewMap).forEach(id => {
        reviewMap[id].avg = reviewMap[id].avg / reviewMap[id].count;
      });
    }

    const enriched = (data || []).map(s => ({
      ...s,
      professional_name: profileMap[s.professional_id]?.name,
      avatar_url: profileMap[s.professional_id]?.avatar,
      avg_rating: reviewMap[s.professional_id]?.avg || 0,
      review_count: reviewMap[s.professional_id]?.count || 0,
    }));

    setStyles(enriched);
    setLoading(false);
  };

  const fetchSavedStyles = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("saved_styles")
      .select("style_id")
      .eq("user_id", user.id);
    setSavedIds(new Set((data || []).map(d => d.style_id)));
  };

  const toggleSave = useCallback(async (styleId: string) => {
    if (!user) {
      toast({ title: "Sign in to save styles", variant: "destructive" });
      return;
    }
    const isSaved = savedIds.has(styleId);
    if (isSaved) {
      await supabase.from("saved_styles").delete().eq("user_id", user.id).eq("style_id", styleId);
      setSavedIds(prev => { const n = new Set(prev); n.delete(styleId); return n; });
    } else {
      await supabase.from("saved_styles").insert({ user_id: user.id, style_id: styleId });
      setSavedIds(prev => new Set(prev).add(styleId));
    }
  }, [user, savedIds, toast]);

  const hasSearch = styleSearch || professionalSearch || locationSearch;
  const filteredStyles = hasSearch
    ? styles.filter(s => {
        const matchStyle = !styleSearch || s.style_name.toLowerCase().includes(styleSearch.toLowerCase());
        const matchPro = !professionalSearch || (s.professional_name || "").toLowerCase().includes(professionalSearch.toLowerCase());
        const matchLoc = !locationSearch || (s.location || "").toLowerCase().includes(locationSearch.toLowerCase());
        return matchStyle && matchPro && matchLoc;
      })
    : styles;

  return (
    <>
      <SEO title="Explore Styles | BelloNecta" description="Discover beauty styles and book professionals who can create your perfect look." />
      
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
            Explore Styles
          </h1>
          <p className="text-sm text-muted-foreground">
            Discover looks you love, then book the professional who created them.
          </p>
        </div>

        {/* Fresha-style Segmented Search Bar */}
        <div className="flex flex-col md:flex-row items-stretch border border-border rounded-xl overflow-hidden bg-card shadow-sm">
          <div className="flex items-center gap-2 px-4 py-3 flex-1 border-b md:border-b-0 md:border-r border-border">
            <Scissors className="w-4 h-4 text-muted-foreground shrink-0" />
            <input
              type="text"
              placeholder="Any style"
              value={styleSearch}
              onChange={e => setStyleSearch(e.target.value)}
              className="bg-transparent text-sm w-full outline-none placeholder:text-muted-foreground"
            />
          </div>
          <div className="flex items-center gap-2 px-4 py-3 flex-1 border-b md:border-b-0 md:border-r border-border">
            <User className="w-4 h-4 text-muted-foreground shrink-0" />
            <input
              type="text"
              placeholder="Any professional"
              value={professionalSearch}
              onChange={e => setProfessionalSearch(e.target.value)}
              className="bg-transparent text-sm w-full outline-none placeholder:text-muted-foreground"
            />
          </div>
          <div className="flex items-center gap-2 px-4 py-3 flex-1">
            <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
            <input
              type="text"
              placeholder="Any location"
              value={locationSearch}
              onChange={e => setLocationSearch(e.target.value)}
              className="bg-transparent text-sm w-full outline-none placeholder:text-muted-foreground"
            />
          </div>
          {hasSearch && (
            <button
              onClick={() => { setStyleSearch(""); setProfessionalSearch(""); setLocationSearch(""); }}
              className="flex items-center justify-center px-4 py-3 text-muted-foreground hover:text-foreground transition-colors border-t md:border-t-0 md:border-l border-border"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
          {categories.map(cat => (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                activeCategory === cat.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Masonry Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="bg-muted rounded-xl animate-pulse h-[380px]" />
            ))}
          </div>
        ) : filteredStyles.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-16 space-y-3">
            <div className="text-4xl">💇‍♀️</div>
            <h3 className="font-semibold text-lg text-center">No styles found</h3>
            <p className="text-sm text-muted-foreground text-center">
              {hasSearch ? "Try different search terms." : "Be the first professional to upload a style!"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {filteredStyles.map(style => (
              <StyleCard
                key={style.id}
                style={style}
                isSaved={savedIds.has(style.id)}
                onSave={toggleSave}
                onNavigate={(id) => {
                  setSelectedStyleId(id);
                  setModalOpen(true);
                }}
                onShare={(id, name) => {
                  setShareStyle({ id, name });
                  setShareOpen(true);
                }}
              />
            ))}
          </div>
        )}
        <StyleDetailModal
          styleId={selectedStyleId}
          open={modalOpen}
          onOpenChange={setModalOpen}
        />
        {shareStyle && (
          <ShareDialog
            open={shareOpen}
            onOpenChange={setShareOpen}
            postUrl={`${window.location.origin}/style/${shareStyle.id}`}
            postCaption={`Check out this look: ${shareStyle.name}`}
            title="Share this look"
          />
        )}
      </div>
    </>
  );
}
