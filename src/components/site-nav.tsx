import { Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

export function SiteNav() {
  const { user, signOut } = useAuth();
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link to="/" className="font-serif text-2xl tracking-tight">
          Maison Noir
        </Link>
        <nav className="hidden items-center gap-8 text-sm md:flex">
          <Link to="/services" className="hover:opacity-60" activeProps={{ className: "underline underline-offset-4" }}>Services</Link>
          <Link to="/products" className="hover:opacity-60" activeProps={{ className: "underline underline-offset-4" }}>Shop</Link>
          <Link to="/book" className="hover:opacity-60" activeProps={{ className: "underline underline-offset-4" }}>Book</Link>
          {user && (
            <Link to="/account" className="hover:opacity-60" activeProps={{ className: "underline underline-offset-4" }}>Account</Link>
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
