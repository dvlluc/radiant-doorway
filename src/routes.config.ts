/** Идентификаторы lazy-страниц (ключ в routePages) */
export type RoutePageId =
  | "directory"
  | "createTestAccounts"
  | "adminPanel"
  | "adminSetup"
  | "professionalProfile"
  | "booking"
  | "bookingDateTime"
  | "bookingPayment"
  | "bookingSuccess"
  | "auth"
  | "profileCompletion"
  | "account"
  | "about"
  | "help"
  | "terms"
  | "privacy"
  | "refund"
  | "community"
  | "policy"
  | "policiesHub"
  | "impact"
  | "belloPartnership"
  | "beta"
  | "listYourBusiness"
  | "exploreStyles"
  | "styleDetail"
  | "belloMart"
  | "more"
  | "notFound";

/** Оболочка маршрута — определяет layout, не страницу */
export type RouteLayoutId =
  | "standalone"
  | "adminShell"
  | "accountShell"
  | "main"
  | "mainCompact";

export const ROUTE_PATHS = {
  create: "/create",
  directory: "/directory",
  auth: "/auth",
  profileCompletion: "/profile-completion",
  admin: "/admin",
  adminSetup: "/admin-setup",
  account: "/account",
  bookingSuccess: "/booking/success",
  about: "/about",
  help: "/help",
  policies: "/policies",
  terms: "/terms",
  privacy: "/privacy",
  refund: "/refund",
  community: "/community",
  policy: "/policy",
  listYourBusiness: "/list-your-business",
  beta: "/beta",
  more: "/more",
  professional: "/professional/:id",
  profile: "/profile/:id",
  booking: "/booking/:id",
  bookingDateTime: "/booking/:id/datetime",
  bookingPayment: "/booking/:id/payment",
  exploreStyles: "/explore-styles",
  styleDetail: "/explore-styles/:id",
  impact: "/impact",
  belloPartnership: "/bello-partnership",
  belloMart: "/bellomart",
  createTestAccounts: "/create-test-accounts",
} as const;

/** Устаревшие URL → актуальная точка входа */
export const LEGACY_REDIRECTS: ReadonlyArray<{ from: string; to: string }> = [
  { from: "/", to: ROUTE_PATHS.directory },
  { from: ROUTE_PATHS.create, to: ROUTE_PATHS.directory },
];

export type RouteDefinition =
  | { kind: "page"; path: string; page: RoutePageId }
  | { kind: "redirect"; path: string; to: string }
  | { kind: "notFound" };

export interface RouteGroupConfig {
  layout: RouteLayoutId;
  routes: RouteDefinition[];
}

export const routeGroups: RouteGroupConfig[] = [
  {
    layout: "standalone",
    routes: [
      { kind: "page", path: ROUTE_PATHS.auth, page: "auth" },
      { kind: "page", path: ROUTE_PATHS.profileCompletion, page: "profileCompletion" },
      { kind: "page", path: ROUTE_PATHS.bookingSuccess, page: "bookingSuccess" },
      { kind: "page", path: ROUTE_PATHS.about, page: "about" },
      { kind: "page", path: ROUTE_PATHS.help, page: "help" },
      { kind: "page", path: ROUTE_PATHS.policies, page: "policiesHub" },
      { kind: "page", path: ROUTE_PATHS.terms, page: "terms" },
      { kind: "page", path: ROUTE_PATHS.privacy, page: "privacy" },
      { kind: "page", path: ROUTE_PATHS.refund, page: "refund" },
      { kind: "page", path: ROUTE_PATHS.community, page: "community" },
      { kind: "page", path: ROUTE_PATHS.policy, page: "policy" },
      { kind: "page", path: ROUTE_PATHS.listYourBusiness, page: "listYourBusiness" },
      { kind: "page", path: ROUTE_PATHS.beta, page: "beta" },
      { kind: "page", path: ROUTE_PATHS.more, page: "more" },
      { kind: "page", path: ROUTE_PATHS.adminSetup, page: "adminSetup" },
    ],
  },
  {
    layout: "adminShell",
    routes: [{ kind: "page", path: ROUTE_PATHS.admin, page: "adminPanel" }],
  },
  {
    layout: "accountShell",
    routes: [{ kind: "page", path: ROUTE_PATHS.account, page: "account" }],
  },
  {
    layout: "main",
    routes: [
      ...LEGACY_REDIRECTS.map(
        (r): RouteDefinition => ({ kind: "redirect", path: r.from, to: r.to }),
      ),
      { kind: "page", path: ROUTE_PATHS.directory, page: "directory" },
      { kind: "page", path: ROUTE_PATHS.professional, page: "professionalProfile" },
      { kind: "page", path: ROUTE_PATHS.profile, page: "professionalProfile" },
      { kind: "page", path: ROUTE_PATHS.booking, page: "booking" },
      { kind: "page", path: ROUTE_PATHS.bookingDateTime, page: "bookingDateTime" },
      { kind: "page", path: ROUTE_PATHS.bookingPayment, page: "bookingPayment" },
      { kind: "page", path: ROUTE_PATHS.exploreStyles, page: "exploreStyles" },
      { kind: "page", path: ROUTE_PATHS.styleDetail, page: "styleDetail" },
      { kind: "page", path: ROUTE_PATHS.impact, page: "impact" },
      { kind: "page", path: ROUTE_PATHS.belloPartnership, page: "belloPartnership" },
      { kind: "page", path: ROUTE_PATHS.belloMart, page: "belloMart" },
      { kind: "notFound" },
    ],
  },
  {
    layout: "mainCompact",
    routes: [{ kind: "page", path: ROUTE_PATHS.createTestAccounts, page: "createTestAccounts" }],
  },
];
