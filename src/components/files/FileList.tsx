import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { writeAuditLog } from "@/lib/audit";
import {
  FileAsset,
  FILE_CATEGORIES,
  FileCategory,
  formatBytes,
  getSignedUrl,
} from "@/lib/files";
import { FileIcon } from "./FileIcon";
import { FilePreviewModal } from "./FilePreviewModal";
import { Download, Trash2, Eye, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Props {
  projectId: string;
  currentUserId: string;
  canUpload?: boolean;
  refreshKey?: number;
  role?: "CLIENT" | "STAFF" | "ADMIN";
}

type GroupedFiles = Record<FileCategory, FileAsset[]>;

export function FileList({ projectId, currentUserId, refreshKey = 0, role = "ADMIN" }: Props) {
  const { toast } = useToast();
  const [files, setFiles] = useState<FileAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<FileAsset | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("file_assets")
      .select("*, uploader:uploader_id(full_name)")
      .eq("project_id", projectId)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error loading files", description: error.message, variant: "destructive" });
    } else {
      setFiles((data as unknown as FileAsset[]) ?? []);
    }
    setLoading(false);
  }, [projectId, toast]);

  useEffect(() => { fetchFiles(); }, [fetchFiles, refreshKey]);

  const handleDownload = async (file: FileAsset) => {
    setDownloading(file.id);
    const url = await getSignedUrl(file.storage_path);
    setDownloading(null);
    if (!url) {
      toast({ title: "Download failed", variant: "destructive" });
      return;
    }
    // Audit
    await writeAuditLog({
      actor_id: currentUserId,
      action: "file_downloaded",
      entity_type: "file",
      entity_id: file.id,
      metadata: { project_id: projectId, original_name: file.original_name },
    });
    const a = document.createElement("a");
    a.href = url;
    a.download = file.original_name;
    a.target = "_blank";
    a.rel = "noreferrer";
    a.click();
  };

  const handleDelete = async (file: FileAsset) => {
    if (!confirm(`Soft-delete "${file.original_name}"?`)) return;
    setDeleting(file.id);
    const { error } = await supabase
      .from("file_assets")
      .update({ is_deleted: true, deleted_at: new Date().toISOString() })
      .eq("id", file.id);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    } else {
      await writeAuditLog({
        actor_id: currentUserId,
        action: "file_deleted",
        entity_type: "file",
        entity_id: file.id,
        metadata: { project_id: projectId, original_name: file.original_name },
      });
      toast({ title: "File removed" });
      fetchFiles();
    }
    setDeleting(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={22} className="animate-spin text-portal-text-muted" />
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-14 text-center">
        <p className="font-medium text-portal-text">No files yet</p>
        <p className="mt-1 text-sm text-portal-text-muted">Upload files to see them here.</p>
      </div>
    );
  }

  // Group by category
  const grouped: GroupedFiles = {} as GroupedFiles;
  for (const f of files) {
    const cat = f.category as FileCategory;
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(f);
  }

  const orderedCategories = FILE_CATEGORIES.map((c) => c.value).filter((c) => grouped[c]);

  return (
    <>
      <div className="space-y-6">
        {orderedCategories.map((cat) => {
          const catLabel = FILE_CATEGORIES.find((c) => c.value === cat)?.label ?? cat;
          return (
            <div key={cat}>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-portal-text-muted">{catLabel}</h3>
              <div className="space-y-1.5">
                {grouped[cat].map((file) => (
                  <FileRow
                    key={file.id}
                    file={file}
                    currentUserId={currentUserId}
                    downloading={downloading === file.id}
                    deleting={deleting === file.id}
                    onPreview={() => setPreview(file)}
                    onDownload={() => handleDownload(file)}
                    onDelete={() => handleDelete(file)}
                    showDownload={role !== "CLIENT"}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {preview && <FilePreviewModal file={preview} onClose={() => setPreview(null)} role={role} />}
    </>
  );
}

function FileRow({
  file,
  currentUserId,
  downloading,
  deleting,
  onPreview,
  onDownload,
  onDelete,
  showDownload = true,
}: {
  file: FileAsset;
  currentUserId: string;
  downloading: boolean;
  deleting: boolean;
  onPreview: () => void;
  onDownload: () => void;
  onDelete: () => void;
  showDownload?: boolean;
}) {
  const ext = file.extension ?? "";
  const canDelete = file.uploader_id === currentUserId;

  return (
    <div className="flex items-center gap-3 rounded-lg border border-portal-border bg-portal-bg px-3 py-2.5 hover:bg-portal-surface transition-colors">
      <FileIcon ext={ext} size={18} className="text-portal-text-muted shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-medium text-portal-text">{file.original_name}</p>
        <p className="text-xs text-portal-text-muted">
          {formatBytes(file.size_bytes)}
          {file.version > 1 && <span className="ml-2 rounded bg-portal-accent/15 px-1.5 py-0.5 text-portal-accent text-[10px] font-semibold">v{file.version}</span>}
          {" · "}{new Date(file.created_at).toLocaleDateString()}
          {file.uploader?.full_name && <> · <span>{file.uploader.full_name}</span></>}
        </p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button onClick={onPreview} title="Preview" className="rounded p-1.5 text-portal-text-muted hover:bg-portal-surface hover:text-portal-text transition-colors">
          <Eye size={14} />
        </button>
        {showDownload && (
          <button
            onClick={onDownload}
            disabled={downloading}
            title="Download"
            className="rounded p-1.5 text-portal-text-muted hover:bg-portal-surface hover:text-portal-text transition-colors disabled:opacity-50"
          >
            {downloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
          </button>
        )}
        {canDelete && (
          <button
            onClick={onDelete}
            disabled={deleting}
            title="Delete"
            className="rounded p-1.5 text-portal-text-muted hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-50"
          >
            {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
          </button>
        )}
      </div>
    </div>
  );
}
