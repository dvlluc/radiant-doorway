import { NavLink, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";
import { Users, Sparkles, ShoppingBag, Bell, ChevronDown } from "lucide-react";

const navItems = [
  { icon: Users, label: "Professionals", path: "/directory" },
  { icon: Sparkles, label: "Explore Styles", path: "/explore-styles" },
  { icon: ShoppingBag, label: "BelloMart", path: "/bellomart" },
];

const footerLinks = [
  [
    { label: "About", path: "/about" },
    { label: "Help", path: "/help" },
    { label: "Terms", path: "/terms?tab=terms" },
    { label: "Privacy", path: "/terms?tab=privacy" },
  ],
  [
    { label: "Cookies", path: "/terms?tab=cookies" },
    { label: "Refund", path: "/terms?tab=refund" },
    { label: "Beta", path: "/beta" }
  ]
];

export function Sidebar() {
  const { user } = useAuth();
  const { hasUnread } = useNotifications(user?.id);
  const navigate = useNavigate();

  return (
    <aside className="hidden md:flex fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-background flex-col border-r border-border">
      <nav className="flex-1 pt-6 px-2 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-4 px-3 py-3 rounded-lg transition-colors",
                "hover:bg-muted/50",
                isActive && "text-primary"
              )
            }
          >
            {({ isActive }) => (
              <>
                <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center flex-shrink-0">
                  <item.icon className={cn("w-4 h-4", isActive ? "text-[hsl(43,90%,55%)]" : "text-white")} />
                </div>
                <span className="font-medium text-[15px]">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}

        {user && (
          <button
            onClick={() =>
              navigate("/account", { state: { activeSection: "Notifications" } })
            }
            className={cn(
              "flex items-center gap-4 px-3 py-3 rounded-lg transition-colors w-full text-left",
              "hover:bg-muted/50 relative"
            )}
          >
            <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center flex-shrink-0">
              <Bell className="w-4 h-4 text-white" />
            </div>
            <span className="font-medium text-[15px]">Notifications</span>
            {hasUnread && (
              <span className="absolute top-[15px] left-[145px] w-2 h-2 bg-destructive rounded-full border border-background" />
            )}
          </button>
        )}

        <NavLink
          to="/impact"
          className={({ isActive }) =>
            cn(
              "flex items-center gap-4 px-3 py-3 rounded-lg transition-colors",
              "hover:bg-muted/50",
              isActive && "text-primary"
            )
          }
        >
          {({ isActive }) => (
            <>
              <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center flex-shrink-0">
                <ChevronDown className={cn("w-4 h-4", isActive ? "text-[hsl(43,90%,55%)]" : "text-white")} />
              </div>
              <span className="font-medium text-[15px]">Impact</span>
            </>
          )}
        </NavLink>
      </nav>
      
      <div className="px-6 pb-6 space-y-1">
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {footerLinks[0].map((link) => (
            <NavLink key={link.label} to={link.path} className="text-[12px] font-normal text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap">
              {link.label}
            </NavLink>
          ))}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {footerLinks[1].map((link) => (
            <NavLink key={link.label} to={link.path} className="text-[12px] font-normal text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap">
              {link.label}
            </NavLink>
          ))}
        </div>
        <p className="mt-2 text-[10px] tracking-wide text-foreground/35 font-light">@ Caributi Organics LLC</p>
      </div>
    </aside>
  );
}
