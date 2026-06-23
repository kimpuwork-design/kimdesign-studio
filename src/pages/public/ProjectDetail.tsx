import { useEffect, useState, useRef } from "react";
import { useContentProtection } from "@/hooks/useContentProtection";
import { useParams, Link } from "react-router-dom";
import { PublicNav } from "@/components/PublicNav";
import { PublicFooter } from "@/components/PublicFooter";
import { StatusBadge } from "@/components/StatusBadge";
import { FileIcon } from "@/components/files/FileIcon";
import { FilePreviewModal } from "@/components/files/FilePreviewModal";
import { supabase } from "@/integrations/supabase/client";
import { FileAsset, formatBytes, FILE_CATEGORIES, isImageExt, getPublicFileSignedUrl } from "@/lib/files";
import { CinematicLightbox } from "@/components/media/CinematicLightbox";
import { FadeUp, StaggerContainer, StaggerItem } from "@/components/motion/MotionWrappers";
import { motion, useScroll, useTransform } from "framer-motion";
import { useTranslation } from "@/i18n/LanguageContext";
import { ArrowLeft, MapPin, CalendarDays, Eye, Loader2, FolderOpen, Maximize2, Camera, FileText } from "lucide-react";

interface Project {
  id: string;
  title: string;
  description: string | null;
  status: string;
  location: string | null;
  start_date: string | null;
  target_date: string | null;
}

export default function PublicProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  useContentProtection();
  const [project, setProject] = useState<Project | null>(null);
  const [files, setFiles] = useState<FileAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [preview, setPreview] = useState<FileAsset | null>(null);
  const [lbIndex, setLbIndex] = useState<number | null>(null);
  const [galleryImages, setGalleryImages] = useState<{ url: string; name: string }[]>([]);

  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 1.12]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      supabase.from("projects").select("id, title, description, status, location, start_date, target_date").eq("id", id).eq("is_public", true).single(),
      supabase.from("file_assets").select("id, project_id, category, original_name, mime_type, extension, size_bytes, version, sort_order, created_at, is_deleted").eq("project_id", id).eq("is_deleted", false).order("created_at", { ascending: false }),
      supabase.from("portfolio_gallery").select("id, image_url, caption, sort_order").eq("project_id", id).order("sort_order"),
    ]).then(([{ data: proj, error }, { data: fileData }, { data: galleryData }]) => {
      if (error || !proj) { setNotFound(true); } else {
        setProject(proj as Project);
        setFiles((fileData as unknown as FileAsset[]) ?? []);
        // Merge portfolio gallery images into galleryImages
        const pgImages = (galleryData ?? []).map((g: any) => ({ url: g.image_url, name: g.caption || "Gallery image" }));
        if (pgImages.length > 0) {
          setGalleryImages(pgImages);
        }
      }
      setLoading(false);
    });
  }, [id]);

  useEffect(() => {
    // Only fetch file-based gallery if no portfolio gallery images were loaded
    if (galleryImages.length > 0) return;
    const imageFiles = files.filter((f) => isImageExt(f.extension ?? ""));
    if (imageFiles.length === 0) { return; }
    Promise.all(
      imageFiles.map(async (f) => {
        const url = await getPublicFileSignedUrl(f.id);
        return { url: url ?? "", name: f.original_name };
      })
    ).then((imgs) => setGalleryImages(imgs.filter((i) => i.url)));
  }, [files, galleryImages.length]);

  if (loading) return (
    <div className="bg-background min-h-screen">
      <PublicNav />
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <Loader2 size={28} className="animate-spin text-primary" />
        <p className="text-xs text-muted-foreground tracking-widest uppercase">Loading project</p>
      </div>
    </div>
  );

  if (notFound || !project) return (
    <div className="bg-background min-h-screen">
      <PublicNav />
      <div className="container py-32 text-center">
        <h2 className="font-display text-3xl font-bold text-foreground">{t("project_not_found")}</h2>
        <p className="mt-3 text-muted-foreground">{t("project_not_found_hint")}</p>
        <Link to="/projects" className="mt-6 inline-flex items-center gap-2 text-primary text-sm hover:underline">
          <ArrowLeft size={14} /> {t("project_back")}
        </Link>
      </div>
      <PublicFooter />
    </div>
  );

  const imageFiles = files.filter((f) => isImageExt(f.extension ?? ""));
  const nonImageFiles = files.filter((f) => !isImageExt(f.extension ?? ""));
  const grouped: Record<string, FileAsset[]> = {};
  for (const f of nonImageFiles) {
    const cat = f.category;
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(f);
  }
  const orderedCategories = FILE_CATEGORIES.map((c) => c.value).filter((c) => grouped[c]);
  const heroImage = galleryImages[0]?.url;

  return (
    <div className="bg-background min-h-screen relative content-protected">
      <PublicNav />

      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-1/4 -right-40 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[150px] animate-float" />
      </div>

      {/* ── Parallax Hero ── */}
      {heroImage ? (
        <div ref={heroRef} className="relative overflow-hidden h-[60vh] min-h-[420px] max-h-[700px]">
          <motion.div style={{ scale: heroScale }} className="absolute inset-0">
            <img src={heroImage} alt={project.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-background" />
          </motion.div>
          <motion.div style={{ opacity: heroOpacity }} className="relative h-full container flex flex-col justify-end pb-12 z-10">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
              <Link to="/projects" className="inline-flex items-center gap-1.5 text-white/70 hover:text-white text-sm mb-6 transition-colors">
                <ArrowLeft size={14} /> {t("project_back")}
              </Link>
            </motion.div>
            <div className="max-w-2xl">
              <div className="flex items-center gap-3 mb-4"><StatusBadge status={project.status} /></div>
              <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="font-display text-4xl md:text-6xl font-bold text-white leading-tight tracking-tight">{project.title}</motion.h1>
              {project.description && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
                  className="mt-4 text-white/80 text-lg max-w-lg font-light leading-relaxed">{project.description}</motion.p>
              )}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                className="flex flex-wrap gap-3 mt-6">
                {project.location && (
                  <span className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-sm text-white/80">
                    <MapPin size={14} /> {project.location}
                  </span>
                )}
                {project.start_date && (
                  <span className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-sm text-white/80">
                    <CalendarDays size={14} /> {t("project_start_date")}: {new Date(project.start_date).toLocaleDateString()}
                  </span>
                )}
                {project.target_date && (
                  <span className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-sm text-white/80">
                    <CalendarDays size={14} /> {t("project_target_date")}: {new Date(project.target_date).toLocaleDateString()}
                  </span>
                )}
              </motion.div>
            </div>
          </motion.div>
        </div>
      ) : (
        <section className="container pt-20 pb-10 relative z-10">
          <Link to="/projects" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft size={13} /> {t("project_back")}
          </Link>
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h1 className="font-display text-[clamp(2rem,5vw,3.5rem)] font-bold text-foreground leading-tight tracking-tight">{project.title}</h1>
              {project.description && <p className="mt-3 text-muted-foreground font-light max-w-2xl leading-relaxed">{project.description}</p>}
            </div>
            <StatusBadge status={project.status} className="shrink-0 mt-2" />
          </div>
          <div className="flex flex-wrap gap-3 mb-10">
            {project.location && (
              <span className="flex items-center gap-2 bg-secondary/60 rounded-full px-4 py-2 text-sm text-foreground">
                <MapPin size={14} className="text-muted-foreground" /> {project.location}
              </span>
            )}
            {project.start_date && (
              <span className="flex items-center gap-2 bg-secondary/60 rounded-full px-4 py-2 text-sm text-foreground">
                <CalendarDays size={14} className="text-muted-foreground" /> {t("project_start_date")}: {new Date(project.start_date).toLocaleDateString()}
              </span>
            )}
            {project.target_date && (
              <span className="flex items-center gap-2 bg-secondary/60 rounded-full px-4 py-2 text-sm text-foreground">
                <CalendarDays size={14} className="text-muted-foreground" /> {t("project_target_date")}: {new Date(project.target_date).toLocaleDateString()}
              </span>
            )}
          </div>
        </section>
      )}

      {/* ── Gallery ── */}
      <div className="container py-12 relative z-10">
        {galleryImages.length > 0 && (
          <FadeUp className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <Camera size={16} className="text-primary" />
              </div>
              <h2 className="text-xs font-semibold tracking-[0.2em] uppercase text-primary">{t("project_gallery")}</h2>
              <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-muted-foreground">{galleryImages.length}</span>
              <div className="h-px flex-1 bg-border/50" />
            </div>
            <StaggerContainer className="columns-2 md:columns-3 lg:columns-4 gap-3 space-y-3" staggerDelay={0.05}>
              {galleryImages.map((img, i) => (
                <StaggerItem key={i}>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={() => setLbIndex(i)}
                    className="group relative w-full overflow-hidden rounded-2xl border border-border/30 bg-secondary/30 break-inside-avoid">
                    <img src={img.url} alt={img.name} className="w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                      <div className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all duration-300">
                        <Maximize2 size={16} className="text-white" />
                      </div>
                    </div>
                  </motion.button>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </FadeUp>
        )}

        {/* ── Files ── */}
        {nonImageFiles.length > 0 && (
          <FadeUp>
            <div className="flex items-center gap-3 mb-8">
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <FileText size={16} className="text-primary" />
              </div>
              <h2 className="text-xs font-semibold tracking-[0.2em] uppercase text-primary">{t("project_files")}</h2>
              <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-muted-foreground">{nonImageFiles.length}</span>
              <div className="h-px flex-1 bg-border/50" />
            </div>
            <div className="space-y-8">
              {orderedCategories.map((cat) => {
                const catLabel = FILE_CATEGORIES.find((c) => c.value === cat)?.label ?? cat;
                return (
                  <div key={cat}>
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{catLabel}</h3>
                    <StaggerContainer className="space-y-2" staggerDelay={0.04}>
                      {grouped[cat].map((file) => (
                        <StaggerItem key={file.id}>
                          <motion.div whileHover={{ x: 4 }}
                            className="flex items-center gap-3 rounded-2xl border border-border/30 bg-card/60 backdrop-blur-sm px-5 py-3.5 hover:border-primary/30 hover:shadow-[0_0_20px_hsl(var(--primary)/0.05)] transition-all cursor-pointer"
                            onClick={() => setPreview(file)}>
                            <FileIcon ext={file.extension ?? ""} size={18} className="text-muted-foreground shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="truncate text-sm font-medium text-foreground">{file.original_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatBytes(file.size_bytes)}
                                {file.version > 1 && <span className="ml-2 rounded-full bg-primary/15 px-1.5 py-0.5 text-primary text-[10px] font-semibold">v{file.version}</span>}
                                {" · "}{new Date(file.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <Eye size={15} className="text-muted-foreground" />
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

        {files.length === 0 && (
          <FadeUp>
            <div className="flex flex-col items-center justify-center py-16 text-center rounded-2xl border border-border/30 bg-secondary/20">
              <FolderOpen size={40} className="text-muted-foreground/20 mb-3" />
              <p className="text-muted-foreground text-sm">{t("project_no_files")}</p>
            </div>
          </FadeUp>
        )}
      </div>

      {/* ── CTA ── */}
      <FadeUp>
        <section className="border-t border-border/50 py-20 relative z-10 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[250px] rounded-full bg-primary/5 blur-[120px]" />
          </div>
          <div className="container text-center relative z-10">
            <h2 className="font-display text-4xl font-bold text-foreground tracking-tight">{t("project_interested")}</h2>
            <p className="mt-3 text-muted-foreground text-sm">{t("project_interested_hint")}</p>
            <Link to="/contact"
              className="inline-flex items-center gap-2 mt-8 rounded-2xl bg-primary px-10 py-3.5 text-sm tracking-wide font-medium text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all">
              {t("project_begin_conversation")}
            </Link>
          </div>
        </section>
      </FadeUp>

      {lbIndex !== null && (
        <CinematicLightbox
          images={galleryImages.map((g, i) => ({ id: `img-${i}`, image_url: g.url, caption: g.name }))}
          startIndex={lbIndex}
          onClose={() => setLbIndex(null)}
        />
      )}
      {preview && <FilePreviewModal file={preview} onClose={() => setPreview(null)} role="PUBLIC" />}

      <PublicFooter />
    </div>
  );
}
