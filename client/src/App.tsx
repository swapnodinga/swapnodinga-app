import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SocietyProvider } from "@/context/SocietyContext";

import LandingPage from "@/pages/LandingPage";
import AdminDashboard from "@/pages/AdminDashboard";
import MemberDashboard from "@/pages/MemberDashboard";
import AboutPage from "@/pages/AboutPage";
import ContactPage from "@/pages/ContactPage";
import ProjectPage from "@/pages/ProjectPage";
import PolicyPage from "@/pages/PolicyPage";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/members" component={AdminDashboard} /> {/* Reusing component for demo simplicity */}
      <Route path="/admin/reports" component={AdminDashboard} /> {/* Reusing component for demo simplicity */}
      
      <Route path="/dashboard" component={MemberDashboard} />
      <Route path="/dashboard/instalments" component={MemberDashboard} /> {/* Reusing component for demo simplicity */}
      
      <Route path="/about" component={AboutPage} />
      <Route path="/contact" component={ContactPage} />
      <Route path="/project" component={ProjectPage} />
      <Route path="/policy" component={PolicyPage} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
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

export default App;
