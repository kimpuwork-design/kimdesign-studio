import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PortalLayout } from "@/components/PortalLayout";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Loader2, Upload, Image as ImageIcon } from "lucide-react";

interface BlogFormData {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image_url: string;
  category: string;
  tags: string;
  is_published: boolean;
}

const CATEGORIES = ["news", "insights", "projects", "tutorials", "announcements"];

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default function AdminBlogEditor() {
  const { id } = useParams();
  const isNew = id === "new";
  const navigate = useNavigate();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!isNew);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState<BlogFormData>({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    cover_image_url: "",
    category: "news",
    tags: "",
    is_published: false,
  });

  useEffect(() => {
    if (isNew) return;
    supabase
      .from("blog_posts")
      .select("*")
      .eq("id", id!)
      .single()
      .then(({ data, error }) => {
        if (error || !data) { navigate("/admin/blog"); return; }
        setForm({
          title: data.title,
          slug: data.slug,
          excerpt: data.excerpt ?? "",
          content: data.content ?? "",
          cover_image_url: data.cover_image_url ?? "",
          category: data.category ?? "news",
          tags: (data.tags ?? []).join(", "),
          is_published: data.is_published,
        });
        setLoading(false);
      });
  }, [id]);

  const set = (key: keyof BlogFormData, value: any) => {
    setForm((f) => {
      const updated = { ...f, [key]: value };
      if (key === "title" && (isNew || f.slug === slugify(f.title))) {
        updated.slug = slugify(value);
      }
      return updated;
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `blog/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("portfolio").upload(path, file);
    if (error) { toast({ title: "Upload failed", variant: "destructive" }); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from("portfolio").getPublicUrl(path);
    set("cover_image_url", urlData.publicUrl);
    setUploading(false);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.slug.trim()) {
      toast({ title: "Title and slug are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    const tags = form.tags.split(",").map((t) => t.trim()).filter(Boolean);
    const payload: any = {
      title: form.title,
      slug: form.slug,
      excerpt: form.excerpt,
      content: form.content,
      cover_image_url: form.cover_image_url || null,
      category: form.category,
      tags,
      is_published: form.is_published,
    };

    if (form.is_published) {
      payload.published_at = new Date().toISOString();
    }

    if (isNew) {
      payload.author_id = user?.id;
      const { error } = await supabase.from("blog_posts").insert([payload]);
      if (error) {
        toast({ title: error.message, variant: "destructive" });
        setSaving(false);
        return;
      }
      toast({ title: "Post created" });
    } else {
      const { error } = await supabase.from("blog_posts").update(payload).eq("id", id!);
      if (error) {
        toast({ title: error.message, variant: "destructive" });
        setSaving(false);
        return;
      }
      toast({ title: "Post updated" });
    }
    setSaving(false);
    navigate("/admin/blog");
  };

  if (loading) {
    return (
      <PortalLayout variant="admin">
        <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin text-muted-foreground" /></div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout variant="admin">
      <PageHeader title={isNew ? "New Blog Post" : "Edit Post"} subtitle={form.title || "Untitled"}
        action={
          <div className="flex items-center gap-3">
            <Button variant="outline" className="rounded-2xl" onClick={() => navigate("/admin/blog")}>
              <ArrowLeft size={14} className="mr-2" /> Back
            </Button>
            <Button className="rounded-2xl" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 size={14} className="mr-2 animate-spin" /> : <Save size={14} className="mr-2" />}
              {isNew ? "Create" : "Save"}
            </Button>
          </div>
        }
      />

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        {/* Main editor */}
        <div className="space-y-6">
          <div className="space-y-2">
            <Label className="text-xs tracking-wide uppercase text-muted-foreground">Title</Label>
            <Input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Blog post title…" className="rounded-xl text-lg font-display" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs tracking-wide uppercase text-muted-foreground">Slug</Label>
            <Input value={form.slug} onChange={(e) => set("slug", e.target.value)} placeholder="url-friendly-slug" className="rounded-xl font-mono text-sm" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs tracking-wide uppercase text-muted-foreground">Excerpt</Label>
            <Textarea value={form.excerpt} onChange={(e) => set("excerpt", e.target.value)} placeholder="Brief summary…" rows={3} className="rounded-xl resize-none" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs tracking-wide uppercase text-muted-foreground">Content (Markdown supported)</Label>
            <Textarea value={form.content} onChange={(e) => set("content", e.target.value)} placeholder="Write your article here…" rows={20} className="rounded-xl resize-y font-mono text-sm leading-relaxed" />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Publish toggle */}
          <div className="rounded-2xl border border-border/50 bg-background/60 backdrop-blur-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-xs tracking-wide uppercase text-muted-foreground">Published</Label>
              <Switch checked={form.is_published} onCheckedChange={(v) => set("is_published", v)} />
            </div>
          </div>

          {/* Cover image */}
          <div className="rounded-2xl border border-border/50 bg-background/60 backdrop-blur-sm p-5 space-y-3">
            <Label className="text-xs tracking-wide uppercase text-muted-foreground">Cover Image</Label>
            {form.cover_image_url ? (
              <div className="relative">
                <img src={form.cover_image_url} alt="" className="w-full aspect-video object-cover rounded-xl" />
                <button onClick={() => set("cover_image_url", "")} className="absolute top-2 right-2 rounded-full bg-background/80 backdrop-blur-sm p-1.5 text-muted-foreground hover:text-destructive">×</button>
              </div>
            ) : (
              <label className="flex flex-col items-center gap-2 p-6 border-2 border-dashed border-border/50 rounded-xl cursor-pointer hover:border-primary/30 transition-all">
                {uploading ? <Loader2 size={20} className="animate-spin text-muted-foreground" /> : <ImageIcon size={20} className="text-muted-foreground" />}
                <span className="text-xs text-muted-foreground">{uploading ? "Uploading…" : "Upload image"}</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
              </label>
            )}
            <Input value={form.cover_image_url} onChange={(e) => set("cover_image_url", e.target.value)} placeholder="Or paste image URL…" className="rounded-xl text-xs" />
          </div>

          {/* Category */}
          <div className="rounded-2xl border border-border/50 bg-background/60 backdrop-blur-sm p-5 space-y-3">
            <Label className="text-xs tracking-wide uppercase text-muted-foreground">Category</Label>
            <select value={form.category} onChange={(e) => set("category", e.target.value)} className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm">
              {CATEGORIES.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>
          </div>

          {/* Tags */}
          <div className="rounded-2xl border border-border/50 bg-background/60 backdrop-blur-sm p-5 space-y-3">
            <Label className="text-xs tracking-wide uppercase text-muted-foreground">Tags (comma-separated)</Label>
            <Input value={form.tags} onChange={(e) => set("tags", e.target.value)} placeholder="architecture, design, myanmar" className="rounded-xl text-sm" />
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
