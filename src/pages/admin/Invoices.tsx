import { useEffect, useMemo, useState } from "react";
import { PortalLayout } from "@/components/PortalLayout";
import { PageHeader } from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { BillingStatusBadge } from "@/components/billing/BillingStatusBadge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Send, CheckCircle2, Ban, Download, Trash2 } from "lucide-react";
import { BulkActionBar } from "@/components/admin/bulk/BulkActionBar";
import { useBulkSelection } from "@/components/admin/bulk/useBulkSelection";
import { exportCSV } from "@/lib/csv";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { writeAuditLog } from "@/lib/audit";
import { cn } from "@/lib/utils";

interface Invoice {
  id: string;
  invoice_number: string;
  status: string;
  currency: string;
  total: number;
  issue_date: string;
  due_date: string | null;
  project_id: string;
  projects: { title: string; profiles: { full_name: string | null } | null } | null;
}

const STATUSES = ["all", "draft", "sent", "paid", "void"];

export default function AdminInvoices() {
  const { profile } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [bulkBusy, setBulkBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    let q = supabase
      .from("invoices")
      .select("*, projects(title, profiles(full_name))")
      .order("created_at", { ascending: false });
    if (statusFilter !== "all") q = q.eq("status", statusFilter);
    const { data } = await q;
    setInvoices((data as unknown as Invoice[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [statusFilter]);

  const filtered = invoices.filter(i =>
    i.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
    (i.projects?.title ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const sel = useBulkSelection(useMemo(() => filtered.map((i) => i.id), [filtered]));

  const fmt = (amount: number, currency: string) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);

  const isOverdue = (inv: Invoice) =>
    inv.due_date && inv.status === "sent" && new Date(inv.due_date) < new Date();

  const bulkSetStatus = async (status: string) => {
    const ids = sel.selectedIds; if (!ids.length) return;
    setBulkBusy(true);
    const { error } = await supabase.from("invoices").update({ status }).in("id", ids);
    setBulkBusy(false);
    if (error) { toast.error("Bulk update failed", { description: error.message }); return; }
    if (profile) await writeAuditLog({ actor_id: profile.id, action: "invoice_bulk_status", entity_type: "invoice", metadata: { count: ids.length, status } });
    toast.success(`${ids.length} invoice${ids.length === 1 ? "" : "s"} → ${status}`);
    sel.clear(); load();
  };
  const bulkDeleteDrafts = async () => {
    const ids = filtered.filter((i) => sel.isSelected(i.id) && i.status === "draft").map((i) => i.id);
    if (!ids.length) { toast.error("Only draft invoices can be deleted"); return; }
    if (!confirm(`Delete ${ids.length} draft invoice${ids.length === 1 ? "" : "s"}?`)) return;
    setBulkBusy(true);
    const { error } = await supabase.from("invoices").delete().in("id", ids);
    setBulkBusy(false);
    if (error) { toast.error("Delete failed", { description: error.message }); return; }
    toast.success(`${ids.length} draft${ids.length === 1 ? "" : "s"} deleted`);
    sel.clear(); load();
  };
  const bulkExport = () => {
    const rows = filtered.filter((i) => sel.isSelected(i.id));
    if (!rows.length) return;
    exportCSV(`invoices-${new Date().toISOString().slice(0, 10)}`, rows.map((i) => ({
      number: i.invoice_number, project: i.projects?.title ?? "", client: i.projects?.profiles?.full_name ?? "",
      status: i.status, currency: i.currency, total: i.total, issue_date: i.issue_date, due_date: i.due_date ?? "",
    })), [
      { key: "number", header: "Invoice #" }, { key: "project", header: "Project" },
      { key: "client", header: "Client" }, { key: "status", header: "Status" },
      { key: "currency", header: "Currency" }, { key: "total", header: "Total" },
      { key: "issue_date", header: "Issued" }, { key: "due_date", header: "Due" },
    ]);
    toast.success(`Exported ${rows.length} invoice${rows.length === 1 ? "" : "s"}`);
  };

  return (
    <PortalLayout variant="admin">
      <PageHeader title="Invoices" subtitle="All project invoices" />

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-portal-text-muted" />
          <Input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search invoice number or project…"
            className="pl-8 bg-portal-bg/50 backdrop-blur-sm border-portal-border" />
        </div>
        <div className="flex gap-1 flex-wrap">
          {STATUSES.map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
                statusFilter === s
                  ? "bg-portal-accent text-white"
                  : "bg-portal-surface border border-portal-border text-portal-text-muted hover:text-portal-text"
              }`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-portal-accent border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-portal-text-muted text-sm">No invoices found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-portal-border/50 bg-gradient-to-r from-portal-surface/80 to-portal-bg/40">
                <th className="w-8 px-3 py-3 text-left">
                  <Checkbox
                    checked={sel.allSelected ? true : sel.someSelected ? "indeterminate" : false}
                    onCheckedChange={() => sel.toggleAll()}
                    aria-label="Select all invoices"
                  />
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-portal-text-muted">Invoice #</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-portal-text-muted">Project</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-portal-text-muted">Client</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-portal-text-muted">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-portal-text-muted">Due</th>
                <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-portal-text-muted">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-portal-border/30">
              {filtered.map(inv => {
                const checked = sel.isSelected(inv.id);
                return (
                <tr key={inv.id} className={cn("transition-colors", checked ? "bg-portal-accent/[0.07]" : isOverdue(inv) ? "bg-destructive/5 hover:bg-destructive/10" : "hover:bg-portal-accent/5")}>
                  <td className="px-3 py-3">
                    <Checkbox checked={checked} onCheckedChange={() => sel.toggle(inv.id)} aria-label={`Select ${inv.invoice_number}`} />
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-portal-text">{inv.invoice_number}</td>
                  <td className="px-4 py-3 text-portal-text">{inv.projects?.title ?? "—"}</td>
                  <td className="px-4 py-3 text-portal-text-muted">{inv.projects?.profiles?.full_name ?? "—"}</td>
                  <td className="px-4 py-3"><BillingStatusBadge status={inv.status} /></td>
                  <td className="px-4 py-3 text-portal-text-muted">
                    {inv.due_date ? (
                      <span className={isOverdue(inv) ? "text-destructive font-semibold" : ""}>
                        {new Date(inv.due_date).toLocaleDateString()}
                        {isOverdue(inv) && " (overdue)"}
                      </span>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-portal-text">{fmt(inv.total, inv.currency)}</td>
                </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <BulkActionBar
        count={sel.count}
        onClear={sel.clear}
        noun="invoices"
        actions={[
          { label: "Mark sent", icon: Send, onClick: () => bulkSetStatus("sent"), variant: "primary", disabled: bulkBusy },
          { label: "Mark paid", icon: CheckCircle2, onClick: () => bulkSetStatus("paid"), disabled: bulkBusy },
          { label: "Void", icon: Ban, onClick: () => bulkSetStatus("void"), disabled: bulkBusy },
          { label: "Export CSV", icon: Download, onClick: bulkExport, disabled: bulkBusy },
          { label: "Delete drafts", icon: Trash2, onClick: bulkDeleteDrafts, variant: "destructive", disabled: bulkBusy },
        ]}
      />
    </PortalLayout>
  );
}
