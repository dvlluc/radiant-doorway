import { Users, Sparkles, ShoppingBag, ChevronDown, Menu, X } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { useState } from "react";

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
    { label: "Community", path: "/terms?tab=community" },
    { label: "Refund", path: "/terms?tab=refund" },
    { label: "Beta", path: "/beta" }
  ]
];

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="md:hidden text-white hover:bg-white/10"
        >
          <Menu className="w-6 h-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0 bg-background">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <span className="text-lg font-semibold">Menu</span>
            <SheetClose asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <X className="w-5 h-5" />
              </Button>
            </SheetClose>
          </div>
          
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-4 px-4 py-3 rounded-lg transition-colors",
                    "hover:bg-muted/70",
                    isActive && "text-foreground font-semibold bg-muted shadow-sm"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-medium">{item.label}</span>
                  </>
                )}
              </NavLink>
            ))}
            
            <NavLink
              to="/impact"
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-4 px-4 py-3 rounded-lg transition-colors",
                  "hover:bg-muted/70",
                  isActive && "text-foreground font-semibold bg-muted shadow-sm"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center flex-shrink-0">
                    <ChevronDown className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-medium">Impact</span>
                </>
              )}
            </NavLink>
            
          </nav>
          
          <div className="p-4 space-y-2 text-xs text-muted-foreground border-t border-border">
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              {footerLinks[0].map((link) => (
                <NavLink 
                  key={link.label} 
                  to={link.path} 
                  onClick={() => setOpen(false)}
                  className="hover:underline whitespace-nowrap"
                >
                  {link.label}
                </NavLink>
              ))}
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              {footerLinks[1].map((link) => (
                <NavLink 
                  key={link.label} 
                  to={link.path}
                  onClick={() => setOpen(false)} 
                  className="hover:underline whitespace-nowrap"
                >
                  {link.label}
                </NavLink>
              ))}
            </div>
            <p className="mt-2">@ Caributi Organics LLC</p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
