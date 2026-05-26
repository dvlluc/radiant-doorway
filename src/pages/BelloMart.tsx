import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const waitlistSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, { message: "First name is required" })
    .max(50, { message: "First name must be less than 50 characters" }),
  email: z
    .string()
    .trim()
    .email({ message: "Please enter a valid email address" })
    .max(255, { message: "Email must be less than 255 characters" }),
});

const previewLooks = [
  {
    title: "Soft Glam",
    creator: "by @gmanmakeup",
    price: "£29",
    image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=1200&q=80",
    products: [
      { name: "Airbrush Foundation", price: "£20" },
      { name: "Iconic Blush", price: "£14" },
    ],
  },
  {
    title: "Coquette Nails",
    creator: "by @maner-byleah",
    price: "£18",
    image: "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=1200&q=80",
    products: [
      { name: "Sheer Pink Polish", price: "£12" },
      { name: "Milky White Polish", price: "£10" },
    ],
  },
  {
    title: "Wispy Lash Extensions",
    creator: "by lashes-by-lanne",
    price: "£60",
    image: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=1200&q=80",
    products: [
      { name: "Dark Adhesive", price: "£10" },
      { name: "Basic Kit", price: "£9" },
    ],
  },
  {
    title: "Bronze Glow",
    creator: "by @studio.luxe",
    price: "£42",
    image: "https://images.unsplash.com/photo-1457972729786-0411a3b2b626?auto=format&fit=crop&w=1200&q=80",
    products: [
      { name: "Liquid Bronzer", price: "£18" },
      { name: "Glow Primer", price: "£14" },
    ],
  },
];

const audience = [
  { title: "Professionals", text: "Earn beyond appointments" },
  { title: "Brands", text: "Reach highly engaged beauty audiences" },
  { title: "Users", text: "See exactly what your favourite creators are using" },
];

const BelloMart = () => {
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogSource, setDialogSource] = useState<"join_waitlist" | "launch_updates">("join_waitlist");
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const openDialog = (source: "join_waitlist" | "launch_updates") => {
    setDialogSource(source);
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = waitlistSchema.safeParse({ firstName, email });
    if (!result.success) {
      toast.error(result.error.issues[0].message);
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("bellomart_waitlist").insert({
      first_name: result.data.firstName,
      email: result.data.email,
      source: dialogSource,
    });
    setSubmitting(false);
    if (error) {
      toast.error("Something went wrong. Please try again.");
      return;
    }
    toast.success("You're on the list! We'll be in touch soon.");
    setFirstName("");
    setEmail("");
    setDialogOpen(false);
  };

  const dialogTitle = dialogSource === "join_waitlist" ? "Join the Waitlist" : "Get Launch Updates";
  const dialogDescription =
    dialogSource === "join_waitlist"
      ? "Be the first to shop the looks when BelloMart goes live."
      : "We'll email you the moment BelloMart launches.";

  return (
    <div className="min-h-screen bg-[#f7f4f1] text-foreground -mx-4 sm:-mx-6 lg:-mx-8 overflow-x-hidden">
      {/* Mobile back button */}
      <div className="px-4 py-3 md:hidden bg-[#f7f4f1]">
        <button onClick={() => navigate(-1)} className="p-1" aria-label="Go back">
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#191514] to-[#2f2521] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,_rgba(255,255,255,0.08),_transparent_50%)]" />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-5 py-14 md:py-20 lg:grid-cols-2 lg:items-center lg:px-8">
          <div className="max-w-xl">
            <span className="inline-flex items-center rounded-full border border-white/20 bg-white/5 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-white/80 backdrop-blur">
              Coming Soon
            </span>
            <h1 className="mt-5 text-4xl md:text-5xl lg:text-[3.75rem] font-semibold leading-[1.02] tracking-tight">
              A new beauty<br />marketplace is coming
            </h1>
            <p className="mt-5 max-w-lg text-base md:text-lg leading-8 text-white/75">
              Post your work, tag the products you use, and soon let clients shop your looks — all in one place.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => openDialog("join_waitlist")}
                className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-white/90"
              >
                Join the Waitlist
              </button>
              <button
                onClick={() => openDialog("launch_updates")}
                className="rounded-xl border border-white/25 bg-transparent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Get Launch Updates
              </button>
            </div>

            <p className="mt-5 text-xs text-white/55">
              Launching in 10 weeks — be among the first to know when we go live.
            </p>
          </div>

          {/* Phone Mockup */}
          <div className="flex justify-center lg:justify-end">
            <div className="relative w-[240px] md:w-[270px] rounded-[32px] border border-white/10 bg-black p-2.5 shadow-[0_24px_60px_rgba(0,0,0,0.5)]">
              <div className="absolute left-1/2 top-2.5 h-5 w-28 -translate-x-1/2 rounded-full bg-black z-10" />
              <div className="overflow-hidden rounded-[24px] bg-[#f8f4ef]">
                <div className="relative">
                  <img
                    src="https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?auto=format&fit=crop&w=600&q=80"
                    alt="Shoppable beauty look preview"
                    className="h-[240px] md:h-[270px] w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/15" />
                  <div className="absolute right-2.5 top-16 rounded-lg bg-white/95 backdrop-blur-sm px-2.5 py-1.5 text-[10px] font-medium text-black shadow-md">
                    Edge Control <span className="ml-1.5 text-black/40 font-semibold">£10</span>
                  </div>
                  <div className="absolute right-5 top-[7.5rem] rounded-lg bg-white/95 backdrop-blur-sm px-2.5 py-1.5 text-[10px] font-medium text-black shadow-md">
                    Nourishing Oil <span className="ml-1.5 text-black/40 font-semibold">£10</span>
                  </div>
                  <div className="absolute right-3 top-[10.5rem] rounded-lg bg-white/95 backdrop-blur-sm px-2.5 py-1.5 text-[10px] font-medium text-black shadow-md">
                    Sleep Cap <span className="ml-1.5 text-black/40 font-semibold">£10</span>
                  </div>
                </div>

                <div className="px-4 py-3.5">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center rounded-full bg-black/5 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wider text-black/60">
                      Shop This Look
                    </span>
                    <span className="text-[10px] font-medium text-black/50">Preview</span>
                  </div>
                  <button
                    disabled
                    className="mt-3 w-full rounded-xl bg-black/80 py-2.5 text-[11px] font-bold tracking-wider text-white/90 cursor-not-allowed"
                  >
                    SHOP THIS LOOK
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PREVIEW LOOKS */}
      <section className="bg-[#f7f4f1] py-14 md:py-20">
        <div className="mx-auto max-w-6xl px-5 lg:px-8">
          <h2 className="text-center font-['Playfair_Display'] text-2xl md:text-3xl lg:text-4xl font-semibold tracking-tight text-[#1a1a1a]">
            Preview the looks you'll soon be able to shop
          </h2>
          <div className="mt-4 flex items-center justify-center gap-2.5">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-black/8">
              <Check className="h-3.5 w-3.5 text-black/70" />
            </div>
            <p className="text-sm md:text-base text-black/65">
              Look lists from skilled beauty professionals
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {previewLooks.map((look) => (
              <div
                key={look.title}
                className="group relative aspect-[3/4] overflow-hidden rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all duration-500 hover:shadow-[0_16px_40px_rgba(0,0,0,0.18)]"
              >
                <img
                  src={look.image}
                  alt={look.title}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

                {/* Top badges */}
                <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
                  <span className="inline-flex items-center rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-black backdrop-blur">
                    Shop This Look
                  </span>
                  <span className="inline-flex items-center rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur">
                    {look.price}
                  </span>
                </div>

                {/* Bottom overlay content */}
                <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                  <h3 className="text-lg font-semibold leading-tight tracking-tight">
                    {look.title}
                  </h3>
                  <p className="mt-0.5 text-xs text-white/70">{look.creator}</p>
                  <div className="mt-3 space-y-1.5 opacity-0 max-h-0 overflow-hidden transition-all duration-500 group-hover:opacity-100 group-hover:max-h-32">
                    {look.products.map((product) => (
                      <div
                        key={product.name}
                        className="flex items-center justify-between text-[11px] text-white/85"
                      >
                        <span className="truncate">{product.name}</span>
                        <span className="ml-2 shrink-0 rounded-full bg-white/15 px-2 py-0.5 text-[9px] font-medium uppercase tracking-wide">
                          Soon
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AUDIENCE */}
      <section className="bg-gradient-to-b from-[#2a201d] to-[#3b2e28] text-white py-14 md:py-20">
        <div className="mx-auto max-w-6xl px-5 lg:px-8">
          <h2 className="text-center font-['Playfair_Display'] text-2xl md:text-3xl lg:text-4xl font-semibold tracking-tight">
            Built for the beauty ecosystem
          </h2>
          <div className="mt-4 flex items-center justify-center gap-2.5">
            <div className="flex h-6 w-6 items-center justify-center rounded-full border border-white/25">
              <Check className="h-3.5 w-3.5 text-white/80" />
            </div>
            <p className="text-sm md:text-base text-white/75">
              Get early access to the future of beauty commerce.
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {audience.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-white/10 bg-white/5 px-5 py-7 text-center backdrop-blur"
              >
                <h3 className="text-center text-lg font-semibold tracking-tight text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/70">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="bg-[#f7f4f1] py-14 md:py-20">
        <div className="mx-auto max-w-6xl px-5 lg:px-8">
          <div className="rounded-2xl border border-black/6 bg-white px-6 py-12 text-center shadow-sm">
            <h2 className="text-center font-['Playfair_Display'] text-2xl md:text-3xl lg:text-4xl font-semibold tracking-tight text-[#1a1a1a]">
              Be first to experience the marketplace
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-sm md:text-base leading-7 text-black/60">
              Get early access to the future of beauty commerce.
            </p>
            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button
                onClick={() => openDialog("join_waitlist")}
                className="rounded-xl bg-black px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-black/90"
              >
                Join the Waitlist
              </button>
              <button
                onClick={() => openDialog("launch_updates")}
                className="rounded-xl border border-black/15 bg-transparent px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-black/5"
              >
                Get Launch Updates
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* WAITLIST DIALOG */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription>{dialogDescription}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="waitlist-first-name">First name</Label>
              <Input
                id="waitlist-first-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Jane"
                maxLength={50}
                required
                disabled={submitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="waitlist-email">Email address</Label>
              <Input
                id="waitlist-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                maxLength={255}
                required
                disabled={submitting}
              />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                dialogTitle
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BelloMart;
