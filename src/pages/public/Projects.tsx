import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PublicNav } from "@/components/PublicNav";
import { PublicFooter } from "@/components/PublicFooter";
import { supabase } from "@/integrations/supabase/client";
import { StatusBadge } from "@/components/StatusBadge";
import { useTranslation } from "@/i18n/LanguageContext";
import { FadeUp, StaggerContainer, StaggerItem } from "@/components/motion/MotionWrappers";
import { motion } from "framer-motion";
import { Search, MapPin, CalendarDays, FolderOpen, ArrowRight, Sparkles, ImageIcon, Star } from "lucide-react";

interface Project {
  id: string;
  title: string;
  description: string | null;
  status: string;
  location: string | null;
  start_date: string | null;
  target_date: string | null;
  created_at: string;
  thumbnail_url: string | null;
  is_featured: boolean;
  category: string | null;
}

const STATUS_OPTIONS = ["all", "inquiry", "active", "review", "delivered", "archived"];

/* ── Featured Hero Card ── */
function FeaturedCard({ project, t }: { project: Project; t: (k: string) => string }) {
  return (
    <FadeUp className="mb-10">
      <Link to={`/projects/${project.id}`}
        className="group relative block overflow-hidden rounded-3xl border border-border/30 bg-card/60 backdrop-blur-sm hover:border-primary/40 transition-all duration-500">
        <div className="grid md:grid-cols-2">
          <div className="aspect-[4/3] md:aspect-auto overflow-hidden relative bg-secondary/30">
            {project.thumbnail_url ? (
              <img src={project.thumbnail_url} alt={project.title} loading="eager"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted/50 to-secondary/50 min-h-[300px]">
                <ImageIcon size={48} className="text-muted-foreground/20" />
              </div>
            )}
          </div>
          <div className="p-8 md:p-10 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-4">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-[10px] font-semibold tracking-[0.15em] uppercase text-primary">
                <Star size={10} className="fill-primary" /> Featured
              </span>
              <StatusBadge status={project.status} />
            </div>
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground leading-tight tracking-tight group-hover:text-primary transition-colors">
              {project.title}
            </h2>
            {project.description && (
              <p className="mt-3 text-muted-foreground font-light leading-relaxed line-clamp-3">{project.description}</p>
            )}
            <div className="flex flex-wrap gap-2 mt-4 text-xs text-muted-foreground">
              {project.category && (
                <span className="bg-secondary/60 rounded-full px-3 py-1">{project.category}</span>
              )}
              {project.location && (
                <span className="flex items-center gap-1.5 bg-secondary/60 rounded-full px-3 py-1">
                  <MapPin size={10} />{project.location}
                </span>
              )}
            </div>
            <div className="mt-6 flex items-center gap-2 text-sm font-medium text-primary group-hover:gap-3 transition-all">
              View Project <ArrowRight size={16} />
            </div>
          </div>
        </div>
      </Link>
    </FadeUp>
  );
}

function ProjectCard({ project, t }: { project: Project; t: (k: string) => string }) {
  return (
    <StaggerItem>
      <motion.div whileHover={{ y: -6 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}>
        <Link to={`/projects/${project.id}`}
          className="group block overflow-hidden rounded-2xl border border-border/30 bg-card/60 backdrop-blur-sm hover:border-primary/30 hover:shadow-[0_0_30px_hsl(var(--primary)/0.08)] transition-all duration-300">
          <div className="aspect-[16/9] overflow-hidden relative bg-secondary/30">
            {project.thumbnail_url ? (
              <img src={project.thumbnail_url} alt={project.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted/50 to-secondary/50">
                <ImageIcon size={32} className="text-muted-foreground/20" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute top-3 left-3 flex items-center gap-1.5">
              <StatusBadge status={project.status} />
              {project.is_featured && (
                <span className="h-6 w-6 rounded-full bg-primary/20 backdrop-blur-sm flex items-center justify-center">
                  <Star size={10} className="text-primary fill-primary" />
                </span>
              )}
            </div>
            <div className="absolute bottom-3 right-3 h-9 w-9 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
              <ArrowRight size={14} className="text-white" />
            </div>
          </div>
          <div className="p-5">
            <h3 className="font-display text-lg font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">{project.title}</h3>
            {project.description && <p className="text-sm text-muted-foreground mt-2 line-clamp-2 font-light leading-relaxed">{project.description}</p>}
            <div className="flex flex-wrap gap-2 mt-3 text-xs text-muted-foreground">
              {project.category && (
                <span className="bg-secondary/60 rounded-full px-2.5 py-1">{project.category}</span>
              )}
              {project.location && (
                <span className="flex items-center gap-1.5 bg-secondary/60 rounded-full px-2.5 py-1"><MapPin size={10} />{project.location}</span>
              )}
              {project.target_date && (
                <span className="flex items-center gap-1.5 bg-secondary/60 rounded-full px-2.5 py-1"><CalendarDays size={10} />{new Date(project.target_date).toLocaleDateString()}</span>
              )}
            </div>
          </div>
        </Link>
      </motion.div>
    </StaggerItem>
  );
}

function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/30 bg-card/40 animate-pulse">
      <div className="aspect-[16/9] bg-muted/40" />
      <div className="p-5 space-y-3">
        <div className="h-5 bg-muted/40 rounded-lg w-3/4" />
        <div className="h-4 bg-muted/30 rounded-lg w-full" />
        <div className="h-4 bg-muted/30 rounded-lg w-1/2" />
      </div>
    </div>
  );
}

export default function PublicProjects() {
  const { t } = useTranslation();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  useEffect(() => {
    supabase
      .from("projects")
      .select("id, title, description, status, location, start_date, target_date, created_at, thumbnail_url, is_featured, category")
      .eq("is_public", true)
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setProjects((data as Project[]) ?? []);
        setLoading(false);
      });
  }, []);

  const categories = ["all", ...Array.from(new Set(projects.map(p => p.category).filter(Boolean) as string[]))];

  const filtered = projects.filter((p) => {
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    if (categoryFilter !== "all" && p.category !== categoryFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return p.title.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q) || p.location?.toLowerCase().includes(q);
    }
    return true;
  });

  const featuredProject = filtered.find(p => p.is_featured);
  const regularProjects = featuredProject ? filtered.filter(p => p.id !== featuredProject.id) : filtered;

  return (
    <div className="bg-background min-h-screen relative">
      <PublicNav />

      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-1/4 -right-40 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[150px] animate-float" />
        <div className="absolute bottom-1/3 -left-32 w-[400px] h-[400px] rounded-full bg-primary/[0.03] blur-[120px] animate-float-delayed" />
      </div>

      {/* Hero */}
      <FadeUp className="container pt-20 pb-10 relative z-10">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-4 py-2 mb-6">
          <Sparkles size={12} className="text-primary" />
          <p className="text-xs font-semibold tracking-[0.15em] uppercase text-primary">{t("projects_our_work")}</p>
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="font-display text-[clamp(2.5rem,6vw,5.5rem)] font-bold text-foreground leading-tight tracking-tight">
          {t("projects_title")}
        </motion.h1>
        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-4 text-muted-foreground font-light max-w-lg leading-relaxed">
          {t("projects_description")}
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.45 }}
          className="flex items-center gap-8 mt-8">
          {[
            { n: projects.length, label: "Total Projects" },
            { n: projects.filter(p => p.status === "active").length, label: "Active" },
            { n: new Set(projects.map(p => p.location).filter(Boolean)).size, label: "Locations" },
          ].map((s) => (
            <div key={s.label}>
              <p className="font-display text-2xl font-bold text-foreground">{s.n}</p>
              <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          ))}
        </motion.div>
      </FadeUp>

      {/* Filters */}
      <section className="sticky top-16 z-30 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="container py-3 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder={t("projects_search")}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-border/50 bg-background/60 backdrop-blur-sm text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div className="flex gap-2 flex-wrap items-center">
            {STATUS_OPTIONS.map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-4 py-1.5 rounded-full text-xs tracking-[0.1em] uppercase font-medium transition-all duration-200 ${
                  statusFilter === s ? "bg-primary text-primary-foreground shadow-[0_0_12px_hsl(var(--primary)/0.3)]" : "bg-secondary/50 backdrop-blur-sm text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}>
                {s === "all" ? t("portfolio_all") : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
            {categories.length > 2 && (
              <>
                <div className="w-px h-5 bg-border/50 mx-1 hidden sm:block" />
                {categories.filter(c => c !== "all").map((c) => (
                  <button key={c} onClick={() => setCategoryFilter(categoryFilter === c ? "all" : c)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                      categoryFilter === c ? "bg-foreground text-background" : "bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary"
                    }`}>
                    {c}
                  </button>
                ))}
              </>
            )}
          </div>
        </div>
      </section>

      {/* Grid */}
      <div className="container py-12 relative z-10">
        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <FadeUp>
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="h-20 w-20 rounded-2xl bg-muted/50 flex items-center justify-center mb-6">
                <FolderOpen size={32} className="text-muted-foreground/30" />
              </div>
              <h3 className="font-display text-2xl font-bold text-foreground">{t("projects_no_found")}</h3>
              <p className="mt-2 text-muted-foreground text-sm">{t("projects_no_found_hint")}</p>
            </div>
          </FadeUp>
        ) : (
          <>
            <p className="text-xs text-muted-foreground tracking-wide mb-6">
              Showing <span className="text-foreground font-medium">{filtered.length}</span> projects
            </p>

            {/* Featured Hero */}
            {featuredProject && statusFilter === "all" && categoryFilter === "all" && !search.trim() && (
              <FeaturedCard project={featuredProject} t={t} />
            )}

            <StaggerContainer className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" staggerDelay={0.06}>
              {regularProjects.map((project) => (
                <ProjectCard key={project.id} project={project} t={t} />
              ))}
            </StaggerContainer>
          </>
        )}
      </div>

      {/* CTA */}
      <FadeUp>
        <section className="border-t border-border/50 py-20 relative z-10 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[250px] rounded-full bg-primary/5 blur-[120px]" />
          </div>
          <div className="container text-center relative z-10">
            <h2 className="font-display text-4xl font-bold text-foreground tracking-tight">{t("projects_have_in_mind")}</h2>
            <p className="mt-3 text-muted-foreground text-sm">{t("projects_bring_vision")}</p>
            <Link to="/contact"
              className="inline-flex items-center gap-2 mt-8 rounded-2xl bg-primary px-10 py-3.5 text-sm tracking-wide font-medium text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all">
              {t("projects_begin_conversation")}
            </Link>
          </div>
        </section>
      </FadeUp>

      <PublicFooter />
    </div>
  );
}
