import { useEffect, useState } from "react";
import { PortalLayout } from "@/components/PortalLayout";
import { PageHeader } from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { BillingStatusBadge } from "@/components/billing/BillingStatusBadge";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface Quote {
  id: string;
  title: string;
  status: string;
  currency: string;
  total: number;
  created_at: string;
  project_id: string;
  projects: { title: string; profiles: { full_name: string | null } | null } | null;
}

const STATUSES = ["all", "draft", "sent", "accepted", "rejected"];

export default function AdminQuotes() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const load = async () => {
    setLoading(true);
    let q = supabase
      .from("quotes")
      .select("*, projects(title, profiles(full_name))")
      .order("created_at", { ascending: false });
    if (statusFilter !== "all") q = q.eq("status", statusFilter);
    const { data } = await q;
    setQuotes((data as unknown as Quote[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [statusFilter]);

  const filtered = quotes.filter(q =>
    q.title.toLowerCase().includes(search.toLowerCase()) ||
    (q.projects?.title ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const fmt = (amount: number, currency: string) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);

  return (
    <PortalLayout variant="admin">
      <PageHeader title="Quotes" subtitle="All project quotes" />

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-portal-text-muted" />
          <Input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search title or project…"
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
          <div className="py-12 text-center text-portal-text-muted text-sm">No quotes found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-portal-border bg-portal-bg">
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-portal-text-muted">Title</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-portal-text-muted">Project</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-portal-text-muted">Client</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-portal-text-muted">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-portal-text-muted">Date</th>
                <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-portal-text-muted">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-portal-border">
              {filtered.map(q => (
                <tr key={q.id} className="hover:bg-portal-border/10 transition-colors">
                  <td className="px-4 py-3 text-portal-text font-medium">{q.title}</td>
                  <td className="px-4 py-3 text-portal-text">{q.projects?.title ?? "—"}</td>
                  <td className="px-4 py-3 text-portal-text-muted">{q.projects?.profiles?.full_name ?? "—"}</td>
                  <td className="px-4 py-3"><BillingStatusBadge status={q.status} /></td>
                  <td className="px-4 py-3 text-portal-text-muted">{new Date(q.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right font-semibold text-portal-text">{fmt(q.total, q.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </PortalLayout>
  );
}
