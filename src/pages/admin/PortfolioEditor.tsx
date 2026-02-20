import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PortalLayout } from "@/components/PortalLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { PortfolioItem, GalleryImage, slugify, uploadPortfolioImage } from "@/lib/portfolio";
import { writeAuditLog } from "@/lib/audit";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, Upload, X, Loader2, Star, Eye, EyeOff,
  Plus, GripVertical, Trash2, Image,
} from "lucide-react";

const CATEGORIES = ["Residential", "Commercial", "Interior", "Landscape", "Hospitality", "Other"];

interface FormState {
  title: string;
  slug: string;
  summary: string;
  content: string;
  category: string;
  location: string;
  year: string;
  tags: string[];
  is_featured: boolean;
  is_published: boolean;
  cover_image_url: string;
}

const EMPTY: FormState = {
  title: "", slug: "", summary: "", content: "",
  category: "", location: "", year: "",
  tags: [], is_featured: false, is_published: true, cover_image_url: "",
};

export default function AdminPortfolioEditor() {
  const { id } = useParams<{ id: string }>();
  const isNew = id === "new";
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { toast } = useToast();

  const [form, setForm] = useState<FormState>(EMPTY);
  const [gallery, setGallery] = useState<GalleryImage[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [portfolioId, setPortfolioId] = useState<string | null>(isNew ? null : id ?? null);

  // Load existing item
  useEffect(() => {
    if (isNew) return;
    const fetchItem = async () => {
      const [{ data: item }, { data: gal }] = await Promise.all([
        supabase.from("portfolio_items").select("*").eq("id", id).single(),
        supabase.from("portfolio_gallery").select("*").eq("portfolio_id", id).order("sort_order"),
      ]);
      if (item) {
        const p = item as PortfolioItem;
        setForm({
          title: p.title, slug: p.slug, summary: p.summary, content: p.content ?? "",
          category: p.category ?? "", location: p.location ?? "",
          year: p.year?.toString() ?? "", tags: p.tags ?? [],
          is_featured: p.is_featured, is_published: p.is_published,
          cover_image_url: p.cover_image_url,
        });
      }
      if (gal) setGallery(gal as GalleryImage[]);
      setLoading(false);
    };
    fetchItem();
  }, [id, isNew]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleTitleChange = (v: string) => {
    set("title", v);
    if (!portfolioId) set("slug", slugify(v));
  };

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !form.tags.includes(t)) {
      set("tags", [...form.tags, t]);
    }
    setTagInput("");
  };

  const removeTag = (t: string) => set("tags", form.tags.filter((x) => x !== t));

  // Ensure a portfolio_items row exists before uploading images
  const ensureItemRow = async (): Promise<string | null> => {
    if (portfolioId) return portfolioId;
    if (!profile) return null;
    const slug = form.slug || slugify(form.title || `untitled-${Date.now()}`);
    const { data, error } = await supabase.from("portfolio_items").insert({
      slug, title: form.title || "Untitled",
      summary: form.summary || "Draft",
      cover_image_url: "", tags: [],
      is_published: false,
    }).select("id").single();
    if (error) { toast({ title: "Failed to create item", description: error.message, variant: "destructive" }); return null; }
    const newId = (data as { id: string }).id;
    setPortfolioId(newId);
    return newId;
  };

  const handleCoverUpload = async (file: File) => {
    const pid = await ensureItemRow();
    if (!pid) return;
    setCoverUploading(true);
    const url = await uploadPortfolioImage(file, pid, "cover");
    setCoverUploading(false);
    if (!url) { toast({ title: "Upload failed", variant: "destructive" }); return; }
    set("cover_image_url", url);
    // Also persist to DB immediately
    await supabase.from("portfolio_items").update({ cover_image_url: url }).eq("id", pid);
  };

  const handleGalleryUpload = async (files: FileList) => {
    const pid = await ensureItemRow();
    if (!pid) return;
    setGalleryUploading(true);
    const uploads = Array.from(files).map((f) => uploadPortfolioImage(f, pid, "gallery"));
    const urls = await Promise.all(uploads);
    const maxOrder = gallery.length > 0 ? Math.max(...gallery.map((g) => g.sort_order)) : -1;
    const inserts = urls
      .filter(Boolean)
      .map((url, idx) => ({ portfolio_id: pid, image_url: url!, sort_order: maxOrder + 1 + idx }));
    if (inserts.length > 0) {
      const { data } = await supabase.from("portfolio_gallery").insert(inserts).select("*");
      if (data) setGallery((g) => [...g, ...(data as GalleryImage[])]);
    }
    setGalleryUploading(false);
  };

  const removeGalleryImage = async (img: GalleryImage) => {
    await supabase.from("portfolio_gallery").delete().eq("id", img.id);
    setGallery((g) => g.filter((x) => x.id !== img.id));
  };

  const handleSave = async (publish?: boolean) => {
    if (!profile) return;
    if (!form.title.trim()) { toast({ title: "Title required", variant: "destructive" }); return; }
    if (!form.summary.trim()) { toast({ title: "Summary required", variant: "destructive" }); return; }
    setSaving(true);

    const isPublished = publish !== undefined ? publish : form.is_published;
    const payload = {
      title: form.title.trim(),
      slug: form.slug.trim() || slugify(form.title),
      summary: form.summary.trim(),
      content: form.content.trim() || null,
      cover_image_url: form.cover_image_url,
      tags: form.tags,
      category: form.category || null,
      location: form.location || null,
      year: form.year ? parseInt(form.year) : null,
      is_featured: form.is_featured,
      is_published: isPublished,
    };

    let error;
    let finalId = portfolioId;

    if (portfolioId) {
      ({ error } = await supabase.from("portfolio_items").update(payload).eq("id", portfolioId));
    } else {
      const { data, error: insertErr } = await supabase.from("portfolio_items").insert(payload).select("id").single();
      error = insertErr;
      if (data) { finalId = (data as { id: string }).id; setPortfolioId(finalId); }
    }

    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
      setSaving(false); return;
    }

    await writeAuditLog({
      actor_id: profile.id,
      action: isNew ? "portfolio_created" : (isPublished ? "portfolio_published" : "portfolio_updated"),
      entity_type: "portfolio",
      entity_id: finalId ?? undefined,
      metadata: { title: form.title },
    });

    toast({ title: isPublished ? "Published!" : "Draft saved" });
    setSaving(false);
    if (isNew && finalId) navigate(`/admin/portfolio/${finalId}`, { replace: true });
  };

  if (loading) return (
    <PortalLayout variant="admin">
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-portal-text-muted" />
      </div>
    </PortalLayout>
  );

  return (
    <PortalLayout variant="admin">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/admin/portfolio")}
            className="rounded-lg p-1.5 text-portal-text-muted hover:text-portal-text hover:bg-portal-border transition-colors">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="font-display text-2xl font-bold text-portal-text">
              {isNew ? "New Portfolio Item" : form.title || "Edit Item"}
            </h1>
            {!isNew && <p className="text-xs text-portal-text-muted mt-0.5">/{form.slug}</p>}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-portal-border text-portal-text-muted gap-2" onClick={() => handleSave(false)} disabled={saving}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : <EyeOff size={14} />}
            Save Draft
          </Button>
          <Button className="gap-2" onClick={() => handleSave(true)} disabled={saving}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Eye size={14} />}
            Publish
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* Main column */}
        <div className="space-y-5">
          {/* Title + Slug */}
          <div className="rounded-xl border border-portal-border bg-portal-surface p-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-portal-text-muted mb-1.5">Title *</label>
              <input value={form.title} onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g. Marble Heights Residence"
                className="w-full rounded-lg border border-portal-border bg-portal-bg px-3 py-2 text-portal-text text-sm placeholder:text-portal-text-muted focus:outline-none focus:ring-2 focus:ring-portal-accent/50" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-portal-text-muted mb-1.5">Slug *</label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-portal-text-muted">/portfolio/</span>
                <input value={form.slug} onChange={(e) => set("slug", slugify(e.target.value))}
                  placeholder="marble-heights-residence"
                  className="flex-1 rounded-lg border border-portal-border bg-portal-bg px-3 py-2 text-portal-text text-sm placeholder:text-portal-text-muted focus:outline-none focus:ring-2 focus:ring-portal-accent/50" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-portal-text-muted mb-1.5">Summary * <span className="font-normal">(shown on listing)</span></label>
              <textarea value={form.summary} onChange={(e) => set("summary", e.target.value)}
                placeholder="Brief compelling summary (1-2 sentences)…"
                rows={2}
                className="w-full rounded-lg border border-portal-border bg-portal-bg px-3 py-2 text-portal-text text-sm placeholder:text-portal-text-muted resize-none focus:outline-none focus:ring-2 focus:ring-portal-accent/50" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-portal-text-muted mb-1.5">Content <span className="font-normal">(markdown supported)</span></label>
              <textarea value={form.content} onChange={(e) => set("content", e.target.value)}
                placeholder="Full project description, design notes, context…"
                rows={8}
                className="w-full rounded-lg border border-portal-border bg-portal-bg px-3 py-2 text-portal-text text-sm placeholder:text-portal-text-muted resize-none focus:outline-none focus:ring-2 focus:ring-portal-accent/50 font-mono" />
            </div>
          </div>

          {/* Cover image */}
          <div className="rounded-xl border border-portal-border bg-portal-surface p-5">
            <label className="block text-xs font-semibold text-portal-text-muted mb-3">Cover Image</label>
            {form.cover_image_url ? (
              <div className="relative">
                <img src={form.cover_image_url} alt="Cover" className="w-full h-52 object-cover rounded-lg" />
                <button onClick={() => set("cover_image_url", "")}
                  className="absolute top-2 right-2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80 transition-colors">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center gap-3 rounded-lg border-2 border-dashed border-portal-border bg-portal-bg p-10 cursor-pointer hover:border-portal-accent/50 transition-colors">
                {coverUploading ? <Loader2 size={24} className="animate-spin text-portal-text-muted" /> : <Upload size={24} className="text-portal-text-muted" />}
                <span className="text-sm text-portal-text-muted">{coverUploading ? "Uploading…" : "Click to upload cover image"}</span>
                <input type="file" accept="image/*" className="sr-only"
                  onChange={(e) => e.target.files?.[0] && handleCoverUpload(e.target.files[0])} />
              </label>
            )}
          </div>

          {/* Gallery */}
          <div className="rounded-xl border border-portal-border bg-portal-surface p-5">
            <div className="flex items-center justify-between mb-4">
              <label className="text-xs font-semibold text-portal-text-muted">Gallery ({gallery.length} images)</label>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-portal-accent cursor-pointer hover:opacity-80 transition-opacity">
                {galleryUploading ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                {galleryUploading ? "Uploading…" : "Add Images"}
                <input type="file" accept="image/*" multiple className="sr-only"
                  onChange={(e) => e.target.files && handleGalleryUpload(e.target.files)} />
              </label>
            </div>
            {gallery.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-portal-text-muted border-2 border-dashed border-portal-border rounded-lg">
                <Image size={24} className="opacity-30" />
                <span className="text-sm">No gallery images yet</span>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {gallery.map((img) => (
                  <div key={img.id} className="relative group aspect-square">
                    <img src={img.image_url} alt="" className="w-full h-full object-cover rounded-lg" loading="lazy" />
                    <button onClick={() => removeGalleryImage(img)}
                      className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                      <Trash2 size={16} className="text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Toggles */}
          <div className="rounded-xl border border-portal-border bg-portal-surface p-4 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-portal-text-muted">Visibility</h3>
            {([
              { key: "is_published" as const, label: "Published", icon: Eye, desc: "Visible on public site" },
              { key: "is_featured" as const, label: "Featured", icon: Star, desc: "Shown in featured section" },
            ] as const).map(({ key, label, icon: Icon, desc }) => (
              <button key={key} onClick={() => set(key, !form[key])}
                className={`w-full flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${form[key] ? "border-portal-accent/40 bg-portal-accent/10" : "border-portal-border bg-portal-bg"}`}>
                <Icon size={14} className={form[key] ? "text-portal-accent" : "text-portal-text-muted"} />
                <div>
                  <p className={`text-xs font-semibold ${form[key] ? "text-portal-accent" : "text-portal-text"}`}>{label}</p>
                  <p className="text-[11px] text-portal-text-muted">{desc}</p>
                </div>
                <div className={`ml-auto h-4 w-8 rounded-full transition-colors ${form[key] ? "bg-portal-accent" : "bg-portal-border"}`}>
                  <div className={`h-4 w-4 rounded-full bg-white shadow transition-transform ${form[key] ? "translate-x-4" : "translate-x-0"}`} />
                </div>
              </button>
            ))}
          </div>

          {/* Metadata */}
          <div className="rounded-xl border border-portal-border bg-portal-surface p-4 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-portal-text-muted">Details</h3>
            <div>
              <label className="block text-xs text-portal-text-muted mb-1">Category</label>
              <select value={form.category} onChange={(e) => set("category", e.target.value)}
                className="w-full rounded-lg border border-portal-border bg-portal-bg px-3 py-2 text-sm text-portal-text focus:outline-none focus:ring-2 focus:ring-portal-accent/50">
                <option value="">Select…</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-portal-text-muted mb-1">Location</label>
              <input value={form.location} onChange={(e) => set("location", e.target.value)}
                placeholder="City, Country"
                className="w-full rounded-lg border border-portal-border bg-portal-bg px-3 py-2 text-sm text-portal-text placeholder:text-portal-text-muted focus:outline-none focus:ring-2 focus:ring-portal-accent/50" />
            </div>
            <div>
              <label className="block text-xs text-portal-text-muted mb-1">Year</label>
              <input type="number" value={form.year} onChange={(e) => set("year", e.target.value)}
                placeholder={new Date().getFullYear().toString()}
                min="1900" max="2100"
                className="w-full rounded-lg border border-portal-border bg-portal-bg px-3 py-2 text-sm text-portal-text placeholder:text-portal-text-muted focus:outline-none focus:ring-2 focus:ring-portal-accent/50" />
            </div>
          </div>

          {/* Tags */}
          <div className="rounded-xl border border-portal-border bg-portal-surface p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-portal-text-muted mb-3">Tags</h3>
            <div className="flex gap-1.5 flex-wrap mb-3">
              {form.tags.map((t) => (
                <span key={t} className="inline-flex items-center gap-1 rounded-full bg-portal-accent/15 px-2.5 py-1 text-xs font-medium text-portal-accent">
                  {t}
                  <button onClick={() => removeTag(t)} className="hover:text-white"><X size={10} /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={tagInput} onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(); } }}
                placeholder="Add tag…"
                className="flex-1 rounded-lg border border-portal-border bg-portal-bg px-3 py-1.5 text-xs text-portal-text placeholder:text-portal-text-muted focus:outline-none focus:ring-2 focus:ring-portal-accent/50" />
              <button onClick={addTag}
                className="rounded-lg bg-portal-accent/20 px-2.5 py-1.5 text-xs font-semibold text-portal-accent hover:bg-portal-accent/30 transition-colors">
                <Plus size={12} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
