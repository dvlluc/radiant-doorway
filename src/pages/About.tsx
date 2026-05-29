import { SEO } from "@/components/SEO";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useSmartBack } from "@/hooks/useSmartBack";

const ecosystemItems = [
  {
    title: "Discovery",
    text: "Explore styles, professionals, and inspiration in one curated experience.",
  },
  {
    title: "Booking",
    text: "Move from inspiration to appointment with a more seamless path to booking.",
  },
  {
    title: "Community",
    text: "Create space for connection, shared knowledge, and industry conversation.",
  },
  {
    title: "Commerce",
    text: "Support future product, service, and brand activity within one connected platform.",
  },
  {
    title: "Education",
    text: "Open the door to learning, development, and long-term professional growth.",
  },
  {
    title: "Innovation",
    text: "Explore the future of beauty through AI, VR, and new digital experiences.",
  },
];

const principles = [
  "Creativity First",
  "Opportunity",
  "Connection",
  "Impact",
];

const About = () => {
  const navigate = useNavigate();
  const goBack = useSmartBack('/explore-styles');

  return (
    <>
      <SEO
        title="About Us - BelloNecta"
        description="Learn more about BelloNecta and our mission in the beauty and wellness industry."
      />
      <div className="min-h-screen bg-background text-foreground">
        {/* Back button */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-foreground/95 backdrop-blur-sm">
          <div className="mx-auto flex max-w-6xl items-center px-6 py-4 lg:px-8">
            <button
              onClick={goBack}
              className="flex items-center gap-2 text-sm text-background/60 hover:text-background transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          </div>
        </div>

        {/* Hero */}
        <section className="bg-foreground text-background pt-14">
          <div className="mx-auto flex max-w-6xl flex-col items-center px-6 py-32 text-center sm:py-40 lg:px-8">
            <p className="text-center text-xs font-medium uppercase tracking-[0.3em] text-background/40">
              About Us
            </p>
            <h1 className="mx-auto mt-8 max-w-5xl text-center font-playfair text-5xl font-semibold leading-[1.15] tracking-tight sm:text-6xl lg:text-7xl">
              The future of beauty is seamlessly connected.
            </h1>
            <p className="mx-auto mt-8 max-w-3xl text-center text-lg leading-8 text-background/60">
              We are building a refined beauty ecosystem where discovery, booking, community, and commerce exist in one seamless experience.
            </p>
          </div>
        </section>

        {/* Beyond a booking platform */}
        <section className="mx-auto max-w-6xl px-6 py-20 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Beyond a booking platform
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              A connected beauty ecosystem designed for a new generation.
            </h2>
            <p className="mt-5 text-base leading-8 text-muted-foreground">
              We are creating a sophisticated environment where professionals, clients, creators, and brands engage within a single, unified space.
            </p>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-2">
            <div className="rounded-3xl border border-border bg-card p-7 shadow-sm">
              <h3 className="text-xl font-semibold tracking-tight">Designed around creativity</h3>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                Traditional platforms are built around schedules. We are built around the work — the artistry, the detail, and the professionals behind it.
              </p>
            </div>
            <div className="rounded-3xl border border-border bg-card p-7 shadow-sm">
              <h3 className="text-xl font-semibold tracking-tight">A platform with broader ambition</h3>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                Our long-term vision extends beyond appointments into community, commerce, education, and innovation across the beauty industry.
              </p>
            </div>
          </div>
        </section>

        {/* The Ecosystem */}
        <section className="border-y border-border bg-muted/30">
          <div className="mx-auto max-w-6xl px-6 py-20 lg:px-8">
            <div className="max-w-3xl">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
                The Ecosystem
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
                Six pillars shaping the platform.
              </h2>
            </div>
            <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {ecosystemItems.map((item) => (
                <div key={item.title} className="rounded-3xl border border-border bg-card p-7 shadow-sm">
                  <h3 className="text-xl font-semibold tracking-tight">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* The Story */}
        <section className="bg-foreground text-background">
          <div className="mx-auto max-w-6xl px-6 py-20 lg:px-8">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-background/40">
                  The Story Behind the Platform
                </p>
                <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
                  A personal experience that revealed a wider industry gap.
                </h2>
                <p className="mt-6 max-w-xl text-base leading-8 text-background/75">
                  Founded by Canya Stoddard, the platform is rooted in a deeply personal experience that revealed a significant gap within the beauty industry.
                </p>
                <p className="mt-4 max-w-xl text-base leading-8 text-background/65">
                  While balancing the demands of motherhood alongside a career in the legal profession, she encountered significant challenges in finding a hairstylist suited to her specific hair needs. The process exposed a fragmented landscape where information was scattered across multiple platforms, making discovery and booking both time-consuming and inefficient.
                </p>
                <p className="mt-4 max-w-xl text-base leading-8 text-background/65">
                  In response, she envisioned a connected beauty ecosystem designed to unify discovery, booking, community, and commerce within a single, intuitive platform.
                </p>
                <p className="mt-4 max-w-xl text-base leading-8 text-background/65">
                  The platform is set to launch in 2026.
                </p>
              </div>
              <div className="relative">
                <div className="overflow-hidden rounded-[32px] border border-background/10">
                    <img
                     src="https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=80"
                     alt="Beauty salon interior"
                    className="h-[440px] w-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-5 left-5 rounded-2xl bg-card p-4 text-foreground shadow-xl">
                  <div className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">The Problem</div>
                  <div className="mt-2 text-sm font-semibold">Scattered information. No clear booking path.</div>
                </div>
                <div className="absolute -top-5 right-5 rounded-2xl bg-primary p-4 text-primary-foreground shadow-xl">
                  <div className="text-xs font-medium uppercase tracking-[0.16em] text-primary-foreground/55">The Solution</div>
                  <div className="mt-2 text-sm font-semibold">A connected beauty ecosystem.</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Principles */}
        <section className="mx-auto max-w-6xl px-6 py-20 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Our Principles
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              The values shaping how we build.
            </h2>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {principles.map((item) => (
              <div key={item} className="rounded-3xl border border-border bg-card p-7 text-center shadow-sm">
                <div className="text-lg font-semibold tracking-tight">{item}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Impact */}
        <section className="border-y border-border bg-muted/30">
          <div className="mx-auto max-w-6xl px-6 py-20 lg:px-8">
            <div className="max-w-3xl">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
                Beauty with intention
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
                Building with impact in mind.
              </h2>
              <p className="mt-5 text-base leading-8 text-muted-foreground">
                We are committed to building a platform that supports sustainable beauty, restores confidence, and creates meaningful impact.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-6xl px-6 py-20 lg:px-8">
          <div className="rounded-[36px] bg-foreground px-8 py-12 text-center text-background sm:px-10 lg:px-14">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-background/40">
              Early Access
            </p>
            <h2 className="mt-4 text-center text-3xl font-semibold tracking-tight sm:text-4xl">
              Be part of the future of beauty.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-background/65">
              Join early and help define the next generation of beauty.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
              <button
                onClick={() => navigate('/auth')}
                className="rounded-2xl bg-background px-8 py-4 text-sm font-semibold text-foreground shadow-lg transition hover:bg-background/90 hover:shadow-xl"
              >
                Join Now
              </button>
              <button
                onClick={() => navigate('/explore-styles')}
                className="rounded-2xl border-2 border-background/30 bg-background/10 px-8 py-4 text-sm font-semibold text-background shadow-lg transition hover:bg-background/20"
              >
                Explore Styles
              </button>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default About;
