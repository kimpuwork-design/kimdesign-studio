import { PortalLayout } from "@/components/PortalLayout";
import { Image } from "lucide-react";

export default function AdminPortfolio() {
  return (
    <PortalLayout variant="admin">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-portal-text">Portfolio</h1>
        <p className="mt-1 text-portal-text-muted">Manage public portfolio items.</p>
      </div>
      <div className="rounded-xl border border-portal-border bg-portal-surface p-6">
        <div className="flex flex-col items-center justify-center py-16 text-portal-text-muted">
          <Image size={48} className="mb-4 opacity-30" />
          <p className="font-medium text-portal-text">No portfolio items yet</p>
        </div>
      </div>
    </PortalLayout>
  );
}
