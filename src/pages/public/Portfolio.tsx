import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { PublicNav } from "@/components/PublicNav";
import { PublicFooter } from "@/components/PublicFooter";
import { supabase } from "@/integrations/supabase/client";
import { useSEO } from "@/hooks/useSEO";
import { FloatingChatButton } from "@/components/FloatingChatButton";
import { useTranslation } from "@/i18n/LanguageContext";
import { Search, MapPin, Calendar, Grid3X3, Star, Loader2, ArrowRight, ArrowUpRight, Sparkles, LayoutGrid, Rows3 } from "lucide-react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { FadeUp } from "@/components/motion/MotionWrappers";

const CATEGORIES = ["All", "Residential", "Cultural", "Commercial", "Interior", "Landscape", "Civic", "Mixed-Use"];

interface ProjectPortfolioItem {
  id: string;
  title: string;
  slug: string | null;
  summary: string | null;
  description: string | null;
  thumbnail_url: string | null;
  category: string | null;
  location: string | null;
  year: number | null;
  tags: string[];
  is_featured: boolean;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

/* ─── Bento Card ─── */
function BentoCard({ item, size = "normal", index, t }: { item: ProjectPortfolioItem; size?: "hero" | "tall" | "wide" | "normal"; index: number; t: (k: string) => string }) {
  const linkTo = item.slug ? `/portfolio/${item.slug}` : `/projects/${item.id}`;
  const coverUrl = item.thumbnail_url;

  const aspectMap = {
    hero: "aspect-[16/10] md:aspect-[16/9]",
    tall: "aspect-[3/4]",
    wide: "aspect-[16/9]",
    normal: "aspect-[4/3]",
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.5, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link to={linkTo} className="group block relative overflow-hidden rounded-2xl">
        <div className={`${aspectMap[size]} overflow-hidden relative`}>
          {coverUrl ? (
            <img src={coverUrl} alt={item.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-[1.06] transition-transform duration-[800ms] ease-out" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted/50">
              <Grid3X3 size={40} className="text-muted-foreground/20" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-90 transition-opacity duration-500" />
          {item.is_featured && (
            <div className="absolute top-4 left-4 flex items-center gap-1.5 rounded-full bg-primary/90 backdrop-blur-md px-3 py-1.5 text-[10px] font-semibold text-primary-foreground tracking-[0.1em] uppercase">
              <Star size={10} className="fill-current" /> {t("portfolio_featured_badge")}
            </div>
          )}
          <div className="absolute top-4 right-4 h-9 w-9 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
            <ArrowUpRight size={14} className="text-white" />
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
            {item.category && (
              <span className="inline-block rounded-full bg-white/10 backdrop-blur-md border border-white/10 px-3 py-1 text-[10px] tracking-[0.15em] uppercase font-medium text-white/80 mb-3">
                {item.category}
              </span>
            )}
            <h3 className={`font-display font-bold text-white drop-shadow-lg leading-tight ${size === "hero" ? "text-2xl md:text-4xl" : size === "tall" || size === "wide" ? "text-xl md:text-2xl" : "text-lg md:text-xl"}`}>
              {item.title}
            </h3>
            <div className="mt-2 flex items-center gap-3 text-xs text-white/60">
              {item.location && <span className="flex items-center gap-1"><MapPin size={10} />{item.location}</span>}
              {item.year && <span className="flex items-center gap-1"><Calendar size={10} />{item.year}</span>}
            </div>
            <p className="mt-3 text-white/60 text-sm leading-relaxed line-clamp-2 max-h-0 group-hover:max-h-16 overflow-hidden transition-all duration-500">
              {item.summary || item.description}
            </p>
            {item.tags && item.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                {item.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="rounded-full bg-white/5 border border-white/10 px-2.5 py-0.5 text-[10px] tracking-wide text-white/50">{tag}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

/* ─── List Card ─── */
function ListCard({ item, index }: { item: ProjectPortfolioItem; index: number }) {
  const linkTo = item.slug ? `/portfolio/${item.slug}` : `/projects/${item.id}`;

  return (
    <motion.div layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.4, delay: index * 0.04 }}>
      <Link to={linkTo} className="group flex items-center gap-6 py-5 px-2 border-b border-border/30 hover:bg-muted/30 rounded-xl transition-all duration-200 -mx-2">
        {item.thumbnail_url && (
          <div className="shrink-0 w-28 h-20 rounded-xl overflow-hidden">
            <img src={item.thumbnail_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {item.is_featured && <Star size={10} className="text-primary fill-primary shrink-0" />}
            {item.category && <span className="text-[10px] tracking-[0.15em] uppercase font-medium text-primary">{item.category}</span>}
          </div>
          <h3 className="font-display text-lg font-bold text-foreground group-hover:text-primary transition-colors truncate">{item.title}</h3>
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            {item.location && <span className="flex items-center gap-1"><MapPin size={10} />{item.location}</span>}
            {item.year && <span className="flex items-center gap-1"><Calendar size={10} />{item.year}</span>}
          </div>
        </div>
        <ArrowRight size={16} className="text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
      </Link>
    </motion.div>
  );
}

export default function PublicPortfolio() {
  const { t } = useTranslation();
  useSEO({ title: t("portfolio_title"), description: t("portfolio_description") });
  const [items, setItems] = useState<ProjectPortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const PAGE_SIZE = 12;

  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  useEffect(() => {
    setLoading(true);
    supabase
      .from("projects")
      .select("id, title, slug, summary, description, thumbnail_url, category, location, year, tags, is_featured, is_public, created_at, updated_at")
      .eq("is_public", true)
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setItems((data as ProjectPortfolioItem[]) ?? []);
        setLoading(false);
      });
  }, []);

  const filtered = items.filter((item) => {
    if (category !== "All" && item.category !== category) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        (item.summary ?? "").toLowerCase().includes(q) ||
        item.location?.toLowerCase().includes(q) ||
        item.tags?.some((tg) => tg.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const featured = filtered.filter((i) => i.is_featured);
  const rest = filtered.filter((i) => !i.is_featured);
  const allForDisplay = [...featured, ...rest];
  const paginated = allForDisplay.slice(0, page * PAGE_SIZE);
  const hasMore = allForDisplay.length > paginated.length;

  const getBentoSize = (index: number): "hero" | "tall" | "wide" | "normal" => {
    if (index === 0) return "hero";
    if (index === 1 || index === 2) return "tall";
    if (index === 5 || index === 9) return "wide";
    return "normal";
  };

  const getBentoSpan = (index: number): string => {
    if (index === 0) return "md:col-span-2 md:row-span-1";
    if (index === 5 || index === 9) return "md:col-span-2";
    return "";
  };

  return (
    <div className="bg-background min-h-screen relative">
      <PublicNav />

      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-1/4 -right-40 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[150px] animate-float" />
        <div className="absolute bottom-1/3 -left-32 w-[400px] h-[400px] rounded-full bg-primary/[0.03] blur-[120px] animate-float-delayed" />
      </div>

      {/* ── Cinematic Hero ── */}
      <div ref={heroRef} className="relative overflow-hidden">
        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="relative z-10">
          <section className="container pt-20 pb-10 md:pt-28 md:pb-16">
            <div className="max-w-3xl">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
                className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-3 md:px-4 py-1.5 md:py-2 mb-5 md:mb-8">
                <Sparkles size={11} className="text-primary shrink-0" />
                <p className="text-[10px] md:text-xs font-semibold tracking-[0.12em] md:tracking-[0.15em] uppercase text-primary">{t("portfolio_selected_work")}</p>
              </motion.div>

              <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="font-display text-[clamp(2.5rem,8vw,6.5rem)] font-bold text-foreground leading-[0.95] tracking-tight">
                {t("portfolio_our")}<br />
                <span className="text-primary">{t("portfolio_title")}</span>
              </motion.h1>

              <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }}
                className="mt-4 md:mt-6 text-muted-foreground font-light max-w-lg leading-relaxed text-base md:text-lg">
                {t("portfolio_description")}
              </motion.p>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.55 }}
                className="mt-6 md:mt-10 flex items-center gap-5 md:gap-8 overflow-x-auto pb-2 scrollbar-none">
                {[
                  { n: items.length, label: t("portfolio_projects_stat") },
                  { n: items.filter(i => i.is_featured).length, label: t("portfolio_featured_stat") },
                  { n: new Set(items.map(i => i.category).filter(Boolean)).size, label: t("portfolio_categories_stat") },
                ].map((stat) => (
                  <div key={stat.label} className="shrink-0">
                    <p className="font-display text-2xl md:text-3xl font-bold text-foreground">{stat.n}</p>
                    <p className="text-[9px] md:text-[10px] tracking-[0.2em] uppercase text-muted-foreground mt-1">{stat.label}</p>
                  </div>
                ))}
              </motion.div>
            </div>
          </section>
        </motion.div>
        <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 1, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent origin-left" />
      </div>

      {/* ── Sticky Filters ── */}
      <section className="sticky top-16 z-30 bg-background/80 backdrop-blur-xl border-b border-border/30">
        <div className="container py-2.5 md:py-3 flex flex-col gap-2.5 md:flex-row md:gap-3 md:items-center">
          <div className="relative flex-1 max-w-full md:max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder={t("portfolio_search")}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-border/50 bg-background/60 backdrop-blur-sm text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all" />
          </div>
          <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-0.5 md:pb-0 items-center flex-1">
            {CATEGORIES.map((c) => (
              <button key={c} onClick={() => { setCategory(c); setPage(1); }}
                className={`px-3 md:px-3.5 py-1.5 rounded-full text-[10px] tracking-[0.1em] uppercase font-medium transition-all duration-200 whitespace-nowrap shrink-0 ${
                  category === c ? "bg-primary text-primary-foreground shadow-[0_0_12px_rgba(var(--primary),0.3)]" : "bg-secondary/30 text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                }`}>
                {c === "All" ? t("portfolio_all") : c}
              </button>
            ))}
          </div>
          <div className="hidden md:flex items-center gap-1 rounded-xl border border-border/40 bg-background/40 p-1">
            <button onClick={() => setViewMode("grid")} className={`p-1.5 rounded-lg transition-all ${viewMode === "grid" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}>
              <LayoutGrid size={15} />
            </button>
            <button onClick={() => setViewMode("list")} className={`p-1.5 rounded-lg transition-all ${viewMode === "list" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}>
              <Rows3 size={15} />
            </button>
          </div>
        </div>
      </section>

      {/* ── Content ── */}
      <div className="container py-12 md:py-16 relative z-10 min-h-[60vh]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 size={28} className="animate-spin text-muted-foreground" />
            <p className="text-xs text-muted-foreground tracking-wide">{t("portfolio_loading")}</p>
          </div>
        ) : filtered.length === 0 ? (
          <FadeUp>
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="h-20 w-20 rounded-2xl bg-muted/50 flex items-center justify-center mb-6">
                <Grid3X3 size={32} className="text-muted-foreground/30" />
              </div>
              <h3 className="font-display text-2xl font-bold text-foreground">{t("portfolio_no_projects")}</h3>
              <p className="mt-2 text-muted-foreground text-sm max-w-xs">{t("portfolio_no_found_hint")}</p>
              <button onClick={() => { setSearch(""); setCategory("All"); }}
                className="mt-6 text-xs text-primary hover:underline tracking-wide uppercase font-medium">
                {t("portfolio_clear_filters")}
              </button>
            </div>
          </FadeUp>
        ) : (
          <>
            <div className="flex items-center justify-between mb-8">
              <p className="text-xs text-muted-foreground tracking-wide">
                {t("portfolio_showing")} <span className="text-foreground font-medium">{paginated.length}</span> {t("portfolio_of")}{" "}
                <span className="text-foreground font-medium">{allForDisplay.length}</span> {t("portfolio_projects_label")}
              </p>
            </div>

            <AnimatePresence mode="wait">
              {viewMode === "grid" ? (
                <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
                  className="grid gap-4 md:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {paginated.map((item, i) => (
                    <div key={item.id} className={getBentoSpan(i)}>
                      <BentoCard item={item} size={getBentoSize(i)} index={i} t={t} />
                    </div>
                  ))}
                </motion.div>
              ) : (
                <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="max-w-3xl">
                  {paginated.map((item, i) => (
                    <ListCard key={item.id} item={item} index={i} />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {hasMore && (
              <div className="flex justify-center mt-14">
                <button onClick={() => setPage((p) => p + 1)}
                  className="group rounded-2xl border border-border/40 bg-background/60 backdrop-blur-sm px-10 py-3.5 text-xs tracking-[0.15em] uppercase font-medium text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary hover:shadow-[0_0_30px_rgba(var(--primary),0.2)] transition-all duration-300">
                  {t("portfolio_load_more")}
                  <ArrowRight size={12} className="inline ml-2 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── CTA ── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.03] to-transparent pointer-events-none" />
        <div className="border-t border-border/30 py-24 md:py-32 relative z-10">
          <FadeUp>
            <div className="container text-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-4 py-2 mb-8">
                <Sparkles size={12} className="text-primary" />
                <p className="text-xs font-semibold tracking-[0.15em] uppercase text-primary">{t("portfolio_start_project")}</p>
              </div>
              <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground tracking-tight leading-tight">
                {t("portfolio_inspired")}
              </h2>
              <p className="mt-4 text-muted-foreground font-light max-w-md mx-auto leading-relaxed">
                {t("portfolio_lets_create")}
              </p>
              <Link to="/contact"
                className="inline-flex items-center gap-2 mt-10 rounded-2xl bg-primary px-10 py-4 text-sm tracking-wide font-medium text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:shadow-xl transition-all duration-300">
                {t("portfolio_begin_conversation")} <ArrowRight size={14} />
              </Link>
            </div>
          </FadeUp>
        </div>
      </section>

      <PublicFooter />
      <FloatingChatButton />
    </div>
  );
}
