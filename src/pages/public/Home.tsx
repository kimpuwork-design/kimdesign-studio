import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, ArrowUpRight, Building2, Ruler, Leaf, PenTool, GraduationCap, Award, Globe, MapPin, Quote } from "lucide-react";

import { PublicNav } from "@/components/PublicNav";
import { PublicFooter } from "@/components/PublicFooter";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { PortfolioItem } from "@/lib/portfolio";
import { useSettings } from "@/hooks/useSettings";
import { useSiteContent } from "@/hooks/useSiteContent";
import { useSEO } from "@/hooks/useSEO";
import { useTranslation } from "@/i18n/LanguageContext";
import { ArchitectureBusinessJsonLd } from "@/components/JsonLd";
import { FadeUp } from "@/components/motion/MotionWrappers";
import { CinematicLightbox } from "@/components/media/CinematicLightbox";
import profileImg from "@/assets/profile-placeholder.jpg";

const ICON_MAP: Record<string, any> = { Building2, Ruler, Leaf, PenTool, GraduationCap, Award, Globe };
const ease = [0.22, 1, 0.36, 1] as const;

/* ───────────── Small primitives ───────────── */
function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 text-[10px] tracking-[0.35em] uppercase text-primary/80 font-mono">
      <span className="h-px w-6 bg-primary/40" />
      {children}
    </span>
  );
}

/* Linkify URLs and strip noisy google-search URLs in prose */
function Linkified({ text }: { text?: string }) {
  if (!text) return null;
  // Drop "https://www.google.com/search?q=..." entirely (noise leaked from bio)
  const cleaned = text.replace(/https?:\/\/(www\.)?google\.[^\s]+/gi, "").replace(/\s{2,}/g, " ").trim();
  const parts = cleaned.split(/(https?:\/\/[^\s]+)/g);
  return (
    <>
      {parts.map((p, i) =>
        /^https?:\/\//.test(p) ? (
          <a key={i} href={p} target="_blank" rel="noreferrer" className="text-primary underline-offset-4 hover:underline break-all">
            {p.replace(/^https?:\/\//, "").replace(/\/$/, "")}
          </a>
        ) : (
          <span key={i}>{p}</span>
        )
      )}
    </>
  );
}

function SectionHeader({ eyebrow, title, lead }: { eyebrow: string; title: string; lead?: React.ReactNode }) {
  return (
    <div className="max-w-3xl">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="mt-5 font-display text-3xl md:text-5xl lg:text-6xl leading-[1.05] tracking-tight text-foreground">
        {title}
      </h2>
      {lead && <p className="mt-5 text-[15px] leading-[1.75] text-muted-foreground max-w-xl">{lead}</p>}
    </div>
  );
}

/* ───────────── Hero ───────────── */
function Hero({ heroImage, hero, t }: { heroImage?: string; hero: any; t: (k: string) => string }) {
  return (
    <section className="relative min-h-[92vh] flex items-end overflow-hidden bg-foreground text-background">
      {heroImage ? (
        <img
          src={heroImage}
          alt=""
          aria-hidden
          loading="eager"
          className="absolute inset-0 w-full h-full object-cover opacity-55 z-0 select-none"
          draggable={false}
        />
      ) : (
        <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top_right,hsl(243_75%_25%),hsl(240_47%_6%)_60%)]" />
      )}
      <div className="absolute inset-0 z-[1] bg-gradient-to-t from-foreground via-foreground/70 to-foreground/20" />
      <div className="absolute inset-0 z-[1] bg-gradient-to-r from-foreground/80 via-transparent to-transparent" />

      <div className="container relative z-10 pb-24 md:pb-32 pt-28">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease }}
          className="max-w-4xl"
        >
          <p className="text-[10px] tracking-[0.45em] uppercase text-primary mb-7 font-mono">
            {hero.badge ?? "Architecture · Interiors · Urbanism"}
          </p>
          <h1 className="font-display text-[clamp(2.75rem,7.5vw,7rem)] leading-[0.95] tracking-[-0.035em] text-background">
            {hero.title_line1 ?? "Building spaces"}
            <br />
            <span className="text-primary/90">{hero.title_line2 ?? "that endure."}</span>
          </h1>
          {hero.description && (
            <p className="mt-8 text-[15px] md:text-base text-background/65 leading-[1.85] max-w-xl">
              {hero.description}
            </p>
          )}
          <div className="mt-12 flex flex-col sm:flex-row gap-3">
            <Button size="lg" asChild className="h-12 px-9 text-[11px] tracking-[0.18em] uppercase font-medium">
              <Link to="/portfolio">{t("home_view_projects")} <ArrowRight size={14} className="ml-2.5" /></Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="h-12 px-9 text-[11px] tracking-[0.18em] uppercase font-medium border-background/25 bg-transparent text-background hover:bg-background hover:text-foreground"
            >
              <Link to="/contact">{t("home_work_with_us")}</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ───────────── BENTO: stats + about + studio ───────────── */
function BentoIntro({
  aboutMe,
  stats,
  aboutProfileImg,
  credentials,
  t,
}: {
  aboutMe: any;
  stats: any[];
  aboutProfileImg: string;
  credentials: any[];
  t: (k: string) => string;
}) {
  return (
    <section id="about" className="container py-20 md:py-32">
      <SectionHeader
        eyebrow={t("home_recognition") || "The studio"}
        title={`${aboutMe.name_first ?? "Elena"} ${aboutMe.name_last ?? "Markov"}`}
        lead={<Linkified text={aboutMe.bio_main} />}
      />

      <div className="mt-14 grid gap-4 md:gap-5 grid-cols-12 auto-rows-[minmax(120px,auto)]">
        {/* Profile card (large) */}
        <div className="col-span-12 md:col-span-7 row-span-2 group relative overflow-hidden border border-border bg-card">
          <div className="aspect-[16/11] md:aspect-auto md:h-full overflow-hidden">
            <img
              src={aboutProfileImg}
              alt={aboutMe.title_prefix ?? "Principal Architect"}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
            />
          </div>
          <div className="absolute inset-x-0 bottom-0 p-6 md:p-8 bg-gradient-to-t from-foreground/90 via-foreground/40 to-transparent">
            <p className="text-[10px] tracking-[0.3em] uppercase text-background/55 font-mono">
              {aboutMe.title_prefix ?? "Principal Architect"}
            </p>
            <p className="mt-2 font-display text-2xl md:text-3xl text-background tracking-tight">
              Est. {aboutMe.est_year ?? "2008"}
            </p>
          </div>
        </div>

        {/* Quote card */}
        <div className="col-span-12 md:col-span-5 p-7 md:p-9 border border-border bg-card flex flex-col justify-between">
          <Quote size={22} className="text-primary/50" />
          <p className="font-display text-xl md:text-2xl leading-[1.4] text-foreground">
            {aboutMe.quote ?? "Architecture is the thoughtful making of space."}
          </p>
          <Link
            to="/about"
            className="inline-flex items-center gap-2 text-[11px] tracking-[0.2em] uppercase text-primary font-mono group/lnk"
          >
            {t("home_full_profile") || "Full profile"}
            <ArrowUpRight size={14} className="transition-transform group-hover/lnk:translate-x-0.5 group-hover/lnk:-translate-y-0.5" />
          </Link>
        </div>

        {/* Stats (compact bento cells) */}
        {(stats.length ? stats : []).slice(0, 4).map((s: any, i: number) => (
          <div
            key={s.label + i}
            className="col-span-6 md:col-span-[span_var(--cs)] [--cs:3] p-6 border border-border bg-card hover:border-primary/40 transition-colors"
            style={{ ['--cs' as any]: stats.length === 3 ? (i === 0 ? '5' : '4') : '3' }}
          >
            <p className="font-display text-3xl md:text-4xl text-foreground tracking-tight tabular-nums">
              {s.value}
              <span className="text-primary">{s.suffix}</span>
            </p>
            <p className="mt-2 text-[10px] tracking-[0.25em] uppercase text-muted-foreground font-mono">{s.label}</p>
          </div>
        ))}

        {/* Credentials card */}
        {credentials.length > 0 && (
          <div className="col-span-12 md:col-span-5 p-7 border border-border bg-card">
            <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-4 font-mono">
              {t("home_credentials") || "Credentials"}
            </p>
            <div className="space-y-3">
              {credentials.slice(0, 5).map((c: any) => {
                const Icon = ICON_MAP[c.icon] ?? Award;
                return (
                  <div key={c.text} className="flex items-center gap-3">
                    <Icon size={13} className="text-primary shrink-0" />
                    <span className="text-[13px] text-foreground/85">{c.text}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

/* ───────────── BENTO: featured projects ───────────── */
function FeaturedBento({
  featured,
  onOpen,
  t,
}: {
  featured: PortfolioItem[];
  onOpen: (i: number) => void;
  t: (k: string) => string;
}) {
  if (featured.length === 0) return null;

  // Bento weights: alternate large / small for visual rhythm
  const sizes = [
    "md:col-span-8 md:row-span-2 aspect-[4/3] md:aspect-auto",
    "md:col-span-4 aspect-square",
    "md:col-span-4 aspect-square",
    "md:col-span-6 aspect-[5/4]",
    "md:col-span-6 aspect-[5/4]",
  ];

  return (
    <section id="projects" className="border-t border-border bg-secondary/40">
      <div className="container py-20 md:py-32">
        <div className="flex items-end justify-between gap-6 mb-12 md:mb-16">
          <SectionHeader
            eyebrow={t("home_selected_work") || "Selected work"}
            title={t("home_featured_work") || "Recent projects"}
          />
          <Link
            to="/portfolio"
            className="hidden md:inline-flex items-center gap-2 text-[11px] tracking-[0.2em] uppercase text-foreground hover:text-primary transition-colors font-mono shrink-0"
          >
            {t("home_view_all") || "View all"} <ArrowRight size={13} />
          </Link>
        </div>

        <div className="grid gap-4 md:gap-5 grid-cols-1 md:grid-cols-12 auto-rows-[260px]">
          {featured.slice(0, 5).map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.7, delay: i * 0.06, ease }}
              className={`group relative overflow-hidden cursor-pointer border border-border bg-card col-span-12 ${sizes[i] ?? "md:col-span-6 aspect-[5/4]"}`}
              onClick={() => p.cover_image_url && onOpen(i)}
            >
              {p.cover_image_url ? (
                <img
                  src={p.cover_image_url}
                  alt={p.title}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.05]"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-secondary to-muted" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/85 via-foreground/20 to-transparent" />
              <span className="absolute top-5 left-5 text-[10px] tracking-[0.3em] text-background/45 font-mono">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="absolute bottom-0 left-0 right-0 p-5 md:p-7">
                <div className="flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase text-background/55 font-mono mb-2">
                  {p.category && <span>{p.category}</span>}
                  {p.year && <span>· {p.year}</span>}
                </div>
                <Link
                  to={`/portfolio/${p.slug}`}
                  onClick={(e) => e.stopPropagation()}
                  className="font-display text-xl md:text-2xl text-background tracking-tight leading-tight block"
                >
                  {p.title}
                </Link>
                {p.location && (
                  <p className="mt-2 flex items-center gap-1.5 text-[11px] text-background/50">
                    <MapPin size={10} />
                    {p.location}
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-10 md:hidden">
          <Button variant="outline" asChild className="w-full h-11 text-[11px] tracking-[0.2em] uppercase">
            <Link to="/portfolio">{t("home_all_projects") || "All projects"}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

/* ───────────── BENTO: services ───────────── */
function ServicesBento({ services, t }: { services: any[]; t: (k: string) => string }) {
  if (services.length === 0) return null;
  return (
    <section id="services" className="container py-20 md:py-32">
      <SectionHeader
        eyebrow={t("home_disciplines") || "Disciplines"}
        title={t("home_what_we_do") || "What we do"}
      />
      <div className="mt-12 md:mt-16 grid gap-4 md:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {services.map((s: any, i: number) => {
          const Icon = ICON_MAP[s.icon] ?? Building2;
          return (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: i * 0.05, ease }}
              className="group relative p-7 border border-border bg-card hover:border-primary/40 hover:bg-card transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-6">
                <Icon size={22} className="text-primary" />
                <span className="text-[10px] tracking-[0.25em] text-muted-foreground/60 font-mono">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <h3 className="font-display text-lg md:text-xl text-foreground tracking-tight mb-3">{s.title}</h3>
              <p className="text-[13px] leading-[1.75] text-muted-foreground">{s.desc}</p>
              <div className="mt-6 inline-flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase text-primary opacity-0 group-hover:opacity-100 transition-opacity font-mono">
                Learn more <ArrowRight size={11} />
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

/* ───────────── Testimonials (clean static grid) ───────────── */
function TestimonialsGrid({ testimonials, t }: { testimonials: any[]; t: (k: string) => string }) {
  if (testimonials.length === 0) return null;
  return (
    <section className="border-t border-border bg-secondary/40">
      <div className="container py-20 md:py-32">
        <SectionHeader
          eyebrow={t("home_recognition") || "Client voices"}
          title={t("home_client_voices") || "Trusted by leaders"}
        />
        <div className="mt-12 md:mt-16 grid gap-4 md:gap-5 grid-cols-1 md:grid-cols-3">
          {testimonials.slice(0, 3).map((tm: any, i: number) => (
            <motion.div
              key={tm.name + i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.08, ease }}
              className="p-7 border border-border bg-card flex flex-col"
            >
              <Quote size={18} className="text-primary/50 mb-5" />
              <p className="text-[14px] leading-[1.8] text-foreground/85 flex-1">{tm.text}</p>
              <div className="mt-6 pt-5 border-t border-border flex items-center gap-3">
                <div className="h-9 w-9 bg-primary/10 text-primary flex items-center justify-center font-display text-sm">
                  {tm.name?.charAt(0)}
                </div>
                <div>
                  <p className="text-[13px] text-foreground font-medium">{tm.name}</p>
                  <p className="text-[11px] text-muted-foreground">{tm.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────── Awards (clean list) ───────────── */
function AwardsList({ awards, t }: { awards: any[]; t: (k: string) => string }) {
  if (awards.length === 0) return null;
  return (
    <section id="awards" className="container py-20 md:py-32">
      <SectionHeader
        eyebrow={t("home_awards_recognition") || "Recognition"}
        title={t("home_honored_work") || "Honored work"}
      />
      <div className="mt-12 md:mt-16 max-w-4xl border-t border-border">
        {awards.map((a: any, i: number) => (
          <motion.div
            key={a.year + a.title + i}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.04 }}
            className="flex items-baseline gap-6 md:gap-10 py-6 border-b border-border group"
          >
            <span className="text-[12px] text-primary font-mono tabular-nums shrink-0 w-14">{a.year}</span>
            <div className="flex-1">
              <h3 className="font-display text-base md:text-lg text-foreground tracking-tight">{a.title}</h3>
              <p className="mt-1 text-[11px] tracking-[0.15em] uppercase text-muted-foreground font-mono">{a.org}</p>
            </div>
            <ArrowUpRight size={16} className="text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0" />
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ───────────── Main ───────────── */
export default function Home() {
  const { settings } = useSettings();
  const { t } = useTranslation();
  const { content } = useSiteContent("about_me", "hero", "stats", "services_home", "testimonials", "awards", "cta");
  const [featured, setFeatured] = useState<PortfolioItem[]>([]);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  useEffect(() => {
    supabase
      .from("portfolio_items")
      .select("id, slug, title, cover_image_url, category, location, year, summary, tags, is_featured, is_published, created_at, updated_at, content")
      .eq("is_published", true)
      .eq("is_featured", true)
      .order("created_at", { ascending: false })
      .limit(5)
      .then(({ data }) => setFeatured((data as unknown as PortfolioItem[]) ?? []));
  }, []);

  const studioName = settings?.studio_name ?? "KIM DESIGN STUDIO";
  useSEO({ title: "Home", description: `${studioName} — Professional Architecture & Design Studio in Myanmar` });

  const aboutMe = content.about_me ?? {};
  const hero = content.hero ?? {};
  const stats: any[] = content.stats ?? [];
  const servicesHome: any[] = content.services_home ?? [];
  const testimonials: any[] = content.testimonials ?? [];
  const awards: any[] = content.awards ?? [];

  const aboutProfileImg = aboutMe.profile_image_url || profileImg;
  const credentials: any[] = aboutMe.credentials ?? [];
  const heroImage = featured[0]?.cover_image_url;

  return (
    <div className="bg-background relative overflow-x-hidden">
      <ArchitectureBusinessJsonLd />
      <PublicNav />

      <BentoSystemHero
        studioName={studioName}
        aboutMe={aboutMe}
        hero={hero}
        featured={featured}
        award={awards[0]}
        t={t}
      />

      <BentoIntro
        aboutMe={aboutMe}
        stats={stats}
        aboutProfileImg={aboutProfileImg}
        credentials={credentials}
        t={t}
      />

      <FeaturedBento featured={featured} onOpen={setLightboxIdx} t={t} />

      <ServicesBento services={servicesHome} t={t} />

      <TestimonialsGrid testimonials={testimonials} t={t} />

      <AwardsList awards={awards} t={t} />

      <PublicFooter />

      {lightboxIdx !== null && (
        <CinematicLightbox
          images={featured.filter((f) => f.cover_image_url).map((f) => ({
            id: f.id,
            image_url: f.cover_image_url!,
            caption: f.title,
          }))}
          startIndex={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
        />
      )}
    </div>
  );
}

/* ───────────── BENTO SYSTEM HERO (bold indigo brand) ───────────── */
function BentoSystemHero({
  studioName,
  aboutMe,
  hero,
  featured,
  award,
  t,
}: {
  studioName: string;
  aboutMe: any;
  hero: any;
  featured: PortfolioItem[];
  award?: { year?: string | number; title?: string; org?: string };
  t: (k: string) => string;
}) {
  const words = studioName.split(/\s+/).slice(0, 4);
  const monogram = words.map((w) => w[0]).join("").slice(0, 3).toUpperCase();
  const tagline =
    hero.description ??
    aboutMe.bio_short ??
    "Defining the intersection of structural void and atmospheric light.";
  const manifesto =
    aboutMe.quote ??
    "We believe architecture is not the building, but the space between walls. Our work explores minimalism as a vessel for human experience.";
  const principalNote =
    aboutMe.quote2 ??
    aboutMe.bio_main?.split(".")[0] ??
    "Architecture starts when you carefully put two bricks together. There it begins.";
  const p0 = featured[0];
  const p1 = featured[1];
  const p2 = featured[2];

  const fadeIn = {
    initial: { opacity: 0, y: 24 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-50px" },
    transition: { duration: 0.7, ease },
  } as const;

  return (
    <section className="container pt-10 md:pt-14 pb-14 md:pb-20">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 auto-rows-[minmax(160px,auto)]">
        {/* Brand block */}
        <motion.div
          {...fadeIn}
          className="md:col-span-8 md:row-span-3 bg-primary text-primary-foreground p-10 md:p-16 flex flex-col justify-between overflow-hidden relative group"
        >
          <div className="relative z-10">
            <p className="text-[11px] uppercase tracking-[0.4em] font-medium opacity-70 mb-8">
              {hero.badge ?? "Global Architecture Practice"}
            </p>
            <h1 className="font-display font-bold leading-[0.85] tracking-tighter text-[clamp(3.5rem,9vw,8rem)]">
              {words.map((w, i) => (
                <span key={i} className="block">{w}</span>
              ))}
            </h1>
          </div>
          <div className="relative z-10 mt-12 flex items-end justify-between gap-8">
            <p className="text-base md:text-lg max-w-xs font-light opacity-90 leading-relaxed">
              {tagline}
            </p>
            <Link
              to="/portfolio"
              aria-label={t("home_view_projects") || "View projects"}
              className="hidden md:flex shrink-0 w-12 h-12 border border-primary-foreground/30 rounded-full items-center justify-center group-hover:bg-primary-foreground group-hover:text-primary transition-all duration-500"
            >
              <ArrowRight size={18} className="-rotate-45" />
            </Link>
          </div>
          <div className="absolute top-0 right-0 p-10 font-display text-primary-foreground/10 text-[8rem] md:text-[10rem] font-bold select-none leading-none pointer-events-none">
            {monogram}
          </div>
        </motion.div>

        {/* Manifesto */}
        <motion.div
          {...fadeIn}
          transition={{ duration: 0.7, ease, delay: 0.05 }}
          className="md:col-span-4 md:row-span-2 bg-card border border-primary/10 p-8 md:p-10 flex flex-col justify-center relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
          <p className="text-primary font-display font-medium text-xl md:text-2xl mb-5 tracking-tight">
            {t("home_manifesto") || "Manifesto"}
          </p>
          <p className="text-muted-foreground leading-relaxed text-[15px] md:text-base">
            {manifesto}
          </p>
          <Link
            to="/about"
            className="mt-7 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-primary group/lnk w-fit"
          >
            {t("home_read_philosophy") || "Read philosophy"}
            <ArrowRight size={12} className="transition-transform group-hover/lnk:translate-x-1" />
          </Link>
        </motion.div>

        {/* Honors */}
        <motion.div
          {...fadeIn}
          transition={{ duration: 0.7, ease, delay: 0.1 }}
          className="md:col-span-4 bg-primary/5 p-8 flex flex-col justify-between border border-primary/10 min-h-[160px]"
        >
          <div className="flex justify-between items-start">
            <div className="w-2 h-2 bg-primary rounded-full" />
            <span className="text-primary font-display text-[10px] font-bold tracking-[0.3em] uppercase">
              {t("home_honors") || "Honors"}
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xl md:text-2xl font-display font-bold text-primary leading-tight">
              {award ? `${award.title}${award.year ? ` · ${award.year}` : ""}` : "Recognized Practice"}
            </p>
            <p className="text-[11px] text-primary/60 mt-1 uppercase tracking-[0.15em]">
              {award?.org ?? "Selected Distinctions"}
            </p>
          </div>
        </motion.div>

        {/* Primary project */}
        {p0 && (
          <Link
            to={`/portfolio/${p0.slug}`}
            className="md:col-span-6 md:row-span-2 group relative overflow-hidden bg-muted min-h-[280px]"
          >
            {p0.cover_image_url ? (
              <img
                src={p0.cover_image_url}
                alt={p0.title}
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center font-display text-5xl text-primary/60">
                {p0.title?.[0]}
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-500">
              <span className="text-[10px] uppercase tracking-[0.25em] mb-2 opacity-80">
                {p0.category ?? "Project 01"}
              </span>
              <h3 className="text-2xl md:text-3xl font-display font-bold tracking-tight">{p0.title}</h3>
            </div>
          </Link>
        )}

        {/* Secondary project */}
        {p1 && (
          <Link
            to={`/portfolio/${p1.slug}`}
            className="md:col-span-3 md:row-span-2 group relative overflow-hidden bg-muted min-h-[280px]"
          >
            {p1.cover_image_url ? (
              <img
                src={p1.cover_image_url}
                alt={p1.title}
                className="w-full h-full object-cover transition-all duration-700 grayscale group-hover:grayscale-0 group-hover:scale-105"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-foreground/10 to-foreground/30 flex items-center justify-center font-display text-4xl text-foreground/40">
                {p1.title?.[0]}
              </div>
            )}
            <div className="absolute inset-0 border-0 group-hover:border-[16px] border-primary/20 transition-all duration-500 pointer-events-none" />
          </Link>
        )}

        {/* Tertiary project */}
        {p2 && (
          <Link
            to={`/portfolio/${p2.slug}`}
            className="md:col-span-3 md:row-span-2 group relative overflow-hidden bg-muted min-h-[280px]"
          >
            {p2.cover_image_url ? (
              <img
                src={p2.cover_image_url}
                alt={p2.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/30 flex items-center justify-center font-display text-4xl text-primary/50">
                {p2.title?.[0]}
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-background/0 group-hover:bg-background/20 transition-colors duration-300">
              <div className="bg-card/95 backdrop-blur px-5 py-3 text-primary font-display font-bold text-[11px] tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-4 group-hover:translate-y-0">
                {t("home_view_details") || "VIEW DETAILS"}
              </div>
            </div>
          </Link>
        )}

        {/* Principal note */}
        <motion.div
          {...fadeIn}
          transition={{ duration: 0.7, ease, delay: 0.15 }}
          className="md:col-span-6 bg-foreground text-background p-10 md:p-12 flex items-center"
        >
          <div className="flex flex-col">
            <Quote size={22} className="text-primary mb-5" />
            <p className="font-display text-xl md:text-2xl mb-5 italic text-background/90 font-light leading-snug">
              "{principalNote}"
            </p>
            <p className="text-[10px] uppercase tracking-[0.3em] text-primary font-bold">
              {t("home_principal_note") || "Principal's Note"}
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

