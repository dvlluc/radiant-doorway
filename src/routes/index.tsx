import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteNav, SiteFooter } from "@/components/site-nav";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Maison Noir — Beauty, in black and white" },
      { name: "description", content: "Signature facials, lash, brows and curated beauty products. Book your treatment at Maison Noir." },
    ],
  }),
});

function Index() {
  const { data: services } = useQuery({
    queryKey: ["services", "featured"],
    queryFn: async () => {
      const { data, error } = await supabase.from("services").select("*").limit(3);
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main>
        {/* Hero */}
        <section className="border-b border-border">
          <div className="mx-auto grid max-w-6xl gap-12 px-6 py-24 md:grid-cols-2 md:py-32">
            <div className="flex flex-col justify-center">
              <p className="mb-6 text-xs uppercase tracking-[0.3em] text-muted-foreground">Est. 2024 — Maison Noir</p>
              <h1 className="font-serif text-5xl leading-[1.05] md:text-7xl">
                Beauty,<br />in black and white.
              </h1>
              <p className="mt-6 max-w-md text-base text-muted-foreground">
                A modern beauty house. Signature facials, expert brows and lashes, and a small collection of products we'd actually use ourselves.
              </p>
              <div className="mt-10 flex gap-3">
                <Link to="/book"><Button size="lg">Book a treatment</Button></Link>
                <Link to="/services"><Button size="lg" variant="outline">Explore services</Button></Link>
              </div>
            </div>
            <div className="relative aspect-[4/5] bg-foreground" style={{ boxShadow: "var(--shadow-hard)" }}>
              <div className="absolute inset-0 flex items-end p-8">
                <div className="font-serif text-7xl text-background">M<br />N</div>
              </div>
            </div>
          </div>
        </section>

        {/* Featured services */}
        <section className="mx-auto max-w-6xl px-6 py-24">
          <div className="mb-12 flex items-end justify-between">
            <h2 className="font-serif text-4xl md:text-5xl">Signature treatments</h2>
            <Link to="/services" className="text-sm underline underline-offset-4">View all</Link>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {services?.map((s) => (
              <article key={s.id} className="border border-border bg-card p-8 transition hover:-translate-y-1" style={{ boxShadow: "var(--shadow-soft)" }}>
                <div className="mb-6 aspect-square bg-foreground/5" />
                <h3 className="font-serif text-2xl">{s.name}</h3>
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{s.description}</p>
                <div className="mt-6 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{s.duration_minutes} min</span>
                  <span className="font-medium">${(s.price_cents / 100).toFixed(0)}</span>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="border-y border-border bg-foreground text-background">
          <div className="mx-auto flex max-w-6xl flex-col items-start gap-8 px-6 py-20 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-serif text-4xl md:text-5xl">Ready when you are.</h2>
              <p className="mt-3 max-w-md text-sm text-background/70">Create an account to book treatments and track your appointments.</p>
            </div>
            <Link to="/signup"><Button size="lg" variant="secondary">Create account</Button></Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
