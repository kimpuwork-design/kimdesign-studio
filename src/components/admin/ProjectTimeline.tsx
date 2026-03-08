import { CalendarDays, CheckCircle2, Circle, Clock, Flag } from "lucide-react";
import { motion } from "framer-motion";

interface Milestone {
  id: string;
  label: string;
  date?: string | null;
  status: "completed" | "current" | "upcoming";
  description?: string;
}

interface ProjectTimelineProps {
  milestones: Milestone[];
  className?: string;
}

export function ProjectTimeline({ milestones, className = "" }: ProjectTimelineProps) {
  if (milestones.length === 0) return null;

  return (
    <div className={`relative ${className}`}>
      {/* Vertical line */}
      <div className="absolute left-5 top-0 bottom-0 w-px bg-portal-border" />

      <div className="space-y-0">
        {milestones.map((m, i) => {
          const isCompleted = m.status === "completed";
          const isCurrent = m.status === "current";

          return (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1, duration: 0.3 }}
              className="relative flex gap-4 pb-6 last:pb-0"
            >
              {/* Node */}
              <div className="relative z-10 shrink-0">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${
                  isCompleted
                    ? "border-green-500 bg-green-500/15 text-green-500"
                    : isCurrent
                    ? "border-portal-accent bg-portal-accent/15 text-portal-accent animate-pulse"
                    : "border-portal-border bg-portal-bg text-portal-text-muted"
                }`}>
                  {isCompleted ? (
                    <CheckCircle2 size={16} />
                  ) : isCurrent ? (
                    <Clock size={16} />
                  ) : (
                    <Circle size={14} />
                  )}
                </div>
              </div>

              {/* Content */}
              <div className={`flex-1 rounded-xl border p-4 transition-all ${
                isCurrent
                  ? "border-portal-accent/30 bg-portal-accent/5"
                  : "border-portal-border bg-portal-surface"
              }`}>
                <div className="flex items-start justify-between gap-2">
                  <h4 className={`text-sm font-semibold ${
                    isCompleted ? "text-green-500" : isCurrent ? "text-portal-accent" : "text-portal-text"
                  }`}>
                    {m.label}
                  </h4>
                  {isCurrent && (
                    <span className="rounded-full bg-portal-accent/15 px-2 py-0.5 text-[10px] font-bold text-portal-accent uppercase tracking-wider">
                      Current
                    </span>
                  )}
                </div>
                {m.description && (
                  <p className="mt-1 text-xs text-portal-text-muted">{m.description}</p>
                )}
                {m.date && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-portal-text-muted">
                    <CalendarDays size={11} />
                    <span>{new Date(m.date).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
