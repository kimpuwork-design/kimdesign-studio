import { useMemo } from "react";
import { motion } from "framer-motion";
import { format, subDays, startOfDay, isSameDay } from "date-fns";

interface Activity {
  created_at: string;
}

interface Props {
  activities: Activity[];
}

export function DashboardActivityHeatmap({ activities }: Props) {
  const days = useMemo(() => {
    const d = [];
    const today = new Date();
    // Use 28 days for a clean 4-week grid
    for (let i = 27; i >= 0; i--) {
      const date = startOfDay(subDays(today, i));
      const count = activities.filter(a => isSameDay(new Date(a.created_at), date)).length;
      d.push({ date, count });
    }
    return d;
  }, [activities]);

  const max = Math.max(1, ...days.map(d => d.count));

  return (
    <div className="glass-card p-6 border border-portal-border/40 bg-portal-surface/15 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-display text-sm font-semibold text-portal-text tracking-tight">Activity Density (28d)</h3>
        <div className="flex items-center gap-1.5 text-[10px] text-portal-text-muted uppercase tracking-wider font-medium">
          <span>Less</span>
          {[0.15, 0.4, 0.7, 1].map(o => (
            <div key={o} className="h-2 w-2 rounded-sm bg-portal-accent shadow-[0_0_8px_rgba(var(--portal-accent-rgb),0.2)]" style={{ opacity: o }} />
          ))}
          <span>More</span>
        </div>
      </div>
      <div className="grid grid-cols-7 sm:grid-cols-14 gap-2">
        {days.map((d, i) => {
          const intensity = d.count / max;
          // Scale opacity from a subtle base to full accent
          const opacity = intensity === 0 ? 0.08 : 0.2 + intensity * 0.8;
          
          return (
            <motion.div
              key={d.date.toISOString()}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.01, ease: [0.22, 1, 0.36, 1] }}
              className="aspect-square rounded-sm bg-portal-accent relative group cursor-default"
              style={{ opacity }}
            >
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1.5 bg-portal-surface/95 backdrop-blur-md border border-portal-border/50 rounded shadow-2xl text-[10px] text-portal-text opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap z-50 transform translate-y-1 group-hover:translate-y-0">
                <span className="font-bold">{d.count}</span> {d.count === 1 ? 'activity' : 'activities'} on <span className="text-portal-text-muted">{format(d.date, "MMM d")}</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
