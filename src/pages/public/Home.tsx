import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";
import { Link } from "react-router-dom";
import {
  MapPin,
  Mail,
  Phone as PhoneIcon,
  Instagram,
  Facebook,
  Menu,
  X,
  Accessibility,
  ArrowRight,
  ArrowUpRight,
} from "lucide-react";

import { PublicFooter } from "@/components/PublicFooter";
import { useSettings } from "@/hooks/useSettings";
import { useSiteContent } from "@/hooks/useSiteContent";
import { useSEO } from "@/hooks/useSEO";
import { useTranslation } from "@/i18n/LanguageContext";
import { ArchitectureBusinessJsonLd } from "@/components/JsonLd";
import { ProgressiveImage } from "@/components/media/ProgressiveImage";
import { MagneticButton } from "@/components/MagneticButton";
import { SectionLabel } from "@/components/SectionLabel";
import { FadeUp, StaggerContainer, StaggerItem, ImageReveal } from "@/components/motion/MotionWrappers";
import { useRef, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useAccessibility } from "@/contexts/AccessibilityContext";

const ease = [0.22, 1, 0.36, 1] as const;

/** Strip noisy google-search URLs and any bare URLs from prose. */
function cleanProse(text?: string): string {
  if (!text) return "";
  return text
    .replace(/https?:\/\/(www\.)?google\.[^\s]+/gi, "")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export default function Home() {
  const { settings } = useSettings();
  const { t } = useTranslation();
  const { content } = useSiteContent("hero", "about_me", "services_home", "stats", "testimonials", "awards");
  const [featuredProjects, setFeaturedProjects] = useState<any[]>([]);

  const studioName = settings?.studio_name ?? "KIM DESIGN STUDIO";
  useSEO({
    title: t("seo_home_title"),
    description: t("seo_home_description"),
  });

  useEffect(() => {
    supabase
      .from("projects")
      .select("id, title, slug, summary, thumbnail_url, category, location, is_featured, is_public")
      .eq("is_public", true)
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(6)
      .then(({ data }) => {
        if (data) setFeaturedProjects(data);
      });
  }, []);

  const hero = content.hero ?? {};

  return (
    <div className="bg-background relative overflow-x-hidden min-h-screen">
      <ArchitectureBusinessJsonLd />
      <main id="main-content">
        <PortraitHero settings={settings} studioName={studioName} hero={hero} aboutMe={content.about_me ?? {}} t={t} />
        
        <StatsBand stats={content.stats ?? []} />

        <ExpertiseSection services={content.services_home ?? []} t={t} />

        <SelectedWork projects={featuredProjects} t={t} />

        <NarrativeSection aboutMe={content.about_me ?? {}} t={t} />

        <TestimonialsSection testimonials={content.testimonials ?? []} t={t} />

        <RecognitionSection awards={content.awards ?? []} t={t} />
      </main>
      <PublicFooter />
    </div>
  );
}

/* ───────────── DARK EDITORIAL PORTRAIT HERO ───────────── */
function PortraitHero({
  settings,
  studioName,
  hero,
  aboutMe,
  t,
}: {
  settings: any;
  studioName: string;
  hero: any;
  aboutMe: any;
  t: (k: string) => string;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { reduceMotion, setReduceMotion } = useAccessibility();
  const portrait = aboutMe?.profile_image_url || settings?.hero_portrait_url || null;
  const ownerName = hero?.name || "NANG KHAN KIM";
  const role = settings?.hero_role || aboutMe?.title_prefix || hero?.badge || "Architectural Designer";
  const status = settings?.hero_status || "";
  const address = settings?.address;
  const insta = settings?.instagram_url;
  const facebook = settings?.facebook_url;
  const description = cleanProse(hero?.description);
  const introduction = description || cleanProse(aboutMe?.bio_main);
  const navItems = [
    { label: t("nav_projects") || "Projects", to: "/portfolio" },
    { label: t("nav_services") || "Services", to: "/services" },
    { label: t("nav_studio") || "About", to: "/about" },
    { label: t("nav_contact") || "Contact", to: "/contact" },
  ];
  const headingRole = role.toUpperCase();

  return (
    <section className="relative min-h-[92svh] overflow-hidden bg-hero text-hero-foreground">
      <header className="relative z-30 mx-auto flex h-20 max-w-[1360px] items-center justify-between px-5 sm:px-8 lg:h-24 lg:px-12">
        <Link to="/" className="font-display text-base font-bold uppercase tracking-normal sm:text-lg" aria-label={`${studioName} home`}>
          {studioName}
        </Link>

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Main navigation">
          <Link to="/" className="text-xs font-semibold uppercase tracking-normal text-hero-foreground">Home</Link>
          {navItems.map((item) => (
            <Link key={item.to} to={item.to} className="text-xs font-medium uppercase tracking-normal text-hero-muted transition-colors hover:text-hero-foreground">
              {item.label}
            </Link>
          ))}
          <span className="h-5 w-px bg-hero-border" aria-hidden />
          {insta && <a href={insta} target="_blank" rel="noreferrer" aria-label="Instagram" className="text-hero-muted transition-colors hover:text-hero-foreground"><Instagram size={17} /></a>}
          {facebook && <a href={facebook} target="_blank" rel="noreferrer" aria-label="Facebook" className="text-hero-muted transition-colors hover:text-hero-foreground"><Facebook size={17} /></a>}
          <LanguageToggle />
          <Button type="button" variant="ghost" size="icon" onClick={() => setReduceMotion(!reduceMotion)} aria-pressed={reduceMotion} aria-label="Toggle reduced motion" title="Reduce motion" className="text-hero-muted hover:bg-hero-surface hover:text-hero-foreground">
            <Accessibility size={17} />
          </Button>
        </nav>

        <Button type="button" variant="ghost" size="icon" onClick={() => setMobileOpen((open) => !open)} aria-expanded={mobileOpen} aria-controls="home-mobile-nav" aria-label={mobileOpen ? "Close menu" : "Open menu"} className="text-hero-foreground hover:bg-hero-surface lg:hidden">
          {mobileOpen ? <X size={21} /> : <Menu size={21} />}
        </Button>
      </header>

      <AnimatePresence>
        {mobileOpen && (
          <motion.nav id="home-mobile-nav" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute inset-x-4 top-20 z-40 border border-hero-border bg-hero-surface p-3 lg:hidden" aria-label="Mobile navigation">
            {[{ label: "Home", to: "/" }, ...navItems].map((item) => (
              <Link key={item.to} to={item.to} onClick={() => setMobileOpen(false)} className="flex min-h-12 items-center border-b border-hero-border px-3 text-sm font-medium uppercase text-hero-foreground last:border-0">{item.label}</Link>
            ))}
            <div className="flex items-center justify-between px-1 pt-3"><LanguageToggle /><Button type="button" variant="ghost" size="icon" onClick={() => setReduceMotion(!reduceMotion)} aria-pressed={reduceMotion} aria-label="Toggle reduced motion" className="text-hero-muted"><Accessibility size={17} /></Button></div>
          </motion.nav>
        )}
      </AnimatePresence>

      <div className="relative mx-auto grid min-h-[calc(92svh-5rem)] max-w-[1360px] grid-cols-1 px-5 sm:px-8 lg:min-h-[calc(92svh-6rem)] lg:grid-cols-12 lg:px-12">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease }} className="relative z-20 flex flex-col justify-center pb-12 pt-12 lg:col-span-6 lg:pb-28 lg:pt-8">
          <p className="mb-6 text-xs font-bold uppercase tracking-normal text-hero-foreground">Hi, I’m {ownerName}</p>
          <h1 className="max-w-[760px] font-display text-[clamp(3.1rem,7.2vw,7.1rem)] font-bold uppercase leading-[0.91] tracking-normal text-hero-foreground">
            I’m an<br />{headingRole}
          </h1>
          {introduction && <p className="mt-7 max-w-[540px] text-sm leading-7 text-hero-muted sm:text-base lg:mt-8 lg:text-lg">{introduction}</p>}
          <div className="mt-9 flex flex-wrap items-center gap-6 lg:mt-11">
            <Button asChild variant="outline" size="lg" className="h-13 rounded-none border-hero-foreground bg-transparent px-7 text-xs font-bold uppercase tracking-normal text-hero-foreground hover:bg-hero-foreground hover:text-hero">
              <Link to="/portfolio">View my projects <ArrowRight size={15} /></Link>
            </Button>
            <Link to="/contact" className="border-b border-hero-border pb-1 text-xs font-bold uppercase tracking-normal text-hero-muted transition-colors hover:border-hero-foreground hover:text-hero-foreground">Contact me</Link>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.15 }} className="relative z-10 min-h-[52svh] lg:col-span-6 lg:min-h-0">
          {portrait ? (
            <ProgressiveImage src={portrait} alt={`Portrait of ${ownerName}`} width={1024} height={1280} eager priority aspectRatio="4 / 5" thumbWidth={1200} onContextMenu={(event) => event.preventDefault()} wrapperClassName="absolute inset-x-0 bottom-0 h-full bg-hero" className="object-cover object-top grayscale-[0.12] contrast-[1.03]" />
          ) : (
            <div className="absolute inset-x-0 bottom-0 flex h-full items-center justify-center border border-hero-border bg-hero-surface font-display text-6xl font-bold text-hero-muted">NKK</div>
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-hero via-transparent to-transparent opacity-50" aria-hidden />
          <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-28 bg-gradient-to-r from-hero to-transparent lg:block" aria-hidden />
        </motion.div>

        <div className="relative z-20 col-span-full grid grid-cols-1 gap-5 border-t border-hero-border py-6 text-xs sm:grid-cols-3 lg:absolute lg:inset-x-12 lg:bottom-0 lg:py-7">
          <div><span className="block uppercase text-hero-faint">Availability</span><strong className="mt-1 block font-medium text-hero-foreground">{status || "Available for selected projects"}</strong></div>
          <div><span className="block uppercase text-hero-faint">Location</span><strong className="mt-1 block font-medium text-hero-foreground">{address || "Myanmar / Worldwide"}</strong></div>
          <div><span className="block uppercase text-hero-faint">Practice</span><strong className="mt-1 block font-medium text-hero-foreground">Architecture · Interiors · Visualization</strong></div>
        </div>
      </div>
    </section>
  );
}

/* ───────────── EXPERTISE SECTION ───────────── */
function ExpertiseSection({ services, t }: { services: any[]; t: any }) {
  if (!services || services.length === 0) return null;

  return (
    <section className="py-24 md:py-40 bg-muted/5 border-t border-border/30">
      <div className="container">
        <div className="max-w-4xl mb-16 md:mb-24">
          <SectionLabel text={t("home_what_we_do")} />
          <FadeUp>
            <h2 className="font-display text-[clamp(2rem,5vw,4.5rem)] leading-[1.05] text-foreground">
              We design spaces that <span className="text-primary italic">resonate</span> with their environment and purpose.
            </h2>
          </FadeUp>
        </div>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-border/20 border border-border/20">
          {services.map((service, i) => (
            <StaggerItem key={service.title || i}>
              <div className="bg-background p-10 md:p-14 h-full group hover:bg-card transition-colors duration-500">
                <span className="font-display text-4xl text-border/40 group-hover:text-primary/20 transition-colors duration-500 block mb-8">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="font-display text-2xl text-foreground mb-4 group-hover:text-primary transition-colors duration-300">
                  {service.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-[1.8] line-clamp-3">
                  {service.desc || service.description}
                </p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}

/* ───────────── SELECTED WORK (Horizontal/Grid Showcase) ───────────── */
function SelectedWork({ projects, t }: { projects: any[]; t: any }) {
  if (!projects || projects.length === 0) return null;

  return (
    <section className="py-24 md:py-40 border-t border-border/30 overflow-hidden">
      <div className="container">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 mb-16 md:mb-24">
          <div className="max-w-2xl">
            <SectionLabel text={t("home_selected_work")} />
            <FadeUp>
              <h2 className="font-display text-[clamp(2.4rem,6vw,5.5rem)] leading-[0.95] text-foreground tracking-tighter">
                Architecture that tells a <span className="text-primary italic">story</span>.
              </h2>
            </FadeUp>
          </div>
          <FadeUp delay={0.2}>
            <MagneticButton strength={0.15}>
              <Link to="/portfolio" className="group inline-flex items-center gap-3 text-sm tracking-[0.2em] uppercase text-foreground py-2 border-b border-foreground/10 hover:border-primary transition-colors">
                {t("home_all_projects")}
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </MagneticButton>
          </FadeUp>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
          {projects.map((project, i) => (
            <FadeUp key={project.id} delay={i * 0.1}>
              <Link to={project.slug ? `/portfolio/${project.slug}` : `/projects/${project.id}`} className="group block">
                <ImageReveal>
                  <div className="aspect-[4/5] overflow-hidden bg-muted relative mb-6">
                    {project.thumbnail_url ? (
                      <ProgressiveImage
                        src={project.thumbnail_url}
                        alt={project.title}
                        aspectRatio="4 / 5"
                        className="transition-transform duration-[1200ms] ease-out group-hover:scale-[1.05]"
                        wrapperClassName="size-full"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-card border border-border/40">
                        <span className="font-display text-5xl text-border/60 tracking-tighter">
                          {String(project.title ?? "").slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-foreground/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="absolute bottom-6 right-6 h-12 w-12 rounded-full bg-background/95 backdrop-blur shadow-xl items-center justify-center hidden md:flex translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                      <ArrowUpRight size={18} className="text-foreground" />
                    </div>
                  </div>
                </ImageReveal>
                <div>
                  {project.category && (
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-[10px] tracking-[0.25em] uppercase text-primary font-bold">
                        {project.category}
                      </span>
                      <span className="h-px w-8 bg-border" />
                    </div>
                  )}
                  <h3 className="font-display text-2xl text-foreground group-hover:text-primary transition-colors leading-tight">
                    {project.title}
                  </h3>
                  {project.location && (
                    <p className="mt-2 text-sm text-muted-foreground flex items-center gap-1.5">
                      <MapPin size={12} className="opacity-60" />
                      {project.location}
                    </p>
                  )}
                </div>
              </Link>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────── NARRATIVE SECTION ───────────── */
function NarrativeSection({ aboutMe, t }: { aboutMe: any; t: any }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });
  
  const imageY = useTransform(scrollYProgress, [0, 1], ["-10%", "10%"]);

  return (
    <section ref={ref} className="py-24 md:py-48 bg-muted/5 border-t border-border/30 overflow-hidden">
      <div className="container">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24 items-center">
          <div className="lg:col-span-5 order-2 lg:order-1">
            <div className="relative aspect-[3/4] overflow-hidden">
              <motion.div style={{ y: imageY }} className="absolute inset-0 h-[120%] -top-[10%]">
                <ProgressiveImage
                  src={aboutMe?.profile_image_url || undefined}
                  alt="Studio Narrative"
                  aspectRatio="3 / 4"
                  className="h-full w-full object-cover grayscale-[0.5] hover:grayscale-0 transition-all duration-1000"
                />
              </motion.div>
              <div className="absolute inset-0 border-[20px] border-background/10 pointer-events-none" />
            </div>
          </div>
          
          <div className="lg:col-span-7 order-1 lg:order-2">
            <SectionLabel text={t("about_the_studio")} />
            <FadeUp>
              <h2 className="font-display text-[clamp(2.2rem,5vw,4.75rem)] leading-[0.98] text-foreground mb-10 tracking-tighter">
                Crafting timeless environments that <span className="text-primary italic">inspire</span> human connection.
              </h2>
            </FadeUp>
            <FadeUp delay={0.2}>
              <div className="space-y-6 text-muted-foreground leading-[1.85] max-w-xl">
                {aboutMe?.quote && (
                  <p className="font-display text-xl md:text-2xl text-foreground/90 italic leading-snug">
                    “{aboutMe.quote}”
                  </p>
                )}
                <p>{cleanProse(aboutMe?.bio_secondary) || cleanProse(aboutMe?.bio_main)}</p>
                {aboutMe?.bio_tertiary && (
                  <p className="text-[15px]">{cleanProse(aboutMe.bio_tertiary)}</p>
                )}
              </div>
            </FadeUp>
            <FadeUp delay={0.4} className="mt-12">
              <MagneticButton strength={0.2}>
                <Link to="/about" className="inline-flex items-center gap-4 bg-foreground text-background px-10 h-14 tracking-[0.2em] text-[11px] uppercase font-bold hover:bg-primary hover:text-primary-foreground transition-colors">
                  {t("home_learn_more")}
                  <ArrowRight size={14} />
                </Link>
              </MagneticButton>
            </FadeUp>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────────── STATS BAND ───────────── */
function StatsBand({ stats }: { stats: any[] }) {
  if (!stats?.length) return null;
  return (
    <section className="border-y border-border/30 bg-muted/[0.04]">
      <div className="container">
        <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-border/30">
          {stats.map((s, i) => (
            <StaggerItem key={s.label ?? i}>
              <div className="px-6 py-10 md:px-10 md:py-14 text-center lg:text-left">
                <p className="font-display text-[clamp(2.2rem,5vw,4rem)] leading-none tracking-tighter text-foreground">
                  {s.value}
                  <span className="text-primary">{s.suffix}</span>
                </p>
                <p className="mt-3 text-[10px] md:text-[11px] tracking-[0.25em] uppercase text-muted-foreground/70 font-mono-label">
                  {s.label}
                </p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}

/* ───────────── TESTIMONIALS ───────────── */
function TestimonialsSection({ testimonials, t }: { testimonials: any[]; t: any }) {
  if (!testimonials?.length) return null;
  return (
    <section className="py-24 md:py-40 border-t border-border/30">
      <div className="container">
        <div className="mb-14 md:mb-20 max-w-3xl">
          <SectionLabel text={t("home_client_voices")} />
          <FadeUp>
            <h2 className="font-display text-[clamp(2rem,4.5vw,3.75rem)] leading-[1.02] tracking-tighter text-foreground">
              Trusted by the people who <span className="text-primary italic">live</span> in our work.
            </h2>
          </FadeUp>
        </div>
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
          {testimonials.slice(0, 3).map((item, i) => (
            <StaggerItem key={item.name ?? i}>
              <figure className="h-full border border-border/40 p-8 md:p-10 flex flex-col justify-between bg-card/40 hover:border-primary/40 transition-colors duration-500">
                <blockquote className="text-[15px] leading-[1.85] text-muted-foreground">
                  “{item.text}”
                </blockquote>
                <figcaption className="mt-8 pt-6 border-t border-border/40">
                  <p className="font-display text-lg text-foreground leading-tight">{item.name}</p>
                  <p className="mt-1 text-[11px] tracking-[0.15em] uppercase text-muted-foreground/60 font-mono-label">
                    {item.role}
                  </p>
                </figcaption>
              </figure>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}

/* ───────────── RECOGNITION SECTION ───────────── */
function RecognitionSection({ awards, t }: { awards: any[]; t: any }) {
  if (!awards?.length) return null;
  return (
    <section className="py-20 md:py-32 border-t border-border/30 bg-muted/[0.04]">
      <div className="container">
        <SectionLabel text={t("home_awards_recognition")} />
        <div className="mt-10 border-t border-border/30">
          {awards.map((a, i) => (
            <FadeUp key={`${a.title}-${i}`} delay={i * 0.06}>
              <div className="group grid grid-cols-12 items-baseline gap-4 border-b border-border/30 py-6 md:py-8 hover:bg-card/50 transition-colors duration-400 px-2 md:px-4">
                <span className="col-span-3 md:col-span-2 font-mono-label text-xs md:text-sm text-primary tracking-widest">
                  {a.year}
                </span>
                <h3 className="col-span-9 md:col-span-6 font-display text-lg md:text-2xl tracking-tight text-foreground">
                  {a.title}
                </h3>
                <p className="col-span-12 md:col-span-4 text-xs md:text-sm text-muted-foreground/70 md:text-right">
                  {a.org}
                </p>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}



