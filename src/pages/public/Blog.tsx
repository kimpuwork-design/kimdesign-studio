import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PublicNav } from "@/components/PublicNav";
import { PublicFooter } from "@/components/PublicFooter";
import { supabase } from "@/integrations/supabase/client";
import { useSEO } from "@/hooks/useSEO";
import { FloatingChatButton } from "@/components/FloatingChatButton";
import { useTranslation } from "@/i18n/LanguageContext";
import { Search, Calendar, ArrowRight, Loader2, Tag } from "lucide-react";
import { format } from "date-fns";
import { FadeUp, StaggerContainer, StaggerItem, TextReveal } from "@/components/motion/MotionWrappers";
import { motion } from "framer-motion";

const luxuryEase = [0.22, 1, 0.36, 1] as const;

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
  const { t } = useTranslation();
  useSEO({ title: t("blog_title"), description: t("blog_description") });
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
      return p.title.toLowerCase().includes(q) || p.excerpt.toLowerCase().includes(q) || p.tags.some((tg) => tg.toLowerCase().includes(q));
    }
    return true;
  });

  return (
    <div className="bg-background min-h-screen relative overflow-x-hidden">
      <PublicNav />

      {/* ── Hero ── */}
      <section className="container py-20 md:py-32 lg:py-40 relative z-10">
        <div className="max-w-4xl">
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: luxuryEase }}
            className="text-[10px] tracking-[0.35em] uppercase text-primary mb-8"
          >
            {t("blog_insights_badge")}
          </motion.p>
          <TextReveal>
            <h1 className="font-display text-[clamp(2.5rem,7vw,7rem)] leading-[0.95] text-foreground">
              {t("blog_title")}
            </h1>
          </TextReveal>
          <FadeUp delay={0.3}>
            <p className="mt-8 text-lg text-muted-foreground font-light max-w-lg leading-relaxed">
              {t("blog_description")}
            </p>
          </FadeUp>
        </div>
      </section>

      {/* ── Filters ── */}
      <section className="sticky top-16 z-30 bg-background/80 backdrop-blur-xl border-t border-b border-border/30">
        <div className="container py-3 md:py-3.5 flex flex-col sm:flex-row gap-2.5 md:gap-4">
          <div className="relative flex-1 sm:max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder={t("blog_search")}
              className="w-full pl-9 pr-3 py-2 border border-border/50 bg-background/60 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 transition-colors" />
          </div>
          <div className="flex gap-1.5 overflow-x-auto scrollbar-none items-center pb-0.5">
            {CATEGORIES.map((c) => (
              <button key={c} onClick={() => setCategory(c)}
                className={`px-3 md:px-3.5 py-1.5 text-[10px] tracking-[0.12em] uppercase font-medium transition-all duration-300 whitespace-nowrap shrink-0 ${
                  category === c
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
                }`}>
                {c === "All" ? t("portfolio_all") : c}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Posts ── */}
      <div className="container py-12 md:py-16 relative z-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}>
              <Loader2 size={24} className="text-muted-foreground" />
            </motion.div>
            <p className="text-xs text-muted-foreground tracking-[0.15em] uppercase">Loading</p>
          </div>
        ) : filtered.length === 0 ? (
          <FadeUp>
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <Tag size={32} className="text-muted-foreground/20 mb-4" />
              <h3 className="font-display text-2xl text-foreground">{t("blog_no_articles")}</h3>
              <p className="mt-2 text-muted-foreground text-sm">{t("blog_no_articles_hint")}</p>
            </div>
          </FadeUp>
        ) : (
          <StaggerContainer className="grid gap-8 md:gap-10 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" staggerDelay={0.08}>
            {filtered.map((post) => (
              <StaggerItem key={post.id}>
                <Link to={`/blog/${post.slug}`} className="group block">
                  {/* Image */}
                  <div className="overflow-hidden aspect-[16/10] mb-5">
                    {post.cover_image_url ? (
                      <img src={post.cover_image_url} alt={post.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-[900ms]" />
                    ) : (
                      <div className="w-full h-full bg-muted/30" />
                    )}
                  </div>

                  {/* Meta */}
                  <div className="flex items-center gap-3 mb-3">
                    {post.category && (
                      <span className="text-[9px] tracking-[0.2em] uppercase font-medium text-primary">{post.category}</span>
                    )}
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Calendar size={10} />
                      {format(new Date(post.published_at || post.created_at), "MMM d, yyyy")}
                    </span>
                  </div>

                  {/* Title & excerpt */}
                  <h3 className="font-display text-xl md:text-2xl text-foreground group-hover:text-primary transition-colors duration-300 leading-tight line-clamp-2 mb-3">
                    {post.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-[1.7] line-clamp-3">{post.excerpt}</p>

                  {/* Read more */}
                  <div className="mt-4 flex items-center gap-1.5 text-xs text-primary tracking-[0.1em] uppercase group-hover:gap-2.5 transition-all duration-300">
                    {t("common_read_more")} <ArrowRight size={12} />
                  </div>
                </Link>
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
