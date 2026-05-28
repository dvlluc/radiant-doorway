import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "./contexts/AuthContext";
import { Header } from "./components/Header";
import { MainLayout } from "./components/MainLayout";
import { OrganizationStructuredData } from "./components/StructuredData";
import { ScrollToTop } from "./components/ScrollToTop";

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

// Loading component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

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
            <Suspense fallback={<PageLoader />}>
              <Routes>
          {/* Auth route - standalone without layout */}
          <Route path="/auth" element={<Auth />} />
          
          {/* Profile completion route - standalone without layout */}
          <Route path="/profile-completion" element={<ProfileCompletion />} />
          
          {/* Admin panel route - full page */}
          <Route path="/admin" element={
            <div className="min-h-screen w-full bg-background">
              <AdminPanel />
            </div>
          } />
          
          {/* Admin setup route - standalone */}
          <Route path="/admin-setup" element={<AdminSetup />} />
          
          {/* Account route - full page without main sidebar */}
          <Route path="/account" element={
            <div className="min-h-screen w-full bg-background">
              <Header />
              <main className="px-2 pt-[104px] pb-4 sm:px-4 md:px-8 md:pt-[118px] md:pb-8 overflow-x-hidden">
                <Account />
              </main>
            </div>
          } />
          
          
          
          {/* Main app routes with layout */}
          <Route path="/" element={<Navigate to="/directory" replace />} />
          
          <Route path="/directory" element={
            <MainLayout><Directory /></MainLayout>
          } />
          <Route path="/professional/:id" element={
            <MainLayout><ProfessionalProfile /></MainLayout>
          } />
          <Route path="/profile/:id" element={
            <MainLayout><ProfessionalProfile /></MainLayout>
          } />
          <Route path="/booking/:id" element={
            <MainLayout><Booking /></MainLayout>
          } />
          <Route path="/booking/:id/datetime" element={
            <MainLayout><BookingDateTime /></MainLayout>
          } />
          <Route path="/booking/:id/payment" element={
            <MainLayout><BookingPayment /></MainLayout>
          } />
          <Route path="/booking/success" element={<BookingSuccess />} />
          
          <Route path="/create-test-accounts" element={
            <MainLayout showSidebar={false}><CreateTestAccounts /></MainLayout>
          } />
          
          {/* Explore Styles */}
          <Route path="/explore-styles" element={
            <MainLayout><ExploreStyles /></MainLayout>
          } />
          <Route path="/explore-styles/:id" element={
            <MainLayout><StyleDetail /></MainLayout>
          } />
          
          {/* Footer link pages */}
          <Route path="/about" element={<About />} />
          <Route path="/help" element={<Help />} />
          <Route path="/policies" element={<PoliciesHub />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/refund" element={<Refund />} />
          <Route path="/policy" element={<Policy />} />
          <Route path="/impact" element={
            <MainLayout><Impact /></MainLayout>
          } />
          <Route path="/bello-partnership" element={
            <MainLayout><BelloPartnership /></MainLayout>
          } />
          <Route path="/list-your-business" element={<ListYourBusiness />} />
          <Route path="/beta" element={<Beta />} />
          <Route path="/bellomart" element={
            <MainLayout><BelloMart /></MainLayout>
          } />
          <Route path="/more" element={<More />} />
          
          <Route path="*" element={
            <MainLayout><NotFound /></MainLayout>
          } />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
