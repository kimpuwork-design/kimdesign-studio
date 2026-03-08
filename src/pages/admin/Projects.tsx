import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { PortalLayout } from "@/components/PortalLayout";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { ProjectFormModal } from "@/components/admin/ProjectFormModal";
import { StaffAssignModal } from "@/components/admin/StaffAssignModal";
import { supabase } from "@/integrations/supabase/client";
import { writeAuditLog } from "@/lib/audit";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, Search, Pencil, Trash2, Users, ExternalLink, Star, Eye, EyeOff, LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Project {
  id: string;
  client_id: string;
  title: string;
  description: string | null;
  status: string;
  location: string | null;
  start_date: string | null;
  target_date: string | null;
  created_at: string;
  updated_at: string;
  is_public: boolean;
  thumbnail_url: string | null;
  slug: string | null;
  summary: string | null;
  content: string | null;
  category: string | null;
  tags: string[];
  year: number | null;
  is_featured: boolean;
  profiles: { full_name: string | null; company: string | null } | null;
}

const STATUS_OPTIONS = ["all", "inquiry", "active", "review", "delivered", "archived"];

export default function AdminProjects() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [assignProject, setAssignProject] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("projects")
      .select("*, profiles(full_name, company)")
      .order("updated_at", { ascending: false });

    if (statusFilter !== "all") query = query.eq("status", statusFilter);
    if (search.trim()) query = query.ilike("title", `%${search}%`);

    const { data } = await query;
    setProjects((data as unknown as Project[]) ?? []);
    setLoading(false);
  }, [statusFilter, search]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const handleDelete = async (project: Project) => {
    if (!confirm(`Delete project "${project.title}"? This cannot be undone.`)) return;
    setDeleting(project.id);
    await supabase.from("projects").delete().eq("id", project.id);
    if (profile) await writeAuditLog({
      actor_id: profile.id, action: "project_deleted", entity_type: "project",
      entity_id: project.id, metadata: { title: project.title },
    });
    setDeleting(null);
    fetchProjects();
  };

  const handleToggleFeatured = async (project: Project) => {
    setToggling(project.id + "_feat");
    const { error } = await supabase.from("projects").update({ is_featured: !project.is_featured }).eq("id", project.id);
    if (!error) fetchProjects();
    setToggling(null);
  };

  const handleTogglePublic = async (project: Project) => {
    setToggling(project.id);
    const newVal = !project.is_public;
    const { error } = await supabase.from("projects").update({ is_public: newVal }).eq("id", project.id);
    if (!error) {
      toast({ title: newVal ? "Published" : "Unpublished" });
      fetchProjects();
    }
    setToggling(null);
  };

  return (
    <PortalLayout variant="admin">
      <PageHeader
        title="Projects & Portfolio"
        subtitle={`${projects.length} projects`}
        action={
          <Button onClick={() => { setEditProject(null); setShowForm(true); }}
            className="bg-portal-accent text-portal-accent-foreground hover:bg-portal-accent/90 shadow-lg shadow-portal-accent/20">
            <Plus size={15} className="mr-1.5" /> New Project
          </Button>
        }
      />

      {/* Filters */}
      <div className="mb-4 md:mb-5 space-y-2.5 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-3">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="relative flex-1 sm:flex-initial sm:w-52 md:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-portal-text-muted" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..."
              className="pl-9 h-9 text-xs bg-portal-surface/30 border-portal-border/50 text-portal-text placeholder:text-portal-text-muted" />
          </div>
          <div className="hidden md:flex border border-portal-border/40 rounded-lg overflow-hidden">
            <button onClick={() => setViewMode("table")}
              className={cn("p-2 transition-colors", viewMode === "table" ? "bg-portal-surface text-portal-text" : "text-portal-text-muted hover:text-portal-text")}>
              <List size={14} />
            </button>
            <button onClick={() => setViewMode("grid")}
              className={cn("p-2 transition-colors", viewMode === "grid" ? "bg-portal-surface text-portal-text" : "text-portal-text-muted hover:text-portal-text")}>
              <LayoutGrid size={14} />
            </button>
          </div>
        </div>
        <div className="flex gap-1 overflow-x-auto scrollbar-none pb-0.5">
          {STATUS_OPTIONS.map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all whitespace-nowrap shrink-0",
                statusFilter === s
                  ? "border-portal-accent bg-portal-accent/15 text-portal-accent"
                  : "border-portal-border/50 text-portal-text-muted hover:border-portal-accent/40 hover:text-portal-text"
              )}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="glass-card flex items-center justify-center py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-portal-accent border-t-transparent" />
        </div>
      ) : projects.length === 0 ? (
        <div className="glass-card py-20 text-center">
          <p className="font-medium text-portal-text">No projects found</p>
          <p className="mt-1 text-sm text-portal-text-muted">Create your first project to get started.</p>
          <Button className="mt-4 bg-portal-accent text-portal-accent-foreground" size="sm"
            onClick={() => { setEditProject(null); setShowForm(true); }}>
            <Plus size={14} className="mr-1" /> New Project
          </Button>
        </div>
      ) : viewMode === "grid" ? (
        /* Grid View */
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {projects.map((project) => (
            <div key={project.id} className="glass-card glass-card-hover overflow-hidden group cursor-pointer"
              onClick={() => navigate(`/admin/projects/${project.id}`)}>
              <div className="aspect-[16/10] relative overflow-hidden bg-portal-surface">
                {project.thumbnail_url ? (
                  <img src={project.thumbnail_url} alt="" className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-portal-text-muted">
                    <LayoutGrid size={24} />
                  </div>
                )}
                <div className="absolute top-2 right-2 flex gap-1">
                  {project.is_featured && (
                    <span className="rounded-full bg-yellow-500/90 p-1"><Star size={10} className="text-white fill-white" /></span>
                  )}
                  <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", project.is_public ? "bg-emerald-500/90 text-white" : "bg-portal-bg/80 text-portal-text-muted backdrop-blur-sm")}>
                    {project.is_public ? "Public" : "Draft"}
                  </span>
                </div>
              </div>
              <div className="p-3">
                <p className="font-display text-sm font-semibold text-portal-text truncate">{project.title}</p>
                <p className="text-[11px] text-portal-text-muted mt-0.5">{project.profiles?.full_name ?? "—"}</p>
                <div className="flex items-center justify-between mt-2">
                  <StatusBadge status={project.status} />
                  <span className="text-[10px] text-portal-text-muted">{new Date(project.updated_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-portal-border/60 bg-portal-surface/30">
                  {["Title", "Client", "Category", "Status", "Portfolio", "Updated", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-widest text-portal-text-muted/70">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-portal-border/30">
                {projects.map((project) => (
                  <tr key={project.id} className="hover:bg-portal-accent/[0.04] transition-colors group">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        {project.thumbnail_url ? (
                          <img src={project.thumbnail_url} alt="" className="h-8 w-12 rounded-md object-cover shrink-0 bg-portal-border" loading="lazy" />
                        ) : (
                          <div className="h-8 w-12 rounded-md bg-portal-surface shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-portal-text text-xs truncate max-w-[160px]">{project.title}</p>
                          {project.slug && <p className="text-[10px] text-portal-text-muted/60">/{project.slug}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-portal-text-muted text-xs">{project.profiles?.full_name ?? "—"}</td>
                    <td className="px-4 py-3 text-portal-text-muted text-xs">{project.category ?? "—"}</td>
                    <td className="px-4 py-3">
                      <select
                        value={project.status}
                        onClick={(e) => e.stopPropagation()}
                        onChange={async (e) => {
                          e.stopPropagation();
                          const newStatus = e.target.value;
                          await supabase.from("projects").update({ status: newStatus }).eq("id", project.id);
                          if (profile) await writeAuditLog({
                            actor_id: profile.id, action: "project_status_changed", entity_type: "project",
                            entity_id: project.id, metadata: { from: project.status, to: newStatus },
                          });
                          fetchProjects();
                        }}
                        className="bg-portal-surface/50 border border-portal-border/50 rounded-lg px-2 py-1 text-[11px] font-medium text-portal-text cursor-pointer focus:outline-none focus:ring-1 focus:ring-portal-accent"
                      >
                        {["inquiry", "active", "review", "delivered", "archived"].map((s) => (
                          <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold", project.is_public ? "bg-emerald-500/15 text-emerald-400" : "bg-portal-surface text-portal-text-muted/60")}>
                          {project.is_public ? "Public" : "Draft"}
                        </span>
                        {project.is_featured && <Star size={11} className="text-yellow-400 fill-yellow-400" />}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-portal-text-muted text-[11px]">
                      {new Date(project.updated_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => { e.stopPropagation(); navigate(`/admin/projects/${project.id}`); }}
                          className="rounded-md p-1.5 text-portal-text-muted hover:bg-portal-surface hover:text-portal-accent transition-colors" title="View">
                          <ExternalLink size={13} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleToggleFeatured(project); }} title="Toggle featured"
                          className={cn("rounded-md p-1.5 transition-colors hover:bg-portal-surface", project.is_featured ? "text-yellow-400" : "text-portal-text-muted hover:text-portal-text")}
                          disabled={toggling === project.id + "_feat"}>
                          <Star size={13} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleTogglePublic(project); }} title={project.is_public ? "Unpublish" : "Publish"}
                          className="rounded-md p-1.5 text-portal-text-muted hover:bg-portal-surface hover:text-portal-text transition-colors"
                          disabled={toggling === project.id}>
                          {project.is_public ? <EyeOff size={13} /> : <Eye size={13} />}
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); setEditProject(project); setShowForm(true); }}
                          className="rounded-md p-1.5 text-portal-text-muted hover:bg-portal-surface hover:text-portal-text transition-colors" title="Edit">
                          <Pencil size={13} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); setAssignProject(project); }}
                          className="rounded-md p-1.5 text-portal-text-muted hover:bg-portal-surface hover:text-portal-text transition-colors" title="Assign Staff">
                          <Users size={13} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(project); }} disabled={deleting === project.id}
                          className="rounded-md p-1.5 text-portal-text-muted hover:bg-destructive/15 hover:text-destructive transition-colors" title="Delete">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showForm && (
        <ProjectFormModal
          editProject={editProject}
          onClose={() => { setShowForm(false); setEditProject(null); }}
          onSaved={() => { setShowForm(false); setEditProject(null); fetchProjects(); }}
        />
      )}

      {assignProject && (
        <StaffAssignModal
          projectId={assignProject.id}
          projectTitle={assignProject.title}
          onClose={() => { setAssignProject(null); fetchProjects(); }}
        />
      )}
    </PortalLayout>
  );
}
