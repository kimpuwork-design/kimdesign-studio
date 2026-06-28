import { useCallback, useRef, useState } from "react";
import { UploadCloud, X, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { writeAuditLog } from "@/lib/audit";
import {
  ALLOWED_EXTENSIONS,
  FILE_CATEGORIES,
  FileCategory,
  buildStoragePath,
  formatBytes,
  getExtension,
  getNextVersion,
} from "@/lib/files";
import { validateFile } from "@/lib/validation";
import { friendlyErrorMessage, reportError } from "@/lib/errors";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { toast as sonnerToast } from "sonner";

interface QueuedFile {
  file: File;
  id: string;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
  progress: number;
}

interface Props {
  projectId: string;
  uploaderId: string;
  onUploaded?: () => void;
}

export function FileUploadZone({ projectId, uploaderId, onUploaded }: Props) {
  const { toast } = useToast();
  const [category, setCategory] = useState<FileCategory>("other");
  const [queue, setQueue] = useState<QueuedFile[]>([]);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const updateItem = (id: string, patch: Partial<QueuedFile>) =>
    setQueue((q) => q.map((f) => (f.id === id ? { ...f, ...patch } : f)));

  const enqueue = (files: FileList | File[]) => {
    const arr = Array.from(files);
    let rejected = 0;
    const newItems: QueuedFile[] = arr.map((file) => {
      const err = validateFile(file, ALLOWED_EXTENSIONS);
      if (err) rejected += 1;
      return {
        file,
        id: crypto.randomUUID(),
        status: err ? "error" : "pending",
        error: err ?? undefined,
        progress: 0,
      };
    });
    setQueue((q) => [...q, ...newItems]);
    if (rejected > 0) {
      sonnerToast.error(
        `${rejected} file${rejected > 1 ? "s" : ""} couldn't be added`,
        { description: "Check the highlighted items for details (size or type)." },
      );
    }
  };

  const uploadItem = async (item: QueuedFile) => {
    updateItem(item.id, { status: "uploading", progress: 10, error: undefined });
    try {
      const ext = getExtension(item.file.name);
      const version = await getNextVersion(projectId, category, item.file.name);
      const path = buildStoragePath(projectId, category, version, item.file.name);

      const { error: storageError } = await supabase.storage
        .from("project-files")
        .upload(path, item.file, { upsert: false, contentType: item.file.type || undefined });

      if (storageError) {
        const msg = friendlyErrorMessage(storageError);
        updateItem(item.id, { status: "error", error: msg });
        return false;
      }

      updateItem(item.id, { progress: 70 });

      const { data: inserted, error: dbError } = await supabase
        .from("file_assets")
        .insert({
          project_id: projectId,
          uploader_id: uploaderId,
          category,
          original_name: item.file.name,
          storage_bucket: "project-files",
          storage_path: path,
          mime_type: item.file.type || null,
          extension: ext,
          size_bytes: item.file.size,
          version,
        })
        .select("id")
        .single();

      if (dbError) {
        // Rollback storage if DB insert failed
        await supabase.storage.from("project-files").remove([path]).catch(() => {});
        const msg = friendlyErrorMessage(dbError);
        updateItem(item.id, { status: "error", error: msg });
        return false;
      }

      await writeAuditLog({
        actor_id: uploaderId,
        action: "file_uploaded",
        entity_type: "file",
        entity_id: inserted?.id,
        metadata: { project_id: projectId, category, original_name: item.file.name, version },
      }).catch(() => {});

      updateItem(item.id, { status: "done", progress: 100 });
      onUploaded?.();
      return true;
    } catch (err) {
      const msg = friendlyErrorMessage(err);
      updateItem(item.id, { status: "error", error: msg });
      return false;
    }
  };

  const uploadAll = async () => {
    const pending = queue.filter((f) => f.status === "pending");
    if (pending.length === 0) return;
    let ok = 0;
    let failed = 0;
    for (const item of pending) {
      const success = await uploadItem(item);
      if (success) ok += 1;
      else failed += 1;
    }
    if (ok > 0 && failed === 0) {
      toast({ title: "Upload complete", description: `${ok} file(s) uploaded.` });
    } else if (ok > 0 && failed > 0) {
      sonnerToast.warning("Some files failed", {
        description: `${ok} uploaded, ${failed} failed. Hover failed items for details.`,
      });
    } else {
      reportError(new Error("No files uploaded"), {
        title: "Upload failed",
        fallback: "None of the files could be uploaded. Please try again.",
      });
    }
  };


  const remove = (id: string) => setQueue((q) => q.filter((f) => f.id !== id));

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files) enqueue(e.dataTransfer.files);
  }, []);

  const pendingCount = queue.filter((f) => f.status === "pending").length;

  return (
    <div className="space-y-4">
      {/* Category selector */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs text-portal-text-muted font-medium">Category:</span>
        {FILE_CATEGORIES.map((c) => (
          <button
            key={c.value}
            onClick={() => setCategory(c.value)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              category === c.value
                ? "border-portal-accent bg-portal-accent/15 text-portal-accent"
                : "border-portal-border text-portal-text-muted hover:border-portal-accent/50"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 transition-colors ${
          dragging
            ? "border-portal-accent bg-portal-accent/5"
            : "border-portal-border hover:border-portal-accent/50 hover:bg-portal-surface"
        }`}
      >
        <UploadCloud size={32} className="mb-3 text-portal-text-muted" />
        <p className="text-sm font-medium text-portal-text">Drag & drop files here, or <span className="text-portal-accent underline underline-offset-2">browse</span></p>
        <p className="mt-1 text-xs text-portal-text-muted">
          Allowed: {ALLOWED_EXTENSIONS.join(", ")} · Max 200MB
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && enqueue(e.target.files)}
        />
      </div>

      {/* Queue */}
      {queue.length > 0 && (
        <div className="space-y-2">
          {queue.map((item) => (
            <div key={item.id} className="flex items-center gap-3 rounded-lg border border-portal-border bg-portal-surface px-3 py-2">
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm text-portal-text">{item.file.name}</p>
                <p className="text-xs text-portal-text-muted">{formatBytes(item.file.size)}</p>
                {item.status === "uploading" && (
                  <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-portal-border">
                    <div
                      className="h-full bg-portal-accent transition-all duration-300"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                )}
                {item.status === "error" && (
                  <p className="text-xs text-destructive mt-0.5">{item.error}</p>
                )}
              </div>
              <div className="shrink-0">
                {item.status === "pending" && (
                  <button onClick={() => remove(item.id)} className="rounded p-1 text-portal-text-muted hover:text-destructive transition-colors">
                    <X size={14} />
                  </button>
                )}
                {item.status === "uploading" && <Loader2 size={16} className="animate-spin text-portal-accent" />}
                {item.status === "done" && <CheckCircle2 size={16} className="text-green-500" />}
                {item.status === "error" && <AlertCircle size={16} className="text-destructive" />}
              </div>
            </div>
          ))}

          <div className="flex gap-2">
            {pendingCount > 0 && (
              <Button size="sm" onClick={uploadAll} className="bg-portal-accent text-portal-accent-foreground hover:bg-portal-accent/90">
                <UploadCloud size={13} className="mr-1.5" />
                Upload {pendingCount} file{pendingCount > 1 ? "s" : ""}
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={() => setQueue([])} className="border-portal-border text-portal-text-muted">
              Clear
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
