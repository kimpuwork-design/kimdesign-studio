import { useEffect, useState, useCallback } from "react";
import { PortalLayout } from "@/components/PortalLayout";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { LeadDetailDrawer } from "@/components/admin/LeadDetailDrawer";
import { supabase } from "@/integrations/supabase/client";
import { writeAuditLog } from "@/lib/audit";
import { useAuth } from "@/contexts/AuthContext";
import { Search, Trash2, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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

  // Reset page on filter/search change
  useEffect(() => { setPage(0); }, [search, statusFilter]);

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

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <PortalLayout variant="admin">
      <PageHeader
        title="Leads"
        subtitle={`${total} total enquiries`}
      />

      {/* Filters */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-portal-text-muted" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or email…"
            className="pl-9 bg-portal-surface border-portal-border text-portal-text placeholder:text-portal-text-muted"
          />
        </div>
        <div className="flex gap-1.5">
          {STATUS_FILTER_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                statusFilter === s
                  ? "border-portal-accent bg-portal-accent/15 text-portal-accent"
                  : "border-portal-border text-portal-text-muted hover:border-portal-accent/50 hover:text-portal-text"
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-portal-border bg-portal-surface overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-portal-accent border-t-transparent" />
          </div>
        ) : leads.length === 0 ? (
          <div className="py-16 text-center text-portal-text-muted">
            <p className="font-medium text-portal-text">No leads found</p>
            <p className="mt-1 text-sm">Leads from the contact form will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-portal-border">
                  {["Name", "Email", "Status", "Date", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-portal-text-muted">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-portal-border">
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-portal-surface-hover transition-colors">
                    <td className="px-4 py-3 font-medium text-portal-text">{lead.name}</td>
                    <td className="px-4 py-3 text-portal-text-muted">{lead.email}</td>
                    <td className="px-4 py-3"><StatusBadge status={lead.status} /></td>
                    <td className="px-4 py-3 text-portal-text-muted text-xs">
                      {new Date(lead.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setSelectedLead(lead)}
                          className="rounded p-1.5 text-portal-text-muted hover:bg-portal-bg hover:text-portal-text transition-colors"
                          title="View"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(lead)}
                          disabled={deleting === lead.id}
                          className="rounded p-1.5 text-portal-text-muted hover:bg-destructive/15 hover:text-destructive transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-portal-border px-4 py-3">
            <span className="text-xs text-portal-text-muted">
              Page {page + 1} of {totalPages}
            </span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage((p) => p - 1)}
                className="border-portal-border text-portal-text-muted h-7 px-2">
                <ChevronLeft size={14} />
              </Button>
              <Button size="sm" variant="outline" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}
                className="border-portal-border text-portal-text-muted h-7 px-2">
                <ChevronRight size={14} />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Lead drawer */}
      <LeadDetailDrawer
        lead={selectedLead}
        onClose={() => setSelectedLead(null)}
        onUpdated={() => { fetchLeads(); setSelectedLead(null); }}
      />
    </PortalLayout>
  );
}
