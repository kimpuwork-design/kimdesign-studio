import { PortalLayout } from "@/components/PortalLayout";
import { UpcomingDeadlines } from "@/components/admin/UpcomingDeadlines";
import { useAuth } from "@/contexts/AuthContext";
import { Users, Briefcase, TrendingUp, DollarSign, ArrowUpRight, Plus, Upload, BarChart3, Clock, CheckCircle2, AlertCircle, FileText } from "lucide-react";
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
  inquiry: "#6366f1",
  proposal: "#f59e0b",
  active: "#10b981",
  "in-progress": "#3b82f6",
  review: "#8b5cf6",
  completed: "#22c55e",
  archived: "#6b7280",
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
    { icon: Users, label: "Total Clients", value: stats.totalClients.toString(), color: "text-blue-400", bg: "bg-blue-400/10", href: "/admin/clients" },
    { icon: Briefcase, label: "Active Projects", value: stats.activeProjects.toString(), color: "text-purple-400", bg: "bg-purple-400/10", href: "/admin/projects" },
    { icon: TrendingUp, label: "New Leads", value: stats.newLeads.toString(), color: "text-green-400", bg: "bg-green-400/10", href: "/admin/leads" },
    { icon: DollarSign, label: "Revenue (mo)", value: `$${stats.revenue.toLocaleString()}`, color: "text-yellow-400", bg: "bg-yellow-400/10", href: "/admin/invoices" },
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
    if (action.includes("create") || action.includes("insert")) return <Plus size={14} className="text-green-400" />;
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
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-portal-text">
          {greeting()}, {profile?.full_name?.split(" ")[0] ?? "Admin"} 👋
        </h1>
        <p className="mt-1 text-portal-text-muted">Here's your studio overview for today.</p>
      </div>

      {/* Stat Cards — clickable */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {statCards.map((s) => {
          const Icon = s.icon;
          return (
            <button
              key={s.label}
              onClick={() => navigate(s.href)}
              className="group rounded-xl border border-portal-border bg-portal-surface p-5 hover:border-portal-accent/30 transition-all duration-200 text-left"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium uppercase tracking-wider text-portal-text-muted">{s.label}</span>
                <div className={`rounded-lg p-2 ${s.bg}`}>
                  <Icon size={16} className={s.color} />
                </div>
              </div>
              <p className="font-display text-3xl font-bold text-portal-text">
                {loading ? <span className="inline-block h-8 w-16 animate-pulse rounded bg-portal-surface-hover" /> : s.value}
              </p>
              <div className="mt-2 flex items-center gap-1 text-xs text-portal-text-muted opacity-0 group-hover:opacity-100 transition-opacity">
                View details <ArrowUpRight size={11} />
              </div>
            </button>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2 mb-8">
        <div className="rounded-xl border border-portal-border bg-portal-surface p-6">
          <h2 className="font-display text-lg font-semibold text-portal-text mb-4">Revenue (6 months)</h2>
          {recentInvoices.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={recentInvoices}>
                <XAxis dataKey="month" tick={{ fill: "hsl(var(--portal-text-muted))", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "hsl(var(--portal-text-muted))", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--portal-surface))", border: "1px solid hsl(var(--portal-border))", borderRadius: 8, color: "hsl(var(--portal-text))" }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, "Revenue"]}
                />
                <Bar dataKey="total" fill="hsl(var(--portal-accent))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[200px] items-center justify-center text-sm text-portal-text-muted">No revenue data yet.</div>
          )}
        </div>

        <div className="rounded-xl border border-portal-border bg-portal-surface p-6">
          <h2 className="font-display text-lg font-semibold text-portal-text mb-4">Projects by Status</h2>
          {projectStatuses.length > 0 ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="50%" height={200}>
                <PieChart>
                  <Pie data={projectStatuses} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={80} strokeWidth={2} stroke="hsl(var(--portal-bg))">
                    {projectStatuses.map((entry) => (
                      <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || "#6b7280"} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(var(--portal-surface))", border: "1px solid hsl(var(--portal-border))", borderRadius: 8, color: "hsl(var(--portal-text))" }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {projectStatuses.map((s) => (
                  <div key={s.status} className="flex items-center gap-2 text-sm">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[s.status] || "#6b7280" }} />
                    <span className="capitalize text-portal-text-muted">{s.status}</span>
                    <span className="ml-auto font-medium text-portal-text">{s.count}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex h-[200px] items-center justify-center text-sm text-portal-text-muted">No projects yet.</div>
          )}
        </div>
      </div>

      {/* Deadlines */}
      <div className="mb-8">
        <UpcomingDeadlines />
      </div>

      {/* Activity & Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-portal-border bg-portal-surface p-6">
          <h2 className="font-display text-lg font-semibold text-portal-text mb-4">Recent Activity</h2>
          {activity.length > 0 ? (
            <div className="space-y-3">
              {activity.map((a) => (
                <div key={a.id} className="flex items-start gap-3 rounded-lg px-3 py-2 hover:bg-portal-surface-hover transition-colors">
                  <div className="mt-0.5">{getActionIcon(a.action)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-portal-text truncate">
                      <span className="font-medium">{a.actor_name || "System"}</span>{" "}
                      <span className="text-portal-text-muted">{a.action}</span>{" "}
                      <span className="capitalize text-portal-text-muted">({a.entity_type})</span>
                    </p>
                    <p className="text-xs text-portal-text-muted">{format(new Date(a.created_at), "MMM d, h:mm a")}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-portal-text-muted">No activity yet.</p>
          )}
        </div>

        <div className="rounded-xl border border-portal-border bg-portal-surface p-6">
          <h2 className="font-display text-lg font-semibold text-portal-text mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.label}
                  onClick={() => navigate(action.href)}
                  className="flex items-center gap-3 rounded-lg border border-portal-border px-4 py-3 text-left text-sm text-portal-text hover:bg-portal-surface-hover hover:border-portal-accent/30 transition-all duration-200 group"
                >
                  <Icon size={16} className="text-portal-text-muted group-hover:text-portal-accent transition-colors shrink-0" />
                  <span>{action.label}</span>
                  <ArrowUpRight size={12} className="ml-auto opacity-0 group-hover:opacity-100 text-portal-accent transition-opacity" />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
