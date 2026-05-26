import { useEffect } from "react";

import { preloadAllMainRoutes } from "@/lib/routePreload";

/** Предзагрузка основных чанков после первого кадра — меньше Suspense при навигации */
export function usePreloadMainRoutes() {
  useEffect(() => {
    const run = () => preloadAllMainRoutes();
    if ("requestIdleCallback" in window) {
      const id = requestIdleCallback(run, { timeout: 2500 });
      return () => cancelIdleCallback(id);
    }
    const t = window.setTimeout(run, 400);
    return () => clearTimeout(t);
  }, []);
}
