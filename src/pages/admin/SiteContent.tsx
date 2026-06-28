import { useEffect, useState } from "react";
import { PortalLayout } from "@/components/PortalLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { writeAuditLog } from "@/lib/audit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, Upload, Save, ChevronDown, ChevronRight, Image as ImageIcon, ExternalLink } from "lucide-react";

const SECTION_PUBLIC_PATH: Record<string, string> = {
  about_me: "/", hero: "/", stats: "/", services_home: "/", testimonials: "/", awards: "/", cta: "/",
  about_page: "/about", values: "/about", team: "/about",
  services_full: "/services", services_page: "/services", process: "/services",
  contact_info: "/contact",
};

interface SectionRow {
  section: string;
  content: any;
  updated_at: string;
}

const SECTION_LABELS: Record<string, string> = {
  about_me: "🏠 Homepage — About Me / Profile",
  hero: "🏠 Homepage — Hero Section",
  stats: "🏠 Homepage — Statistics",
  services_home: "🏠 Homepage — Services",
  testimonials: "🏠 Homepage — Testimonials",
  awards: "🏠 Homepage — Awards",
  cta: "🏠 Homepage — Call to Action",
  about_page: "📄 About Page — Hero & Story",
  values: "📄 About Page — Values",
  team: "📄 About Page — Team Members",
  services_full: "🛠 Services Page — Services List",
  services_page: "🛠 Services Page — Hero & CTA",
  process: "🛠 Services Page — Process Steps",
  contact_info: "📞 Contact Page — Info & Settings",
};

const SECTION_ORDER = [
  "about_me", "hero", "stats", "services_home", "testimonials", "awards", "cta",
  "about_page", "values", "team",
  "services_full", "services_page", "process",
  "contact_info",
];

export default function SiteContent() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [sections, setSections] = useState<SectionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    supabase
      .from("site_content")
      .select("*")
      .then(({ data }) => {
        if (data) {
          const sorted = (data as SectionRow[]).sort(
            (a, b) => SECTION_ORDER.indexOf(a.section) - SECTION_ORDER.indexOf(b.section)
          );
          setSections(sorted);
        }
        setLoading(false);
      });
  }, []);

  const updateSection = (section: string, content: any) => {
    setSections((prev) =>
      prev.map((s) => (s.section === section ? { ...s, content } : s))
    );
  };

  const handleSave = async (section: string) => {
    const row = sections.find((s) => s.section === section);
    if (!row || !profile) return;
    setSaving(section);
    const { error } = await supabase
      .from("site_content")
      .update({ content: row.content, updated_at: new Date().toISOString() })
      .eq("section", section);
    setSaving(null);
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
      return;
    }
    await writeAuditLog({
      actor_id: profile.id,
      action: "site_content_updated",
      entity_type: "site_content",
      entity_id: section,
    });
    toast({ title: `${SECTION_LABELS[section] ?? section} saved ✓` });
  };

  const handleImageUpload = async (file: File, callback: (url: string) => void) => {
    setUploading(true);
    const path = `site/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from("portfolio").upload(path, file, { upsert: true });
    if (error) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from("portfolio").getPublicUrl(path);
    callback(data.publicUrl);
    setUploading(false);
  };

  if (loading) {
    return (
      <PortalLayout variant="admin">
        <div className="flex items-center gap-2 py-10 text-portal-text-muted">
          <Loader2 size={16} className="animate-spin" /> Loading…
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout variant="admin">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-portal-text">Site Content</h1>
        <p className="mt-1 text-portal-text-muted">
          Edit all public-facing content — hero text, profile, services, testimonials, team, and more.
        </p>
      </div>

      <div className="space-y-3 max-w-3xl">
        {sections.map((row) => {
          const isExpanded = expanded === row.section;
          return (
            <div
              key={row.section}
              className="rounded-xl border border-portal-border bg-portal-surface overflow-hidden"
            >
              <button
                onClick={() => setExpanded(isExpanded ? null : row.section)}
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-portal-bg/50 transition-colors"
              >
                <span className="text-sm font-medium text-portal-text">
                  {SECTION_LABELS[row.section] ?? row.section}
                </span>
                {isExpanded ? (
                  <ChevronDown size={16} className="text-portal-text-muted" />
                ) : (
                  <ChevronRight size={16} className="text-portal-text-muted" />
                )}
              </button>
              {isExpanded && (
                <div className="px-5 pb-5 space-y-4 border-t border-portal-border pt-4">
                  <SectionEditor
                    section={row.section}
                    content={row.content}
                    onChange={(c) => updateSection(row.section, c)}
                    onImageUpload={handleImageUpload}
                    uploading={uploading}
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      onClick={() => handleSave(row.section)}
                      disabled={saving === row.section}
                      size="sm"
                      className="bg-portal-accent text-portal-accent-foreground hover:bg-portal-accent/90"
                    >
                      {saving === row.section ? (
                        <><Loader2 size={14} className="animate-spin mr-2" />Saving…</>
                      ) : (
                        <><Save size={14} className="mr-2" />Save Section</>
                      )}
                    </Button>
                    {SECTION_PUBLIC_PATH[row.section] && (
                      <a
                        href={SECTION_PUBLIC_PATH[row.section]}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-md border border-portal-border bg-portal-bg/40 px-3 py-1.5 text-xs text-portal-text-muted hover:text-portal-text hover:border-portal-accent/40 transition-colors"
                      >
                        <ExternalLink size={12} /> Preview live page
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </PortalLayout>
  );
}

// ── Section Editor ──────────────────────────────────────────────

interface SectionEditorProps {
  section: string;
  content: any;
  onChange: (content: any) => void;
  onImageUpload: (file: File, cb: (url: string) => void) => void;
  uploading: boolean;
}

function SectionEditor({ section, content, onChange, onImageUpload, uploading }: SectionEditorProps) {
  if (Array.isArray(content)) {
    return (
      <ArrayEditor
        items={content}
        onChange={onChange}
        section={section}
        onImageUpload={onImageUpload}
        uploading={uploading}
      />
    );
  }

  if (typeof content === "object" && content !== null) {
    return (
      <ObjectEditor
        obj={content}
        onChange={onChange}
        section={section}
        onImageUpload={onImageUpload}
        uploading={uploading}
      />
    );
  }

  return <p className="text-xs text-portal-text-muted">Unsupported content type</p>;
}

// ── Object Editor ───────────────────────────────────────────────

function ObjectEditor({
  obj,
  onChange,
  section,
  onImageUpload,
  uploading,
}: {
  obj: Record<string, any>;
  onChange: (v: Record<string, any>) => void;
  section: string;
  onImageUpload: (file: File, cb: (url: string) => void) => void;
  uploading: boolean;
}) {
  const set = (key: string, val: any) => onChange({ ...obj, [key]: val });

  return (
    <div className="space-y-3">
      {Object.entries(obj).map(([key, val]) => {
        const label = key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

        // Image URL fields
        if (key.includes("image_url") || key === "profile_image_url") {
          return (
            <div key={key} className="space-y-1.5">
              <Label className="text-portal-text-muted text-xs">{label}</Label>
              <div className="flex items-center gap-3">
                {val && (
                  <img
                    src={val}
                    alt=""
                    className="h-16 w-16 rounded-lg object-cover border border-portal-border"
                  />
                )}
                <label className="flex items-center gap-2 cursor-pointer rounded-lg border border-portal-border bg-portal-bg px-3 py-2 text-xs text-portal-text-muted hover:border-portal-accent/50 transition-colors">
                  {uploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                  {uploading ? "Uploading…" : "Upload"}
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) =>
                      e.target.files?.[0] &&
                      onImageUpload(e.target.files[0], (url) => set(key, url))
                    }
                  />
                </label>
                <Input
                  value={val ?? ""}
                  onChange={(e) => set(key, e.target.value || null)}
                  placeholder="https://…"
                  className="flex-1 bg-portal-bg border-portal-border text-portal-text text-xs"
                />
              </div>
            </div>
          );
        }

        // Nested arrays (like credentials, locations, story_paragraphs, project_types)
        if (Array.isArray(val)) {
          // Simple string array
          if (val.length === 0 || typeof val[0] === "string") {
            return (
              <div key={key} className="space-y-1.5">
                <Label className="text-portal-text-muted text-xs">{label}</Label>
                {val.map((item: string, i: number) => (
                  <div key={i} className="flex gap-2">
                    <Textarea
                      value={item}
                      onChange={(e) => {
                        const copy = [...val];
                        copy[i] = e.target.value;
                        set(key, copy);
                      }}
                      rows={2}
                      className="bg-portal-bg border-portal-border text-portal-text text-xs flex-1"
                    />
                    <button
                      onClick={() => set(key, val.filter((_: any, j: number) => j !== i))}
                      className="text-destructive hover:text-destructive/70 p-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => set(key, [...val, ""])}
                  className="flex items-center gap-1 text-xs text-portal-accent hover:underline"
                >
                  <Plus size={12} /> Add item
                </button>
              </div>
            );
          }

          // Array of objects
          return (
            <div key={key} className="space-y-2">
              <Label className="text-portal-text-muted text-xs">{label}</Label>
              <ArrayEditor
                items={val}
                onChange={(v) => set(key, v)}
                section={section}
                onImageUpload={onImageUpload}
                uploading={uploading}
              />
            </div>
          );
        }

        // Long text
        if (typeof val === "string" && (val.length > 80 || key.includes("bio") || key.includes("desc") || key.includes("text") || key.includes("quote"))) {
          return (
            <div key={key} className="space-y-1.5">
              <Label className="text-portal-text-muted text-xs">{label}</Label>
              <Textarea
                value={val}
                onChange={(e) => set(key, e.target.value)}
                rows={3}
                className="bg-portal-bg border-portal-border text-portal-text text-xs"
              />
            </div>
          );
        }

        // Number
        if (typeof val === "number") {
          return (
            <div key={key} className="space-y-1.5">
              <Label className="text-portal-text-muted text-xs">{label}</Label>
              <Input
                type="number"
                value={val}
                onChange={(e) => set(key, Number(e.target.value))}
                className="bg-portal-bg border-portal-border text-portal-text text-xs w-32"
              />
            </div>
          );
        }

        // Default string
        return (
          <div key={key} className="space-y-1.5">
            <Label className="text-portal-text-muted text-xs">{label}</Label>
            <Input
              value={val ?? ""}
              onChange={(e) => set(key, e.target.value)}
              className="bg-portal-bg border-portal-border text-portal-text text-xs"
            />
          </div>
        );
      })}
    </div>
  );
}

// ── Array Editor (list of objects) ──────────────────────────────

function ArrayEditor({
  items,
  onChange,
  section,
  onImageUpload,
  uploading,
}: {
  items: any[];
  onChange: (items: any[]) => void;
  section: string;
  onImageUpload: (file: File, cb: (url: string) => void) => void;
  uploading: boolean;
}) {
  const addItem = () => {
    if (items.length === 0) return;
    const template: Record<string, any> = {};
    Object.keys(items[0]).forEach((k) => {
      template[k] = typeof items[0][k] === "number" ? 0 : "";
    });
    onChange([...items, template]);
  };

  const removeItem = (i: number) => {
    onChange(items.filter((_, j) => j !== i));
  };

  const updateItem = (i: number, val: any) => {
    const copy = [...items];
    copy[i] = val;
    onChange(copy);
  };

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div
          key={i}
          className="rounded-lg border border-portal-border bg-portal-bg p-4 space-y-2 relative"
        >
          <button
            onClick={() => removeItem(i)}
            className="absolute top-2 right-2 text-destructive hover:text-destructive/70 p-1"
          >
            <Trash2 size={14} />
          </button>
          {typeof item === "object" && item !== null ? (
            <ObjectEditor
              obj={item}
              onChange={(v) => updateItem(i, v)}
              section={section}
              onImageUpload={onImageUpload}
              uploading={uploading}
            />
          ) : (
            <Input
              value={item}
              onChange={(e) => updateItem(i, e.target.value)}
              className="bg-portal-bg border-portal-border text-portal-text text-xs"
            />
          )}
        </div>
      ))}
      <button
        onClick={addItem}
        className="flex items-center gap-1 text-xs text-portal-accent hover:underline"
      >
        <Plus size={12} /> Add item
      </button>
    </div>
  );
}
