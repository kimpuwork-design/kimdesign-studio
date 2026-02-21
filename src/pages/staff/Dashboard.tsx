import { useEffect, useState } from "react";
import { PortalLayout } from "@/components/PortalLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Briefcase, Clock, XCircle, PackageOpen, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Project {
  id: string;
  title: string;
  status: string;
}

const GRADIENT_COLORS = [
  "from-blue-500/20 to-blue-600/5",
  "from-yellow-500/20 to-amber-600/5",
  "from-zinc-500/20 to-zinc-600/5",
  "from-red-500/20 to-rose-600/5",
];

export default function StaffDashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [awaitingReview, setAwaitingReview] = useState(0);
  const [rejected, setRejected] = useState(0);

  useEffect(() => {
    if (!profile) return;
    supabase
      .from("project_members")
      .select("project_id, projects(id, title, status)")
      .eq("user_id", profile.id)
      .then(({ data }) => {
        const projs = (data ?? []).map((m: any) => m.projects).filter(Boolean) as Project[];
        setProjects(projs);
        if (projs.length === 0) return;
        const ids = projs.map((p) => p.id);
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
        <h1 className="font-display text-3xl font-bold text-portal-text flex items-center gap-2">
          <Sparkles size={24} className="text-portal-accent" />
          <span className="gradient-text">Staff Dashboard</span>
        </h1>
        <p className="mt-1 text-portal-text-muted">Welcome back, {profile?.full_name?.split(" ")[0]}.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {[
          { icon: Briefcase, label: "Assigned Projects", value: projects.length, color: "text-blue-400", gradient: GRADIENT_COLORS[0] },
          { icon: Clock, label: "Active", value: activeCount, color: "text-yellow-400", gradient: GRADIENT_COLORS[1] },
          { icon: PackageOpen, label: "Awaiting Review", value: awaitingReview, color: "text-portal-text-muted", gradient: GRADIENT_COLORS[2] },
          { icon: XCircle, label: "Rejected", value: rejected, color: "text-destructive", gradient: GRADIENT_COLORS[3], alert: rejected > 0 },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className={`glass-card glass-card-hover group relative overflow-hidden p-5 ${s.alert ? "border-destructive/40" : ""}`}>
              <div className={`absolute inset-0 bg-gradient-to-br ${s.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium uppercase tracking-wider text-portal-text-muted">{s.label}</span>
                  <div className={`rounded-lg p-1.5 bg-gradient-to-br ${s.gradient}`}>
                    <Icon size={16} className={s.color} />
                  </div>
                </div>
                <p className={`font-display text-3xl font-bold ${s.alert ? "text-destructive" : "text-portal-text"}`}>{s.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {projects.length > 0 && (
        <div className="glass-card p-6">
          <h2 className="font-display text-lg font-semibold text-portal-text mb-4">My Projects</h2>
          <div className="space-y-2">
            {projects.map((p) => (
              <button key={p.id} onClick={() => navigate(`/staff/projects/${p.id}`)}
                className="w-full flex items-center justify-between glass-card-hover rounded-lg px-4 py-3 text-left transition-all duration-200">
                <span className="text-sm font-medium text-portal-text">{p.title}</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full backdrop-blur-sm ${
                  p.status === "active" ? "bg-blue-400/15 text-blue-400 border border-blue-400/20" :
                  p.status === "delivered" ? "bg-green-500/15 text-green-500 border border-green-500/20" :
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
