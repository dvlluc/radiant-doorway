import { useNavigate } from "react-router-dom";
import { Sparkles, Heart, CalendarCheck } from "lucide-react";

const styleImages = [
  { src: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=500&fit=crop", alt: "Salon styling" },
  { src: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400&h=300&fit=crop", alt: "Braided hairstyle" },
  { src: "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=400&h=350&fit=crop", alt: "Beauty look" },
  { src: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400&h=450&fit=crop", alt: "Skincare routine" },
  { src: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&h=280&fit=crop", alt: "Barber cut" },
  { src: "https://images.unsplash.com/photo-1583001931096-959e9a1a6223?w=400&h=520&fit=crop", alt: "Nail art" },
  { src: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=320&fit=crop", alt: "Hair color" },
  { src: "https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=400&h=480&fit=crop", alt: "Natural beauty" },
  { src: "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=400&h=360&fit=crop", alt: "Grooming" },
];

const features = [
  { icon: Sparkles, label: "Explore Style Inspiration" },
  { icon: Heart, label: "Save Your Favorite Looks" },
  { icon: CalendarCheck, label: "Book the Style Instantly" },
];

export default function PopularServices() {
  const navigate = useNavigate();

  return (
    <section className="rounded-2xl bg-muted/50 p-8 md:p-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
        {/* Left: Text content */}
        <div className="space-y-6">
          <h2 className="text-2xl md:text-3xl font-bold font-playfair text-foreground leading-tight">
            Discover Trending<br />Beauty Styles
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed max-w-sm">
            Browse trending hairstyles, nail designs, and beauty looks.
            Find professionals who can recreate the style you love.
          </p>
          <div className="space-y-5 pt-2">
            {features.map((f) => (
              <div key={f.label} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <f.icon className="w-5 h-5 text-primary" strokeWidth={1.5} />
                </div>
                <span className="text-sm font-medium text-foreground">{f.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Pinterest-style masonry grid */}
        <div className="columns-3 gap-2.5 space-y-2.5 max-h-[380px] overflow-hidden">
          {styleImages.map((img, i) => (
            <button
              key={i}
              onClick={() => navigate("/explore-styles")}
              className="group block w-full rounded-xl overflow-hidden break-inside-avoid mb-2.5"
            >
              <img
                src={img.src}
                alt={img.alt}
                className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
