import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { SiteNav, SiteFooter } from "@/components/site-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

const searchSchema = z.object({
  businessId: z.string().optional(),
  serviceId: z.string().optional(),
});

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
  const [businessId, setBusinessId] = useState(search.businessId ?? "");
  const [serviceId, setServiceId] = useState(search.serviceId ?? "");
  const [date, setDate] = useState<Date | undefined>();
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/login" });
  }, [user, authLoading, navigate]);

  const { data: businesses } = useQuery({
    queryKey: ["businesses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, business_name")
        .eq("account_type", "business")
        .not("business_name", "is", null)
        .order("business_name");
      if (error) throw error;
      return data;
    },
  });

  const { data: services } = useQuery({
    queryKey: ["services", businessId],
    enabled: !!businessId,
    queryFn: async () => {
      const { data, error } = await supabase.from("services").select("*").eq("business_id", businessId).order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: vacations } = useQuery({
    queryKey: ["vacations-public", businessId],
    enabled: !!businessId,
    queryFn: async () => {
      const { data, error } = await supabase.from("business_vacations").select("day").eq("business_id", businessId);
      if (error) throw error;
      return data;
    },
  });

  const vacationSet = useMemo(
    () => new Set((vacations ?? []).map((v) => v.day)),
    [vacations]
  );

  const isVacation = (d: Date) => vacationSet.has(d.toISOString().slice(0, 10));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!businessId || !serviceId || !date || !time) return toast.error("Please fill in all fields.");
    if (isVacation(date)) return toast.error("This day is closed. Pick another day.");
    setSubmitting(true);
    const [h, m] = time.split(":").map(Number);
    const dt = new Date(date);
    dt.setHours(h, m, 0, 0);
    const { error } = await supabase.from("bookings").insert({
      user_id: user.id,
      service_id: serviceId,
      appointment_at: dt.toISOString(),
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
        <p className="mt-2 text-muted-foreground">Closed days are greyed out.</p>

        <form onSubmit={submit} className="mt-12 space-y-6 border border-border bg-card p-8" style={{ boxShadow: "var(--shadow-hard)" }}>
          <div>
            <Label>Business</Label>
            <Select value={businessId} onValueChange={(v) => { setBusinessId(v); setServiceId(""); setDate(undefined); }}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Choose a business" /></SelectTrigger>
              <SelectContent>
                {businesses?.map((b) => (
                  <SelectItem key={b.id} value={b.id}>{b.business_name}</SelectItem>
                ))}
                {!businesses?.length && <div className="px-2 py-1.5 text-sm text-muted-foreground">No businesses yet.</div>}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Treatment</Label>
            <Select value={serviceId} onValueChange={setServiceId} disabled={!businessId}>
              <SelectTrigger className="mt-1"><SelectValue placeholder={businessId ? "Choose a treatment" : "Select a business first"} /></SelectTrigger>
              <SelectContent>
                {services?.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name} — ${(s.price_cents / 100).toFixed(0)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button type="button" variant="outline" className={cn("mt-1 justify-start text-left font-normal", !date && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    disabled={(d) => d < new Date(new Date().setHours(0,0,0,0)) || isVacation(d)}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
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
            <Link to="/services" className="text-sm underline underline-offset-4">Browse services</Link>
            <Button type="submit" disabled={submitting}>{submitting ? "Booking…" : "Confirm booking"}</Button>
          </div>
        </form>
      </main>
      <SiteFooter />
    </div>
  );
}
