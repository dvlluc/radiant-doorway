import { useNavigate } from "react-router-dom";
import { MapPin } from "lucide-react";
import type { DirectoryLocationOption } from "@/components/directory/locationUtils";
import londonImage from "@/assets/explore-london.png";
import manchesterImage from "@/assets/explore-manchester.png";
import birminghamImage from "@/assets/explore-birmingham.png";
import leedsImage from "@/assets/explore-leeds.png";
import bristolImage from "@/assets/explore-bristol.png";
import edinburghImage from "@/assets/explore-edinburgh.png";

interface ExploreByLocationProps {
  locations: DirectoryLocationOption[];
}

const DEFAULT_LOCATION_CARDS = [
  { name: "London", slug: "london", image: londonImage },
  { name: "Manchester", slug: "manchester", image: manchesterImage },
  { name: "Birmingham", slug: "birmingham", image: birminghamImage },
  { name: "Leeds", slug: "leeds", image: leedsImage },
  { name: "Bristol", slug: "bristol", image: bristolImage },
  { name: "Edinburgh", slug: "edinburgh", image: edinburghImage },
];

export default function ExploreByLocation({ locations }: ExploreByLocationProps) {
  const navigate = useNavigate();

  const cards = DEFAULT_LOCATION_CARDS.map((card, index) => {
    const matchingLocation = locations.find((location) => location.slug === card.slug);
    const fallbackLocation = locations.length > 0 ? locations[index % locations.length] : undefined;

    return {
      ...card,
      targetSlug: matchingLocation?.slug || fallbackLocation?.slug || card.slug,
    };
  });

  const handleLocationClick = (slug: string) => {
    navigate(`/directory?location=${slug}#featured-professionals`);

    window.setTimeout(() => {
      document.getElementById("featured-professionals")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 50);
  };

  return (
    <section className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl md:text-3xl font-bold font-playfair">Explore by Location</h2>
        <p className="text-muted-foreground mt-2">Find beauty professionals near you</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {cards.map((loc) => (
          <button
            key={loc.slug}
            onClick={() => handleLocationClick(loc.targetSlug)}
            className="group relative aspect-[4/3] rounded-xl overflow-hidden bg-muted"
          >
            <img
              src={loc.image}
              alt={loc.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              loading="lazy"
              width={400}
              height={300}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-white" />
              <span className="text-white font-medium text-sm">{loc.name}</span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
