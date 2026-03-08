import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { PortalLayout } from "@/components/PortalLayout";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { supabase } from "@/integrations/supabase/client";
import { FolderOpen, CalendarDays, MapPin, ArrowRight, ImageIcon, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";

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
  const [search, setSearch] = useState("");

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("projects")
      .select("id, title, description, status, location, start_date, target_date, updated_at, thumbnail_url")
      .order("updated_at", { ascending: false });

    if (statusFilter !== "all") query = query.eq("status", statusFilter);
    if (search.trim()) query = query.ilike("title", `%${search}%`);
    const { data } = await query;
    setProjects((data as Project[]) ?? []);
    setLoading(false);
  }, [statusFilter, search]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  return (
    <PortalLayout variant="client">
      <PageHeader title="My Projects" subtitle="Track the progress of your work with us." />

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-portal-text-muted" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search projects..."
            className="pl-9 h-9 text-xs bg-portal-surface/30 border-portal-border/50 text-portal-text placeholder:text-portal-text-muted" />
        </div>
        <div className="flex flex-wrap gap-1">
          {STATUS_OPTIONS.map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all",
                statusFilter === s
                  ? "border-portal-accent bg-portal-accent/15 text-portal-accent"
                  : "border-portal-border/50 text-portal-text-muted hover:border-portal-accent/40 hover:text-portal-text"
              )}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-card overflow-hidden animate-pulse">
              <div className="aspect-[2.4/1] bg-portal-surface" />
              <div className="p-4 space-y-2">
                <div className="h-4 w-2/3 bg-portal-surface rounded" />
                <div className="h-3 w-1/2 bg-portal-surface rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center py-20 text-portal-text-muted">
          <FolderOpen size={40} className="mb-3 opacity-30" />
          <p className="font-medium text-portal-text">No projects yet</p>
          <p className="text-sm mt-1">Your studio will assign projects to you here.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {projects.map((project, i) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.4 }}
            >
              <Link
                to={`/app/projects/${project.id}`}
                className="group glass-card glass-card-hover overflow-hidden block"
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
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute top-3 right-3">
                    <StatusBadge status={project.status} />
                  </div>
                  <div className="absolute bottom-3 left-4 right-4">
                    <h3 className="font-display text-lg font-semibold text-white drop-shadow-lg group-hover:text-portal-accent transition-colors line-clamp-1">
                      {project.title}
                    </h3>
                    <p className="text-[11px] text-white/60 mt-0.5">
                      Updated {formatDistanceToNow(new Date(project.updated_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>

                <div className="p-4">
                  {project.description && (
                    <p className="text-xs text-portal-text-muted mb-3 line-clamp-2">{project.description}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-2 text-[11px] text-portal-text-muted">
                      {project.location && (
                        <span className="flex items-center gap-1 bg-portal-surface/80 rounded-full px-2 py-0.5">
                          <MapPin size={9} />{project.location}
                        </span>
                      )}
                      {project.target_date && (
                        <span className="flex items-center gap-1 bg-portal-surface/80 rounded-full px-2 py-0.5">
                          <CalendarDays size={9} />Due {new Date(project.target_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <span className="flex items-center gap-1 text-[11px] text-portal-accent/70 group-hover:text-portal-accent transition-colors">
                      View <ArrowRight size={10} />
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </PortalLayout>
  );
}
