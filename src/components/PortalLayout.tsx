// Re-export the modern portal layout as the default PortalLayout
// This ensures backward compatibility with all existing page imports

import { ModernPortalLayout } from "@/components/ModernPortalLayout";

interface PortalLayoutProps {
  children: React.ReactNode;
  variant: "client" | "staff" | "admin";
}

export function PortalLayout({ children, variant }: PortalLayoutProps) {
  return <ModernPortalLayout variant={variant}>{children}</ModernPortalLayout>;
}