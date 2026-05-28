import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, X, Star, MapPin, ShoppingBag, ChevronRight, Sparkles, BadgePercent } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getCurrencyFromLocation } from "@/utils/currency";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useSmartBack } from "@/hooks/useSmartBack";
import { Badge } from "@/components/ui/badge";

interface Service {
  id: string;
  name: string;
  description: string | null;
  duration: number;
  price: number;
  category?: string;
  discount_percentage: number | null;
  original_price: number | null;
  discount_active: boolean;
  image_url: string | null;
}

interface BusinessProfile {
  business_name: string;
  address: string;
  avatar_url: string | null;
  logo_url: string | null;
  category: string | null;
}

export default function Booking() {
  const { id: rawId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const goBack = useSmartBack('/directory');
  const { toast } = useToast();
  const { user } = useAuth();

  // State from "Book This Look" navigation
  const preSelectedService = (location.state as any)?.preSelectedService;
  const fromStyle = (location.state as any)?.fromStyle as boolean | undefined;
  const styleName = (location.state as any)?.styleName as string | undefined;
  const stylePhoto = (location.state as any)?.stylePhoto as string | undefined;
  const styleId = (location.state as any)?.styleId as string | undefined;
  const servicesRequired = (location.state as any)?.servicesRequired as string[] | undefined;
  const estimatedPrice = (location.state as any)?.estimatedPrice as number | undefined;
  const estimatedTime = (location.state as any)?.estimatedTime as number | undefined;

  const [selectedServices, setSelectedServices] = useState<Service[]>(
    preSelectedService ? [preSelectedService] : []
  );
  const [services, setServices] = useState<Service[]>([]);
  const [business, setBusiness] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [reviewCount, setReviewCount] = useState<number>(0);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [resolvedId, setResolvedId] = useState<string | null>(null);

  const professionalLocation = business?.address || "United States";
  const currency = getCurrencyFromLocation(professionalLocation);

  useEffect(() => {
    const resolveId = async () => {
      if (!rawId) return;
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(rawId)) {
        setResolvedId(rawId);
        return;
      }
      const { data } = await supabase
        .from("business_profiles")
        .select("user_id, business_name")
        .limit(100);
      if (data) {
        const match = data.find(b => {
          const slug = b.business_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
          return slug === rawId.toLowerCase();
        });
        if (match) {
          setResolvedId(match.user_id);
          return;
        }
      }
      setResolvedId(rawId);
    };
    resolveId();
  }, [rawId]);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to book an appointment.",
          variant: "destructive",
        });
        navigate("/auth", { state: { returnTo: `/booking/${rawId}` } });
        return;
      }
      setIsAuthenticated(true);
    };
    checkAuth();
  }, [rawId, navigate, toast]);

  useEffect(() => {
    const fetchBusinessAndServices = async () => {
      if (!resolvedId || !isAuthenticated) return;
      try {
        const { data: businessData, error: businessError } = await supabase
          .from("business_profiles")
          .select("business_name, address, avatar_url, logo_url, category")
          .eq("user_id", resolvedId)
          .single();
        if (businessError) throw businessError;

        let avatarUrl = businessData.logo_url || businessData.avatar_url;
        if (!avatarUrl) {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("avatar_url")
            .eq("id", resolvedId)
            .single();
          if (profileData?.avatar_url) {
            avatarUrl = profileData.avatar_url;
          }
        }

        setBusiness({
          business_name: businessData.business_name,
          address: businessData.address,
          category: businessData.category,
          logo_url: businessData.logo_url,
          avatar_url: avatarUrl,
        });

        const { data: servicesData, error: servicesError } = await supabase
          .from("services")
          .select("id, name, description, duration, price, discount_percentage, original_price, discount_active, image_url")
          .eq("user_id", resolvedId)
          .eq("is_active", true)
          .order("name");
        if (servicesError) throw servicesError;
        setServices(servicesData || []);

        // Auto-select services when coming from "Book This Look"
        if (fromStyle && servicesRequired && servicesRequired.length > 0 && servicesData) {
          const matchedServices = servicesData.filter(s =>
            servicesRequired.some(req =>
              s.name.toLowerCase().includes(req.toLowerCase()) ||
              req.toLowerCase().includes(s.name.toLowerCase())
            )
          );
          if (matchedServices.length > 0) {
            setSelectedServices(prev => prev.length === 0 ? matchedServices : prev);
          }
        }

        // Auto-add fallback style service when no matched services found
        if (fromStyle && styleName && (!servicesRequired || servicesRequired.length === 0 || 
            !(servicesData || []).some(s => (servicesRequired || []).some(req => 
              s.name.toLowerCase().includes(req.toLowerCase()) || req.toLowerCase().includes(s.name.toLowerCase())
            )))) {
          const fbPrice = estimatedPrice ?? 0;
          const fbDuration = estimatedTime ?? 0;
          if (fbPrice > 0 || fbDuration > 0) {
            const fbService: Service = {
              id: styleId || `style-${styleName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
              name: styleName,
              description: (servicesRequired && servicesRequired.length > 0) ? servicesRequired.join(" · ") : "Book This Look",
              duration: fbDuration,
              price: fbPrice,
              discount_percentage: null,
              original_price: null,
              discount_active: false,
              image_url: stylePhoto || null,
            };
            setSelectedServices(prev => prev.length === 0 ? [fbService] : prev);
          }
        }

        const [reviewsData, reviewPostsData] = await Promise.all([
          supabase.from("reviews").select("rating").eq("business_id", resolvedId),
          supabase.from("posts").select("rating").eq("business_id", resolvedId).eq("post_type", "review"),
        ]);

        const allRatings = [
          ...(reviewsData.data || []).map(r => r.rating),
          ...(reviewPostsData.data || []).map(p => p.rating || 5),
        ];
        const totalReviews = allRatings.length;
        setReviewCount(totalReviews);
        if (totalReviews > 0) {
          setAverageRating(allRatings.reduce((sum, r) => sum + r, 0) / totalReviews);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({ title: "Error", description: "Failed to load booking information.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    fetchBusinessAndServices();
  }, [resolvedId, toast, isAuthenticated]);

  const handleAddService = (service: Service) => {
    setSelectedServices([...selectedServices, service]);
  };

  const handleRemoveService = (serviceId: string) => {
    setSelectedServices(selectedServices.filter((s) => s.id !== serviceId));
  };

  const matchedStyleServices = fromStyle && servicesRequired && servicesRequired.length > 0
    ? services.filter(service =>
        servicesRequired.some(req =>
          service.name.toLowerCase().includes(req.toLowerCase()) ||
          req.toLowerCase().includes(service.name.toLowerCase())
        )
      )
    : [];

  const fallbackStylePrice = estimatedPrice ?? 0;
  const fallbackStyleDuration = estimatedTime ?? 0;

  const fallbackStyleService: Service | null = fromStyle && styleName && matchedStyleServices.length === 0 && fallbackStylePrice > 0 && fallbackStyleDuration > 0
    ? {
        id: styleId || `style-${styleName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        name: styleName,
        description: servicesRequired?.join(" · ") || "Book This Look",
        duration: fallbackStyleDuration,
        price: fallbackStylePrice,
        discount_percentage: null,
        original_price: null,
        discount_active: false,
        image_url: stylePhoto || null,
      }
    : null;

  const styleMatchedServices = matchedStyleServices.filter(service =>
    selectedServices.some(selectedService => selectedService.id === service.id)
  );

  const isFallbackStyleSelected = !!(fallbackStyleService && selectedServices.some(service => service.id === fallbackStyleService.id));
  const styleCardIsSelected = matchedStyleServices.length > 0
    ? matchedStyleServices.every(service => selectedServices.some(selectedService => selectedService.id === service.id))
    : isFallbackStyleSelected;

  const styleTotalPrice = matchedStyleServices.length > 0
    ? matchedStyleServices.reduce((sum, service) => sum + service.price, 0)
    : fallbackStylePrice;
  const styleTotalDuration = matchedStyleServices.length > 0
    ? matchedStyleServices.reduce((sum, service) => sum + service.duration, 0)
    : fallbackStyleDuration;

  const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration, 0);
  const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0);

  const otherServices = fromStyle
    ? services.filter(service => !matchedStyleServices.some(styleService => styleService.id === service.id))
    : services;

  const handleContinue = async () => {
    if (!user) {
      toast({ title: "Authentication Required", description: "Please sign in to continue.", variant: "destructive" });
      return;
    }
    if (selectedServices.length === 0) {
      toast({ title: "No Services Selected", description: "Please select at least one service.", variant: "destructive" });
      return;
    }
    try {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);
      for (const service of selectedServices) {
        const { error } = await supabase.from("cart_items").insert({
          user_id: user.id,
          product_id: service.id,
          product_name: service.name,
          product_image: null,
          price: service.price,
          quantity: 1,
          expires_at: expiresAt.toISOString(),
          item_type: 'booking',
          item_data: {
            businessId: resolvedId,
            businessName: business?.business_name,
            serviceId: service.id,
            serviceName: service.name,
            duration: service.duration,
            description: service.description,
          }
        });
        if (error) throw error;
      }
      toast({
        title: "✓ Services Selected",
        description: selectedServices.map(s => `${s.name} — ${currency.symbol}${s.price}`).join(', '),
      });
      navigate(`/booking/${rawId}/datetime`, {
        state: { services: selectedServices, businessId: resolvedId, businessName: business?.business_name },
      });
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast({ title: "Error", description: "Failed to add services to cart.", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 space-y-6">
        <div className="h-8 w-48 bg-muted rounded-lg animate-pulse" />
        <div className="h-32 bg-muted rounded-2xl animate-pulse" />
        <div className="h-24 bg-muted rounded-2xl animate-pulse" />
        <div className="h-24 bg-muted rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!business) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center px-4">
        <p className="text-muted-foreground">Business not found.</p>
      </div>
    );
  }

  const cityName = business.address?.split(',')[0]?.trim() || business.address;

  // Render a service card
  const renderServiceCard = (service: Service) => {
    const isSelected = selectedServices.some((s) => s.id === service.id);
    return (
      <div
        key={service.id}
        className={`relative rounded-xl border p-4 transition-all duration-200 bg-[#fafafa] dark:bg-muted/30 ${
          isSelected
            ? "border-border bg-[#fafafa]"
            : "border-border/60 hover:border-border"
        }`}
      >
        {service.discount_active && service.discount_percentage && (
          <div className="absolute -top-2.5 right-3">
            <Badge className="bg-accent text-accent-foreground text-[10px] px-2 py-0.5 gap-1">
              <BadgePercent className="w-3 h-3" />
              {service.discount_percentage}% OFF
            </Badge>
          </div>
        )}

        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm leading-tight">{service.name}</h4>
            {service.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {service.description}
              </p>
            )}
            <div className="flex items-center gap-3 mt-2">
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3.5 h-3.5" />
                {service.duration} min
              </span>
            </div>
          </div>

          <div className="text-right shrink-0 flex flex-col items-end gap-2">
            <div>
              {service.discount_active && service.original_price ? (
                <div className="flex flex-col items-end">
                  <span className="text-xs text-muted-foreground line-through">
                    {currency.symbol}{Number(service.original_price).toFixed(0)}
                  </span>
                  <span className="text-lg font-bold text-accent">
                    {currency.symbol}{Number(service.price).toFixed(0)}
                  </span>
                </div>
              ) : (
                <span className="text-lg font-bold">
                  {currency.symbol}{Number(service.price).toFixed(0)}
                </span>
              )}
            </div>
            <button
              onClick={() => isSelected ? handleRemoveService(service.id) : handleAddService(service)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
                isSelected
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80 text-foreground"
              }`}
            >
              {isSelected ? "Added ✓" : "+ Add"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto overflow-x-hidden px-4 pb-32">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={goBack}
          className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>
          {fromStyle ? "Book This Look" : "Book Appointment"}
        </h1>
      </div>

      {/* Business Hero Card */}
      <div
        className="relative rounded-2xl overflow-hidden bg-card text-foreground border border-border p-5 mb-6 cursor-pointer active:scale-[0.99] transition-transform shadow-sm"
        onClick={() => navigate(`/professional/${resolvedId}`)}
      >
        <div className="flex items-center gap-4">
          <Avatar className="w-14 h-14 border-2 border-border shrink-0">
            <AvatarImage src={business.avatar_url || undefined} alt={business.business_name} />
            <AvatarFallback className="bg-muted text-foreground text-lg font-bold">
              {business.business_name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold leading-tight truncate" style={{ fontFamily: "'Playfair Display', serif" }}>
              {business.business_name}
            </h2>
            <div className="flex items-center gap-1.5 mt-1 text-muted-foreground text-xs">
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="truncate">{cityName}</span>
            </div>
            <div className="flex items-center gap-2.5 mt-2">
              <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
                {business.category || "Beauty"}
              </Badge>
              <div className="flex items-center gap-1 text-xs">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">
                  {reviewCount > 0 ? averageRating.toFixed(1) : "New"}
                </span>
                {reviewCount > 0 && (
                  <span className="text-muted-foreground">({reviewCount})</span>
                )}
              </div>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground/50 shrink-0" />
        </div>
      </div>

      {/* ===== BOOK THIS LOOK CARD ===== */}
      {fromStyle && styleName && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-primary" />
            <h3 className="text-base font-semibold">Book This Look</h3>
          </div>

          {(() => {
            const handleToggleStyle = () => {
              if (styleCardIsSelected) {
                if (matchedStyleServices.length > 0) {
                  const matchedIds = matchedStyleServices.map(service => service.id);
                  setSelectedServices(prev => prev.filter(service => !matchedIds.includes(service.id)));
                  return;
                }

                if (fallbackStyleService) {
                  setSelectedServices(prev => prev.filter(service => service.id !== fallbackStyleService.id));
                }

                return;
              }

              if (matchedStyleServices.length > 0) {
                setSelectedServices(prev => [
                  ...prev,
                  ...matchedStyleServices.filter(service => !prev.some(selected => selected.id === service.id)),
                ]);
                return;
              }

              if (fallbackStyleService) {
                setSelectedServices(prev =>
                  prev.some(service => service.id === fallbackStyleService.id)
                    ? prev
                    : [...prev, fallbackStyleService]
                );
              }
            };

            return (
              <div className={`relative rounded-xl border p-4 transition-all duration-200 bg-[#fafafa] dark:bg-muted/30 ${
                styleCardIsSelected ? "border-primary/40 bg-primary/5" : "border-border/60 hover:border-border"
              }`}>
                <div className="flex items-start gap-3">
                  {stylePhoto && (
                    <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0">
                      <img src={stylePhoto} alt={styleName} className="w-full h-full object-cover" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm leading-tight">{styleName}</h4>
                    {servicesRequired && servicesRequired.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {servicesRequired.join(" · ")}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      {styleTotalDuration > 0 && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3.5 h-3.5" />
                          {styleTotalDuration} min
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0 flex flex-col items-end gap-2">
                    {styleTotalPrice > 0 && (
                      <span className="text-lg font-bold">
                        {currency.symbol}{styleTotalPrice.toFixed(0)}
                      </span>
                    )}
                    <button
                      onClick={handleToggleStyle}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
                        styleCardIsSelected
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted hover:bg-muted/80 text-foreground"
                      }`}
                    >
                      {styleCardIsSelected ? "Added ✓" : "+ Add"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ===== OTHER SERVICES / SELECT SERVICES ===== */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-primary" />
          <h3 className="text-base font-semibold">
            {fromStyle ? "Other Services" : "Select Services"}
          </h3>
          <span className="text-xs text-muted-foreground ml-auto">
            {fromStyle ? otherServices.length : services.length} available
          </span>
        </div>

        {(fromStyle ? otherServices : services).length === 0 ? (
          <div className="text-center py-8 bg-muted/30 rounded-2xl">
            <p className="text-muted-foreground text-sm">
              {fromStyle ? "No other services available." : "No services available for booking."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {(fromStyle ? otherServices : services).map(renderServiceCard)}
          </div>
        )}
      </div>

      {/* Empty cart hint (only for non-style bookings) */}
      {!fromStyle && selectedServices.length === 0 && (
        <div className="text-center py-6 text-muted-foreground">
          <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Tap a service to start building your appointment</p>
        </div>
      )}

      {/* Sticky Bottom Bar */}
      {selectedServices.length > 0 && (
        <div className="fixed bottom-16 md:bottom-0 left-0 right-0 z-40 bg-background border-t border-border px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
          <div className="max-w-2xl mx-auto">
            {!fromStyle && (
              <div className="flex items-center gap-2 mb-2 overflow-x-auto scrollbar-hide">
                {selectedServices.map((service, i) => (
                  <div key={`${service.id}-${i}`} className="flex items-center gap-1.5 bg-muted rounded-full pl-3 pr-1.5 py-1 shrink-0">
                    <span className="text-xs font-medium truncate max-w-[120px]">{service.name}</span>
                    <span className="text-xs font-semibold text-muted-foreground">{currency.symbol}{service.price}</span>
                    <button
                      onClick={() => handleRemoveService(service.id)}
                      className="w-5 h-5 rounded-full bg-background flex items-center justify-center hover:bg-destructive/10 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-muted-foreground">
                  {selectedServices.length} service{selectedServices.length > 1 ? 's' : ''} · {totalDuration} min
                </div>
                <div className="text-lg font-bold">{currency.symbol}{totalPrice.toFixed(0)}</div>
              </div>
              <Button
                onClick={handleContinue}
                className="bg-foreground hover:bg-foreground/90 text-background rounded-full px-6 gap-2"
              >
                {fromStyle ? "Select Date & Time" : "Continue"}
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
