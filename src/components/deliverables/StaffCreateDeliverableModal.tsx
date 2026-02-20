import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { writeAuditLog } from "@/lib/audit";
import { FileAsset, buildStoragePath, getExtension, getNextVersion, validateExtension } from "@/lib/files";
import { FileIcon } from "@/components/files/FileIcon";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { X, Upload, Loader2, FileText } from "lucide-react";

interface Props {
  projectId: string;
  onClose: () => void;
  onCreated: () => void;
}

export function StaffCreateDeliverableModal({ projectId, onClose, onCreated }: Props) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"draft" | "submitted">("submitted");
  const [deliverableFiles, setDeliverableFiles] = useState<FileAsset[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState<"existing" | "upload">("existing");

  useEffect(() => {
    supabase
      .from("file_assets")
      .select("*")
      .eq("project_id", projectId)
      .eq("is_deleted", false)
      .eq("category", "deliverables")
      .order("created_at", { ascending: false })
      .then(({ data }) => setDeliverableFiles((data as unknown as FileAsset[]) ?? []));
  }, [projectId]);

  const handleUploadAndLink = async (): Promise<string | null> => {
    if (!uploadFile || !profile) return null;
    if (!validateExtension(uploadFile.name)) {
      toast({ title: "File type not allowed", variant: "destructive" }); return null;
    }
    setUploading(true);
    const ext = getExtension(uploadFile.name);
    const version = await getNextVersion(projectId, "deliverables", uploadFile.name);
    const path = buildStoragePath(projectId, "deliverables", version, uploadFile.name);

    const { error: upErr } = await supabase.storage.from("project-files").upload(path, uploadFile);
    if (upErr) {
      toast({ title: "Upload failed", description: upErr.message, variant: "destructive" });
      setUploading(false); return null;
    }

    const { data: asset, error: dbErr } = await supabase.from("file_assets").insert({
      project_id: projectId,
      uploader_id: profile.id,
      category: "deliverables",
      original_name: uploadFile.name,
      storage_path: path,
      storage_bucket: "project-files",
      mime_type: uploadFile.type,
      extension: ext,
      size_bytes: uploadFile.size,
      version,
    }).select("id").single();

    setUploading(false);
    if (dbErr) { toast({ title: "DB insert failed", description: dbErr.message, variant: "destructive" }); return null; }
    return (asset as { id: string }).id;
  };

  const handleSubmit = async () => {
    if (!title.trim()) { toast({ title: "Title required", variant: "destructive" }); return; }
    if (!profile) return;

    let fileId = selectedFileId;
    if (activeTab === "upload") {
      if (!uploadFile) { toast({ title: "Select a file to upload", variant: "destructive" }); return; }
      const id = await handleUploadAndLink();
      if (!id) return;
      fileId = id;
    } else {
      if (!fileId) { toast({ title: "Select a file", variant: "destructive" }); return; }
    }

    setSaving(true);
    const { data: del, error } = await supabase.from("deliverables").insert({
      project_id: projectId,
      created_by: profile.id,
      title: title.trim(),
      description: description.trim() || null,
      file_id: fileId,
      status,
      submitted_at: status === "submitted" ? new Date().toISOString() : null,
    }).select("id").single();

    if (error) {
      toast({ title: "Failed to create", description: error.message, variant: "destructive" });
      setSaving(false); return;
    }

    const delId = (del as { id: string }).id;

    // Insert event
    await supabase.from("deliverable_events").insert({
      deliverable_id: delId,
      actor_id: profile.id,
      event_type: status === "submitted" ? "submitted" : "created",
      note: null,
    });

    await writeAuditLog({
      actor_id: profile.id,
      action: status === "submitted" ? "deliverable_submitted" : "deliverable_created",
      entity_type: "deliverable",
      entity_id: delId,
      metadata: { project_id: projectId },
    });

    toast({ title: status === "submitted" ? "Deliverable submitted" : "Draft saved" });
    setSaving(false);
    onCreated();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-portal-border bg-portal-surface shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-portal-border">
          <h2 className="font-display text-lg font-bold text-portal-text">Submit Deliverable</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-portal-text-muted hover:text-portal-text hover:bg-portal-border transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-portal-text-muted mb-1.5">Title *</label>
            <input
              value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Final floor plan v3"
              className="w-full rounded-lg border border-portal-border bg-portal-bg px-3 py-2 text-sm text-portal-text placeholder:text-portal-text-muted focus:outline-none focus:ring-2 focus:ring-portal-accent/50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-portal-text-muted mb-1.5">Description</label>
            <textarea
              value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional notes for the client..."
              rows={2}
              className="w-full rounded-lg border border-portal-border bg-portal-bg px-3 py-2 text-sm text-portal-text placeholder:text-portal-text-muted resize-none focus:outline-none focus:ring-2 focus:ring-portal-accent/50"
            />
          </div>

          {/* File selection tabs */}
          <div>
            <label className="block text-xs font-semibold text-portal-text-muted mb-2">File *</label>
            <div className="flex rounded-lg border border-portal-border overflow-hidden mb-3">
              {(["existing", "upload"] as const).map((t) => (
                <button key={t} onClick={() => setActiveTab(t)}
                  className={`flex-1 px-3 py-2 text-xs font-semibold transition-colors ${activeTab === t ? "bg-portal-accent text-white" : "text-portal-text-muted hover:text-portal-text"}`}>
                  {t === "existing" ? "Choose Existing" : "Upload New"}
                </button>
              ))}
            </div>

            {activeTab === "existing" ? (
              deliverableFiles.length === 0 ? (
                <p className="text-xs text-portal-text-muted py-2">No deliverable files uploaded yet. Switch to "Upload New".</p>
              ) : (
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {deliverableFiles.map((f) => (
                    <button key={f.id} onClick={() => setSelectedFileId(f.id)}
                      className={`w-full flex items-center gap-2 rounded-lg border px-3 py-2 text-left transition-colors ${
                        selectedFileId === f.id ? "border-portal-accent bg-portal-accent/10" : "border-portal-border bg-portal-bg hover:bg-portal-surface"
                      }`}>
                      <FileIcon ext={f.extension ?? ""} size={15} className="text-portal-text-muted shrink-0" />
                      <span className="text-xs text-portal-text truncate">{f.original_name}</span>
                      {f.version > 1 && <span className="ml-auto text-[10px] text-portal-accent font-semibold">v{f.version}</span>}
                    </button>
                  ))}
                </div>
              )
            ) : (
              <div>
                <label className="flex flex-col items-center gap-2 rounded-lg border-2 border-dashed border-portal-border bg-portal-bg p-5 cursor-pointer hover:border-portal-accent/50 transition-colors">
                  {uploadFile ? (
                    <div className="flex items-center gap-2 text-sm text-portal-text">
                      <FileText size={16} className="text-portal-accent" />
                      {uploadFile.name}
                    </div>
                  ) : (
                    <>
                      <Upload size={20} className="text-portal-text-muted" />
                      <span className="text-xs text-portal-text-muted">Click to select file</span>
                    </>
                  )}
                  <input type="file" className="sr-only" onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)} />
                </label>
              </div>
            )}
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-semibold text-portal-text-muted mb-2">Submit as</label>
            <div className="flex gap-2">
              {(["submitted", "draft"] as const).map((s) => (
                <button key={s} onClick={() => setStatus(s)}
                  className={`flex-1 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                    status === s ? "border-portal-accent bg-portal-accent/10 text-portal-accent" : "border-portal-border text-portal-text-muted hover:text-portal-text"
                  }`}>
                  {s === "submitted" ? "Submit to Client" : "Save as Draft"}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-2 p-5 border-t border-portal-border">
          <Button variant="outline" className="flex-1 border-portal-border text-portal-text-muted" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" onClick={handleSubmit} disabled={saving || uploading}>
            {(saving || uploading) && <Loader2 size={14} className="animate-spin mr-1.5" />}
            {status === "submitted" ? "Submit" : "Save Draft"}
          </Button>
        </div>
      </div>
    </div>
  );
}
