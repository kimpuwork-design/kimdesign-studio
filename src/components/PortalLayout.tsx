import { PortalSidebar } from "@/components/PortalSidebar";
import { NotificationBell } from "@/components/NotificationBell";
import { useAuth } from "@/contexts/AuthContext";

interface PortalLayoutProps {
  children: React.ReactNode;
  variant: "client" | "staff" | "admin";
}

export function PortalLayout({ children, variant }: PortalLayoutProps) {
  const { profile } = useAuth();

  return (
    <div className="flex min-h-screen portal-layout">
      <PortalSidebar variant={variant} />
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Topbar */}
        <header className="flex items-center justify-end gap-2 border-b border-portal-border bg-portal-bg px-6 py-3 h-14 shrink-0">
          {profile && <NotificationBell />}
        </header>
        <main className="flex-1 overflow-auto">
          <div className="p-6 animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
