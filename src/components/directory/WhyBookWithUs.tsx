import { Check } from "lucide-react";

const benefits = [
  { title: "Verified Professionals", description: "Every professional is reviewed and verified before joining." },
  { title: "Secure Bookings", description: "Your bookings and payments are protected end-to-end." },
  { title: "Transparent Pricing", description: "See prices upfront — no hidden fees or surprises." },
  { title: "Easy Scheduling", description: "Book appointments that fit your schedule, anytime." },
];

export default function WhyBookWithUs() {
  return (
    <section className="rounded-2xl bg-muted/50 px-8 py-14 md:py-16">
      <div className="text-center mb-10">
        <h2 className="text-2xl md:text-3xl font-bold font-playfair">Why Book With Us</h2>
        <p className="text-muted-foreground mt-2">Your trust is our priority</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-8 max-w-5xl mx-auto">
        {benefits.map((b) => (
          <div key={b.title} className="flex gap-3">
            <div className="shrink-0 w-6 h-6 rounded-full bg-foreground flex items-center justify-center mt-0.5">
              <Check className="w-3.5 h-3.5 text-background" strokeWidth={3} />
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-[15px]">{b.title}</h3>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{b.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
