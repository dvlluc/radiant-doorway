import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { HomeHubHero } from "@/components/home/HomeHubHero";
import { HomeProfessionalsPanel } from "@/components/home/HomeProfessionalsPanel";
import { HomeBelloMartPanel } from "@/components/home/HomeBelloMartPanel";
import { HomeImpactPanel } from "@/components/home/HomeImpactPanel";
import { HomeFullWidthStrip } from "@/components/home/HomeFullWidthStrip";
import HowItWorks from "@/components/directory/HowItWorks";
import JoinAsProfessional from "@/components/directory/JoinAsProfessional";
import PopularServices from "@/components/directory/PopularServices";
import { ROUTE_PATHS } from "@/routes.config";

export default function Home() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const goToDirectorySearch = () => {
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set("search", searchQuery.trim());
    const qs = params.toString();
    navigate(qs ? `${ROUTE_PATHS.directory}?${qs}` : ROUTE_PATHS.directory);
  };

  return (
    <>
      <SEO
        title="BelloNecta — Beauty professionals, BelloMart & impact"
        description="Discover beauty professionals, preview BelloMart shoppable looks, and explore our impact initiatives — all in one hub."
        keywords="beauty booking, beauty directory, bello mart, beauty impact, belloNecta"
        type="website"
      />

      <div className="home-page -mx-4 space-y-5 pb-24 md:-mx-8 md:space-y-6 md:pb-16">
        <HomeHubHero
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSearchSubmit={goToDirectorySearch}
        />

        <div className="home-bento px-4 md:px-8">
          <div className="home-bento-grid">
            <div className="home-bento-pros">
              <HomeProfessionalsPanel />
            </div>
            <div className="home-bento-mart">
              <HomeBelloMartPanel />
            </div>
            <div className="home-bento-styles">
              <div className="home-bento-card h-full overflow-hidden rounded-[1.75rem] border border-border/70 bg-card shadow-card">
                <PopularServices />
              </div>
            </div>
            <div className="home-bento-join">
              <div className="home-bento-card overflow-hidden rounded-[1.75rem] border border-border/70 shadow-card">
                <JoinAsProfessional />
              </div>
            </div>
          </div>
        </div>

        <HomeFullWidthStrip title="Simple and Seamless Booking" variant="light">
          <HowItWorks hideTitle />
        </HomeFullWidthStrip>

        <HomeFullWidthStrip
          id="impact"
          title="Beauty that gives back"
          subtitle="Partnerships, sustainability, and healing initiatives woven into the platform — not an afterthought."
          variant="muted"
        >
          <HomeImpactPanel hideTitle />
        </HomeFullWidthStrip>
      </div>
    </>
  );
}
