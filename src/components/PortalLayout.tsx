import { PortalSidebar } from "@/components/PortalSidebar";
import { NotificationBell } from "@/components/NotificationBell";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState } from "react";
import { Menu, Sun, Moon, Search, Command } from "lucide-react";
import { useTheme } from "next-themes";
import { Sheet, SheetContent } from "@/components/ui/sheet";

interface PortalLayoutProps {
  children: React.ReactNode;
  variant: "client" | "staff" | "admin";
}

export function PortalLayout({ children, variant }: PortalLayoutProps) {
  const { profile } = useAuth();
  const isMobile = useIsMobile();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { theme, setTheme } = useTheme();

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
        <header className="flex items-center justify-between gap-3 border-b border-portal-border/50 bg-portal-bg/60 backdrop-blur-xl px-4 md:px-6 py-3 h-16 shrink-0 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            {isMobile && (
              <button
                onClick={() => setMobileOpen(true)}
                className="rounded-xl p-2.5 text-portal-text-muted hover:bg-portal-surface/80 hover:text-portal-text transition-all"
                aria-label="Open menu"
              >
                <Menu size={20} />
              </button>
            )}
            {/* Search hint */}
            <button className="hidden md:flex items-center gap-2 rounded-xl border border-portal-border/50 bg-portal-surface/40 px-3.5 py-2 text-xs text-portal-text-muted hover:border-portal-accent/30 hover:text-portal-text transition-all w-64">
              <Search size={14} />
              <span className="flex-1 text-left">Search...</span>
              <kbd className="flex items-center gap-0.5 rounded-md border border-portal-border/50 bg-portal-bg/60 px-1.5 py-0.5 text-[10px] font-medium">
                <Command size={9} />K
              </kbd>
            </button>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="rounded-xl p-2.5 text-portal-text-muted hover:bg-portal-surface/80 hover:text-portal-text transition-all"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
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
