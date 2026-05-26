import { MapPin, Search, Users, ShoppingBag, Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ROUTE_PATHS } from "@/routes.config";
import { cn } from "@/lib/utils";

const pillars = [
  {
    id: "professionals",
    icon: Users,
    label: "Professionals",
    hint: "Book verified experts",
    path: ROUTE_PATHS.directory,
  },
  {
    id: "bellomart",
    icon: ShoppingBag,
    label: "BelloMart",
    hint: "Shop creator looks",
    path: ROUTE_PATHS.belloMart,
  },
  {
    id: "impact",
    icon: Heart,
    label: "Impact",
    hint: "Purpose-driven beauty",
    path: ROUTE_PATHS.impact,
  },
] as const;

interface HomeHubHeroProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit: () => void;
  activePillar?: string;
}

export function HomeHubHero({
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  activePillar,
}: HomeHubHeroProps) {
  return (
    <section className="home-hero relative overflow-hidden rounded-[1.75rem] border border-border/50 bg-foreground text-primary-foreground shadow-elevated">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_80%_at_100%_0%,hsl(0_0%_100%/0.12),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_60%_at_0%_100%,hsl(0_0%_100%/0.06),transparent_50%)]" />

      <div className="relative px-6 py-10 md:px-12 md:py-14 lg:py-16">
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-primary-foreground/60">
          BelloNecta
        </p>
        <h1 className="mt-3 max-w-2xl font-playfair text-3xl font-semibold leading-[1.08] tracking-tight md:text-5xl lg:text-[3.25rem]">
          One place for beauty professionals, commerce & impact
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-primary-foreground/75 md:text-base">
          Discover talent, preview the marketplace, and explore how we&apos;re reshaping the industry —
          without jumping between disconnected pages.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSearchSubmit();
          }}
          className="mt-8 flex max-w-2xl flex-col gap-3 sm:flex-row"
        >
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search services, salons, styles…"
              className="h-12 rounded-full border-0 bg-card pl-11 text-foreground shadow-search"
            />
          </div>
          <Button
            type="submit"
            className="h-12 rounded-full bg-card px-8 font-semibold text-foreground hover:bg-card/90"
          >
            Explore
          </Button>
        </form>

        <div className="mt-10 grid gap-3 sm:grid-cols-3">
          {pillars.map((pillar) => {
            const Icon = pillar.icon;
            const isHash = activePillar === pillar.id;
            return (
              <Link
                key={pillar.id}
                to={`#${pillar.id}`}
                className={cn(
                  "group flex items-center gap-3 rounded-2xl border px-4 py-3.5 transition-all duration-300",
                  isHash
                    ? "border-primary-foreground/40 bg-primary-foreground/15"
                    : "border-primary-foreground/15 bg-primary-foreground/5 hover:border-primary-foreground/30 hover:bg-primary-foreground/10",
                )}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-foreground text-foreground">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{pillar.label}</p>
                  <p className="text-xs text-primary-foreground/65">{pillar.hint}</p>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-primary-foreground/55">
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" />
            Near you & online
          </span>
          <Link to={ROUTE_PATHS.directory} className="underline-offset-4 hover:text-primary-foreground hover:underline">
            Browse all professionals →
          </Link>
        </div>
      </div>
    </section>
  );
}
