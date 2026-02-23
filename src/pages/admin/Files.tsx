import { useEffect, useState, useCallback } from "react";
import { PortalLayout } from "@/components/PortalLayout";
import { PageHeader } from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { writeAuditLog } from "@/lib/audit";
import {
  FileAsset,
  FILE_CATEGORIES,
  FileCategory,
  formatBytes,
  getSignedUrl,
} from "@/lib/files";
import { FileIcon } from "@/components/files/FileIcon";
import { FilePreviewModal } from "@/components/files/FilePreviewModal";
import {
  Search, Download, Trash2, Eye, Loader2, ExternalLink, HardDrive,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface AdminFileAsset extends FileAsset {
  project: {
    id: string;
    title: string;
    profiles: { full_name: string | null; company: string | null } | null;
  } | null;
  uploader: { full_name: string | null } | null;
}

const ALL = "all";

export default function AdminFiles() {
  const { profile } = useAuth();
  const { toast } = useToast();

  const [files, setFiles] = useState<AdminFileAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState(ALL);
  const [preview, setPreview] = useState<AdminFileAsset | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("file_assets")
      .select("*, project:project_id(id, title, profiles(full_name, company)), uploader:uploader_id(full_name)")
      .eq("is_deleted", false)
      .order("created_at", { ascending: false });

    if (catFilter !== ALL) query = query.eq("category", catFilter);
    if (search.trim()) query = query.ilike("original_name", `%${search}%`);

    const { data, error } = await query;
    if (error) {
      toast({ title: "Error loading files", description: error.message, variant: "destructive" });
    } else {
      setFiles((data as unknown as AdminFileAsset[]) ?? []);
    }
    setLoading(false);
  }, [catFilter, search, toast]);

  useEffect(() => { fetchFiles(); }, [fetchFiles]);

  const handleDownload = async (file: AdminFileAsset) => {
    setDownloading(file.id);
    const url = await getSignedUrl(file.id);
    setDownloading(null);
    if (!url) { toast({ title: "Download failed", variant: "destructive" }); return; }
    if (profile) await writeAuditLog({
      actor_id: profile.id, action: "file_downloaded", entity_type: "file",
      entity_id: file.id, metadata: { project_id: file.project_id },
    });
    const a = document.createElement("a");
    a.href = url; a.download = file.original_name; a.target = "_blank"; a.rel = "noreferrer";
    a.click();
  };

  const handleDelete = async (file: AdminFileAsset) => {
    if (!confirm(`Soft-delete "${file.original_name}"?`)) return;
    setDeleting(file.id);
    const { error } = await supabase.from("file_assets")
      .update({ is_deleted: true, deleted_at: new Date().toISOString() })
      .eq("id", file.id);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    } else {
      if (profile) await writeAuditLog({
        actor_id: profile.id, action: "file_deleted", entity_type: "file",
        entity_id: file.id, metadata: { project_id: file.project_id },
      });
      toast({ title: "File removed" });
      fetchFiles();
    }
    setDeleting(null);
  };

  // Storage usage summary
  const totalBytes = files.reduce((sum, f) => sum + f.size_bytes, 0);

  return (
    <PortalLayout variant="admin">
      <PageHeader
        title="Files"
        subtitle="Global file browser across all projects"
      />

      {/* Stats */}
      <div className="mb-5 flex flex-wrap gap-3">
        <StatCard icon={<HardDrive size={14} />} label="Total Files" value={files.length.toString()} />
        <StatCard icon={<HardDrive size={14} />} label="Storage Used" value={formatBytes(totalBytes)} />
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative w-full max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-portal-text-muted" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search filename…"
            className="pl-9 bg-portal-surface border-portal-border text-portal-text placeholder:text-portal-text-muted"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <FilterChip label="All" active={catFilter === ALL} onClick={() => setCatFilter(ALL)} />
          {FILE_CATEGORIES.map((c) => (
            <FilterChip key={c.value} label={c.label} active={catFilter === c.value} onClick={() => setCatFilter(c.value)} />
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={22} className="animate-spin text-portal-text-muted" />
          </div>
        ) : files.length === 0 ? (
          <div className="py-16 text-center">
            <p className="font-medium text-portal-text">No files found</p>
            <p className="mt-1 text-sm text-portal-text-muted">Files uploaded to projects will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-portal-border/50 bg-gradient-to-r from-portal-surface/80 to-portal-bg/40">
                  {["File", "Project / Client", "Category", "Size", "Uploader", "Date", "Ver.", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-portal-text-muted whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-portal-border/30">
                {files.map((file) => {
                  const ext = file.extension ?? "";
                  const catLabel = FILE_CATEGORIES.find((c) => c.value === file.category)?.label ?? file.category;
                  return (
                    <tr key={file.id} className="hover:bg-portal-accent/5 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 max-w-[200px]">
                          <FileIcon ext={ext} size={15} className="text-portal-text-muted shrink-0" />
                          <span className="truncate font-medium text-portal-text text-xs">{file.original_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-portal-text-muted max-w-[160px]">
                        <p className="truncate text-portal-text font-medium">{file.project?.title ?? "—"}</p>
                        <p className="truncate">{file.project?.profiles?.full_name ?? "—"}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-portal-text-muted whitespace-nowrap">{catLabel}</td>
                      <td className="px-4 py-3 text-xs text-portal-text-muted whitespace-nowrap">{formatBytes(file.size_bytes)}</td>
                      <td className="px-4 py-3 text-xs text-portal-text-muted max-w-[120px] truncate">{file.uploader?.full_name ?? "—"}</td>
                      <td className="px-4 py-3 text-xs text-portal-text-muted whitespace-nowrap">{new Date(file.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-xs text-portal-text-muted">
                        {file.version > 1
                          ? <span className="rounded bg-portal-accent/15 px-1.5 py-0.5 text-portal-accent text-[10px] font-semibold">v{file.version}</span>
                          : `v${file.version}`}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => setPreview(file)} title="Preview"
                            className="rounded p-1.5 text-portal-text-muted hover:bg-portal-bg hover:text-portal-text transition-colors">
                            <Eye size={13} />
                          </button>
                          <button
                            onClick={() => handleDownload(file)}
                            disabled={downloading === file.id}
                            title="Download"
                            className="rounded p-1.5 text-portal-text-muted hover:bg-portal-bg hover:text-portal-text transition-colors disabled:opacity-50"
                          >
                            {downloading === file.id ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
                          </button>
                          {file.project?.id && (
                            <a href={`/admin/projects`} title="View project"
                              className="rounded p-1.5 text-portal-text-muted hover:bg-portal-bg hover:text-portal-text transition-colors">
                              <ExternalLink size={13} />
                            </a>
                          )}
                          <button
                            onClick={() => handleDelete(file)}
                            disabled={deleting === file.id}
                            title="Soft delete"
                            className="rounded p-1.5 text-portal-text-muted hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-50"
                          >
                            {deleting === file.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {preview && <FilePreviewModal file={preview as FileAsset} onClose={() => setPreview(null)} />}
    </PortalLayout>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="glass-card glass-card-hover flex items-center gap-3 px-4 py-3">
      <span className="text-portal-accent">{icon}</span>
      <div>
        <p className="text-xs text-portal-text-muted">{label}</p>
        <p className="font-semibold text-portal-text">{value}</p>
      </div>
    </div>
  );
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
        active
          ? "border-portal-accent bg-portal-accent/15 text-portal-accent"
          : "border-portal-border text-portal-text-muted hover:border-portal-accent/50"
      }`}>
      {label}
    </button>
  );
}
