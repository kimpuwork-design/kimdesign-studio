import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { PublicNav } from "@/components/PublicNav";
import { PublicFooter } from "@/components/PublicFooter";
import { supabase } from "@/integrations/supabase/client";
import { useSEO } from "@/hooks/useSEO";
import { useTranslation } from "@/i18n/LanguageContext";
import { Calendar, ArrowLeft, Tag, User, Loader2 } from "lucide-react";
import { format } from "date-fns";

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
  author_id: string | null;
}

export default function PublicBlogDetail() {
  const { slug } = useParams();
  const { t } = useTranslation();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [authorName, setAuthorName] = useState<string | null>(null);
  const [related, setRelated] = useState<BlogPost[]>([]);

  useSEO({
    title: post?.title ?? t("blog_title"),
    description: post?.excerpt ?? t("blog_description"),
    ogImage: post?.cover_image_url ?? undefined,
    ogType: "article",
  });

  useEffect(() => {
    if (!slug) return;
    supabase
      .from("blog_posts").select("*").eq("slug", slug).eq("is_published", true).single()
      .then(async ({ data, error }) => {
        if (error || !data) { setLoading(false); return; }
        setPost(data as BlogPost);
        if (data.author_id) {
          const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", data.author_id).single();
          setAuthorName(profile?.full_name ?? null);
        }
        const { data: relatedData } = await supabase
          .from("blog_posts").select("id, title, slug, excerpt, cover_image_url, category, tags, published_at, created_at, content")
          .eq("is_published", true).neq("id", data.id).order("published_at", { ascending: false }).limit(3);
        setRelated((relatedData as BlogPost[]) ?? []);
        setLoading(false);
      });
  }, [slug]);

  if (loading) {
    return (
      <div className="bg-background min-h-screen">
        <PublicNav />
        <div className="flex justify-center py-40"><Loader2 size={28} className="animate-spin text-muted-foreground" /></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="bg-background min-h-screen">
        <PublicNav />
        <div className="container py-40 text-center">
          <h1 className="font-display text-4xl font-bold text-foreground mb-4">{t("blog_post_not_found")}</h1>
          <Link to="/blog" className="text-primary hover:underline">← {t("blog_back")}</Link>
        </div>
        <PublicFooter />
      </div>
    );
  }

  const dateStr = format(new Date(post.published_at || post.created_at), "MMMM d, yyyy");

  const renderContent = (content: string) => {
    return content.split("\n\n").map((block, i) => {
      if (block.startsWith("### ")) return <h3 key={i} className="font-display text-xl font-semibold text-foreground mt-8 mb-3">{block.slice(4)}</h3>;
      if (block.startsWith("## ")) return <h2 key={i} className="font-display text-2xl font-bold text-foreground mt-10 mb-4">{block.slice(3)}</h2>;
      if (block.startsWith("# ")) return <h1 key={i} className="font-display text-3xl font-bold text-foreground mt-10 mb-4">{block.slice(2)}</h1>;
      if (block.startsWith("- ")) {
        const items = block.split("\n").filter(l => l.startsWith("- "));
        return <ul key={i} className="list-disc pl-6 space-y-1 text-muted-foreground leading-relaxed">{items.map((item, j) => <li key={j}>{item.slice(2)}</li>)}</ul>;
      }
      if (block.startsWith("> ")) return <blockquote key={i} className="border-l-4 border-primary/30 pl-4 italic text-muted-foreground my-6">{block.slice(2)}</blockquote>;
      return <p key={i} className="text-muted-foreground leading-relaxed">{block}</p>;
    });
  };

  return (
    <div className="bg-background min-h-screen relative">
      <PublicNav />

      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-1/4 -right-40 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[150px]" />
      </div>

      <section className="relative z-10">
        {post.cover_image_url && (
          <div className="w-full h-[40vh] md:h-[50vh] overflow-hidden relative">
            <img src={post.cover_image_url} alt={post.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
          </div>
        )}
        <div className="container relative z-10 -mt-20 pb-8">
          <Link to="/blog" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft size={12} /> {t("blog_back")}
          </Link>
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            {post.category && (
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs tracking-wide uppercase font-semibold text-primary">{post.category}</span>
            )}
            <span className="flex items-center gap-1 text-xs text-muted-foreground"><Calendar size={12} />{dateStr}</span>
            {authorName && <span className="flex items-center gap-1 text-xs text-muted-foreground"><User size={12} />{authorName}</span>}
          </div>
          <h1 className="font-display text-[clamp(2rem,5vw,4rem)] font-bold text-foreground leading-tight tracking-tight max-w-3xl">{post.title}</h1>
          {post.excerpt && <p className="mt-4 text-lg text-muted-foreground font-light max-w-2xl leading-relaxed">{post.excerpt}</p>}
        </div>
      </section>

      <article className="container relative z-10 pb-20">
        <div className="max-w-3xl space-y-4">{renderContent(post.content)}</div>
        {post.tags.length > 0 && (
          <div className="max-w-3xl mt-12 pt-8 border-t border-border/50 flex items-center gap-2 flex-wrap">
            <Tag size={14} className="text-muted-foreground" />
            {post.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-secondary/80 px-3 py-1 text-xs tracking-wide text-muted-foreground">{tag}</span>
            ))}
          </div>
        )}
      </article>

      {related.length > 0 && (
        <section className="border-t border-border/50 py-16 relative z-10">
          <div className="container">
            <h2 className="font-display text-2xl font-bold text-foreground mb-8">{t("blog_more_articles")}</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((r) => (
                <Link key={r.id} to={`/blog/${r.slug}`} className="group block rounded-2xl border border-border/30 bg-background/60 hover:border-primary/30 transition-all overflow-hidden">
                  {r.cover_image_url ? (
                    <img src={r.cover_image_url} alt={r.title} loading="lazy" className="w-full aspect-[16/10] object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full aspect-[16/10] bg-muted" />
                  )}
                  <div className="p-4">
                    <h3 className="font-display text-base font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">{r.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{r.excerpt}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <PublicFooter />
    </div>
  );
}
