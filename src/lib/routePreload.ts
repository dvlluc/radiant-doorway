/** Предзагрузка lazy-чанков */
const preloaders: Record<string, () => Promise<unknown>> = {
  "/": () => import("@/pages/Home"),
  "/directory": () => import("@/pages/Directory"),
  "/explore-styles": () => import("@/pages/ExploreStyles"),
  "/bellomart": () => import("@/pages/BelloMart"),
  "/account": () => import("@/pages/Account"),
  "/professional": () => import("@/pages/ProfessionalProfile"),
};

const preloaded = new Set<string>();

export function preloadRoute(path: string) {
  const base = path.split("?")[0];
  const loader =
    preloaders[base] ??
    (base.startsWith("/professional/") || base.startsWith("/profile/")
      ? preloaders["/professional"]
      : undefined);

  if (!loader || preloaded.has(base)) return;
  preloaded.add(base);
  void loader();
}

export function preloadAllMainRoutes() {
  Object.keys(preloaders).forEach(preloadRoute);
}
