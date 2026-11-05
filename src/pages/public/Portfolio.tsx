import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { shouldFocusPageSearch } from "@/lib/keyboard";
import { useContentProtection } from "@/hooks/useContentProtection";
import { Link, useSearchParams } from "react-router-dom";
import { PublicNav } from "@/components/PublicNav";
import { PublicFooter } from "@/components/PublicFooter";
import { supabase } from "@/integrations/supabase/client";
import { useSEO } from "@/hooks/useSEO";
import { useTranslation } from "@/i18n/LanguageContext";
import {
  Search,
  MapPin,
  Grid3X3,
  Star,
  ArrowRight,
  ArrowUpRight,
  X,
  ArrowDownUp,
} from "lucide-react";
import { motion } from "framer-motion";
import { FadeUp } from "@/components/motion/MotionWrappers";
import { ProgressiveImage } from "@/components/media/ProgressiveImage";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type SortMode = "newest" | "oldest" | "az" | "year_desc";
const SORT_LABELS: Record<SortMode, string> = {
  newest: "Newest",
  oldest: "Oldest",
  az: "A–Z",
  year_desc: "By Year",
};
const luxuryEase = [0.22, 1, 0.36, 1] as const;

function PortfolioStat({ value, label }: { value: number; label: string }) {
  return (
    <div className="inline-flex items-baseline gap-2 liquid-glass rounded-full px-4 py-2">
      <dd className="font-display text-xl md:text-2xl text-foreground tabular-nums leading-none">
        {value}
      </dd>
      <dt className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground">
        {label}
      </dt>
    </div>
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

/* ─── Editorial Grid Card ─── */
function GridCard({
  item,
  index,
  t,
  featured = false,
}: {
  item: ProjectPortfolioItem;
  index: number;
  t: (k: string) => string;
  featured?: boolean;
}) {
  const linkTo = item.slug ? `/portfolio/${item.slug}` : `/projects/${item.id}`;
  const eager = index < 8;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{
        duration: 0.4,
        delay: Math.min(index * 0.02, 0.12),
        ease: luxuryEase,
      }}
      className="group"
    >
      <Link
        to={linkTo}
        aria-label={`${item.title}${item.location ? ` — ${item.location}` : ""}`}
        onPointerEnter={() => {
          // Warm the full-size thumbnail into the browser cache for instant detail view.
          if (item.thumbnail_url) {
            const img = new Image();
            img.decoding = "async";
            img.src = item.thumbnail_url;
          }
        }}
        className="block rounded-[1.75rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <div
          className={`relative overflow-hidden rounded-[1.5rem] bg-muted/40 ring-1 ring-border/40 shadow-sm transition-all duration-500 ease-out group-hover:-translate-y-1 group-hover:shadow-2xl group-hover:shadow-primary/15 ${
            featured ? "aspect-[16/10]" : "aspect-[4/3]"
          }`}
        >
          {item.thumbnail_url ? (
            <ProgressiveImage
              src={item.thumbnail_url}
              alt=""
              eager={eager}
              priority={index < 3}
              thumbWidth={featured ? 1280 : 720}
              aspectRatio={featured ? "16 / 10" : "4 / 3"}
              onContextMenu={(e) => e.preventDefault()}
              className="transition-transform duration-[1200ms] ease-out group-hover:scale-[1.03]"
              wrapperClassName="size-full"
            />
          ) : (
            <div className="size-full flex items-center justify-center bg-gradient-to-br from-primary/15 via-primary/5 to-background">
              <span className="font-display text-5xl md:text-6xl text-primary/40 tracking-tight">
                {(item.title || "·").slice(0, 2).toUpperCase()}
              </span>
            </div>
          )}
          {item.is_featured && (
            <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 liquid-glass rounded-full px-2.5 py-1 text-[10px] font-medium text-foreground tracking-[0.14em] uppercase">
              <Star size={10} className="fill-primary text-primary" aria-hidden />
              {t("portfolio_featured_badge")}
            </div>
          )}
          {/* Hover overlay caption for richer interaction */}
          <div className="absolute inset-x-3 bottom-3 z-20 hidden md:flex items-center justify-between gap-4 liquid-glass-dark rounded-full pl-4 pr-1.5 py-1.5 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 ease-out">
            <span className="text-[11px] tracking-[0.2em] uppercase text-hero-foreground/80">
              {item.category ?? "Project"}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-hero-foreground px-3 py-1.5 text-[11px] tracking-[0.18em] uppercase text-hero font-medium">
              View <ArrowUpRight size={12} aria-hidden />
            </span>
          </div>
        </div>

        <div className="pt-3.5 px-0.5">
          <div className="flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase text-muted-foreground">
            <span className="text-primary/70 tabular-nums">{String(index + 1).padStart(2, "0")}</span>
            {item.category && <span aria-hidden>·</span>}
            {item.category && <span>{item.category}</span>}
            {item.category && item.year && <span aria-hidden>·</span>}
            {item.year && <span className="tabular-nums">{item.year}</span>}
          </div>
          <h3
            className={`mt-1 font-display text-foreground leading-[1.2] tracking-tight group-hover:text-primary transition-colors ${
              featured ? "text-xl md:text-[28px]" : "text-lg md:text-xl"
            }`}
          >
            {item.title}
          </h3>
          {item.location && (
            <p className="mt-1 flex items-center gap-1.5 text-[13px] text-muted-foreground">
              <MapPin size={12} className="opacity-60" aria-hidden />
              {item.location}
            </p>
          )}
        </div>
      </Link>
    </motion.article>
  );
}


export default function PublicPortfolio() {
  const { t } = useTranslation();
  useContentProtection();
  useSEO({
    title: t("seo_portfolio_title"),
    description: t("seo_portfolio_description"),
  });
  const [items, setItems] = useState<ProjectPortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get("q") ?? "";
  const category = searchParams.get("cat") ?? "All";
  const sort = (searchParams.get("sort") as SortMode) || "newest";
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 12;
  const searchRef = useRef<HTMLInputElement>(null);

  // "/" jumps straight to project search (skipped while typing elsewhere).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!shouldFocusPageSearch(e)) return;
      e.preventDefault();
      searchRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const updateParam = useCallback(
    (patch: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams);
      Object.entries(patch).forEach(([k, v]) => {
        if (v == null || v === "" || v === "All" || (k === "sort" && v === "newest"))
          next.delete(k);
        else next.set(k, v);
      });
      setSearchParams(next, { replace: true });
      setPage(1);
    },
    [searchParams, setSearchParams],
  );

  const setSearch = (v: string) => updateParam({ q: v || null });
  const setCategory = (v: string) => updateParam({ cat: v });
  const setSort = (v: SortMode) => updateParam({ sort: v });

  // Categories and years come from real project data — empty filters would only confuse visitors.
  const availableCategories = useMemo(
    () => Array.from(new Set(items.map((i) => i.category).filter(Boolean) as string[])).sort(),
    [items],
  );
  const featuredCount = useMemo(() => items.filter((i) => i.is_featured).length, [items]);
  const hasYears = useMemo(() => items.some((i) => i.year), [items]);
  const sortOptions = useMemo(
    () => (Object.keys(SORT_LABELS) as SortMode[]).filter((s) => s !== "year_desc" || hasYears),
    [hasYears],
  );

  const statsList = useMemo(() => {
    const stats = [{ n: items.length, label: t("portfolio_projects_stat") }];
    if (featuredCount > 0) stats.push({ n: featuredCount, label: t("portfolio_featured_stat") });
    if (availableCategories.length > 0)
      stats.push({ n: availableCategories.length, label: t("portfolio_categories_stat") });
    return stats;
  }, [items.length, featuredCount, availableCategories, t]);

  useEffect(() => {
    setLoading(true);
    supabase
      .from("projects")
      .select(
        "id, title, slug, summary, description, thumbnail_url, category, location, year, tags, is_featured, is_public, created_at, updated_at",
      )
      .eq("is_public", true)
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setItems((data as ProjectPortfolioItem[]) ?? []);
        setLoading(false);
      });
  }, []);

  const filtered = useMemo(
    () =>
      items.filter((item) => {
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
      }),
    [items, category, search],
  );

  const sortedFiltered = useMemo(() => {
    const arr = [...filtered];
    switch (sort) {
      case "oldest":
        arr.sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));
        break;
      case "az":
        arr.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "year_desc":
        arr.sort((a, b) => (b.year ?? 0) - (a.year ?? 0));
        break;
      default:
        arr.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
    }
    return arr;
  }, [filtered, sort]);

  const featured = sortedFiltered.filter((i) => i.is_featured);
  const rest = sortedFiltered.filter((i) => !i.is_featured);
  const allForDisplay =
    sort === "newest" ? [...featured, ...rest] : sortedFiltered;
  const paginated = allForDisplay.slice(0, page * PAGE_SIZE);
  const hasMore = allForDisplay.length > paginated.length;

  const activeFiltersCount =
    (category !== "All" ? 1 : 0) + (search.trim() ? 1 : 0);
  const clearFilters = () => setSearchParams({}, { replace: true });

  return (
    <div className="bg-background min-h-dvh relative content-protected">
      <PublicNav />

      <div aria-labelledby="portfolio-heading">
        {/* ── Compact Hero ── */}
        <section className="relative">
          <div className="container pt-8 md:pt-14 pb-6 md:pb-10">
            <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between md:gap-10">
              <div className="max-w-2xl">
                <div className="flex items-center gap-3 mb-4 text-[10px] tracking-[0.25em] uppercase text-muted-foreground font-medium">
                  <span className="h-px w-8 bg-primary" aria-hidden />
                  <span>{t("portfolio_selected_work")}</span>
                </div>
                <motion.h1
                  id="portfolio-heading"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: luxuryEase }}
                  className="font-display text-[clamp(2.25rem,5vw,4.25rem)] text-foreground leading-[0.95] tracking-[-0.04em]"
                >
                  {t("portfolio_our") || "Our"}{" "}
                  <span className="text-primary italic font-black">
                    {t("portfolio_title") || "Portfolio"}
                  </span>
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1, ease: luxuryEase }}
                  className="mt-3 text-muted-foreground max-w-xl leading-relaxed text-sm md:text-[15px]"
                >
                  {t("portfolio_description")}
                </motion.p>
              </div>
              <dl className="flex flex-wrap gap-2" aria-label="Portfolio summary">
                {statsList.map((stat) => (
                  <PortfolioStat key={stat.label} value={stat.n} label={stat.label} />
                ))}
              </dl>
            </div>
          </div>
        </section>

        {/* ── Sticky Filters ── */}
        <section
          aria-label="Filter and sort projects"
          className="sticky top-16 md:top-20 z-30 pointer-events-none"
        >
          <div className="container py-2">
            <div className="pointer-events-auto liquid-glass rounded-[1.75rem] md:rounded-full p-1.5 flex flex-wrap items-center gap-2 md:flex-nowrap md:gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-0 md:flex-none md:w-80">
              <label htmlFor="portfolio-search" className="sr-only">
                {t("portfolio_search")}
              </label>
              <Search
                size={14}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <input
                ref={searchRef}
                id="portfolio-search"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape" && search) {
                    e.preventDefault();
                    setSearch("");
                  }
                }}
                placeholder={t("portfolio_search")}
                aria-keyshortcuts="/"
                className="peer w-full pl-9 pr-10 py-2 min-h-11 rounded-full border border-foreground/10 bg-background/50 text-base md:text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent"
              />
              {search ? (
                <button
                  onClick={() => {
                    setSearch("");
                    searchRef.current?.focus();
                  }}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Clear search"
                >
                  <X size={13} aria-hidden />
                </button>
              ) : (
                <kbd
                  aria-hidden
                  className="hidden md:flex absolute right-2.5 top-1/2 -translate-y-1/2 h-5 min-w-5 items-center justify-center rounded-full border border-border/70 px-1 font-mono text-[10px] text-muted-foreground peer-focus:opacity-0 transition-opacity"
                >
                  /
                </kbd>
              )}
            </div>

            {availableCategories.length > 0 && (
            /* Category chips — built from the categories actually used by the projects */
            <div
              role="tablist"
              aria-label="Project categories"
              className="order-last w-full md:order-none md:w-auto md:flex-1 min-w-0 px-1 pb-0.5 md:pb-0 flex gap-1.5 overflow-x-auto scrollbar-none"
            >
              {["All", ...availableCategories].map((c) => {
                const active = category === c;
                return (
                  <button
                    key={c}
                    role="tab"
                    aria-selected={active}
                    onClick={() => setCategory(c)}
                    className={`liquid-btn min-h-9 px-3.5 rounded-full text-[11px] tracking-[0.12em] uppercase font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      active
                        ? "bg-foreground text-background shadow-md"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    {c === "All" ? t("portfolio_all") : c}
                  </button>
                );
              })}
            </div>
            )}

            {/* Sort */}
            <div className="flex items-center gap-2 shrink-0 md:ml-auto">
              {activeFiltersCount > 0 && (
                <button
                  onClick={clearFilters}
                  aria-label={`Clear ${activeFiltersCount} filter${activeFiltersCount > 1 ? "s" : ""}`}
                  className="inline-flex items-center gap-1 liquid-btn h-11 md:h-9 px-3 rounded-full text-[11px] tracking-[0.1em] uppercase font-medium text-primary hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <X size={12} aria-hidden />
                  <span className="hidden sm:inline">Clear ({activeFiltersCount})</span>
                </button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger
                  aria-label={`Sort by ${SORT_LABELS[sort]}`}
                  className="inline-flex items-center justify-center gap-1.5 h-11 min-w-11 md:h-9 md:min-w-0 liquid-btn px-3.5 rounded-full border border-foreground/10 bg-background/50 text-[11px] tracking-[0.1em] uppercase font-medium text-foreground hover:bg-background/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <ArrowDownUp size={12} aria-hidden />
                  <span className="hidden sm:inline">{SORT_LABELS[sort]}</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[160px] rounded-2xl liquid-glass p-1.5">
                  {sortOptions.map((s) => (
                    <DropdownMenuItem
                      key={s}
                      onClick={() => setSort(s)}
                      className={`rounded-xl text-[11px] tracking-[0.1em] uppercase ${
                        sort === s ? "bg-muted text-foreground" : ""
                      }`}
                    >
                      {SORT_LABELS[s]}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            </div>
          </div>
        </section>

        {/* ── Content ── */}
        <div className="container py-6 md:py-10 relative z-10 min-h-[60vh]">
          {loading ? (
            <div className="grid gap-x-5 gap-y-8 md:gap-x-6 md:gap-y-10 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <motion.div
                  key={i}
                  className={i === 0 ? "sm:col-span-2" : ""}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.08 }}
                >
                  <div
                    className={`${
                      i === 0 ? "aspect-[16/10]" : "aspect-[4/3]"
                    } bg-muted/50 animate-pulse rounded-[1.5rem]`}
                  />
                  <div className="mt-3 space-y-2">
                    <div className="h-3 w-16 bg-muted/40 animate-pulse rounded-sm" />
                    <div className="h-5 w-48 bg-muted/40 animate-pulse rounded-sm" />
                  </div>
                </motion.div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <FadeUp>
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="size-20 rounded-full bg-muted/40 flex items-center justify-center mb-6">
                  <Grid3X3 size={28} className="text-muted-foreground/50" aria-hidden />
                </div>
                <h3 className="font-display text-2xl text-foreground">
                  {t("portfolio_no_projects")}
                </h3>
                <p className="mt-2 text-muted-foreground text-sm max-w-xs">
                  {t("portfolio_no_found_hint")}
                </p>
                <button
                  onClick={clearFilters}
                  className="mt-6 inline-flex items-center gap-2 min-h-11 px-5 rounded-md border border-border/60 text-xs tracking-[0.15em] uppercase font-medium text-foreground hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {t("portfolio_clear_filters")}
                </button>
              </div>
            </FadeUp>
          ) : (
            <>
              <div
                role="status"
                aria-live="polite"
                className={
                  activeFiltersCount > 0 || hasMore
                    ? "flex items-center justify-between mb-6"
                    : "sr-only"
                }
              >
                <p className="text-xs text-muted-foreground tracking-[0.1em]">
                  {t("portfolio_showing")}{" "}
                  <span className="text-foreground font-medium">
                    {paginated.length}
                  </span>{" "}
                  {t("portfolio_of")}{" "}
                  <span className="text-foreground font-medium">
                    {allForDisplay.length}
                  </span>{" "}
                  {t("portfolio_projects_label")}
                </p>
              </div>

              <div className="grid gap-x-5 gap-y-8 md:gap-x-6 md:gap-y-10 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {paginated.map((item, i) => {
                  const isFeatured =
                    sort === "newest" && i === 0 && item.is_featured;
                  return (
                    <div
                      key={item.id}
                      className={isFeatured ? "sm:col-span-2" : ""}
                    >
                      <GridCard
                        item={item}
                        index={i}
                        t={t}
                        featured={isFeatured}
                      />
                    </div>
                  );
                })}
              </div>

              {hasMore && (
                <div className="flex justify-center mt-10">
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    className="group liquid-glass liquid-btn min-h-12 rounded-full px-10 text-xs tracking-[0.15em] uppercase font-medium text-foreground hover:bg-foreground hover:text-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {t("portfolio_load_more")}
                    <ArrowRight
                      size={12}
                      className="inline ml-2 group-hover:translate-x-1 transition-transform"
                      aria-hidden
                    />
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── CTA ── */}
        <section className="container pb-12 md:pb-16">
          <FadeUp>
            <div className="relative overflow-hidden rounded-[2rem] bg-foreground text-background ring-1 ring-foreground/10 shadow-2xl px-6 py-8 md:px-12 md:py-12">
              <div
                aria-hidden
                className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full bg-primary/40 blur-3xl"
              />
              <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div className="max-w-xl">
                  <p className="text-[10px] tracking-[0.25em] uppercase text-background/60 font-medium">
                    {t("portfolio_start_project")}
                  </p>
                  <h2 className="mt-2 font-display text-3xl md:text-5xl leading-[1.05] tracking-[-0.03em]">
                    {t("portfolio_inspired")}
                  </h2>
                  <p className="mt-3 text-background/70 leading-relaxed text-sm md:text-base">
                    {t("portfolio_lets_create")}
                  </p>
                </div>
                <Link
                  to="/contact"
                  className="group liquid-btn inline-flex shrink-0 items-center justify-center gap-3 min-h-12 rounded-full bg-background shadow-[inset_0_1px_0_hsl(var(--background)),0_8px_24px_-8px_hsl(var(--primary)/0.6)] px-7 text-[11px] tracking-[0.2em] uppercase font-medium text-foreground hover:bg-primary hover:text-primary-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-foreground"
                >
                  {t("portfolio_start_project")}
                  <ArrowRight
                    size={14}
                    className="group-hover:translate-x-1 transition-transform"
                    aria-hidden
                  />
                </Link>
              </div>
            </div>
          </FadeUp>
        </section>
      </div>

      <PublicFooter />
    </div>
  );
}
