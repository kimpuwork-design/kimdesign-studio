import { useEffect, useState, useCallback } from "react";
import { PortalLayout } from "@/components/PortalLayout";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { LeadDetailDrawer } from "@/components/admin/LeadDetailDrawer";
import { EmptyState } from "@/components/EmptyState";
import { BulkActionBar } from "@/components/admin/bulk/BulkActionBar";
import { useBulkSelection } from "@/components/admin/bulk/useBulkSelection";
import { exportCSV } from "@/lib/csv";
import { supabase } from "@/integrations/supabase/client";
import { writeAuditLog } from "@/lib/audit";
import { useAuth } from "@/contexts/AuthContext";
import {
  Search, Trash2, Eye, ChevronLeft, ChevronRight, Inbox,
  Archive, CheckCircle2, Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  status: string;
  created_at: string;
}

const STATUS_FILTER_OPTIONS = ["all", "new", "contacted", "archived"];
const PAGE_SIZE = 10;

export default function AdminLeads() {
  const { profile } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);

  const sel = useBulkSelection(leads.map((l) => l.id));

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("leads")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

    if (statusFilter !== "all") query = query.eq("status", statusFilter);
    if (search.trim()) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data, count } = await query;
    setLeads((data as Lead[]) ?? []);
    setTotal(count ?? 0);
    setLoading(false);
  }, [page, statusFilter, search]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);
  useEffect(() => { setPage(0); }, [search, statusFilter]);
  // Clear selection when the page/filters change so we never act on stale IDs.
  useEffect(() => { sel.clear(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [page, statusFilter, search]);

  const handleDelete = async (lead: Lead) => {
    if (!confirm(`Delete lead from ${lead.name}?`)) return;
    setDeleting(lead.id);
    await supabase.from("leads").delete().eq("id", lead.id);
    if (profile) await writeAuditLog({
      actor_id: profile.id, action: "lead_deleted", entity_type: "lead",
      metadata: { name: lead.name },
    });
    setDeleting(null);
    fetchLeads();
  };

  // ── Bulk operations ─────────────────────────────────────────────
  const bulkUpdateStatus = async (status: "contacted" | "archived") => {
    const ids = sel.selectedIds;
    if (ids.length === 0) return;
    setBulkBusy(true);
    const { error } = await supabase.from("leads").update({ status }).in("id", ids);
    setBulkBusy(false);
    if (error) {
      toast.error("Bulk update failed", { description: error.message });
      return;
    }
    if (profile) await writeAuditLog({
      actor_id: profile.id, action: `lead_bulk_${status}`, entity_type: "lead",
      metadata: { count: ids.length },
    });
    toast.success(`${ids.length} lead${ids.length === 1 ? "" : "s"} marked ${status}`);
    sel.clear();
    fetchLeads();
  };

  const bulkDelete = async () => {
    const ids = sel.selectedIds;
    if (ids.length === 0) return;
    if (!confirm(`Delete ${ids.length} lead${ids.length === 1 ? "" : "s"}? This cannot be undone.`)) return;
    setBulkBusy(true);
    const { error } = await supabase.from("leads").delete().in("id", ids);
    setBulkBusy(false);
    if (error) {
      toast.error("Bulk delete failed", { description: error.message });
      return;
    }
    if (profile) await writeAuditLog({
      actor_id: profile.id, action: "lead_bulk_deleted", entity_type: "lead",
      metadata: { count: ids.length },
    });
    toast.success(`${ids.length} lead${ids.length === 1 ? "" : "s"} deleted`);
    sel.clear();
    fetchLeads();
  };

  const bulkExport = () => {
    const rows = leads.filter((l) => sel.isSelected(l.id));
    if (rows.length === 0) return;
    exportCSV(
      `leads-${new Date().toISOString().slice(0, 10)}`,
      rows,
      [
        { key: "name", header: "Name" },
        { key: "email", header: "Email" },
        { key: "phone", header: "Phone" },
        { key: "status", header: "Status" },
        { key: "message", header: "Message" },
        { key: "created_at", header: "Created" },
      ],
    );
    toast.success(`Exported ${rows.length} lead${rows.length === 1 ? "" : "s"}`);
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <PortalLayout variant="admin">
      <PageHeader
        title="Leads"
        subtitle={`${total} total enquiries`}
      />

      {/* Filters */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-portal-text-muted" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or email…"
            className="pl-9 h-9 text-xs bg-portal-surface/30 border-portal-border/50 text-portal-text placeholder:text-portal-text-muted"
          />
        </div>
        <div className="flex gap-1">
          {STATUS_FILTER_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all",
                statusFilter === s
                  ? "border-portal-accent bg-portal-accent/15 text-portal-accent"
                  : "border-portal-border/50 text-portal-text-muted hover:border-portal-accent/40 hover:text-portal-text"
              )}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-portal-accent border-t-transparent" />
          </div>
        ) : leads.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title={search || statusFilter !== "all" ? "No matching leads" : "No leads yet"}
            description={
              search || statusFilter !== "all"
                ? "Try clearing filters or searching for a different term."
                : "Leads from the public contact form will appear here as soon as someone reaches out."
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-portal-border/60 bg-portal-surface/30">
                  <th className="w-8 px-3 py-2.5 text-left">
                    <Checkbox
                      checked={sel.allSelected ? true : sel.someSelected ? "indeterminate" : false}
                      onCheckedChange={() => sel.toggleAll()}
                      aria-label="Select all leads on page"
                    />
                  </th>
                  {["Name", "Email", "Status", "Date", ""].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-widest text-portal-text-muted/70">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-portal-border/30">
                {leads.map((lead) => {
                  const checked = sel.isSelected(lead.id);
                  return (
                    <tr
                      key={lead.id}
                      className={cn(
                        "transition-colors group",
                        checked ? "bg-portal-accent/[0.07]" : "hover:bg-portal-accent/[0.04]",
                      )}
                    >
                      <td className="px-3 py-3">
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() => sel.toggle(lead.id)}
                          aria-label={`Select lead from ${lead.name}`}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-portal-text text-xs">{lead.name}</p>
                        {lead.phone && <p className="text-[10px] text-portal-text-muted mt-0.5">{lead.phone}</p>}
                      </td>
                      <td className="px-4 py-3 text-portal-text-muted text-xs">{lead.email}</td>
                      <td className="px-4 py-3"><StatusBadge status={lead.status} /></td>
                      <td className="px-4 py-3 text-portal-text-muted text-[11px]">
                        {new Date(lead.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setSelectedLead(lead)}
                            className="rounded-md p-1.5 text-portal-text-muted hover:bg-portal-surface hover:text-portal-text transition-colors"
                            title="View"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(lead)}
                            disabled={deleting === lead.id}
                            className="rounded-md p-1.5 text-portal-text-muted hover:bg-destructive/15 hover:text-destructive transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-portal-border/40 px-4 py-2.5">
            <span className="text-[11px] text-portal-text-muted">
              Page {page + 1} of {totalPages} · {total} results
            </span>
            <div className="flex gap-1">
              <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage((p) => p - 1)}
                className="border-portal-border/40 text-portal-text-muted h-7 w-7 p-0">
                <ChevronLeft size={13} />
              </Button>
              <Button size="sm" variant="outline" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}
                className="border-portal-border/40 text-portal-text-muted h-7 w-7 p-0">
                <ChevronRight size={13} />
              </Button>
            </div>
          </div>
        )}
      </div>

      <BulkActionBar
        count={sel.count}
        onClear={sel.clear}
        noun="leads"
        actions={[
          { label: "Mark contacted", icon: CheckCircle2, onClick: () => bulkUpdateStatus("contacted"), variant: "primary", disabled: bulkBusy },
          { label: "Archive", icon: Archive, onClick: () => bulkUpdateStatus("archived"), disabled: bulkBusy },
          { label: "Export CSV", icon: Download, onClick: bulkExport, disabled: bulkBusy },
          { label: "Delete", icon: Trash2, onClick: bulkDelete, variant: "destructive", disabled: bulkBusy },
        ]}
      />

      <LeadDetailDrawer
        lead={selectedLead}
        onClose={() => setSelectedLead(null)}
        onUpdated={() => { fetchLeads(); setSelectedLead(null); }}
      />
    </PortalLayout>
  );
}
