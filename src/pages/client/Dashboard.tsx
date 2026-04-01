import { useEffect, useState } from "react";
import { PortalLayout } from "@/components/PortalLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { FolderOpen, Clock, CheckCircle, PackageOpen, FileText, ArrowRight, Bell, MessageSquare, Zap, Activity, Upload, Eye } from "lucide-react";
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
      supabase
        .from("projects")
        .select("id, title, status, updated_at, thumbnail_url, target_date")
        .order("updated_at", { ascending: false }),
      supabase
        .from("deliverables")
        .select("id, project_id, projects!inner(client_id)")
        .eq("status", "submitted"),
      supabase
        .from("invoices")
        .select("id, project_id, projects!inner(client_id)")
        .eq("status", "sent"),
      supabase
        .from("notifications")
        .select("*")
        .eq("user_id", profile.id)
        .eq("is_read", false)
        .order("created_at", { ascending: false })
        .limit(5),
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
    { icon: FolderOpen, label: "Active Projects", value: activeCount, gradient: "from-blue-500 to-blue-600", href: "/app/projects" },
    { icon: PackageOpen, label: "Pending Review", value: pendingApprovals, gradient: "from-amber-500 to-amber-600", alert: pendingApprovals > 0 },
    { icon: CheckCircle, label: "Completed", value: completedCount, gradient: "from-emerald-500 to-emerald-600" },
    { icon: FileText, label: "Unpaid Invoices", value: unpaidInvoices, gradient: "from-rose-500 to-rose-600", alert: unpaidInvoices > 0 },
  ];

  const TYPE_ICONS: Record<string, string> = { message: "💬", deliverable: "📦", system: "🔔" };

  return (
    <PortalLayout variant="client">
      {loading ? (
        <ClientDashboardSkeleton />
      ) : (
      <>
      {/* Welcome Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="h-11 w-11 rounded-2xl bg-gradient-to-br from-portal-accent to-portal-accent/60 flex items-center justify-center shadow-lg shadow-portal-accent/20"
          >
            <Zap size={18} className="text-portal-accent-foreground" />
          </motion.div>
          <div>
            <motion.h1 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="font-display text-2xl font-bold text-portal-text"
            >
              {greeting()}, <span className="gradient-text">{profile?.full_name?.split(" ")[0] ?? "there"}</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="text-sm text-portal-text-muted mt-0.5"
            >
              Here's what's happening with your projects.
            </motion.p>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {statCards.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.button
              key={s.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              onClick={() => s.href && navigate(s.href)}
              className="glass-card glass-card-hover p-4 text-left group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`rounded-lg p-2 bg-gradient-to-br ${s.gradient} shadow-lg`}>
                  <Icon size={14} className="text-white" />
                </div>
                {s.alert && (
                  <span className="flex h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                )}
              </div>
              <p className={`font-display text-2xl font-bold tracking-tight ${s.alert ? "text-amber-400" : "text-portal-text"}`}>
                {loading ? <span className="inline-block h-7 w-16 shimmer rounded-lg" /> : s.value}
              </p>
              <p className="text-[11px] text-portal-text-muted mt-1 font-medium uppercase tracking-wider">{s.label}</p>
            </motion.button>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {/* Recent Projects */}
        <div className="glass-card p-5 md:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-sm font-semibold text-portal-text">Recent Projects</h2>
            <button onClick={() => navigate("/app/projects")}
              className="text-[11px] text-portal-accent flex items-center gap-1 hover:underline">
              View all <ArrowRight size={10} />
            </button>
          </div>
          {projects.length === 0 && !loading ? (
            <div className="flex flex-col items-center justify-center py-10 text-portal-text-muted">
              <FolderOpen size={32} className="mb-2 opacity-30" />
              <p className="text-xs">No projects yet. Your studio will add one soon.</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {projects.slice(0, 5).map((p, i) => (
                <motion.button
                  key={p.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  onClick={() => navigate(`/app/projects/${p.id}`)}
                  className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-portal-surface-hover/50 transition-all group"
                >
                  {/* Thumbnail */}
                  <div className="h-10 w-14 rounded-lg overflow-hidden bg-portal-surface shrink-0">
                    {p.thumbnail_url ? (
                      <img src={p.thumbnail_url} alt="" className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <FolderOpen size={14} className="text-portal-text-muted/30" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-portal-text truncate">{p.title}</p>
                    <p className="text-[10px] text-portal-text-muted mt-0.5">
                      Updated {formatDistanceToNow(new Date(p.updated_at), { addSuffix: true })}
                    </p>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                    p.status === "active" ? "bg-blue-500/15 text-blue-400" :
                    p.status === "delivered" ? "bg-emerald-500/15 text-emerald-400" :
                    p.status === "review" ? "bg-violet-500/15 text-violet-400" :
                    "bg-portal-surface text-portal-text-muted"
                  }`}>{p.status}</span>
                  <ArrowRight size={12} className="text-portal-text-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </motion.button>
              ))}
            </div>
          )}
        </div>

        {/* Recent Notifications */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-sm font-semibold text-portal-text">Notifications</h2>
            <button onClick={() => navigate("/app/notifications")}
              className="text-[11px] text-portal-accent flex items-center gap-1 hover:underline">
              View all <ArrowRight size={10} />
            </button>
          </div>
          {recentNotifs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-portal-text-muted">
              <Bell size={24} className="mb-2 opacity-30" />
              <p className="text-[11px]">All caught up!</p>
            </div>
          ) : (
            <div className="space-y-1">
              {recentNotifs.map((n) => (
                <button
                  key={n.id}
                  onClick={() => n.link && navigate(n.link)}
                  className="w-full text-left flex items-start gap-2.5 rounded-lg px-2.5 py-2 hover:bg-portal-surface-hover/40 transition-all"
                >
                  <span className="text-sm mt-0.5 shrink-0">{TYPE_ICONS[n.type] ?? "🔔"}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-medium text-portal-text truncate">{n.title}</p>
                    {n.body && <p className="text-[10px] text-portal-text-muted truncate mt-0.5">{n.body}</p>}
                    <p className="text-[9px] text-portal-text-muted/60 mt-0.5">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <span className="flex h-1.5 w-1.5 rounded-full bg-portal-accent shrink-0 mt-1.5" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      </>
      )}
    </PortalLayout>
  );
}
