"use client"
import React, { useEffect, useState } from "react";
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

// Logo import
import logo from "@assets/generated_images/SwapnoDinga_Logo_Update.png";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { currentUser, logout } = useSociety();
  const [location, setLocation] = useLocation();
  const isMobile = useMobile();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const publicPaths = ["/", "/about", "/project", "/policy", "/contact", "/reset-password"];

  useEffect(() => {
    if (!currentUser && !publicPaths.includes(location)) {
      setLocation("/");
    }
  }, [currentUser, location, setLocation]);

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
    <div className="flex flex-col h-full">
      <div className="p-6 flex items-center gap-4 border-b border-white/10">
        <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center overflow-hidden shadow-xl shrink-0">
          <img src={logo} alt="Logo" className="w-full h-full object-contain scale-150 transform translate-y-[-2px]" />
        </div>
        <span className="font-serif font-bold text-xl text-white">Swapnodinga</span>
      </div>
      
      <div className="flex-1 overflow-y-auto py-8 px-4">
        <div className="space-y-8">
          {currentUser && (
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold mb-4 px-3">
                {currentUser?.is_admin ? "Admin Menu" : "Member Menu"}
              </p>
              <nav className="space-y-1">
                {(currentUser?.is_admin ? adminLinks : memberLinks).map((link) => (
                  <Link key={link.href} href={link.href}>
                    <a className={cn("flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] transition-all group",
                      location === link.href ? "bg-emerald-800 text-white" : "text-white/60 hover:bg-emerald-800/50 hover:text-white"
                    )}>
                      <link.icon size={18} />
                      <span>{link.label}</span>
                    </a>
                  </Link>
                ))}
              </nav>
            </div>
          )}

          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold mb-4 px-3">Information</p>
            <nav className="space-y-1">
              {infoLinks.map((link) => (
                <Link key={link.href} href={link.href}>
                  <a className={cn("flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] transition-all group",
                    location === link.href ? "bg-emerald-800 text-white" : "text-white/60 hover:bg-emerald-800/50 hover:text-white"
                  )}>
                    <link.icon size={18} />
                    <span>{link.label}</span>
                  </a>
                </Link>
              ))}
            </nav>
          </div>

          {currentUser && (
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold mb-4 px-3">Account</p>
              <nav className="space-y-1">
                <Link href="/profile">
                  <a className={cn("flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] transition-all group",
                    location === "/profile" ? "bg-emerald-800 text-white" : "text-white/60 hover:bg-emerald-800/50 hover:text-white"
                  )}>
                    <UserCircle size={18} />
                    <span>Profile & Support</span>
                  </a>
                </Link>
              </nav>
            </div>
          )}
        </div>
      </div>

      {currentUser && (
        <div className="p-6 border-t border-white/10">
          <Button variant="ghost" className="w-full justify-start text-rose-400 gap-3 hover:bg-rose-900/20" onClick={logout}>
            <LogOut size={18} />
            <span>Sign Out</span>
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden relative">
      <aside className="hidden md:flex flex-col w-64 bg-[#1a4d3c] text-white border-r border-emerald-900/20 shadow-2xl shrink-0">
        <SidebarContent />
      </aside>

      {isMobile && isSidebarOpen && (
        <>
          <aside className="fixed inset-y-0 left-0 z-50 w-72 bg-[#1a4d3c] text-white animate-in slide-in-from-left duration-300">
            <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(false)} className="absolute top-4 right-4 text-white">
              <X size={24} />
            </Button>
            <SidebarContent />
          </aside>
          <div className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
        </>
      )}

      <div className="flex-1 flex flex-col min-w-0 bg-slate-50/50">
        <header className="h-16 bg-white border-b flex items-center px-4 md:px-8 justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            {isMobile && <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(true)}><Menu size={24} /></Button>}
            <nav className="flex items-center text-[13px] text-slate-400">
              <Home size={14} className="mr-2" />
              <Link href={currentUser ? (currentUser.is_admin ? "/admin" : "/dashboard") : "/"}>
                <a className="hover:text-emerald-700">{currentUser ? (currentUser.is_admin ? "Admin" : "Home") : "Society"}</a>
              </Link>
              {location.split('/').filter(Boolean).map((part, i) => (part !== 'admin' && part !== 'dashboard') && (
                <React.Fragment key={i}>
                  <ChevronRight size={12} className="mx-2 opacity-30" />
                  <span className="capitalize font-medium text-slate-900 truncate max-w-[100px] md:max-w-none">{part.replace(/-/g, ' ')}</span>
                </React.Fragment>
              ))}
            </nav>
          </div>
          {currentUser && (
            <div className="flex items-center gap-2">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-slate-900 leading-none">{currentUser.full_name}</p>
                <p className="text-[10px] text-slate-400 uppercase tracking-tighter">{currentUser.is_admin ? "Admin" : "Member"}</p>
              </div>
              <div className="w-8 h-8 rounded-full overflow-hidden border bg-slate-100 shrink-0">
                <img src={currentUser.profile_pic || "https://via.placeholder.com/150"} alt="User" className="w-full h-full object-cover" />
              </div>
            </div>
          )}
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}