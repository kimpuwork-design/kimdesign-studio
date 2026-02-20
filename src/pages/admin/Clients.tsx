import { useEffect, useState, useCallback } from "react";
import { PortalLayout } from "@/components/PortalLayout";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { supabase } from "@/integrations/supabase/client";
import { Search, ChevronRight, Building2, FolderOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface ClientProfile {
  id: string;
  full_name: string | null;
  company: string | null;
  phone: string | null;
  created_at: string;
}

interface Project {
  id: string;
  title: string;
  status: string;
  target_date: string | null;
}

export default function AdminClients() {
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<ClientProfile | null>(null);
  const [clientProjects, setClientProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    let query = supabase.from("profiles").select("*").eq("role", "CLIENT").order("full_name");
    if (search.trim()) query = query.ilike("full_name", `%${search}%`);
    const { data } = await query;
    setClients((data as ClientProfile[]) ?? []);
    setLoading(false);
  }, [search]);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  const openClient = async (client: ClientProfile) => {
    setSelected(client);
    setLoadingProjects(true);
    const { data } = await supabase
      .from("projects")
      .select("id, title, status, target_date")
      .eq("client_id", client.id)
      .order("updated_at", { ascending: false });
    setClientProjects((data as Project[]) ?? []);
    setLoadingProjects(false);
  };

  return (
    <PortalLayout variant="admin">
      {selected ? (
        <>
          <div className="mb-6 flex items-center gap-3">
            <button onClick={() => setSelected(null)} className="text-portal-text-muted hover:text-portal-text text-sm flex items-center gap-1">
              ← Back to Clients
            </button>
          </div>
          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold text-portal-text">{selected.full_name ?? "Unnamed Client"}</h1>
            {selected.company && <p className="mt-1 text-portal-text-muted flex items-center gap-1.5"><Building2 size={14} /> {selected.company}</p>}
          </div>

          <div className="grid gap-4 md:grid-cols-2 mb-8">
            {[
              { label: "Phone", value: selected.phone ?? "—" },
              { label: "Member Since", value: new Date(selected.created_at).toLocaleDateString() },
            ].map((f) => (
              <div key={f.label} className="rounded-xl border border-portal-border bg-portal-surface p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-portal-text-muted">{f.label}</p>
                <p className="mt-1 text-portal-text">{f.value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-portal-border bg-portal-surface overflow-hidden">
            <div className="px-4 py-3 border-b border-portal-border flex items-center gap-2">
              <FolderOpen size={16} className="text-portal-text-muted" />
              <span className="font-semibold text-portal-text text-sm">Projects ({clientProjects.length})</span>
            </div>
            {loadingProjects ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-portal-accent border-t-transparent" />
              </div>
            ) : clientProjects.length === 0 ? (
              <div className="py-10 text-center text-portal-text-muted text-sm">No projects yet.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-portal-border">
                    {["Title", "Status", "Target Date"].map((h) => (
                      <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-portal-text-muted">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-portal-border">
                  {clientProjects.map((p) => (
                    <tr key={p.id} className="hover:bg-portal-surface-hover transition-colors">
                      <td className="px-4 py-3 font-medium text-portal-text">{p.title}</td>
                      <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                      <td className="px-4 py-3 text-portal-text-muted text-xs">
                        {p.target_date ? new Date(p.target_date).toLocaleDateString() : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      ) : (
        <>
          <PageHeader title="Clients" subtitle="All registered client accounts" />

          <div className="mb-4 relative w-full max-w-xs">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-portal-text-muted" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search clients…"
              className="pl-9 bg-portal-surface border-portal-border text-portal-text placeholder:text-portal-text-muted" />
          </div>

          <div className="rounded-xl border border-portal-border bg-portal-surface overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-portal-accent border-t-transparent" />
              </div>
            ) : clients.length === 0 ? (
              <div className="py-16 text-center">
                <p className="font-medium text-portal-text">No clients yet</p>
                <p className="mt-1 text-sm text-portal-text-muted">Clients who register will appear here.</p>
              </div>
            ) : (
              <div className="divide-y divide-portal-border">
                {clients.map((client) => (
                  <button key={client.id} onClick={() => openClient(client)}
                    className="w-full flex items-center justify-between px-4 py-4 hover:bg-portal-surface-hover transition-colors text-left">
                    <div>
                      <p className="font-medium text-portal-text">{client.full_name ?? "Unnamed"}</p>
                      {client.company && (
                        <p className="text-xs text-portal-text-muted flex items-center gap-1 mt-0.5">
                          <Building2 size={11} /> {client.company}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-portal-text-muted">
                        {new Date(client.created_at).toLocaleDateString()}
                      </span>
                      <ChevronRight size={16} className="text-portal-text-muted" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </PortalLayout>
  );
}
