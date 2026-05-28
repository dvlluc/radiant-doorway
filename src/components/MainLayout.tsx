import { Suspense } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { ContentPlaceholder } from "./ContentPlaceholder";
import { PageTransition } from "./PageTransition";

const ROUTES_WITHOUT_SIDEBAR = ["/create-test-accounts"];

export function MainLayout() {
  const { pathname } = useLocation();
  const showSidebar = !ROUTES_WITHOUT_SIDEBAR.includes(pathname);

  return (
    <div className="min-h-screen w-full bg-background overflow-x-hidden">
      <Header />
      <div className="flex pt-14 md:pt-[74px]">
        {showSidebar && <Sidebar />}
        <main
          className={`${showSidebar ? "flex-1 md:ml-64" : "flex-1"} p-4 md:p-8 pb-20 md:pb-8 overflow-x-hidden max-w-full`}
        >
          <Suspense fallback={<ContentPlaceholder />}>
            <PageTransition>
              <Outlet />
            </PageTransition>
          </Suspense>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
