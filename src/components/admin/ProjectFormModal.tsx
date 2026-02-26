import { useState, useEffect, useRef } from "react";
import { X, User, Save, ImagePlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { writeAuditLog } from "@/lib/audit";
import { useAuth } from "@/contexts/AuthContext";

interface Profile {
  id: string;
  full_name: string | null;
  company: string | null;
}

export interface ProjectFormData {
  client_id: string;
  title: string;
  description: string;
  status: string;
  location: string;
  start_date: string;
  target_date: string;
  is_public: boolean;
  thumbnail_url: string;
}

interface ProjectFormModalProps {
  editProject?: {
    id: string;
    client_id: string;
    title: string;
    description: string | null;
    status: string;
    location: string | null;
    start_date: string | null;
    target_date: string | null;
    is_public?: boolean;
    thumbnail_url?: string | null;
  } | null;
  onClose: () => void;
  onSaved: () => void;
}

const STATUS_OPTIONS = ["inquiry", "active", "review", "delivered", "archived"];

export function ProjectFormModal({ editProject, onClose, onSaved }: ProjectFormModalProps) {
  const { profile } = useAuth();
  const [clients, setClients] = useState<Profile[]>([]);
  const [form, setForm] = useState<ProjectFormData>({
    client_id: editProject?.client_id ?? "",
    title: editProject?.title ?? "",
    description: editProject?.description ?? "",
    status: editProject?.status ?? "inquiry",
    location: editProject?.location ?? "",
    start_date: editProject?.start_date ?? "",
    target_date: editProject?.target_date ?? "",
    is_public: editProject?.is_public ?? false,
    thumbnail_url: editProject?.thumbnail_url ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const path = `thumbnails/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const { error: upErr } = await supabase.storage.from("portfolio").upload(path, file, { upsert: true });
    if (upErr) { setError(upErr.message); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from("portfolio").getPublicUrl(path);
    setForm((f) => ({ ...f, thumbnail_url: urlData.publicUrl }));
    setUploading(false);
  };

  const removeThumbnail = () => setForm((f) => ({ ...f, thumbnail_url: "" }));

  useEffect(() => {
    supabase
      .from("profiles")
      .select("id, full_name, company")
      .eq("role", "CLIENT")
      .order("full_name")
      .then(({ data }) => setClients((data as Profile[]) ?? []));
  }, []);

  const set = (field: keyof ProjectFormData, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { setError("Title is required."); return; }
    setError(null);
    setSaving(true);

    const effectiveClientId = form.client_id || profile?.id;
    if (!effectiveClientId) { setError("No user found."); setSaving(false); return; }

    const payload = {
      client_id: effectiveClientId,
      title: form.title.trim(),
      description: form.description.trim() || null,
      status: form.status,
      location: form.location.trim() || null,
      start_date: form.start_date || null,
      target_date: form.target_date || null,
      is_public: form.is_public,
      thumbnail_url: form.thumbnail_url.trim() || null,
    };

    if (editProject) {
      const { error: err } = await supabase.from("projects").update(payload).eq("id", editProject.id);
      if (err) { setError(err.message); setSaving(false); return; }
      if (profile) await writeAuditLog({
        actor_id: profile.id, action: "project_updated", entity_type: "project",
        entity_id: editProject.id, metadata: { title: form.title },
      });
    } else {
      const { data: newProject, error: err } = await supabase
        .from("projects").insert([payload]).select("id").single();
      if (err || !newProject) { setError(err?.message ?? "Failed to create project"); setSaving(false); return; }

      // Auto-create client membership
      await supabase.from("project_members").insert([{
        project_id: newProject.id,
        user_id: form.client_id,
        member_role: "CLIENT",
      }]);

      if (profile) await writeAuditLog({
        actor_id: profile.id, action: "project_created", entity_type: "project",
        entity_id: newProject.id, metadata: { title: form.title },
      });
    }

    setSaving(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-xl border border-portal-border bg-portal-surface overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-portal-border px-6 py-4">
          <h2 className="font-display text-lg font-bold text-portal-text">
            {editProject ? "Edit Project" : "New Project"}
          </h2>
          <button onClick={onClose} className="rounded p-1 text-portal-text-muted hover:text-portal-text"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Client selector - hidden for new projects, shown only when editing */}
          {editProject && (
            <div className="space-y-1.5">
              <Label className="text-portal-text-muted">Client</Label>
              <select
                value={form.client_id}
                onChange={(e) => set("client_id", e.target.value)}
                disabled
                className="w-full rounded-md border border-portal-border bg-portal-bg px-3 py-2 text-sm text-portal-text focus:outline-none focus:ring-1 focus:ring-portal-accent"
              >
                <option value="">Select a client…</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name ?? "Unnamed"}{c.company ? ` — ${c.company}` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-portal-text-muted">Title *</Label>
            <Input value={form.title} onChange={(e) => set("title", e.target.value)}
              className="bg-portal-bg border-portal-border text-portal-text" placeholder="Project title" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-portal-text-muted">Description</Label>
            <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3}
              className="w-full rounded-md border border-portal-border bg-portal-bg px-3 py-2 text-sm text-portal-text placeholder:text-portal-text-muted focus:outline-none focus:ring-1 focus:ring-portal-accent"
              placeholder="Optional description…" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-portal-text-muted">Status</Label>
              <select value={form.status} onChange={(e) => set("status", e.target.value)}
                className="w-full rounded-md border border-portal-border bg-portal-bg px-3 py-2 text-sm text-portal-text focus:outline-none focus:ring-1 focus:ring-portal-accent">
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-portal-text-muted">Location</Label>
              <Input value={form.location} onChange={(e) => set("location", e.target.value)}
                className="bg-portal-bg border-portal-border text-portal-text" placeholder="City, venue…" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-portal-text-muted">Start Date</Label>
              <Input type="date" value={form.start_date} onChange={(e) => set("start_date", e.target.value)}
                className="bg-portal-bg border-portal-border text-portal-text" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-portal-text-muted">Target Date</Label>
              <Input type="date" value={form.target_date} onChange={(e) => set("target_date", e.target.value)}
                className="bg-portal-bg border-portal-border text-portal-text" />
            </div>
          </div>


          {/* Thumbnail upload */}
          <div className="space-y-1.5">
            <Label className="text-portal-text-muted">Thumbnail</Label>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleThumbnailUpload} />
            {form.thumbnail_url ? (
              <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-portal-border bg-portal-bg">
                <img src={form.thumbnail_url} alt="Thumbnail" className="w-full h-full object-cover" />
                <button type="button" onClick={removeThumbnail}
                  className="absolute top-2 right-2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                className="w-full flex flex-col items-center gap-2 rounded-lg border border-dashed border-portal-border bg-portal-bg/50 py-6 text-portal-text-muted hover:border-portal-accent/50 hover:text-portal-accent transition-colors">
                <ImagePlus size={24} />
                <span className="text-xs">{uploading ? "Uploading…" : "Click to upload thumbnail"}</span>
              </button>
            )}
          </div>

          {/* Public visibility toggle */}
          <div className="flex items-center gap-3 rounded-lg border border-portal-border bg-portal-bg/50 px-4 py-3">
            <input
              type="checkbox"
              id="is_public"
              checked={form.is_public}
              onChange={(e) => setForm((f) => ({ ...f, is_public: e.target.checked }))}
              className="h-4 w-4 rounded border-portal-border accent-portal-accent"
            />
            <label htmlFor="is_public" className="flex-1">
              <span className="text-sm font-medium text-portal-text">Show on public website</span>
              <span className="block text-xs text-portal-text-muted">When enabled, this project and its files will be visible to anyone on the public Projects page.</span>
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}
              className="flex-1 border-portal-border text-portal-text-muted hover:bg-portal-bg">Cancel</Button>
            <Button type="submit" disabled={saving}
              className="flex-1 bg-portal-accent text-portal-accent-foreground hover:bg-portal-accent/90">
              <Save size={14} className="mr-2" />
              {saving ? "Saving…" : editProject ? "Save Changes" : "Create Project"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
