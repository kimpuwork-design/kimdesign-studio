import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PublicNav } from "@/components/PublicNav";
import { PublicFooter } from "@/components/PublicFooter";
import { supabase } from "@/integrations/supabase/client";
import { PortfolioItem } from "@/lib/portfolio";
import { Search, MapPin, Calendar, Grid3X3, Star, Loader2 } from "lucide-react";

const CATEGORIES = ["All", "Residential", "Cultural", "Commercial", "Interior", "Landscape", "Civic", "Mixed-Use"];

function PortfolioCard({ item }: { item: PortfolioItem }) {
  return (
    <Link to={`/portfolio/${item.slug}`}
      className="group block overflow-hidden rounded-2xl border border-border/50 bg-background/60 backdrop-blur-sm hover:border-primary/30 hover:shadow-[0_0_30px_rgba(var(--primary),0.08)] transition-all duration-300">
      <div className="aspect-[4/3] overflow-hidden relative">
        {item.cover_image_url ? (
          <img
            src={item.cover_image_url}
            alt={item.title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <Grid3X3 size={36} className="text-muted-foreground/30" />
          </div>
        )}
        {/* Glass overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        {item.is_featured && (
          <div className="absolute top-3 left-3 flex items-center gap-1 rounded-full bg-primary/90 backdrop-blur-sm px-2.5 py-1 text-xs font-medium text-primary-foreground tracking-wide">
            <Star size={9} className="fill-current" /> Featured
          </div>
        )}
        {item.category && (
          <div className="absolute top-3 right-3 rounded-full bg-background/80 backdrop-blur-sm px-2.5 py-1 text-xs font-medium text-foreground tracking-wide">
            {item.category}
          </div>
        )}
        {/* Hover info overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <p className="text-white text-sm font-medium line-clamp-2">{item.summary}</p>
        </div>
      </div>
      <div className="p-5">
        <h3 className="font-display text-xl font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1">{item.title}</h3>
        <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
          {item.location && <span className="flex items-center gap-1"><MapPin size={10} />{item.location}</span>}
          {item.year && <span className="flex items-center gap-1"><Calendar size={10} />{item.year}</span>}
        </div>
        {item.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {item.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="rounded-full bg-secondary/80 backdrop-blur-sm px-2 py-0.5 text-[10px] tracking-wide uppercase font-medium text-muted-foreground">
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

  return (
    <div className="bg-background min-h-screen relative">
      <PublicNav />

      {/* Ambient orbs */}
      <div className="fixed top-1/4 -right-40 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[150px] pointer-events-none" />

      {/* Hero */}
      <section className="container pt-20 pb-10 relative z-10">
        <p className="mb-4 text-xs font-medium tracking-[0.25em] uppercase text-primary">Selected Work</p>
        <h1 className="font-display text-[clamp(2.5rem,6vw,5.5rem)] font-light text-foreground leading-tight">
          Projects
        </h1>
        <p className="mt-4 text-muted-foreground font-light max-w-lg leading-relaxed">
          Sixteen years of architectural practice across residential, cultural, civic, and commercial typologies.
        </p>
      </section>

      {/* Filters */}
      <section className="sticky top-16 z-30 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="container py-3 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search projects…"
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-border/50 bg-background/60 backdrop-blur-sm text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="flex gap-2 flex-wrap items-center">
            {CATEGORIES.map((c) => (
              <button key={c} onClick={() => { setCategory(c); setPage(1); }}
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

      <div className="container py-12 space-y-16 relative z-10">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={28} className="animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Grid3X3 size={48} className="text-muted-foreground/20 mb-4" />
            <h3 className="font-display text-2xl font-light text-foreground">No projects found</h3>
            <p className="mt-2 text-muted-foreground text-sm">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <>
            {featured.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-8">
                  <div className="h-px flex-1 bg-border/50" />
                  <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground">Featured</p>
                  <div className="h-px flex-1 bg-border/50" />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {featured.slice(0, 2).map((item) => (
                    <PortfolioCard key={item.id} item={item} />
                  ))}
                </div>
              </section>
            )}

            {rest.length > 0 && (
              <section>
                {featured.length > 0 && (
                  <div className="flex items-center gap-3 mb-8">
                    <div className="h-px flex-1 bg-border/50" />
                    <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground">All Projects</p>
                    <div className="h-px flex-1 bg-border/50" />
                  </div>
                )}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {paginated.map((item) => (
                    <PortfolioCard key={item.id} item={item} />
                  ))}
                </div>

                {hasMore && (
                  <div className="flex justify-center mt-10">
                    <button onClick={() => setPage((p) => p + 1)}
                      className="rounded-2xl border border-border/50 bg-background/60 backdrop-blur-sm px-10 py-3 text-xs tracking-[0.15em] uppercase font-medium text-foreground hover:bg-secondary hover:border-primary/30 transition-all duration-200">
                      Load more
                    </button>
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </div>

      {/* CTA */}
      <section className="border-t border-border/50 py-20 relative z-10">
        <div className="container text-center">
          <h2 className="font-display text-4xl font-light text-foreground">Inspired by what you see?</h2>
          <p className="mt-3 text-muted-foreground text-sm">Let's create something remarkable together.</p>
          <Link to="/contact"
            className="inline-flex items-center gap-2 mt-8 rounded-2xl bg-primary px-10 py-3 text-sm tracking-wide text-primary-foreground hover:bg-primary/90 transition-colors">
            Begin a Conversation
          </Link>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
