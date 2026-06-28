import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Globe2, FileText, Smartphone, Monitor, Tablet, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { subDays } from "date-fns";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { cn } from "@/lib/utils";

interface Row {
  path: string;
  referrer: string | null;
  user_agent: string | null;
  country: string | null;
  visitor_id: string | null;
}

function deviceFromUA(ua: string | null): "mobile" | "tablet" | "desktop" {
  if (!ua) return "desktop";
  const u = ua.toLowerCase();
  if (/ipad|tablet/.test(u)) return "tablet";
  if (/mobi|iphone|android/.test(u)) return "mobile";
  return "desktop";
}

function hostFromReferrer(ref: string | null): string | null {
  if (!ref) return null;
  try {
    return new URL(ref).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

const DEVICE_COLORS: Record<string, string> = {
  desktop: "hsl(243 75% 59%)",
  mobile: "hsl(186 75% 55%)",
  tablet: "hsl(289 65% 65%)",
};

const DEVICE_ICON = { desktop: Monitor, mobile: Smartphone, tablet: Tablet } as const;

export function DashboardInsights() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const since = subDays(new Date(), 7).toISOString();
      const { data } = await supabase
        .from("page_views")
        .select("path, referrer, user_agent, country, visitor_id")
        .gte("created_at", since)
        .limit(5000);
      if (cancelled) return;
      setRows((data as Row[]) ?? []);
      setLoading(false);
    };
    load();

    // Light realtime refresh — same channel name not used elsewhere.
    const ch = supabase
      .channel("dashboard-insights")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "page_views" }, load)
      .subscribe();
    return () => {
      cancelled = true;
      supabase.removeChannel(ch);
    };
  }, []);

  // Top pages — by view count, tie-broken by unique visitors.
  const topPages = (() => {
    const map = new Map<string, { views: number; visitors: Set<string> }>();
    for (const r of rows) {
      const e = map.get(r.path) ?? { views: 0, visitors: new Set<string>() };
      e.views += 1;
      if (r.visitor_id) e.visitors.add(r.visitor_id);
      map.set(r.path, e);
    }
    return Array.from(map.entries())
      .map(([path, e]) => ({ path, views: e.views, visitors: e.visitors.size }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 6);
  })();
  const topPageMax = Math.max(1, ...topPages.map((p) => p.views));

  // Referrers — grouped by host. "(direct)" bucket for empty referrers.
  const referrers = (() => {
    const map = new Map<string, number>();
    for (const r of rows) {
      const host = hostFromReferrer(r.referrer) || "(direct)";
      map.set(host, (map.get(host) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .map(([host, count]) => ({ host, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  })();
  const refMax = Math.max(1, ...referrers.map((r) => r.count));

  // Device split — donut.
  const devices = (() => {
    const counts: Record<string, number> = { desktop: 0, mobile: 0, tablet: 0 };
    for (const r of rows) counts[deviceFromUA(r.user_agent)] += 1;
    return (Object.keys(counts) as (keyof typeof DEVICE_ICON)[])
      .map((k) => ({ name: k, value: counts[k] }))
      .filter((d) => d.value > 0);
  })();
  const deviceTotal = devices.reduce((s, d) => s + d.value, 0);

  return (
    <div className="grid gap-3 md:grid-cols-3">
      {/* Top pages */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32 }}
        className="glass-card p-4"
      >
        <div className="mb-3 flex items-center gap-2">
          <FileText size={14} className="text-portal-accent" />
          <h3 className="font-display text-sm font-semibold text-portal-text">Top pages (7d)</h3>
        </div>
        {loading ? (
          <div className="h-40 animate-pulse rounded-lg bg-portal-bg/30" />
        ) : topPages.length === 0 ? (
          <p className="py-8 text-center text-xs text-portal-text-muted">No page views yet.</p>
        ) : (
          <ul className="space-y-2">
            {topPages.map((p) => (
              <li key={p.path}>
                <div className="mb-1 flex items-center justify-between text-[11px]">
                  <span className="truncate font-mono text-portal-text">{p.path}</span>
                  <span className="text-portal-text-muted whitespace-nowrap">
                    {p.views.toLocaleString()} · {p.visitors.toLocaleString()} ppl
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-portal-bg/60">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(p.views / topPageMax) * 100}%` }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="h-full rounded-full bg-portal-accent"
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </motion.div>

      {/* Referrers */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, delay: 0.05 }}
        className="glass-card p-4"
      >
        <div className="mb-3 flex items-center gap-2">
          <Globe2 size={14} className="text-portal-accent" />
          <h3 className="font-display text-sm font-semibold text-portal-text">Referrers (7d)</h3>
        </div>
        {loading ? (
          <div className="h-40 animate-pulse rounded-lg bg-portal-bg/30" />
        ) : referrers.length === 0 ? (
          <p className="py-8 text-center text-xs text-portal-text-muted">No referrers yet.</p>
        ) : (
          <ul className="space-y-2">
            {referrers.map((r) => (
              <li key={r.host} className="flex items-center gap-2">
                <ExternalLink size={11} className="text-portal-text-muted shrink-0" />
                <span className="flex-1 truncate text-[11px] text-portal-text">{r.host}</span>
                <div className="h-1.5 w-20 overflow-hidden rounded-full bg-portal-bg/60">
                  <div
                    className={cn("h-full rounded-full", r.host === "(direct)" ? "bg-portal-text-muted" : "bg-portal-accent")}
                    style={{ width: `${(r.count / refMax) * 100}%` }}
                  />
                </div>
                <span className="w-8 text-right text-[11px] tabular-nums text-portal-text-muted">{r.count}</span>
              </li>
            ))}
          </ul>
        )}
      </motion.div>

      {/* Device split */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, delay: 0.1 }}
        className="glass-card p-4"
      >
        <div className="mb-3 flex items-center gap-2">
          <Smartphone size={14} className="text-portal-accent" />
          <h3 className="font-display text-sm font-semibold text-portal-text">Device split (7d)</h3>
        </div>
        {loading ? (
          <div className="h-40 animate-pulse rounded-lg bg-portal-bg/30" />
        ) : deviceTotal === 0 ? (
          <p className="py-8 text-center text-xs text-portal-text-muted">No data.</p>
        ) : (
          <div className="flex items-center gap-3">
            <div className="h-32 w-32 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={devices} dataKey="value" innerRadius={36} outerRadius={56} paddingAngle={3} stroke="none">
                    {devices.map((d) => (
                      <Cell key={d.name} fill={DEVICE_COLORS[d.name]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "hsl(240 47% 8%)", border: "1px solid hsl(240 18% 18%)", fontSize: 11, borderRadius: 8 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="flex-1 space-y-2">
              {devices.map((d) => {
                const Icon = DEVICE_ICON[d.name as keyof typeof DEVICE_ICON];
                const pct = Math.round((d.value / deviceTotal) * 100);
                return (
                  <li key={d.name} className="flex items-center gap-2 text-[11px]">
                    <span className="h-2 w-2 rounded-full" style={{ background: DEVICE_COLORS[d.name] }} />
                    <Icon size={12} className="text-portal-text-muted" />
                    <span className="flex-1 capitalize text-portal-text">{d.name}</span>
                    <span className="tabular-nums text-portal-text-muted">{pct}%</span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </motion.div>
    </div>
  );
}
