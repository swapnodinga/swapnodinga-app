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
import SocietyTreasury from "@/pages/SocietyTreasury";
import AdminMembers from "@/pages/AdminMembers";
import ReportsPage from "@/pages/ReportsPage";
import ProfilePage from "@/pages/ProfilePage";
import AboutPage from "@/pages/AboutPage";
import ProjectPage from "@/pages/ProjectPage";
import PolicyPage from "@/pages/PolicyPage";
import ContactPage from "@/pages/ContactPage";
import MemberPayments from "@/pages/MemberPayments";

function Router() {
  const { currentUser, isLoading } = useSociety();

  // Prevents flashing of wrong content while session loads
  if (isLoading) return null; 

  return (
    <Layout>
      <Switch>
        {/* Public Route */}
        <Route path="/" component={LandingPage} />
        
        {/* Common Authenticated Routes */}
        <Route path="/profile">
          {currentUser ? <ProfilePage /> : <Redirect to="/" />}
        </Route>

        {/* ADMIN ONLY ROUTES
            If is_admin is false, redirect to Member Dashboard 
        */}
        <Route path="/admin">
          {currentUser?.is_admin ? <AdminDashboard /> : <Redirect to="/dashboard" />}
        </Route>
        <Route path="/admin/payments">
          {currentUser?.is_admin ? <AdminPayments /> : <Redirect to="/dashboard" />}
        </Route>
        <Route path="/admin/deposits">
          {currentUser?.is_admin ? <FixedDepositPage /> : <Redirect to="/dashboard" />}
        </Route>
        <Route path="/admin/interest">
          {currentUser?.is_admin ? <SocietyTreasury /> : <Redirect to="/dashboard" />}
        </Route>
        <Route path="/admin/reports">
          {currentUser?.is_admin ? <ReportsPage /> : <Redirect to="/dashboard" />}
        </Route>
        <Route path="/admin/members">
          {currentUser?.is_admin ? <AdminMembers /> : <Redirect to="/dashboard" />}
        </Route>

        {/* MEMBER DASHBOARD */}
        
        <Route path="/dashboard">
          {currentUser ? <MemberDashboard /> : <Redirect to="/" />}
        </Route>

        {/* FIXED: Added route for My Payments */}
        <Route path="/dashboard/contributions">
          {currentUser ? <MemberPayments /> : <Redirect to="/" />}
        </Route>

        {/* Information & Static Content */}
        <Route path="/about" component={AboutPage} />
        <Route path="/project" component={ProjectPage} />
        <Route path="/policy" component={PolicyPage} />
        <Route path="/contact" component={ContactPage} />
        
        {/* 404 Fallback */}
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

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