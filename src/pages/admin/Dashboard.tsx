import { PortalLayout } from "@/components/PortalLayout";
import { UpcomingDeadlines } from "@/components/admin/UpcomingDeadlines";
import { useAuth } from "@/contexts/AuthContext";
import { Users, Briefcase, TrendingUp, DollarSign, ArrowUpRight, Plus, Upload, BarChart3, Clock, CheckCircle2, AlertCircle, FileText, Zap, RefreshCw } from "lucide-react";
import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { format, subDays, startOfMonth } from "date-fns";
import { motion } from "framer-motion";

interface Stats {
  totalClients: number;
  activeProjects: number;
  newLeads: number;
  revenue: number;
  outstanding: number;
  leadConversion: { status: string; count: number }[];
}

interface RecentActivity {
  id: string;
  action: string;
  entity_type: string;
  created_at: string;
  actor_name: string | null;
}

interface ProjectStatus {
  status: string;
  count: number;
}

const STATUS_COLORS: Record<string, string> = {
  inquiry: "#818cf8",
  proposal: "#fbbf24",
  active: "#34d399",
  "in-progress": "#60a5fa",
  review: "#a78bfa",
  completed: "#4ade80",
  delivered: "#4ade80",
  archived: "#9ca3af",
};

// Animated counter component
function AnimatedCounter({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<number | null>(null);

  useEffect(() => {
    const start = ref.current ?? 0;
    const diff = value - start;
    if (diff === 0) return;
    const duration = 600;
    const startTime = performance.now();
    
    function animate(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + diff * eased));
      if (progress < 1) requestAnimationFrame(animate);
      else ref.current = value;
    }
    requestAnimationFrame(animate);
  }, [value]);

  return <>{prefix}{display.toLocaleString()}{suffix}</>;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [stats, setStats] = useState<Stats>({ totalClients: 0, activeProjects: 0, newLeads: 0, revenue: 0, outstanding: 0, leadConversion: [] });
  const [activity, setActivity] = useState<RecentActivity[]>([]);
  const [projectStatuses, setProjectStatuses] = useState<ProjectStatus[]>([]);
  const [recentInvoices, setRecentInvoices] = useState<{ month: string; total: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);

    const [clientsRes, projectsRes, leadsRes, revenueRes, activityRes, statusRes, invoiceRes, outstandingRes, allLeadsRes] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "CLIENT"),
      supabase.from("projects").select("id", { count: "exact", head: true }).neq("status", "archived").neq("status", "completed"),
      supabase.from("leads").select("id", { count: "exact", head: true }).eq("status", "new"),
      supabase.from("invoices").select("total").eq("status", "paid").gte("paid_at", startOfMonth(new Date()).toISOString()),
      supabase.from("audit_logs").select("id, action, entity_type, created_at, actor_id").order("created_at", { ascending: false }).limit(8),
      supabase.from("projects").select("status"),
      supabase.from("invoices").select("total, paid_at").eq("status", "paid").gte("paid_at", subDays(new Date(), 180).toISOString()),
      supabase.from("invoices").select("total").in("status", ["sent", "draft"]),
      supabase.from("leads").select("status"),
    ]);

    const revenue = (revenueRes.data || []).reduce((sum, inv) => sum + Number(inv.total || 0), 0);
    const outstanding = (outstandingRes.data || []).reduce((sum, inv) => sum + Number(inv.total || 0), 0);

    const leadCounts: Record<string, number> = {};
    (allLeadsRes.data || []).forEach((l: any) => { leadCounts[l.status] = (leadCounts[l.status] || 0) + 1; });
    const leadConversion = Object.entries(leadCounts).map(([status, count]) => ({ status, count }));

    setStats({ totalClients: clientsRes.count || 0, activeProjects: projectsRes.count || 0, newLeads: leadsRes.count || 0, revenue, outstanding, leadConversion });

    if (activityRes.data) {
      const actorIds = [...new Set(activityRes.data.map(a => a.actor_id).filter(Boolean))];
      let nameMap: Record<string, string> = {};
      if (actorIds.length > 0) {
        const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", actorIds);
        if (profiles) profiles.forEach(p => { nameMap[p.id] = p.full_name || "Unknown"; });
      }
      setActivity(activityRes.data.map(a => ({
        id: a.id, action: a.action, entity_type: a.entity_type, created_at: a.created_at,
        actor_name: a.actor_id ? (nameMap[a.actor_id] || "Unknown") : null,
      })));
    }

    if (statusRes.data) {
      const counts: Record<string, number> = {};
      statusRes.data.forEach(p => { counts[p.status] = (counts[p.status] || 0) + 1; });
      setProjectStatuses(Object.entries(counts).map(([status, count]) => ({ status, count })));
    }

    if (invoiceRes.data) {
      const monthly: Record<string, number> = {};
      for (let i = 5; i >= 0; i--) {
        const d = subDays(new Date(), i * 30);
        const key = format(d, "MMM");
        monthly[key] = 0;
      }
      invoiceRes.data.forEach(inv => {
        if (inv.paid_at) {
          const key = format(new Date(inv.paid_at), "MMM");
          if (key in monthly) monthly[key] += Number(inv.total || 0);
        }
      });
      setRecentInvoices(Object.entries(monthly).map(([month, total]) => ({ month, total })));
    }

    setLoading(false);
  }, []);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

  // Real-time subscriptions
  useEffect(() => {
    const channel = supabase
      .channel('admin-dashboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, () => {
        fetchDashboardData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => {
        fetchDashboardData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, () => {
        fetchDashboardData();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'audit_logs' }, () => {
        fetchDashboardData();
      })
      .subscribe((status) => {
        setIsLive(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchDashboardData]);

  const statCards = [
    { icon: Users, label: "Clients", value: stats.totalClients, format: "number" as const, color: "from-blue-500 to-blue-600", href: "/admin/clients" },
    { icon: Briefcase, label: "Active Projects", value: stats.activeProjects, format: "number" as const, color: "from-violet-500 to-violet-600", href: "/admin/projects" },
    { icon: TrendingUp, label: "New Leads", value: stats.newLeads, format: "number" as const, color: "from-emerald-500 to-emerald-600", href: "/admin/leads" },
    { icon: DollarSign, label: "Revenue (mo)", value: stats.revenue, format: "currency" as const, color: "from-amber-500 to-amber-600", href: "/admin/invoices" },
    { icon: AlertCircle, label: "Outstanding", value: stats.outstanding, format: "currency" as const, color: "from-rose-500 to-rose-600", href: "/admin/invoices" },
  ];

  const quickActions = [
    { label: "Add Client", icon: Plus, href: "/admin/clients" },
    { label: "New Project", icon: Briefcase, href: "/admin/projects" },
    { label: "Upload Files", icon: Upload, href: "/admin/files" },
    { label: "View Reports", icon: BarChart3, href: "/admin/invoices" },
    { label: "Manage Leads", icon: TrendingUp, href: "/admin/leads" },
    { label: "Site Content", icon: FileText, href: "/admin/site-content" },
  ];

  const getActionIcon = (action: string) => {
    if (action.includes("create") || action.includes("insert")) return <Plus size={12} className="text-emerald-400" />;
    if (action.includes("update") || action.includes("edit")) return <CheckCircle2 size={12} className="text-blue-400" />;
    if (action.includes("delete")) return <AlertCircle size={12} className="text-red-400" />;
    return <Clock size={12} className="text-portal-text-muted" />;
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <PortalLayout variant="admin">
      {/* Header */}
      <div className="mb-5 md:mb-8 flex items-start justify-between">
        <div className="flex items-center gap-2.5 md:gap-3">
          <div className="h-9 w-9 md:h-11 md:w-11 rounded-xl md:rounded-2xl bg-gradient-to-br from-portal-accent to-portal-accent/60 flex items-center justify-center shadow-lg shadow-portal-accent/20 shrink-0">
            <Zap size={16} className="md:w-[18px] md:h-[18px] text-portal-accent-foreground" />
          </div>
          <div className="min-w-0">
            <h1 className="font-display text-lg md:text-2xl font-bold text-portal-text truncate">
              {greeting()}, <span className="gradient-text">{profile?.full_name?.split(" ")[0] ?? "Admin"}</span>
            </h1>
            <p className="text-xs md:text-sm text-portal-text-muted mt-0.5 hidden sm:block">Here's your studio overview for today.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Live indicator */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-portal-surface/50 border border-portal-border/30">
            <span className={`h-1.5 w-1.5 rounded-full ${isLive ? 'bg-emerald-400 animate-pulse' : 'bg-portal-text-muted/40'}`} />
            <span className="text-[10px] font-medium text-portal-text-muted uppercase tracking-wider">
              {isLive ? 'Live' : 'Offline'}
            </span>
          </div>
          <button
            onClick={fetchDashboardData}
            className="rounded-lg p-2 text-portal-text-muted hover:bg-portal-surface/80 hover:text-portal-text transition-all"
            aria-label="Refresh"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Stat Cards with animated counters */}
      <div className="flex gap-2.5 overflow-x-auto scrollbar-none pb-1 mb-5 md:mb-8 md:grid md:grid-cols-5 md:overflow-visible md:pb-0">
        {statCards.map((s, idx) => {
          const Icon = s.icon;
          return (
            <motion.button
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05, duration: 0.3 }}
              onClick={() => navigate(s.href)}
              className="group glass-card glass-card-hover p-3 md:p-4 text-left min-w-[130px] md:min-w-0 shrink-0 md:shrink"
            >
              <div className="flex items-center justify-between mb-2 md:mb-3">
                <div className={`rounded-lg p-1.5 md:p-2 bg-gradient-to-br ${s.color} shadow-lg`}>
                  <Icon size={12} className="md:w-[14px] md:h-[14px] text-white" />
                </div>
                <ArrowUpRight size={10} className="text-portal-text-muted opacity-0 group-hover:opacity-100 transition-all hidden md:block" />
              </div>
              <p className="font-display text-lg md:text-2xl font-bold text-portal-text tracking-tight">
                {loading ? (
                  <span className="inline-block h-5 md:h-7 w-12 md:w-16 shimmer rounded-lg" />
                ) : (
                  <AnimatedCounter 
                    value={s.value} 
                    prefix={s.format === "currency" ? "$" : ""} 
                  />
                )}
              </p>
              <p className="text-[9px] md:text-[11px] text-portal-text-muted mt-0.5 md:mt-1 font-medium uppercase tracking-wider">{s.label}</p>
            </motion.button>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid gap-3 md:gap-4 grid-cols-1 md:grid-cols-3 mb-5 md:mb-8">
        {/* Revenue Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.2 }}
          className="glass-card p-5 md:col-span-2"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-sm font-semibold text-portal-text">Revenue Trend</h2>
            <span className="text-[10px] text-portal-text-muted uppercase tracking-wider">Last 6 months</span>
          </div>
          {recentInvoices.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={recentInvoices}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(32 95% 55%)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(32 95% 55%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fill: "hsl(220 12% 50%)", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "hsl(220 12% 50%)", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} width={50} />
                <Tooltip
                  contentStyle={{ background: "hsl(230 20% 14% / 0.95)", backdropFilter: "blur(12px)", border: "1px solid hsl(230 15% 25% / 0.5)", borderRadius: 10, color: "hsl(220 20% 93%)", fontSize: 12 }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, "Revenue"]}
                />
                <Area type="monotone" dataKey="total" stroke="hsl(32 95% 55%)" strokeWidth={2} fill="url(#revenueGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[200px] items-center justify-center text-sm text-portal-text-muted">No revenue data yet.</div>
          )}
        </motion.div>

        {/* Project Status */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.3 }}
          className="glass-card p-5"
        >
          <h2 className="font-display text-sm font-semibold text-portal-text mb-4">Project Status</h2>
          {projectStatuses.length > 0 ? (
            <div className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={projectStatuses} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={60} innerRadius={38} strokeWidth={2} stroke="hsl(230 25% 7%)">
                    {projectStatuses.map((entry) => (
                      <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || "#6b7280"} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(230 20% 14% / 0.95)", backdropFilter: "blur(12px)", border: "1px solid hsl(230 15% 25% / 0.5)", borderRadius: 10, color: "hsl(220 20% 93%)", fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="w-full space-y-1.5 mt-2">
                {projectStatuses.map((s) => (
                  <div key={s.status} className="flex items-center gap-2 text-xs">
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: STATUS_COLORS[s.status] || "#6b7280" }} />
                    <span className="capitalize text-portal-text-muted flex-1">{s.status}</span>
                    <span className="font-display font-bold text-portal-text">{s.count}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex h-[200px] items-center justify-center text-sm text-portal-text-muted">No projects yet.</div>
          )}
        </motion.div>
      </div>

      {/* Lead Pipeline + Deadlines */}
      <div className="grid gap-3 md:gap-4 grid-cols-1 md:grid-cols-2 mb-5 md:mb-8">
        {stats.leadConversion.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.35 }}
            className="glass-card p-5"
          >
            <h2 className="font-display text-sm font-semibold text-portal-text mb-4">Lead Pipeline</h2>
            <div className="space-y-3">
              {stats.leadConversion.map((l) => {
                const total = stats.leadConversion.reduce((s, x) => s + x.count, 0);
                const pct = total > 0 ? (l.count / total) * 100 : 0;
                return (
                  <div key={l.status}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="capitalize text-xs text-portal-text-muted">{l.status}</span>
                      <span className="font-display font-bold text-portal-text text-sm">{l.count}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-portal-surface overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, delay: 0.5 }}
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <UpcomingDeadlines />
        </motion.div>
      </div>

      {/* Activity & Quick Actions */}
      <div className="grid gap-3 md:gap-4 grid-cols-1 md:grid-cols-2">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.45 }}
          className="glass-card p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-sm font-semibold text-portal-text">Recent Activity</h2>
            {isLive && (
              <span className="flex items-center gap-1 text-[9px] text-emerald-400 font-medium">
                <span className="h-1 w-1 rounded-full bg-emerald-400 animate-pulse" />
                Live
              </span>
            )}
          </div>
          {activity.length > 0 ? (
            <div className="space-y-0.5">
              {activity.map((a, idx) => (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="flex items-start gap-2.5 rounded-lg px-2.5 py-2 hover:bg-portal-surface-hover/40 transition-all"
                >
                  <div className="mt-0.5 rounded-md bg-portal-surface p-1.5">{getActionIcon(a.action)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-portal-text">
                      <span className="font-medium">{a.actor_name || "System"}</span>{" "}
                      <span className="text-portal-text-muted">{a.action}</span>
                    </p>
                    <p className="text-[10px] text-portal-text-muted mt-0.5">{format(new Date(a.created_at), "MMM d, h:mm a")}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-portal-text-muted py-4 text-center">No activity yet.</p>
          )}
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.5 }}
          className="glass-card p-5"
        >
          <h2 className="font-display text-sm font-semibold text-portal-text mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 gap-1.5 md:gap-2">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.label}
                  onClick={() => navigate(action.href)}
                  className="group flex items-center gap-2 md:gap-2.5 rounded-xl border border-portal-border/40 bg-portal-surface/20 px-2.5 py-2.5 md:px-3 md:py-3 text-left text-[11px] md:text-xs hover:bg-portal-surface/50 hover:border-portal-accent/30 transition-all duration-200"
                >
                  <div className="rounded-lg bg-portal-surface/80 p-1 md:p-1.5 group-hover:bg-portal-accent/15 transition-colors shrink-0">
                    <Icon size={12} className="md:w-[13px] md:h-[13px] text-portal-text-muted group-hover:text-portal-accent transition-colors" />
                  </div>
                  <span className="font-medium text-portal-text truncate">{action.label}</span>
                </button>
              );
            })}
          </div>
        </motion.div>
      </div>
    </PortalLayout>
  );
}