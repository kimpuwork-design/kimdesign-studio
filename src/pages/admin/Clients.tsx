import { useEffect, useState, useCallback } from "react";
import { PortalLayout } from "@/components/PortalLayout";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { writeAuditLog } from "@/lib/audit";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Search, ChevronRight, Building2, FolderOpen, Phone, Calendar,
  Pencil, X, Check, Loader2, User,
} from "lucide-react";

interface ClientProfile {
  id: string;
  full_name: string | null;
  company: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: string;
  created_at: string;
}

interface Project {
  id: string;
  title: string;
  status: string;
  target_date: string | null;
}

export default function AdminClients() {
  const { profile: adminProfile } = useAuth();
  const { toast } = useToast();
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<ClientProfile | null>(null);
  const [clientProjects, setClientProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<ClientProfile>>({});
  const [saving, setSaving] = useState(false);

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
    setEditing(false);
    setLoadingProjects(true);
    const { data } = await supabase
      .from("projects")
      .select("id, title, status, target_date")
      .eq("client_id", client.id)
      .order("updated_at", { ascending: false });
    setClientProjects((data as Project[]) ?? []);
    setLoadingProjects(false);
  };

  const startEdit = () => {
    if (!selected) return;
    setEditing(true);
    setEditForm({
      full_name: selected.full_name,
      phone: selected.phone,
      company: selected.company,
    });
  };

  const cancelEdit = () => { setEditing(false); setEditForm({}); };

  const saveEdit = async () => {
    if (!selected || !adminProfile) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: editForm.full_name,
        phone: editForm.phone,
        company: editForm.company,
        updated_at: new Date().toISOString(),
      })
      .eq("id", selected.id);
    setSaving(false);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
      return;
    }
    await writeAuditLog({ actor_id: adminProfile.id, action: "update_client_profile", entity_type: "profile", entity_id: selected.id });
    toast({ title: "Client updated ✓" });
    const updated = { ...selected, ...editForm } as ClientProfile;
    setSelected(updated);
    setEditing(false);
    fetchClients();
  };

  const initials = (name: string | null) =>
    (name ?? "?").split(" ").map((s) => s[0]).join("").toUpperCase().slice(0, 2);

  return (
    <PortalLayout variant="admin">
      {selected ? (
        <>
          <div className="mb-6 flex items-center gap-3">
            <button onClick={() => { setSelected(null); setEditing(false); }} className="text-portal-text-muted hover:text-portal-text text-sm flex items-center gap-1">
              ← Back to Clients
            </button>
          </div>

          <div className="mb-8 flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14">
                {selected.avatar_url && <AvatarImage src={selected.avatar_url} />}
                <AvatarFallback className="bg-portal-accent/20 text-portal-accent text-lg font-semibold">
                  {initials(selected.full_name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="font-display text-3xl font-bold text-portal-text">{selected.full_name ?? "Unnamed Client"}</h1>
                {selected.company && <p className="mt-1 text-portal-text-muted flex items-center gap-1.5"><Building2 size={14} /> {selected.company}</p>}
              </div>
            </div>
            {!editing && (
              <Button size="sm" variant="outline" onClick={startEdit} className="border-portal-border text-portal-text-muted hover:text-portal-text">
                <Pencil size={14} className="mr-1.5" /> Edit Profile
              </Button>
            )}
          </div>

          {editing ? (
            <div className="glass-card p-5 mb-8 space-y-4 max-w-lg">
              <h2 className="font-display text-lg font-semibold text-portal-text">Edit Client Profile</h2>
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs text-portal-text-muted">Full Name</Label>
                  <Input
                    value={editForm.full_name ?? ""}
                    onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                    className="bg-portal-bg border-portal-border text-portal-text"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-portal-text-muted">Company</Label>
                  <Input
                    value={editForm.company ?? ""}
                    onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                    className="bg-portal-bg border-portal-border text-portal-text"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-portal-text-muted">Phone</Label>
                  <Input
                    value={editForm.phone ?? ""}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="bg-portal-bg border-portal-border text-portal-text"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <Button size="sm" onClick={saveEdit} disabled={saving} className="bg-portal-accent text-portal-accent-foreground hover:bg-portal-accent/90">
                  {saving ? <Loader2 size={14} className="animate-spin mr-1" /> : <Check size={14} className="mr-1" />}
                  Save
                </Button>
                <Button size="sm" variant="ghost" onClick={cancelEdit} className="text-portal-text-muted">
                  <X size={14} className="mr-1" /> Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-3 mb-8">
              {[
                { label: "Phone", value: selected.phone ?? "—", icon: Phone },
                { label: "Member Since", value: new Date(selected.created_at).toLocaleDateString(), icon: Calendar },
                { label: "Role", value: selected.role, icon: User },
              ].map((f) => {
                const Icon = f.icon;
                return (
                  <div key={f.label} className="glass-card p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon size={13} className="text-portal-text-muted" />
                      <p className="text-xs font-semibold uppercase tracking-wider text-portal-text-muted">{f.label}</p>
                    </div>
                    <p className="mt-1 text-portal-text font-medium">{f.value}</p>
                  </div>
                );
              })}
            </div>
          )}

          <div className="glass-card overflow-hidden">
            <div className="px-4 py-3 border-b border-portal-border/50 flex items-center gap-2">
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
              className="pl-9 bg-portal-bg/50 backdrop-blur-sm border-portal-border text-portal-text placeholder:text-portal-text-muted" />
          </div>

          <div className="glass-card overflow-hidden">
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
              <div className="divide-y divide-portal-border/50">
                {clients.map((client) => (
                  <button key={client.id} onClick={() => openClient(client)}
                    className="w-full flex items-center gap-3 px-4 py-4 hover:bg-portal-accent/5 transition-colors text-left">
                    <Avatar className="h-9 w-9">
                      {client.avatar_url && <AvatarImage src={client.avatar_url} />}
                      <AvatarFallback className="bg-portal-accent/10 text-portal-accent text-xs font-semibold">
                        {initials(client.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
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
