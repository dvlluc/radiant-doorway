import { NavLink, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";
import { Users, Sparkles, ShoppingBag, Bell, ChevronDown } from "lucide-react";
import { useSidebarCollapse } from "@/components/sidebar-collapse";

const navItems = [
  { icon: Sparkles, label: "Explore Styles", path: "/explore-styles" },
  { icon: Users, label: "Professionals", path: "/directory" },
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

const navLabelClass = "font-medium text-[15px] truncate min-w-0 flex-1";

export function Sidebar() {
  const { user } = useAuth();
  const { hasUnread } = useNotifications(user?.id);
  const navigate = useNavigate();
  const { collapsed } = useSidebarCollapse();

  const navItemClass = (isActive: boolean) =>
    cn(
      "flex items-center rounded-lg transition-colors min-w-0",
      "justify-left gap-4 px-3 py-3",
      "hover:bg-muted/50",
      isActive && "text-primary"
    );

  return (
    <aside
      className={cn(
        "hidden md:flex fixed left-0 top-26 h-[calc(100vh-4rem)] bg-background flex-col border-r border-border transition-[width] duration-200",
        collapsed ? "w-[4.5rem]" : "w-64"
      )}
    >
      <nav className="flex-1 px-2 pt-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            title={collapsed ? item.label : undefined}
            className={({ isActive }) => navItemClass(isActive)}
          >
            {({ isActive }) => (
              <>
                <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center flex-shrink-0">
                  <item.icon className={cn("w-4 h-4", isActive ? "text-[hsl(43,90%,55%)]" : "text-white")} />
                </div>
                {!collapsed && <span className={navLabelClass}>{item.label}</span>}
              </>
            )}
          </NavLink>
        ))}

        {user && (
          <button
            onClick={() =>
              navigate("/account", { state: { activeSection: "Notifications" } })
            }
            title={collapsed ? "Notifications" : undefined}
            className={cn(
              navItemClass(false),
              "w-full text-left relative"
            )}
          >
            <div className="relative w-8 h-8 rounded-full bg-black flex items-center justify-center flex-shrink-0">
              <Bell className="w-4 h-4 text-white" />
              {hasUnread && collapsed && (
                <span className="absolute top-0 right-0 w-2 h-2 bg-destructive rounded-full border border-background" />
              )}
            </div>
            {!collapsed && <span className={navLabelClass}>Notifications</span>}
            {hasUnread && !collapsed && (
              <span className="absolute top-[15px] left-[145px] w-2 h-2 bg-destructive rounded-full border border-background" />
            )}
          </button>
        )}

        <NavLink
          to="/impact"
          title={collapsed ? "Impact" : undefined}
          className={({ isActive }) => navItemClass(isActive)}
        >
          {({ isActive }) => (
            <>
              <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center flex-shrink-0">
                <ChevronDown className={cn("w-4 h-4", isActive ? "text-[hsl(43,90%,55%)]" : "text-white")} />
              </div>
              {!collapsed && <span className={navLabelClass}>Impact</span>}
            </>
          )}
        </NavLink>
      </nav>
      
      {!collapsed && (
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
          <p className="mt-2 text-[10px] tracking-wide text-foreground/35 font-light truncate">@ Caributi Organics LLC</p>
        </div>
      )}
    </aside>
  );
}
