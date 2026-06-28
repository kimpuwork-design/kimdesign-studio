import { useEffect, useState, useRef, useCallback, useMemo } from "react";
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
  LayoutGrid,
  Rows3,
  X,
  ArrowDownUp,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { FadeUp } from "@/components/motion/MotionWrappers";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const CATEGORIES = [
  "All",
  "Residential",
  "Cultural",
  "Commercial",
  "Interior",
  "Landscape",
  "Civic",
  "Mixed-Use",
];
type SortMode = "newest" | "oldest" | "az" | "year_desc";
const SORT_LABELS: Record<SortMode, string> = {
  newest: "Newest",
  oldest: "Oldest",
  az: "A–Z",
  year_desc: "By Year",
};
const luxuryEase = [0.22, 1, 0.36, 1] as const;

/* ─── Animated Counter ─── */
function useCountUp(target: number, duration = 1400) {
  const [count, setCount] = useState(0);
  const animatedTo = useRef<number | null>(null);

  const start = useCallback(() => {
    if (animatedTo.current === target) return;
    animatedTo.current = target;
    if (target === 0) {
      setCount(0);
      return;
    }
    const from = count;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - t0) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 4);
      setCount(Math.round(from + (target - from) * eased));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration]);

  return { count, start };
}

function AnimatedPortfolioStat({
  value,
  label,
  delay,
}: {
  value: number;
  label: string;
  delay: number;
}) {
  const { count, start } = useCountUp(value);
  const ref = useRef<HTMLDivElement>(null);
  const seenRef = useRef(false);

  // Observe visibility once
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          seenRef.current = true;
          start();
        }
      },
      { threshold: 0.2 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [start]);

  // Re-run animation when target changes after already being visible (data loaded)
  useEffect(() => {
    if (seenRef.current) start();
  }, [value, start]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay, ease: luxuryEase }}
      className="shrink-0"
    >
      <p className="font-display text-3xl md:text-4xl text-foreground tabular-nums">
        {count}
      </p>
      <p className="mt-1 text-[10px] tracking-[0.25em] uppercase text-muted-foreground">
        {label}
      </p>
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
        className="block rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <div
          className={`relative overflow-hidden bg-muted/40 ${
            featured ? "aspect-[16/9]" : "aspect-[4/3]"
          }`}
        >
          {item.thumbnail_url ? (
            <ProgressiveImage
              src={item.thumbnail_url}
              alt=""
              eager={eager}
              priority={index < 3}
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
            <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-background/95 backdrop-blur-sm rounded-full px-2.5 py-1 text-[10px] font-medium text-foreground tracking-[0.14em] uppercase shadow-sm">
              <Star size={10} className="fill-primary text-primary" aria-hidden />
              {t("portfolio_featured_badge")}
            </div>
          )}
          {/* Hover overlay caption for richer interaction */}
          <div className="absolute inset-x-0 bottom-0 hidden md:flex items-end justify-between gap-4 p-4 bg-gradient-to-t from-background/90 via-background/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            <span className="text-[11px] tracking-[0.2em] uppercase text-foreground/70">
              {item.category ?? "Project"}
            </span>
            <span className="inline-flex items-center gap-1.5 text-[11px] tracking-[0.18em] uppercase text-primary">
              View <ArrowUpRight size={12} aria-hidden />
            </span>
          </div>
        </div>

        <div className="pt-5">
          <div className="flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase text-muted-foreground">
            {item.category && <span>{item.category}</span>}
            {item.category && item.year && <span aria-hidden>·</span>}
            {item.year && <span className="tabular-nums">{item.year}</span>}
          </div>
          <h3
            className={`mt-2 font-display text-foreground leading-[1.15] tracking-tight group-hover:text-primary transition-colors ${
              featured ? "text-2xl md:text-[32px]" : "text-xl md:text-[22px]"
            }`}
          >
            {item.title}
          </h3>
          {item.location && (
            <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin size={12} className="opacity-60" aria-hidden />
              {item.location}
            </p>
          )}
        </div>
      </Link>
    </motion.article>
  );
}

/* ─── List Card ─── */
function ListCard({
  item,
  index,
}: {
  item: ProjectPortfolioItem;
  index: number;
}) {
  const linkTo = item.slug ? `/portfolio/${item.slug}` : `/projects/${item.id}`;
  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, delay: index * 0.04, ease: luxuryEase }}
    >
      <Link
        to={linkTo}
        aria-label={item.title}
        className="group flex items-center gap-4 sm:gap-6 py-5 border-b border-border/40 hover:border-primary/30 transition-colors rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="hidden sm:block font-display text-2xl text-muted-foreground/60 group-hover:text-primary/60 transition-colors tabular-nums w-[42px] shrink-0">
          {String(index + 1).padStart(2, "0")}
        </span>
        {item.thumbnail_url && (
          <div className="shrink-0 w-20 h-16 sm:w-24 sm:h-16 overflow-hidden rounded-sm bg-muted/40">
            <img
              src={item.thumbnail_url}
              alt=""
              loading="lazy"
              className="size-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {item.is_featured && (
              <Star
                size={11}
                className="text-primary fill-primary shrink-0"
                aria-hidden
              />
            )}
            {item.category && (
              <span className="text-[10px] tracking-[0.15em] uppercase font-medium text-primary">
                {item.category}
              </span>
            )}
          </div>
          <h3 className="font-display text-lg text-foreground group-hover:text-primary transition-colors line-clamp-1">
            {item.title}
          </h3>
          <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
            {item.location && (
              <span className="flex items-center gap-1">
                <MapPin size={11} aria-hidden />
                {item.location}
              </span>
            )}
            {item.year && <span className="tabular-nums">{item.year}</span>}
          </div>
        </div>
        <ArrowRight
          size={16}
          className="text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0"
          aria-hidden
        />
      </Link>
    </motion.div>
  );
}

export default function PublicPortfolio() {
  const { t } = useTranslation();
  useContentProtection();
  useSEO({
    title: t("portfolio_title"),
    description: t("portfolio_description"),
  });
  const [items, setItems] = useState<ProjectPortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get("q") ?? "";
  const category = searchParams.get("cat") ?? "All";
  const year = searchParams.get("year") ?? "All";
  const sort = (searchParams.get("sort") as SortMode) || "newest";
  const viewMode = (searchParams.get("view") as "grid" | "list") || "grid";
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 12;

  const updateParam = useCallback(
    (patch: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams);
      Object.entries(patch).forEach(([k, v]) => {
        if (
          v == null ||
          v === "" ||
          v === "All" ||
          (k === "sort" && v === "newest") ||
          (k === "view" && v === "grid")
        )
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
  const setYear = (v: string) => updateParam({ year: v });
  const setSort = (v: SortMode) => updateParam({ sort: v });
  const setViewMode = (v: "grid" | "list") => updateParam({ view: v });

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

  const yearOptions = useMemo(() => {
    const years = Array.from(
      new Set(items.map((i) => i.year).filter((y): y is number => !!y)),
    ).sort((a, b) => b - a);
    return ["All", ...years.map(String)];
  }, [items]);

  const filtered = useMemo(
    () =>
      items.filter((item) => {
        if (category !== "All" && item.category !== category) return false;
        if (year !== "All" && String(item.year ?? "") !== year) return false;
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
    [items, category, year, search],
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
    (category !== "All" ? 1 : 0) +
    (year !== "All" ? 1 : 0) +
    (search.trim() ? 1 : 0);
  const clearFilters = () => setSearchParams({}, { replace: true });

  return (
    <div className="bg-background min-h-dvh relative content-protected">
      <PublicNav />

      <main id="main" aria-labelledby="portfolio-heading">
        {/* ── Editorial Hero ── */}
        <section className="relative border-b border-border/40">
          <div className="container pt-20 md:pt-28 pb-12 md:pb-16">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-end">
              <div className="md:col-span-8">
                <div className="flex items-center gap-3 mb-6 text-[10px] tracking-[0.25em] uppercase text-muted-foreground font-medium">
                  <span className="h-px w-8 bg-primary" aria-hidden />
                  <span>{t("portfolio_selected_work")}</span>
                </div>
                <motion.h1
                  id="portfolio-heading"
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, ease: luxuryEase }}
                  className="font-display text-[clamp(2.4rem,6vw,5.5rem)] text-foreground leading-[0.95] tracking-[-0.03em]"
                >
                  {t("portfolio_our") || "Our"}{" "}
                  <span className="text-primary italic font-light">
                    {t("portfolio_title") || "Portfolio"}
                  </span>
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
              <div className="md:col-span-4 md:border-l md:border-border/50 md:pl-8">
                <dl className="grid grid-cols-3 md:grid-cols-1 gap-5 md:gap-6">
                  {[
                    { n: items.length, label: t("portfolio_projects_stat") },
                    {
                      n: items.filter((i) => i.is_featured).length,
                      label: t("portfolio_featured_stat"),
                    },
                    {
                      n: new Set(items.map((i) => i.category).filter(Boolean))
                        .size,
                      label: t("portfolio_categories_stat"),
                    },
                  ].map((stat, i) => (
                    <div
                      key={stat.label}
                      className="md:flex md:items-baseline md:gap-3 md:border-b md:border-border/40 md:pb-4"
                    >
                      <AnimatedPortfolioStat
                        value={stat.n}
                        label={stat.label}
                        delay={0.3 + i * 0.08}
                      />
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </div>
        </section>

        {/* ── Sticky Filters ── */}
        <section
          aria-label="Filter and sort projects"
          className="sticky top-16 z-30 bg-background/85 backdrop-blur-xl border-y border-border/40"
        >
          <div className="container py-3 md:py-3.5 space-y-2.5 md:space-y-0 md:flex md:items-center md:gap-4">
            {/* Search */}
            <div className="relative w-full md:max-w-xs">
              <label htmlFor="portfolio-search" className="sr-only">
                {t("portfolio_search")}
              </label>
              <Search
                size={14}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <input
                id="portfolio-search"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("portfolio_search")}
                className="w-full pl-9 pr-9 py-2 rounded-md border border-border/60 bg-background/60 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Clear search"
                >
                  <X size={13} aria-hidden />
                </button>
              )}
            </div>

            {/* Category chips */}
            <div
              role="tablist"
              aria-label="Project categories"
              className="-mx-2 px-2 flex gap-1.5 overflow-x-auto scrollbar-none flex-1"
            >
              {CATEGORIES.map((c) => {
                const active = category === c;
                return (
                  <button
                    key={c}
                    role="tab"
                    aria-selected={active}
                    onClick={() => setCategory(c)}
                    className={`min-h-9 px-3.5 rounded-full text-[11px] tracking-[0.12em] uppercase font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      active
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    {c === "All" ? t("portfolio_all") : c}
                  </button>
                );
              })}
            </div>

            {/* Year + Sort + View */}
            <div className="flex items-center gap-2 shrink-0">
              {yearOptions.length > 1 && (
                <Select value={year} onValueChange={setYear}>
                  <SelectTrigger
                    aria-label="Filter by year"
                    className="h-9 w-auto min-w-[110px] text-[11px] tracking-[0.1em] uppercase font-medium"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {yearOptions.map((y) => (
                      <SelectItem
                        key={y}
                        value={y}
                        className="text-[12px] tracking-[0.08em] uppercase"
                      >
                        {y === "All" ? "All Years" : y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger
                  aria-label={`Sort by ${SORT_LABELS[sort]}`}
                  className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-border/60 bg-background/60 text-[11px] tracking-[0.1em] uppercase font-medium text-foreground hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <ArrowDownUp size={12} aria-hidden />
                  <span className="hidden sm:inline">{SORT_LABELS[sort]}</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[140px]">
                  {(Object.keys(SORT_LABELS) as SortMode[]).map((s) => (
                    <DropdownMenuItem
                      key={s}
                      onClick={() => setSort(s)}
                      className={`text-[11px] tracking-[0.1em] uppercase ${
                        sort === s ? "bg-muted text-foreground" : ""
                      }`}
                    >
                      {SORT_LABELS[s]}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {activeFiltersCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center gap-1 h-9 px-2.5 rounded-md text-[11px] tracking-[0.1em] uppercase font-medium text-primary hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <X size={12} aria-hidden /> Clear ({activeFiltersCount})
                </button>
              )}

              <div
                role="group"
                aria-label="View mode"
                className="hidden md:flex items-center gap-0 rounded-md border border-border/60 bg-background/40 overflow-hidden"
              >
                <button
                  onClick={() => setViewMode("grid")}
                  aria-label="Grid view"
                  aria-pressed={viewMode === "grid"}
                  className={`min-h-9 min-w-9 inline-flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    viewMode === "grid"
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <LayoutGrid size={15} aria-hidden />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  aria-label="List view"
                  aria-pressed={viewMode === "list"}
                  className={`min-h-9 min-w-9 inline-flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    viewMode === "list"
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Rows3 size={15} aria-hidden />
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
                <motion.div
                  key={i}
                  className={i === 0 ? "sm:col-span-2 lg:col-span-3" : ""}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.08 }}
                >
                  <div
                    className={`${
                      i === 0 ? "aspect-[16/9]" : "aspect-[4/3]"
                    } bg-muted/50 animate-pulse rounded-sm`}
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
                className="flex items-center justify-between mb-10"
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

              <AnimatePresence mode="wait">
                {viewMode === "grid" ? (
                  <motion.div
                    key="grid"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="grid gap-x-6 gap-y-12 md:gap-x-8 md:gap-y-16 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                  >
                    {paginated.map((item, i) => {
                      const isFeatured =
                        sort === "newest" && i === 0 && item.is_featured;
                      return (
                        <div
                          key={item.id}
                          className={
                            isFeatured ? "sm:col-span-2 lg:col-span-3" : ""
                          }
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
                  </motion.div>
                ) : (
                  <motion.div
                    key="list"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="max-w-3xl"
                  >
                    {paginated.map((item, i) => (
                      <ListCard key={item.id} item={item} index={i} />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {hasMore && (
                <div className="flex justify-center mt-16">
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    className="group min-h-12 rounded-md border border-border/60 bg-background px-10 text-xs tracking-[0.15em] uppercase font-medium text-foreground hover:bg-foreground hover:text-background hover:border-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
        <section className="border-t border-border/40">
          <div className="container py-20 md:py-28">
            <FadeUp>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-end">
                <div className="md:col-span-8">
                  <div className="flex items-center gap-3 mb-6 text-[10px] tracking-[0.25em] uppercase text-muted-foreground font-medium">
                    <span className="h-px w-8 bg-primary" aria-hidden />
                    <span>{t("portfolio_start_project")}</span>
                  </div>
                  <h2 className="font-display text-4xl md:text-6xl text-foreground leading-[1.02] tracking-[-0.03em]">
                    {t("portfolio_inspired")}
                  </h2>
                  <p className="mt-5 text-muted-foreground max-w-lg leading-[1.7] text-base">
                    {t("portfolio_lets_create")}
                  </p>
                </div>
                <div className="md:col-span-4 md:text-right">
                  <Link
                    to="/contact"
                    className="group inline-flex items-center gap-3 min-h-12 rounded-md bg-foreground px-8 text-[11px] tracking-[0.2em] uppercase text-background hover:bg-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
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
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
