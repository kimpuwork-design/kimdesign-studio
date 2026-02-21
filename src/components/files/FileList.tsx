import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { writeAuditLog } from "@/lib/audit";
import {
  FileAsset,
  FILE_CATEGORIES,
  FileCategory,
  formatBytes,
  getSignedUrl,
  isImageExt,
} from "@/lib/files";
import { FileIcon } from "./FileIcon";
import { FilePreviewModal } from "./FilePreviewModal";
import {
  Download, Trash2, Eye, Loader2, GripVertical,
  LayoutGrid, LayoutList, Filter,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Props {
  projectId: string;
  currentUserId: string;
  canUpload?: boolean;
  refreshKey?: number;
  role?: "CLIENT" | "STAFF" | "ADMIN";
}

type ViewMode = "list" | "grid";

export function FileList({ projectId, currentUserId, refreshKey = 0, role = "ADMIN" }: Props) {
  const { toast } = useToast();
  const [files, setFiles] = useState<FileAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<FileAsset | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [activeFilters, setActiveFilters] = useState<FileCategory[]>([]);

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
    const url = await getSignedUrl(file.id);
    setDownloading(null);
    if (!url) {
      toast({ title: "Download failed", variant: "destructive" });
      return;
    }
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

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const reordered = Array.from(filteredFiles);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);

    // Update the main files array preserving non-filtered items
    const filteredIds = new Set(reordered.map((f) => f.id));
    const otherFiles = files.filter((f) => !filteredIds.has(f.id));
    setFiles([...reordered, ...otherFiles]);
  };

  const toggleFilter = (cat: FileCategory) => {
    setActiveFilters((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  // Apply filters
  const filteredFiles =
    activeFilters.length === 0
      ? files
      : files.filter((f) => activeFilters.includes(f.category as FileCategory));

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

  return (
    <>
      {/* Toolbar */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {/* Filter dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1.5 rounded-lg border border-portal-border bg-portal-bg px-3 py-1.5 text-xs font-medium text-portal-text-muted hover:text-portal-text transition-colors">
                <Filter size={13} />
                Filter
                {activeFilters.length > 0 && (
                  <span className="ml-1 rounded-full bg-portal-accent/20 px-1.5 text-[10px] font-semibold text-portal-accent">
                    {activeFilters.length}
                  </span>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="z-50 bg-portal-surface border-portal-border">
              {FILE_CATEGORIES.map((cat) => (
                <DropdownMenuCheckboxItem
                  key={cat.value}
                  checked={activeFilters.includes(cat.value)}
                  onCheckedChange={() => toggleFilter(cat.value)}
                  className="text-portal-text text-xs"
                >
                  {cat.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <span className="text-xs text-portal-text-muted">
            {filteredFiles.length} file{filteredFiles.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* View toggle */}
        <div className="flex items-center rounded-lg border border-portal-border bg-portal-bg p-0.5">
          <button
            onClick={() => setViewMode("list")}
            className={`rounded-md p-1.5 transition-colors ${viewMode === "list" ? "bg-portal-accent/15 text-portal-accent" : "text-portal-text-muted hover:text-portal-text"}`}
            title="List view"
          >
            <LayoutList size={14} />
          </button>
          <button
            onClick={() => setViewMode("grid")}
            className={`rounded-md p-1.5 transition-colors ${viewMode === "grid" ? "bg-portal-accent/15 text-portal-accent" : "text-portal-text-muted hover:text-portal-text"}`}
            title="Grid view"
          >
            <LayoutGrid size={14} />
          </button>
        </div>
      </div>

      {/* File list / grid */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="file-list" direction={viewMode === "grid" ? "horizontal" : "vertical"}>
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={
                viewMode === "grid"
                  ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3"
                  : "space-y-1.5"
              }
            >
              {filteredFiles.map((file, index) => (
                <Draggable key={file.id} draggableId={file.id} index={index}>
                  {(dragProvided, snapshot) =>
                    viewMode === "list" ? (
                      <FileRowItem
                        ref={dragProvided.innerRef}
                        draggableProps={dragProvided.draggableProps}
                        dragHandleProps={dragProvided.dragHandleProps}
                        isDragging={snapshot.isDragging}
                        file={file}
                        currentUserId={currentUserId}
                        downloading={downloading === file.id}
                        deleting={deleting === file.id}
                        onPreview={() => setPreview(file)}
                        onDownload={() => handleDownload(file)}
                        onDelete={() => handleDelete(file)}
                    showDownload={true}
                      />
                    ) : (
                      <FileGridItem
                        ref={dragProvided.innerRef}
                        draggableProps={dragProvided.draggableProps}
                        dragHandleProps={dragProvided.dragHandleProps}
                        isDragging={snapshot.isDragging}
                        file={file}
                        currentUserId={currentUserId}
                        downloading={downloading === file.id}
                        deleting={deleting === file.id}
                        onPreview={() => setPreview(file)}
                        onDownload={() => handleDownload(file)}
                        onDelete={() => handleDelete(file)}
                        showDownload={true}
                      />
                    )
                  }
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {preview && <FilePreviewModal file={preview} onClose={() => setPreview(null)} role={role} />}
    </>
  );
}

/* ── Shared prop types ─────────────────────────────────── */
interface ItemProps {
  file: FileAsset;
  currentUserId: string;
  downloading: boolean;
  deleting: boolean;
  onPreview: () => void;
  onDownload: () => void;
  onDelete: () => void;
  showDownload?: boolean;
  isDragging: boolean;
  draggableProps: Record<string, any>;
  dragHandleProps: Record<string, any> | null | undefined;
}

/* ── List View Row ─────────────────────────────────────── */
import { forwardRef, useState as useStateImport, useEffect as useEffectImport } from "react";

function useThumbnailUrl(file: FileAsset) {
  const [thumbUrl, setThumbUrl] = useStateImport<string | null>(null);
  const ext = file.extension ?? "";
  const isImg = isImageExt(ext);
  useEffectImport(() => {
    if (!isImg) return;
    getSignedUrl(file.id).then((url) => setThumbUrl(url));
  }, [file.id, isImg]);
  return { isImg, thumbUrl };
}

const FileRowItem = forwardRef<HTMLDivElement, ItemProps>(
  ({ file, currentUserId, downloading, deleting, onPreview, onDownload, onDelete, showDownload = true, isDragging, draggableProps, dragHandleProps }, ref) => {
    const ext = file.extension ?? "";
    const canDelete = file.uploader_id === currentUserId;
    const { isImg, thumbUrl } = useThumbnailUrl(file);

    return (
      <div
        ref={ref}
        {...draggableProps}
        className={`flex items-center gap-3 rounded-lg border border-portal-border bg-portal-bg px-3 py-2.5 transition-colors ${isDragging ? "shadow-lg ring-2 ring-portal-accent/30" : "hover:bg-portal-surface"}`}
      >
        <div {...dragHandleProps} className="cursor-grab text-portal-text-muted/50 hover:text-portal-text-muted shrink-0">
          <GripVertical size={14} />
        </div>
        {thumbUrl ? (
          <button onClick={onPreview} className="shrink-0 rounded-md overflow-hidden border border-portal-border w-10 h-10">
            <img src={thumbUrl} alt={file.original_name} className="w-full h-full object-cover" loading="lazy" />
          </button>
        ) : (
          <FileIcon ext={ext} size={18} className="text-portal-text-muted shrink-0" />
        )}
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
            <button onClick={onDownload} disabled={downloading} title="Download" className="rounded p-1.5 text-portal-text-muted hover:bg-portal-surface hover:text-portal-text transition-colors disabled:opacity-50">
              {downloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            </button>
          )}
          {canDelete && (
            <button onClick={onDelete} disabled={deleting} title="Delete" className="rounded p-1.5 text-portal-text-muted hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-50">
              {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            </button>
          )}
        </div>
      </div>
    );
  }
);
FileRowItem.displayName = "FileRowItem";

/* ── Grid View Card ────────────────────────────────────── */
const FileGridItem = forwardRef<HTMLDivElement, ItemProps>(
  ({ file, currentUserId, downloading, deleting, onPreview, onDownload, onDelete, showDownload = true, isDragging, draggableProps, dragHandleProps }, ref) => {
    const ext = file.extension ?? "";
    const canDelete = file.uploader_id === currentUserId;
    const { isImg, thumbUrl } = useThumbnailUrl(file);

    return (
      <div
        ref={ref}
        {...draggableProps}
        className={`group relative flex flex-col rounded-xl border border-portal-border bg-portal-bg overflow-hidden transition-colors ${isDragging ? "shadow-lg ring-2 ring-portal-accent/30" : "hover:bg-portal-surface"}`}
      >
        {/* Drag handle */}
        <div {...dragHandleProps} className="absolute top-1.5 left-1.5 z-10 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity rounded bg-portal-bg/80 p-0.5">
          <GripVertical size={12} className="text-portal-text-muted" />
        </div>

        {/* Thumbnail / icon area */}
        <button onClick={onPreview} className="flex items-center justify-center h-32 bg-portal-surface/50 overflow-hidden">
          {thumbUrl ? (
            <img src={thumbUrl} alt={file.original_name} className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <FileIcon ext={ext} size={32} className="text-portal-text-muted/60" />
          )}
        </button>

        {/* Info */}
        <div className="p-2.5 flex-1 min-w-0">
          <p className="truncate text-xs font-medium text-portal-text" title={file.original_name}>{file.original_name}</p>
          <p className="text-[10px] text-portal-text-muted mt-0.5">
            {formatBytes(file.size_bytes)} · {new Date(file.created_at).toLocaleDateString()}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-0.5 px-2 pb-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onPreview} title="Preview" className="rounded p-1 text-portal-text-muted hover:text-portal-text transition-colors">
            <Eye size={12} />
          </button>
          {showDownload && (
            <button onClick={onDownload} disabled={downloading} title="Download" className="rounded p-1 text-portal-text-muted hover:text-portal-text transition-colors disabled:opacity-50">
              {downloading ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
            </button>
          )}
          {canDelete && (
            <button onClick={onDelete} disabled={deleting} title="Delete" className="rounded p-1 text-portal-text-muted hover:text-destructive transition-colors disabled:opacity-50">
              {deleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
            </button>
          )}
        </div>
      </div>
    );
  }
);
FileGridItem.displayName = "FileGridItem";
