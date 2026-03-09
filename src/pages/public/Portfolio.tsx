import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { PublicNav } from "@/components/PublicNav";
import { PublicFooter } from "@/components/PublicFooter";
import { supabase } from "@/integrations/supabase/client";
import { useSEO } from "@/hooks/useSEO";
import { FloatingChatButton } from "@/components/FloatingChatButton";
import { useTranslation } from "@/i18n/LanguageContext";
import { Search, MapPin, Calendar, Grid3X3, Star, Loader2, ArrowRight, ArrowUpRight, LayoutGrid, Rows3 } from "lucide-react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { FadeUp } from "@/components/motion/MotionWrappers";

const CATEGORIES = ["All", "Residential", "Cultural", "Commercial", "Interior", "Landscape", "Civic", "Mixed-Use"];
const luxuryEase = [0.22, 1, 0.36, 1] as const;

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

/* ─── Grid Card — Sharp, editorial with inner parallax ─── */
function GridCard({ item, size = "normal", index, t }: { item: ProjectPortfolioItem; size?: "hero" | "tall" | "wide" | "normal"; index: number; t: (k: string) => string }) {
  const linkTo = item.slug ? `/portfolio/${item.slug}` : `/projects/${item.id}`;
  const coverUrl = item.thumbnail_url;
  const imgRef = useRef<HTMLImageElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    const el = e.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    if (imgRef.current) {
      imgRef.current.style.transform = `scale(1.08) translate(${-x * 12}px, ${-y * 12}px)`;
    }
  };
  const handleMouseLeave = () => {
    if (imgRef.current) {
      imgRef.current.style.transform = "scale(1) translate(0, 0)";
    }
  };

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
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.6, delay: index * 0.05, ease: luxuryEase }}
    >
      <Link to={linkTo} className="group block relative overflow-hidden" data-cursor-hover data-cursor-label="View"
        onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
        <div className={`${aspectMap[size]} overflow-hidden relative`}>
          {coverUrl ? (
            <img ref={imgRef} src={coverUrl} alt={item.title} loading="lazy"
              className="w-full h-full object-cover transition-transform duration-700 ease-out" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted/30">
              <Grid3X3 size={40} className="text-muted-foreground/15" />
            </div>
          )}
          {/* Minimal gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          {item.is_featured && (
            <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-primary px-3 py-1.5 text-[9px] font-medium text-primary-foreground tracking-[0.15em] uppercase">
              <Star size={9} className="fill-current" /> {t("portfolio_featured_badge")}
            </div>
          )}

          {/* Hover reveal arrow */}
          <div className="absolute top-4 right-4 h-9 w-9 bg-background/90 flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
            <ArrowUpRight size={14} className="text-foreground" />
          </div>

          {/* Bottom info — always visible */}
          <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6">
            <div className="translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
              {item.category && (
                <span className="inline-block text-[9px] tracking-[0.2em] uppercase font-medium text-background/70 mb-2">
                  {item.category}
                </span>
              )}
              <h3 className={`font-display text-background drop-shadow-lg leading-tight ${
                size === "hero" ? "text-2xl md:text-4xl" : size === "tall" || size === "wide" ? "text-xl md:text-2xl" : "text-lg md:text-xl"
              }`}>
                {item.title}
              </h3>
              <div className="mt-2 flex items-center gap-3 text-[11px] text-background/50">
                {item.location && <span className="flex items-center gap-1"><MapPin size={10} />{item.location}</span>}
                {item.year && <span className="flex items-center gap-1"><Calendar size={10} />{item.year}</span>}
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

/* ─── List Card — Editorial row ─── */
function ListCard({ item, index }: { item: ProjectPortfolioItem; index: number }) {
  const linkTo = item.slug ? `/portfolio/${item.slug}` : `/projects/${item.id}`;

  return (
    <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5, delay: index * 0.04, ease: luxuryEase }}>
      <Link to={linkTo} className="group flex items-center gap-6 py-6 px-0 border-b border-border/30 hover:border-primary/20 transition-all duration-300" data-cursor-hover data-cursor-label="View">
        {/* Number */}
        <span className="font-display text-3xl text-border/50 group-hover:text-primary/30 transition-colors duration-500 tabular-nums w-[50px] shrink-0 hidden sm:block">
          {String(index + 1).padStart(2, '0')}
        </span>
        {item.thumbnail_url && (
          <div className="shrink-0 w-24 h-16 overflow-hidden">
            <img src={item.thumbnail_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {item.is_featured && <Star size={10} className="text-primary fill-primary shrink-0" />}
            {item.category && <span className="text-[9px] tracking-[0.15em] uppercase font-medium text-primary">{item.category}</span>}
          </div>
          <h3 className="font-display text-lg text-foreground group-hover:text-primary transition-colors truncate">{item.title}</h3>
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            {item.location && <span className="flex items-center gap-1"><MapPin size={10} />{item.location}</span>}
            {item.year && <span className="flex items-center gap-1"><Calendar size={10} />{item.year}</span>}
          </div>
        </div>
        <ArrowRight size={16} className="text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
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

      {/* ── Hero ── */}
      <div ref={heroRef} className="relative overflow-hidden">
        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="relative z-10">
          <section className="container pt-20 pb-10 md:pt-28 md:pb-16">
            <div className="max-w-3xl">
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.1 }}
                className="text-[10px] tracking-[0.35em] uppercase text-primary mb-6 md:mb-8">
                {t("portfolio_selected_work")}
              </motion.p>

              <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2, ease: luxuryEase }}
                className="font-display text-[clamp(2.5rem,7vw,6rem)] text-foreground leading-[0.95]">
                {t("portfolio_our")}<br />
                <span className="text-primary">{t("portfolio_title")}</span>
              </motion.h1>

              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.4 }}
                className="mt-6 text-muted-foreground max-w-lg leading-relaxed text-base md:text-lg font-light">
                {t("portfolio_description")}
              </motion.p>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.5 }}
                className="mt-10 flex items-center gap-10 overflow-x-auto pb-2 scrollbar-none">
                {[
                  { n: items.length, label: t("portfolio_projects_stat") },
                  { n: items.filter(i => i.is_featured).length, label: t("portfolio_featured_stat") },
                  { n: new Set(items.map(i => i.category).filter(Boolean)).size, label: t("portfolio_categories_stat") },
                ].map((stat) => (
                  <div key={stat.label} className="shrink-0">
                    <p className="font-display text-3xl md:text-4xl text-foreground">{stat.n}</p>
                    <p className="text-[9px] tracking-[0.25em] uppercase text-muted-foreground mt-1">{stat.label}</p>
                  </div>
                ))}
              </motion.div>
            </div>
          </section>
        </motion.div>
      </div>

      {/* ── Sticky Filters ── */}
      <section className="sticky top-16 z-30 bg-background/80 backdrop-blur-xl border-t border-b border-border/30">
        <div className="container py-3 md:py-3.5 flex flex-col gap-2.5 md:flex-row md:gap-4 md:items-center">
          <div className="relative flex-1 max-w-full md:max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder={t("portfolio_search")}
              className="w-full pl-9 pr-3 py-2 border border-border/50 bg-background/60 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 transition-colors" />
          </div>
          <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-0.5 md:pb-0 items-center flex-1">
            {CATEGORIES.map((c) => (
              <button key={c} onClick={() => { setCategory(c); setPage(1); }}
                className={`px-3 md:px-3.5 py-1.5 text-[10px] tracking-[0.12em] uppercase font-medium transition-all duration-300 whitespace-nowrap shrink-0 ${
                  category === c
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
                }`}>
                {c === "All" ? t("portfolio_all") : c}
              </button>
            ))}
          </div>
          <div className="hidden md:flex items-center gap-0 border border-border/40 bg-background/40">
            <button onClick={() => setViewMode("grid")} className={`p-2 transition-all ${viewMode === "grid" ? "bg-foreground/5 text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              <LayoutGrid size={15} />
            </button>
            <button onClick={() => setViewMode("list")} className={`p-2 transition-all ${viewMode === "list" ? "bg-foreground/5 text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              <Rows3 size={15} />
            </button>
          </div>
        </div>
      </section>

      {/* ── Content ── */}
      <div className="container py-12 md:py-16 relative z-10 min-h-[60vh]">
        {loading ? (
          <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={i === 0 ? "md:col-span-2" : ""}>
                <div className={`${i === 0 ? "aspect-[16/9]" : i <= 2 ? "aspect-[3/4]" : "aspect-[4/3]"} shimmer`} />
                <div className="mt-3 space-y-2">
                  <div className="h-3 w-16 shimmer" />
                  <div className="h-5 w-48 shimmer" />
                  <div className="h-3 w-24 shimmer" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <FadeUp>
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="h-20 w-20 bg-muted/30 flex items-center justify-center mb-6">
                <Grid3X3 size={32} className="text-muted-foreground/20" />
              </div>
              <h3 className="font-display text-2xl text-foreground">{t("portfolio_no_projects")}</h3>
              <p className="mt-2 text-muted-foreground text-sm max-w-xs">{t("portfolio_no_found_hint")}</p>
              <button onClick={() => { setSearch(""); setCategory("All"); }}
                className="mt-6 text-xs text-primary hover:underline tracking-[0.15em] uppercase font-medium">
                {t("portfolio_clear_filters")}
              </button>
            </div>
          </FadeUp>
        ) : (
          <>
            <div className="flex items-center justify-between mb-10">
              <p className="text-xs text-muted-foreground tracking-[0.1em]">
                {t("portfolio_showing")} <span className="text-foreground font-medium">{paginated.length}</span> {t("portfolio_of")}{" "}
                <span className="text-foreground font-medium">{allForDisplay.length}</span> {t("portfolio_projects_label")}
              </p>
            </div>

            <AnimatePresence mode="wait">
              {viewMode === "grid" ? (
                <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
                  className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {paginated.map((item, i) => (
                    <div key={item.id} className={getBentoSpan(i)}>
                      <GridCard item={item} size={getBentoSize(i)} index={i} t={t} />
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
              <div className="flex justify-center mt-16">
                <button onClick={() => setPage((p) => p + 1)}
                  className="group border border-border/40 bg-background px-10 py-3.5 text-xs tracking-[0.15em] uppercase font-medium text-foreground hover:bg-foreground hover:text-background hover:border-foreground transition-all duration-500">
                  {t("portfolio_load_more")}
                  <ArrowRight size={12} className="inline ml-2 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── CTA ── */}
      <section className="border-t border-border/30">
        <div className="container py-24 md:py-36">
          <FadeUp>
            <div className="text-center max-w-2xl mx-auto">
              <p className="text-[10px] tracking-[0.35em] uppercase text-primary mb-6">{t("portfolio_start_project")}</p>
              <h2 className="font-display text-4xl md:text-6xl text-foreground leading-[1.05]">{t("portfolio_inspired")}</h2>
              <p className="mt-4 text-muted-foreground max-w-md mx-auto leading-relaxed font-light">{t("portfolio_lets_create")}</p>
              <Link to="/contact"
                className="inline-flex items-center gap-2 mt-10 bg-primary px-10 py-4 text-sm tracking-[0.15em] uppercase text-primary-foreground hover:bg-primary/90 transition-colors">
                {t("portfolio_start_project")} <ArrowRight size={14} />
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
