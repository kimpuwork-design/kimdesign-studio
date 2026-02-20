import { useEffect, useState } from "react";
import { PortalLayout } from "@/components/PortalLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Briefcase, Clock, XCircle, PackageOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Project {
  id: string;
  title: string;
  status: string;
}

export default function StaffDashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [awaitingReview, setAwaitingReview] = useState(0);
  const [rejected, setRejected] = useState(0);

  useEffect(() => {
    if (!profile) return;

    // Load assigned projects
    supabase
      .from("project_members")
      .select("project_id, projects(id, title, status)")
      .eq("user_id", profile.id)
      .then(({ data }) => {
        const projs = (data ?? []).map((m: any) => m.projects).filter(Boolean) as Project[];
        setProjects(projs);

        if (projs.length === 0) return;
        const ids = projs.map((p) => p.id);

        // Count deliverables needing attention
        supabase
          .from("deliverables")
          .select("id, status")
          .in("project_id", ids)
          .then(({ data: dels }) => {
            setAwaitingReview((dels ?? []).filter((d: any) => d.status === "submitted").length);
            setRejected((dels ?? []).filter((d: any) => d.status === "rejected").length);
          });
      });
  }, [profile]);

  const activeCount = projects.filter((p) => p.status === "active").length;

  return (
    <PortalLayout variant="staff">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-portal-text">Staff Dashboard</h1>
        <p className="mt-1 text-portal-text-muted">Welcome back, {profile?.full_name?.split(" ")[0]}.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {[
          { icon: Briefcase, label: "Assigned Projects", value: projects.length, color: "text-blue-400" },
          { icon: Clock, label: "Active", value: activeCount, color: "text-yellow-400" },
          { icon: PackageOpen, label: "Awaiting Review", value: awaitingReview, color: "text-portal-text-muted" },
          { icon: XCircle, label: "Rejected", value: rejected, color: "text-destructive", alert: rejected > 0 },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className={`rounded-xl border bg-portal-surface p-5 ${s.alert ? "border-destructive/40" : "border-portal-border"}`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium uppercase tracking-wider text-portal-text-muted">{s.label}</span>
                <Icon size={16} className={s.color} />
              </div>
              <p className={`font-display text-3xl font-bold ${s.alert ? "text-destructive" : "text-portal-text"}`}>{s.value}</p>
            </div>
          );
        })}
      </div>

      {projects.length > 0 && (
        <div className="rounded-xl border border-portal-border bg-portal-surface p-6">
          <h2 className="font-display text-lg font-semibold text-portal-text mb-4">My Projects</h2>
          <div className="space-y-2">
            {projects.map((p) => (
              <button key={p.id} onClick={() => navigate(`/staff/projects/${p.id}`)}
                className="w-full flex items-center justify-between rounded-lg border border-portal-border bg-portal-bg px-4 py-3 text-left hover:bg-portal-surface transition-colors">
                <span className="text-sm font-medium text-portal-text">{p.title}</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  p.status === "active" ? "bg-blue-400/15 text-blue-400" :
                  p.status === "delivered" ? "bg-green-500/15 text-green-500" :
                  "bg-portal-border text-portal-text-muted"
                }`}>{p.status}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </PortalLayout>
  );
}
