import { useNavigate } from "react-router-dom";
import { ArrowRight, Handshake, Leaf, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { impactPillars } from "@/components/home/homeContent";
import { ROUTE_PATHS } from "@/routes.config";
import { cn } from "@/lib/utils";

interface HomeImpactPanelProps {
  hideTitle?: boolean;
  className?: string;
}

export function HomeImpactPanel({ hideTitle = false, className }: HomeImpactPanelProps) {
  const navigate = useNavigate();

  return (
    <section
      id={hideTitle ? undefined : "impact"}
      className={cn(
        hideTitle
          ? "mx-auto flex w-full max-w-6xl flex-col"
          : "home-bento-card scroll-mt-28 flex h-full flex-col rounded-[1.75rem] border border-border/70 bg-muted/40 p-6 md:p-8",
        className,
      )}
    >
      {!hideTitle && (
        <div>
          <span className="home-bento-label">03 — Impact</span>
          <h2 className="mt-2 font-playfair text-2xl font-semibold tracking-tight md:text-3xl">
            Beauty that gives back
          </h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Partnerships, sustainability, and healing initiatives woven into the platform — not an
            afterthought.
          </p>
        </div>
      )}

      <div className={cn("grid grid-cols-2 gap-3", hideTitle ? "mt-0" : "mt-6")}>
        {impactPillars.map((pillar) => (
          <div
            key={pillar.label}
            className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm transition-shadow hover:shadow-card"
          >
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-foreground text-primary-foreground">
              <Heart className="h-4 w-4" />
            </div>
            <p className="text-sm font-semibold leading-tight">{pillar.label}</p>
            <p className="mt-1 text-xs text-muted-foreground">{pillar.description}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 space-y-3 rounded-2xl border border-border bg-card p-4">
        <div className="flex items-start gap-3">
          <Handshake className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="text-sm font-semibold">Bello Partnership</p>
            <p className="text-xs text-muted-foreground">
              Collaborate with values-aligned organisations.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Leaf className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="text-sm font-semibold">Sustainability</p>
            <p className="text-xs text-muted-foreground">
              Eco-friendly practices across the beauty supply chain.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-auto flex flex-wrap gap-3 pt-6">
        <Button className="rounded-full" onClick={() => navigate(ROUTE_PATHS.impact)}>
          Our impact
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          className="rounded-full"
          onClick={() => navigate(ROUTE_PATHS.belloPartnership)}
        >
          Partnership
        </Button>
      </div>
    </section>
  );
}
