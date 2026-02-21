import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Clock, AlertTriangle, CheckCircle2 } from "lucide-react";
import { differenceInDays, format } from "date-fns";

interface DeadlineProject {
  id: string;
  title: string;
  target_date: string;
  status: string;
}

export function UpcomingDeadlines() {
  const [projects, setProjects] = useState<DeadlineProject[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    const twoWeeks = new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0];

    supabase
      .from("projects")
      .select("id, title, target_date, status")
      .neq("status", "archived")
      .neq("status", "completed")
      .not("target_date", "is", null)
      .gte("target_date", today)
      .lte("target_date", twoWeeks)
      .order("target_date", { ascending: true })
      .limit(6)
      .then(({ data }) => setProjects((data as DeadlineProject[]) ?? []));
  }, []);

  if (projects.length === 0) return null;

  return (
    <div className="glass-card p-6">
      <h2 className="font-display text-lg font-semibold text-portal-text mb-4 flex items-center gap-2">
        <Clock size={18} className="text-portal-accent" />
        Upcoming Deadlines
      </h2>
      <div className="space-y-2">
        {projects.map((p) => {
          const daysLeft = differenceInDays(new Date(p.target_date), new Date());
          const urgencyColor = daysLeft <= 3 ? "text-red-400" : daysLeft <= 7 ? "text-yellow-400" : "text-green-400";
          const urgencyGlow = daysLeft <= 3 ? "shadow-[0_0_8px_rgba(248,113,113,0.3)]" : daysLeft <= 7 ? "shadow-[0_0_8px_rgba(250,204,21,0.2)]" : "";
          const UrgencyIcon = daysLeft <= 3 ? AlertTriangle : daysLeft <= 7 ? Clock : CheckCircle2;

          return (
            <button
              key={p.id}
              onClick={() => navigate(`/admin/projects/${p.id}`)}
              className="flex items-center gap-3 w-full glass-card-hover rounded-lg px-3 py-2.5 transition-all duration-200 text-left"
            >
              <div className={`rounded-full p-1 ${urgencyGlow}`}>
                <UrgencyIcon size={14} className={urgencyColor + " shrink-0"} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-portal-text truncate">{p.title}</p>
                <p className="text-xs text-portal-text-muted">{format(new Date(p.target_date), "MMM d, yyyy")}</p>
              </div>
              <span className={`text-xs font-semibold ${urgencyColor}`}>
                {daysLeft === 0 ? "Today" : `${daysLeft}d`}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
