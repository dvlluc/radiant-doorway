import { ReactNode } from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";

interface MainLayoutProps {
  children: ReactNode;
  showSidebar?: boolean;
}

export function MainLayout({ children, showSidebar = true }: MainLayoutProps) {
  return (
    <div className="min-h-screen w-full bg-background overflow-x-hidden">
      <Header />
      <div className="flex pt-14 md:pt-[74px]">
        {showSidebar && <Sidebar />}
        <main className={`${showSidebar ? "flex-1 md:ml-64" : "flex-1"} p-4 md:p-8 pb-20 md:pb-8 overflow-x-hidden max-w-full`}>
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
