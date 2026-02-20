import { useEffect, useState } from "react";
import { PortalLayout } from "@/components/PortalLayout";
import { PageHeader } from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { Activity } from "lucide-react";

interface AuditLog {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, string> | null;
  created_at: string;
  profiles: { full_name: string | null } | null;
}

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("audit_logs")
      .select("*, profiles(full_name)")
      .order("created_at", { ascending: false })
      .limit(200)
      .then(({ data }) => {
        setLogs((data as unknown as AuditLog[]) ?? []);
        setLoading(false);
      });
  }, []);

  return (
    <PortalLayout variant="admin">
      <PageHeader title="Audit Logs" subtitle="System activity history" />

      <div className="rounded-xl border border-portal-border bg-portal-surface overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-portal-accent border-t-transparent" />
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-portal-text-muted">
            <Activity size={40} className="mb-3 opacity-30" />
            <p className="font-medium text-portal-text">No logs yet</p>
            <p className="text-sm mt-1">Actions will be recorded here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-portal-border">
                  {["Actor", "Action", "Entity", "Timestamp"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-portal-text-muted">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-portal-border">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-portal-surface-hover transition-colors">
                    <td className="px-4 py-3 text-portal-text">{log.profiles?.full_name ?? "System"}</td>
                    <td className="px-4 py-3">
                      <code className="rounded bg-portal-bg px-1.5 py-0.5 text-xs text-portal-accent">{log.action}</code>
                    </td>
                    <td className="px-4 py-3 text-portal-text-muted text-xs">
                      <span className="font-semibold text-portal-text">{log.entity_type}</span>
                      {log.entity_id && <span className="ml-1 opacity-50">#{log.entity_id.slice(0, 8)}</span>}
                    </td>
                    <td className="px-4 py-3 text-portal-text-muted text-xs">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
