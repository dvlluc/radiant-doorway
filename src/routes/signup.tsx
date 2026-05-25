import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/signup")({
  component: SignupPage,
  head: () => ({ meta: [{ title: "Sign up — Maison Noir" }] }),
});

function SignupPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [accountType, setAccountType] = useState<"individual" | "business">("individual");
  const [fullName, setFullName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: "/account" });
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (accountType === "business" && !businessName.trim()) {
      return toast.error("Business name is required.");
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          account_type: accountType,
          business_name: accountType === "business" ? businessName : null,
        },
        emailRedirectTo: window.location.origin + "/account",
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Check your email to confirm your account.");
  };

  const handleGoogle = async () => {
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/account" });
    if (result.error) toast.error(result.error.message);
  };

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div className="hidden bg-foreground md:block">
        <div className="flex h-full items-end p-12">
          <Link to="/" className="font-serif text-5xl text-background">Maison Noir</Link>
        </div>
      </div>
      <div className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <Link to="/" className="font-serif text-2xl md:hidden">Maison Noir</Link>
          <h1 className="mt-6 font-serif text-4xl">Create account</h1>
          <p className="mt-2 text-sm text-muted-foreground">Choose how you want to use Maison Noir.</p>

          <div className="mt-6 grid grid-cols-2 gap-2">
            {(["individual", "business"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setAccountType(t)}
                className={cn(
                  "border px-4 py-3 text-left text-sm transition",
                  accountType === t
                    ? "border-foreground bg-foreground text-background"
                    : "border-border hover:border-foreground"
                )}
              >
                <div className="font-medium capitalize">{t}</div>
                <div className="mt-1 text-xs opacity-70">
                  {t === "individual" ? "Book treatments" : "Offer services"}
                </div>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="name">Your name</Label>
              <Input id="name" required value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1" />
            </div>
            {accountType === "business" && (
              <div>
                <Label htmlFor="biz">Business name</Label>
                <Input id="biz" required value={businessName} onChange={(e) => setBusinessName(e.target.value)} className="mt-1" />
              </div>
            )}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1" />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>{loading ? "Creating…" : "Create account"}</Button>
          </form>

          <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-widest text-muted-foreground">
            <div className="h-px flex-1 bg-border" />or<div className="h-px flex-1 bg-border" />
          </div>

          <Button variant="outline" className="w-full" onClick={handleGoogle}>Continue with Google</Button>
          <p className="mt-3 text-center text-xs text-muted-foreground">Google sign-in creates an individual account.</p>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Already have an account? <Link to="/login" className="underline underline-offset-4 text-foreground">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
