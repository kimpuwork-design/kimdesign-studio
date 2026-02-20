import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { PortalLayout } from "@/components/PortalLayout";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { supabase } from "@/integrations/supabase/client";
import { FolderOpen, CalendarDays, MapPin, ArrowRight } from "lucide-react";

interface Project {
  id: string;
  title: string;
  description: string | null;
  status: string;
  location: string | null;
  start_date: string | null;
  target_date: string | null;
  updated_at: string;
}

const STATUS_OPTIONS = ["all", "inquiry", "active", "review", "delivered", "archived"];

export default function ClientProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("projects")
      .select("id, title, description, status, location, start_date, target_date, updated_at")
      .order("updated_at", { ascending: false });

    if (statusFilter !== "all") query = query.eq("status", statusFilter);
    const { data } = await query;
    setProjects((data as Project[]) ?? []);
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  return (
    <PortalLayout variant="client">
      <PageHeader title="My Projects" subtitle="Track the progress of your work with us." />

      {/* Status filter */}
      <div className="mb-6 flex flex-wrap gap-1.5">
        {STATUS_OPTIONS.map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              statusFilter === s
                ? "border-portal-accent bg-portal-accent/15 text-portal-accent"
                : "border-portal-border text-portal-text-muted hover:border-portal-accent/50"
            }`}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-portal-accent border-t-transparent" />
        </div>
      ) : projects.length === 0 ? (
        <div className="rounded-xl border border-portal-border bg-portal-surface flex flex-col items-center justify-center py-16 text-portal-text-muted">
          <FolderOpen size={48} className="mb-4 opacity-30" />
          <p className="font-medium text-portal-text">No projects yet</p>
          <p className="text-sm mt-1">Your studio will assign projects to you here.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {projects.map((project) => (
            <Link
              key={project.id}
              to={`/app/projects/${project.id}`}
              className="group rounded-xl border border-portal-border bg-portal-surface p-5 hover:border-portal-accent/40 transition-colors"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <h3 className="font-display text-lg font-semibold text-portal-text group-hover:text-portal-accent transition-colors">
                  {project.title}
                </h3>
                <StatusBadge status={project.status} />
              </div>
              {project.description && (
                <p className="text-sm text-portal-text-muted mb-3 line-clamp-2">{project.description}</p>
              )}
              <div className="flex flex-wrap gap-3 text-xs text-portal-text-muted">
                {project.location && (
                  <span className="flex items-center gap-1"><MapPin size={11} />{project.location}</span>
                )}
                {project.target_date && (
                  <span className="flex items-center gap-1">
                    <CalendarDays size={11} />Due {new Date(project.target_date).toLocaleDateString()}
                  </span>
                )}
              </div>
              <div className="mt-4 flex items-center justify-end text-portal-accent/70 group-hover:text-portal-accent transition-colors">
                <ArrowRight size={14} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </PortalLayout>
  );
}
