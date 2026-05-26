import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { belloMartPreviewLooks } from "@/components/home/homeContent";
import { BelloMartWaitlistDialog } from "@/components/home/BelloMartWaitlistDialog";
import { ROUTE_PATHS } from "@/routes.config";

export function HomeBelloMartPanel() {
  const navigate = useNavigate();
  const [waitlistOpen, setWaitlistOpen] = useState(false);

  return (
    <>
      <section
        id="bellomart"
        className="home-bento-card home-bento-dark scroll-mt-28 flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-white/10 shadow-elevated"
      >
        <div className="relative flex flex-1 flex-col p-6 md:p-8">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#1a1614] via-[#2a211c] to-[#1a1614]" />
          <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-white/5 blur-3xl" />

          <div className="relative">
            <span className="inline-flex rounded-full border border-white/20 bg-white/5 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-white/75">
              Coming soon
            </span>
            <span className="home-bento-label mt-4 block text-white/50">02 — BelloMart</span>
            <h2 className="mt-2 font-playfair text-2xl font-semibold tracking-tight text-white md:text-3xl">
              Shop the look
            </h2>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-white/70">
              Creators tag products in every post. Clients shop the exact routine behind the result.
            </p>
          </div>

          <div className="relative mt-6 -mx-2 flex gap-3 overflow-x-auto px-2 pb-2 scrollbar-hide">
            {belloMartPreviewLooks.map((look) => (
              <div
                key={look.title}
                className="relative h-44 w-32 shrink-0 overflow-hidden rounded-2xl sm:h-52 sm:w-36"
              >
                <img src={look.image} alt={look.title} className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-3 text-white">
                  <p className="text-xs font-semibold leading-tight">{look.title}</p>
                  <p className="text-[10px] text-white/65">{look.creator}</p>
                  <span className="mt-1 inline-block text-[10px] font-medium text-white/90">
                    {look.price}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="relative mt-auto flex flex-wrap items-center gap-3 pt-6">
            <Button
              className="rounded-full bg-white text-foreground hover:bg-white/90"
              onClick={() => setWaitlistOpen(true)}
            >
              Join waitlist
            </Button>
            <Button
              variant="ghost"
              className="rounded-full text-white hover:bg-white/10 hover:text-white"
              onClick={() => navigate(ROUTE_PATHS.belloMart)}
            >
              Preview BelloMart
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          <p className="relative mt-4 flex items-center gap-2 text-xs text-white/50">
            <Check className="h-3.5 w-3.5" />
            Launching soon — early access for professionals & fans
          </p>
        </div>
      </section>

      <BelloMartWaitlistDialog open={waitlistOpen} onOpenChange={setWaitlistOpen} />
    </>
  );
}
