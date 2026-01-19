import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SocietyProvider, useSociety } from "@/context/SocietyContext";

// Components & Pages
import Layout from "@/components/Layout"; 
import LandingPage from "@/pages/LandingPage";
import AdminDashboard from "@/pages/AdminDashboard";
import MemberDashboard from "@/pages/MemberDashboard";
import AdminPayments from "@/pages/AdminPayments";
import NotFound from "@/pages/not-found";
import FixedDepositPage from "@/pages/FixedDepositPage";
import InterestDistribution from "@/pages/InterestDistribution"; 
import AdminMembers from "@/pages/AdminMembers";
import ReportsPage from "@/pages/ReportsPage";
import ProfilePage from "@/pages/ProfilePage";
import AboutPage from "@/pages/AboutPage";
import ProjectPage from "@/pages/ProjectPage";
import PolicyPage from "@/pages/PolicyPage";
import ContactPage from "@/pages/ContactPage";
import MemberPayments from "@/pages/MemberPayments";
import AdminSettings from "@/pages/AdminSettings";
import ResetPassword from "@/pages/ResetPassword";

/**
 * Router component handles the conditional rendering of routes
 * based on the user's authentication status and role.
 */
function Router() {
  const { currentUser, isLoading } = useSociety();

  // Show nothing (or a global loader) while checking session
  if (isLoading) return null; 

  return (
    <Layout>
      <Switch>
        {/* ==========================================
            PUBLIC ROUTES
           ========================================== */}
        <Route path="/" component={LandingPage} />
        <Route path="/about" component={AboutPage} />
        <Route path="/project" component={ProjectPage} />
        <Route path="/policy" component={PolicyPage} />
        <Route path="/contact" component={ContactPage} />
        <Route path="/reset-password" component={ResetPassword} />
        
        {/* ==========================================
            COMMON AUTHENTICATED ROUTES
           ========================================== */}
        <Route path="/profile">
          {currentUser ? <ProfilePage /> : <Redirect to="/" />}
        </Route>

        {/* ==========================================
            ADMIN ROUTES
            Paths matched to Layout.tsx sidebar links
           ========================================== */}
        <Route path="/admin">
          {currentUser?.is_admin ? <AdminDashboard /> : <Redirect to="/dashboard" />}
        </Route>
        
        <Route path="/admin/members">
          {currentUser?.is_admin ? <AdminMembers /> : <Redirect to="/dashboard" />}
        </Route>
        
        <Route path="/admin/payments">
          {currentUser?.is_admin ? <AdminPayments /> : <Redirect to="/dashboard" />}
        </Route>

        <Route path="/admin/reports">
          {currentUser?.is_admin ? <ReportsPage /> : <Redirect to="/dashboard" />}
        </Route>

        <Route path="/admin/deposits">
          {currentUser?.is_admin ? <FixedDepositPage /> : <Redirect to="/dashboard" />}
        </Route>

        {/* Matches { href: "/admin/interest" } in your Layout.tsx */}
        <Route path="/admin/interest">
          {currentUser?.is_admin ? <InterestDistribution /> : <Redirect to="/dashboard" />}
        </Route>

        <Route path="/admin/settings">
          {currentUser?.is_admin ? <AdminSettings /> : <Redirect to="/dashboard" />}
        </Route>

        {/* ==========================================
            MEMBER ROUTES
           ========================================== */}
        <Route path="/dashboard">
          {currentUser ? (
            currentUser.is_admin ? <Redirect to="/admin" /> : <MemberDashboard />
          ) : (
            <Redirect to="/" />
          )}
        </Route>
        
        <Route path="/dashboard/contributions">
          {currentUser ? (
            currentUser.is_admin ? <Redirect to="/admin" /> : <MemberPayments />
          ) : (
            <Redirect to="/" />
          )}
        </Route>

        {/* ==========================================
            FALLBACK (404)
           ========================================== */}
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

/**
 * Main App component wrapping everything in necessary providers
 */
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SocietyProvider>
          <Toaster />
          <Router /> 
        </SocietyProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}