import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export function SiteNav() {
  const { user, signOut } = useAuth();
  const { data: profile } = useQuery({
    queryKey: ["profile-nav", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("account_type").eq("id", user!.id).maybeSingle();
      return data;
    },
  });
  const isBusiness = profile?.account_type === "business";
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link to="/" className="font-serif text-2xl tracking-tight">
          Maison Noir
        </Link>
        <nav className="hidden items-center gap-8 text-sm md:flex">
          <Link to="/services" className="hover:opacity-60" activeProps={{ className: "underline underline-offset-4" }}>Services</Link>
          <Link to="/products" className="hover:opacity-60" activeProps={{ className: "underline underline-offset-4" }}>Shop</Link>
          {!isBusiness && (
            <Link to="/book" className="hover:opacity-60" activeProps={{ className: "underline underline-offset-4" }}>Book</Link>
          )}
          {user && !isBusiness && (
            <Link to="/account" className="hover:opacity-60" activeProps={{ className: "underline underline-offset-4" }}>Account</Link>
          )}
          {user && isBusiness && (
            <Link to="/business" className="hover:opacity-60" activeProps={{ className: "underline underline-offset-4" }}>Dashboard</Link>
          )}
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
            <Button variant="outline" size="sm" onClick={() => signOut()}>Sign out</Button>
          ) : (
            <>
              <Link to="/login"><Button variant="ghost" size="sm">Log in</Button></Link>
              <Link to="/signup"><Button size="sm">Sign up</Button></Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-12 md:flex-row md:items-center md:justify-between">
        <div className="font-serif text-xl">Maison Noir</div>
        <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} Maison Noir. All rights reserved.</p>
      </div>
    </footer>
  );
}
