import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteNav, SiteFooter } from "@/components/site-nav";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/services")({
  component: ServicesPage,
  head: () => ({
    meta: [
      { title: "Services — Maison Noir" },
      { name: "description", content: "Browse signature treatments from our beauty businesses." },
    ],
  }),
});

function ServicesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["services-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*, profiles:business_id(business_name)")
        .order("price_cents");
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main className="mx-auto max-w-6xl px-6 py-20">
        <header className="mb-16 max-w-2xl">
          <p className="mb-4 text-xs uppercase tracking-[0.3em] text-muted-foreground">The menu</p>
          <h1 className="font-serif text-5xl md:text-6xl">Services</h1>
          <p className="mt-4 text-muted-foreground">Every treatment is tailored to you. Choose the result, we'll handle the rest.</p>
        </header>

        {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}

        <div className="divide-y divide-border border-y border-border">
          {data?.map((s: any) => (
            <article key={s.id} className="grid gap-6 py-8 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <h2 className="font-serif text-3xl">{s.name}</h2>
                {s.profiles?.business_name && (
                  <p className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">{s.profiles.business_name}</p>
                )}
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{s.description}</p>
                <p className="mt-3 text-xs uppercase tracking-widest text-muted-foreground">{s.duration_minutes} min · ${(s.price_cents / 100).toFixed(0)}</p>
              </div>
              <Link to="/book" search={{ businessId: s.business_id ?? undefined, serviceId: s.id }}>
                <Button variant="outline">Book</Button>
              </Link>
            </article>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
