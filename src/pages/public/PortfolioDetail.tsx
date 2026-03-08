import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { PublicNav } from "@/components/PublicNav";
import { PublicFooter } from "@/components/PublicFooter";
import { supabase } from "@/integrations/supabase/client";
import { GalleryImage } from "@/lib/portfolio";
import { FileAsset, formatBytes, FILE_CATEGORIES, isImageExt, getPublicFileSignedUrl } from "@/lib/files";
import { FileIcon } from "@/components/files/FileIcon";
import { FilePreviewModal } from "@/components/files/FilePreviewModal";
import { CinematicLightbox } from "@/components/media/CinematicLightbox";
import { FadeUp, StaggerContainer, StaggerItem, SlideIn } from "@/components/motion/MotionWrappers";
import { motion, useScroll, useTransform } from "framer-motion";

import {
  MapPin, Calendar, Tag, ArrowLeft, ArrowRight,
  ExternalLink, Loader2, Eye, FolderOpen, Maximize2,
  Camera, FileText, Layers, Clock,
} from "lucide-react";

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

  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 1.15]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 80]);

  useEffect(() => {
    if (!slug) return;
    const fetchData = async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("slug", slug)
        .eq("is_public", true)
        .single();

      if (error || !data) { setNotFound(true); setLoading(false); return; }
      const p = data as unknown as ProjectItem;
      setItem(p);

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
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <Loader2 size={28} className="animate-spin text-primary" />
        <p className="text-xs text-muted-foreground tracking-widest uppercase">Loading project</p>
      </div>
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
  const allGalleryItems = gallery.length > 0
    ? gallery.map((g) => ({ id: g.id, url: g.image_url, name: "" }))
    : galleryImages.map((g, i) => ({ id: `img-${i}`, url: g.url, name: g.name }));

  const nonImageFiles = files.filter((f) => !isImageExt(f.extension ?? ""));
  const grouped: Record<string, FileAsset[]> = {};
  for (const f of nonImageFiles) {
    const cat = f.category;
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(f);
  }
  const orderedCategories = FILE_CATEGORIES.map((c) => c.value).filter((c) => grouped[c]);

  const jsonLd = {
    "@context": "https://schema.org", "@type": "CreativeWork",
    "name": item.title, "description": displaySummary, "image": coverUrl,
    "locationCreated": item.location, "dateCreated": item.year?.toString(),
    "url": `${window.location.origin}/portfolio/${item.slug}`,
    "author": { "@type": "Organization", "name": "FORMA" },
  };

  const stats = [
    allGalleryItems.length > 0 && { icon: Camera, n: allGalleryItems.length, label: "Photos" },
    nonImageFiles.length > 0 && { icon: FileText, n: nonImageFiles.length, label: "Files" },
    item.tags?.length > 0 && { icon: Tag, n: item.tags.length, label: "Tags" },
  ].filter(Boolean) as { icon: typeof Camera; n: number; label: string }[];

  return (
    <div className="bg-background min-h-screen">
      <MetaTags title={pageTitle} description={displaySummary} image={coverUrl || ""} jsonLd={jsonLd} />
      <PublicNav />

      {/* ── Parallax Hero ── */}
      <div ref={heroRef} className="relative overflow-hidden">
        {coverUrl ? (
          <section className="relative h-[55vh] md:h-[70vh] min-h-[400px] max-h-[800px]">
            <motion.div style={{ scale: heroScale }} className="absolute inset-0">
              <img src={coverUrl} alt={item.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-background" />
            </motion.div>
            <motion.div style={{ y: heroY, opacity: heroOpacity }} className="relative h-full container flex flex-col justify-end pb-8 md:pb-16 z-10">
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
                <Link to="/portfolio" className="inline-flex items-center gap-1.5 text-white/70 hover:text-white text-sm mb-8 transition-colors">
                  <ArrowLeft size={14} />Back
                </Link>
              </motion.div>
              <div className="max-w-3xl">
                {item.category && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-md border border-white/10 px-4 py-1.5 mb-4">
                    <Layers size={11} className="text-primary" />
                    <span className="text-xs font-semibold uppercase tracking-[0.15em] text-white/90">{item.category}</span>
                  </motion.div>
                )}
                <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  className="font-display text-2xl md:text-5xl lg:text-7xl font-bold text-white leading-[0.95] tracking-tight">
                  {item.title}
                </motion.h1>
                <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                  className="mt-4 text-white/75 text-lg max-w-xl font-light leading-relaxed">
                  {displaySummary}
                </motion.p>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                  className="flex flex-wrap items-center gap-3 mt-6">
                  {item.location && (
                    <span className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-sm text-white/80">
                      <MapPin size={13} />{item.location}
                    </span>
                  )}
                  {item.year && (
                    <span className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-sm text-white/80">
                      <Calendar size={13} />{item.year}
                    </span>
                  )}
                  {stats.map((s) => (
                    <span key={s.label} className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-sm text-white/80">
                      <s.icon size={13} />{s.n} {s.label}
                    </span>
                  ))}
                </motion.div>
              </div>
            </motion.div>
          </section>
        ) : (
          <section className="container pt-16 pb-10">
            <Link to="/portfolio" className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-sm mb-6 transition-colors">
              <ArrowLeft size={14} />Back to Portfolio
            </Link>
            {item.category && <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">{item.category}</p>}
            <h1 className="font-display text-5xl font-bold text-foreground">{item.title}</h1>
            <p className="mt-4 text-muted-foreground text-lg">{displaySummary}</p>
          </section>
        )}
      </div>

      {/* ── Content ── */}
      <div className="container py-16">
        <div className="grid gap-12 lg:grid-cols-[1fr_300px]">
          <div className="space-y-14">
            {/* Written content */}
            {item.content && (
              <FadeUp>
                <div className="prose prose-lg max-w-none">
                  <div className="text-foreground leading-relaxed whitespace-pre-wrap text-base">{item.content}</div>
                </div>
              </FadeUp>
            )}

            {/* Gallery — Masonry-style */}
            {allGalleryItems.length > 0 && (
              <FadeUp>
                <SectionHeader icon={Camera} label="Gallery" count={allGalleryItems.length} />
                <StaggerContainer className="columns-2 md:columns-3 gap-3 space-y-3" staggerDelay={0.06}>
                  {allGalleryItems.map((img, idx) => (
                    <StaggerItem key={img.id}>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setLightbox(idx)}
                        className="group relative w-full overflow-hidden rounded-xl break-inside-avoid"
                      >
                        <img src={img.url} alt={img.name || `Gallery ${idx + 1}`} loading="lazy"
                          className="w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
                          <div className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all duration-300">
                            <Maximize2 size={16} className="text-white" />
                          </div>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <p className="text-white text-xs font-medium truncate">{img.name || `Photo ${idx + 1}`}</p>
                        </div>
                      </motion.button>
                    </StaggerItem>
                  ))}
                </StaggerContainer>
              </FadeUp>
            )}

            {/* Non-image project files */}
            {nonImageFiles.length > 0 && (
              <FadeUp>
                <SectionHeader icon={FolderOpen} label="Project Files" count={nonImageFiles.length} />
                <div className="space-y-6">
                  {orderedCategories.map((cat) => {
                    const catLabel = FILE_CATEGORIES.find((c) => c.value === cat)?.label ?? cat;
                    return (
                      <div key={cat}>
                        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{catLabel}</h3>
                        <StaggerContainer className="space-y-2" staggerDelay={0.05}>
                          {grouped[cat].map((file) => (
                            <StaggerItem key={file.id}>
                              <motion.div
                                whileHover={{ x: 4 }}
                                className="flex items-center gap-3 rounded-2xl border border-border/30 bg-card/60 backdrop-blur-sm px-5 py-3.5 hover:border-primary/30 hover:shadow-[0_0_20px_hsl(var(--primary)/0.08)] transition-all cursor-pointer"
                                onClick={() => setPreview(file)}
                              >
                                <FileIcon ext={file.extension ?? ""} size={18} className="text-muted-foreground shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="truncate text-sm font-medium text-foreground">{file.original_name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {formatBytes(file.size_bytes)}
                                    {file.version > 1 && <span className="ml-2 rounded-full bg-primary/15 px-1.5 py-0.5 text-primary text-[10px] font-semibold">v{file.version}</span>}
                                    {" · "}{new Date(file.created_at).toLocaleDateString()}
                                  </p>
                                </div>
                                <Eye size={15} className="text-muted-foreground shrink-0" />
                              </motion.div>
                            </StaggerItem>
                          ))}
                        </StaggerContainer>
                      </div>
                    );
                  })}
                </div>
              </FadeUp>
            )}
          </div>

          {/* ── Sidebar ── */}
          <div className="space-y-6">
            <SlideIn direction="right" delay={0.3}>
              <div className="rounded-2xl border border-border bg-card p-6 space-y-5 sticky top-24">
                <h3 className="font-semibold text-foreground text-sm uppercase tracking-wider flex items-center gap-2">
                  <Layers size={14} className="text-primary" /> Project Details
                </h3>
                {item.category && (
                  <DetailRow label="Category" value={item.category} />
                )}
                {item.location && (
                  <DetailRow label="Location" value={item.location} icon={<MapPin size={13} />} />
                )}
                {item.year && (
                  <DetailRow label="Year" value={String(item.year)} icon={<Calendar size={13} />} />
                )}
                {item.created_at && (
                  <DetailRow label="Published" value={new Date(item.created_at).toLocaleDateString()} icon={<Clock size={13} />} />
                )}
                {item.tags && item.tags.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1"><Tag size={11} />Tags</p>
                    <div className="flex flex-wrap gap-1.5">
                      {item.tags.map((t) => (
                        <span key={t} className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors cursor-default">{t}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </SlideIn>

            <SlideIn direction="right" delay={0.4}>
              <div className="rounded-2xl bg-foreground p-6 text-center overflow-hidden relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10">
                  <h3 className="font-display text-lg font-bold text-background">Like what you see?</h3>
                  <p className="mt-1.5 text-background/70 text-sm">Let's talk about your project.</p>
                  <Link to="/contact"
                    className="inline-flex items-center gap-2 mt-4 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all hover:shadow-primary/30">
                    Request a Consultation <ExternalLink size={13} />
                  </Link>
                </div>
              </div>
            </SlideIn>
          </div>
        </div>

        {/* ── Related Projects ── */}
        {related.length > 0 && (
          <FadeUp className="mt-20 pt-12 border-t border-border/40">
            <div className="flex items-center gap-3 mb-10">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
              <h2 className="font-display text-2xl font-bold text-foreground tracking-tight">Related Projects</h2>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
            </div>

            <StaggerContainer className="grid gap-6 sm:grid-cols-3" staggerDelay={0.1}>
              {related.map((r) => {
                const rLink = r.slug ? `/portfolio/${r.slug}` : `/projects/${r.id}`;
                return (
                  <StaggerItem key={r.id}>
                    <Link to={rLink} className="group block relative rounded-2xl overflow-hidden glass-card-hover transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-primary/10">
                      <div className="aspect-[4/3] overflow-hidden bg-secondary/30 relative">
                        {r.thumbnail_url ? (
                          <img src={r.thumbnail_url} alt={r.title} loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-muted to-secondary" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-60 group-hover:opacity-90 transition-opacity duration-300" />
                        <div className="absolute bottom-0 left-0 right-0 p-5">
                          {r.category && (
                            <span className="inline-block rounded-full bg-white/10 backdrop-blur-sm border border-white/10 px-2.5 py-0.5 text-[10px] tracking-[0.15em] uppercase font-medium text-white/80 mb-2">
                              {r.category}
                            </span>
                          )}
                          <h3 className="font-display font-bold text-white text-base leading-tight">{r.title}</h3>
                          {r.location && <p className="text-xs text-white/60 mt-1.5 flex items-center gap-1"><MapPin size={11} />{r.location}</p>}
                        </div>
                      </div>
                    </Link>
                  </StaggerItem>
                );
              })}
            </StaggerContainer>
          </FadeUp>
        )}
      </div>

      {/* CTA */}
      <FadeUp>
        <section className="border-t border-border py-20 text-center relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full bg-primary/5 blur-[120px]" />
          </div>
          <div className="container relative z-10">
            <h2 className="font-display text-4xl font-bold text-foreground tracking-tight">Ready to start your project?</h2>
            <p className="mt-3 text-muted-foreground">We'd love to hear about your vision.</p>
            <Link to="/contact"
              className="inline-flex items-center gap-2 mt-8 rounded-2xl bg-primary px-10 py-3.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all">
              Request a Consultation
            </Link>
          </div>
        </section>
      </FadeUp>

      <PublicFooter />

      {lightbox !== null && allGalleryItems.length > 0 && (
        <CinematicLightbox
          images={allGalleryItems.map((g) => ({ id: g.id, image_url: g.url, caption: g.name }))}
          startIndex={lightbox}
          onClose={() => setLightbox(null)}
        />
      )}
      {preview && <FilePreviewModal file={preview} onClose={() => setPreview(null)} role="PUBLIC" />}
    </div>
  );
}

/* ── Helpers ── */
function SectionHeader({ icon: Icon, label, count }: { icon: typeof Camera; label: string; count?: number }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
        <Icon size={16} className="text-primary" />
      </div>
      <h2 className="font-display text-2xl font-semibold text-foreground">{label}</h2>
      {count != null && (
        <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-muted-foreground">{count}</span>
      )}
      <div className="h-px flex-1 bg-border/50" />
    </div>
  );
}

function DetailRow({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className="font-medium text-foreground flex items-center gap-1.5">{icon}{value}</p>
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
