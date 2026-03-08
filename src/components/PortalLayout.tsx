import { PortalSidebar } from "@/components/PortalSidebar";
import { NotificationBell } from "@/components/NotificationBell";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState } from "react";
import { Menu, Sun, Moon, Search, Command, ChevronRight, Home } from "lucide-react";
import { useTheme } from "next-themes";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Link, useLocation } from "react-router-dom";

interface PortalLayoutProps {
  children: React.ReactNode;
  variant: "client" | "staff" | "admin";
}

/* ── Breadcrumb builder ── */
function useBreadcrumbs(variant: "client" | "staff" | "admin") {
  const location = useLocation();
  const base = variant === "admin" ? "/admin" : variant === "staff" ? "/staff" : "/app";
  const segments = location.pathname.replace(base, "").split("/").filter(Boolean);
  
  const crumbs: { label: string; href?: string }[] = [
    { label: variant === "admin" ? "Admin" : variant === "staff" ? "Staff" : "Dashboard", href: base },
  ];

  const labelMap: Record<string, string> = {
    projects: "Projects", leads: "Leads", clients: "Clients", invoices: "Invoices",
    quotes: "Quotes", deliverables: "Deliverables", files: "Files", blog: "Blog",
    team: "Team", settings: "Settings", notifications: "Notifications", analytics: "Analytics",
    "site-content": "Site Content", "audit-logs": "Audit Logs", profile: "Profile",
  };

  let path = base;
  segments.forEach((seg, i) => {
    path += `/${seg}`;
    const isLast = i === segments.length - 1;
    const label = labelMap[seg] || (seg.length > 8 ? seg.slice(0, 8) + "…" : seg);
    crumbs.push({ label, href: isLast ? undefined : path });
  });

  return crumbs;
}

export function PortalLayout({ children, variant }: PortalLayoutProps) {
  const { profile } = useAuth();
  const isMobile = useIsMobile();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { theme, setTheme } = useTheme();
  const breadcrumbs = useBreadcrumbs(variant);

  return (
    <div className="flex min-h-screen portal-layout relative">
      {/* Ambient glow orbs */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-portal-accent/[0.04] blur-[100px] animate-float" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-portal-accent/[0.03] blur-[80px] animate-float-delayed" />
      </div>

      {/* Desktop sidebar */}
      {!isMobile && (
        <PortalSidebar variant={variant} collapsed={collapsed} onToggleCollapse={() => setCollapsed(!collapsed)} />
      )}

      {/* Mobile sidebar drawer */}
      {isMobile && (
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="p-0 w-[280px] border-portal-border bg-portal-bg/95 backdrop-blur-xl">
            <div onClick={() => setMobileOpen(false)}>
              <PortalSidebar variant={variant} />
            </div>
          </SheetContent>
        </Sheet>
      )}

      <div className="flex flex-1 flex-col overflow-hidden relative z-10">
        {/* Topbar — frosted glass */}
        <header className="flex items-center justify-between gap-2 border-b border-portal-border/50 bg-portal-bg/60 backdrop-blur-xl px-3 md:px-6 py-2.5 md:py-3 h-13 md:h-14 shrink-0 sticky top-0 z-30">
          <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
            {isMobile && (
              <button
                onClick={() => setMobileOpen(true)}
                className="rounded-xl p-2 text-portal-text-muted hover:bg-portal-surface/80 hover:text-portal-text transition-all shrink-0"
                aria-label="Open menu"
              >
                <Menu size={18} />
              </button>
            )}
            
            {/* Breadcrumbs — show condensed on mobile */}
            <nav className="flex items-center gap-1 text-xs text-portal-text-muted min-w-0 overflow-hidden">
              {breadcrumbs.map((crumb, i) => {
                // On mobile, only show last 2 crumbs
                if (isMobile && i < breadcrumbs.length - 2) return null;
                return (
                  <span key={i} className="flex items-center gap-1 shrink-0">
                    {((isMobile && i > 0) || (!isMobile && i > 0)) && <ChevronRight size={10} className="text-portal-text-muted/40" />}
                    {crumb.href ? (
                      <Link to={crumb.href} className="hover:text-portal-text transition-colors">
                        {i === 0 && !isMobile ? <Home size={12} /> : <span className="truncate max-w-[80px] md:max-w-none block">{crumb.label}</span>}
                      </Link>
                    ) : (
                      <span className="text-portal-text font-medium truncate max-w-[120px] md:max-w-none block">{crumb.label}</span>
                    )}
                  </span>
                );
              })}
            </nav>

            {/* Search hint — hide on mobile */}
            <button className="hidden lg:flex items-center gap-2 rounded-lg border border-portal-border/40 bg-portal-surface/30 px-3 py-1.5 text-[11px] text-portal-text-muted hover:border-portal-accent/30 hover:text-portal-text transition-all ml-4">
              <Search size={12} />
              <span>Search...</span>
              <kbd className="flex items-center gap-0.5 rounded border border-portal-border/40 bg-portal-bg/50 px-1 py-0.5 text-[9px] font-medium ml-3">
                <Command size={8} />K
              </kbd>
            </button>
          </div>
          <div className="flex items-center gap-0.5 md:gap-1 shrink-0">
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="rounded-lg p-1.5 md:p-2 text-portal-text-muted hover:bg-portal-surface/80 hover:text-portal-text transition-all"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun size={14} className="md:w-[15px] md:h-[15px]" /> : <Moon size={14} className="md:w-[15px] md:h-[15px]" />}
            </button>
            {profile && <NotificationBell />}
          </div>
        </header>
        <main className="flex-1 overflow-auto">
          <div className="p-4 md:p-8 animate-page-enter">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
