import { useMemo, useState } from "react";
import { format, subDays, startOfDay, isSameDay } from "date-fns";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface Activity {
  created_at: string;
}

interface Props {
  activities: Activity[];
}

export function DashboardActivityHeatmap({ activities }: Props) {
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
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
          {["bg-portal-accent/15", "bg-portal-accent/40", "bg-portal-accent/70", "bg-portal-accent"].map(color => (
            <div key={color} aria-hidden="true" className={cn("h-2 w-2 rounded-sm", color)} />
          ))}
          <span>More</span>
        </div>
      </div>
      <div role="group" aria-label="Activity by day for the past 28 days" className="grid grid-cols-7 gap-1.5">
        {days.map((d) => {
          const intensity = d.count / max;
          const label = `${format(d.date, "MMMM d, yyyy")}: ${d.count} ${d.count === 1 ? "activity" : "activities"}`;
          const color = d.count === 0 ? "bg-portal-accent/10" : intensity <= 0.25 ? "bg-portal-accent/30" : intensity <= 0.5 ? "bg-portal-accent/50" : intensity <= 0.75 ? "bg-portal-accent/70" : "bg-portal-accent";
          
          return (
            <Tooltip key={d.date.toISOString()}>
              <TooltipTrigger asChild>
                <Button variant="ghost" aria-label={label} aria-pressed={selectedDay === d.date.toISOString()}
                  onClick={() => setSelectedDay(d.date.toISOString())}
                  className={cn("relative h-auto min-h-11 w-full rounded-sm p-0 focus-visible:ring-portal-accent", selectedDay === d.date.toISOString() && "ring-2 ring-portal-accent ring-offset-2 ring-offset-portal-bg")}>
                  <span aria-hidden="true" className={cn("absolute inset-0 rounded-sm", color)} />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="border-portal-border bg-portal-surface text-portal-text">{label}</TooltipContent>
            </Tooltip>
          );
        })}
      </div>
      <p aria-live="polite" className="mt-3 min-h-5 text-xs text-portal-text-muted">
        {days.filter(d => d.date.toISOString() === selectedDay).map(d => `${format(d.date, "MMM d, yyyy")}: ${d.count} ${d.count === 1 ? "activity" : "activities"}`)}
      </p>
    </div>
  );
}
