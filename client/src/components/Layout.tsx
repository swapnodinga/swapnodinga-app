import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { useSociety } from "@/context/SocietyContext";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  FileText,
  LogOut,
  Menu,
  X,
  CreditCard,
  Building,
  Phone,
  Info,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@assets/generated_images/swapnodinga_logo.png";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { currentUser, logout } = useSociety();
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isAdmin = currentUser?.role === "admin";

  const adminLinks = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/members", label: "Members", icon: Users },
    { href: "/admin/reports", label: "Reports", icon: FileText },
  ];

  const memberLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/instalments", label: "Instalments", icon: CreditCard },
  ];

  const publicLinks = [
    { href: "/about", label: "About Us", icon: Info },
    { href: "/project", label: "Our Project", icon: Building },
    { href: "/policy", label: "Policy", icon: ShieldCheck },
    { href: "/contact", label: "Contact", icon: Phone },
  ];

  const navLinks = isAdmin ? adminLinks : memberLinks;
  const allLinks = [...navLinks, ...publicLinks];

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border shadow-xl z-20">
        <div className="p-6 flex items-center gap-3 border-b border-sidebar-border/50">
          <img src={logo} alt="Swapnodinga" className="w-10 h-10 rounded-full bg-white p-1" />
          <span className="font-serif font-bold text-xl tracking-tight">Swapnodinga</span>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <div className="mb-6">
            <p className="px-4 text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider mb-2">
              Menu
            </p>
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <a
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-md transition-all duration-200 group",
                    location === link.href
                      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <link.icon className="w-5 h-5" />
                  <span className="font-medium">{link.label}</span>
                </a>
              </Link>
            ))}
          </div>

          <div>
             <p className="px-4 text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider mb-2">
              Information
            </p>
            {publicLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <a
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-md transition-all duration-200 group",
                    location === link.href
                      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <link.icon className="w-5 h-5" />
                  <span className="font-medium">{link.label}</span>
                </a>
              </Link>
            ))}
          </div>
        </nav>

        <div className="p-4 border-t border-sidebar-border/50 bg-sidebar-accent/10">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground font-bold">
              {currentUser?.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate">{currentUser?.name}</p>
              <p className="text-xs text-sidebar-foreground/60 truncate capitalize">{currentUser?.role}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-sidebar-foreground/80 hover:text-destructive hover:bg-destructive/10"
            onClick={logout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden bg-sidebar text-sidebar-foreground p-4 flex items-center justify-between shadow-md z-20">
        <div className="flex items-center gap-2">
           <img src={logo} alt="Swapnodinga" className="w-8 h-8 rounded-full bg-white p-1" />
           <span className="font-serif font-bold text-lg">Swapnodinga</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X /> : <Menu />}
        </Button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="absolute right-0 top-0 h-full w-64 bg-sidebar p-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-end mb-6">
              <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)}>
                <X className="text-sidebar-foreground" />
              </Button>
            </div>
            <nav className="space-y-2">
              {allLinks.map((link) => (
                <Link key={link.href} href={link.href}>
                  <a
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-md transition-colors",
                      location === link.href
                        ? "bg-sidebar-primary text-sidebar-primary-foreground"
                        : "text-sidebar-foreground/80 hover:bg-sidebar-accent"
                    )}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <link.icon className="w-5 h-5" />
                    {link.label}
                  </a>
                </Link>
              ))}
              <Button
                variant="ghost"
                className="w-full justify-start text-sidebar-foreground/80 hover:text-destructive mt-8"
                onClick={logout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-muted/20">
        <div className="container mx-auto p-4 md:p-8 max-w-7xl animate-in fade-in duration-500">
          {children}
        </div>
      </main>
    </div>
  );
}
