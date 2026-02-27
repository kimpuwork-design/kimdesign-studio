import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PortalLayout } from "@/components/PortalLayout";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Search, Pencil, Trash2, Eye, EyeOff, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string | null;
  tags: string[];
  cover_image_url: string | null;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export default function AdminBlog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchPosts = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("blog_posts")
      .select("id, title, slug, excerpt, category, tags, cover_image_url, is_published, published_at, created_at, updated_at")
      .order("created_at", { ascending: false });
    setPosts((data as BlogPost[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchPosts(); }, []);

  const togglePublish = async (post: BlogPost) => {
    const newStatus = !post.is_published;
    const updates: any = { is_published: newStatus };
    if (newStatus && !post.published_at) updates.published_at = new Date().toISOString();
    await supabase.from("blog_posts").update(updates).eq("id", post.id);
    toast({ title: newStatus ? "Published" : "Unpublished" });
    fetchPosts();
  };

  const deletePost = async (id: string) => {
    if (!confirm("Delete this blog post?")) return;
    await supabase.from("blog_posts").delete().eq("id", id);
    toast({ title: "Post deleted" });
    fetchPosts();
  };

  const filtered = posts.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return p.title.toLowerCase().includes(q) || p.excerpt.toLowerCase().includes(q);
  });

  return (
    <PortalLayout variant="admin">
      <PageHeader title="Blog" subtitle="Manage blog posts and articles"
        action={<Button asChild className="rounded-2xl"><Link to="/admin/blog/new"><Plus size={16} className="mr-2" /> New Post</Link></Button>}
      />

      <div className="mb-6">
        <div className="relative max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search posts…" className="pl-9 rounded-xl"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 size={24} className="animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-muted-foreground">No blog posts yet.</p>
          <Button asChild className="mt-4 rounded-2xl">
            <Link to="/admin/blog/new"><Plus size={16} className="mr-2" /> Create First Post</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((post) => (
            <div key={post.id} className="flex items-center gap-4 rounded-2xl border border-border/50 bg-background/60 backdrop-blur-sm p-4 hover:border-primary/30 transition-all">
              {post.cover_image_url ? (
                <img src={post.cover_image_url} alt="" className="h-16 w-24 rounded-xl object-cover shrink-0" />
              ) : (
                <div className="h-16 w-24 rounded-xl bg-muted shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Link to={`/admin/blog/${post.id}`} className="font-display text-base font-semibold text-foreground hover:text-primary transition-colors truncate">
                    {post.title}
                  </Link>
                  <Badge variant={post.is_published ? "default" : "secondary"} className="text-[10px] shrink-0">
                    {post.is_published ? "Published" : "Draft"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground truncate">{post.excerpt}</p>
                <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                  {post.category && <span className="uppercase tracking-wider">{post.category}</span>}
                  <span>{format(new Date(post.created_at), "MMM d, yyyy")}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => togglePublish(post)} className="rounded-lg p-2 text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all" title={post.is_published ? "Unpublish" : "Publish"}>
                  {post.is_published ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
                <Link to={`/admin/blog/${post.id}`} className="rounded-lg p-2 text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all">
                  <Pencil size={15} />
                </Link>
                <button onClick={() => deletePost(post.id)} className="rounded-lg p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </PortalLayout>
  );
}
