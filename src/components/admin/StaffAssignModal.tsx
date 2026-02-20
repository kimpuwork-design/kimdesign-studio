import { useState, useEffect } from "react";
import { X, UserPlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { writeAuditLog } from "@/lib/audit";
import { useAuth } from "@/contexts/AuthContext";

interface StaffProfile {
  id: string;
  full_name: string | null;
}

interface MemberRow {
  id: string;
  user_id: string;
  member_role: string;
  profiles: StaffProfile | null;
}

interface StaffAssignModalProps {
  projectId: string;
  projectTitle: string;
  onClose: () => void;
}

export function StaffAssignModal({ projectId, projectTitle, onClose }: StaffAssignModalProps) {
  const { profile } = useAuth();
  const [staffList, setStaffList] = useState<StaffProfile[]>([]);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    const [{ data: allStaff }, { data: currentMembers }] = await Promise.all([
      supabase.from("profiles").select("id, full_name").eq("role", "STAFF").order("full_name"),
      supabase.from("project_members").select("id, user_id, member_role, profiles(id, full_name)")
        .eq("project_id", projectId),
    ]);
    setStaffList((allStaff as StaffProfile[]) ?? []);
    setMembers((currentMembers as unknown as MemberRow[]) ?? []);
  };

  useEffect(() => { fetchData(); }, [projectId]);

  const assignedStaffIds = new Set(
    members.filter((m) => m.member_role === "STAFF").map((m) => m.user_id)
  );

  const handleAdd = async (staffId: string, name: string | null) => {
    setLoading(true);
    await supabase.from("project_members").insert([{
      project_id: projectId, user_id: staffId, member_role: "STAFF",
    }]);
    if (profile) await writeAuditLog({
      actor_id: profile.id, action: "staff_assigned", entity_type: "project",
      entity_id: projectId, metadata: { staff_id: staffId, staff_name: name ?? "" },
    });
    await fetchData();
    setLoading(false);
  };

  const handleRemove = async (memberId: string, staffId: string) => {
    setLoading(true);
    await supabase.from("project_members").delete().eq("id", memberId);
    if (profile) await writeAuditLog({
      actor_id: profile.id, action: "staff_unassigned", entity_type: "project",
      entity_id: projectId, metadata: { staff_id: staffId },
    });
    await fetchData();
    setLoading(false);
  };

  const assignedMembers = members.filter((m) => m.member_role === "STAFF");
  const availableStaff = staffList.filter((s) => !assignedStaffIds.has(s.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-xl border border-portal-border bg-portal-surface max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-portal-border px-6 py-4">
          <div>
            <h2 className="font-display text-lg font-bold text-portal-text">Assign Staff</h2>
            <p className="text-xs text-portal-text-muted truncate">{projectTitle}</p>
          </div>
          <button onClick={onClose} className="rounded p-1 text-portal-text-muted hover:text-portal-text"><X size={18} /></button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-5">
          {/* Currently assigned */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-portal-text-muted mb-3">Currently Assigned</p>
            {assignedMembers.length === 0 ? (
              <p className="text-sm text-portal-text-muted">No staff assigned yet.</p>
            ) : (
              <div className="space-y-2">
                {assignedMembers.map((m) => (
                  <div key={m.id} className="flex items-center justify-between rounded-lg border border-portal-border bg-portal-bg px-3 py-2">
                    <span className="text-sm text-portal-text">{m.profiles?.full_name ?? "Unknown"}</span>
                    <button onClick={() => handleRemove(m.id, m.user_id)} disabled={loading}
                      className="rounded p-1 text-portal-text-muted hover:text-destructive transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Available staff */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-portal-text-muted mb-3">Add Staff</p>
            {availableStaff.length === 0 ? (
              <p className="text-sm text-portal-text-muted">All staff members are assigned.</p>
            ) : (
              <div className="space-y-2">
                {availableStaff.map((s) => (
                  <div key={s.id} className="flex items-center justify-between rounded-lg border border-portal-border bg-portal-bg px-3 py-2">
                    <span className="text-sm text-portal-text">{s.full_name ?? "Unnamed"}</span>
                    <Button size="sm" disabled={loading} onClick={() => handleAdd(s.id, s.full_name)}
                      className="h-7 bg-portal-accent/20 text-portal-accent hover:bg-portal-accent/30 border border-portal-accent/30 text-xs">
                      <UserPlus size={12} className="mr-1" /> Assign
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-portal-border p-4">
          <Button onClick={onClose} variant="outline" className="w-full border-portal-border text-portal-text-muted">Done</Button>
        </div>
      </div>
    </div>
  );
}
