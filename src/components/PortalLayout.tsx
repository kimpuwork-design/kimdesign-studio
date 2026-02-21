import { PortalSidebar } from "@/components/PortalSidebar";
import { NotificationBell } from "@/components/NotificationBell";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState } from "react";
import { Menu, Sun, Moon } from "lucide-react";
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
    <div className="flex min-h-screen portal-layout">
      {/* Desktop sidebar */}
      {!isMobile && (
        <PortalSidebar variant={variant} collapsed={collapsed} onToggleCollapse={() => setCollapsed(!collapsed)} />
      )}

      {/* Mobile sidebar drawer */}
      {isMobile && (
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="p-0 w-60 border-portal-border bg-portal-bg">
            <div onClick={() => setMobileOpen(false)}>
              <PortalSidebar variant={variant} />
            </div>
          </SheetContent>
        </Sheet>
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Topbar */}
        <header className="flex items-center justify-between gap-2 border-b border-portal-border bg-portal-bg px-4 md:px-6 py-3 h-14 shrink-0">
          <div className="flex items-center gap-2">
            {isMobile && (
              <button
                onClick={() => setMobileOpen(true)}
                className="rounded p-2 text-portal-text-muted hover:bg-portal-surface hover:text-portal-text transition-colors"
                aria-label="Open menu"
              >
                <Menu size={20} />
              </button>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="rounded p-2 text-portal-text-muted hover:bg-portal-surface hover:text-portal-text transition-colors"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            {profile && <NotificationBell />}
          </div>
        </header>
        <main className="flex-1 overflow-auto">
          <div className="p-4 md:p-6 animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
