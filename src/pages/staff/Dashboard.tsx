import { useEffect, useState } from "react";
import { PortalLayout } from "@/components/PortalLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Briefcase, Clock, XCircle, PackageOpen, Sparkles, CalendarDays, ArrowRight, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { DeliverableStatusBadge } from "@/components/deliverables/DeliverableStatusBadge";

interface Project {
  id: string;
  title: string;
  status: string;
  target_date: string | null;
}

interface RecentDeliverable {
  id: string;
  title: string;
  status: string;
  project_id: string;
  updated_at: string;
  project?: { title: string } | null;
}

const GRADIENT_COLORS = [
  "from-blue-500/20 to-blue-600/5",
  "from-yellow-500/20 to-amber-600/5",
  "from-zinc-500/20 to-zinc-600/5",
  "from-red-500/20 to-rose-600/5",
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function getDaysLeft(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export default function StaffDashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [awaitingReview, setAwaitingReview] = useState(0);
  const [rejected, setRejected] = useState(0);
  const [recentDeliverables, setRecentDeliverables] = useState<RecentDeliverable[]>([]);
  const [deadlineProjects, setDeadlineProjects] = useState<Project[]>([]);

  useEffect(() => {
    if (!profile) return;
    supabase
      .from("project_members")
      .select("project_id, projects(id, title, status, target_date)")
      .eq("user_id", profile.id)
      .then(({ data }) => {
        const projs = (data ?? []).map((m: any) => m.projects).filter(Boolean) as Project[];
        setProjects(projs);

        // Deadlines within 14 days
        const now = new Date();
        const twoWeeks = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
        setDeadlineProjects(
          projs.filter((p) => p.target_date && new Date(p.target_date) >= now && new Date(p.target_date) <= twoWeeks && !["archived", "delivered"].includes(p.status))
            .sort((a, b) => new Date(a.target_date!).getTime() - new Date(b.target_date!).getTime())
        );

        if (projs.length === 0) return;
        const ids = projs.map((p) => p.id);

        // Deliverables stats
        supabase
          .from("deliverables")
          .select("id, status")
          .in("project_id", ids)
          .then(({ data: dels }) => {
            setAwaitingReview((dels ?? []).filter((d: any) => d.status === "submitted").length);
            setRejected((dels ?? []).filter((d: any) => d.status === "rejected").length);
          });

        // Recent deliverables
        supabase
          .from("deliverables")
          .select("id, title, status, project_id, updated_at, project:project_id(title)")
          .in("project_id", ids)
          .order("updated_at", { ascending: false })
          .limit(5)
          .then(({ data: dels }) => {
            setRecentDeliverables((dels as unknown as RecentDeliverable[]) ?? []);
          });
      });
  }, [profile]);

  const activeCount = projects.filter((p) => p.status === "active").length;

  const stats = [
    { icon: Briefcase, label: "Assigned Projects", value: projects.length, color: "text-blue-400", gradient: GRADIENT_COLORS[0] },
    { icon: Clock, label: "Active", value: activeCount, color: "text-yellow-400", gradient: GRADIENT_COLORS[1] },
    { icon: PackageOpen, label: "Awaiting Review", value: awaitingReview, color: "text-portal-text-muted", gradient: GRADIENT_COLORS[2] },
    { icon: XCircle, label: "Rejected", value: rejected, color: "text-destructive", gradient: GRADIENT_COLORS[3], alert: rejected > 0 },
  ];

  return (
    <PortalLayout variant="staff">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-8">
        <h1 className="font-display text-3xl font-bold text-portal-text flex items-center gap-2">
          <Sparkles size={24} className="text-portal-accent" />
          <span className="gradient-text">{getGreeting()}, {profile?.full_name?.split(" ")[0]}</span>
        </h1>
        <p className="mt-1 text-portal-text-muted">Here's your workspace overview.</p>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              className={`glass-card glass-card-hover group relative overflow-hidden p-5 ${s.alert ? "border-destructive/40" : ""}`}
            >
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
            </motion.div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* My Projects */}
        {projects.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-6">
            <h2 className="font-display text-lg font-semibold text-portal-text mb-4 flex items-center gap-2">
              <Briefcase size={16} className="text-portal-accent" /> My Projects
            </h2>
            <div className="space-y-2">
              {projects.map((p) => (
                <button key={p.id} onClick={() => navigate(`/staff/projects/${p.id}`)}
                  className="w-full flex items-center justify-between glass-card-hover rounded-lg px-4 py-3 text-left transition-all duration-200 group">
                  <span className="text-sm font-medium text-portal-text group-hover:text-portal-accent transition-colors">{p.title}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full backdrop-blur-sm ${
                      p.status === "active" ? "bg-blue-400/15 text-blue-400 border border-blue-400/20" :
                      p.status === "delivered" ? "bg-green-500/15 text-green-500 border border-green-500/20" :
                      "bg-portal-border text-portal-text-muted"
                    }`}>{p.status}</span>
                    <ArrowRight size={12} className="text-portal-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Recent Deliverables */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card p-6">
          <h2 className="font-display text-lg font-semibold text-portal-text mb-4 flex items-center gap-2">
            <PackageOpen size={16} className="text-portal-accent" /> Recent Deliverables
          </h2>
          {recentDeliverables.length === 0 ? (
            <p className="text-sm text-portal-text-muted py-4 text-center">No deliverables yet</p>
          ) : (
            <div className="space-y-2">
              {recentDeliverables.map((d) => (
                <button key={d.id} onClick={() => navigate(`/staff/projects/${d.project_id}?tab=deliverables`)}
                  className="w-full flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-portal-bg/50 transition-colors text-left group">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-portal-text truncate group-hover:text-portal-accent transition-colors">{d.title}</p>
                    <p className="text-xs text-portal-text-muted truncate">{d.project?.title}</p>
                  </div>
                  <DeliverableStatusBadge status={d.status} />
                </button>
              ))}
            </div>
          )}
        </motion.div>

        {/* Upcoming Deadlines */}
        {deadlineProjects.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-card p-6 lg:col-span-2">
            <h2 className="font-display text-lg font-semibold text-portal-text mb-4 flex items-center gap-2">
              <CalendarDays size={16} className="text-amber-400" /> Upcoming Deadlines
            </h2>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {deadlineProjects.map((p) => {
                const days = getDaysLeft(p.target_date!);
                const urgent = days <= 3;
                return (
                  <button key={p.id} onClick={() => navigate(`/staff/projects/${p.id}`)}
                    className={`flex items-center gap-3 rounded-lg px-4 py-3 border transition-all text-left group ${
                      urgent ? "border-destructive/30 bg-destructive/5 hover:border-destructive/50" : "border-portal-border hover:border-portal-accent/40"
                    }`}>
                    <div className={`rounded-full p-1.5 ${urgent ? "bg-destructive/15 text-destructive" : "bg-portal-accent/15 text-portal-accent"}`}>
                      <CalendarDays size={14} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-portal-text truncate">{p.title}</p>
                      <p className={`text-xs ${urgent ? "text-destructive" : "text-portal-text-muted"}`}>
                        {days === 0 ? "Due today" : days === 1 ? "Due tomorrow" : `${days} days left`}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>
    </PortalLayout>
  );
}
