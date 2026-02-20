import { PortalSidebar } from "@/components/PortalSidebar";

interface PortalLayoutProps {
  children: React.ReactNode;
  variant: "client" | "staff" | "admin";
}

export function PortalLayout({ children, variant }: PortalLayoutProps) {
  return (
    <div className="flex min-h-screen portal-layout">
      <PortalSidebar variant={variant} />
      <main className="flex-1 overflow-auto">
        <div className="p-6 animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}
