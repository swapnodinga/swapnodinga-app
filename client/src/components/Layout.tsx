"use client"
import React, { useEffect, useState, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { useSociety } from "@/context/SocietyContext";
import { cn } from "@/lib/utils";
import { useMobile } from "@/hooks/use-mobile";
import { 
  LayoutDashboard, Users, ShieldCheck, LogOut, UserCircle,
  ChevronRight, Home, Info, Briefcase, ShieldAlert, Phone,
  FileText, PiggyBank, TrendingUp, CreditCard, Settings, Menu, X 
} from "lucide-react";
import { Button } from "@/components/ui/button";

// UPDATED LOGO IMPORT
import logo from "@assets/generated_images/SwapnoDinga_Logo_Update.png";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { currentUser, logout } = useSociety();
  const [location, setLocation] = useLocation();
  const isMobile = useMobile();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const publicPaths = useMemo(() => 
    ["/", "/about", "/project", "/policy", "/contact", "/reset-password"], 
  []);

  useEffect(() => {
    if (!currentUser && !publicPaths.includes(location)) {
      setLocation("/");
    }
  }, [currentUser, location, setLocation, publicPaths]);

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location]);

  if (location === "/") {
    return <div className="min-h-screen bg-background">{children}</div>;
  }

  const adminLinks = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/members", label: "Manage Members", icon: Users },
    { href: "/admin/payments", label: "Verify Payments", icon: ShieldCheck },
    { href: "/admin/reports", label: "Reports", icon: FileText },
    { href: "/admin/deposits", label: "Fixed Deposits", icon: PiggyBank },
    { href: "/admin/interest", label: "Interest Records", icon: TrendingUp },
    { href: "/admin/settings", label: "Site Settings", icon: Settings },
  ];

  const memberLinks = [
    { href: "/dashboard", label: "My Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/contributions", label: "My Payments", icon: CreditCard },
  ];

  const infoLinks = [
    { href: "/about", label: "About Us", icon: Info },
    { href: "/project", label: "Our Project", icon: Briefcase },
    { href: "/policy", label: "Policy", icon: ShieldAlert },
    { href: "/contact", label: "Contact", icon: Phone },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-[#1a4d3c] text-white">
      {/* Header / Logo */}
      <div className="p-6 flex items-center gap-4 border-b border-white/10 shrink-0">
        <div className="h-14 w-14 bg-white rounded-full flex items-center justify-center overflow-hidden shadow-xl shrink-0 border-2 border-emerald-500/20">
          <img 
            src={logo} 
            alt="Swapnodinga Logo" 
            className="w-full h-full object-contain scale-125 transition-transform hover:scale-150 duration-500" 
          />
        </div>
        <span className="font-serif font-bold text-xl tracking-tight text-white">
          Swapnodinga
        </span>
      </div>
      
      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-6 px-4 custom-scrollbar">
        <nav className="space-y-8">
          {currentUser && (
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold mb-4 px-3">
                {currentUser?.is_admin ? "Admin Menu" : "Member Menu"}
              </p>
              <div className="space-y-1">
                {(currentUser?.is_admin ? adminLinks : memberLinks).map((link) => (
                  <Link key={link.href} href={link.href}>
                    <a className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-[14px] transition-all duration-200 group",
                      location === link.href 
                        ? "bg-emerald-800 text-white shadow-inner" 
                        : "text-white/60 hover:bg-emerald-800/40 hover:text-white"
                    )}>
                      <link.icon size={18} className={cn(location === link.href ? "text-emerald-400" : "group-hover:text-white")} />
                      <span>{link.label}</span>
                    </a>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold mb-4 px-3">Information</p>
            <div className="space-y-1">
              {infoLinks.map((link) => (
                <Link key={link.href} href={link.href}>
                  <a className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-[14px] transition-all group",
                    location === link.href ? "bg-emerald-800 text-white" : "text-white/60 hover:bg-emerald-800/40 hover:text-white"
                  )}>
                    <link.icon size={18} />
                    <span>{link.label}</span>
                  </a>
                </Link>
              ))}
            </div>
          </div>
          
          {currentUser && (
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold mb-4 px-3">Account</p>
              <Link href="/profile">
                <a className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-[14px] transition-all group",
                  location === "/profile" ? "bg-emerald-800 text-white" : "text-white/60 hover:bg-emerald-800/40 hover:text-white"
                )}>
                  <UserCircle size={18} />
                  <span>Profile & Support</span>
                </a>
              </Link>
            </div>
          )}
        </nav>
      </div>

      {/* Logout Footer */}
      {currentUser && (
        <div className="p-4 border-t border-white/10 bg-[#154133]">
          <Button 
            variant="ghost" 
            className="w-full justify-start text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 gap-3" 
            onClick={logout}
          >
            <LogOut size={18} />
            <span className="font-semibold">Sign Out</span>
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden relative">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 shadow-2xl border-r border-emerald-900/10">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isMobile && isSidebarOpen && (
        <>
          <aside className="fixed inset-y-0 left-0 z-50 w-72 shadow-2xl animate-in slide-in-from-left duration-300">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsSidebarOpen(false)} 
              className="absolute top-4 right-4 text-white z-50 hover:bg-white/10"
              aria-label="Close menu"
            >
              <X size={24} />
            </Button>
            <SidebarContent />
          </aside>
          <div 
            className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsSidebarOpen(false)} 
          />
        </>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b flex items-center px-4 md:px-8 justify-between shrink-0 shadow-sm z-30">
          <div className="flex items-center gap-3 overflow-hidden">
            {isMobile && (
              <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(true)} className="shrink-0">
                <Menu size={24} />
              </Button>
            )}
            <nav className="flex items-center text-[13px] text-slate-400 truncate">
              <Home size={14} className="mr-2 shrink-0" />
              <Link href={currentUser ? (currentUser.is_admin ? "/admin" : "/dashboard") : "/"}>
                <a className="hover:text-emerald-700 transition-colors shrink-0">
                  {currentUser ? (currentUser.is_admin ? "Admin" : "Home") : "Society"}
                </a>
              </Link>
              {location.split('/').filter(Boolean).map((part, i) => {
                // Skip the root admin/dashboard parts to keep breadcrumbs clean
                if (part === 'admin' || part === 'dashboard') return null;
                return (
                  <React.Fragment key={i}>
                    <ChevronRight size={12} className="mx-2 opacity-30 shrink-0" />
                    <span className="capitalize font-medium text-slate-900 truncate">
                      {part.replace(/-/g, ' ')}
                    </span>
                  </React.Fragment>
                );
              })}
            </nav>
          </div>

          {currentUser && (
            <div className="flex items-center gap-3 pl-4">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-slate-900 leading-none mb-1">{currentUser.full_name}</p>
                <div className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 text-[9px] font-bold text-emerald-700 uppercase tracking-tighter border border-emerald-100">
                  {currentUser.is_admin ? "Admin" : "Member"}
                </div>
              </div>
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-emerald-100 bg-emerald-50 shrink-0 shadow-sm">
                <img 
                  src={currentUser.profile_pic || "https://api.dicebear.com/7.x/avataaars/svg?seed=" + currentUser.username} 
                  alt="Profile" 
                  className="w-full h-full object-cover" 
                />
              </div>
            </div>
          )}
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50/50">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}