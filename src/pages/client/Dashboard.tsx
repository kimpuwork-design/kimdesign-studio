import { useEffect, useState } from "react";
import { PortalLayout } from "@/components/PortalLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { FolderOpen, Clock, CheckCircle, PackageOpen, FileText, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Project {
  id: string;
  title: string;
  status: string;
  updated_at: string;
}

const GRADIENT_COLORS = [
  "from-blue-500/20 to-blue-600/5",
  "from-yellow-500/20 to-amber-600/5",
  "from-green-500/20 to-emerald-600/5",
  "from-purple-500/20 to-violet-600/5",
];

export default function ClientDashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState(0);
  const [unpaidInvoices, setUnpaidInvoices] = useState(0);

  useEffect(() => {
    if (!profile) return;
    supabase
      .from("projects")
      .select("id, title, status, updated_at")
      .eq("client_id", profile.id)
      .order("updated_at", { ascending: false })
      .then(({ data }) => setProjects((data as Project[]) ?? []));

    supabase
      .from("deliverables")
      .select("id, project_id, projects!inner(client_id)")
      .eq("status", "submitted")
      .then(({ data }) => {
        const mine = (data ?? []).filter((d: any) => d.projects?.client_id === profile.id);
        setPendingApprovals(mine.length);
      });

    supabase
      .from("invoices")
      .select("id, project_id, projects!inner(client_id)")
      .eq("status", "sent")
      .then(({ data }) => {
        const mine = (data ?? []).filter((d: any) => d.projects?.client_id === profile.id);
        setUnpaidInvoices(mine.length);
      });
  }, [profile]);

  const activeCount = projects.filter((p) => p.status === "active").length;
  const completedCount = projects.filter((p) => p.status === "delivered").length;

  return (
    <PortalLayout variant="client">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-portal-text flex items-center gap-2">
          <Sparkles size={24} className="text-portal-accent" />
          <span className="gradient-text">Welcome back, {profile?.full_name?.split(" ")[0] ?? "there"}</span> 👋
        </h1>
        <p className="mt-1 text-portal-text-muted">Here's what's happening with your projects.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {[
          { icon: FolderOpen, label: "Active Projects", value: activeCount, color: "text-blue-400", gradient: GRADIENT_COLORS[0] },
          { icon: PackageOpen, label: "Pending Approvals", value: pendingApprovals, color: "text-yellow-400", gradient: GRADIENT_COLORS[1], alert: pendingApprovals > 0 },
          { icon: CheckCircle, label: "Completed", value: completedCount, color: "text-green-400", gradient: GRADIENT_COLORS[2] },
          { icon: FileText, label: "Unpaid Invoices", value: unpaidInvoices, color: "text-purple-400", gradient: GRADIENT_COLORS[3], alert: unpaidInvoices > 0 },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="glass-card glass-card-hover group relative overflow-hidden p-5">
              <div className={`absolute inset-0 bg-gradient-to-br ${s.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium uppercase tracking-wider text-portal-text-muted">{s.label}</span>
                  <div className={`rounded-lg p-1.5 bg-gradient-to-br ${s.gradient}`}>
                    <Icon size={16} className={s.color} />
                  </div>
                </div>
                <p className={`font-display text-3xl font-bold ${s.alert ? "text-yellow-400" : "text-portal-text"}`}>{s.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="glass-card p-6">
        <h2 className="font-display text-lg font-semibold text-portal-text mb-4">Recent Projects</h2>
        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-portal-text-muted">
            <FolderOpen size={40} className="mb-3 opacity-30" />
            <p className="text-sm">No projects yet. Your studio will add one soon.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {projects.slice(0, 5).map((p) => (
              <button key={p.id} onClick={() => navigate(`/app/projects/${p.id}`)}
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
        )}
      </div>
    </PortalLayout>
  );
}
