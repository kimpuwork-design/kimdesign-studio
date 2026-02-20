import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { PublicNav } from "@/components/PublicNav";
import { PublicFooter } from "@/components/PublicFooter";
import { supabase } from "@/integrations/supabase/client";
import { PortfolioItem, GalleryImage } from "@/lib/portfolio";

import {
  MapPin, Calendar, Tag, ArrowLeft, ArrowRight,
  X, ExternalLink, Loader2,
} from "lucide-react";

function LightBox({ images, startIndex, onClose }: { images: GalleryImage[]; startIndex: number; onClose: () => void }) {
  const [idx, setIdx] = useState(startIndex);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setIdx((i) => (i + 1) % images.length);
      if (e.key === "ArrowLeft") setIdx((i) => (i - 1 + images.length) % images.length);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [images.length, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
      <button onClick={onClose} className="absolute top-4 right-4 rounded-full bg-white/10 p-2.5 text-white hover:bg-white/20 transition-colors"><X size={20} /></button>
      <button onClick={() => setIdx((i) => (i - 1 + images.length) % images.length)}
        className="absolute left-4 rounded-full bg-white/10 p-2.5 text-white hover:bg-white/20 transition-colors"><ArrowLeft size={20} /></button>
      <img src={images[idx].image_url} alt="" className="max-h-[85vh] max-w-[85vw] rounded-lg object-contain" />
      <button onClick={() => setIdx((i) => (i + 1) % images.length)}
        className="absolute right-4 rounded-full bg-white/10 p-2.5 text-white hover:bg-white/20 transition-colors"><ArrowRight size={20} /></button>
      <div className="absolute bottom-4 text-white/60 text-sm">{idx + 1} / {images.length}</div>
    </div>
  );
}

export default function PortfolioDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [item, setItem] = useState<PortfolioItem | null>(null);
  const [gallery, setGallery] = useState<GalleryImage[]>([]);
  const [related, setRelated] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [lightbox, setLightbox] = useState<number | null>(null);

  useEffect(() => {
    if (!slug) return;
    const fetchData = async () => {
      const { data, error } = await supabase
        .from("portfolio_items")
        .select("*")
        .eq("slug", slug)
        .eq("is_published", true)
        .single();

      if (error || !data) { setNotFound(true); setLoading(false); return; }
      const p = data as PortfolioItem;
      setItem(p);

      const [{ data: gal }, { data: rel }] = await Promise.all([
        supabase.from("portfolio_gallery").select("*").eq("portfolio_id", p.id).order("sort_order"),
        supabase.from("portfolio_items")
          .select("id, slug, title, cover_image_url, category, location, year, summary, tags, is_featured, is_published, created_at, updated_at, content, client_feedback")
          .eq("is_published", true)
          .neq("id", p.id)
          .or(p.category ? `category.eq.${p.category}` : "is_featured.eq.true")
          .limit(3),
      ]);

      setGallery((gal as GalleryImage[]) ?? []);
      setRelated((rel as unknown as PortfolioItem[]) ?? []);
      setLoading(false);
    };
    fetchData();
  }, [slug]);

  

  if (loading) return (
    <div className="bg-background min-h-screen">
      <PublicNav />
      <div className="flex justify-center py-32"><Loader2 size={28} className="animate-spin text-muted-foreground" /></div>
    </div>
  );

  if (notFound || !item) return (
    <div className="bg-background min-h-screen">
      <PublicNav />
      <div className="container py-32 text-center">
        <h1 className="font-display text-4xl font-bold text-foreground">Project not found</h1>
        <p className="mt-3 text-muted-foreground">This project doesn't exist or has been unpublished.</p>
        <Link to="/portfolio" className="inline-flex items-center gap-2 mt-6 text-primary hover:underline"><ArrowLeft size={16} />Back to Portfolio</Link>
      </div>
    </div>
  );

  const pageTitle = `${item.title} — FORMA`;
  const pageDesc = item.summary;

  // JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    "name": item.title,
    "description": item.summary,
    "image": item.cover_image_url,
    "locationCreated": item.location,
    "dateCreated": item.year?.toString(),
    "url": `${window.location.origin}/portfolio/${item.slug}`,
    "author": { "@type": "Organization", "name": "FORMA" },
  };

  return (
    <div className="bg-background min-h-screen">
      {/* SEO — injected via dangerouslySetInnerHTML workaround using useEffect */}
      <MetaTags title={pageTitle} description={pageDesc} image={item.cover_image_url} jsonLd={jsonLd} />

      <PublicNav />

      {/* Hero */}
      <section className="relative overflow-hidden">
        {item.cover_image_url ? (
          <>
            <div className="absolute inset-0">
              <img src={item.cover_image_url} alt={item.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-background" />
            </div>
            <div className="relative container py-28 md:py-40">
              <Link to="/portfolio" className="inline-flex items-center gap-1.5 text-white/70 hover:text-white text-sm mb-6 transition-colors">
                <ArrowLeft size={14} />Back to Portfolio
              </Link>
              <div className="max-w-2xl">
                {item.category && (
                  <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">{item.category}</p>
                )}
                <h1 className="font-display text-4xl md:text-6xl font-bold text-white leading-tight">{item.title}</h1>
                <p className="mt-4 text-white/80 text-lg max-w-lg">{item.summary}</p>
                <div className="flex flex-wrap gap-4 mt-6 text-white/70 text-sm">
                  {item.location && <span className="flex items-center gap-1.5"><MapPin size={14} />{item.location}</span>}
                  {item.year && <span className="flex items-center gap-1.5"><Calendar size={14} />{item.year}</span>}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="container pt-16 pb-10">
            <Link to="/portfolio" className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-sm mb-6 transition-colors">
              <ArrowLeft size={14} />Back to Portfolio
            </Link>
            {item.category && <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">{item.category}</p>}
            <h1 className="font-display text-5xl font-bold text-foreground">{item.title}</h1>
            <p className="mt-4 text-muted-foreground text-lg">{item.summary}</p>
          </div>
        )}
      </section>

      {/* Content */}
      <div className="container py-16">
        <div className="grid gap-12 lg:grid-cols-[1fr_280px]">
          <div className="space-y-10">
            {/* Description */}
            {item.content && (
              <div className="prose prose-lg max-w-none text-foreground">
                <div className="text-foreground leading-relaxed whitespace-pre-wrap text-base">
                  {item.content}
                </div>
              </div>
            )}

            {/* Gallery */}
            {gallery.length > 0 && (
              <div>
                <h2 className="font-display text-2xl font-semibold text-foreground mb-6">Gallery</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {gallery.map((img, idx) => (
                    <button key={img.id} onClick={() => setLightbox(idx)}
                      className="aspect-square overflow-hidden rounded-xl bg-secondary/50 group">
                      <img
                        src={img.image_url}
                        alt={`Gallery ${idx + 1}`}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
              <h3 className="font-semibold text-foreground text-sm uppercase tracking-wider">Project Details</h3>
              {item.category && (
                <div><p className="text-xs text-muted-foreground mb-0.5">Category</p><p className="font-medium text-foreground">{item.category}</p></div>
              )}
              {item.location && (
                <div><p className="text-xs text-muted-foreground mb-0.5">Location</p><p className="font-medium text-foreground flex items-center gap-1"><MapPin size={13} />{item.location}</p></div>
              )}
              {item.year && (
                <div><p className="text-xs text-muted-foreground mb-0.5">Year</p><p className="font-medium text-foreground flex items-center gap-1"><Calendar size={13} />{item.year}</p></div>
              )}
              {item.tags.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1"><Tag size={11} />Tags</p>
                  <div className="flex flex-wrap gap-1.5">
                    {item.tags.map((t) => (
                      <span key={t} className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-muted-foreground">{t}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-2xl bg-foreground p-6 text-center">
              <h3 className="font-display text-lg font-bold text-background">Like what you see?</h3>
              <p className="mt-1.5 text-background/70 text-sm">Let's talk about your project.</p>
              <Link to="/contact"
                className="inline-flex items-center gap-2 mt-4 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
                Request a Consultation <ExternalLink size={13} />
              </Link>
            </div>
          </div>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <section className="mt-16 pt-12 border-t border-border">
            <h2 className="font-display text-2xl font-semibold text-foreground mb-8">Related Projects</h2>
            <div className="grid gap-6 sm:grid-cols-3">
              {related.map((r) => (
                <Link key={r.id} to={`/portfolio/${r.slug}`}
                  className="group block rounded-xl overflow-hidden border border-border bg-card hover:border-primary/40 transition-all hover:-translate-y-1">
                  <div className="aspect-[4/3] overflow-hidden bg-secondary/50">
                    {r.cover_image_url ? (
                      <img src={r.cover_image_url} alt={r.title} loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full" />
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-display font-semibold text-foreground group-hover:text-primary transition-colors">{r.title}</h3>
                    {r.category && <p className="text-xs text-muted-foreground mt-1">{r.category}</p>}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* CTA */}
      <section className="border-t border-border py-16 text-center">
        <div className="container">
          <h2 className="font-display text-3xl font-bold text-foreground">Ready to start your project?</h2>
          <p className="mt-3 text-muted-foreground">We'd love to hear about your vision.</p>
          <Link to="/contact"
            className="inline-flex items-center gap-2 mt-6 rounded-full bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
            Request a Consultation
          </Link>
        </div>
      </section>

      <PublicFooter />

      {lightbox !== null && (
        <LightBox images={gallery} startIndex={lightbox} onClose={() => setLightbox(null)} />
      )}
    </div>
  );
}

// Inject meta tags into document <head>
function MetaTags({ title, description, image, jsonLd }: { title: string; description: string; image: string; jsonLd: object }) {
  useEffect(() => {
    document.title = title;

    const setMeta = (name: string, content: string, prop = false) => {
      const attr = prop ? "property" : "name";
      let el = document.querySelector(`meta[${attr}="${name}"]`);
      if (!el) { el = document.createElement("meta"); el.setAttribute(attr, name); document.head.appendChild(el); }
      el.setAttribute("content", content);
    };

    setMeta("description", description);
    setMeta("og:title", title, true);
    setMeta("og:description", description, true);
    setMeta("og:image", image, true);
    setMeta("og:type", "article", true);

    // JSON-LD
    let script = document.querySelector("#portfolio-jsonld") as HTMLScriptElement | null;
    if (!script) { script = document.createElement("script"); script.id = "portfolio-jsonld"; script.type = "application/ld+json"; document.head.appendChild(script); }
    script.textContent = JSON.stringify(jsonLd);

    return () => { document.title = title.split(" — ")[1] || "Studio"; };
  }, [title, description, image, jsonLd]);

  return null;
}
