import { useEffect, useState } from "react";
import { PortalLayout } from "@/components/PortalLayout";
import { PageHeader } from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { BillingStatusBadge } from "@/components/billing/BillingStatusBadge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

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
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

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

  const fmt = (amount: number, currency: string) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);

  const isOverdue = (inv: Invoice) =>
    inv.due_date && inv.status === "sent" && new Date(inv.due_date) < new Date();

  return (
    <PortalLayout variant="admin">
      <PageHeader title="Invoices" subtitle="All project invoices" />

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-portal-text-muted" />
          <Input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search invoice number or project…"
            className="pl-8 bg-portal-bg border-portal-border" />
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

      <div className="rounded-xl border border-portal-border bg-portal-surface overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-portal-accent border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-portal-text-muted text-sm">No invoices found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-portal-border bg-portal-bg">
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-portal-text-muted">Invoice #</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-portal-text-muted">Project</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-portal-text-muted">Client</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-portal-text-muted">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-portal-text-muted">Due</th>
                <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-portal-text-muted">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-portal-border">
              {filtered.map(inv => (
                <tr key={inv.id} className={`hover:bg-portal-border/10 transition-colors ${isOverdue(inv) ? "bg-destructive/5" : ""}`}>
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
              ))}
            </tbody>
          </table>
        )}
      </div>
    </PortalLayout>
  );
}
