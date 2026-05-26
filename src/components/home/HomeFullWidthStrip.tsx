import { cn } from "@/lib/utils";

interface HomeFullWidthStripProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  variant?: "light" | "muted" | "dark";
  id?: string;
}

export function HomeFullWidthStrip({
  title,
  subtitle,
  children,
  variant = "light",
  id,
}: HomeFullWidthStripProps) {
  return (
    <section
      id={id}
      className={cn(
        "home-full-strip scroll-mt-28 w-full border-y border-border/50 py-12 md:py-16",
        variant === "light" && "bg-card",
        variant === "muted" && "bg-muted/50",
        variant === "dark" && "bg-foreground text-primary-foreground",
      )}
    >
      <div className="w-full px-4 md:px-8">
        <h2
          className={cn(
            "w-full text-center font-playfair text-3xl font-semibold tracking-tight md:text-5xl lg:text-[3.25rem]",
            variant === "dark" ? "text-primary-foreground" : "text-foreground",
          )}
        >
          {title}
        </h2>
        {subtitle ? (
          <p
            className={cn(
              "mx-auto mt-4 max-w-2xl w-full text-center text-sm md:text-base",
              variant === "dark" ? "text-primary-foreground/75" : "text-muted-foreground",
            )}
          >
            {subtitle}
          </p>
        ) : null}
        <div className="mt-10 w-full md:mt-12">{children}</div>
      </div>
    </section>
  );
}
