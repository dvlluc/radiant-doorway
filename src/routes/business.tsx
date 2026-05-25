import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { SiteNav, SiteFooter } from "@/components/site-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/business")({
  component: BusinessDashboard,
  head: () => ({ meta: [{ title: "Business dashboard — Maison Noir" }] }),
});

function BusinessDashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle();
      return data;
    },
  });

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
    if (profile && profile.account_type !== "business") navigate({ to: "/account" });
  }, [user, loading, profile, navigate]);

  const { data: services } = useQuery({
    queryKey: ["my-services", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("services").select("*").eq("business_id", user!.id).order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: bookings } = useQuery({
    queryKey: ["biz-bookings", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*, services!inner(name, business_id), profiles:user_id(full_name)")
        .eq("services.business_id", user!.id)
        .order("appointment_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: vacations } = useQuery({
    queryKey: ["vacations", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("business_vacations")
        .select("*")
        .eq("business_id", user!.id)
        .order("day");
      if (error) throw error;
      return data;
    },
  });

  // service form
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState(60);
  const [price, setPrice] = useState(80);
  const [saving, setSaving] = useState(false);

  const addService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("services").insert({
      name, description, duration_minutes: duration, price_cents: Math.round(price * 100), business_id: user.id,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Service added.");
    setName(""); setDescription(""); setDuration(60); setPrice(80);
    qc.invalidateQueries({ queryKey: ["my-services"] });
    qc.invalidateQueries({ queryKey: ["services"] });
  };

  const removeService = async (id: string) => {
    const { error } = await supabase.from("services").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["my-services"] });
  };

  const cancelBooking = async (id: string) => {
    const { error } = await supabase.from("bookings").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Booking cancelled.");
    qc.invalidateQueries({ queryKey: ["biz-bookings"] });
  };

  const vacationDates = (vacations ?? []).map((v) => new Date(v.day + "T00:00:00"));

  const toggleVacation = async (dates: Date[] | undefined) => {
    if (!user) return;
    const current = new Set((vacations ?? []).map((v) => v.day));
    const next = new Set((dates ?? []).map((d) => d.toISOString().slice(0, 10)));
    const toAdd = [...next].filter((d) => !current.has(d));
    const toRemove = [...current].filter((d) => !next.has(d));
    if (toAdd.length) {
      const { error } = await supabase.from("business_vacations").insert(
        toAdd.map((day) => ({ business_id: user.id, day }))
      );
      if (error) return toast.error(error.message);
    }
    if (toRemove.length) {
      const { error } = await supabase
        .from("business_vacations")
        .delete()
        .eq("business_id", user.id)
        .in("day", toRemove);
      if (error) return toast.error(error.message);
    }
    qc.invalidateQueries({ queryKey: ["vacations"] });
  };

  if (loading || profileLoading || !user) return null;

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main className="mx-auto max-w-5xl px-6 py-16 space-y-16">
        <header>
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Business</p>
          <h1 className="mt-2 font-serif text-5xl">{profile?.business_name ?? "Your studio"}</h1>
        </header>

        {/* Services */}
        <section>
          <h2 className="font-serif text-3xl mb-6">Services</h2>
          <form onSubmit={addService} className="grid gap-4 border border-border bg-card p-6 md:grid-cols-2" style={{ boxShadow: "var(--shadow-hard)" }}>
            <div className="md:col-span-2">
              <Label>Name</Label>
              <Input required value={name} onChange={(e) => setName(e.target.value)} className="mt-1" />
            </div>
            <div className="md:col-span-2">
              <Label>Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} className="mt-1" />
            </div>
            <div>
              <Label>Duration (min)</Label>
              <Input type="number" min={5} max={600} required value={duration} onChange={(e) => setDuration(+e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Price ($)</Label>
              <Input type="number" min={0} step="0.01" required value={price} onChange={(e) => setPrice(+e.target.value)} className="mt-1" />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Add service"}</Button>
            </div>
          </form>

          <div className="mt-6 divide-y divide-border border-y border-border">
            {!services?.length && <p className="py-6 text-sm text-muted-foreground">No services yet.</p>}
            {services?.map((s) => (
              <div key={s.id} className="grid gap-2 py-4 md:grid-cols-[1fr_auto] md:items-center">
                <div>
                  <h3 className="font-serif text-xl">{s.name}</h3>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">{s.duration_minutes} min · ${(s.price_cents/100).toFixed(0)}</p>
                  {s.description && <p className="mt-1 text-sm text-muted-foreground">{s.description}</p>}
                </div>
                <Button variant="outline" size="sm" onClick={() => removeService(s.id)}>Remove</Button>
              </div>
            ))}
          </div>
        </section>

        {/* Vacations */}
        <section>
          <h2 className="font-serif text-3xl mb-2">Vacation days</h2>
          <p className="mb-6 text-sm text-muted-foreground">Click days to mark them as closed. Selected days can't be booked.</p>
          <div className="border border-border bg-card p-4 inline-block" style={{ boxShadow: "var(--shadow-hard)" }}>
            <Calendar
              mode="multiple"
              selected={vacationDates}
              onSelect={toggleVacation}
              className={cn("p-3 pointer-events-auto")}
            />
          </div>
        </section>

        {/* Bookings */}
        <section>
          <h2 className="font-serif text-3xl mb-6">Upcoming appointments</h2>
          {!bookings?.length && <p className="text-sm text-muted-foreground">No bookings yet.</p>}
          <div className="divide-y divide-border border-y border-border">
            {bookings?.map((b: any) => {
              const when = new Date(b.appointment_at);
              return (
                <div key={b.id} className="grid gap-3 py-5 md:grid-cols-[1fr_auto] md:items-center">
                  <div>
                    <h3 className="font-serif text-xl">{b.services?.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {when.toLocaleDateString()} · {when.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                      {b.profiles?.full_name ? ` · ${b.profiles.full_name}` : ""}
                    </p>
                    {b.notes && <p className="mt-1 text-sm">{b.notes}</p>}
                  </div>
                  <Button variant="outline" size="sm" onClick={() => cancelBooking(b.id)}>Cancel</Button>
                </div>
              );
            })}
          </div>
        </section>

        <p className="text-sm text-muted-foreground">
          Looking for individual view? <Link to="/account" className="underline underline-offset-4">My account</Link>
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
