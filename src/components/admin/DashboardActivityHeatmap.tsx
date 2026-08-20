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
    for (let i = 27; i >= 0; i--) {
      const date = startOfDay(subDays(new Date(), i));
      const count = activities.filter(a => isSameDay(new Date(a.created_at), date)).length;
      d.push({ date, count });
    }
    return d;
  }, [activities]);

  const max = Math.max(1, ...days.map(d => d.count));

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-portal-text">Activity Density (28d)</h3>
        <div className="flex items-center gap-1.5 text-[10px] text-portal-text-muted uppercase tracking-wider">
          <span>Less</span>
          {[0.1, 0.3, 0.6, 1].map(o => (
            <div key={o} className="h-2 w-2 rounded-sm bg-portal-accent" style={{ opacity: o }} />
          ))}
          <span>More</span>
        </div>
      </div>
      <div className="grid grid-cols-7 sm:grid-cols-14 gap-1.5">
        {days.map((d, i) => {
          const intensity = d.count / max;
          const opacity = intensity === 0 ? 0.05 : 0.1 + intensity * 0.9;
          
          return (
            <motion.div
              key={d.date.toISOString()}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.01 }}
              className="aspect-square rounded-sm bg-portal-accent relative group"
              style={{ opacity }}
              title={`${format(d.date, "MMM d")}: ${d.count} activities`}
            >
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-portal-surface border border-portal-border rounded text-[10px] text-portal-text opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                {format(d.date, "MMM d")}: {d.count}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
