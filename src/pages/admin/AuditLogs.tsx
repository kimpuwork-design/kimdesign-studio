import { PortalLayout } from "@/components/PortalLayout";
import { Activity } from "lucide-react";

export default function AdminAuditLogs() {
  return (
    <PortalLayout variant="admin">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-portal-text">Audit Logs</h1>
        <p className="mt-1 text-portal-text-muted">System activity and change history.</p>
      </div>
      <div className="rounded-xl border border-portal-border bg-portal-surface p-6">
        <div className="flex flex-col items-center justify-center py-16 text-portal-text-muted">
          <Activity size={48} className="mb-4 opacity-30" />
          <p className="font-medium text-portal-text">No logs recorded yet</p>
        </div>
      </div>
    </PortalLayout>
  );
}
