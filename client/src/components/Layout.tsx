import React, { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useSociety } from "@/context/SocietyContext";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Users, 
  ShieldCheck, 
  LogOut, 
  UserCircle,
  ChevronRight,
  Home,
  Info,
  Briefcase,
  ShieldAlert,
  Phone,
  FileText,
  PiggyBank,
  TrendingUp,
  CreditCard // Added for Member Payments
} from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@assets/generated_images/swapnodinga_logo.png";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { currentUser, logout } = useSociety();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (!currentUser && location !== "/") {
      setLocation("/");
    }
  }, [currentUser, location, setLocation]);

  if (location === "/") {
    return <div className="min-h-screen bg-background">{children}</div>;
  }

  // Admin-specific sidebar links
  const adminLinks = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/members", label: "Manage Members", icon: Users },
    { href: "/admin/payments", label: "Verify Payments", icon: ShieldCheck },
    { href: "/admin/reports", label: "Reports", icon: FileText },
    { href: "/admin/deposits", label: "Fixed Deposits", icon: PiggyBank },
    { href: "/admin/interest", label: "Interest Records", icon: TrendingUp },
  ];

  // Member-specific sidebar links
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

  return (
    <div className="flex h-screen bg-background overflow-hidden font-sans">
      {/* SIDEBAR */}
      <aside className="hidden md:flex flex-col w-64 bg-[#1a4d3c] text-white border-r border-emerald-900/20 shadow-2xl">
        <div className="p-6 flex items-center gap-3 border-b border-white/10">
          <div className="bg-white p-1 rounded-full shadow-md">
            <img src={logo} alt="Logo" className="w-8 h-8 object-contain" />
          </div>
          <span className="font-serif font-bold text-xl tracking-tight">Swapnodinga</span>
        </div>
        
        <div className="flex-1 overflow-y-auto py-8 px-4">
          <nav className="space-y-8">
            {/* DYNAMIC MENU BASED ON ROLE */}
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold mb-4 px-3">
                {currentUser?.is_admin ? "Admin Menu" : "Member Menu"}
              </p>
              <div className="space-y-1">
                {(currentUser?.is_admin ? adminLinks : memberLinks).map((link) => (
                  <Link key={link.href} href={link.href}>
                    <a className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] transition-all group",
                      location === link.href 
                        ? "bg-emerald-800 text-white font-medium" 
                        : "text-white/60 hover:bg-emerald-800/50 hover:text-white"
                    )}>
                      <link.icon size={18} className={cn(
                        location === link.href ? "text-emerald-400" : "text-white/30 group-hover:text-white"
                      )} />
                      <span>{link.label}</span>
                    </a>
                  </Link>
                ))}
              </div>
            </div>

            {/* INFORMATION SECTION */}
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold mb-4 px-3">Information</p>
              <div className="space-y-1">
                {infoLinks.map((link) => (
                  <Link key={link.href} href={link.href}>
                    <a className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] transition-all group",
                      location === link.href 
                        ? "bg-emerald-800 text-white font-medium" 
                        : "text-white/60 hover:bg-emerald-800/50 hover:text-white"
                    )}>
                      <link.icon size={18} className={cn(
                        location === link.href ? "text-emerald-400" : "text-white/30 group-hover:text-white"
                      )} />
                      <span>{link.label}</span>
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
                  location === "/profile" 
                    ? "bg-emerald-800 text-white font-medium" 
                    : "text-white/60 hover:bg-emerald-800/50 hover:text-white"
                )}>
                  {currentUser?.profile_pic ? (
                    <img 
                      src={currentUser.profile_pic} 
                      alt="Avatar" 
                      className="w-6 h-6 rounded-full object-cover border border-white/20" 
                    />
                  ) : (
                    <UserCircle size={18} className="text-white/30 group-hover:text-white" />
                  )}
                  <span>Profile & Support</span>
                </a>
              </Link>
            </div>
          </nav>
        </div>

        <div className="p-6 border-t border-white/10">
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

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50/50">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-8 shadow-sm justify-between">
            <nav className="flex items-center text-[13px] text-slate-400">
             <Home size={14} className="mr-2" />
             {/* FIXED: DYNAMIC BREADCRUMB */}
             <Link 
               href={currentUser?.is_admin ? "/admin" : "/dashboard"} 
               className="hover:text-emerald-700 transition-colors"
             >
               {currentUser?.is_admin ? "Admin" : "Home"}
             </Link>
             
             {location.split('/').filter(Boolean).map((part, i) => {
               if (part === 'admin' || part === 'dashboard') return null;
               return (
                <React.Fragment key={i}>
                  <ChevronRight size={12} className="mx-2 opacity-30" />
                  <span className="capitalize font-medium text-slate-900">{part.replace(/-/g, ' ')}</span>
                </React.Fragment>
               );
             })}
          </nav>
          
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-slate-900 leading-none">{currentUser?.full_name || "User"}</p>
              {/* FIXED: DYNAMIC ROLE LABEL */}
              <p className="text-[10px] text-slate-400 uppercase tracking-tighter">
                {currentUser?.is_admin ? "Administrator" : "Member"}
              </p>
            </div>
            <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-200 shadow-sm bg-slate-100">
               <img 
                 src={currentUser?.profile_pic || "https://via.placeholder.com/150"} 
                 alt="User" 
                 className="w-full h-full object-cover" 
               />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
}