import { useState, useEffect, useRef } from "react";
import clientExperienceImg from "@/assets/client-experience.jpg";
import dashboardGrowthImg from "@/assets/dashboard-growth.jpg";
import logo from "@/assets/bellonecta-logo.png";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SEO } from "@/components/SEO";
import {
  CalendarCheck,
  Camera,
  Users,
  BarChart3,
  UserPlus,
  ListPlus,
  Clock,
  Zap,
  Star,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Check,
} from "lucide-react";
import { useSmartBack } from "@/hooks/useSmartBack";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import heroImage from "@/assets/list-business-hero.jpg";

const AnimatedCounter = ({
  target,
  suffix = "",
}: {
  target: number;
  suffix?: string;
}) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const duration = 2000;
          const steps = 60;
          const increment = target / steps;
          let current = 0;
          const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
              setCount(target);
              clearInterval(timer);
            } else {
              setCount(Math.floor(current));
            }
          }, duration / steps);
        }
      },
      { threshold: 0.3 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return (
    <div
      ref={ref}
      className="text-4xl md:text-5xl font-bold font-playfair text-foreground"
    >
      {count.toLocaleString()}
      {suffix}
    </div>
  );
};

const benefits = [
  {
    icon: Camera,
    title: "Showcase Your Work",
    description: "Your portfolio becomes your storefront.",
  },
  {
    icon: Users,
    title: "Get Discovered",
    description: "Clients find you through styles, not searches.",
  },
  {
    icon: CalendarCheck,
    title: "No More DMs",
    description: "Clear pricing, availability, instant booking.",
  },
];

const steps = [
  {
    icon: UserPlus,
    title: "Create Your Account",
    description: "Sign up in under 2 minutes — it's completely free.",
  },
  {
    icon: ListPlus,
    title: "Add Your Services",
    description: "List what you offer with pricing, photos, and details.",
  },
  {
    icon: Clock,
    title: "Set Your Schedule",
    description:
      "Define your availability and let clients book around your life.",
  },
  {
    icon: Zap,
    title: "Get Bookings Instantly",
    description: "Start receiving bookings from verified clients right away.",
  },
];

const testimonials = [
  {
    name: "Trusted by beauty professionals",
    role: "Hair Stylist",
    quote: "Finally a platform where my work actually brings me clients.",
    rating: 5,
  },
  {
    name: "Sophie Laurent",
    role: "Lash & Brow Artist",
    quote:
      "The profile showcase is stunning. My clients love how easy it is to book with me.",
    rating: 5,
  },
  {
    name: "Marcus Chen",
    role: "Master Barber",
    quote:
      "Finally a platform that understands what beauty professionals actually need.",
    rating: 5,
  },
];

const ListYourBusiness = () => {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  const goBack = useSmartBack("/explore-styles");

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="List Your Business | BelloNecta"
        description="Grow your beauty business with BelloNecta. Smart bookings, stunning profiles, and verified clients — all in one platform."
      />

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        {/* Top nav overlay */}
        <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-6 py-5">
          <button
            onClick={goBack}
            className="text-white hover:text-white/80 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div />
          <Button
            asChild
            size="sm"
            className="bg-white/20 backdrop-blur-sm text-white border border-white/30 hover:bg-white/30 rounded-full px-6"
          >
            <Link to="/auth" state={{ mode: "signup" }}>
              Get Started
            </Link>
          </Button>
        </div>

        {/* Background image with overlay */}
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="Beauty professionals at work"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-24 md:py-32">
          <div className="max-w-2xl">
            <p className="text-xs md:text-sm font-semibold tracking-[0.2em] uppercase text-amber-300 mb-5">
              For Beauty Professionals
            </p>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-playfair font-bold text-white leading-tight mb-6">
              Get clients from your work
            </h1>
            <p className="text-lg md:text-xl text-white/80 mb-10 leading-relaxed max-w-lg">
              Showcase your styles, get discovered by new clients, and take
              bookings seamlessly — all in one platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                asChild
                size="lg"
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white border-0 px-8 py-6 text-base font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all"
              >
                <Link to="/auth" state={{ mode: "signup" }}>
                  Join Now
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-white/40 text-white bg-transparent hover:bg-white/10 hover:text-white px-8 py-6 text-base rounded-lg backdrop-blur-sm"
              >
                <Link to="/auth" state={{ mode: "signup" }}>
                  List Your Business
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Value Proposition Grid */}
      <section className="py-24 px-6 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-playfair font-bold text-foreground text-center mb-4">
              Turn your work into bookings
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <Card
                key={index}
                className="group border border-border/50 bg-card hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-default"
              >
                <CardContent className="p-8 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-100 to-amber-50 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                    <benefit.icon className="w-7 h-7 text-amber-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-3">
                    {benefit.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {benefit.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Inspiration to Booking */}
      <section className="py-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-50 via-white to-amber-50" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-300 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-300 to-transparent" />
        <div className="relative max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-playfair font-bold text-foreground text-center mb-6">
            From inspiration to booking in one step
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed mb-8 max-w-2xl mx-auto">
            Clients see the look, understand the price, and book instantly —
            without back-and-forth.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 max-w-4xl mx-auto mt-12">
            {[
              "Clear pricing",
              "Real-time availability",
              "Seamless booking experience",
            ].map((item, i) => (
              <div
                key={item}
                className="flex flex-col items-center text-center"
              >
                <span className="font-playfair text-3xl md:text-4xl font-bold text-amber-600 mb-3">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="w-10 h-px bg-amber-300 mb-4" />
                <p className="text-foreground text-base font-medium">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial Carousel */}
      <section className="py-24 px-6 bg-background">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-playfair font-bold text-foreground text-center mb-16">
            Hear From Our Professionals
          </h2>
          <div className="relative">
            <div className="bg-card border border-border/50 rounded-2xl p-10 md:p-14 text-center shadow-sm">
              <div className="flex justify-center gap-1 mb-6">
                {Array.from({
                  length: testimonials[currentTestimonial].rating,
                }).map((_, i) => (
                  <Star
                    key={i}
                    className="w-5 h-5 text-amber-500 fill-amber-500"
                  />
                ))}
              </div>
              <p className="text-xl md:text-2xl text-foreground font-playfair italic leading-relaxed mb-8">
                "{testimonials[currentTestimonial].quote}"
              </p>
              <p className="font-semibold text-foreground">
                {testimonials[currentTestimonial].name}
              </p>
              <p className="text-muted-foreground text-sm">
                {testimonials[currentTestimonial].role}
              </p>
            </div>
            <div className="flex justify-center gap-3 mt-8">
              <Button
                variant="outline"
                size="icon"
                className="rounded-full w-10 h-10"
                onClick={() =>
                  setCurrentTestimonial(
                    (prev) =>
                      (prev - 1 + testimonials.length) % testimonials.length,
                  )
                }
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    i === currentTestimonial ? "bg-amber-500 w-8" : "bg-border"
                  }`}
                  onClick={() => setCurrentTestimonial(i)}
                />
              ))}
              <Button
                variant="outline"
                size="icon"
                className="rounded-full w-10 h-10"
                onClick={() =>
                  setCurrentTestimonial(
                    (prev) => (prev + 1) % testimonials.length,
                  )
                }
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Get Started Steps */}
      <section className="py-24 px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-playfair font-bold text-foreground text-center mb-4">
            Get Started in Minutes
          </h2>
          <p className="text-muted-foreground text-center mb-16 text-lg">
            Four simple steps to grow your business.
          </p>

          {/* Progress bar */}
          <div className="hidden md:block max-w-3xl mx-auto mb-16">
            <div className="h-1 rounded-full bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 opacity-60" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="text-center group">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-100 to-amber-50 flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-2xl font-bold text-amber-600">
                    {index + 1}
                  </span>
                </div>
                <h3 className="font-semibold text-foreground mb-2">
                  {step.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Detail Section */}
      <section className="py-24 px-6 bg-background">
        <div className="max-w-7xl mx-auto space-y-24">
          {/* Feature 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h3 className="text-3xl font-playfair font-bold text-foreground mb-6">
                Seamless Client Experience
              </h3>
              <p className="text-muted-foreground text-lg leading-relaxed mb-6">
                From discovery to booking to review — every touchpoint is
                designed to delight your clients and keep them coming back.
              </p>
              <ul className="space-y-3">
                {[
                  "One-tap booking",
                  "Automated reminders",
                  "Secure payments",
                  "Post-visit reviews",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-3 text-foreground"
                  >
                    <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                      <div className="w-2 h-2 rounded-full bg-amber-500" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <div className="rounded-2xl overflow-hidden aspect-[4/3]">
                <img
                  src={clientExperienceImg}
                  alt="Seamless client experience"
                  className="w-full h-full object-cover"
                  loading="lazy"
                  width={640}
                  height={512}
                />
              </div>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1 relative">
              <div className="rounded-2xl overflow-hidden aspect-[4/3]">
                <img
                  src={dashboardGrowthImg}
                  alt="Dashboard designed for growth"
                  className="w-full h-full object-cover"
                  loading="lazy"
                  width={640}
                  height={512}
                />
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <h3 className="text-3xl font-playfair font-bold text-foreground mb-6">
                Dashboard Designed for Growth
              </h3>
              <p className="text-muted-foreground text-lg leading-relaxed mb-6">
                Track performance, manage your team, and unlock insights — all
                from one beautifully crafted dashboard.
              </p>
              <ul className="space-y-3">
                {[
                  "Real-time analytics",
                  "Team management",
                  "Revenue tracking",
                  "Client insights",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-3 text-foreground"
                  >
                    <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                      <div className="w-2 h-2 rounded-full bg-amber-500" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Ecosystem Section (cream background retained) */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{ backgroundColor: "hsl(45, 60%, 94%)" }}
        />
        <div className="relative max-w-6xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-playfair font-bold text-foreground mb-4 text-center">
            More than just bookings
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-16">
            Unlock a world of opportunities across the BelloNecta ecosystem —
            coming soon.
          </p>
          <Carousel
            opts={{ align: "start", loop: true }}
            plugins={[Autoplay({ delay: 3000, stopOnInteraction: false })]}
            className="w-full max-w-5xl mx-auto"
          >
            <CarouselContent className="-ml-4">
              {[
                {
                  title: "Marketplace",
                  description: "Sell products through your content",
                },
                {
                  title: "Community",
                  description:
                    "Connect with other professionals and new clients",
                },
                {
                  title: "Education",
                  description: "Grow your skills and business",
                },
                {
                  title: "Innovation",
                  description: "Future tools powered by AI and VR",
                },
              ].map((item, index) => (
                <CarouselItem
                  key={index}
                  className="pl-4 basis-full sm:basis-1/2 lg:basis-1/3"
                >
                  <Card className="border border-border/50 bg-card h-full">
                    <CardContent className="p-8 text-center">
                      <h3 className="text-lg font-semibold text-foreground mb-2 text-center">
                        {item.title}
                      </h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {item.description}
                      </p>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex -left-12" />
            <CarouselNext className="hidden md:flex -right-12" />
          </Carousel>
        </div>
      </section>

      {/* CTA Strip (muted background retained) */}
      <section className="py-24 px-6 bg-muted/30">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-playfair font-bold text-foreground mb-6 leading-tight text-center">
            Start growing your beauty business today
          </h2>
          <p className="text-muted-foreground text-lg mb-10 max-w-2xl mx-auto">
            Join now and be part of the next generation of beauty professionals
          </p>
          <Button
            asChild
            size="lg"
            className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-10 py-6 text-lg font-semibold rounded-lg shadow-xl hover:shadow-2xl transition-all"
          >
            <Link to="/auth" state={{ mode: "signup" }}>
              Join BelloNecta Now
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-6 bg-foreground text-background">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div>
              <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-background/60">
                Platform
              </h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    to="/about"
                    className="text-background/70 hover:text-background transition-colors"
                  >
                    About
                  </Link>
                </li>
                <li>
                  <Link
                    to="/directory"
                    className="text-background/70 hover:text-background transition-colors"
                  >
                    Directory
                  </Link>
                </li>
                <li>
                  <Link
                    to="/impact"
                    className="text-background/70 hover:text-background transition-colors"
                  >
                    Impact
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-background/60">
                Support
              </h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    to="/help"
                    className="text-background/70 hover:text-background transition-colors"
                  >
                    Help Centre
                  </Link>
                </li>
                <li>
                  <Link
                    to="/help"
                    className="text-background/70 hover:text-background transition-colors"
                  >
                    Contact Us
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-background/60">
                Legal
              </h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    to="/terms"
                    className="text-background/70 hover:text-background transition-colors"
                  >
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link
                    to="/privacy"
                    className="text-background/70 hover:text-background transition-colors"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    to="/refund"
                    className="text-background/70 hover:text-background transition-colors"
                  >
                    Refund Policy
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-background/60">
                Resources
              </h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    to="/policies"
                    className="text-background/70 hover:text-background transition-colors"
                  >
                    Policies Hub
                  </Link>
                </li>
                <li>
                  <Link
                    to="/beta"
                    className="text-background/70 hover:text-background transition-colors"
                  >
                    Beta Program
                  </Link>
                </li>
                <li>
                  <Link
                    to="/bello-partnership"
                    className="text-background/70 hover:text-background transition-colors"
                  >
                    Partnership
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-background/10 pt-8 text-center">
            <p className="text-background/50 text-sm">
              © 2026 BelloNecta. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ListYourBusiness;
