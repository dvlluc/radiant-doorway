import { ReactNode, Suspense } from "react";
import { ContentPlaceholder } from "./ContentPlaceholder";
import { PageTransition } from "./PageTransition";

/** Wrapper for standalone pages: lazy-load + fade */
export function RouteShell({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<ContentPlaceholder />}>
      <PageTransition>{children}</PageTransition>
    </Suspense>
  );
}
