import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { SiteNav, SiteFooter } from "@/components/site-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const searchSchema = z.object({ serviceId: z.string().optional() });

export const Route = createFileRoute("/book")({
  component: BookPage,
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({ meta: [{ title: "Book a treatment — Maison Noir" }] }),
});

function BookPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const search = Route.useSearch();
  const [serviceId, setServiceId] = useState(search.serviceId ?? "");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate({ to: "/login" });
    }
  }, [user, authLoading, navigate]);

  const { data: services } = useQuery({
    queryKey: ["services"],
    queryFn: async () => {
      const { data, error } = await supabase.from("services").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!serviceId || !date || !time) return toast.error("Please fill in all fields.");
    setSubmitting(true);
    const appointment_at = new Date(`${date}T${time}`).toISOString();
    const { error } = await supabase.from("bookings").insert({
      user_id: user.id,
      service_id: serviceId,
      appointment_at,
      notes: notes || null,
    });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("Appointment requested.");
    qc.invalidateQueries({ queryKey: ["bookings"] });
    navigate({ to: "/account" });
  };

  if (authLoading) return null;

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main className="mx-auto max-w-2xl px-6 py-20">
        <p className="mb-4 text-xs uppercase tracking-[0.3em] text-muted-foreground">Reservation</p>
        <h1 className="font-serif text-5xl">Book a treatment</h1>
        <p className="mt-2 text-muted-foreground">We'll confirm your appointment by email.</p>

        <form onSubmit={submit} className="mt-12 space-y-6 border border-border bg-card p-8" style={{ boxShadow: "var(--shadow-hard)" }}>
          <div>
            <Label>Treatment</Label>
            <Select value={serviceId} onValueChange={setServiceId}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Choose a treatment" /></SelectTrigger>
              <SelectContent>
                {services?.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name} — ${(s.price_cents / 100).toFixed(0)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="time">Time</Label>
              <Input id="time" type="time" required value={time} onChange={(e) => setTime(e.target.value)} className="mt-1" />
            </div>
          </div>
          <div>
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1" maxLength={500} />
          </div>
          <div className="flex items-center justify-between">
            <Link to="/services" className="text-sm underline underline-offset-4">Browse all services</Link>
            <Button type="submit" disabled={submitting}>{submitting ? "Booking…" : "Confirm booking"}</Button>
          </div>
        </form>
      </main>
      <SiteFooter />
    </div>
  );
}
