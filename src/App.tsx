import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "./contexts/AuthContext";
import { AppShell } from "./components/AppShell";
import { MainLayout } from "./components/MainLayout";
import { OrganizationStructuredData } from "./components/StructuredData";
import { ScrollToTop } from "./components/ScrollToTop";
import { RouteShell } from "./components/RouteShell";
import { PageTransition } from "./components/PageTransition";
import { ContentPlaceholder } from "./components/ContentPlaceholder";
import { CustomerBookingGuard } from "./components/CustomerBookingGuard";

// Lazy load pages for code splitting
const Directory = lazy(() => import("./pages/Directory"));
const CreateTestAccounts = lazy(() => import("./pages/CreateTestAccounts"));
const AdminPanel = lazy(() => import("./pages/AdminPanel"));
const AdminSetup = lazy(() => import("./pages/AdminSetup"));
const ProfessionalProfile = lazy(() => import("./pages/ProfessionalProfile"));
const Booking = lazy(() => import("./pages/Booking"));
const BookingDateTime = lazy(() => import("./pages/BookingDateTime"));
const BookingPayment = lazy(() => import("./pages/BookingPayment"));
const BookingSuccess = lazy(() => import("./pages/BookingSuccess"));
const Cart = lazy(() => import("./pages/Cart"));
const CartItemBooking = lazy(() => import("./pages/CartItemBooking"));

const Auth = lazy(() => import("./pages/Auth"));
const ProfileCompletion = lazy(() => import("./pages/ProfileCompletion"));
const Account = lazy(() => import("./pages/Account"));
const About = lazy(() => import("./pages/About"));
const Help = lazy(() => import("./pages/Help"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Refund = lazy(() => import("./pages/Refund"));
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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh
      gcTime: 30 * 60 * 1000, // 30 minutes - cache retention
      refetchOnWindowFocus: false,
      retry: 1,
      networkMode: 'offlineFirst', // Better offline support
      refetchOnMount: false, // Don't refetch on component mount if data is fresh
    },
    mutations: {
      retry: 1,
      onSuccess: () => {
        // Invalidate relevant queries on mutation success
        queryClient.invalidateQueries({ queryKey: ['user-stats'] });
      },
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <OrganizationStructuredData />
          <BrowserRouter>
            <ScrollToTop />
            <Routes>
              {/* Auth route - standalone without layout */}
              <Route path="/auth" element={<RouteShell><Auth /></RouteShell>} />

              {/* Profile completion route - standalone without layout */}
              <Route path="/profile-completion" element={<RouteShell><ProfileCompletion /></RouteShell>} />

              {/* Admin panel route - full page */}
              <Route
                path="/admin"
                element={
                  <RouteShell>
                    <div className="min-h-screen w-full bg-background">
                      <AdminPanel />
                    </div>
                  </RouteShell>
                }
              />

              {/* Admin setup route - standalone */}
              <Route path="/admin-setup" element={<RouteShell><AdminSetup /></RouteShell>} />

              <Route path="/" element={<Navigate to="/explore-styles" replace />} />

              {/* Main app routes — AppShell keeps header mounted; MainLayout handles nav chrome */}
              <Route element={<AppShell />}>
                <Route element={<MainLayout />}>
                  <Route path="/account" element={<Account />} />
                  <Route path="/directory" element={<Directory />} />
                  <Route path="/professional/:id" element={<ProfessionalProfile />} />
                  <Route path="/profile/:id" element={<ProfessionalProfile />} />
                  <Route path="/booking/:id" element={<CustomerBookingGuard><Booking /></CustomerBookingGuard>} />
                  <Route path="/booking/:id/datetime" element={<CustomerBookingGuard><BookingDateTime /></CustomerBookingGuard>} />
                  <Route path="/booking/:id/payment" element={<CustomerBookingGuard><BookingPayment /></CustomerBookingGuard>} />
                  <Route path="/cart" element={<CustomerBookingGuard><Cart /></CustomerBookingGuard>} />
                  <Route path="/cart/book/:cartItemId" element={<CustomerBookingGuard><CartItemBooking /></CustomerBookingGuard>} />
                  <Route path="/create-test-accounts" element={<CreateTestAccounts />} />
                  <Route path="/explore-styles" element={<ExploreStyles />} />
                  <Route path="/explore-styles/:id" element={<StyleDetail />} />
                  <Route path="/impact" element={<Impact />} />
                  <Route path="/bello-partnership" element={<BelloPartnership />} />
                  <Route path="/bellomart" element={<BelloMart />} />
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Route>

              <Route path="/booking/success" element={<RouteShell><BookingSuccess /></RouteShell>} />

              {/* Footer link pages */}
              <Route path="/about" element={<RouteShell><About /></RouteShell>} />
              <Route path="/help" element={<RouteShell><Help /></RouteShell>} />
              <Route path="/policies" element={<RouteShell><PoliciesHub /></RouteShell>} />
              <Route path="/terms" element={<RouteShell><Terms /></RouteShell>} />
              <Route path="/privacy" element={<RouteShell><Privacy /></RouteShell>} />
              <Route path="/refund" element={<RouteShell><Refund /></RouteShell>} />
              <Route path="/policy" element={<RouteShell><Policy /></RouteShell>} />
              <Route path="/list-your-business" element={<RouteShell><ListYourBusiness /></RouteShell>} />
              <Route path="/beta" element={<RouteShell><Beta /></RouteShell>} />
              <Route path="/more" element={<RouteShell><More /></RouteShell>} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
