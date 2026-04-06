import { useEffect, useState } from "react";
import { PortalLayout } from "@/components/PortalLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Briefcase, Clock, XCircle, PackageOpen, Sparkles, CalendarDays, ArrowRight, ArrowUpRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { format } from "date-fns";
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

const luxuryEase = [0.22, 1, 0.36, 1];

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

        const now = new Date();
        const twoWeeks = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
        setDeadlineProjects(
          projs.filter((p) => p.target_date && new Date(p.target_date) >= now && new Date(p.target_date) <= twoWeeks && !["archived", "delivered"].includes(p.status))
            .sort((a, b) => new Date(a.target_date!).getTime() - new Date(b.target_date!).getTime())
        );

        if (projs.length === 0) return;
        const ids = projs.map((p) => p.id);

        supabase.from("deliverables").select("id, status").in("project_id", ids).then(({ data: dels }) => {
          setAwaitingReview((dels ?? []).filter((d: any) => d.status === "submitted").length);
          setRejected((dels ?? []).filter((d: any) => d.status === "rejected").length);
        });

        supabase.from("deliverables").select("id, title, status, project_id, updated_at, project:project_id(title)")
          .in("project_id", ids).order("updated_at", { ascending: false }).limit(5)
          .then(({ data: dels }) => setRecentDeliverables((dels as unknown as RecentDeliverable[]) ?? []));
      });
  }, [profile]);

  const activeCount = projects.filter((p) => p.status === "active").length;

  const stats = [
    { icon: Briefcase, label: "Assigned", value: projects.length },
    { icon: Clock, label: "Active", value: activeCount },
    { icon: PackageOpen, label: "Awaiting Review", value: awaitingReview },
    { icon: XCircle, label: "Rejected", value: rejected, alert: rejected > 0 },
  ];

  const STATUS_MAP: Record<string, string> = {
    active: "text-primary bg-primary/10 border-primary/20",
    delivered: "text-chart-3 bg-chart-3/10 border-chart-3/20",
    review: "text-chart-4 bg-chart-4/10 border-chart-4/20",
  };

  return (
    <PortalLayout variant="staff">
      {/* ── Header ── */}
      <div className="mb-8 md:mb-10 flex items-center gap-3 md:gap-4">
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: luxuryEase }}
          className="h-11 w-11 md:h-13 md:w-13 bg-portal-accent flex items-center justify-center shadow-[0_8px_30px_-8px_hsl(var(--portal-accent)/0.4)]"
        >
          <Sparkles size={18} className="md:w-5 md:h-5 text-portal-accent-foreground" />
        </motion.div>
        <div>
          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5, ease: luxuryEase }}
            className="font-display text-xl md:text-3xl font-bold text-portal-text tracking-tight"
          >
            <span className="gradient-text">{getGreeting()}, {profile?.full_name?.split(" ")[0]}</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-xs md:text-sm text-portal-text-muted mt-1 font-light tracking-wide"
          >
            Workspace overview · {format(new Date(), "EEEE, MMMM d")}
          </motion.p>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-8 md:mb-10">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.5, ease: luxuryEase }}
              className={`group relative overflow-hidden border bg-portal-surface/20 backdrop-blur-sm p-5 hover:bg-portal-surface/40 transition-all duration-500 ${s.alert ? "border-destructive/30" : "border-portal-border/40"}`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-portal-accent/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-portal-text-muted">{s.label}</p>
                  <div className="p-1.5 bg-portal-accent/10 border border-portal-accent/15">
                    <Icon size={14} className="text-portal-accent" />
                  </div>
                </div>
                <p className={`font-display text-3xl font-bold tracking-tight ${s.alert ? "text-destructive" : "text-portal-text"}`}>{s.value}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid gap-4 md:gap-5 lg:grid-cols-2">
        {/* ── My Projects ── */}
        {projects.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, ease: luxuryEase }}
            className="border border-portal-border/40 bg-portal-surface/15 backdrop-blur-sm p-6"
          >
            <h2 className="font-display text-sm font-semibold text-portal-text mb-5 tracking-tight flex items-center gap-2">
              <Briefcase size={14} className="text-portal-accent" /> My Projects
            </h2>
            <div className="space-y-1">
              {projects.map((p) => (
                <button key={p.id} onClick={() => navigate(`/staff/projects/${p.id}`)}
                  className="w-full flex items-center justify-between px-3 py-3 text-left hover:bg-portal-surface/40 transition-all duration-300 group">
                  <span className="text-sm font-medium text-portal-text group-hover:text-portal-accent transition-colors tracking-wide">{p.title}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-semibold px-2 py-0.5 border uppercase tracking-[0.1em] ${STATUS_MAP[p.status] || "bg-portal-surface text-portal-text-muted border-portal-border/30"}`}>
                      {p.status}
                    </span>
                    <ArrowUpRight size={11} className="text-portal-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Recent Deliverables ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, ease: luxuryEase }}
          className="border border-portal-border/40 bg-portal-surface/15 backdrop-blur-sm p-6"
        >
          <h2 className="font-display text-sm font-semibold text-portal-text mb-5 tracking-tight flex items-center gap-2">
            <PackageOpen size={14} className="text-portal-accent" /> Recent Deliverables
          </h2>
          {recentDeliverables.length === 0 ? (
            <p className="text-xs text-portal-text-muted py-6 text-center font-light tracking-wide">No deliverables yet</p>
          ) : (
            <div className="space-y-1">
              {recentDeliverables.map((d) => (
                <button key={d.id} onClick={() => navigate(`/staff/projects/${d.project_id}?tab=deliverables`)}
                  className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-portal-surface/40 transition-all duration-300 text-left group">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-portal-text truncate group-hover:text-portal-accent transition-colors">{d.title}</p>
                    <p className="text-[10px] text-portal-text-muted/60 truncate mt-0.5 font-mono">{d.project?.title}</p>
                  </div>
                  <DeliverableStatusBadge status={d.status} />
                </button>
              ))}
            </div>
          )}
        </motion.div>

        {/* ── Upcoming Deadlines ── */}
        {deadlineProjects.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, ease: luxuryEase }}
            className="border border-portal-border/40 bg-portal-surface/15 backdrop-blur-sm p-6 lg:col-span-2"
          >
            <h2 className="font-display text-sm font-semibold text-portal-text mb-5 tracking-tight flex items-center gap-2">
              <CalendarDays size={14} className="text-portal-accent" /> Upcoming Deadlines
            </h2>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {deadlineProjects.map((p) => {
                const days = getDaysLeft(p.target_date!);
                const urgent = days <= 3;
                return (
                  <button key={p.id} onClick={() => navigate(`/staff/projects/${p.id}`)}
                    className={`flex items-center gap-3 px-4 py-3 border transition-all duration-300 text-left group ${
                      urgent ? "border-destructive/30 bg-destructive/5 hover:border-destructive/50" : "border-portal-border/40 hover:border-portal-accent/30 hover:bg-portal-surface/30"
                    }`}>
                    <div className={`p-1.5 ${urgent ? "bg-destructive/15 text-destructive" : "bg-portal-accent/10 text-portal-accent"}`}>
                      <CalendarDays size={14} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-portal-text truncate">{p.title}</p>
                      <p className={`text-xs font-mono ${urgent ? "text-destructive" : "text-portal-text-muted"}`}>
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
