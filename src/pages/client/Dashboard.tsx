import { useEffect, useState } from "react";
import { PortalLayout } from "@/components/PortalLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { FolderOpen, CheckCircle, PackageOpen, FileText, ArrowRight, Bell, Zap, ArrowUpRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { format, formatDistanceToNow } from "date-fns";
import { ClientDashboardSkeleton } from "@/components/SkeletonScreens";

interface Project {
  id: string;
  title: string;
  status: string;
  updated_at: string;
  thumbnail_url: string | null;
  target_date: string | null;
}

interface Notification {
  id: string;
  title: string;
  body: string | null;
  type: string;
  link: string | null;
  created_at: string;
  is_read: boolean;
}

const luxuryEase = [0.22, 1, 0.36, 1] as const;

export default function ClientDashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState(0);
  const [unpaidInvoices, setUnpaidInvoices] = useState(0);
  const [recentNotifs, setRecentNotifs] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    setLoading(true);
    Promise.all([
      supabase.from("projects").select("id, title, status, updated_at, thumbnail_url, target_date").order("updated_at", { ascending: false }),
      supabase.from("deliverables").select("id, project_id, projects!inner(client_id)").eq("status", "submitted"),
      supabase.from("invoices").select("id, project_id, projects!inner(client_id)").eq("status", "sent"),
      supabase.from("notifications").select("*").eq("user_id", profile.id).eq("is_read", false).order("created_at", { ascending: false }).limit(5),
    ]).then(([projRes, delRes, invRes, notifRes]) => {
      setProjects((projRes.data as Project[]) ?? []);
      const myDels = (delRes.data ?? []).filter((d: any) => d.projects?.client_id === profile.id);
      setPendingApprovals(myDels.length);
      const myInvs = (invRes.data ?? []).filter((d: any) => d.projects?.client_id === profile.id);
      setUnpaidInvoices(myInvs.length);
      setRecentNotifs((notifRes.data as Notification[]) ?? []);
      setLoading(false);
    });
  }, [profile]);

  const activeCount = projects.filter((p) => p.status === "active" || p.status === "review").length;
  const completedCount = projects.filter((p) => p.status === "delivered").length;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  const statCards = [
    { icon: FolderOpen, label: "Active Projects", value: activeCount, href: "/app/projects" },
    { icon: PackageOpen, label: "Pending Review", value: pendingApprovals, alert: pendingApprovals > 0 },
    { icon: CheckCircle, label: "Completed", value: completedCount },
    { icon: FileText, label: "Unpaid Invoices", value: unpaidInvoices, alert: unpaidInvoices > 0 },
  ];

  const TYPE_ICONS: Record<string, string> = { message: "💬", deliverable: "📦", system: "🔔" };

  const STATUS_MAP: Record<string, string> = {
    active: "text-primary bg-primary/10 border-primary/20",
    delivered: "text-chart-3 bg-chart-3/10 border-chart-3/20",
    review: "text-chart-4 bg-chart-4/10 border-chart-4/20",
  };

  return (
    <PortalLayout variant="client">
      {loading ? (
        <ClientDashboardSkeleton />
      ) : (
      <>
      {/* ── Welcome Header ── */}
      <div className="mb-8 md:mb-10">
        <div className="flex items-center gap-3 md:gap-4">
          <motion.div 
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: luxuryEase }}
            className="h-11 w-11 md:h-13 md:w-13 bg-portal-accent flex items-center justify-center shadow-[0_8px_30px_-8px_hsl(var(--portal-accent)/0.4)]"
          >
            <Zap size={18} className="md:w-5 md:h-5 text-portal-accent-foreground" />
          </motion.div>
          <div>
            <motion.h1 
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5, ease: luxuryEase }}
              className="font-display text-xl md:text-3xl font-bold text-portal-text tracking-tight"
            >
              {greeting()}, <span className="gradient-text">{profile?.full_name?.split(" ")[0] ?? "there"}</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-xs md:text-sm text-portal-text-muted mt-1 hidden sm:block font-light tracking-wide whitespace-pre-line"
            >
              {"'''Do not make any visual modifications. The phrases I write are commands to understand what I want, not to be written down. Understand their content well, then execute what is required.'''\n                                        \n                                            \n                                            v"}
            </motion.p>
          </div>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-8 md:mb-10">
        {statCards.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.button
              key={s.label}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.5, ease: luxuryEase }}
              onClick={() => s.href && navigate(s.href)}
              className="group relative overflow-hidden border border-portal-border/40 bg-portal-surface/20 backdrop-blur-sm p-5 text-left hover:border-portal-accent/30 hover:bg-portal-surface/40 transition-all duration-500"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-portal-accent/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 bg-portal-accent/10 border border-portal-accent/15">
                    <Icon size={14} className="text-portal-accent" />
                  </div>
                  {s.alert && (
                    <span className="flex h-2 w-2 rounded-full bg-portal-accent animate-pulse" />
                  )}
                </div>
                <p className={`font-display text-2xl md:text-3xl font-bold tracking-tight ${s.alert ? "text-portal-accent" : "text-portal-text"}`}>
                  {s.value}
                </p>
                <p className="text-[10px] text-portal-text-muted mt-1.5 font-medium uppercase tracking-[0.15em]">{s.label}</p>
              </div>
            </motion.button>
          );
        })}
      </div>

      <div className="grid gap-4 md:gap-5 md:grid-cols-3">
        {/* ── Recent Projects ── */}
        <motion.div 
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, ease: luxuryEase }}
          className="border border-portal-border/40 bg-portal-surface/15 backdrop-blur-sm p-6 md:col-span-2"
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-sm font-semibold text-portal-text tracking-tight">Recent Projects</h2>
            <button onClick={() => navigate("/app/projects")}
              className="text-[10px] text-portal-accent flex items-center gap-1 hover:gap-2 transition-all uppercase tracking-[0.15em] font-medium">
              View all <ArrowRight size={10} />
            </button>
          </div>
          {projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-portal-text-muted">
              <FolderOpen size={32} className="mb-3 opacity-20" />
              <p className="text-xs font-light tracking-wide">No projects yet. Your studio will add one soon.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {projects.slice(0, 5).map((p, i) => (
                <motion.button
                  key={p.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06, ease: luxuryEase }}
                  onClick={() => navigate(`/app/projects/${p.id}`)}
                  className="w-full flex items-center gap-3 px-3 py-3 text-left hover:bg-portal-surface/40 transition-all duration-300 group"
                >
                  {/* Thumbnail */}
                  <div className="h-10 w-14 overflow-hidden bg-portal-surface shrink-0 border border-portal-border/20">
                    {p.thumbnail_url ? (
                      <img src={p.thumbnail_url} alt="" className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <FolderOpen size={14} className="text-portal-text-muted/20" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-portal-text truncate group-hover:text-portal-accent transition-colors">{p.title}</p>
                    <p className="text-[10px] text-portal-text-muted/60 mt-0.5 font-mono">
                      {formatDistanceToNow(new Date(p.updated_at), { addSuffix: true })}
                    </p>
                  </div>
                  <span className={`text-[9px] font-semibold px-2 py-0.5 border shrink-0 uppercase tracking-[0.1em] ${STATUS_MAP[p.status] || "bg-portal-surface text-portal-text-muted border-portal-border/30"}`}>
                    {p.status}
                  </span>
                  <ArrowUpRight size={11} className="text-portal-text-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </motion.button>
              ))}
            </div>
          )}
        </motion.div>

        {/* ── Notifications ── */}
        <motion.div 
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, ease: luxuryEase }}
          className="border border-portal-border/40 bg-portal-surface/15 backdrop-blur-sm p-6"
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-sm font-semibold text-portal-text tracking-tight">Notifications</h2>
            <button onClick={() => navigate("/app/notifications")}
              className="text-[10px] text-portal-accent flex items-center gap-1 hover:gap-2 transition-all uppercase tracking-[0.15em] font-medium">
              View all <ArrowRight size={10} />
            </button>
          </div>
          {recentNotifs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-portal-text-muted">
              <Bell size={24} className="mb-3 opacity-20" />
              <p className="text-[11px] font-light tracking-wide">All caught up!</p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {recentNotifs.map((n) => (
                <button
                  key={n.id}
                  onClick={() => n.link && navigate(n.link)}
                  className="w-full text-left flex items-start gap-3 px-3 py-2.5 hover:bg-portal-surface/40 transition-all duration-300"
                >
                  <span className="text-sm mt-0.5 shrink-0">{TYPE_ICONS[n.type] ?? "🔔"}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-medium text-portal-text truncate">{n.title}</p>
                    {n.body && <p className="text-[10px] text-portal-text-muted truncate mt-0.5">{n.body}</p>}
                    <p className="text-[9px] text-portal-text-muted/50 mt-1 font-mono">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <span className="flex h-1.5 w-1.5 bg-portal-accent shrink-0 mt-1.5" />
                </button>
              ))}
            </div>
          )}
        </motion.div>
      </div>
      </>
      )}
    </PortalLayout>
  );
}
