import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PublicNav } from "@/components/PublicNav";
import { PublicFooter } from "@/components/PublicFooter";
import { supabase } from "@/integrations/supabase/client";
import { StatusBadge } from "@/components/StatusBadge";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { Search, MapPin, CalendarDays, FolderOpen, Loader2, ArrowRight, Sparkles, ImageIcon } from "lucide-react";
import { isImageExt, getPublicFileSignedUrl } from "@/lib/files";

interface Project {
  id: string;
  title: string;
  description: string | null;
  status: string;
  location: string | null;
  start_date: string | null;
  target_date: string | null;
  created_at: string;
}

const STATUS_OPTIONS = ["all", "inquiry", "active", "review", "delivered", "archived"];

function ProjectCard({ project, coverUrl }: { project: Project; coverUrl?: string }) {
  return (
    <Link
      key={project.id}
      to={`/projects/${project.id}`}
      className="group block overflow-hidden rounded-2xl border border-border/30 bg-background/60 backdrop-blur-sm hover:border-primary/30 hover:shadow-[0_0_30px_rgba(var(--primary),0.08)] transition-all duration-300"
    >
      {/* Cover image */}
      <div className="aspect-[16/9] overflow-hidden relative bg-secondary/30">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={project.title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon size={32} className="text-muted-foreground/20" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute top-3 right-3">
          <StatusBadge status={project.status} />
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="font-display text-lg font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
          {project.title}
        </h3>
        {project.description && (
          <p className="text-sm text-muted-foreground mt-2 line-clamp-2 font-light leading-relaxed">{project.description}</p>
        )}
        <div className="flex flex-wrap gap-3 mt-3 text-xs text-muted-foreground">
          {project.location && (
            <span className="flex items-center gap-1.5 bg-secondary/60 rounded-full px-2.5 py-1">
              <MapPin size={10} />{project.location}
            </span>
          )}
          {project.target_date && (
            <span className="flex items-center gap-1.5 bg-secondary/60 rounded-full px-2.5 py-1">
              <CalendarDays size={10} />Due {new Date(project.target_date).toLocaleDateString()}
            </span>
          )}
        </div>
        <div className="mt-4 flex items-center gap-1 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
          View Project <ArrowRight size={12} />
        </div>
      </div>
    </Link>
  );
}

export default function PublicProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [coverUrls, setCoverUrls] = useState<Record<string, string>>({});

  const refHero = useScrollReveal();
  const refGrid = useScrollReveal();
  const refCta = useScrollReveal();

  useEffect(() => {
    supabase
      .from("projects")
      .select("id, title, description, status, location, start_date, target_date, created_at")
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        const projs = (data as Project[]) ?? [];
        setProjects(projs);
        setLoading(false);

        // Fetch first image for each project as cover
        projs.forEach(async (p) => {
          const { data: files } = await supabase
            .from("file_assets")
            .select("id, extension")
            .eq("project_id", p.id)
            .eq("is_deleted", false)
            .order("created_at", { ascending: true })
            .limit(10);
          
          const imageFile = files?.find((f: any) => isImageExt(f.extension ?? ""));
          if (imageFile) {
            const url = await getPublicFileSignedUrl(imageFile.id);
            if (url) setCoverUrls((prev) => ({ ...prev, [p.id]: url }));
          }
        });
      });
  }, []);

  const filtered = projects.filter((p) => {
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        p.title.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.location?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="bg-background min-h-screen relative">
      <PublicNav />

      {/* Ambient orbs */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-1/4 -right-40 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[150px] animate-float" />
        <div className="absolute bottom-1/3 -left-32 w-[400px] h-[400px] rounded-full bg-primary/[0.03] blur-[120px] animate-float-delayed" />
      </div>

      {/* Hero */}
      <section ref={refHero} className="reveal container pt-20 pb-10 relative z-10">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-4 py-2 mb-6">
          <Sparkles size={12} className="text-primary" />
          <p className="text-xs font-semibold tracking-[0.15em] uppercase text-primary">Our Work</p>
        </div>
        <h1 className="font-display text-[clamp(2.5rem,6vw,5.5rem)] font-bold text-foreground leading-tight tracking-tight">
          Projects
        </h1>
        <p className="mt-4 text-muted-foreground font-light max-w-lg leading-relaxed">
          Browse our public projects — explore files, galleries, and progress updates.
        </p>
      </section>

      {/* Filters */}
      <section className="sticky top-16 z-30 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="container py-3 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects…"
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-border/50 bg-background/60 backdrop-blur-sm text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="flex gap-2 flex-wrap items-center">
            {STATUS_OPTIONS.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-4 py-1.5 rounded-full text-xs tracking-[0.1em] uppercase font-medium transition-all duration-200 ${
                  statusFilter === s
                    ? "bg-primary text-primary-foreground shadow-[0_0_12px_rgba(var(--primary),0.3)]"
                    : "bg-secondary/50 backdrop-blur-sm text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div ref={refGrid} className="reveal container py-12 relative z-10">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={28} className="animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <FolderOpen size={48} className="text-muted-foreground/20 mb-4" />
            <h3 className="font-display text-2xl font-bold text-foreground">No projects found</h3>
            <p className="mt-2 text-muted-foreground text-sm">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((project) => (
              <ProjectCard key={project.id} project={project} coverUrl={coverUrls[project.id]} />
            ))}
          </div>
        )}
      </div>

      {/* CTA */}
      <section ref={refCta} className="reveal border-t border-border/50 py-20 relative z-10">
        <div className="container text-center">
          <h2 className="font-display text-4xl font-bold text-foreground tracking-tight">Have a project in mind?</h2>
          <p className="mt-3 text-muted-foreground text-sm">Let's bring your vision to life together.</p>
          <Link to="/contact"
            className="inline-flex items-center gap-2 mt-8 rounded-2xl bg-primary px-10 py-3 text-sm tracking-wide font-medium text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all">
            Begin a Conversation
          </Link>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
