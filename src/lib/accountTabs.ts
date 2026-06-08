export type MenuSection =
  | "Home"
  | "Overview"
  | "Personal Information"
  | "Brand Information"
  | "Business Information"
  | "Charity Information"
  | "Account Settings"
  | "Notifications"
  | "My Bookings"
  | "Bookings"
  | "Purchases & Subscriptions"
  | "Business Management"
  | "Followers"
  | "Team Member";

export type AccountTab =
  | "overview"
  | "personal-information"
  | "brand-information"
  | "business-information"
  | "charity-information"
  | "settings"
  | "notifications"
  | "bookings"
  | "business-bookings"
  | "subscriptions"
  | "business-management"
  | "followers"
  | "team-member";

const TAB_TO_SECTION: Record<AccountTab, MenuSection> = {
  overview: "Overview",
  "personal-information": "Personal Information",
  "brand-information": "Brand Information",
  "business-information": "Business Information",
  "charity-information": "Charity Information",
  settings: "Account Settings",
  notifications: "Notifications",
  bookings: "My Bookings",
  "business-bookings": "Bookings",
  subscriptions: "Purchases & Subscriptions",
  "business-management": "Business Management",
  followers: "Followers",
  "team-member": "Team Member",
};

const SECTION_TO_TAB: Partial<Record<MenuSection, AccountTab>> = Object.fromEntries(
  Object.entries(TAB_TO_SECTION).map(([tab, section]) => [section, tab]),
) as Partial<Record<MenuSection, AccountTab>>;

export function tabToSection(tab: string): MenuSection | null {
  return TAB_TO_SECTION[tab.toLowerCase() as AccountTab] ?? null;
}

export function sectionToTab(section: MenuSection): AccountTab | null {
  return SECTION_TO_TAB[section] ?? null;
}

export function accountTabPath(tab: AccountTab, search?: string): string {
  const params = new URLSearchParams(search ?? window.location.search);
  params.set("tab", tab);
  return `/account?${params.toString()}`;
}
