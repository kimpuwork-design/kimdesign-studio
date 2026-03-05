import { PortalLayout } from "@/components/PortalLayout";
import { PageHeader } from "@/components/PageHeader";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
} from "recharts";
import { format, subDays, startOfDay, eachDayOfInterval, parseISO } from "date-fns";
import { Eye, Users, Globe, Clock, TrendingUp, Monitor, Smartphone, ArrowUpRight, ArrowDownRight, Activity, MousePointerClick } from "lucide-react";

interface PageView {
  id: string;
  path: string;
  referrer: string | null;
  user_agent: string | null;
  session_id: string | null;
  visitor_id: string | null;
  created_at: string;
}

interface DayData {
  date: string;
  views: number;
  visitors: number;
}

interface PageData {
  path: string;
  views: number;
  percentage: number;
}

const ACCENT_COLORS = ["#818cf8", "#34d399", "#fbbf24", "#f472b6", "#60a5fa", "#a78bfa", "#fb923c"];

const RANGE_OPTIONS = [
  { label: "7D", days: 7 },
  { label: "14D", days: 14 },
  { label: "30D", days: 30 },
  { label: "90D", days: 90 },
];

const PAGE_LABELS: Record<string, string> = {
  "/": "Home",
  "/portfolio": "Portfolio",
  "/projects": "Projects",
  "/services": "Services",
  "/about": "About",
  "/contact": "Contact",
  "/blog": "Blog",
};

function getDeviceType(ua: string | null): "desktop" | "mobile" | "tablet" {
  if (!ua) return "desktop";
  if (/tablet|ipad/i.test(ua)) return "tablet";
  if (/mobile|android|iphone/i.test(ua)) return "mobile";
  return "desktop";
}

export default function Analytics() {
  const [views, setViews] = useState<PageView[]>([]);
  const [loading, setLoading] = useState(true);
  const [rangeDays, setRangeDays] = useState(30);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const since = subDays(new Date(), rangeDays).toISOString();
    const { data } = await supabase
      .from("page_views")
      .select("*")
      .gte("created_at", since)
      .order("created_at", { ascending: true });
    setViews((data as PageView[]) || []);
    setLoading(false);
  }, [rangeDays]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Compute metrics
  const totalViews = views.length;
  const uniqueVisitors = new Set(views.map((v) => v.visitor_id).filter(Boolean)).size;
  const uniqueSessions = new Set(views.map((v) => v.session_id).filter(Boolean)).size;
  const avgPagesPerSession = uniqueSessions > 0 ? (totalViews / uniqueSessions).toFixed(1) : "0";

  // Previous period comparison
  const prevSince = subDays(new Date(), rangeDays * 2).toISOString();
  const currentStart = subDays(new Date(), rangeDays).toISOString();
  // We only have current data, so compute trend from first/second half
  const midpoint = Math.floor(views.length / 2);
  const firstHalf = views.slice(0, midpoint).length;
  const secondHalf = views.slice(midpoint).length;
  const viewsTrend = firstHalf > 0 ? Math.round(((secondHalf - firstHalf) / firstHalf) * 100) : 0;

  // Daily chart data
  const dailyData: DayData[] = (() => {
    const days = eachDayOfInterval({
      start: subDays(new Date(), rangeDays - 1),
      end: new Date(),
    });
    return days.map((day) => {
      const dayStr = format(day, "yyyy-MM-dd");
      const dayViews = views.filter((v) => v.created_at.startsWith(dayStr));
      return {
        date: format(day, rangeDays > 14 ? "MMM d" : "EEE d"),
        views: dayViews.length,
        visitors: new Set(dayViews.map((v) => v.visitor_id).filter(Boolean)).size,
      };
    });
  })();

  // Top pages
  const pageMap = new Map<string, number>();
  views.forEach((v) => pageMap.set(v.path, (pageMap.get(v.path) || 0) + 1));
  const topPages: PageData[] = [...pageMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([path, count]) => ({
      path,
      views: count,
      percentage: totalViews > 0 ? Math.round((count / totalViews) * 100) : 0,
    }));

  // Device breakdown
  const devices = { desktop: 0, mobile: 0, tablet: 0 };
  views.forEach((v) => { devices[getDeviceType(v.user_agent)]++; });
  const deviceData = [
    { name: "Desktop", value: devices.desktop, icon: Monitor },
    { name: "Mobile", value: devices.mobile, icon: Smartphone },
    { name: "Tablet", value: devices.tablet, icon: Monitor },
  ].filter((d) => d.value > 0);

  // Top referrers
  const refMap = new Map<string, number>();
  views.forEach((v) => {
    if (v.referrer) {
      try {
        const host = new URL(v.referrer).hostname || "Direct";
        refMap.set(host, (refMap.get(host) || 0) + 1);
      } catch {
        refMap.set("Direct", (refMap.get("Direct") || 0) + 1);
      }
    }
  });
  const topReferrers = [...refMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Hourly heatmap
  const hourly = Array(24).fill(0);
  views.forEach((v) => {
    const h = new Date(v.created_at).getHours();
    hourly[h]++;
  });
  const hourlyData = hourly.map((count, hour) => ({
    hour: `${hour.toString().padStart(2, "0")}:00`,
    views: count,
  }));

  const statCards = [
    { label: "Page Views", value: totalViews.toLocaleString(), icon: Eye, trend: viewsTrend, color: "text-indigo-400" },
    { label: "Unique Visitors", value: uniqueVisitors.toLocaleString(), icon: Users, color: "text-emerald-400" },
    { label: "Sessions", value: uniqueSessions.toLocaleString(), icon: Activity, color: "text-amber-400" },
    { label: "Pages / Session", value: avgPagesPerSession, icon: MousePointerClick, color: "text-pink-400" },
  ];

  return (
    <PortalLayout variant="admin">
      <PageHeader title="Site Analytics" subtitle="Track visitor activity across your public website" />

      {/* Range selector */}
      <div className="flex items-center gap-2 mb-6">
        {RANGE_OPTIONS.map((opt) => (
          <button
            key={opt.days}
            onClick={() => setRangeDays(opt.days)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              rangeDays === opt.days
                ? "bg-portal-accent text-portal-accent-foreground"
                : "bg-portal-surface/60 text-portal-text-muted hover:bg-portal-surface"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-32">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-portal-accent border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {statCards.map((s) => (
              <div key={s.label} className="glass-card p-5 rounded-2xl">
                <div className="flex items-center justify-between mb-3">
                  <s.icon size={18} className={s.color} />
                  {s.trend !== undefined && s.trend !== 0 && (
                    <span className={`flex items-center gap-0.5 text-xs font-medium ${s.trend > 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {s.trend > 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                      {Math.abs(s.trend)}%
                    </span>
                  )}
                </div>
                <div className="text-2xl font-bold text-portal-text">{s.value}</div>
                <div className="text-xs text-portal-text-muted mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Main chart — Views & Visitors over time */}
          <div className="glass-card p-6 rounded-2xl">
            <h3 className="text-sm font-semibold text-portal-text mb-4">Traffic Overview</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={dailyData}>
                <defs>
                  <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#818cf8" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#818cf8" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="visitorsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34d399" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "rgba(15,23,42,0.9)", border: "1px solid rgba(148,163,184,0.2)", borderRadius: 12, fontSize: 12 }}
                  labelStyle={{ color: "#e2e8f0" }}
                />
                <Area type="monotone" dataKey="views" stroke="#818cf8" fill="url(#viewsGrad)" strokeWidth={2} name="Page Views" />
                <Area type="monotone" dataKey="visitors" stroke="#34d399" fill="url(#visitorsGrad)" strokeWidth={2} name="Visitors" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Pages */}
            <div className="glass-card p-6 rounded-2xl">
              <h3 className="text-sm font-semibold text-portal-text mb-4 flex items-center gap-2">
                <Globe size={16} className="text-portal-accent" /> Top Pages
              </h3>
              {topPages.length === 0 ? (
                <p className="text-sm text-portal-text-muted">No data yet</p>
              ) : (
                <div className="space-y-3">
                  {topPages.map((page, i) => (
                    <div key={page.path} className="flex items-center gap-3">
                      <span className="text-xs font-mono text-portal-text-muted w-6 text-right">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-portal-text truncate">{PAGE_LABELS[page.path] || page.path}</span>
                          <span className="text-xs text-portal-text-muted ml-2">{page.views} views</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-portal-surface overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${page.percentage}%`,
                              backgroundColor: ACCENT_COLORS[i % ACCENT_COLORS.length],
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Device Breakdown */}
            <div className="glass-card p-6 rounded-2xl">
              <h3 className="text-sm font-semibold text-portal-text mb-4 flex items-center gap-2">
                <Monitor size={16} className="text-portal-accent" /> Devices
              </h3>
              {deviceData.length === 0 ? (
                <p className="text-sm text-portal-text-muted">No data yet</p>
              ) : (
                <div className="flex items-center gap-6">
                  <ResponsiveContainer width={140} height={140}>
                    <PieChart>
                      <Pie data={deviceData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={35} outerRadius={60} strokeWidth={0}>
                        {deviceData.map((_, i) => (
                          <Cell key={i} fill={ACCENT_COLORS[i % ACCENT_COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-3 flex-1">
                    {deviceData.map((d, i) => (
                      <div key={d.name} className="flex items-center gap-3">
                        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: ACCENT_COLORS[i % ACCENT_COLORS.length] }} />
                        <span className="text-sm text-portal-text flex-1">{d.name}</span>
                        <span className="text-sm font-medium text-portal-text">{d.value}</span>
                        <span className="text-xs text-portal-text-muted">
                          ({totalViews > 0 ? Math.round((d.value / totalViews) * 100) : 0}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Hourly Activity */}
            <div className="glass-card p-6 rounded-2xl">
              <h3 className="text-sm font-semibold text-portal-text mb-4 flex items-center gap-2">
                <Clock size={16} className="text-portal-accent" /> Hourly Activity
              </h3>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={hourlyData}>
                  <XAxis dataKey="hour" tick={{ fill: "#94a3b8", fontSize: 9 }} axisLine={false} tickLine={false} interval={2} />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: "rgba(15,23,42,0.9)", border: "1px solid rgba(148,163,184,0.2)", borderRadius: 12, fontSize: 12 }}
                  />
                  <Bar dataKey="views" fill="#818cf8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Top Referrers */}
            <div className="glass-card p-6 rounded-2xl">
              <h3 className="text-sm font-semibold text-portal-text mb-4 flex items-center gap-2">
                <TrendingUp size={16} className="text-portal-accent" /> Top Referrers
              </h3>
              {topReferrers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-portal-text-muted">
                  <Globe size={32} className="mb-2 opacity-40" />
                  <p className="text-sm">No referrer data yet</p>
                  <p className="text-xs mt-1">Visitors mostly arrive directly</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {topReferrers.map(([host, count], i) => (
                    <div key={host} className="flex items-center gap-3">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: ACCENT_COLORS[i % ACCENT_COLORS.length] }} />
                      <span className="text-sm text-portal-text flex-1 truncate">{host}</span>
                      <span className="text-sm font-medium text-portal-text">{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Live recent views */}
          <div className="glass-card p-6 rounded-2xl">
            <h3 className="text-sm font-semibold text-portal-text mb-4 flex items-center gap-2">
              <Activity size={16} className="text-emerald-400" /> Recent Page Views
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-portal-border/50">
                    <th className="text-left py-2 px-3 text-portal-text-muted font-medium text-xs">Page</th>
                    <th className="text-left py-2 px-3 text-portal-text-muted font-medium text-xs">Time</th>
                    <th className="text-left py-2 px-3 text-portal-text-muted font-medium text-xs hidden md:table-cell">Device</th>
                    <th className="text-left py-2 px-3 text-portal-text-muted font-medium text-xs hidden lg:table-cell">Referrer</th>
                  </tr>
                </thead>
                <tbody>
                  {views.slice(-20).reverse().map((v) => (
                    <tr key={v.id} className="border-b border-portal-border/20 hover:bg-portal-surface/30 transition-colors">
                      <td className="py-2 px-3 text-portal-text font-medium">{PAGE_LABELS[v.path] || v.path}</td>
                      <td className="py-2 px-3 text-portal-text-muted text-xs">{format(new Date(v.created_at), "MMM d, HH:mm")}</td>
                      <td className="py-2 px-3 text-portal-text-muted text-xs capitalize hidden md:table-cell">{getDeviceType(v.user_agent)}</td>
                      <td className="py-2 px-3 text-portal-text-muted text-xs truncate max-w-[200px] hidden lg:table-cell">
                        {v.referrer ? (() => { try { return new URL(v.referrer).hostname; } catch { return "Direct"; } })() : "Direct"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {views.length === 0 && (
                <p className="text-center text-portal-text-muted py-8 text-sm">No page views recorded yet. Visit your public site to start tracking!</p>
              )}
            </div>
          </div>
        </div>
      )}
    </PortalLayout>
  );
}
