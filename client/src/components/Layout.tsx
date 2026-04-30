"use client"

import React, { useEffect, useState, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { useSociety } from "@/context/SocietyContext";
import { supabase } from "@/lib/supabase"; 
import { cn } from "@/lib/utils";
import { useMobile } from "@/hooks/use-mobile";
import { 
  LayoutDashboard, Users, ShieldCheck, LogOut, 
  ChevronRight, Home, Info, Briefcase, ShieldAlert, Phone,
  CreditCard, Menu, LogIn, FileText, PiggyBank, LineChart, Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import logo from "@/assets/generated_images/SwapnoDinga_Logo_Update.png";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { currentUser, logout, members, transactions } = useSociety();
  const [location, setLocation] = useLocation();
  const isMobile = useMobile();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [dynamicNotice, setDynamicNotice] = useState("Loading official notice...");
  const [allNotices, setAllNotices] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const refreshNoticeData = async () => {
      if (!currentUser) return;

      const { data: settingsData } = await supabase
        .from('site_settings')
        .select('setting_value')
        .eq('setting_key', 'dashboard_notice')
        .single();

      if (settingsData?.setting_value) setDynamicNotice(settingsData.setting_value);

      const { data: noticesData } = await supabase
        .from('notices')
        .select('*')
        .order('created_at', { ascending: false });

      if (noticesData) {
        setAllNotices(noticesData);
        setUnreadCount(noticesData.length);
      }
    };

    const handleNoticeRefresh = () => {
      refreshNoticeData();
    };

    window.addEventListener("notices-updated", handleNoticeRefresh);
    return () => window.removeEventListener("notices-updated", handleNoticeRefresh);
  }, [currentUser]);

  useEffect(() => {
    const fetchNoticeData = async () => {
      // 1. Fetch Banner Text
      const { data: settingsData } = await supabase
        .from('site_settings')
        .select('setting_value')
        .eq('setting_key', 'dashboard_notice')
        .single();
      
      if (settingsData?.setting_value) setDynamicNotice(settingsData.setting_value);

      // 2. Fetch Notice List for the Dropdown
      const { data: noticesData } = await supabase
        .from('notices')
        .select('*')
        .order('created_at', { ascending: false });

      if (noticesData) {
        setAllNotices(noticesData);
        setUnreadCount(noticesData.length);
      }
    };

    if (currentUser) fetchNoticeData();
  }, [currentUser, location]);

  const pendingMembersCount = useMemo(() => 
    members.filter(m => m.status === 'pending').length, 
  [members]);

  const pendingPaymentsCount = useMemo(() => 
    transactions.filter(t => t.status === 'Pending').length, 
  [transactions]);

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
    { href: "/admin/members", label: "Manage Members", icon: Users, badge: pendingMembersCount },
    { href: "/admin/payments", label: "Verify Payments", icon: ShieldCheck, badge: pendingPaymentsCount },
    { href: "/admin/reports", label: "Reports", icon: FileText },
    { href: "/admin/deposits", label: "Fixed Deposits", icon: PiggyBank },
    { href: "/admin/interest", label: "Interest Records", icon: LineChart },
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
      <div className="p-6 flex items-center gap-4 border-b border-white/10">
        <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center overflow-hidden shrink-0">
          <img src={logo} alt="Logo" className="w-full h-full object-contain scale-125" />
        </div>
        <span className="font-bold text-xl tracking-tight">Swapnodinga</span>
      </div>
      
      <div className="flex-1 overflow-y-auto py-6 px-4">
        <nav className="space-y-8">
          {currentUser && (
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-white/40 font-bold mb-4 px-3">
                {currentUser?.is_admin ? "Admin Menu" : "Member Menu"}
              </p>
              <div className="space-y-1">
                {(currentUser?.is_admin ? adminLinks : memberLinks).map((link) => (
                  <Link key={link.href} href={link.href}>
                    <a className={cn(
                      "flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all",
                      location === link.href ? "bg-[#065f46] text-white" : "text-white/70 hover:text-white hover:bg-white/5"
                    )}>
                      <div className="flex items-center gap-3">
                        <link.icon size={20} className={cn(location === link.href ? "text-white" : "text-white/40")} />
                        <span className={cn("underline underline-offset-4 font-medium", location !== link.href && "text-white/70")}>
                          {link.label}
                        </span>
                      </div>
                      {'badge' in link && (link as any).badge > 0 && (
                        <span className="bg-white text-[#1a4d3c] text-[10px] font-bold h-5 w-5 flex items-center justify-center rounded-full shadow-sm">
                          {(link as any).badge}
                        </span>
                      )}
                    </a>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-white/40 font-bold mb-4 px-3">Information</p>
            <div className="space-y-1">
              {infoLinks.map((link) => (
                <Link key={link.href} href={link.href}>
                  <a className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all",
                    location === link.href ? "bg-[#047857] text-white" : "text-white/70 hover:text-white hover:bg-white/5"
                  )}>
                    <link.icon size={20} className={cn(location === link.href ? "text-white" : "text-white/40")} />
                    <span className="underline underline-offset-4 font-medium">{link.label}</span>
                  </a>
                </Link>
              ))}
            </div>
          </div>

          {currentUser && (
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-white/40 font-bold mb-4 px-3">Account</p>
              <Link href="/profile">
                <a className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all",
                  location === "/profile" ? "bg-[#047857] text-white" : "text-white/70 hover:text-white hover:bg-white/5"
                )}>
                  <div className="w-6 h-6 rounded-full overflow-hidden border border-white/20 shrink-0">
                    <img 
                      src={currentUser.profile_pic || "https://via.placeholder.com/150"} 
                      alt="User" 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <span className="underline underline-offset-4 font-medium">Profile & Support</span>
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
            className="w-full justify-start text-[#fb7185] gap-3 hover:bg-rose-950/30 hover:text-rose-300" 
            onClick={logout}
          >
            <LogOut size={20} />
            <span className="font-bold">Sign Out</span>
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden relative">
      <style jsx global>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          display: inline-block;
          white-space: nowrap;
          animation: marquee 25s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>

      <aside className="hidden md:flex flex-col w-64 shrink-0 shadow-xl border-r border-white/5">
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
        <header className="h-16 bg-white border-b flex items-center px-4 md:px-8 justify-between shrink-0 shadow-sm z-30">
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

          <div className="flex items-center gap-6">
            
            {/* UPDATED: NOTICE LIST DROPDOWN */}
            {currentUser && (
              <div className="relative">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-9 px-4 border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:text-amber-800 font-bold gap-2 hidden sm:flex shadow-sm"
                    >
                      <FileText size={16} />
                      <span>Notice</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-0 mr-4 mt-2" align="end">
                    <div className="bg-amber-50 p-3 border-b border-amber-100">
                      <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider">Official Notices</h4>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {allNotices.length > 0 ? (
                        allNotices.map((notice) => (
                          <a 
                            key={notice.id} 
                            href={notice.file_url} 
                            target="_blank" 
                            rel="noreferrer"
                            className="flex items-center gap-3 p-3 hover:bg-slate-50 border-b last:border-0 transition-colors"
                          >
                            <div className="bg-red-100 p-2 rounded text-red-600">
                              <FileText size={14} />
                            </div>
                            <div className="flex-1 overflow-hidden">
                              <p className="text-sm font-medium text-slate-900 truncate">{notice.title}</p>
                              <p className="text-[10px] text-slate-400">{new Date(notice.created_at).toLocaleDateString()}</p>
                            </div>
                          </a>
                        ))
                      ) : (
                        <div className="p-8 text-center text-xs text-slate-400">No active notices found.</div>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Dynamic Notification Badge */}
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-600 border border-white text-[9px] text-white font-bold items-center justify-center">
                      {unreadCount}
                    </span>
                  </span>
                )}
              </div>
            )}

            {currentUser ? (
              <div className="flex items-center gap-3 border-l pl-6">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold text-slate-900">{currentUser.full_name}</p>
                  <p className="text-[10px] text-slate-400 uppercase tracking-tighter">{currentUser.is_admin ? "Administrator" : "Member"}</p>
                </div>
                <div className="w-8 h-8 rounded-full overflow-hidden border bg-slate-100">
                  <img src={currentUser.profile_pic || "https://via.placeholder.com/150"} alt="User" className="w-full h-full object-cover" />
                </div>
              </div>
            ) : (
              <Link href="/">
                <Button variant="default" className="bg-[#1a4d3c] hover:bg-[#143b2e] gap-2 h-9 px-4">
                  <LogIn size={16} />
                  <span>Member Login</span>
                </Button>
              </Link>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-slate-50/30">
          <div className="p-4 md:p-8 space-y-6">
            
            {/* MARQUEE BANNER - Show only on Dashboard or Admin */}
            {currentUser && (location === "/dashboard" || location === "/admin") && (
              <div className="w-full h-11 bg-[#065f46] rounded-xl flex items-center overflow-hidden shadow-sm border border-[#064e3b] mb-2">
                <div className="bg-[#064e3b] h-full flex items-center px-5 z-10">
                    <span className="text-[10px] font-black text-white uppercase tracking-widest whitespace-nowrap">Official Notice</span>
                </div>
                <div className="flex-1">
                  <div className="animate-marquee">
                    <span className="text-emerald-50 text-sm font-medium px-4 tracking-wide">
                      {dynamicNotice} &nbsp;&nbsp; • &nbsp;&nbsp; {dynamicNotice}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {children}
          </div>
        </main>
      </div>
    </div>
  );
}