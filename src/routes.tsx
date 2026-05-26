import type { ReactElement } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Header } from "@/components/Header";
import { MainLayoutRoute, MainLayoutCompactRoute } from "@/components/MainLayout";
import { RouteTransitionShell } from "@/components/RouteTransitionShell";
import { routePages } from "./routePages";
import {
  routeGroups,
  type RouteDefinition,
  type RouteGroupConfig,
  type RouteLayoutId,
} from "./routes.config";

const layoutShells: Record<RouteLayoutId, ReactElement> = {
  standalone: <RouteTransitionShell fullPage />,
  adminShell: <RouteTransitionShell fullPage />,
  accountShell: <RouteTransitionShell fullPage />,
  main: <MainLayoutRoute />,
  mainCompact: <MainLayoutCompactRoute />,
};

function renderRouteElement(
  layout: RouteLayoutId,
  route: RouteDefinition,
): ReactElement {
  if (route.kind === "redirect") {
    return <Navigate to={route.to} replace />;
  }

  if (route.kind === "notFound") {
    const Page = routePages.notFound;
    return <Page />;
  }

  const Page = routePages[route.page];

  switch (layout) {
    case "adminShell":
      return (
        <div className="min-h-screen w-full bg-background">
          <Page />
        </div>
      );
    case "accountShell":
      return (
        <div className="min-h-screen w-full bg-background">
          <Header />
          <main className="px-2 pt-[104px] pb-4 sm:px-4 md:px-8 md:pt-[118px] md:pb-8 overflow-x-hidden">
            <Page />
          </main>
        </div>
      );
    default:
      return <Page />;
  }
}

function renderRoute(layout: RouteLayoutId, route: RouteDefinition, index: number) {
  if (route.kind === "notFound") {
    return <Route key="not-found" path="*" element={renderRouteElement(layout, route)} />;
  }

  return (
    <Route
      key={`${route.path}-${index}`}
      path={route.path}
      element={renderRouteElement(layout, route)}
    />
  );
}

function renderRouteGroup({ layout, routes }: RouteGroupConfig) {
  return (
    <Route key={layout} element={layoutShells[layout]}>
      {routes.map((route, index) => renderRoute(layout, route, index))}
    </Route>
  );
}

export function AppRoutes() {
  return <Routes>{routeGroups.map(renderRouteGroup)}</Routes>;
}
