import { useEffect, useState, useCallback } from "react";
import { PortalLayout } from "@/components/PortalLayout";
import { PageHeader } from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { writeAuditLog } from "@/lib/audit";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Search, Shield, Briefcase, User, Mail, Phone, Building2,
  Pencil, X, Check, Loader2, UserPlus,
} from "lucide-react";

interface TeamMember {
  id: string;
  full_name: string | null;
  company: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: "ADMIN" | "STAFF" | "CLIENT";
  created_at: string;
}

const ROLE_ICONS: Record<string, any> = { ADMIN: Shield, STAFF: Briefcase, CLIENT: User };
const ROLE_COLORS: Record<string, string> = {
  ADMIN: "text-red-400 bg-red-400/10",
  STAFF: "text-[#1a365d] bg-[#1a365d]/10",
  CLIENT: "text-green-400 bg-green-400/10",
};

export default function AdminTeam() {
  const { profile: adminProfile } = useAuth();
  const { toast } = useToast();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<TeamMember>>({});
  const [saving, setSaving] = useState(false);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("profiles")
      .select("*")
      .in("role", ["ADMIN", "STAFF"])
      .order("role")
      .order("full_name");
    if (search.trim()) query = query.ilike("full_name", `%${search}%`);
    const { data } = await query;
    setMembers((data as TeamMember[]) ?? []);
    setLoading(false);
  }, [search]);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  const startEdit = (m: TeamMember) => {
    setEditing(m.id);
    setEditForm({ full_name: m.full_name, phone: m.phone, company: m.company, role: m.role });
  };

  const cancelEdit = () => { setEditing(null); setEditForm({}); };

  const saveEdit = async (id: string) => {
    if (!adminProfile) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: editForm.full_name,
        phone: editForm.phone,
        company: editForm.company,
        role: editForm.role,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    setSaving(false);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
      return;
    }
    await writeAuditLog({ actor_id: adminProfile.id, action: "update_team_member", entity_type: "profile", entity_id: id });
    toast({ title: "Team member updated ✓" });
    setEditing(null);
    fetchMembers();
  };

  const initials = (name: string | null) =>
    (name ?? "?").split(" ").map((s) => s[0]).join("").toUpperCase().slice(0, 2);

  return (
    <PortalLayout variant="admin">
      <PageHeader title="Team" subtitle="Manage staff, admins, and roles" />

      <div className="mb-4 relative w-full max-w-xs">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-portal-text-muted" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search team…"
          className="pl-9 bg-portal-bg/50 backdrop-blur-sm border-portal-border text-portal-text placeholder:text-portal-text-muted"
        />
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-portal-accent border-t-transparent" />
          </div>
        ) : members.length === 0 ? (
          <div className="glass-card py-16 text-center">
            <UserPlus size={48} className="mx-auto mb-4 text-portal-text-muted/30" />
            <p className="font-medium text-portal-text">No team members found</p>
            <p className="mt-1 text-sm text-portal-text-muted">Register users with STAFF or ADMIN roles.</p>
          </div>
        ) : (
          members.map((m) => {
            const isEditing = editing === m.id;
            const RoleIcon = ROLE_ICONS[m.role] ?? User;
            const roleColor = ROLE_COLORS[m.role] ?? "text-portal-text-muted bg-portal-surface";
            return (
              <div
                key={m.id}
                className="glass-card glass-card-hover p-4"
              >
                {isEditing ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                      <Avatar className="h-10 w-10">
                        {m.avatar_url && <AvatarImage src={m.avatar_url} />}
                        <AvatarFallback className="bg-portal-accent/20 text-portal-accent text-xs font-semibold">
                          {initials(m.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-display text-lg font-semibold text-portal-text">Edit Member</span>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <Label className="text-xs text-portal-text-muted">Full Name</Label>
                        <Input
                          value={editForm.full_name ?? ""}
                          onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
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
                      <div className="space-y-1">
                        <Label className="text-xs text-portal-text-muted">Company</Label>
                        <Input
                          value={editForm.company ?? ""}
                          onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                          className="bg-portal-bg border-portal-border text-portal-text"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-portal-text-muted">Role</Label>
                        <select
                          value={editForm.role ?? "STAFF"}
                          onChange={(e) => setEditForm({ ...editForm, role: e.target.value as any })}
                          className="w-full rounded-md border border-portal-border bg-portal-bg px-3 py-2 text-sm text-portal-text"
                        >
                          <option value="ADMIN">Admin</option>
                          <option value="STAFF">Staff</option>
                          <option value="CLIENT">Client</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Button size="sm" onClick={() => saveEdit(m.id)} disabled={saving} className="bg-portal-accent text-portal-accent-foreground hover:bg-portal-accent/90">
                        {saving ? <Loader2 size={14} className="animate-spin mr-1" /> : <Check size={14} className="mr-1" />}
                        Save
                      </Button>
                      <Button size="sm" variant="ghost" onClick={cancelEdit} className="text-portal-text-muted">
                        <X size={14} className="mr-1" /> Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10">
                      {m.avatar_url && <AvatarImage src={m.avatar_url} />}
                      <AvatarFallback className="bg-portal-accent/20 text-portal-accent text-xs font-semibold">
                        {initials(m.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-portal-text truncate">{m.full_name ?? "Unnamed"}</p>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-portal-text-muted">
                        {m.company && <span className="flex items-center gap-1"><Building2 size={11} />{m.company}</span>}
                        {m.phone && <span className="flex items-center gap-1"><Phone size={11} />{m.phone}</span>}
                      </div>
                    </div>
                    <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${roleColor}`}>
                      <RoleIcon size={12} />
                      {m.role}
                    </span>
                    <button
                      onClick={() => startEdit(m)}
                      className="rounded-lg p-2 text-portal-text-muted hover:bg-portal-surface-hover hover:text-portal-text transition-colors"
                    >
                      <Pencil size={14} />
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </PortalLayout>
  );
}
