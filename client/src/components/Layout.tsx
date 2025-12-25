import React from "react";
import { Link, useLocation } from "wouter";
import { useSociety } from "@/context/SocietyContext";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, Users, ShieldCheck, Banknote, 
  TrendingUp, LogOut, Home, ChevronRight, FileText,
  Info, Briefcase, ShieldAlert, Phone, UserCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@assets/generated_images/swapnodinga_logo.png";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { currentUser, logout } = useSociety();
  const [location] = useLocation();

  // If on login/landing page, render children directly but keep global styles
  if (location === "/") {
    return <div className="min-h-screen bg-background">{children}</div>;
  }

  const menuLinks = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/members", label: "Manage Members", icon: Users },
    { href: "/admin/payments", label: "Verify Payments", icon: ShieldCheck },
    { href: "/admin/reports", label: "Reports", icon: FileText },
    { href: "/admin/deposits", label: "Fixed Deposits", icon: Banknote },
    { href: "/admin/interest", label: "Interest Records", icon: TrendingUp },
  ];

  const infoLinks = [
    { href: "/about", label: "About Us", icon: Info },
    { href: "/project", label: "Our Project", icon: Briefcase },
    { href: "/policy", label: "Policy", icon: ShieldAlert },
    { href: "/contact", label: "Contact", icon: Phone },
  ];

  return (
    <div className="flex h-screen bg-background overflow-hidden font-sans">
      {/* SIDEBAR - Vibrant Green */}
      <aside className="hidden md:flex flex-col w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border shadow-2xl">
        <div className="p-6 flex items-center gap-3 border-b border-sidebar-border/40">
          <div className="bg-white p-1.5 rounded-full shadow-md">
            <img src={logo} alt="Logo" className="w-8 h-8 object-contain" />
          </div>
          <span className="font-serif font-bold text-xl tracking-tight text-white">Swapnodinga</span>
        </div>
        
        <div className="flex-1 overflow-y-auto py-8">
          <nav className="px-4 space-y-8">
            {/* MENU SECTION */}
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold mb-4 px-3">Menu</p>
              <div className="space-y-1">
                {menuLinks.map((link) => (
                  <Link key={link.href} href={link.href}>
                    <a className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] transition-all group",
                      location === link.href 
                        ? "bg-sidebar-accent text-white font-medium shadow-sm" 
                        : "text-white/60 hover:bg-sidebar-accent/50 hover:text-white"
                    )}>
                      <link.icon size={18} className={cn(
                        location === link.href ? "text-sidebar-primary" : "text-white/30 group-hover:text-white"
                      )} />
                      <span className={cn(location === link.href ? "underline decoration-2 underline-offset-4" : "")}>
                        {link.label}
                      </span>
                    </a>
                  </Link>
                ))}
              </div>
            </div>

            {/* ACCOUNT SECTION */}
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold mb-4 px-3">Account</p>
              <Link href="/profile">
                <a className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] transition-all group",
                  location === "/profile" ? "bg-sidebar-accent text-white font-medium" : "text-white/60 hover:bg-sidebar-accent/50 hover:text-white"
                )}>
                  <UserCircle size={18} className="text-white/30 group-hover:text-white" />
                  <span>Profile & Support</span>
                </a>
              </Link>
            </div>

            {/* INFORMATION SECTION */}
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold mb-4 px-3">Information</p>
              <div className="space-y-1">
                {infoLinks.map((link) => (
                  <Link key={link.href} href={link.href}>
                    <a className="flex items-center gap-3 px-3 py-2.5 text-white/60 hover:text-white transition-all text-[14px] group">
                      <link.icon size={18} className="text-white/20 group-hover:text-white" />
                      <span>{link.label}</span>
                    </a>
                  </Link>
                ))}
              </div>
            </div>
          </nav>
        </div>

        {/* LOGOUT */}
        <div className="p-6 border-t border-sidebar-border/40">
          <Button 
            variant="ghost" 
            className="w-full justify-start text-rose-400 hover:text-rose-100 hover:bg-rose-950/30 gap-3 font-semibold transition-all" 
            onClick={logout}
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </Button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50/50">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-8">
          <nav className="flex items-center text-[13px] text-slate-400">
            <Home size={14} className="mr-2" />
            <Link href="/" className="hover:text-primary">Home</Link>
            {location.split('/').filter(Boolean).map((part, i) => (
              <React.Fragment key={i}>
                <ChevronRight size={12} className="mx-2 opacity-30" />
                <span className="capitalize font-medium text-slate-900">{part.replace(/-/g, ' ')}</span>
              </React.Fragment>
            ))}
          </nav>
        </header>

        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}