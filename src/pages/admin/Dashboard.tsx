import { PortalLayout } from "@/components/PortalLayout";
import { UpcomingDeadlines } from "@/components/admin/UpcomingDeadlines";
import { DashboardInsights } from "@/components/admin/DashboardInsights";
import { useAuth } from "@/contexts/AuthContext";
import { Users, Briefcase, TrendingUp, DollarSign, ArrowUpRight, Plus, Upload, BarChart3, Clock, CheckCircle2, AlertCircle, FileText, Zap, RefreshCw, Activity, Eye, Globe } from "lucide-react";
import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { format, subDays, subMonths, startOfMonth } from "date-fns";
import { motion } from "framer-motion";
import { Sparkline, TrendIndicator } from "@/components/SparklineChart";
import { DashboardSkeleton } from "@/components/SkeletonScreens";

interface Stats {
  totalClients: number;
  activeProjects: number;
  newLeads: number;
  revenue: number;
  outstanding: number;
  leadConversion: { status: string; count: number }[];
  visitorsToday: number;
  viewsToday: number;
  visitors7d: number;
  views7d: number;
  visitorsTrend: number;
  trafficSpark: number[];
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
  inquiry: "hsl(var(--chart-4))",
  proposal: "hsl(var(--chart-1))",
  active: "hsl(var(--chart-3))",
  "in-progress": "hsl(var(--chart-2))",
  review: "hsl(var(--chart-4))",
  completed: "hsl(var(--chart-3))",
  delivered: "hsl(var(--chart-3))",
  archived: "hsl(var(--muted-foreground))",
};

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

const luxuryEase = [0.22, 1, 0.36, 1] as const;

/** Live "people currently on the site" pill — refreshes every 20s */
function NowOnlinePill() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let cancelled = false;
    const fetchCount = async () => {
      const since = new Date(Date.now() - 5 * 60_000).toISOString();
      const { data } = await supabase
        .from("page_views")
        .select("visitor_id, session_id")
        .gte("created_at", since);
      if (cancelled) return;
      const set = new Set<string>();
      (data || []).forEach((r: { visitor_id: string | null; session_id: string | null }) => {
        const k = r.visitor_id || r.session_id;
        if (k) set.add(k);
      });
      setCount(set.size);
    };
    fetchCount();
    const id = setInterval(fetchCount, 20_000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);
  return (
    <div
      className="flex items-center gap-1.5 px-3 py-1.5 border border-emerald-500/30 bg-emerald-500/10"
      title="Unique visitors active in the last 5 minutes"
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 animate-ping" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
      </span>
      <span className="text-[10px] font-semibold text-emerald-300 tabular-nums">
        {count} <span className="font-normal text-emerald-300/70 uppercase tracking-wider text-[9px]">now online</span>
      </span>
    </div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [stats, setStats] = useState<Stats>({ totalClients: 0, activeProjects: 0, newLeads: 0, revenue: 0, outstanding: 0, leadConversion: [], visitorsToday: 0, viewsToday: 0, visitors7d: 0, views7d: 0, visitorsTrend: 0, trafficSpark: [] });
  const [activity, setActivity] = useState<RecentActivity[]>([]);
  const [projectStatuses, setProjectStatuses] = useState<ProjectStatus[]>([]);
  const [recentInvoices, setRecentInvoices] = useState<{ month: string; total: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);

    const since7d = subDays(new Date(), 7).toISOString();
    const since14d = subDays(new Date(), 14).toISOString();
    const startToday = new Date(); startToday.setHours(0, 0, 0, 0);

    const [clientsRes, projectsRes, leadsRes, revenueRes, activityRes, statusRes, invoiceRes, outstandingRes, allLeadsRes, trafficRes] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "CLIENT"),
      supabase.from("projects").select("id", { count: "exact", head: true }).in("status", ["inquiry", "active", "review"]),
      supabase.from("leads").select("id", { count: "exact", head: true }).eq("status", "new"),
      supabase.from("invoices").select("total").eq("status", "paid").gte("paid_at", startOfMonth(new Date()).toISOString()),
      supabase.from("audit_logs").select("id, action, entity_type, created_at, actor_id").order("created_at", { ascending: false }).limit(8),
      supabase.from("projects").select("status"),
      supabase.from("invoices").select("total, paid_at").eq("status", "paid").gte("paid_at", subDays(new Date(), 180).toISOString()),
      supabase.from("invoices").select("total").in("status", ["sent", "draft"]),
      supabase.from("leads").select("status"),
      supabase.from("page_views").select("visitor_id, created_at").gte("created_at", since14d),
    ]);

    const revenue = (revenueRes.data || []).reduce((sum, inv) => sum + Number(inv.total || 0), 0);
    const outstanding = (outstandingRes.data || []).reduce((sum, inv) => sum + Number(inv.total || 0), 0);

    const leadCounts: Record<string, number> = {};
    (allLeadsRes.data || []).forEach((l: any) => { leadCounts[l.status] = (leadCounts[l.status] || 0) + 1; });
    const leadConversion = Object.entries(leadCounts).map(([status, count]) => ({ status, count }));

    // Visitor analytics
    const pv = (trafficRes.data || []) as { visitor_id: string | null; created_at: string }[];
    const todayViews = pv.filter((v) => new Date(v.created_at) >= startToday);
    const last7 = pv.filter((v) => new Date(v.created_at).toISOString() >= since7d);
    const prev7 = pv.filter((v) => {
      const t = new Date(v.created_at).toISOString();
      return t >= since14d && t < since7d;
    });
    const uniq = (rows: typeof pv) => new Set(rows.map((r) => r.visitor_id).filter(Boolean)).size;
    const visitors7d = uniq(last7);
    const prevVisitors = uniq(prev7);
    const visitorsTrend = prevVisitors > 0 ? Math.round(((visitors7d - prevVisitors) / prevVisitors) * 100) : 0;
    // 7-day sparkline of daily unique visitors (oldest → newest)
    const trafficSpark: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = subDays(new Date(), i); dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart); dayEnd.setHours(23, 59, 59, 999);
      const dayRows = pv.filter((v) => {
        const t = new Date(v.created_at);
        return t >= dayStart && t <= dayEnd;
      });
      trafficSpark.push(uniq(dayRows));
    }

    setStats({
      totalClients: clientsRes.count || 0,
      activeProjects: projectsRes.count || 0,
      newLeads: leadsRes.count || 0,
      revenue, outstanding, leadConversion,
      visitorsToday: uniq(todayViews),
      viewsToday: todayViews.length,
      visitors7d,
      views7d: last7.length,
      visitorsTrend,
      trafficSpark,
    });

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
      // Build the last 6 months as ordered buckets (oldest → newest) using
      // year-month keys so duplicate month abbreviations across years don't collide.
      const buckets: { key: string; month: string; total: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = subMonths(new Date(), i);
        buckets.push({ key: format(d, "yyyy-MM"), month: format(d, "MMM"), total: 0 });
      }
      const byKey = new Map(buckets.map((b) => [b.key, b]));
      invoiceRes.data.forEach((inv) => {
        if (!inv.paid_at) return;
        const k = format(new Date(inv.paid_at), "yyyy-MM");
        const b = byKey.get(k);
        if (b) b.total += Number(inv.total || 0);
      });
      setRecentInvoices(buckets.map((b) => ({ month: b.month, total: b.total })));
    }

    setLoading(false);
  }, []);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

  useEffect(() => {
    const channel = supabase
      .channel('admin-dashboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, () => fetchDashboardData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => fetchDashboardData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, () => fetchDashboardData())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'audit_logs' }, () => fetchDashboardData())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'page_views' }, () => fetchDashboardData())
      .subscribe((status) => setIsLive(status === 'SUBSCRIBED'));

    return () => { supabase.removeChannel(channel); };
  }, [fetchDashboardData]);

  const statCards = [
    { icon: Eye, label: "Visitors Today", value: stats.visitorsToday, format: "number" as const, href: "/admin/analytics", sparkData: stats.trafficSpark, sub: `${stats.viewsToday.toLocaleString()} views` },
    { icon: Globe, label: "Visitors (7d)", value: stats.visitors7d, format: "number" as const, href: "/admin/analytics", sparkData: stats.trafficSpark, trend: stats.visitorsTrend, sub: `${stats.views7d.toLocaleString()} views` },
    { icon: Users, label: "Clients", value: stats.totalClients, format: "number" as const, href: "/admin/clients", sparkData: [2, 4, 3, 6, 5, 8, stats.totalClients] },
    { icon: Briefcase, label: "Active Projects", value: stats.activeProjects, format: "number" as const, href: "/admin/projects", sparkData: [1, 3, 2, 4, 3, 5, stats.activeProjects] },
    { icon: TrendingUp, label: "New Leads", value: stats.newLeads, format: "number" as const, href: "/admin/leads", sparkData: [0, 2, 1, 3, 2, 4, stats.newLeads] },
    { icon: DollarSign, label: "Revenue (mo)", value: stats.revenue, format: "currency" as const, href: "/admin/invoices", sparkData: recentInvoices.map(r => r.total) },
    { icon: AlertCircle, label: "Outstanding", value: stats.outstanding, format: "currency" as const, href: "/admin/invoices", sparkData: [stats.outstanding, stats.outstanding * 0.8, stats.outstanding] },
  ];

  const quickActions = [
    { label: "Add Client", icon: Plus, href: "/admin/clients" },
    { label: "New Project", icon: Briefcase, href: "/admin/projects" },
    { label: "Upload Files", icon: Upload, href: "/admin/files" },
    { label: "View Analytics", icon: BarChart3, href: "/admin/analytics" },
    { label: "Manage Leads", icon: TrendingUp, href: "/admin/leads" },
    { label: "Site Content", icon: FileText, href: "/admin/site-content" },
  ];

  const getActionIcon = (action: string) => {
    if (action.includes("create") || action.includes("insert")) return <Plus size={12} className="text-primary" />;
    if (action.includes("update") || action.includes("edit")) return <CheckCircle2 size={12} className="text-chart-2" />;
    if (action.includes("delete")) return <AlertCircle size={12} className="text-destructive" />;
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
      {/* ── Header ── */}
      <div className="mb-8 md:mb-10 flex items-start justify-between">
        <div className="flex items-center gap-3 md:gap-4">
          <motion.div 
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: luxuryEase }}
            className="h-11 w-11 md:h-13 md:w-13 rounded-none bg-portal-accent flex items-center justify-center shadow-[0_8px_30px_-8px_hsl(var(--portal-accent)/0.4)]"
          >
            <Zap size={18} className="md:w-5 md:h-5 text-portal-accent-foreground" />
          </motion.div>
          <div className="min-w-0">
            <motion.h1 
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5, ease: luxuryEase }}
              className="font-display text-xl md:text-3xl font-bold text-portal-text tracking-tight"
            >
              {greeting()}, <span className="gradient-text">{profile?.full_name?.split(" ")[0] ?? "Admin"}</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-xs md:text-sm text-portal-text-muted mt-1 hidden sm:block font-light tracking-wide"
            >
              Studio overview · {format(new Date(), "EEEE, MMMM d")}
            </motion.p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <NowOnlinePill />
          <div className="flex items-center gap-1.5 px-3 py-1.5 border border-portal-border/30 bg-portal-surface/30">
            <span className={`h-1.5 w-1.5 rounded-full ${isLive ? 'bg-primary animate-pulse' : 'bg-portal-text-muted/40'}`} />
            <span className="text-[9px] font-medium text-portal-text-muted uppercase tracking-[0.15em]">
              {isLive ? 'Live' : 'Offline'}
            </span>
          </div>
          <button
            onClick={fetchDashboardData}
            className="p-2 text-portal-text-muted hover:bg-portal-surface/80 hover:text-portal-text transition-all"
            aria-label="Refresh"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="flex gap-3 overflow-x-auto scrollbar-none pb-1 mb-8 md:mb-10 md:grid md:grid-cols-4 xl:grid-cols-7 md:overflow-visible md:pb-0">
        {statCards.map((s, idx) => {
          const Icon = s.icon;
          const trend = (s as { trend?: number }).trend;
          const sub = (s as { sub?: string }).sub;
          return (
            <motion.button
              key={s.label}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.06, duration: 0.5, ease: luxuryEase }}
              onClick={() => navigate(s.href)}
              className="group relative overflow-hidden border border-portal-border/40 bg-portal-surface/20 backdrop-blur-sm p-4 md:p-5 text-left min-w-[140px] md:min-w-0 shrink-0 md:shrink hover:border-portal-accent/30 hover:bg-portal-surface/40 transition-all duration-500"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-portal-accent/[0.06] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 bg-portal-accent/10 border border-portal-accent/15">
                    <Icon size={14} className="text-portal-accent" />
                  </div>
                  {trend !== undefined && trend !== 0 ? (
                    <span className={`text-[10px] font-medium tabular-nums ${trend > 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {trend > 0 ? "+" : ""}{trend}%
                    </span>
                  ) : (
                    <ArrowUpRight size={10} className="text-portal-text-muted opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all hidden md:block" />
                  )}
                </div>
                <p className="font-display text-xl md:text-2xl font-bold text-portal-text tracking-tight">
                  <AnimatedCounter value={s.value} prefix={s.format === "currency" ? "$" : ""} />
                </p>
                <div className="flex items-center justify-between mt-1.5 gap-2">
                  <div className="min-w-0">
                    <p className="text-[9px] md:text-[10px] text-portal-text-muted font-medium uppercase tracking-[0.15em] truncate">{s.label}</p>
                    {sub && <p className="text-[9px] text-portal-text-muted/70 tabular-nums mt-0.5 truncate">{sub}</p>}
                  </div>
                  {s.sparkData.length > 1 && <Sparkline data={s.sparkData} height={20} width={50} />}
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* ── Audience Insights (top pages · referrers · device split) ── */}
      <div className="mb-8 md:mb-10">
        <DashboardInsights />
      </div>

      {/* ── Charts Row ── */}

      <div className="grid gap-4 md:gap-5 grid-cols-1 md:grid-cols-3 mb-8 md:mb-10">
        {/* Revenue Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 24 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.25, ease: luxuryEase }}
          className="border border-portal-border/40 bg-portal-surface/15 backdrop-blur-sm p-6 md:col-span-2"
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-display text-sm font-semibold text-portal-text tracking-tight">Revenue Trend</h2>
              <p className="text-[10px] text-portal-text-muted mt-0.5 tracking-wide">Last 6 months</p>
            </div>
            <div className="h-px flex-1 bg-portal-border/30 mx-4" />
            <span className="text-[9px] text-portal-text-muted uppercase tracking-[0.2em] font-medium">Monthly</span>
          </div>
          {recentInvoices.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={recentInvoices}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--portal-accent))" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="hsl(var(--portal-accent))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fill: "hsl(var(--portal-text-muted))", fontSize: 10, fontFamily: "Space Grotesk" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "hsl(var(--portal-text-muted))", fontSize: 10, fontFamily: "Space Grotesk" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} width={50} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--portal-bg) / 0.95)", backdropFilter: "blur(16px)", border: "1px solid hsl(var(--portal-border) / 0.5)", borderRadius: 0, color: "hsl(var(--portal-text))", fontSize: 12, fontFamily: "Space Grotesk" }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, "Revenue"]}
                />
                <Area type="monotone" dataKey="total" stroke="hsl(var(--portal-accent))" strokeWidth={2} fill="url(#revenueGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[200px] items-center justify-center text-sm text-portal-text-muted font-light">No revenue data yet.</div>
          )}
        </motion.div>

        {/* Project Status */}
        <motion.div 
          initial={{ opacity: 0, y: 24 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.3, ease: luxuryEase }}
          className="border border-portal-border/40 bg-portal-surface/15 backdrop-blur-sm p-6"
        >
          <h2 className="font-display text-sm font-semibold text-portal-text mb-5 tracking-tight">Project Status</h2>
          {projectStatuses.length > 0 ? (
            <div className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={projectStatuses} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={60} innerRadius={38} strokeWidth={2} stroke="hsl(var(--portal-bg))">
                    {projectStatuses.map((entry) => (
                      <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || "hsl(var(--muted-foreground))"} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(var(--portal-bg) / 0.95)", backdropFilter: "blur(16px)", border: "1px solid hsl(var(--portal-border) / 0.5)", borderRadius: 0, color: "hsl(var(--portal-text))", fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="w-full space-y-2 mt-3">
                {projectStatuses.map((s) => (
                  <div key={s.status} className="flex items-center gap-2.5 text-xs">
                    <span className="h-2 w-2 shrink-0" style={{ backgroundColor: STATUS_COLORS[s.status] || "hsl(var(--muted-foreground))" }} />
                    <span className="capitalize text-portal-text-muted flex-1 tracking-wide">{s.status}</span>
                    <span className="font-display font-bold text-portal-text">{s.count}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex h-[200px] items-center justify-center text-sm text-portal-text-muted font-light">No projects yet.</div>
          )}
        </motion.div>
      </div>

      {/* ── Lead Pipeline + Deadlines ── */}
      <div className="grid gap-4 md:gap-5 grid-cols-1 md:grid-cols-2 mb-8 md:mb-10">
        {stats.leadConversion.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 24 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.35, ease: luxuryEase }}
            className="border border-portal-border/40 bg-portal-surface/15 backdrop-blur-sm p-6"
          >
            <h2 className="font-display text-sm font-semibold text-portal-text mb-5 tracking-tight">Lead Pipeline</h2>
            <div className="space-y-4">
              {stats.leadConversion.map((l) => {
                const total = stats.leadConversion.reduce((s, x) => s + x.count, 0);
                const pct = total > 0 ? (l.count / total) * 100 : 0;
                return (
                  <div key={l.status}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="capitalize text-xs text-portal-text-muted tracking-wide">{l.status}</span>
                      <span className="font-display font-bold text-portal-text text-sm">{l.count}</span>
                    </div>
                    <div className="h-1 bg-portal-surface overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 1, delay: 0.5, ease: luxuryEase }}
                        className="h-full bg-portal-accent"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, ease: luxuryEase }}
        >
          <UpcomingDeadlines />
        </motion.div>
      </div>

      {/* ── Activity & Quick Actions ── */}
      <div className="grid gap-4 md:gap-5 grid-cols-1 md:grid-cols-2">
        <motion.div 
          initial={{ opacity: 0, y: 24 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.45, ease: luxuryEase }}
          className="border border-portal-border/40 bg-portal-surface/15 backdrop-blur-sm p-6"
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-sm font-semibold text-portal-text tracking-tight">Recent Activity</h2>
            {isLive && (
              <span className="flex items-center gap-1.5 text-[9px] text-primary font-medium tracking-[0.15em] uppercase">
                <span className="h-1 w-1 rounded-full bg-primary animate-pulse" />
                Live
              </span>
            )}
          </div>
          {activity.length > 0 ? (
            <div className="space-y-0.5">
              {activity.map((a, idx) => (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03, ease: luxuryEase }}
                  className="flex items-start gap-3 px-3 py-2.5 hover:bg-portal-surface/40 transition-all duration-300"
                >
                  <div className="mt-0.5 p-1.5 bg-portal-surface/60 border border-portal-border/30">{getActionIcon(a.action)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-portal-text">
                      <span className="font-medium">{a.actor_name || "System"}</span>{" "}
                      <span className="text-portal-text-muted">{a.action}</span>
                    </p>
                    <p className="text-[10px] text-portal-text-muted/60 mt-0.5 font-mono">{format(new Date(a.created_at), "MMM d, h:mm a")}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-portal-text-muted py-6 text-center font-light">No activity yet.</p>
          )}
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 24 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.5, ease: luxuryEase }}
          className="border border-portal-border/40 bg-portal-surface/15 backdrop-blur-sm p-6"
        >
          <h2 className="font-display text-sm font-semibold text-portal-text mb-5 tracking-tight">Quick Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 gap-2">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.label}
                  onClick={() => navigate(action.href)}
                  className="group flex items-center gap-2.5 border border-portal-border/30 bg-portal-surface/10 px-3 py-3 text-left text-xs hover:bg-portal-surface/40 hover:border-portal-accent/30 transition-all duration-300"
                >
                  <div className="p-1.5 bg-portal-surface/50 group-hover:bg-portal-accent/15 border border-portal-border/20 group-hover:border-portal-accent/20 transition-all duration-300 shrink-0">
                    <Icon size={13} className="text-portal-text-muted group-hover:text-portal-accent transition-colors duration-300" />
                  </div>
                  <span className="font-medium text-portal-text truncate tracking-wide">{action.label}</span>
                </button>
              );
            })}
          </div>
        </motion.div>
      </div>
    </PortalLayout>
  );
}
