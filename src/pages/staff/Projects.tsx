import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { PortalLayout } from "@/components/PortalLayout";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { supabase } from "@/integrations/supabase/client";
import { FolderOpen, CalendarDays, MapPin, ArrowRight, Search } from "lucide-react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

interface Project {
  id: string;
  title: string;
  description: string | null;
  status: string;
  location: string | null;
  target_date: string | null;
  thumbnail_url: string | null;
  updated_at: string;
}

const STATUS_OPTIONS = ["all", "inquiry", "active", "review", "delivered", "archived"];

export default function StaffProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("projects")
      .select("id, title, description, status, location, target_date, thumbnail_url, updated_at")
      .order("updated_at", { ascending: false });

    if (statusFilter !== "all") query = query.eq("status", statusFilter);
    const { data } = await query;
    setProjects((data as Project[]) ?? []);
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const filtered = projects.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return p.title.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q) || p.location?.toLowerCase().includes(q);
  });

  return (
    <PortalLayout variant="staff">
      <PageHeader title="Projects" subtitle="Projects you are assigned to." />

      {/* Search + Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-portal-text-muted" />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-portal-border bg-portal-bg text-sm text-portal-text placeholder:text-portal-text-muted focus:outline-none focus:ring-2 focus:ring-portal-accent/50"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
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
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-xl border border-portal-border bg-portal-surface p-5 space-y-3">
              <div className="flex justify-between">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <div className="flex gap-3">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="rounded-xl border border-portal-border bg-portal-surface flex flex-col items-center justify-center py-16 text-portal-text-muted">
          <FolderOpen size={48} className="mb-4 opacity-30" />
          <p className="font-medium text-portal-text">No projects found</p>
          <p className="text-sm mt-1">
            {search.trim() ? "Try a different search term." : "An admin will assign projects to you."}
          </p>
        </motion.div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((project, i) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.35 }}
            >
              <Link to={`/staff/projects/${project.id}`}
                className="group rounded-xl border border-portal-border bg-portal-surface hover:border-portal-accent/40 transition-all duration-300 block overflow-hidden">
                {project.thumbnail_url && (
                  <div className="h-32 overflow-hidden">
                    <img src={project.thumbnail_url} alt={project.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                )}
                <div className="p-5">
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
                    {project.location && <span className="flex items-center gap-1"><MapPin size={11} />{project.location}</span>}
                    {project.target_date && (
                      <span className="flex items-center gap-1">
                        <CalendarDays size={11} />Due {new Date(project.target_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <div className="mt-4 flex justify-end text-portal-accent/70 group-hover:text-portal-accent transition-colors">
                    <ArrowRight size={14} />
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
