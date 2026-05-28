import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Users, Sparkles, ShoppingBag, ChevronDown } from "lucide-react";
import { preloadRoute } from "@/lib/routePreload";

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
    { label: "Community", path: "/terms?tab=community" },
    { label: "Refund", path: "/terms?tab=refund" },
    { label: "Beta", path: "/beta" }
  ]
];

export function Sidebar() {
  return (
    <aside className="hidden md:flex fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 flex-col border-r border-border/60 bg-background/80 shadow-[4px_0_24px_hsla(0,0%,0%,0.04)] backdrop-blur-xl">
      <nav className="flex-1 pt-6 px-2 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onMouseEnter={() => preloadRoute(item.path)}
            onFocus={() => preloadRoute(item.path)}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-4 px-3 py-3 rounded-xl transition-all duration-200",
                "hover:bg-muted hover:shadow-sm",
                isActive && "bg-muted font-semibold text-foreground shadow-sm"
              )
            }
          >
            {() => (
              <>
                <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-4 h-4 text-white" />
                </div>
                <span className="font-medium text-[15px]">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}

        <NavLink
          to="/impact"
          onMouseEnter={() => preloadRoute("/impact")}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-4 px-3 py-3 rounded-xl transition-all duration-200",
              "hover:bg-muted hover:shadow-sm",
              isActive && "bg-muted font-semibold text-foreground shadow-sm"
            )
          }
        >
          {() => (
            <>
              <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center flex-shrink-0">
                <ChevronDown className="w-4 h-4 text-white" />
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
