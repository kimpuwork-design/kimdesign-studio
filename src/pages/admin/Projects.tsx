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
import { Plus, Search, Pencil, Trash2, Users, ExternalLink, Star, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

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
        subtitle="Manage all studio projects and portfolio items"
        action={
          <Button onClick={() => { setEditProject(null); setShowForm(true); }}
            className="bg-portal-accent text-portal-accent-foreground hover:bg-portal-accent/90">
            <Plus size={15} className="mr-2" /> New Project
          </Button>
        }
      />

      {/* Filters */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-portal-text-muted" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search title…"
            className="pl-9 bg-portal-bg/50 backdrop-blur-sm border-portal-border text-portal-text placeholder:text-portal-text-muted" />
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

      {/* Table */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-portal-accent border-t-transparent" />
          </div>
        ) : projects.length === 0 ? (
          <div className="py-16 text-center">
            <p className="font-medium text-portal-text">No projects found</p>
            <p className="mt-1 text-sm text-portal-text-muted">Create your first project to get started.</p>
            <Button className="mt-4 bg-portal-accent text-portal-accent-foreground" size="sm"
              onClick={() => { setEditProject(null); setShowForm(true); }}>
              <Plus size={14} className="mr-1" /> New Project
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-portal-border bg-gradient-to-r from-portal-surface to-portal-bg">
                  {["Title", "Client", "Category", "Status", "Portfolio", "Updated", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-portal-text-muted">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-portal-border/50">
                {projects.map((project) => (
                  <tr key={project.id} className="hover:bg-portal-accent/5 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {project.thumbnail_url ? (
                          <img src={project.thumbnail_url} alt="" className="h-8 w-12 rounded object-cover shrink-0 bg-portal-border" loading="lazy" />
                        ) : (
                          <div className="h-8 w-12 rounded bg-portal-border shrink-0" />
                        )}
                        <div>
                          <p className="font-medium text-portal-text max-w-[160px] truncate">{project.title}</p>
                          {project.slug && <p className="text-[10px] text-portal-text-muted">/{project.slug}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-portal-text-muted text-xs">
                      {project.profiles?.full_name ?? "—"}
                      {project.profiles?.company && <span className="block text-portal-text-muted/60">{project.profiles.company}</span>}
                    </td>
                    <td className="px-4 py-3 text-portal-text-muted text-xs">{project.category ?? "—"}</td>
                    <td className="px-4 py-3"><StatusBadge status={project.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${project.is_public ? "bg-emerald-500/15 text-emerald-500" : "bg-portal-border text-portal-text-muted"}`}>
                          {project.is_public ? "Public" : "Draft"}
                        </span>
                        {project.is_featured && <Star size={12} className="text-yellow-400 fill-yellow-400" />}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-portal-text-muted text-xs">
                      {new Date(project.updated_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => navigate(`/admin/projects/${project.id}`)}
                          className="rounded p-1.5 text-portal-text-muted hover:bg-portal-bg hover:text-portal-accent transition-colors" title="View detail">
                          <ExternalLink size={14} />
                        </button>
                        <button onClick={() => handleToggleFeatured(project)} title="Toggle featured"
                          className={`rounded p-1.5 transition-colors ${project.is_featured ? "text-yellow-400 hover:text-yellow-300" : "text-portal-text-muted hover:text-portal-text"} hover:bg-portal-bg`}
                          disabled={toggling === project.id + "_feat"}>
                          <Star size={14} />
                        </button>
                        <button onClick={() => handleTogglePublic(project)} title={project.is_public ? "Unpublish" : "Publish"}
                          className="rounded p-1.5 text-portal-text-muted hover:bg-portal-bg hover:text-portal-text transition-colors"
                          disabled={toggling === project.id}>
                          {project.is_public ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                        <button onClick={() => { setEditProject(project); setShowForm(true); }}
                          className="rounded p-1.5 text-portal-text-muted hover:bg-portal-bg hover:text-portal-text transition-colors" title="Edit">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => setAssignProject(project)}
                          className="rounded p-1.5 text-portal-text-muted hover:bg-portal-bg hover:text-portal-text transition-colors" title="Assign Staff">
                          <Users size={14} />
                        </button>
                        <button onClick={() => handleDelete(project)} disabled={deleting === project.id}
                          className="rounded p-1.5 text-portal-text-muted hover:bg-destructive/15 hover:text-destructive transition-colors" title="Delete">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
