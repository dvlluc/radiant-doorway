import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import FeaturedProfessionals from "@/components/directory/FeaturedProfessionals";
import { fetchDirectoryBusinesses } from "@/lib/fetchDirectoryBusinesses";
import { homeCategories } from "@/components/home/homeContent";
import { ROUTE_PATHS } from "@/routes.config";

export function HomeProfessionalsPanel() {
  const navigate = useNavigate();
  const { data: businesses = [], isLoading } = useQuery({
    queryKey: ["directory-businesses"],
    queryFn: fetchDirectoryBusinesses,
    staleTime: 10 * 60 * 1000,
  });

  const preview = businesses.slice(0, 12);

  return (
    <section
      id="professionals"
      className="home-bento-card scroll-mt-28 flex h-full flex-col rounded-[1.75rem] border border-border/70 bg-card p-6 shadow-card md:p-8"
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="home-bento-label">01 — Directory</span>
          <h2 className="mt-2 font-playfair text-2xl font-semibold tracking-tight md:text-3xl">
            Find your professional
          </h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Verified profiles, reviews, and instant booking — the core of BelloNecta.
          </p>
        </div>
        <Button
          variant="outline"
          className="rounded-full"
          onClick={() => navigate(ROUTE_PATHS.directory)}
        >
          Full directory
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      <div className="mt-6 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {homeCategories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() =>
              navigate(`${ROUTE_PATHS.directory}?search=${encodeURIComponent(cat)}`)
            }
            className="shrink-0 rounded-full border border-border bg-secondary/80 px-4 py-1.5 text-xs font-medium transition-colors hover:border-foreground/30 hover:bg-secondary"
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="mt-6 min-h-0 flex-1">
        <FeaturedProfessionals
          businesses={preview}
          loading={isLoading}
          hasResults={preview.length > 0}
        />
      </div>
    </section>
  );
}
