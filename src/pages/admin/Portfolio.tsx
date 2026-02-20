import { useCallback, useEffect, useState } from "react";
import { PortalLayout } from "@/components/PortalLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { PortfolioItem } from "@/lib/portfolio";
import { writeAuditLog } from "@/lib/audit";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import {
  Plus, Search, Eye, EyeOff, Star, Pencil, Trash2,
  Loader2, Image, ExternalLink,
} from "lucide-react";

type Filter = "all" | "published" | "unpublished" | "featured";

export default function AdminPortfolio() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [toggling, setToggling] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("portfolio_items")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast({ title: "Error loading portfolio", description: error.message, variant: "destructive" });
    else setItems((data as PortfolioItem[]) ?? []);
    setLoading(false);
  }, [toast]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleTogglePublish = async (item: PortfolioItem) => {
    if (!profile) return;
    setToggling(item.id);
    const newVal = !item.is_published;
    const { error } = await supabase.from("portfolio_items").update({ is_published: newVal }).eq("id", item.id);
    if (error) { toast({ title: "Update failed", variant: "destructive" }); }
    else {
      await writeAuditLog({ actor_id: profile.id, action: newVal ? "portfolio_published" : "portfolio_unpublished", entity_type: "portfolio", entity_id: item.id, metadata: { title: item.title } });
      toast({ title: newVal ? "Published" : "Unpublished" });
      fetchItems();
    }
    setToggling(null);
  };

  const handleToggleFeatured = async (item: PortfolioItem) => {
    setToggling(item.id + "_feat");
    const { error } = await supabase.from("portfolio_items").update({ is_featured: !item.is_featured }).eq("id", item.id);
    if (!error) fetchItems();
    setToggling(null);
  };

  const handleDuplicate = async (item: PortfolioItem) => {
    if (!profile) return;
    const base = item.slug + "-copy";
    let slug = base;
    let i = 2;
    // ensure unique slug
    while (true) {
      const { data } = await supabase.from("portfolio_items").select("id").eq("slug", slug).maybeSingle();
      if (!data) break;
      slug = `${base}-${i++}`;
    }
    const { error } = await supabase.from("portfolio_items").insert({
      slug,
      title: item.title + " (Copy)",
      summary: item.summary,
      content: item.content,
      cover_image_url: item.cover_image_url,
      tags: item.tags,
      category: item.category,
      location: item.location,
      year: item.year,
      is_featured: false,
      is_published: false,
    });
    if (error) { toast({ title: "Duplicate failed", variant: "destructive" }); }
    else { toast({ title: "Duplicated as draft" }); fetchItems(); }
  };

  const handleDelete = async (item: PortfolioItem) => {
    if (!confirm(`Delete "${item.title}"? This cannot be undone.`)) return;
    if (!profile) return;
    setDeleting(item.id);
    const { error } = await supabase.from("portfolio_items").delete().eq("id", item.id);
    if (error) { toast({ title: "Delete failed", description: error.message, variant: "destructive" }); }
    else {
      await writeAuditLog({ actor_id: profile.id, action: "portfolio_deleted", entity_type: "portfolio", entity_id: item.id, metadata: { title: item.title } });
      toast({ title: "Deleted" });
      fetchItems();
    }
    setDeleting(null);
  };

  const filtered = items.filter((item) => {
    if (filter === "published" && !item.is_published) return false;
    if (filter === "unpublished" && item.is_published) return false;
    if (filter === "featured" && !item.is_featured) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return item.title.toLowerCase().includes(q) || item.slug.toLowerCase().includes(q);
    }
    return true;
  });

  const FILTERS: { value: Filter; label: string }[] = [
    { value: "all", label: `All (${items.length})` },
    { value: "published", label: `Published (${items.filter((i) => i.is_published).length})` },
    { value: "unpublished", label: `Drafts (${items.filter((i) => !i.is_published).length})` },
    { value: "featured", label: `Featured (${items.filter((i) => i.is_featured).length})` },
  ];

  return (
    <PortalLayout variant="admin">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-portal-text">Portfolio CMS</h1>
          <p className="mt-1 text-portal-text-muted text-sm">Manage public portfolio items.</p>
        </div>
        <Button onClick={() => navigate("/admin/portfolio/new")} className="gap-2">
          <Plus size={15} />New Item
        </Button>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-portal-text-muted" />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title or slug…"
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-portal-border bg-portal-bg text-sm text-portal-text placeholder:text-portal-text-muted focus:outline-none focus:ring-2 focus:ring-portal-accent/50"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {FILTERS.map((f) => (
            <button key={f.value} onClick={() => setFilter(f.value)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${filter === f.value ? "bg-portal-accent text-white" : "bg-portal-border text-portal-text-muted hover:text-portal-text"}`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={22} className="animate-spin text-portal-text-muted" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border border-portal-border bg-portal-surface">
          <Image size={40} className="text-portal-text-muted/30 mb-3" />
          <p className="font-medium text-portal-text">No portfolio items</p>
          <p className="text-sm text-portal-text-muted mt-1">Create your first item to get started.</p>
          <Button className="mt-4" onClick={() => navigate("/admin/portfolio/new")}><Plus size={14} className="mr-1.5" />New Item</Button>
        </div>
      ) : (
        <div className="rounded-xl border border-portal-border bg-portal-surface overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-portal-border bg-portal-bg">
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-portal-text-muted">Item</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-portal-text-muted hidden md:table-cell">Category</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-portal-text-muted hidden lg:table-cell">Updated</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-portal-text-muted">Status</th>
                <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-portal-text-muted">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, i) => (
                <tr key={item.id} className={`border-b border-portal-border hover:bg-portal-bg transition-colors ${i === filtered.length - 1 ? "border-none" : ""}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {item.cover_image_url ? (
                        <img src={item.cover_image_url} alt="" className="h-10 w-14 rounded object-cover shrink-0 bg-portal-border" loading="lazy" />
                      ) : (
                        <div className="h-10 w-14 rounded bg-portal-border flex items-center justify-center shrink-0">
                          <Image size={14} className="text-portal-text-muted" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-portal-text">{item.title}</p>
                        <p className="text-xs text-portal-text-muted">{item.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-portal-text-muted hidden md:table-cell">{item.category ?? "—"}</td>
                  <td className="px-4 py-3 text-portal-text-muted text-xs hidden lg:table-cell">{new Date(item.updated_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${item.is_published ? "bg-green-500/15 text-green-500" : "bg-portal-border text-portal-text-muted"}`}>
                        {item.is_published ? "Published" : "Draft"}
                      </span>
                      {item.is_featured && <Star size={12} className="text-yellow-400 fill-yellow-400" />}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <a href={`/portfolio/${item.slug}`} target="_blank" rel="noreferrer"
                        className="rounded p-1.5 text-portal-text-muted hover:text-portal-text hover:bg-portal-border transition-colors" title="View public">
                        <ExternalLink size={13} />
                      </a>
                      <button onClick={() => handleToggleFeatured(item)} title="Toggle featured"
                        className={`rounded p-1.5 transition-colors ${item.is_featured ? "text-yellow-400 hover:text-yellow-300" : "text-portal-text-muted hover:text-portal-text"} hover:bg-portal-border`}
                        disabled={toggling === item.id + "_feat"}>
                        <Star size={13} />
                      </button>
                      <button onClick={() => handleTogglePublish(item)} title={item.is_published ? "Unpublish" : "Publish"}
                        className="rounded p-1.5 text-portal-text-muted hover:text-portal-text hover:bg-portal-border transition-colors"
                        disabled={toggling === item.id}>
                        {toggling === item.id ? <Loader2 size={13} className="animate-spin" /> : item.is_published ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                      <button onClick={() => navigate(`/admin/portfolio/${item.id}`)} title="Edit"
                        className="rounded p-1.5 text-portal-text-muted hover:text-portal-text hover:bg-portal-border transition-colors">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => handleDuplicate(item)} title="Duplicate"
                        className="rounded p-1.5 text-portal-text-muted hover:text-portal-text hover:bg-portal-border transition-colors text-xs font-mono">
                        ⎘
                      </button>
                      <button onClick={() => handleDelete(item)} title="Delete"
                        className="rounded p-1.5 text-portal-text-muted hover:text-destructive hover:bg-destructive/10 transition-colors"
                        disabled={deleting === item.id}>
                        {deleting === item.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PortalLayout>
  );
}
