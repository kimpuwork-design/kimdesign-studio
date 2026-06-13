import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useContentProtection } from "@/hooks/useContentProtection";
import { Link, useSearchParams } from "react-router-dom";
import { PublicNav } from "@/components/PublicNav";
import { PublicFooter } from "@/components/PublicFooter";
import { supabase } from "@/integrations/supabase/client";
import { useSEO } from "@/hooks/useSEO";
import { FloatingChatButton } from "@/components/FloatingChatButton";
import { useTranslation } from "@/i18n/LanguageContext";
import { Search, MapPin, Grid3X3, Star, ArrowRight, ArrowUpRight, LayoutGrid, Rows3, X, ArrowDownUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { FadeUp } from "@/components/motion/MotionWrappers";

const CATEGORIES = ["All", "Residential", "Cultural", "Commercial", "Interior", "Landscape", "Civic", "Mixed-Use"];
type SortMode = "newest" | "oldest" | "az" | "year_desc";
const SORT_LABELS: Record<SortMode, string> = { newest: "Newest", oldest: "Oldest", az: "A–Z", year_desc: "By Year" };
const luxuryEase = [0.22, 1, 0.36, 1] as const;

/* ─── Animated Counter ─── */
function useCountUp(target: number, duration = 1800) {
  const [count, setCount] = useState(0);
  const started = useRef(false);
  useEffect(() => {
    if (started.current) setCount(target);
  }, [target]);
  const start = useCallback(() => {
    if (started.current) return;
    started.current = true;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - t0) / duration, 1);
      setCount(Math.round((1 - Math.pow(1 - p, 4)) * target));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);
  return { count, start };
}

function AnimatedPortfolioStat({ value, label, delay }: { value: number; label: string; delay: number }) {
  const { count, start } = useCountUp(value);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { start(); obs.unobserve(el); } }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [start]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay, ease: luxuryEase }}
      className="shrink-0"
    >
      <p className="font-display text-3xl md:text-4xl text-foreground">{count}</p>
      <p className="text-[9px] tracking-[0.25em] uppercase text-muted-foreground mt-1">{label}</p>
    </motion.div>
  );
}

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

/* ─── Editorial Grid Card (title BELOW image, magazine style) ─── */
function GridCard({ item, index, t, featured = false }: { item: ProjectPortfolioItem; index: number; t: (k: string) => string; featured?: boolean }) {
  const linkTo = item.slug ? `/portfolio/${item.slug}` : `/projects/${item.id}`;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.55, delay: Math.min(index * 0.04, 0.3), ease: luxuryEase }}
      className="group"
    >
      <Link to={linkTo} className="block" data-cursor-hover data-cursor-label="View">
        <div className={`relative overflow-hidden bg-muted/30 ${featured ? "aspect-[16/9]" : "aspect-[4/3]"}`}>
          {item.thumbnail_url ? (
            <img
              src={item.thumbnail_url}
              alt={item.title}
              loading="lazy"
              draggable={false}
              onContextMenu={(e) => e.preventDefault()}
              className="w-full h-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.03]"
              style={{ userSelect: "none", WebkitUserDrag: "none" } as React.CSSProperties}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Grid3X3 size={32} className="text-muted-foreground/20" />
            </div>
          )}
          {item.is_featured && (
            <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-background/95 backdrop-blur-sm px-2.5 py-1 text-[9px] font-medium text-foreground tracking-[0.18em] uppercase">
              <Star size={9} className="fill-primary text-primary" /> {t("portfolio_featured_badge")}
            </div>
          )}
        </div>

        <div className="pt-5 pb-2">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2 text-[10px] tracking-[0.18em] uppercase text-muted-foreground font-medium">
              {item.category && <span>{item.category}</span>}
              {item.category && item.year && <span className="text-border">/</span>}
              {item.year && <span className="tabular-nums">{item.year}</span>}
            </div>
            <span className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground tabular-nums">
              {String(index + 1).padStart(3, "0")}
            </span>
          </div>
          <h3 className={`font-display text-foreground leading-[1.15] tracking-tight group-hover:text-primary transition-colors duration-300 ${featured ? "text-2xl md:text-[32px]" : "text-xl md:text-[22px]"}`}>
            {item.title}
          </h3>
          {item.location && (
            <p className="mt-2 flex items-center gap-1.5 text-[12px] text-muted-foreground">
              <MapPin size={11} className="opacity-60" /> {item.location}
            </p>
          )}
          <div className="mt-4 inline-flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase text-foreground/60 group-hover:text-primary group-hover:gap-3 transition-all duration-300">
            <span>View Project</span>
            <ArrowUpRight size={12} />
          </div>
        </div>
      </Link>
    </motion.article>
  );
}

/* ─── List Card ─── */
function ListCard({ item, index }: { item: ProjectPortfolioItem; index: number }) {
  const linkTo = item.slug ? `/portfolio/${item.slug}` : `/projects/${item.id}`;
  return (
    <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5, delay: index * 0.04, ease: luxuryEase }}>
      <Link to={linkTo} className="group flex items-center gap-6 py-6 px-0 border-b border-border/30 hover:border-primary/20 transition-all duration-300" data-cursor-hover data-cursor-label="View">
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
            {item.year && <span className="tabular-nums">{item.year}</span>}
          </div>
        </div>
        <ArrowRight size={16} className="text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
      </Link>
    </motion.div>
  );
}

export default function PublicPortfolio() {
  const { t } = useTranslation();
  useContentProtection();
  useSEO({ title: t("portfolio_title"), description: t("portfolio_description") });
  const [items, setItems] = useState<ProjectPortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get("q") ?? "";
  const category = searchParams.get("cat") ?? "All";
  const year = searchParams.get("year") ?? "All";
  const sort = (searchParams.get("sort") as SortMode) || "newest";
  const viewMode = (searchParams.get("view") as "grid" | "list") || "grid";
  const [page, setPage] = useState(1);
  const [sortOpen, setSortOpen] = useState(false);
  const PAGE_SIZE = 12;

  const updateParam = useCallback((patch: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([k, v]) => {
      if (v == null || v === "" || v === "All" || (k === "sort" && v === "newest") || (k === "view" && v === "grid")) next.delete(k);
      else next.set(k, v);
    });
    setSearchParams(next, { replace: true });
    setPage(1);
  }, [searchParams, setSearchParams]);

  const setSearch = (v: string) => updateParam({ q: v || null });
  const setCategory = (v: string) => updateParam({ cat: v });
  const setYear = (v: string) => updateParam({ year: v });
  const setSort = (v: SortMode) => { updateParam({ sort: v }); setSortOpen(false); };
  const setViewMode = (v: "grid" | "list") => updateParam({ view: v });

  const heroRef = useRef<HTMLDivElement>(null);

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

  const yearOptions = useMemo(() => {
    const years = Array.from(new Set(items.map((i) => i.year).filter((y): y is number => !!y))).sort((a, b) => b - a);
    return ["All", ...years.map(String)];
  }, [items]);

  const filtered = useMemo(() => items.filter((item) => {
    if (category !== "All" && item.category !== category) return false;
    if (year !== "All" && String(item.year ?? "") !== year) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return item.title.toLowerCase().includes(q) || (item.summary ?? "").toLowerCase().includes(q) ||
        item.location?.toLowerCase().includes(q) || item.tags?.some((tg) => tg.toLowerCase().includes(q));
    }
    return true;
  }), [items, category, year, search]);

  const sortedFiltered = useMemo(() => {
    const arr = [...filtered];
    switch (sort) {
      case "oldest": arr.sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at)); break;
      case "az": arr.sort((a, b) => a.title.localeCompare(b.title)); break;
      case "year_desc": arr.sort((a, b) => (b.year ?? 0) - (a.year ?? 0)); break;
      default: arr.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
    }
    return arr;
  }, [filtered, sort]);

  const featured = sortedFiltered.filter((i) => i.is_featured);
  const rest = sortedFiltered.filter((i) => !i.is_featured);
  const allForDisplay = sort === "newest" ? [...featured, ...rest] : sortedFiltered;
  const paginated = allForDisplay.slice(0, page * PAGE_SIZE);
  const hasMore = allForDisplay.length > paginated.length;

  const activeFiltersCount =
    (category !== "All" ? 1 : 0) + (year !== "All" ? 1 : 0) + (search.trim() ? 1 : 0);
  const clearFilters = () => setSearchParams({}, { replace: true });


  return (
    <div className="bg-background min-h-screen relative content-protected">
      <PublicNav />

      {/* ── Editorial Hero ── */}
      <section ref={heroRef} className="relative border-b border-border/40">
        <div className="container pt-20 md:pt-28 pb-12 md:pb-16">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-end">
            {/* Left: index + title */}
            <div className="md:col-span-8">
              <div className="flex items-center gap-3 mb-6 text-[10px] tracking-[0.25em] uppercase text-muted-foreground font-medium">
                <span className="h-px w-8 bg-primary" />
                <span>{t("portfolio_selected_work")}</span>
              </div>
              <motion.h1
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: luxuryEase }}
                className="font-display text-[clamp(2.4rem,6vw,5.5rem)] text-foreground leading-[0.95] tracking-[-0.03em]"
              >
                {t("portfolio_our") || "Our"} <span className="text-primary italic font-light">{t("portfolio_title") || "Portfolio"}</span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.15, ease: luxuryEase }}
                className="mt-6 text-muted-foreground max-w-xl leading-[1.7] text-[15px] md:text-base"
              >
                {t("portfolio_description")}
              </motion.p>
            </div>
            {/* Right: stats column */}
            <div className="md:col-span-4 md:border-l md:border-border/50 md:pl-8">
              <div className="grid grid-cols-3 md:grid-cols-1 gap-5 md:gap-6">
                {[
                  { n: items.length, label: t("portfolio_projects_stat") },
                  { n: items.filter(i => i.is_featured).length, label: t("portfolio_featured_stat") },
                  { n: new Set(items.map(i => i.category).filter(Boolean)).size, label: t("portfolio_categories_stat") },
                ].map((stat, i) => (
                  <div key={stat.label} className="md:flex md:items-baseline md:gap-3 md:border-b md:border-border/40 md:pb-4">
                    <AnimatedPortfolioStat value={stat.n} label={stat.label} delay={0.3 + i * 0.08} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      

      {/* ── Sticky Filters ── */}
      <section className="sticky top-16 z-30 bg-background/80 backdrop-blur-xl border-t border-b border-border/30">
        <div className="container py-3 md:py-3.5 flex flex-col gap-2.5 md:flex-row md:gap-4 md:items-center">
          <div className="relative flex-1 max-w-full md:max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder={t("portfolio_search")}
              className="w-full pl-9 pr-9 py-2 border border-border/50 bg-background/60 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 transition-colors" />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors" aria-label="Clear search">
                <X size={13} />
              </button>
            )}
          </div>
          <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-0.5 md:pb-0 items-center flex-1">
            {CATEGORIES.map((c) => (
              <button key={c} onClick={() => setCategory(c)}
                className={`px-3 md:px-3.5 py-1.5 text-[10px] tracking-[0.12em] uppercase font-medium transition-all duration-300 whitespace-nowrap shrink-0 ${
                  category === c ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                }`}>
                {c === "All" ? t("portfolio_all") : c}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {yearOptions.length > 1 && (
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="border border-border/40 bg-background/60 text-[10px] tracking-[0.12em] uppercase font-medium text-foreground py-1.5 px-2.5 focus:outline-none focus:border-primary/40 transition-colors cursor-pointer"
                aria-label="Filter by year"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>{y === "All" ? "All Years" : y}</option>
                ))}
              </select>
            )}
            <div className="relative">
              <button
                onClick={() => setSortOpen((o) => !o)}
                className="flex items-center gap-1.5 border border-border/40 bg-background/60 text-[10px] tracking-[0.12em] uppercase font-medium text-foreground py-1.5 px-2.5 hover:border-primary/40 transition-colors"
              >
                <ArrowDownUp size={11} /> {SORT_LABELS[sort]}
              </button>
              {sortOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setSortOpen(false)} />
                  <div className="absolute right-0 mt-1 z-40 min-w-[140px] border border-border/40 bg-background shadow-lg">
                    {(Object.keys(SORT_LABELS) as SortMode[]).map((s) => (
                      <button key={s} onClick={() => setSort(s)}
                        className={`block w-full text-left px-3 py-2 text-[10px] tracking-[0.12em] uppercase font-medium transition-colors ${
                          sort === s ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                        }`}>
                        {SORT_LABELS[s]}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            {activeFiltersCount > 0 && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-[10px] tracking-[0.12em] uppercase font-medium text-primary hover:text-primary/70 transition-colors px-2 py-1.5"
              >
                <X size={11} /> Clear ({activeFiltersCount})
              </button>
            )}
            <div className="hidden md:flex items-center gap-0 border border-border/40 bg-background/40">
              <button onClick={() => setViewMode("grid")} className={`p-2 transition-all ${viewMode === "grid" ? "bg-foreground/5 text-foreground" : "text-muted-foreground hover:text-foreground"}`} aria-label="Grid view">
                <LayoutGrid size={15} />
              </button>
              <button onClick={() => setViewMode("list")} className={`p-2 transition-all ${viewMode === "list" ? "bg-foreground/5 text-foreground" : "text-muted-foreground hover:text-foreground"}`} aria-label="List view">
                <Rows3 size={15} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Content ── */}
      <div className="container py-12 md:py-16 relative z-10 min-h-[60vh]">
        {loading ? (
          <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <motion.div key={i} className={i === 0 ? "md:col-span-2" : ""} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.08 }}>
                <div className={`${i === 0 ? "aspect-[16/9]" : i <= 2 ? "aspect-[3/4]" : "aspect-[4/3]"} bg-muted/50 animate-pulse`} />
                <div className="mt-3 space-y-2">
                  <div className="h-3 w-16 bg-muted/40 animate-pulse" />
                  <div className="h-5 w-48 bg-muted/40 animate-pulse" />
                </div>
              </motion.div>
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
              <button onClick={clearFilters}
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
                  className="grid gap-x-6 gap-y-14 md:gap-x-8 md:gap-y-20 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {paginated.map((item, i) => {
                    const isFeatured = sort === "newest" && i === 0 && item.is_featured;
                    return (
                      <div key={item.id} className={isFeatured ? "sm:col-span-2 lg:col-span-3" : ""}>
                        <GridCard item={item} index={i} t={t} featured={isFeatured} />
                      </div>
                    );
                  })}
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
      <section className="border-t border-border/40">
        <div className="container py-24 md:py-32">
          <FadeUp>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-end">
              <div className="md:col-span-8">
                <div className="flex items-center gap-3 mb-6 text-[10px] tracking-[0.25em] uppercase text-muted-foreground font-medium">
                  <span className="h-px w-8 bg-primary" />
                  <span>{t("portfolio_start_project")}</span>
                </div>
                <h2 className="font-display text-4xl md:text-6xl text-foreground leading-[1.02] tracking-[-0.03em]">
                  {t("portfolio_inspired")}
                </h2>
                <p className="mt-5 text-muted-foreground max-w-lg leading-[1.7] text-base">{t("portfolio_lets_create")}</p>
              </div>
              <div className="md:col-span-4 md:text-right">
                <Link to="/contact"
                  className="group inline-flex items-center gap-3 bg-foreground px-8 py-4 text-[11px] tracking-[0.2em] uppercase text-background hover:bg-primary transition-all duration-500">
                  {t("portfolio_start_project")}
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </FadeUp>
        </div>
      </section>

      <PublicFooter />
      <FloatingChatButton />
    </div>
  );
}
