import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Check,
  CalendarCheck,
  Link2,
  User,
  Palette,
  Sparkles,
  BookOpen,
  Bell,
  BarChart3,
  CreditCard,
  Users,
} from "lucide-react";

const features = [
  { icon: CreditCard, label: "Free to Join + Low Commission" },
  { icon: CalendarCheck, label: "Easy Online Booking" },
  { icon: User, label: "Professional Business Profiles" },
  { icon: Link2, label: "Shareable Booking Link" },
  { icon: CalendarCheck, label: "Individual Professional Calendars" },
  { icon: Palette, label: "Portfolio & Style Showcase" },
  { icon: Sparkles, label: "Explore Trending Styles" },
  { icon: BookOpen, label: "Book Directly from Style Inspiration" },
  { icon: Bell, label: "Appointment Reminders" },
  { icon: BarChart3, label: "Business Analytics" },
  { icon: Users, label: "Networking" },
];

export default function JoinAsProfessional() {
  const navigate = useNavigate();

  return (
    <section className="rounded-2xl bg-muted/50 p-8 md:p-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
        {/* Left: Image */}
        <div className="relative rounded-2xl overflow-hidden aspect-[4/3]">
          <img
            src="https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=600&h=450&fit=crop"
            alt="Beauty professional at work"
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/50 to-transparent p-6">
            <p className="text-lg font-semibold text-white font-playfair">
              Grow your business with BelloNecta
            </p>
            <p className="text-xs text-white/80 mt-1">
              Join hundreds of beauty professionals already on the platform.
            </p>
          </div>
        </div>

        {/* Right: Features */}
        <div className="space-y-6">
          <h2 className="text-2xl md:text-3xl font-bold font-playfair text-foreground leading-tight">
            Platform Features
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed max-w-md">
            Everything you need to grow your beauty business — all in one place.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 pt-2">
            {features.map((f) => (
              <div key={f.label} className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-full bg-[hsl(35,60%,55%)]/15 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-[hsl(35,60%,55%)]" strokeWidth={2.5} />
                </div>
                <span className="text-sm text-foreground">{f.label}</span>
              </div>
            ))}
          </div>

          <div className="flex justify-center pt-2">
            <Button
              onClick={() => navigate("/auth")}
              className="h-11 px-8 bg-[hsl(35,60%,55%)] hover:bg-[hsl(35,60%,48%)] text-white font-medium text-sm rounded-full"
            >
              Join Now
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
