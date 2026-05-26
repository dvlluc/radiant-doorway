import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Clock, Heart, Bookmark, BookmarkCheck, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { getCurrencyFromLocation } from "@/utils/currency";
import { StyleDetailModal } from "@/components/StyleDetailModal";

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
}

const categoryFilters = [
  { value: "all", label: "All" },
  { value: "braids", label: "Braids" },
  { value: "nails", label: "Nails" },
  { value: "hair", label: "Hair" },
  { value: "makeup", label: "Makeup" },
  { value: "lashes", label: "Lashes" },
];

interface ProfileStylesTabProps {
  professionalId: string;
  isOwnProfile?: boolean;
}

export function ProfileStylesTab({ professionalId, isOwnProfile }: ProfileStylesTabProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [styles, setStyles] = useState<Style[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [savedStyles, setSavedStyles] = useState<Set<string>>(new Set());
  const [selectedStyleId, setSelectedStyleId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetchStyles();
    if (user) fetchSavedStyles();
  }, [professionalId, user]);

  const fetchStyles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("styles")
      .select("*")
      .eq("professional_id", professionalId)
      .order("created_at", { ascending: false });

    if (!error && data) setStyles(data);
    setLoading(false);
  };

  const fetchSavedStyles = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("saved_styles")
      .select("style_id")
      .eq("user_id", user.id);
    if (data) setSavedStyles(new Set(data.map((s) => s.style_id)));
  };

  const toggleSave = async (styleId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      toast({ title: "Sign in to save styles", variant: "destructive" });
      return;
    }
    if (savedStyles.has(styleId)) {
      await supabase.from("saved_styles").delete().eq("user_id", user.id).eq("style_id", styleId);
      setSavedStyles((prev) => { const n = new Set(prev); n.delete(styleId); return n; });
    } else {
      await supabase.from("saved_styles").insert({ user_id: user.id, style_id: styleId });
      setSavedStyles((prev) => new Set(prev).add(styleId));
    }
  };

  const handleBookThisLook = (style: Style, e: React.MouseEvent) => {
    e.stopPropagation();
    const currency = getCurrencyFromLocation(style.location || "United States");
    navigate(`/booking/${style.professional_id}`, {
      state: {
        fromStyle: true,
        styleId: style.id,
        styleName: style.style_name,
        stylePhoto: style.photo_url,
        servicesRequired: style.services_required,
        estimatedPrice: style.estimated_price,
        estimatedTime: style.estimated_time,
      },
    });
  };

  const filteredStyles = activeCategory === "all"
    ? styles
    : styles.filter((s) => s.category.toLowerCase() === activeCategory);

  const formatDuration = (mins: number) => {
    if (mins >= 60) {
      const hrs = Math.floor(mins / 60);
      const rem = mins % 60;
      return rem > 0 ? `${hrs} hr${hrs > 1 ? "s" : ""} ${rem} mins` : `${hrs} hr${hrs > 1 ? "s" : ""}`;
    }
    return `${mins} mins`;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  if (styles.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Globe className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Styles Yet</h3>
          <p className="text-muted-foreground">This professional hasn't uploaded any styles yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Category filter pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {categoryFilters.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setActiveCategory(cat.value)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              activeCategory === cat.value
                ? "bg-foreground text-background"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Styles grid */}
      {filteredStyles.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No styles in this category.</p>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
          {filteredStyles.map((style) => {
            const currency = getCurrencyFromLocation(style.location || "United States");
            const isSaved = savedStyles.has(style.id);

            return (
              <div
                key={style.id}
                className="group cursor-pointer"
                onClick={() => { setSelectedStyleId(style.id); setModalOpen(true); }}
              >
                {/* Image with overlay info */}
                <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-muted">
                  <img
                    src={style.photo_url}
                    alt={style.style_name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <button
                    onClick={(e) => toggleSave(style.id, e)}
                    className="absolute right-1.5 top-1.5 rounded-full bg-background/70 p-1 backdrop-blur-sm transition-colors hover:bg-background"
                  >
                    {isSaved ? (
                      <BookmarkCheck className="h-3.5 w-3.5 text-primary" />
                    ) : (
                      <Bookmark className="h-3.5 w-3.5 text-foreground/70" />
                    )}
                  </button>
                </div>

                {/* Info */}
                <div className="mt-1.5 space-y-0.5">
                  <h3 className="text-xs font-semibold leading-tight line-clamp-1">{style.style_name}</h3>
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    {style.estimated_price != null && (
                      <span className="font-semibold text-foreground">
                        {currency.symbol}{style.estimated_price.toFixed(0)}
                      </span>
                    )}
                    {style.estimated_price != null && style.estimated_time != null && (
                      <span>·</span>
                    )}
                    {style.estimated_time != null && (
                      <span>{formatDuration(style.estimated_time)}</span>
                    )}
                  </div>

                  <Button
                    size="sm"
                    className="mt-1 h-7 w-full rounded-md text-[11px] font-semibold"
                    onClick={(e) => handleBookThisLook(style, e)}
                  >
                    Book This Look
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <StyleDetailModal
        styleId={selectedStyleId}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  );
}
