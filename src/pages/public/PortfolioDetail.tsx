import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { PublicNav } from "@/components/PublicNav";
import { PublicFooter } from "@/components/PublicFooter";
import { supabase } from "@/integrations/supabase/client";
import { GalleryImage } from "@/lib/portfolio";
import { FileAsset, formatBytes, FILE_CATEGORIES, isImageExt, getPublicFileSignedUrl } from "@/lib/files";
import { FileIcon } from "@/components/files/FileIcon";
import { FilePreviewModal } from "@/components/files/FilePreviewModal";

import {
  MapPin, Calendar, Tag, ArrowLeft, ArrowRight,
  ExternalLink, Loader2, Eye, FolderOpen, Maximize2,
} from "lucide-react";
import { CinematicLightbox, LightboxImage } from "@/components/media/CinematicLightbox";

interface ProjectItem {
  id: string;
  title: string;
  slug: string | null;
  summary: string | null;
  description: string | null;
  content: string | null;
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

// Old LightBox removed — using CinematicLightbox component instead
export default function PortfolioDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [item, setItem] = useState<ProjectItem | null>(null);
  const [gallery, setGallery] = useState<GalleryImage[]>([]);
  const [files, setFiles] = useState<FileAsset[]>([]);
  const [galleryImages, setGalleryImages] = useState<{ url: string; name: string }[]>([]);
  const [related, setRelated] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [preview, setPreview] = useState<FileAsset | null>(null);

  useEffect(() => {
    if (!slug) return;
    const fetchData = async () => {
      // Fetch from projects table by slug
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("slug", slug)
        .eq("is_public", true)
        .single();

      if (error || !data) { setNotFound(true); setLoading(false); return; }
      const p = data as unknown as ProjectItem;
      setItem(p);

      // Fetch gallery, related projects, and file assets in parallel
      const [{ data: gal }, { data: rel }, { data: fileData }] = await Promise.all([
        supabase.from("portfolio_gallery").select("*").eq("project_id", p.id).order("sort_order"),
        supabase.from("projects")
          .select("id, slug, title, thumbnail_url, category, location, year, summary, description, tags, is_featured, is_public, created_at, updated_at, content")
          .eq("is_public", true)
          .neq("id", p.id)
          .or(p.category ? `category.eq.${p.category}` : "is_featured.eq.true")
          .limit(3),
        supabase.from("file_assets").select("*").eq("project_id", p.id).eq("is_deleted", false).order("sort_order", { ascending: true }).order("created_at", { ascending: false }),
      ]);

      setGallery((gal as GalleryImage[]) ?? []);
      setRelated((rel as unknown as ProjectItem[]) ?? []);
      const allFiles = (fileData as unknown as FileAsset[]) ?? [];
      setFiles(allFiles);

      // Generate signed URLs for image files
      const imageFiles = allFiles.filter((f) => isImageExt(f.extension ?? ""));
      if (imageFiles.length > 0) {
        const imgs = await Promise.all(
          imageFiles.map(async (f) => {
            const url = await getPublicFileSignedUrl(f.id);
            return { url: url ?? "", name: f.original_name };
          })
        );
        setGalleryImages(imgs.filter((i) => i.url));
      }

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

  const coverUrl = item.thumbnail_url;
  const displaySummary = item.summary || item.description || "";
  const pageTitle = `${item.title} — FORMA`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    "name": item.title,
    "description": displaySummary,
    "image": coverUrl,
    "locationCreated": item.location,
    "dateCreated": item.year?.toString(),
    "url": `${window.location.origin}/portfolio/${item.slug}`,
    "author": { "@type": "Organization", "name": "FORMA" },
  };

  return (
    <div className="bg-background min-h-screen">
      <MetaTags title={pageTitle} description={displaySummary} image={coverUrl || ""} jsonLd={jsonLd} />
      <PublicNav />

      {/* Hero */}
      <section className="relative overflow-hidden">
        {coverUrl ? (
          <>
            <div className="absolute inset-0">
              <img src={coverUrl} alt={item.title} className="w-full h-full object-cover" />
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
                <p className="mt-4 text-white/80 text-lg max-w-lg">{displaySummary}</p>
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
            <p className="mt-4 text-muted-foreground text-lg">{displaySummary}</p>
          </div>
        )}
      </section>

      {/* Content */}
      <div className="container py-16">
        <div className="grid gap-12 lg:grid-cols-[1fr_280px]">
          <div className="space-y-10">
            {item.content && (
              <div className="prose prose-lg max-w-none text-foreground">
                <div className="text-foreground leading-relaxed whitespace-pre-wrap text-base">
                  {item.content}
                </div>
              </div>
            )}

            {gallery.length > 0 && (
              <div>
                <h2 className="font-display text-2xl font-semibold text-foreground mb-6">Gallery</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {gallery.map((img, idx) => (
                    <button key={img.id} onClick={() => setLightbox(idx)}
                      className="aspect-square overflow-hidden rounded-xl bg-secondary/50 group">
                      <img src={img.image_url} alt={`Gallery ${idx + 1}`} loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Project file images as gallery */}
            {galleryImages.length > 0 && gallery.length === 0 && (
              <div>
                <h2 className="font-display text-2xl font-semibold text-foreground mb-6">Project Photos</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {galleryImages.map((img, idx) => (
                    <button key={idx} onClick={() => setLightbox(idx)}
                      className="aspect-square overflow-hidden rounded-xl bg-secondary/50 group relative">
                      <img src={img.url} alt={img.name} loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                        <Maximize2 size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Non-image project files */}
            {(() => {
              const nonImageFiles = files.filter((f) => !isImageExt(f.extension ?? ""));
              if (nonImageFiles.length === 0) return null;
              const grouped: Record<string, FileAsset[]> = {};
              for (const f of nonImageFiles) {
                const cat = f.category;
                if (!grouped[cat]) grouped[cat] = [];
                grouped[cat].push(f);
              }
              const orderedCategories = FILE_CATEGORIES.map((c) => c.value).filter((c) => grouped[c]);
              return (
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <FolderOpen size={18} className="text-primary" />
                    <h2 className="font-display text-2xl font-semibold text-foreground">Project Files</h2>
                  </div>
                  <div className="space-y-6">
                    {orderedCategories.map((cat) => {
                      const catLabel = FILE_CATEGORIES.find((c) => c.value === cat)?.label ?? cat;
                      return (
                        <div key={cat}>
                          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{catLabel}</h3>
                          <div className="space-y-2">
                            {grouped[cat].map((file) => (
                              <div key={file.id}
                                className="flex items-center gap-3 rounded-2xl border border-border/30 bg-background/60 backdrop-blur-sm px-5 py-3.5 hover:border-primary/30 hover:shadow-[0_0_20px_rgba(var(--primary),0.05)] transition-all">
                                <FileIcon ext={file.extension ?? ""} size={18} className="text-muted-foreground shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="truncate text-sm font-medium text-foreground">{file.original_name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {formatBytes(file.size_bytes)}
                                    {file.version > 1 && (
                                      <span className="ml-2 rounded-full bg-primary/15 px-1.5 py-0.5 text-primary text-[10px] font-semibold">v{file.version}</span>
                                    )}
                                    {" · "}{new Date(file.created_at).toLocaleDateString()}
                                  </p>
                                </div>
                                <button onClick={() => setPreview(file)} title="Preview"
                                  className="rounded-xl p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
                                  <Eye size={15} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
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
              {item.tags && item.tags.length > 0 && (
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
          <section className="mt-16 pt-12 border-t border-border/40 relative">
            <div className="absolute -top-20 right-0 w-72 h-72 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
            <div className="flex items-center gap-3 mb-10">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
              <h2 className="font-display text-2xl font-bold text-foreground tracking-tight">Related Projects</h2>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
            </div>

            <div className="grid gap-6 sm:grid-cols-3">
              {related.map((r) => {
                const rLink = r.slug ? `/portfolio/${r.slug}` : `/projects/${r.id}`;
                return (
                  <Link key={r.id} to={rLink}
                    className="group relative block rounded-2xl overflow-hidden glass-card-hover transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg hover:shadow-primary/10">
                    <div className="aspect-[4/3] overflow-hidden bg-secondary/30 relative">
                      {r.thumbnail_url ? (
                        <img src={r.thumbnail_url} alt={r.title} loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-muted to-secondary" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      {r.category && (
                        <span className="absolute top-3 left-3 rounded-full bg-primary/90 backdrop-blur-sm px-3 py-1 text-[11px] font-semibold text-primary-foreground uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                          {r.category}
                        </span>
                      )}
                    </div>
                    <div className="p-5 relative">
                      <div className="absolute top-0 left-5 right-5 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <h3 className="font-display font-bold text-foreground group-hover:text-primary transition-colors text-base">{r.title}</h3>
                      {r.location && (
                        <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1"><MapPin size={11} />{r.location}</p>
                      )}
                      <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-0 group-hover:translate-x-1">
                        View Project <ArrowRight size={12} />
                      </div>
                    </div>
                  </Link>
                );
              })}
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

      {lightbox !== null && gallery.length > 0 && (
        <CinematicLightbox
          images={gallery.map((g) => ({ id: g.id, image_url: g.image_url }))}
          startIndex={lightbox}
          onClose={() => setLightbox(null)}
        />
      )}
      {lightbox !== null && gallery.length === 0 && galleryImages.length > 0 && (
        <CinematicLightbox
          images={galleryImages.map((g, i) => ({ id: `img-${i}`, image_url: g.url, caption: g.name }))}
          startIndex={lightbox}
          onClose={() => setLightbox(null)}
        />
      )}
      {preview && <FilePreviewModal file={preview} onClose={() => setPreview(null)} role="PUBLIC" />}
    </div>
  );
}

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
    let script = document.querySelector("#portfolio-jsonld") as HTMLScriptElement | null;
    if (!script) { script = document.createElement("script"); script.id = "portfolio-jsonld"; script.type = "application/ld+json"; document.head.appendChild(script); }
    script.textContent = JSON.stringify(jsonLd);
    return () => { document.title = title.split(" — ")[1] || "Studio"; };
  }, [title, description, image, jsonLd]);
  return null;
}
