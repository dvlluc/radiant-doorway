import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

/** Subtle fade-in when the route changes */
export function PageTransition({ children, className }: PageTransitionProps) {
  const { pathname } = useLocation();

  return (
    <div
      key={pathname}
      className={cn(
        "animate-in fade-in duration-300 fill-mode-both",
        className,
      )}
    >
      {children}
    </div>
  );
}
