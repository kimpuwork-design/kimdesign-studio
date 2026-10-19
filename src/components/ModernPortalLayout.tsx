import { NotificationBell } from "@/components/NotificationBell";
import { ModernPortalSidebar } from "@/components/ui/modern-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sun, Moon, Search, Command, ChevronRight, Home } from "lucide-react";
import { useTheme } from "next-themes";
import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { CommandPalette } from "@/components/admin/CommandPalette";
import { Button } from "@/components/ui/button";
import { shouldOpenCommandPalette } from "@/lib/keyboard";

interface ModernPortalLayoutProps {
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

export function ModernPortalLayout({ children, variant }: ModernPortalLayoutProps) {
  const { profile } = useAuth();
  const isMobile = useIsMobile();
  const { theme, setTheme } = useTheme();
  const breadcrumbs = useBreadcrumbs(variant);
  const [paletteOpen, setPaletteOpen] = useState(false);

  // ⌘K / Ctrl+K to open the global command palette
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (shouldOpenCommandPalette(e)) {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full portal-layout relative">
        <a href="#portal-main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-portal-surface focus:p-3 focus:text-portal-text">Skip to content</a>

        <ModernPortalSidebar variant={variant} />

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden relative z-10">
          {/* Topbar — frosted glass */}
          <header className="flex h-16 md:h-14 items-center justify-between gap-2 border-b border-portal-border/50 bg-portal-bg/60 backdrop-blur-xl px-3 md:px-6 shrink-0 sticky top-0 z-30">
            <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
              <SidebarTrigger className="h-11 w-11 rounded-md p-2 text-portal-text-muted hover:bg-portal-surface/80 hover:text-portal-text transition-all shrink-0" />
              
              {/* Breadcrumbs — show condensed on mobile */}
              <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs text-portal-text-muted min-w-0 overflow-hidden">
                {breadcrumbs.map((crumb, i) => {
                  // On mobile, only show last 2 crumbs
                  if (isMobile && i < breadcrumbs.length - 2) return null;
                  return (
                    <span key={i} className="flex items-center gap-1 shrink-0">
                      {((isMobile && i > 0) || (!isMobile && i > 0)) && <ChevronRight size={10} className="text-portal-text-muted/40" />}
                      {crumb.href ? (
                        <Link to={crumb.href} aria-label={crumb.label} className="hover:text-portal-text transition-colors">
                          {i === 0 && !isMobile ? <Home size={12} /> : <span className="truncate max-w-[80px] md:max-w-none block">{crumb.label}</span>}
                        </Link>
                      ) : (
                        <span aria-current="page" className="text-portal-text font-medium truncate max-w-[120px] md:max-w-none block">{crumb.label}</span>
                      )}
                    </span>
                  );
                })}
              </nav>

              {/* Search hint — hide on mobile */}
              <Button variant="ghost"
                onClick={() => setPaletteOpen(true)}
                className="hidden lg:flex items-center gap-2 rounded-lg border border-portal-border/40 bg-portal-surface/30 px-3 py-1.5 text-[11px] text-portal-text-muted hover:border-portal-accent/30 hover:text-portal-text transition-all ml-4"
              >
                <Search size={12} />
                <span>Search...</span>
                <kbd className="flex items-center gap-0.5 rounded border border-portal-border/40 bg-portal-bg/50 px-1 py-0.5 text-[9px] font-medium ml-3">
                  <Command size={8} />K
                </kbd>
              </Button>
              {/* Mobile: search icon only */}
              <Button variant="ghost" size="icon"
                onClick={() => setPaletteOpen(true)}
                aria-label="Search"
                className="lg:hidden h-11 w-11 shrink-0 rounded-md text-portal-text-muted hover:bg-portal-surface/80 hover:text-portal-text transition-all ml-auto"
              >
                <Search size={14} />
              </Button>
            </div>
            <div className="flex items-center gap-0.5 md:gap-1 shrink-0">
              <Button variant="ghost" size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="h-11 w-11 rounded-md text-portal-text-muted hover:bg-portal-surface/80 hover:text-portal-text transition-all"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? <Sun size={14} className="md:w-[15px] md:h-[15px]" /> : <Moon size={14} className="md:w-[15px] md:h-[15px]" />}
              </Button>
              {profile && <NotificationBell />}
            </div>
          </header>
          <main id="portal-main" tabIndex={-1} aria-label="Page content" className="min-w-0 flex-1 overflow-auto outline-none">
            <div className="p-3 md:p-4 lg:p-8 pb-safe animate-page-enter">
              {children}
            </div>
          </main>
        </div>
        <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} variant={variant} />
      </div>
    </SidebarProvider>
  );
}