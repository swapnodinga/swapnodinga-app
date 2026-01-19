"use client"
import React, { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useSociety } from "@/context/SocietyContext";
import { cn } from "@/lib/utils";
import { useMobile } from "@/hooks/use-mobile";
import { 
  LayoutDashboard, Users, ShieldCheck, LogOut, UserCircle,
  ChevronRight, Home, Info, Briefcase, ShieldAlert, Phone,
  CreditCard, Menu, X, LogIn
} from "lucide-react";
import { Button } from "@/components/ui/button";

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
      <div className="p-6 flex items-center gap-4 border-b border-white/10">
        <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center overflow-hidden shrink-0">
          <img src={logo} alt="Logo" className="w-full h-full object-contain scale-125" />
        </div>
        <span className="font-bold text-xl tracking-tight">Swapnodinga</span>
      </div>
      
      <div className="flex-1 overflow-y-auto py-6 px-4">
        <nav className="space-y-6">
          {currentUser && (
            <div>
              <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-3 px-3">
                {currentUser?.is_admin ? "Admin Menu" : "Member Menu"}
              </p>
              <div className="space-y-1">
                {(currentUser?.is_admin ? adminLinks : memberLinks).map((link) => (
                  <Link key={link.href} href={link.href}>
                    <a className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                      location === link.href ? "bg-emerald-800 text-white" : "text-white/60 hover:text-white hover:bg-white/5"
                    )}>
                      <link.icon size={18} />
                      <span>{link.label}</span>
                    </a>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-3 px-3">Information</p>
            <div className="space-y-1">
              {infoLinks.map((link) => (
                <Link key={link.href} href={link.href}>
                  <a className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                    location === link.href ? "bg-emerald-800 text-white font-medium" : "text-white/60 hover:text-white hover:bg-white/5"
                  )}>
                    <link.icon size={18} />
                    <span className={cn(location === link.href && "underline underline-offset-4")}>{link.label}</span>
                  </a>
                </Link>
              ))}
            </div>
          </div>

          {/* NEW ACCOUNT SECTION BASED ON YOUR IMAGE */}
          {currentUser && (
            <div className="pt-4">
              <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-3 px-3">Account</p>
              <Link href="/profile">
                <a className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors group",
                  location === "/profile" ? "bg-emerald-800 text-white" : "text-white/60 hover:text-white hover:bg-white/5"
                )}>
                  <div className="w-6 h-6 rounded-full overflow-hidden border border-white/20 shrink-0">
                    <img 
                      src={currentUser.profile_pic || "https://via.placeholder.com/150"} 
                      alt="User" 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <span className={cn("underline underline-offset-4 font-medium", location === "/profile" ? "text-white" : "text-white/80")}>
                    Profile & Support
                  </span>
                </a>
              </Link>
            </div>
          )}
        </nav>
      </div>

      {currentUser && (
        <div className="p-4 border-t border-white/10">
          <Button 
            variant="ghost" 
            className="w-full justify-start text-rose-400 gap-3 hover:bg-rose-950/30 hover:text-rose-300" 
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
    <div className="flex h-screen bg-background overflow-hidden relative">
      <aside className="hidden md:flex flex-col w-64 shrink-0 shadow-xl border-r">
        <SidebarContent />
      </aside>

      {isMobile && isSidebarOpen && (
        <>
          <aside className="fixed inset-y-0 left-0 z-50 w-72 shadow-2xl animate-in slide-in-from-left duration-300">
            <SidebarContent />
          </aside>
          <div className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
        </>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b flex items-center px-4 md:px-8 justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            {isMobile && (
              <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(true)}>
                <Menu size={24} />
              </Button>
            )}
            <nav className="flex items-center text-xs text-slate-400">
              <Home size={14} className="mr-2" />
              <Link href="/">
                <a className="hover:text-emerald-700">Society</a>
              </Link>
              {location.split('/').filter(Boolean).map((part, i) => (
                <React.Fragment key={i}>
                  <ChevronRight size={12} className="mx-2 opacity-30" />
                  <span className="capitalize font-medium text-slate-900">{part.replace(/-/g, ' ')}</span>
                </React.Fragment>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {currentUser ? (
              <div className="flex items-center gap-3 border-l pl-4 ml-2">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold text-slate-900 leading-none">{currentUser.full_name}</p>
                  <p className="text-[10px] text-slate-400 uppercase tracking-tighter">{currentUser.is_admin ? "Administrator" : "Member"}</p>
                </div>
                <div className="w-8 h-8 rounded-full overflow-hidden border bg-slate-100">
                  <img src={currentUser.profile_pic || "https://via.placeholder.com/150"} alt="User" className="w-full h-full object-cover" />
                </div>
              </div>
            ) : (
              <Link href="/">
                <Button variant="default" className="bg-[#1a4d3c] hover:bg-[#143b2e] gap-2 h-9">
                  <LogIn size={16} />
                  <span>Member Login</span>
                </Button>
              </Link>
            )}
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50/30">{children}</main>
      </div>
    </div>
  );
}