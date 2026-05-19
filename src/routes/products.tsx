import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteNav, SiteFooter } from "@/components/site-nav";

export const Route = createFileRoute("/products")({
  component: ProductsPage,
  head: () => ({
    meta: [
      { title: "Shop — Maison Noir" },
      { name: "description", content: "A small, considered collection of skincare, makeup, tools and fragrance." },
    ],
  }),
});

function ProductsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").order("category");
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main className="mx-auto max-w-6xl px-6 py-20">
        <header className="mb-16 max-w-2xl">
          <p className="mb-4 text-xs uppercase tracking-[0.3em] text-muted-foreground">The shop</p>
          <h1 className="font-serif text-5xl md:text-6xl">Products</h1>
          <p className="mt-4 text-muted-foreground">A small, considered collection. The ones we actually use.</p>
        </header>

        {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}

        <div className="grid gap-8 md:grid-cols-3">
          {data?.map((p) => (
            <article key={p.id} className="group">
              <div className="aspect-square bg-foreground/5 transition group-hover:bg-foreground/10" style={{ boxShadow: "var(--shadow-soft)" }} />
              <div className="mt-4 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">{p.category}</p>
                  <h2 className="font-serif text-xl">{p.name}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{p.description}</p>
                </div>
                <span className="whitespace-nowrap font-medium">${(p.price_cents / 100).toFixed(0)}</span>
              </div>
            </article>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
