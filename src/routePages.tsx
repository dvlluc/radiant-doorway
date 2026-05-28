import { lazy, type ComponentType, type LazyExoticComponent } from "react";
import type { RoutePageId } from "./routes.config";

const Directory = lazy(() => import("./pages/Directory"));
const CreateTestAccounts = lazy(() => import("./pages/CreateTestAccounts"));
const AdminPanel = lazy(() => import("./pages/AdminPanel"));
const AdminSetup = lazy(() => import("./pages/AdminSetup"));
const ProfessionalProfile = lazy(() => import("./pages/ProfessionalProfile"));
const Booking = lazy(() => import("./pages/Booking"));
const BookingDateTime = lazy(() => import("./pages/BookingDateTime"));
const BookingPayment = lazy(() => import("./pages/BookingPayment"));
const BookingSuccess = lazy(() => import("./pages/BookingSuccess"));
const Auth = lazy(() => import("./pages/Auth"));
const ProfileCompletion = lazy(() => import("./pages/ProfileCompletion"));
const Account = lazy(() => import("./pages/Account"));
const About = lazy(() => import("./pages/About"));
const Help = lazy(() => import("./pages/Help"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Refund = lazy(() => import("./pages/Refund"));
const Community = lazy(() => import("./pages/Community"));
const Policy = lazy(() => import("./pages/Policy"));
const PoliciesHub = lazy(() => import("./pages/PoliciesHub"));
const Impact = lazy(() => import("./pages/Impact"));
const BelloPartnership = lazy(() => import("./pages/BelloPartnership"));
const Beta = lazy(() => import("./pages/Beta"));
const ListYourBusiness = lazy(() => import("./pages/ListYourBusiness"));
const ExploreStyles = lazy(() => import("./pages/ExploreStyles"));
const StyleDetail = lazy(() => import("./pages/StyleDetail"));
const BelloMart = lazy(() => import("./pages/BelloMart"));
const More = lazy(() => import("./pages/More"));
const NotFound = lazy(() => import("./pages/NotFound"));

export const routePages: Record<
  RoutePageId,
  LazyExoticComponent<ComponentType<object>>
> = {
  directory: Directory,
  createTestAccounts: CreateTestAccounts,
  adminPanel: AdminPanel,
  adminSetup: AdminSetup,
  professionalProfile: ProfessionalProfile,
  booking: Booking,
  bookingDateTime: BookingDateTime,
  bookingPayment: BookingPayment,
  bookingSuccess: BookingSuccess,
  auth: Auth,
  profileCompletion: ProfileCompletion,
  account: Account,
  about: About,
  help: Help,
  terms: Terms,
  privacy: Privacy,
  refund: Refund,
  community: Community,
  policy: Policy,
  policiesHub: PoliciesHub,
  impact: Impact,
  belloPartnership: BelloPartnership,
  beta: Beta,
  listYourBusiness: ListYourBusiness,
  exploreStyles: ExploreStyles,
  styleDetail: StyleDetail,
  belloMart: BelloMart,
  more: More,
  notFound: NotFound,
};
