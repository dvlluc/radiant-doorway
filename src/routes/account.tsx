import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { SiteNav, SiteFooter } from "@/components/site-nav";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/account")({
  component: AccountPage,
  head: () => ({ meta: [{ title: "My account — Maison Noir" }] }),
});

function AccountPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [user, loading, navigate]);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle();
      return data;
    },
  });

  const { data: bookings } = useQuery({
    queryKey: ["bookings", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*, services(name, duration_minutes, price_cents)")
        .order("appointment_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const cancel = async (id: string) => {
    const { error } = await supabase.from("bookings").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Booking cancelled.");
    qc.invalidateQueries({ queryKey: ["bookings"] });
  };

  if (loading || !user) return null;

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main className="mx-auto max-w-4xl px-6 py-20">
        <p className="mb-4 text-xs uppercase tracking-[0.3em] text-muted-foreground">Your account</p>
        <h1 className="font-serif text-5xl">Hello{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}.</h1>
        <p className="mt-2 text-muted-foreground">{user.email}</p>

        <section className="mt-16">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-serif text-3xl">Your appointments</h2>
            <Link to="/book"><Button>New booking</Button></Link>
          </div>

          {!bookings?.length && (
            <div className="border border-dashed border-border p-12 text-center">
              <p className="text-muted-foreground">No appointments yet.</p>
              <Link to="/book"><Button variant="outline" className="mt-4">Book a treatment</Button></Link>
            </div>
          )}

          <div className="divide-y divide-border border-y border-border">
            {bookings?.map((b: any) => {
              const when = new Date(b.appointment_at);
              return (
                <div key={b.id} className="grid gap-4 py-6 md:grid-cols-[1fr_auto] md:items-center">
                  <div>
                    <h3 className="font-serif text-2xl">{b.services?.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {when.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })} · {when.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                    </p>
                    {b.notes && <p className="mt-2 text-sm">{b.notes}</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs uppercase tracking-widest text-muted-foreground">{b.status}</span>
                    <Button variant="outline" size="sm" onClick={() => cancel(b.id)}>Cancel</Button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
