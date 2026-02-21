import { PortalLayout } from "@/components/PortalLayout";
import { UpcomingDeadlines } from "@/components/admin/UpcomingDeadlines";
import { useAuth } from "@/contexts/AuthContext";
import { Users, Briefcase, TrendingUp, DollarSign, ArrowUpRight, Plus, Upload, BarChart3, Clock, CheckCircle2, AlertCircle, FileText, Sparkles } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { format, subDays, startOfMonth } from "date-fns";

interface Stats {
  totalClients: number;
  activeProjects: number;
  newLeads: number;
  revenue: number;
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
  archived: "#9ca3af",
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [stats, setStats] = useState<Stats>({ totalClients: 0, activeProjects: 0, newLeads: 0, revenue: 0 });
  const [activity, setActivity] = useState<RecentActivity[]>([]);
  const [projectStatuses, setProjectStatuses] = useState<ProjectStatus[]>([]);
  const [recentInvoices, setRecentInvoices] = useState<{ month: string; total: number }[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);

    const [clientsRes, projectsRes, leadsRes, revenueRes, activityRes, statusRes, invoiceRes] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "CLIENT"),
      supabase.from("projects").select("id", { count: "exact", head: true }).neq("status", "archived").neq("status", "completed"),
      supabase.from("leads").select("id", { count: "exact", head: true }).eq("status", "new"),
      supabase.from("invoices").select("total").eq("status", "paid").gte("paid_at", startOfMonth(new Date()).toISOString()),
      supabase.from("audit_logs").select("id, action, entity_type, created_at, actor_id").order("created_at", { ascending: false }).limit(8),
      supabase.from("projects").select("status"),
      supabase.from("invoices").select("total, paid_at").eq("status", "paid").gte("paid_at", subDays(new Date(), 180).toISOString()),
    ]);

    const revenue = (revenueRes.data || []).reduce((sum, inv) => sum + Number(inv.total || 0), 0);

    setStats({
      totalClients: clientsRes.count || 0,
      activeProjects: projectsRes.count || 0,
      newLeads: leadsRes.count || 0,
      revenue,
    });

    if (activityRes.data) {
      const actorIds = [...new Set(activityRes.data.map(a => a.actor_id).filter(Boolean))];
      let nameMap: Record<string, string> = {};
      if (actorIds.length > 0) {
        const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", actorIds);
        if (profiles) profiles.forEach(p => { nameMap[p.id] = p.full_name || "Unknown"; });
      }
      setActivity(activityRes.data.map(a => ({
        id: a.id,
        action: a.action,
        entity_type: a.entity_type,
        created_at: a.created_at,
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

  const statCards = [
    { icon: Users, label: "Total Clients", value: stats.totalClients.toString(), gradient: "from-blue-500/20 to-blue-600/5", iconBg: "bg-blue-500/15", iconColor: "text-blue-400", href: "/admin/clients" },
    { icon: Briefcase, label: "Active Projects", value: stats.activeProjects.toString(), gradient: "from-violet-500/20 to-violet-600/5", iconBg: "bg-violet-500/15", iconColor: "text-violet-400", href: "/admin/projects" },
    { icon: TrendingUp, label: "New Leads", value: stats.newLeads.toString(), gradient: "from-emerald-500/20 to-emerald-600/5", iconBg: "bg-emerald-500/15", iconColor: "text-emerald-400", href: "/admin/leads" },
    { icon: DollarSign, label: "Revenue (mo)", value: `$${stats.revenue.toLocaleString()}`, gradient: "from-amber-500/20 to-amber-600/5", iconBg: "bg-amber-500/15", iconColor: "text-amber-400", href: "/admin/invoices" },
  ];

  const quickActions = [
    { label: "Add Client", icon: Plus, href: "/admin/clients" },
    { label: "Create Project", icon: Briefcase, href: "/admin/projects" },
    { label: "Upload Files", icon: Upload, href: "/admin/files" },
    { label: "View Reports", icon: BarChart3, href: "/admin/invoices" },
    { label: "Manage Leads", icon: TrendingUp, href: "/admin/leads" },
    { label: "Site Content", icon: FileText, href: "/admin/site-content" },
  ];

  const getActionIcon = (action: string) => {
    if (action.includes("create") || action.includes("insert")) return <Plus size={14} className="text-emerald-400" />;
    if (action.includes("update") || action.includes("edit")) return <CheckCircle2 size={14} className="text-blue-400" />;
    if (action.includes("delete")) return <AlertCircle size={14} className="text-red-400" />;
    return <Clock size={14} className="text-portal-text-muted" />;
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <PortalLayout variant="admin">
      {/* Header with gradient text */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-portal-accent/30 to-portal-accent/10 flex items-center justify-center">
            <Sparkles size={18} className="text-portal-accent" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-portal-text">
              {greeting()}, <span className="gradient-text">{profile?.full_name?.split(" ")[0] ?? "Admin"}</span>
            </h1>
            <p className="text-sm text-portal-text-muted">Here's your studio overview for today.</p>
          </div>
        </div>
      </div>

      {/* Stat Cards — glass morphism */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {statCards.map((s) => {
          const Icon = s.icon;
          return (
            <button
              key={s.label}
              onClick={() => navigate(s.href)}
              className="group relative glass-card glass-card-hover p-5 text-left overflow-hidden"
            >
              {/* Gradient overlay */}
              <div className={`absolute inset-0 bg-gradient-to-br ${s.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-portal-text-muted">{s.label}</span>
                  <div className={`rounded-xl p-2.5 ${s.iconBg} backdrop-blur-sm`}>
                    <Icon size={16} className={s.iconColor} />
                  </div>
                </div>
                <p className="font-display text-3xl font-bold text-portal-text tracking-tight">
                  {loading ? <span className="inline-block h-8 w-20 shimmer rounded-lg" /> : s.value}
                </p>
                <div className="mt-3 flex items-center gap-1 text-[11px] text-portal-text-muted opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0">
                  View details <ArrowUpRight size={11} />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Charts Row — glass */}
      <div className="grid gap-4 md:grid-cols-2 mb-8">
        <div className="glass-card p-6">
          <h2 className="font-display text-base font-semibold text-portal-text mb-5">Revenue (6 months)</h2>
          {recentInvoices.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={recentInvoices}>
                <XAxis dataKey="month" tick={{ fill: "hsl(220 12% 50%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "hsl(220 12% 50%)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  contentStyle={{ background: "hsl(230 20% 14% / 0.9)", backdropFilter: "blur(12px)", border: "1px solid hsl(230 15% 25% / 0.5)", borderRadius: 12, color: "hsl(220 20% 93%)" }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, "Revenue"]}
                />
                <Bar dataKey="total" fill="hsl(32 95% 55%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[220px] items-center justify-center text-sm text-portal-text-muted">No revenue data yet.</div>
          )}
        </div>

        <div className="glass-card p-6">
          <h2 className="font-display text-base font-semibold text-portal-text mb-5">Projects by Status</h2>
          {projectStatuses.length > 0 ? (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="45%" height={220}>
                <PieChart>
                  <Pie data={projectStatuses} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={85} innerRadius={50} strokeWidth={2} stroke="hsl(230 25% 7%)">
                    {projectStatuses.map((entry) => (
                      <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || "#6b7280"} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(230 20% 14% / 0.9)", backdropFilter: "blur(12px)", border: "1px solid hsl(230 15% 25% / 0.5)", borderRadius: 12, color: "hsl(220 20% 93%)" }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2.5">
                {projectStatuses.map((s) => (
                  <div key={s.status} className="flex items-center gap-2.5 text-sm">
                    <span className="h-2.5 w-2.5 rounded-full ring-2 ring-portal-bg" style={{ backgroundColor: STATUS_COLORS[s.status] || "#6b7280" }} />
                    <span className="capitalize text-portal-text-muted text-xs">{s.status}</span>
                    <span className="ml-auto font-display font-semibold text-portal-text">{s.count}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex h-[220px] items-center justify-center text-sm text-portal-text-muted">No projects yet.</div>
          )}
        </div>
      </div>

      {/* Deadlines */}
      <div className="mb-8">
        <UpcomingDeadlines />
      </div>

      {/* Activity & Quick Actions — glass */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="glass-card p-6">
          <h2 className="font-display text-base font-semibold text-portal-text mb-5">Recent Activity</h2>
          {activity.length > 0 ? (
            <div className="space-y-1">
              {activity.map((a) => (
                <div key={a.id} className="flex items-start gap-3 rounded-xl px-3 py-2.5 hover:bg-portal-surface-hover/50 transition-all">
                  <div className="mt-0.5 rounded-lg bg-portal-surface p-1.5">{getActionIcon(a.action)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-portal-text truncate">
                      <span className="font-medium">{a.actor_name || "System"}</span>{" "}
                      <span className="text-portal-text-muted">{a.action}</span>{" "}
                      <span className="capitalize text-portal-text-muted">({a.entity_type})</span>
                    </p>
                    <p className="text-[11px] text-portal-text-muted mt-0.5">{format(new Date(a.created_at), "MMM d, h:mm a")}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-portal-text-muted">No activity yet.</p>
          )}
        </div>

        <div className="glass-card p-6">
          <h2 className="font-display text-base font-semibold text-portal-text mb-5">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-2.5">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.label}
                  onClick={() => navigate(action.href)}
                  className="group flex items-center gap-3 rounded-xl border border-portal-border/50 bg-portal-surface/30 px-4 py-3.5 text-left text-sm text-portal-text hover:bg-portal-surface/60 hover:border-portal-accent/30 transition-all duration-200"
                >
                  <div className="rounded-lg bg-portal-surface p-2 group-hover:bg-portal-accent/15 transition-colors">
                    <Icon size={14} className="text-portal-text-muted group-hover:text-portal-accent transition-colors shrink-0" />
                  </div>
                  <span className="text-xs font-medium">{action.label}</span>
                  <ArrowUpRight size={10} className="ml-auto opacity-0 group-hover:opacity-100 text-portal-accent transition-all" />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
