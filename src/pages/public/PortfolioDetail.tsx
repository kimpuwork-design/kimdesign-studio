import { useEffect, useState, useRef, useCallback } from "react";
import { Helmet } from "react-helmet-async";
import { useContentProtection } from "@/hooks/useContentProtection";
import { useParams, Link } from "react-router-dom";
import { PublicNav } from "@/components/PublicNav";
import { PublicFooter } from "@/components/PublicFooter";
import { supabase } from "@/integrations/supabase/client";
import { GalleryImage } from "@/lib/portfolio";
import { FileAsset, formatBytes, FILE_CATEGORIES, isImageExt, getPublicFileSignedUrls } from "@/lib/files";
import { FileIcon } from "@/components/files/FileIcon";
import { FilePreviewModal } from "@/components/files/FilePreviewModal";
import { CinematicLightbox } from "@/components/media/CinematicLightbox";
import { ProgressiveImage } from "@/components/media/ProgressiveImage";
import { FadeUp, StaggerContainer, StaggerItem, SlideIn } from "@/components/motion/MotionWrappers";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";

import {
  MapPin, Calendar, Tag, ArrowLeft, ArrowRight,
  ExternalLink, Loader2, Eye, FolderOpen, Maximize2,
  Camera, FileText, Layers, Clock,
} from "lucide-react";

const luxuryEase = [0.22, 1, 0.36, 1] as const;

/* ─── Floating Reading Progress Indicator (motion-only, no re-renders) ─── */
function ReadingProgress() {
  const { scrollYProgress } = useScroll();
  const smooth = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.001 });
  const circumference = 2 * Math.PI * 18;
  const dashOffset = useTransform(smooth, (v) => circumference * (1 - v));

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 1, duration: 0.5 }}
      className="fixed bottom-8 right-8 z-50 hidden lg:flex items-center justify-center pointer-events-none"
    >
      <div className="relative w-14 h-14">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 40 40">
          <circle cx="20" cy="20" r="18" fill="none" stroke="hsl(var(--border))" strokeWidth="1.5" opacity="0.3" />
          <motion.circle
            cx="20" cy="20" r="18"
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            style={{ strokeDashoffset: dashOffset }}
          />
        </svg>
      </div>
    </motion.div>
  );
}


/* ─── Gallery Image with Inner Parallax ─── */
function GalleryImageCard({ img, idx, onClick }: { img: { id: string; url: string; name: string }; idx: number; onClick: () => void }) {
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const el = e.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    setMousePos({
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    });
  }, []);
  
  const handleMouseLeave = useCallback(() => {
    setMousePos({ x: 0.5, y: 0.5 });
  }, []);
  
  return (
    <StaggerItem>
      <motion.button
        whileHover={{ scale: 1.012 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="group relative w-full overflow-hidden break-inside-avoid block bg-muted/20"
        data-cursor-hover
        data-cursor-label="View"
        aria-label={`Open image ${idx + 1}${img.name ? `: ${img.name}` : ""}`}
      >
        <ProgressiveImage
          src={img.url}
          alt={img.name || `Gallery ${idx + 1}`}
          eager={idx < 4}
          thumbWidth={800}
          onContextMenu={(e) => e.preventDefault()}
          className="w-full object-cover"
          wrapperClassName="w-full"
          animate={{
            scale: 1.08,
            x: (mousePos.x - 0.5) * -14,
            y: (mousePos.y - 0.5) * -14,
          }}
          // @ts-ignore - motion props passed through
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        />

        {/* Index badge */}
        <span className="absolute top-3 left-3 z-[2] font-mono-label text-[9px] tracking-[0.2em] text-background/90 bg-foreground/40 backdrop-blur-sm px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 tabular-nums">
          {String(idx + 1).padStart(2, "0")}
        </span>

        {/* Hover veil */}
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/55 via-foreground/0 to-foreground/0 opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none" />

        {/* Maximize icon */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="h-11 w-11 rounded-full bg-background/85 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all duration-300 shadow-lg">
            <Maximize2 size={15} className="text-foreground" />
          </div>
        </div>

        {/* Caption */}
        {img.name && (
          <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 translate-y-2 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-400 pointer-events-none">
            <p className="text-[11px] text-background/90 font-light leading-snug line-clamp-2 drop-shadow">
              {img.name}
            </p>
          </div>
        )}
      </motion.button>
    </StaggerItem>
  );
}

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
  useContentProtection();
  const [item, setItem] = useState<ProjectItem | null>(null);
  const [gallery, setGallery] = useState<GalleryImage[]>([]);
  const [files, setFiles] = useState<FileAsset[]>([]);
  const [galleryImages, setGalleryImages] = useState<{ url: string; name: string; chapter?: string }[]>([]);
  const [related, setRelated] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [preview, setPreview] = useState<FileAsset | null>(null);

  const heroRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 1.15]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 80]);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    let refreshTimer: number | undefined;

    // Stage 1 — fetch ONLY project metadata so the hero + body render immediately.
    (async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, title, slug, summary, description, content, thumbnail_url, category, location, year, tags, is_featured, is_public, status, start_date, target_date, created_at, updated_at")
        .eq("slug", slug)
        .eq("is_public", true)
        .maybeSingle();

      if (cancelled) return;
      if (error || !data) {
        console.error("Project fetch error:", error);
        setNotFound(true);
        setLoading(false);
        return;
      }
      const p = data as unknown as ProjectItem;
      setItem(p);
      setLoading(false);

      // Stage 2 — in parallel, fetch gallery, related and file list (no signing yet).
      const hasCategory = p.category && p.category.trim().length > 0;
      const relatedQuery = supabase.from("projects")
        .select("id, slug, title, thumbnail_url, category, location, year, summary, description, tags, is_featured, is_public, created_at, updated_at, content")
        .eq("is_public", true)
        .neq("id", p.id)
        .limit(3);
      if (hasCategory) relatedQuery.eq("category", p.category as string);
      else relatedQuery.eq("is_featured", true);

      const [{ data: gal }, { data: rel }, { data: fileData }] = await Promise.all([
        supabase.from("portfolio_gallery").select("*").eq("project_id", p.id).order("sort_order"),
        relatedQuery,
        supabase.from("file_assets").select("id, project_id, category, original_name, mime_type, extension, size_bytes, version, sort_order, created_at, is_deleted").eq("project_id", p.id).eq("is_deleted", false).order("sort_order", { ascending: true }).order("created_at", { ascending: false }),
      ]);
      if (cancelled) return;

      setGallery((gal as GalleryImage[]) ?? []);
      setRelated((rel as unknown as ProjectItem[]) ?? []);
      const allFiles = (fileData as unknown as FileAsset[]) ?? [];
      setFiles(allFiles);

      // Stage 3 — batch-sign all image URLs in ONE round-trip
      const imageFiles = allFiles.filter((f) => isImageExt(f.extension ?? ""));
      if (imageFiles.length === 0) return;

      const FILE_CAT_LABEL: Record<string, string> = Object.fromEntries(FILE_CATEGORIES.map((c) => [c.value, c.label]));
      const imageIds = imageFiles.map((f) => f.id);

      const refreshSignedUrls = async () => {
        const urls = await getPublicFileSignedUrls(imageIds);
        if (cancelled) return;
        const imgs = imageFiles
          .map((f) => {
            const url = urls[f.id];
            if (!url) return null;
            return { url, name: f.original_name, chapter: FILE_CAT_LABEL[f.category] ?? f.category };
          })
          .filter((x): x is { url: string; name: string; chapter: string } => !!x);
        setGalleryImages(imgs);
        // Silently re-sign 30s before the 5-minute expiry to avoid broken images on long sessions.
        refreshTimer = window.setTimeout(refreshSignedUrls, 4.5 * 60 * 1000);
      };

      await refreshSignedUrls();
    })();

    return () => {
      cancelled = true;
      if (refreshTimer) window.clearTimeout(refreshTimer);
    };
  }, [slug]);

  if (loading) return (
    <div className="bg-background min-h-screen">
      <PublicNav />
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <Loader2 size={28} className="animate-spin text-primary" />
        <p className="text-xs text-muted-foreground tracking-[0.2em] uppercase">Loading project</p>
      </div>
    </div>
  );

  if (notFound || !item) return (
    <div className="bg-background min-h-screen">
      <PublicNav />
      <div className="container py-32 text-center">
        <h1 className="font-display text-4xl text-foreground">Project not found</h1>
        <p className="mt-3 text-muted-foreground text-sm">This project doesn't exist or has been unpublished.</p>
        <Link to="/portfolio" className="inline-flex items-center gap-2 mt-6 text-primary hover:underline text-sm">
          <ArrowLeft size={14} /> Back to Portfolio
        </Link>
      </div>
    </div>
  );

  const coverUrl = item.thumbnail_url;
  const displaySummary = item.summary || item.description || "";
  const pageTitle = `${item.title} — KIM DESIGN STUDIO`;
  const allGalleryItems: { id: string; url: string; name: string; chapter?: string }[] = gallery.length > 0
    ? gallery.map((g) => ({ id: g.id, url: g.image_url, name: g.caption ?? "", chapter: undefined }))
    : galleryImages.map((g, i) => ({ id: `img-${i}`, url: g.url, name: g.name, chapter: g.chapter }));

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
    "author": { "@type": "Organization", "name": "KIM DESIGN STUDIO" },
  };

  const stats = [
    allGalleryItems.length > 0 && { icon: Camera, n: allGalleryItems.length, label: "Photos" },
    nonImageFiles.length > 0 && { icon: FileText, n: nonImageFiles.length, label: "Files" },
    item.tags?.length > 0 && { icon: Tag, n: item.tags.length, label: "Tags" },
  ].filter(Boolean) as { icon: typeof Camera; n: number; label: string }[];

  return (
    <div className="bg-background min-h-screen content-protected">
      <MetaTags title={pageTitle} description={displaySummary} image={coverUrl || ""} jsonLd={jsonLd} slug={item.slug || ""} />
      <PublicNav />
      <ReadingProgress />

      {/* ── Parallax Hero ── */}
      <div ref={heroRef} className="relative overflow-hidden">
        {coverUrl ? (
          <section className="relative h-[60vh] md:h-[75vh] min-h-[400px] max-h-[900px]">
            <motion.div style={{ scale: heroScale }} className="absolute inset-0">
              <ProgressiveImage 
                src={coverUrl} 
                alt={item.title} 
                eager 
                priority 
                aspectRatio="16 / 7"
                onContextMenu={(e) => e.preventDefault()} 
                className="w-full h-full object-cover" 
                wrapperClassName="w-full h-full"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-foreground/20 via-foreground/10 to-background" />
            </motion.div>
            {/* Film grain overlay */}
            <div className="absolute inset-0 noise-overlay pointer-events-none z-[1]" />
            <motion.div style={{ y: heroY, opacity: heroOpacity }} className="relative h-full container flex flex-col justify-end pb-10 md:pb-20 z-10">
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
                <Link to="/portfolio" className="inline-flex items-center gap-1.5 text-background/60 hover:text-background text-sm mb-8 transition-colors">
                  <ArrowLeft size={14} /> Back
                </Link>
              </motion.div>
              <div className="max-w-3xl">
                {item.category && (
                  <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className="text-[10px] tracking-[0.3em] uppercase text-background/50 mb-4">
                    {item.category}
                  </motion.p>
                )}
                <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2, ease: luxuryEase }}
                  className="font-display text-3xl md:text-6xl lg:text-8xl text-background leading-[0.92]">
                  {item.title}
                </motion.h1>
                <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                  className="mt-4 md:mt-6 text-background/60 text-sm md:text-lg max-w-xl font-light leading-relaxed">
                  {displaySummary}
                </motion.p>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                  className="flex flex-wrap items-center gap-4 mt-6 md:mt-8 text-[11px] tracking-[0.15em] uppercase text-background/40">
                  {item.location && (
                    <span className="flex items-center gap-1.5"><MapPin size={11} />{item.location}</span>
                  )}
                  {item.year && (
                    <span className="flex items-center gap-1.5"><Calendar size={11} />{item.year}</span>
                  )}
                  {stats.map((s) => (
                    <span key={s.label} className="flex items-center gap-1.5"><s.icon size={11} />{s.n} {s.label}</span>
                  ))}
                </motion.div>
              </div>
            </motion.div>
          </section>
        ) : (
          <section className="container pt-20 pb-10">
            <Link to="/portfolio" className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-sm mb-8 transition-colors">
              <ArrowLeft size={14} /> Back to Portfolio
            </Link>
            {item.category && <p className="text-[10px] tracking-[0.3em] uppercase text-primary mb-4">{item.category}</p>}
            <h1 className="font-display text-5xl md:text-7xl text-foreground leading-[0.92]">{item.title}</h1>
            <p className="mt-4 text-muted-foreground text-lg font-light">{displaySummary}</p>
          </section>
        )}
      </div>

      {/* ── Content ── */}
      <div className="container py-16 md:py-24">
        <div className="grid gap-12 md:gap-16 grid-cols-1 lg:grid-cols-[1fr_280px]">
          <div className="space-y-16 md:space-y-20">
            {/* Written content */}
            {item.content && (
              <FadeUp>
                <div className="prose-professional max-w-none">
                  <div className="text-foreground/80 leading-[1.9] whitespace-pre-wrap text-base">{item.content}</div>
                </div>
              </FadeUp>
            )}

            {/* Gallery — Masonry with parallax depth */}
            {allGalleryItems.length > 0 && (
              <FadeUp>
                <div className="flex items-center gap-4 mb-8">
                  <Camera size={16} className="text-primary" />
                  <h2 className="font-display text-2xl text-foreground">Gallery</h2>
                  <span className="text-xs text-muted-foreground">{allGalleryItems.length}</span>
                  <div className="h-px flex-1 bg-border/30" />
                  <button
                    onClick={() => setLightbox(0)}
                    className="hidden md:inline-flex items-center gap-1.5 text-[10px] tracking-[0.18em] uppercase text-muted-foreground hover:text-foreground transition-colors"
                    data-cursor-hover
                  >
                    <Maximize2 size={11} /> View All
                  </button>
                </div>
                <StaggerContainer className="columns-2 md:columns-3 gap-3 md:gap-4 space-y-3 md:space-y-4" staggerDelay={0.06}>
                  {allGalleryItems.map((img, idx) => (
                    <GalleryImageCard key={img.id} img={img} idx={idx} onClick={() => setLightbox(idx)} />
                  ))}
                </StaggerContainer>
              </FadeUp>
            )}

            {/* Non-image project files */}
            {nonImageFiles.length > 0 && (
              <FadeUp>
                <SectionHeader icon={FolderOpen} label="Project Files" count={nonImageFiles.length} />
                <div className="space-y-8">
                  {orderedCategories.map((cat) => {
                    const catLabel = FILE_CATEGORIES.find((c) => c.value === cat)?.label ?? cat;
                    return (
                      <div key={cat}>
                        <h3 className="mb-4 text-[10px] tracking-[0.25em] uppercase text-muted-foreground">{catLabel}</h3>
                        <StaggerContainer className="space-y-2" staggerDelay={0.05}>
                          {grouped[cat].map((file) => (
                            <StaggerItem key={file.id}>
                              <motion.div
                                whileHover={{ x: 4 }}
                                className="flex items-center gap-3 border border-border/30 bg-card/40 px-5 py-3.5 hover:border-primary/20 transition-all cursor-pointer"
                                onClick={() => setPreview(file)}
                              >
                                <FileIcon ext={file.extension ?? ""} size={18} className="text-muted-foreground shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="truncate text-sm text-foreground">{file.original_name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {formatBytes(file.size_bytes)}
                                    {file.version > 1 && <span className="ml-2 text-primary text-[10px]">v{file.version}</span>}
                                    {" · "}{new Date(file.created_at).toLocaleDateString()}
                                  </p>
                                </div>
                                <Eye size={14} className="text-muted-foreground/40 shrink-0" />
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
          <div className="space-y-8">
            <SlideIn direction="right" delay={0.3}>
              <div className="border border-border/30 p-6 space-y-5 sticky top-24">
                <h3 className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground flex items-center gap-2">
                  <Layers size={12} className="text-primary" /> Project Details
                </h3>
                {item.category && <DetailRow label="Category" value={item.category} />}
                {item.location && <DetailRow label="Location" value={item.location} icon={<MapPin size={12} />} />}
                {item.year && <DetailRow label="Year" value={String(item.year)} icon={<Calendar size={12} />} />}
                {item.created_at && <DetailRow label="Published" value={new Date(item.created_at).toLocaleDateString()} icon={<Clock size={12} />} />}
                {item.tags && item.tags.length > 0 && (
                  <div>
                    <p className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground mb-2 flex items-center gap-1"><Tag size={10} />Tags</p>
                    <div className="flex flex-wrap gap-1.5">
                      {item.tags.map((t) => (
                        <span key={t} className="border border-border/40 px-2.5 py-1 text-xs text-muted-foreground">{t}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </SlideIn>

            <SlideIn direction="right" delay={0.4}>
              <div className="bg-foreground p-8 text-center overflow-hidden relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10">
                  <h3 className="font-display text-xl text-background">Like what you see?</h3>
                  <p className="mt-2 text-background/50 text-sm font-light">Let's talk about your project.</p>
                  <Link to="/contact"
                    className="inline-flex items-center gap-2 mt-6 border border-background/20 px-6 py-3 text-xs tracking-[0.15em] uppercase text-background hover:bg-background hover:text-foreground transition-all duration-500">
                    Start a Conversation <ArrowRight size={12} />
                  </Link>
                </div>
              </div>
            </SlideIn>
          </div>
        </div>

        {/* ── Related Projects ── */}
        {related.length > 0 && (
          <FadeUp className="mt-24 md:mt-32 pt-16 border-t border-border/30">
            <div className="mb-12 md:mb-16">
              <p className="text-[10px] tracking-[0.35em] uppercase text-primary mb-4">More Work</p>
              <h2 className="font-display text-3xl md:text-5xl text-foreground leading-[1.1]">Related Projects</h2>
            </div>

            <StaggerContainer className="grid gap-4 md:gap-6 sm:grid-cols-3" staggerDelay={0.1}>
              {related.map((r) => {
                const rLink = r.slug ? `/portfolio/${r.slug}` : `/projects/${r.id}`;
                return (
                  <StaggerItem key={r.id}>
                    <Link to={rLink} className="group block relative overflow-hidden" data-cursor-hover>
                      <div className="aspect-[4/3] overflow-hidden relative">
                        {r.thumbnail_url ? (
                          <ProgressiveImage 
                            src={r.thumbnail_url} 
                            alt={r.title} 
                            thumbWidth={600}
                            className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform [transition-duration:900ms]" 
                            wrapperClassName="w-full h-full"
                          />
                        ) : (
                          <div className="w-full h-full bg-muted/30" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent opacity-50 group-hover:opacity-80 transition-opacity duration-500" />
                        <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6">
                          {r.category && (
                            <span className="text-[9px] tracking-[0.2em] uppercase text-background/50 block mb-2">
                              {r.category}
                            </span>
                          )}
                          <h3 className="font-display text-lg md:text-xl text-background leading-tight">{r.title}</h3>
                          {r.location && <p className="text-xs text-background/40 mt-1.5 flex items-center gap-1"><MapPin size={10} />{r.location}</p>}
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

      <PublicFooter />

      {lightbox !== null && allGalleryItems.length > 0 && (
        <CinematicLightbox
          images={allGalleryItems.map((g) => ({ id: g.id, image_url: g.url, caption: g.name, chapter: g.chapter }))}
          startIndex={lightbox}
          onClose={() => setLightbox(null)}
          title={item.title}
        />
      )}
      {preview && <FilePreviewModal file={preview} onClose={() => setPreview(null)} role="PUBLIC" />}
    </div>
  );
}

/* ── Helpers ── */
function SectionHeader({ icon: Icon, label, count }: { icon: typeof Camera; label: string; count?: number }) {
  return (
    <div className="flex items-center gap-4 mb-8">
      <Icon size={16} className="text-primary" />
      <h2 className="font-display text-2xl text-foreground">{label}</h2>
      {count != null && (
        <span className="text-xs text-muted-foreground">{count}</span>
      )}
      <div className="h-px flex-1 bg-border/30" />
    </div>
  );
}

function DetailRow({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground mb-0.5">{label}</p>
      <p className="text-sm text-foreground flex items-center gap-1.5">{icon}{value}</p>
    </div>
  );
}

function MetaTags({ title, description, image, jsonLd, slug }: { title: string; description: string; image: string; jsonLd: object; slug: string }) {
  const canonical = `https://kimdesign-studio.lovable.app/portfolio/${slug}`;
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      <meta property="og:type" content="article" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      {image && <meta property="og:image" content={image} />}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {image && <meta name="twitter:image" content={image} />}
      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
    </Helmet>
  );
}

