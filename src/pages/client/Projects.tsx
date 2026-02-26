import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { PortalLayout } from "@/components/PortalLayout";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { supabase } from "@/integrations/supabase/client";
import { FolderOpen, CalendarDays, MapPin, ArrowRight, ImageIcon } from "lucide-react";

interface Project {
  id: string;
  title: string;
  description: string | null;
  status: string;
  location: string | null;
  start_date: string | null;
  target_date: string | null;
  updated_at: string;
  thumbnail_url: string | null;
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
      .select("id, title, description, status, location, start_date, target_date, updated_at, thumbnail_url")
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
              className="group glass-card glass-card-hover glass-glow-ring overflow-hidden"
            >
              {/* Thumbnail */}
              <div className="aspect-[2.4/1] overflow-hidden relative bg-portal-surface">
                {project.thumbnail_url ? (
                  <img
                    src={project.thumbnail_url}
                    alt={project.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon size={28} className="text-portal-text-muted/20" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute top-3 right-3">
                  <StatusBadge status={project.status} />
                </div>
                <div className="absolute bottom-3 left-4 right-4">
                  <h3 className="font-display text-lg font-semibold text-white drop-shadow-lg group-hover:text-portal-accent transition-colors line-clamp-1">
                    {project.title}
                  </h3>
                </div>
              </div>

              <div className="p-4">
                {project.description && (
                  <p className="text-sm text-portal-text-muted mb-3 line-clamp-2">{project.description}</p>
                )}
                <div className="flex flex-wrap gap-3 text-xs text-portal-text-muted">
                  {project.location && (
                    <span className="flex items-center gap-1.5 bg-portal-surface rounded-full px-2.5 py-1">
                      <MapPin size={10} />{project.location}
                    </span>
                  )}
                  {project.target_date && (
                    <span className="flex items-center gap-1.5 bg-portal-surface rounded-full px-2.5 py-1">
                      <CalendarDays size={10} />Due {new Date(project.target_date).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <div className="mt-3 flex items-center justify-end gap-1 text-xs text-portal-accent/70 group-hover:text-portal-accent transition-colors">
                  View details <ArrowRight size={12} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </PortalLayout>
  );
}
