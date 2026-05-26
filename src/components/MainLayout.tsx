import { memo, Suspense } from "react";
import { Outlet } from "react-router-dom";

import { BottomNav } from "./BottomNav";
import { Header } from "./Header";
import { RouteContentFallback } from "./RouteContentFallback";
import { Sidebar } from "./Sidebar";
import { usePreloadMainRoutes } from "@/hooks/usePreloadMainRoutes";

interface MainLayoutProps {
  showSidebar?: boolean;
}

function MainLayoutInner({ showSidebar = true }: MainLayoutProps) {
  usePreloadMainRoutes();

  return (
    <div className="app-shell">
      <Header />
      <div className="flex pt-14 md:pt-[74px]">
        {showSidebar && <Sidebar />}
        <main
          className={`${showSidebar ? "flex-1 md:ml-64" : "flex-1"} p-4 md:p-8 pb-20 md:pb-8 overflow-x-hidden max-w-full`}
        >
          <div className="relative min-h-[calc(100dvh-7.5rem)] w-full">
            <Suspense fallback={<RouteContentFallback compact />}>
              <Outlet />
            </Suspense>
          </div>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}

/** Стабильный layout: Header/Sidebar не в Suspense и не remount при смене дочернего route */
export const MainLayout = memo(MainLayoutInner);

export function MainLayoutRoute() {
  return <MainLayout showSidebar />;
}

export function MainLayoutCompactRoute() {
  return <MainLayout showSidebar={false} />;
}
