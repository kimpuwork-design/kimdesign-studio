import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Deliverable, DeliverableDrawer } from "./DeliverableDrawer";
import { DeliverableStatusBadge } from "./DeliverableStatusBadge";
import { StaffCreateDeliverableModal } from "./StaffCreateDeliverableModal";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, PackageOpen, Plus, Filter } from "lucide-react";
import { writeAuditLog } from "@/lib/audit";

interface Props {
  projectId: string;
  role: "CLIENT" | "STAFF" | "ADMIN";
}

type StatusFilter = "all" | "draft" | "submitted" | "approved" | "rejected";

export function DeliverablesTab({ projectId, role }: Props) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Deliverable | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [adminOverride, setAdminOverride] = useState<string | null>(null); // for admin status change

  const fetchDeliverables = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("deliverables")
      .select(`
        *,
        file:file_id(original_name, extension, size_bytes, storage_path),
        creator:created_by(full_name)
      `)
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    if (error) toast({ title: "Error loading deliverables", description: error.message, variant: "destructive" });
    else setDeliverables((data as unknown as Deliverable[]) ?? []);
    setLoading(false);
  }, [projectId, toast]);

  useEffect(() => { fetchDeliverables(); }, [fetchDeliverables]);

  const handleAdminStatusChange = async (del: Deliverable, newStatus: string) => {
    if (!profile) return;
    setAdminOverride(del.id);
    const { error } = await supabase.from("deliverables").update({ status: newStatus }).eq("id", del.id);
    if (error) { toast({ title: "Update failed", description: error.message, variant: "destructive" }); }
    else {
      await supabase.from("deliverable_events").insert({
        deliverable_id: del.id,
        actor_id: profile.id,
        event_type: newStatus === "approved" ? "approved" : newStatus === "rejected" ? "rejected" : "comment",
        note: `Admin override: status changed to ${newStatus}`,
      });
      await writeAuditLog({ actor_id: profile.id, action: "deliverable_admin_override", entity_type: "deliverable", entity_id: del.id, metadata: { project_id: projectId, new_status: newStatus } });
      toast({ title: "Status updated" });
      fetchDeliverables();
    }
    setAdminOverride(null);
  };

  const filtered = filter === "all" ? deliverables : deliverables.filter((d) => d.status === filter);

  const pendingCount = deliverables.filter((d) => d.status === "submitted").length;
  const rejectedCount = deliverables.filter((d) => d.status === "rejected").length;

  const FILTERS: { value: StatusFilter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "submitted", label: `Pending${pendingCount ? ` (${pendingCount})` : ""}` },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: `Rejected${rejectedCount ? ` (${rejectedCount})` : ""}` },
    { value: "draft", label: "Drafts" },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Filter size={13} className="text-portal-text-muted" />
          {FILTERS.map((f) => (
            <button key={f.value} onClick={() => setFilter(f.value)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                filter === f.value ? "bg-portal-accent text-white" : "bg-portal-border text-portal-text-muted hover:text-portal-text"
              }`}>
              {f.label}
            </button>
          ))}
        </div>
        {(role === "STAFF" || role === "ADMIN") && (
          <Button size="sm" onClick={() => setShowCreate(true)} className="gap-1.5 text-xs">
            <Plus size={13} />Submit Deliverable
          </Button>
        )}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={22} className="animate-spin text-portal-text-muted" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <PackageOpen size={36} className="text-portal-text-muted/30 mb-3" />
          <p className="font-medium text-portal-text">No deliverables {filter !== "all" ? `with status "${filter}"` : "yet"}</p>
          {role !== "CLIENT" && filter === "all" && (
            <p className="mt-1 text-sm text-portal-text-muted">Submit a deliverable for client review.</p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((del) => (
            <div key={del.id}
              className="flex items-center gap-3 rounded-xl border border-portal-border bg-portal-surface px-4 py-3.5 hover:bg-portal-bg transition-colors cursor-pointer"
              onClick={() => setSelected(del)}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-sm font-semibold text-portal-text">{del.title}</span>
                  <DeliverableStatusBadge status={del.status} />
                </div>
                <div className="flex items-center gap-3 text-xs text-portal-text-muted flex-wrap">
                  {del.creator?.full_name && <span>By {del.creator.full_name}</span>}
                  {del.submitted_at && <span>· {new Date(del.submitted_at).toLocaleDateString()}</span>}
                  {del.status === "rejected" && del.client_feedback && (
                    <span className="text-destructive truncate max-w-[200px]">· "{del.client_feedback}"</span>
                  )}
                </div>
              </div>

              {/* Admin status override */}
              {role === "ADMIN" && (
                <select
                  value={del.status}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => { e.stopPropagation(); handleAdminStatusChange(del, e.target.value); }}
                  disabled={adminOverride === del.id}
                  className="text-xs rounded-lg border border-portal-border bg-portal-bg px-2 py-1 text-portal-text focus:outline-none focus:ring-1 focus:ring-portal-accent"
                >
                  {["draft", "submitted", "approved", "rejected"].map((s) => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Drawers / Modals */}
      {selected && (
        <DeliverableDrawer
          deliverable={selected}
          role={role}
          onClose={() => setSelected(null)}
          onUpdated={() => { fetchDeliverables(); setSelected(null); }}
        />
      )}

      {showCreate && (role === "STAFF" || role === "ADMIN") && (
        <StaffCreateDeliverableModal
          projectId={projectId}
          onClose={() => setShowCreate(false)}
          onCreated={fetchDeliverables}
        />
      )}
    </div>
  );
}
