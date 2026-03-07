import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { PublicNav } from "@/components/PublicNav";
import { PublicFooter } from "@/components/PublicFooter";
import { StatusBadge } from "@/components/StatusBadge";
import { FileIcon } from "@/components/files/FileIcon";
import { FilePreviewModal } from "@/components/files/FilePreviewModal";
import { supabase } from "@/integrations/supabase/client";
import { FileAsset, formatBytes, FILE_CATEGORIES, isImageExt, getPublicFileSignedUrl } from "@/lib/files";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useTranslation } from "@/i18n/LanguageContext";
import { ArrowLeft, MapPin, CalendarDays, Eye, Loader2, FolderOpen, Maximize2, Sparkles } from "lucide-react";
import { CinematicLightbox } from "@/components/media/CinematicLightbox";

interface Project {
  id: string;
  title: string;
  description: string | null;
  status: string;
  location: string | null;
  start_date: string | null;
  target_date: string | null;
}

function LightBox({ images, index, onClose, onNav }: { images: { url: string; name: string }[]; index: number; onClose: () => void; onNav: (i: number) => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onNav(index > 0 ? index - 1 : images.length - 1);
      if (e.key === "ArrowRight") onNav(index < images.length - 1 ? index + 1 : 0);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [index, images.length, onClose, onNav]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm" onClick={onClose}>
      <button onClick={onClose} className="absolute top-4 right-4 rounded-full bg-white/10 p-2.5 text-white/70 hover:text-white hover:bg-white/20 transition-colors"><X size={20} /></button>
      <button onClick={(e) => { e.stopPropagation(); onNav(index > 0 ? index - 1 : images.length - 1); }} className="absolute left-4 rounded-full bg-white/10 p-2.5 text-white/70 hover:text-white hover:bg-white/20 transition-colors"><ChevronLeft size={28} /></button>
      <button onClick={(e) => { e.stopPropagation(); onNav(index < images.length - 1 ? index + 1 : 0); }} className="absolute right-4 rounded-full bg-white/10 p-2.5 text-white/70 hover:text-white hover:bg-white/20 transition-colors"><ChevronRight size={28} /></button>
      <img src={images[index].url} alt={images[index].name} className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg" onClick={(e) => e.stopPropagation()} />
      <span className="absolute bottom-6 text-white/60 text-sm bg-black/40 rounded-full px-4 py-1.5">{index + 1} / {images.length}</span>
    </div>
  );
}

export default function PublicProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const [project, setProject] = useState<Project | null>(null);
  const [files, setFiles] = useState<FileAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [preview, setPreview] = useState<FileAsset | null>(null);
  const [lbIndex, setLbIndex] = useState<number | null>(null);
  const [galleryImages, setGalleryImages] = useState<{ url: string; name: string }[]>([]);

  const refHero = useScrollReveal();
  const refGallery = useScrollReveal();
  const refFiles = useScrollReveal();

  useEffect(() => {
    if (!id) return;
    Promise.all([
      supabase.from("projects").select("id, title, description, status, location, start_date, target_date").eq("id", id).eq("is_public", true).single(),
      supabase.from("file_assets").select("*").eq("project_id", id).eq("is_deleted", false).order("created_at", { ascending: false }),
    ]).then(([{ data: proj, error }, { data: fileData }]) => {
      if (error || !proj) { setNotFound(true); } else {
        setProject(proj as Project);
        setFiles((fileData as unknown as FileAsset[]) ?? []);
      }
      setLoading(false);
    });
  }, [id]);

  useEffect(() => {
    const imageFiles = files.filter((f) => isImageExt(f.extension ?? ""));
    if (imageFiles.length === 0) { setGalleryImages([]); return; }
    Promise.all(
      imageFiles.map(async (f) => {
        const url = await getPublicFileSignedUrl(f.id);
        return { url: url ?? "", name: f.original_name };
      })
    ).then((imgs) => setGalleryImages(imgs.filter((i) => i.url)));
  }, [files]);

  if (loading) {
    return (
      <div className="bg-background min-h-screen">
        <PublicNav />
        <div className="flex items-center justify-center py-32"><Loader2 size={28} className="animate-spin text-muted-foreground" /></div>
      </div>
    );
  }

  if (notFound || !project) {
    return (
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
  }

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
    <div className="bg-background min-h-screen relative">
      <PublicNav />

      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-1/4 -right-40 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[150px] animate-float" />
      </div>

      {heroImage ? (
        <section ref={refHero} className="reveal relative overflow-hidden">
          <div className="absolute inset-0">
            <img src={heroImage} alt={project.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-background" />
          </div>
          <div className="relative container py-28 md:py-40 z-10">
            <Link to="/projects" className="inline-flex items-center gap-1.5 text-white/70 hover:text-white text-sm mb-6 transition-colors">
              <ArrowLeft size={14} /> {t("project_back")}
            </Link>
            <div className="max-w-2xl">
              <div className="flex items-center gap-3 mb-4"><StatusBadge status={project.status} /></div>
              <h1 className="font-display text-4xl md:text-6xl font-bold text-white leading-tight tracking-tight">{project.title}</h1>
              {project.description && <p className="mt-4 text-white/80 text-lg max-w-lg font-light leading-relaxed">{project.description}</p>}
              <div className="flex flex-wrap gap-3 mt-6">
                {project.location && (
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-sm text-white/80">
                    <MapPin size={14} /> {project.location}
                  </div>
                )}
                {project.start_date && (
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-sm text-white/80">
                    <CalendarDays size={14} /> {t("project_start_date")}: {new Date(project.start_date).toLocaleDateString()}
                  </div>
                )}
                {project.target_date && (
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-sm text-white/80">
                    <CalendarDays size={14} /> {t("project_target_date")}: {new Date(project.target_date).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section ref={refHero} className="reveal container pt-20 pb-10 relative z-10">
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
              <div className="flex items-center gap-2 bg-secondary/60 rounded-full px-4 py-2 text-sm text-foreground">
                <MapPin size={14} className="text-muted-foreground" /> {project.location}
              </div>
            )}
            {project.start_date && (
              <div className="flex items-center gap-2 bg-secondary/60 rounded-full px-4 py-2 text-sm text-foreground">
                <CalendarDays size={14} className="text-muted-foreground" /> {t("project_start_date")}: {new Date(project.start_date).toLocaleDateString()}
              </div>
            )}
            {project.target_date && (
              <div className="flex items-center gap-2 bg-secondary/60 rounded-full px-4 py-2 text-sm text-foreground">
                <CalendarDays size={14} className="text-muted-foreground" /> {t("project_target_date")}: {new Date(project.target_date).toLocaleDateString()}
              </div>
            )}
          </div>
        </section>
      )}

      <div className="container py-12 relative z-10">
        {galleryImages.length > 0 && (
          <section ref={refGallery} className="reveal mb-16">
            <div className="flex items-center gap-3 mb-8">
              <div className="h-1 w-8 rounded-full bg-primary" />
              <h2 className="text-xs font-semibold tracking-[0.2em] uppercase text-primary">{t("project_gallery")}</h2>
              <div className="h-px flex-1 bg-border/50" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {galleryImages.map((img, i) => (
                <button key={i} onClick={() => setLbIndex(i)} className="group relative aspect-square overflow-hidden rounded-2xl border border-border/30 bg-secondary/30">
                  <img src={img.url} alt={img.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                    <Maximize2 size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {nonImageFiles.length > 0 && (
          <section ref={refFiles} className="reveal">
            <div className="flex items-center gap-3 mb-8">
              <div className="h-1 w-8 rounded-full bg-primary" />
              <h2 className="text-xs font-semibold tracking-[0.2em] uppercase text-primary">{t("project_files")}</h2>
              <div className="h-px flex-1 bg-border/50" />
            </div>
            <div className="space-y-8">
              {orderedCategories.map((cat) => {
                const catLabel = FILE_CATEGORIES.find((c) => c.value === cat)?.label ?? cat;
                return (
                  <div key={cat}>
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{catLabel}</h3>
                    <div className="space-y-2">
                      {grouped[cat].map((file) => (
                        <div key={file.id} className="flex items-center gap-3 rounded-2xl border border-border/30 bg-background/60 backdrop-blur-sm px-5 py-3.5 hover:border-primary/30 hover:shadow-[0_0_20px_rgba(var(--primary),0.05)] transition-all">
                          <FileIcon ext={file.extension ?? ""} size={18} className="text-muted-foreground shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="truncate text-sm font-medium text-foreground">{file.original_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatBytes(file.size_bytes)}
                              {file.version > 1 && <span className="ml-2 rounded-full bg-primary/15 px-1.5 py-0.5 text-primary text-[10px] font-semibold">v{file.version}</span>}
                              {" · "}{new Date(file.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <button onClick={() => setPreview(file)} title="Preview" className="rounded-xl p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
                            <Eye size={15} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {files.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center rounded-2xl border border-border/30 bg-secondary/20">
            <FolderOpen size={40} className="text-muted-foreground/20 mb-3" />
            <p className="text-muted-foreground text-sm">{t("project_no_files")}</p>
          </div>
        )}
      </div>

      <section className="border-t border-border/50 py-20 relative z-10">
        <div className="container text-center">
          <h2 className="font-display text-4xl font-bold text-foreground tracking-tight">{t("project_interested")}</h2>
          <p className="mt-3 text-muted-foreground text-sm">{t("project_interested_hint")}</p>
          <Link to="/contact"
            className="inline-flex items-center gap-2 mt-8 rounded-2xl bg-primary px-10 py-3 text-sm tracking-wide font-medium text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all">
            {t("project_begin_conversation")}
          </Link>
        </div>
      </section>

      {lbIndex !== null && <LightBox images={galleryImages} index={lbIndex} onClose={() => setLbIndex(null)} onNav={setLbIndex} />}
      {preview && <FilePreviewModal file={preview} onClose={() => setPreview(null)} role="PUBLIC" />}

      <PublicFooter />
    </div>
  );
}
