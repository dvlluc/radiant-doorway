import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { SidebarCollapseProvider } from "./sidebar-collapse";

/** Persistent chrome: header stays mounted across MainLayout child routes */
export function AppShell() {
  return (
    <SidebarCollapseProvider>
      <div className="min-h-screen w-full bg-background overflow-x-hidden">
        <Header />
        <Outlet />
      </div>
    </SidebarCollapseProvider>
  );
}
