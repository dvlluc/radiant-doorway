import { Suspense } from "react";
import { useOutlet } from "react-router-dom";

import { RouteContentFallback } from "@/components/RouteContentFallback";
import { cn } from "@/lib/utils";

interface RouteTransitionShellProps {
  /** Полноэкранные страницы без layout */
  fullPage?: boolean;
}

/**
 * Suspense только для lazy-страниц. Без key и без opacity-анимации —
 * иначе при каждом переходе снова suspend и «мигает» весь main.
 */
export function RouteTransitionShell({ fullPage = false }: RouteTransitionShellProps) {
  const outlet = useOutlet();

  return (
    <div
      className={cn(
        "relative w-full",
        fullPage ? "min-h-screen" : "min-h-[calc(100dvh-7.5rem)]",
      )}
    >
      <Suspense fallback={<RouteContentFallback compact={!fullPage} />}>{outlet}</Suspense>
    </div>
  );
}
