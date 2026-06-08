import { User, Leaf, ShoppingBag, ChevronRight, Settings, HelpCircle, FileText, ArrowLeft, LogOut, Bell, Calendar, CreditCard, Briefcase, Megaphone, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useUserProfile } from "@/hooks/useUserProfile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BottomNav } from "@/components/BottomNav";
import { SEO } from "@/components/SEO";

const More = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: profile } = useUserProfile(user?.id);

  const accountItems = [
    {
      icon: Home,
      label: "Account Overview",
      description: "View your account dashboard",
      onClick: () => navigate("/account?tab=overview"),
    },
    {
      icon: User,
      label: "My Profile",
      description: "View and edit your profile",
      onClick: () => user ? navigate(`/professional/${user.id}`) : navigate("/auth", { state: { mode: "signin" } }),
    },
    {
      icon: Bell,
      label: "Notifications",
      description: "View your notifications",
      onClick: () => navigate("/account?tab=notifications"),
    },
    {
      icon: Calendar,
      label: "Bookings",
      description: "Manage your appointments",
      onClick: () => navigate("/account?tab=business-bookings"),
    },
  ];

  const businessItems = [
    {
      icon: CreditCard,
      label: "Purchases & Subscriptions",
      description: "Manage payments and plans",
      onClick: () => navigate("/account?tab=subscriptions"),
    },
    {
      icon: Briefcase,
      label: "Business Management",
      description: "Manage your business settings",
      onClick: () => navigate("/account?tab=business-management"),
    },
  ];

  const moreItems = [
    {
      icon: Leaf,
      label: "Impact",
      description: "See our social impact initiatives",
      onClick: () => navigate("/impact"),
    },
    {
      icon: ShoppingBag,
      label: "BelloMart",
      description: "Register interest for marketplace",
      onClick: () => navigate("/bellomart"),
    },
    {
      icon: Settings,
      label: "Account Settings",
      description: "Manage your account preferences",
      onClick: () => navigate("/account?tab=settings"),
    },
    {
      icon: HelpCircle,
      label: "Help & Support",
      description: "Get help or send feedback",
      onClick: () => navigate("/help"),
    },
    {
      icon: FileText,
      label: "Policies",
      description: "Terms, privacy & refund policies",
      onClick: () => navigate("/policies"),
    },
  ];

  const MenuSection = ({ title, items }: { title: string; items: typeof accountItems }) => (
    <div className="space-y-2">
      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">{title}</h2>
      <div className="rounded-xl border border-border bg-card overflow-hidden divide-y divide-border">
        {items.map((item) => (
          <button
            key={item.label}
            onClick={item.onClick}
            className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-accent/5 transition-colors"
          >
            <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
              <item.icon className="w-4.5 h-4.5 text-foreground" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-foreground">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.description}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-20 pt-14 md:pt-0">
      <SEO title="More | BelloNecta" description="Access your profile, settings, and more" />
      
      {/* Mobile header */}
      <div className="sticky top-14 md:top-0 z-40 bg-background border-b border-border px-4 py-3 flex items-center gap-3 md:hidden">
        <button onClick={() => navigate(-1)} className="p-1">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-lg font-semibold text-foreground">More</h1>
      </div>

      {/* Profile card */}
      <div className="px-4 pt-4 pb-2">
        <button
          onClick={() => user ? navigate(`/professional/${user.id}`) : navigate("/auth", { state: { mode: "signin" } })}
          className="w-full flex items-center gap-3 p-4 rounded-xl bg-card border border-border hover:bg-accent/5 transition-colors"
        >
          <Avatar className="w-12 h-12">
            <AvatarImage src={profile?.avatar_url} />
            <AvatarFallback className="bg-primary text-primary-foreground text-lg">
              {(profile?.display_name || user?.email || "U")?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 text-left">
            <p className="font-semibold text-foreground">
              {profile?.display_name || user?.email || "Sign in"}
            </p>
            <p className="text-sm text-muted-foreground">
              {user ? "View your profile" : "Sign in to access all features"}
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      {/* Menu sections */}
      <div className="px-4 pt-2 space-y-5">
        <MenuSection title="Account" items={accountItems} />
        <MenuSection title="Business" items={businessItems} />
        <MenuSection title="More" items={moreItems} />

        {/* Logout button */}
        {user && (
          <div className="mt-4">
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                navigate("/explore-styles");
              }}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border border-destructive/20 bg-card hover:bg-destructive/5 transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                <LogOut className="w-4.5 h-4.5 text-destructive" />
              </div>
              <p className="text-sm font-medium text-destructive">Log Out</p>
            </button>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default More;
