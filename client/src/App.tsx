import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SocietyProvider } from "@/context/SocietyContext";

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

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={LandingPage} />
        <Route path="/profile" component={ProfilePage} />
        
        {/* Admin Dashboard & Management */}
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/admin/payments" component={AdminPayments} />
        <Route path="/admin/deposits" component={FixedDepositPage} />
        <Route path="/admin/interest" component={SocietyTreasury} />
        <Route path="/admin/reports" component={ReportsPage} />
        <Route path="/admin/members" component={AdminMembers} />
        
        {/* Member View */}
        <Route path="/dashboard" component={MemberDashboard} />
        <Route path="/about" component={AboutPage} />
        <Route path="/project" component={ProjectPage} />
        <Route path="/policy" component={PolicyPage} />
        <Route path="/contact" component={ContactPage} />
        
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
