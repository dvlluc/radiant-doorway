import { SEO } from "@/components/SEO";
import { StructuredData } from "@/components/StructuredData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import heroImage from "@/assets/hero-beauty-professional.jpg";

import FeaturedProfessionals from "@/components/directory/FeaturedProfessionals";
import PopularServices from "@/components/directory/PopularServices";
import HowItWorks from "@/components/directory/HowItWorks";
import JoinAsProfessional from "@/components/directory/JoinAsProfessional";
import WhyBookWithUs from "@/components/directory/WhyBookWithUs";
import ExploreByLocation from "@/components/directory/ExploreByLocation";

import { buildLocationOptions, getLocationLabelFromSlug } from "@/components/directory/locationUtils";

const categories = [
  { label: "Salons" },
  { label: "Nails" },
  { label: "Skin" },
  { label: "Makeup" },
  { label: "Barbers" },
  { label: "Spa" },
  { label: "Hair Braiding" },
  { label: "Lashes" },
  { label: "Brows" },
  { label: "Aesthetics" },
  { label: "Massage" },
  { label: "Waxing" },
];

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

export default function Directory() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [locationFilter, setLocationFilter] = useState(() => {
    const loc = searchParams.get("location") || "";
    return loc === "all" ? "" : loc;
  });

  // Sync locationFilter when URL search params change (e.g. clicking Explore by Location)
  useEffect(() => {
    const loc = searchParams.get("location") || "";
    setLocationFilter(loc === "all" ? "" : loc);
  }, [searchParams]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollCategories = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 160;
      scrollRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const fetchBusinesses = async () => {
      try {
        const { data, error } = await supabase
          .from('business_profiles')
          .select('id, user_id, business_name, category, address, avatar_url, about_us')
          .order('created_at', { ascending: false });

        if (error) throw error;

        const businessesWithExtras = await Promise.all(
          (data || []).map(async (business) => {
            const { data: photos } = await supabase
              .from('business_photos')
              .select('photo_url')
              .eq('user_id', business.user_id)
              .eq('photo_type', 'directory')
              .order('display_order', { ascending: true })
              .limit(1)
              .maybeSingle();

            const { data: settings } = await supabase
              .from('business_settings')
              .select('appointment_booking_enabled')
              .eq('user_id', business.user_id)
              .maybeSingle();

            const [reviewsData, reviewPostsData] = await Promise.all([
              supabase.from('reviews').select('rating').eq('business_id', business.user_id),
              supabase.from('posts').select('rating').eq('business_id', business.user_id).eq('post_type', 'review'),
            ]);

            const allRatings = [
              ...(reviewsData.data || []).map(r => r.rating),
              ...(reviewPostsData.data || []).map(p => p.rating || 5),
            ];

            const averageRating = allRatings.length > 0
              ? allRatings.reduce((sum, rating) => sum + rating, 0) / allRatings.length
              : 0;

            return {
              ...business,
              directory_photo: photos?.photo_url || null,
              appointment_booking_enabled: settings?.appointment_booking_enabled || false,
              averageRating,
              reviewCount: allRatings.length,
            };
          })
        );

        setBusinesses(businessesWithExtras);
      } catch (error) {
        console.error('Error fetching businesses:', error);
        toast({ title: "Error", description: "Failed to load businesses", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    fetchBusinesses();
  }, [toast]);

  const filteredBusinesses = businesses.filter((b) => {
    const matchesSearch = !searchQuery || 
      b.business_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.category && b.category.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesLocation = !locationFilter || 
      b.address.toLowerCase().includes(locationFilter.toLowerCase());
    return matchesSearch && matchesLocation;
  });

  const availableLocations = buildLocationOptions(businesses);
  const locationPlaceholder = locationFilter ? getLocationLabelFromSlug(locationFilter) : "Location";

  return (
    <>
      <SEO
        title="Beauty Professional Directory - Find Top Beauty Experts"
        description="Discover and book appointments with verified beauty professionals."
        keywords="beauty professionals, makeup artist directory, hair stylist near me"
        type="website"
      />
      <StructuredData
        type="LocalBusiness"
        data={{
          name: "BelloNecta Beauty Directory",
          description: "Connect with top beauty professionals",
          image: heroImage,
          priceRange: "$$-$$$",
        }}
      />

      <div className="pb-24">
        {/* Hero + Categories (tight spacing) */}
        <div className="space-y-6">
          {/* Mobile Hero - Clean text-based */}
          <div className="md:hidden px-1 pt-2 space-y-4">
            <h1 className="text-2xl font-bold text-foreground font-playfair leading-tight">
              Find Your Beauty Professional
            </h1>
            <div className="flex flex-col gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search for services..."
                  className="pl-10 h-12 bg-muted/50 text-foreground border border-border rounded-xl"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={locationFilter || "all"} onValueChange={(v) => setLocationFilter(v === "all" ? "" : v)}>
                <SelectTrigger className="h-12 bg-muted/50 text-foreground border border-border rounded-xl">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <SelectValue placeholder={locationPlaceholder} />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {availableLocations.map((location) => (
                    <SelectItem key={location.slug} value={location.slug}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Desktop Hero Banner */}
          <div className="relative h-[380px] rounded-xl overflow-hidden hidden md:block">
            <img
              src={heroImage}
              alt="Find Your Beauty Professional"
              className="w-full h-full object-cover"
              width={1600}
              height={600}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
            <div className="absolute inset-0 flex flex-col justify-center px-8 md:px-12">
              <h1 className="text-5xl font-bold text-white font-playfair leading-tight max-w-md">
                Find Your Beauty Professional
              </h1>
              <div className="flex flex-col sm:flex-row gap-3 items-stretch mt-6 max-w-2xl">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    placeholder="Search for services..."
                    className="pl-10 h-12 bg-white text-foreground border-0"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="sm:w-48">
                  <Select value={locationFilter || "all"} onValueChange={(v) => setLocationFilter(v === "all" ? "" : v)}>
                    <SelectTrigger className="h-12 bg-white text-foreground border-0">
                      <div className="flex items-center gap-2 text-muted-foreground">
                         <MapPin className="w-4 h-4" />
                         <SelectValue placeholder={locationPlaceholder} />
                       </div>
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="all">All Locations</SelectItem>
                       {availableLocations.map((location) => (
                         <SelectItem key={location.slug} value={location.slug}>
                           {location.name}
                         </SelectItem>
                       ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  className="h-12 px-8 bg-[hsl(35,60%,55%)] hover:bg-[hsl(35,60%,48%)] text-white font-semibold"
                  onClick={() => {}}
                >
                  Search
                </Button>
              </div>
            </div>
          </div>

          {/* Mobile Category Pills */}
          <div className="md:hidden">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide px-1 py-1">
              {categories.map((cat) => (
                <button
                  key={cat.label}
                  onClick={() => setSearchQuery(cat.label)}
                  className={`shrink-0 px-4 py-2 rounded-full text-xs font-medium border transition-all duration-200 ${
                    searchQuery === cat.label
                      ? "bg-foreground text-background border-foreground"
                      : "bg-card text-foreground border-border hover:border-foreground/30"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Desktop Category Circles */}
          <div className="relative hidden md:flex items-center gap-2">
            <button
              onClick={() => scrollCategories('left')}
              className="shrink-0 w-8 h-8 rounded-full border border-border bg-card flex items-center justify-center hover:bg-muted transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-foreground" />
            </button>
            <div ref={scrollRef} className="flex gap-4 overflow-x-auto scrollbar-hide py-2 flex-1">
              {categories.map((cat) => (
                <button
                  key={cat.label}
                  onClick={() => setSearchQuery(cat.label)}
                  className="shrink-0"
                >
                  <div className="w-24 h-24 rounded-full border border-border bg-card hover:border-foreground/30 hover:shadow-[var(--shadow-hover)] transition-all duration-300 flex items-center justify-center">
                    <span className="font-medium text-sm text-foreground text-center leading-tight">{cat.label}</span>
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={() => scrollCategories('right')}
              className="shrink-0 w-8 h-8 rounded-full border border-border bg-card flex items-center justify-center hover:bg-muted transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-foreground" />
            </button>
          </div>
        </div>

        {/* Remaining sections with generous spacing */}
        <div className="mt-10 md:mt-14 space-y-24 md:space-y-32">
          <div id="featured-professionals">
            <FeaturedProfessionals
              businesses={filteredBusinesses}
              loading={loading}
              hasResults={filteredBusinesses.length > 0}
            />
          </div>

          <PopularServices />
          <HowItWorks />
          <JoinAsProfessional />
          <WhyBookWithUs />
          
          <ExploreByLocation locations={availableLocations} />
        </div>
      </div>
    </>
  );
}
