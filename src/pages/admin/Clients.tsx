import { PortalLayout } from "@/components/PortalLayout";
import { UserCog } from "lucide-react";

export default function AdminClients() {
  return (
    <PortalLayout variant="admin">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-portal-text">Clients</h1>
        <p className="mt-1 text-portal-text-muted">All registered clients.</p>
      </div>
      <div className="rounded-xl border border-portal-border bg-portal-surface p-6">
        <div className="flex flex-col items-center justify-center py-16 text-portal-text-muted">
          <UserCog size={48} className="mb-4 opacity-30" />
          <p className="font-medium text-portal-text">No clients yet</p>
        </div>
      </div>
    </PortalLayout>
  );
}
