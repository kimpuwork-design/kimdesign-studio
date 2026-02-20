import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PublicNav } from "@/components/PublicNav";
import { supabase } from "@/integrations/supabase/client";
import { PortfolioItem } from "@/lib/portfolio";
import { useSettings } from "@/hooks/useSettings";
import { Search, MapPin, Calendar, Filter, Loader2, Grid3X3, Star } from "lucide-react";

const CATEGORIES = ["All", "Residential", "Commercial", "Interior", "Landscape", "Hospitality", "Other"];

function PortfolioCard({ item }: { item: PortfolioItem }) {
  return (
    <Link to={`/portfolio/${item.slug}`}
      className="group block rounded-2xl overflow-hidden border border-border bg-card hover:border-primary/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="aspect-[4/3] overflow-hidden bg-secondary/50 relative">
        {item.cover_image_url ? (
          <img
            src={item.cover_image_url}
            alt={item.title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Grid3X3 size={36} className="text-muted-foreground/30" />
          </div>
        )}
        {item.is_featured && (
          <div className="absolute top-3 left-3 flex items-center gap-1 rounded-full bg-primary/90 px-2.5 py-1 text-xs font-semibold text-primary-foreground backdrop-blur-sm">
            <Star size={10} className="fill-current" />Featured
          </div>
        )}
        {item.category && (
          <div className="absolute top-3 right-3 rounded-full bg-background/80 backdrop-blur-sm px-2.5 py-1 text-xs font-semibold text-foreground">
            {item.category}
          </div>
        )}
      </div>
      <div className="p-5">
        <h3 className="font-display text-xl font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">{item.title}</h3>
        <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2">{item.summary}</p>
        <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
          {item.location && <span className="flex items-center gap-1"><MapPin size={11} />{item.location}</span>}
          {item.year && <span className="flex items-center gap-1"><Calendar size={11} />{item.year}</span>}
        </div>
        {item.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {item.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}

export default function PublicPortfolio() {
  const { settings } = useSettings();
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 9;

  useEffect(() => {
    setLoading(true);
    supabase
      .from("portfolio_items")
      .select("*")
      .eq("is_published", true)
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setItems((data as PortfolioItem[]) ?? []);
        setLoading(false);
      });
  }, []);

  const filtered = items.filter((item) => {
    if (category !== "All" && item.category !== category) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.location?.toLowerCase().includes(q) ||
        item.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const featured = filtered.filter((i) => i.is_featured);
  const rest = filtered.filter((i) => !i.is_featured);
  const paginated = rest.slice(0, page * PAGE_SIZE);
  const hasMore = rest.length > paginated.length;

  const studioName = settings?.studio_name ?? "Studio";

  return (
    <div className="bg-background min-h-screen">
      {/* SEO meta via helmet-style head injection */}
      <title>{`Portfolio — ${studioName}`}</title>

      <PublicNav />

      {/* Hero */}
      <section className="container pt-16 pb-10">
        <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">Our Work</p>
        <h1 className="font-display text-5xl md:text-6xl font-bold text-foreground leading-tight">
          Portfolio
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-xl">
          A curated selection of projects across architecture, interiors, and design.
        </p>
      </section>

      {/* Filters */}
      <section className="sticky top-16 z-30 bg-background/95 backdrop-blur border-b border-border">
        <div className="container py-3 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search projects…"
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="flex gap-1.5 flex-wrap items-center">
            <Filter size={13} className="text-muted-foreground" />
            {CATEGORIES.map((c) => (
              <button key={c} onClick={() => { setCategory(c); setPage(1); }}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${category === c ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
                {c}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="container py-12 space-y-16">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={28} className="animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Grid3X3 size={48} className="text-muted-foreground/20 mb-4" />
            <h3 className="font-display text-2xl font-semibold text-foreground">No projects found</h3>
            <p className="mt-2 text-muted-foreground">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <>
            {/* Featured section */}
            {featured.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-6">
                  <Star size={16} className="text-primary fill-primary" />
                  <h2 className="font-display text-2xl font-semibold text-foreground">Featured Projects</h2>
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                  {featured.slice(0, 2).map((item) => (
                    <PortfolioCard key={item.id} item={item} />
                  ))}
                </div>
              </section>
            )}

            {/* All projects grid */}
            {rest.length > 0 && (
              <section>
                {featured.length > 0 && (
                  <h2 className="font-display text-2xl font-semibold text-foreground mb-6">All Projects</h2>
                )}
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {paginated.map((item) => (
                    <PortfolioCard key={item.id} item={item} />
                  ))}
                </div>

                {hasMore && (
                  <div className="flex justify-center mt-10">
                    <button onClick={() => setPage((p) => p + 1)}
                      className="rounded-full border border-border px-8 py-3 text-sm font-semibold text-foreground hover:bg-secondary transition-colors">
                      Load more projects
                    </button>
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </div>

      {/* CTA */}
      <section className="border-t border-border py-16">
        <div className="container text-center">
          <h2 className="font-display text-3xl font-bold text-foreground">Inspired by what you see?</h2>
          <p className="mt-3 text-muted-foreground">Let's create something remarkable together.</p>
          <Link to="/contact"
            className="inline-flex items-center gap-2 mt-6 rounded-full bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
            Start a Project
          </Link>
        </div>
      </section>

      <footer className="border-t border-border py-8">
        <div className="container flex items-center justify-between gap-4">
          <span className="font-display font-bold text-foreground">{studioName}</span>
          <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} {studioName}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
