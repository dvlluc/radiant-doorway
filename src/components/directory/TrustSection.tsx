import { CalendarCheck, Coins, Sparkles, UserPlus } from "lucide-react";

const trustPoints = [
  {
    icon: UserPlus,
    title: "Free to Join",
  },
  {
    icon: Coins,
    title: "Low Commission",
  },
  {
    icon: Sparkles,
    title: "Built for Beauty Professionals",
  },
  {
    icon: CalendarCheck,
    title: "Easy Booking Experience",
  },
];

export default function TrustSection() {
  return (
    <section className="rounded-2xl bg-muted/50 px-6 py-12 md:px-8 md:py-14">
      <div className="mx-auto max-w-4xl rounded-[2rem] border border-border bg-background px-6 py-10 shadow-[var(--shadow-card)] md:px-10 md:py-12">
        <div className="text-center">
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
            Professional Trust
          </p>
          <h2 className="mt-3 font-playfair text-3xl leading-tight text-foreground md:text-4xl">
            Designed with more care, clarity, and confidence
          </h2>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {trustPoints.map((point) => {
            const Icon = point.icon;

            return (
              <div
                key={point.title}
                className="rounded-[1.5rem] border border-border bg-card px-6 py-7 text-center shadow-[var(--shadow-card)] transition-transform duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-hover)]"
              >
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-border bg-muted">
                  <Icon className="h-6 w-6 text-foreground" strokeWidth={1.8} />
                </div>
                <h3 className="mt-5 font-playfair text-xl leading-snug text-foreground md:text-[1.4rem]">
                  {point.title}
                </h3>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
