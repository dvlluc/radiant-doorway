import { Suspense } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { ContentPlaceholder } from "./ContentPlaceholder";
import { PageTransition } from "./PageTransition";
import { cn } from "@/lib/utils";

const ROUTES_WITHOUT_SIDEBAR = ["/create-test-accounts", "/account"];

export function MainLayout() {
  const { pathname } = useLocation();
  const showSidebar = !ROUTES_WITHOUT_SIDEBAR.includes(pathname);
  const hideBottomNav = pathname === "/account";

  return (
    <>
      <div className="flex pt-14 md:pt-[74px]">
        {showSidebar && <Sidebar />}
        <main
          className={cn(
            "flex-1 overflow-x-hidden max-w-full",
            "min-h-[calc(100dvh-7rem)] md:min-h-[calc(100dvh-4.625rem)]",
            "p-4 md:p-8 pb-20 md:pb-8",
            showSidebar && "md:ml-64",
          )}
        >
          <Suspense fallback={<ContentPlaceholder />}>
            <PageTransition>
              <Outlet />
            </PageTransition>
          </Suspense>
        </main>
      </div>
      <BottomNav className={hideBottomNav ? "max-md:hidden" : undefined} />
    </>
  );
}
