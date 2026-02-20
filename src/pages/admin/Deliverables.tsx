import { useCallback, useEffect, useState } from "react";
import { PortalLayout } from "@/components/PortalLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { DeliverableStatusBadge } from "@/components/deliverables/DeliverableStatusBadge";
import { Deliverable, DeliverableDrawer } from "@/components/deliverables/DeliverableDrawer";
import { writeAuditLog } from "@/lib/audit";
import { useToast } from "@/hooks/use-toast";
import { Loader2, PackageOpen, Search, Filter } from "lucide-react";

interface DeliverableRow extends Deliverable {
  project?: { title: string };
  creator?: { full_name: string | null };
}

type StatusFilter = "all" | "draft" | "submitted" | "approved" | "rejected";

export default function AdminDeliverables() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [deliverables, setDeliverables] = useState<DeliverableRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<DeliverableRow | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [overriding, setOverriding] = useState<string | null>(null);

  const fetchDeliverables = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("deliverables")
      .select(`
        *,
        project:project_id(title),
        file:file_id(original_name, extension, size_bytes, storage_path),
        creator:created_by(full_name)
      `)
      .order("created_at", { ascending: false });

    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else setDeliverables((data as unknown as DeliverableRow[]) ?? []);
    setLoading(false);
  }, [toast]);

  useEffect(() => { fetchDeliverables(); }, [fetchDeliverables]);

  const handleAdminOverride = async (del: DeliverableRow, newStatus: string) => {
    if (!profile) return;
    setOverriding(del.id);
    const { error } = await supabase.from("deliverables").update({ status: newStatus }).eq("id", del.id);
    if (error) { toast({ title: "Failed", description: error.message, variant: "destructive" }); }
    else {
      await supabase.from("deliverable_events").insert({
        deliverable_id: del.id,
        actor_id: profile.id,
        event_type: ["approved","rejected"].includes(newStatus) ? newStatus : "comment",
        note: `Admin override → ${newStatus}`,
      });
      await writeAuditLog({ actor_id: profile.id, action: "deliverable_admin_override", entity_type: "deliverable", entity_id: del.id, metadata: { project_id: del.project_id, new_status: newStatus } });
      toast({ title: "Status updated" });
      fetchDeliverables();
    }
    setOverriding(null);
  };

  const filtered = deliverables.filter((d) => {
    if (statusFilter !== "all" && d.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return d.title.toLowerCase().includes(q) || d.project?.title?.toLowerCase().includes(q) || false;
    }
    return true;
  });

  const counts = {
    all: deliverables.length,
    submitted: deliverables.filter((d) => d.status === "submitted").length,
    approved: deliverables.filter((d) => d.status === "approved").length,
    rejected: deliverables.filter((d) => d.status === "rejected").length,
    draft: deliverables.filter((d) => d.status === "draft").length,
  };

  const FILTERS: { value: StatusFilter; label: string }[] = [
    { value: "all", label: `All (${counts.all})` },
    { value: "submitted", label: `Pending (${counts.submitted})` },
    { value: "approved", label: `Approved (${counts.approved})` },
    { value: "rejected", label: `Rejected (${counts.rejected})` },
    { value: "draft", label: `Drafts (${counts.draft})` },
  ];

  return (
    <PortalLayout variant="admin">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold text-portal-text">Deliverables</h1>
        <p className="mt-1 text-portal-text-muted text-sm">Global view of all project deliverables.</p>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-portal-text-muted" />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search deliverables or projects..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-portal-border bg-portal-bg text-sm text-portal-text placeholder:text-portal-text-muted focus:outline-none focus:ring-2 focus:ring-portal-accent/50"
          />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <Filter size={13} className="text-portal-text-muted" />
          {FILTERS.map((f) => (
            <button key={f.value} onClick={() => setStatusFilter(f.value)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                statusFilter === f.value ? "bg-portal-accent text-white" : "bg-portal-border text-portal-text-muted hover:text-portal-text"
              }`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={22} className="animate-spin text-portal-text-muted" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border border-portal-border bg-portal-surface">
          <PackageOpen size={36} className="text-portal-text-muted/30 mb-3" />
          <p className="font-medium text-portal-text">No deliverables found</p>
        </div>
      ) : (
        <div className="rounded-xl border border-portal-border bg-portal-surface overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-portal-border bg-portal-bg">
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-portal-text-muted">Title</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-portal-text-muted">Project</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-portal-text-muted">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-portal-text-muted">Submitted</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-portal-text-muted">Override</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((del, i) => (
                <tr key={del.id}
                  className={`border-b border-portal-border hover:bg-portal-bg transition-colors cursor-pointer ${i === filtered.length - 1 ? "border-none" : ""}`}
                  onClick={() => setSelected(del)}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-portal-text">{del.title}</p>
                    {del.creator?.full_name && <p className="text-xs text-portal-text-muted mt-0.5">By {del.creator.full_name}</p>}
                  </td>
                  <td className="px-4 py-3 text-portal-text-muted">{del.project?.title ?? "—"}</td>
                  <td className="px-4 py-3"><DeliverableStatusBadge status={del.status} /></td>
                  <td className="px-4 py-3 text-portal-text-muted text-xs">
                    {del.submitted_at ? new Date(del.submitted_at).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={del.status}
                      onChange={(e) => handleAdminOverride(del, e.target.value)}
                      disabled={overriding === del.id}
                      className="text-xs rounded-lg border border-portal-border bg-portal-bg px-2 py-1 text-portal-text focus:outline-none"
                    >
                      {["draft", "submitted", "approved", "rejected"].map((s) => (
                        <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <DeliverableDrawer
          deliverable={selected}
          role="ADMIN"
          onClose={() => setSelected(null)}
          onUpdated={() => { fetchDeliverables(); setSelected(null); }}
        />
      )}
    </PortalLayout>
  );
}
