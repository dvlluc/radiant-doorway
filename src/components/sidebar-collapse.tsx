import * as React from "react";

const STORAGE_KEY = "sidebar:collapsed";

export const ROUTES_WITHOUT_SIDEBAR = ["/create-test-accounts", "/account"];

export function shouldShowAppSidebar(pathname: string) {
  return !ROUTES_WITHOUT_SIDEBAR.includes(pathname);
}

type SidebarCollapseContextValue = {
  collapsed: boolean;
  toggle: () => void;
  setCollapsed: (value: boolean) => void;
};

const SidebarCollapseContext = React.createContext<SidebarCollapseContextValue | null>(null);

export function SidebarCollapseProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = React.useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(STORAGE_KEY) === "true";
  });

  const setCollapsedPersisted = React.useCallback((value: boolean) => {
    setCollapsed(value);
    localStorage.setItem(STORAGE_KEY, String(value));
  }, []);

  const toggle = React.useCallback(() => {
    setCollapsedPersisted(!collapsed);
  }, [collapsed, setCollapsedPersisted]);

  const value = React.useMemo(
    () => ({ collapsed, toggle, setCollapsed: setCollapsedPersisted }),
    [collapsed, toggle, setCollapsedPersisted],
  );

  return <SidebarCollapseContext.Provider value={value}>{children}</SidebarCollapseContext.Provider>;
}

export function useSidebarCollapseOptional() {
  return React.useContext(SidebarCollapseContext);
}

export function useSidebarCollapse() {
  const ctx = useSidebarCollapseOptional();
  if (!ctx) {
    throw new Error("useSidebarCollapse must be used within SidebarCollapseProvider");
  }
  return ctx;
}

/** Collapsed width matches Sidebar `w-[4.5rem]` */
export const SIDEBAR_WIDTH_COLLAPSED = "4.5rem";
export const SIDEBAR_WIDTH_EXPANDED = "16rem";

export function sidebarMainMarginClass(collapsed: boolean) {
  return collapsed ? "md:ml-[4.5rem]" : "md:ml-64";
}
