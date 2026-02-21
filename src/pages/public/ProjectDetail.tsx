import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { PublicNav } from "@/components/PublicNav";
import { PublicFooter } from "@/components/PublicFooter";
import { StatusBadge } from "@/components/StatusBadge";
import { FileIcon } from "@/components/files/FileIcon";
import { FilePreviewModal } from "@/components/files/FilePreviewModal";
import { supabase } from "@/integrations/supabase/client";
import { FileAsset, formatBytes, FILE_CATEGORIES, FileCategory } from "@/lib/files";
import { ArrowLeft, MapPin, CalendarDays, Eye, Loader2, FolderOpen } from "lucide-react";

interface Project {
  id: string;
  title: string;
  description: string | null;
  status: string;
  location: string | null;
  start_date: string | null;
  target_date: string | null;
}

export default function PublicProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [files, setFiles] = useState<FileAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [preview, setPreview] = useState<FileAsset | null>(null);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      supabase.from("projects").select("id, title, description, status, location, start_date, target_date").eq("id", id).single(),
      supabase.from("file_assets").select("*").eq("project_id", id).eq("is_deleted", false).order("created_at", { ascending: false }),
    ]).then(([{ data: proj, error }, { data: fileData }]) => {
      if (error || !proj) {
        setNotFound(true);
      } else {
        setProject(proj as Project);
        setFiles((fileData as unknown as FileAsset[]) ?? []);
      }
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div className="bg-background min-h-screen">
        <PublicNav />
        <div className="flex items-center justify-center py-32">
          <Loader2 size={28} className="animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (notFound || !project) {
    return (
      <div className="bg-background min-h-screen">
        <PublicNav />
        <div className="container py-32 text-center">
          <h2 className="font-display text-3xl font-light text-foreground">Project not found</h2>
          <Link to="/projects" className="mt-6 inline-flex items-center gap-2 text-primary text-sm hover:underline">
            <ArrowLeft size={14} /> Back to Projects
          </Link>
        </div>
        <PublicFooter />
      </div>
    );
  }

  // Group files by category
  const grouped: Record<string, FileAsset[]> = {};
  for (const f of files) {
    const cat = f.category;
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(f);
  }
  const orderedCategories = FILE_CATEGORIES.map((c) => c.value).filter((c) => grouped[c]);

  return (
    <div className="bg-background min-h-screen">
      <PublicNav />

      <div className="container pt-20 pb-16">
        <Link to="/projects" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft size={13} /> Back to Projects
        </Link>

        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display text-[clamp(2rem,5vw,3.5rem)] font-light text-foreground leading-tight">
              {project.title}
            </h1>
            {project.description && (
              <p className="mt-3 text-muted-foreground font-light max-w-2xl leading-relaxed">{project.description}</p>
            )}
          </div>
          <StatusBadge status={project.status} className="shrink-0 mt-2" />
        </div>

        {/* Info cards */}
        <div className="flex flex-wrap gap-3 mb-10">
          {project.location && (
            <div className="flex items-center gap-2 bg-secondary/60 px-4 py-2 text-sm text-foreground">
              <MapPin size={14} className="text-muted-foreground" /> {project.location}
            </div>
          )}
          {project.start_date && (
            <div className="flex items-center gap-2 bg-secondary/60 px-4 py-2 text-sm text-foreground">
              <CalendarDays size={14} className="text-muted-foreground" /> Start: {new Date(project.start_date).toLocaleDateString()}
            </div>
          )}
          {project.target_date && (
            <div className="flex items-center gap-2 bg-secondary/60 px-4 py-2 text-sm text-foreground">
              <CalendarDays size={14} className="text-muted-foreground" /> Target: {new Date(project.target_date).toLocaleDateString()}
            </div>
          )}
        </div>

        {/* Files */}
        <div>
          <h2 className="font-display text-2xl font-light text-foreground mb-6">Project Files</h2>

          {files.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center border border-border bg-secondary/30">
              <FolderOpen size={40} className="text-muted-foreground/20 mb-3" />
              <p className="text-muted-foreground text-sm">No files uploaded yet.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {orderedCategories.map((cat) => {
                const catLabel = FILE_CATEGORIES.find((c) => c.value === cat)?.label ?? cat;
                return (
                  <div key={cat}>
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{catLabel}</h3>
                    <div className="space-y-1.5">
                      {grouped[cat].map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center gap-3 border border-border bg-secondary/30 px-4 py-3 hover:bg-secondary/60 transition-colors"
                        >
                          <FileIcon ext={file.extension ?? ""} size={18} className="text-muted-foreground shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="truncate text-sm font-medium text-foreground">{file.original_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatBytes(file.size_bytes)}
                              {file.version > 1 && (
                                <span className="ml-2 rounded bg-primary/15 px-1.5 py-0.5 text-primary text-[10px] font-semibold">
                                  v{file.version}
                                </span>
                              )}
                              {" · "}{new Date(file.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <button
                            onClick={() => setPreview(file)}
                            title="Preview"
                            className="rounded p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                          >
                            <Eye size={15} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {preview && <FilePreviewModal file={preview} onClose={() => setPreview(null)} role="PUBLIC" />}

      <PublicFooter />
    </div>
  );
}
