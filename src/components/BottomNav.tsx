import { Users, Sparkles, ShoppingBag, User, LogOut, MessageSquare, X, ChevronRight, Settings } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";

export function BottomNav() {
  const { user } = useAuth();
  const { data: profile } = useUserProfile(user?.id);
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);

  const navItems = [
    { icon: Users, label: "Pros", path: "/directory" },
    { icon: Sparkles, label: "Styles", path: "/explore-styles" },
    { icon: ShoppingBag, label: "Mart", path: "/bellomart" },
  ];

  const handleSignOut = async () => {
    setShowMenu(false);
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('supabase.auth')) {
        localStorage.removeItem(key);
      }
    });
    await supabase.auth.signOut({ scope: 'global' });
    navigate("/directory");
  };

  const accountType = profile?.account_type === 'charitable_partner' ? 'Charity Partner' :
    profile?.account_type === 'brand' ? 'Brand' :
    profile?.account_type === 'business' ? 'Business' : 'Individual';

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background border-t border-border">
        <div className="flex items-center justify-around h-14">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors",
                  isActive ? "text-accent" : "text-muted-foreground"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon className={cn("w-5 h-5", isActive ? "text-accent" : "text-muted-foreground")} />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}

          {/* My Profile button */}
          <button
            onClick={() => {
              if (!user) {
                navigate("/auth");
                return;
              }
              setShowMenu(true);
            }}
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 flex-1 h-14 transition-colors",
              showMenu ? "text-accent" : "text-muted-foreground"
            )}
          >
            <User className="w-5 h-5" />
            <span className="text-[10px] font-medium">My Profile</span>
          </button>
        </div>
        {/* Safe area for iOS */}
        <div className="h-[env(safe-area-inset-bottom)]" />
      </nav>

      {/* Full-screen profile menu */}
      {showMenu && user && (
        <div className="fixed inset-0 z-[60] md:hidden bg-background animate-in slide-in-from-bottom duration-300 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">My Profile</h2>
            <button onClick={() => setShowMenu(false)} className="p-2 rounded-full hover:bg-muted transition-colors">
              <X className="w-5 h-5 text-foreground" />
            </button>
          </div>

          {/* User info card */}
          <button
            onClick={() => { setShowMenu(false); navigate(`/professional/${user.id}`); }}
            className="mx-4 mt-4 p-4 rounded-xl border border-border bg-muted/30 flex items-center gap-3 text-left hover:bg-muted/50 transition-colors"
          >
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-12 h-12 rounded-full object-cover" />
              ) : (
                <User className="w-6 h-6 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-foreground">{profile?.display_name || 'User'}</p>
              <p className="text-sm text-muted-foreground">{accountType}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>

          {/* Menu items */}
          <div className="mt-4 mx-4 rounded-xl border border-border overflow-hidden">
            <button
              onClick={() => { setShowMenu(false); navigate("/account"); }}
              className="w-full flex items-center gap-3 px-4 py-4 hover:bg-muted/50 transition-colors border-b border-border"
            >
              <Settings className="w-5 h-5 text-foreground" />
              <span className="flex-1 text-left text-sm font-medium text-foreground">My Account</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>

            <button
              onClick={() => { setShowMenu(false); navigate("/help?tab=email"); }}
              className="w-full flex items-center gap-3 px-4 py-4 hover:bg-muted/50 transition-colors"
            >
              <MessageSquare className="w-5 h-5 text-foreground" />
              <span className="flex-1 text-left text-sm font-medium text-foreground">Feedback</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Sign out */}
          <div className="mt-4 mx-4 rounded-xl border border-border overflow-hidden">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-4 hover:bg-destructive/5 transition-colors"
            >
              <LogOut className="w-5 h-5 text-destructive" />
              <span className="flex-1 text-left text-sm font-medium text-destructive">Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
