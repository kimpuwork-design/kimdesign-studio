import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PublicNav } from "@/components/PublicNav";
import { PublicFooter } from "@/components/PublicFooter";
import { supabase } from "@/integrations/supabase/client";
import { useSEO } from "@/hooks/useSEO";
import { FloatingChatButton } from "@/components/FloatingChatButton";
import { useTranslation } from "@/i18n/LanguageContext";
import { Search, Calendar, ArrowRight, Loader2, Sparkles, Tag } from "lucide-react";
import { format } from "date-fns";
import { FadeUp, StaggerContainer, StaggerItem, HoverCard } from "@/components/motion/MotionWrappers";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image_url: string | null;
  category: string | null;
  tags: string[];
  published_at: string | null;
  created_at: string;
}

const CATEGORIES = ["All", "News", "Insights", "Projects", "Tutorials", "Announcements"];

export default function PublicBlog() {
  useSEO({ title: "Blog", description: "Architecture insights, project updates, and industry news from our studio" });
  const { t } = useTranslation();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  useEffect(() => {
    supabase
      .from("blog_posts")
      .select("id, title, slug, excerpt, content, cover_image_url, category, tags, published_at, created_at")
      .eq("is_published", true)
      .order("published_at", { ascending: false })
      .then(({ data }) => {
        setPosts((data as BlogPost[]) ?? []);
        setLoading(false);
      });
  }, []);

  const filtered = posts.filter((p) => {
    if (category !== "All" && p.category?.toLowerCase() !== category.toLowerCase()) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return p.title.toLowerCase().includes(q) || p.excerpt.toLowerCase().includes(q) || p.tags.some((t) => t.toLowerCase().includes(q));
    }
    return true;
  });

  return (
    <div className="bg-background min-h-screen relative">
      <PublicNav />

      {/* Ambient */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-1/4 -right-40 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[150px] animate-float" />
        <div className="absolute bottom-1/3 -left-32 w-[400px] h-[400px] rounded-full bg-primary/[0.03] blur-[120px] animate-float-delayed" />
      </div>

      {/* Hero */}
      <section className="container pt-20 pb-10 relative z-10">
        <FadeUp>
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-4 py-2 mb-6">
            <Sparkles size={12} className="text-primary" />
            <p className="text-xs font-semibold tracking-[0.15em] uppercase text-primary">Blog & Insights</p>
          </div>
        </FadeUp>
        <FadeUp delay={0.1}>
          <h1 className="font-display text-[clamp(2.5rem,6vw,5.5rem)] font-bold text-foreground leading-tight tracking-tight">
            Blog
          </h1>
        </FadeUp>
        <FadeUp delay={0.2}>
          <p className="mt-4 text-muted-foreground font-light max-w-lg leading-relaxed">
            Architecture insights, project updates, and industry news from our studio.
          </p>
        </FadeUp>
      </section>

      {/* Filters */}
      <section className="sticky top-16 z-30 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="container py-3 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search articles…"
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-border/50 bg-background/60 backdrop-blur-sm text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="flex gap-2 flex-wrap items-center">
            {CATEGORIES.map((c) => (
              <button key={c} onClick={() => setCategory(c)}
                className={`px-4 py-1.5 rounded-full text-xs tracking-[0.1em] uppercase font-medium transition-all duration-200 ${
                  category === c
                    ? "bg-primary text-primary-foreground shadow-[0_0_12px_rgba(var(--primary),0.3)]"
                    : "bg-secondary/50 backdrop-blur-sm text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}>
                {c}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Posts grid */}
      <div className="container py-12 relative z-10">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={28} className="animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <FadeUp>
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <Tag size={48} className="text-muted-foreground/20 mb-4" />
              <h3 className="font-display text-2xl font-bold text-foreground">No articles found</h3>
              <p className="mt-2 text-muted-foreground text-sm">Try adjusting your search or filters.</p>
            </div>
          </FadeUp>
        ) : (
          <StaggerContainer className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((post) => (
              <StaggerItem key={post.id}>
                <HoverCard>
                  <Link to={`/blog/${post.slug}`}
                    className="group block overflow-hidden rounded-2xl border border-border/30 bg-background/60 backdrop-blur-sm hover:border-primary/30 hover:shadow-[0_0_30px_rgba(var(--primary),0.08)] transition-all duration-300">
                    <div className="overflow-hidden aspect-[16/10]">
                      {post.cover_image_url ? (
                        <img src={post.cover_image_url} alt={post.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <Sparkles size={32} className="text-muted-foreground/20" />
                        </div>
                      )}
                    </div>
                    <div className="p-5">
                      <div className="flex items-center gap-2 mb-3">
                        {post.category && (
                          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] tracking-wide uppercase font-semibold text-primary">
                            {post.category}
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Calendar size={10} />
                          {format(new Date(post.published_at || post.created_at), "MMM d, yyyy")}
                        </span>
                      </div>
                      <h3 className="font-display text-lg font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-2">
                        {post.title}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">{post.excerpt}</p>
                      <div className="mt-4 flex items-center gap-1 text-xs font-medium text-primary">
                        {t("common_read_more")} <ArrowRight size={12} />
                      </div>
                    </div>
                  </Link>
                </HoverCard>
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}
      </div>

      <PublicFooter />
      <FloatingChatButton />
    </div>
  );
}
