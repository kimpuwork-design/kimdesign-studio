import { motion, useScroll, useTransform } from "framer-motion";
import { Link } from "react-router-dom";
import {
  MapPin,
  Mail,
  Phone as PhoneIcon,
  Linkedin,
  Download,
  Home as HomeIcon,
  FileText,
  Briefcase,
  Sparkles,
  Link2,
  ArrowRight,
  ArrowUpRight,
} from "lucide-react";

import { PublicNav } from "@/components/PublicNav";
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
  const { content } = useSiteContent("hero", "about_me", "services_summary", "featured_projects");
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
      <PublicNav />
      <main id="main-content">
        <PortraitHero settings={settings} studioName={studioName} hero={hero} aboutMe={content.about_me ?? {}} t={t} />
        
        {/* Expertise Section */}
        <ExpertiseSection services={content.services_summary ?? []} t={t} />

        {/* Selected Work Section */}
        <SelectedWork projects={featuredProjects} t={t} />

        {/* Narrative Section (About Summary) */}
        <NarrativeSection aboutMe={content.about_me ?? {}} t={t} />
        {/* Client Logos / Recognition */}
        <RecognitionSection t={t} />
      </main>
      <PublicFooter />
    </div>
  );
}

/* ───────────── PORTRAIT HERO (editorial dark with amber glow) ───────────── */
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
  const portrait = aboutMe?.profile_image_url || settings?.hero_portrait_url || null;

  const role = settings?.hero_role || hero?.badge || "";
  const status = settings?.hero_status || "";
  const cvUrl = settings?.cv_url;
  const email = settings?.contact_email;
  const phone = settings?.phone;
  const address = settings?.address;
  const insta = settings?.instagram_url;
  const description = cleanProse(hero?.description);

  const tokens = studioName.trim().split(/\s+/);
  const mid = Math.ceil(tokens.length / 2);
  const line1 = tokens.slice(0, mid).join(" ");
  const line2 = tokens.slice(mid).join(" ");

  const navItems = [
    { icon: HomeIcon, label: "Home", to: "/" },
    { icon: FileText, label: "Summary", to: "/about" },
    { icon: Briefcase, label: "Portfolio", to: "/portfolio" },
    { icon: Sparkles, label: t("nav_services") || "Services", to: "/services" },
    { icon: Link2, label: t("nav_contact") || "Contact", to: "/contact" },
  ];

  return (
    <section className="relative px-4 md:px-6 pt-6 md:pt-8 pb-10 md:pb-14">
      <div className="relative mx-auto max-w-[1400px] overflow-hidden rounded-[28px] md:rounded-[36px] bg-[#0c0c0e] text-white min-h-[78vh] md:min-h-[86vh] flex flex-col">
        {portrait && (
          <ProgressiveImage
            src={portrait}
            alt={studioName}
            width={1024}
            height={1536}
            eager
            priority
            aspectRatio="2 / 3"
            onContextMenu={(e) => e.preventDefault()}
            className="absolute inset-y-0 right-0 h-full w-full md:w-[62%] object-cover object-[center_20%] select-none pointer-events-none"
            wrapperClassName="absolute inset-y-0 right-0 h-full w-full md:w-[62%]"
          />
        )}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 60% 55% at 72% 38%, rgba(255,153,51,0.45), rgba(255,107,0,0.15) 35%, transparent 65%)",
          }}
        />
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none bg-gradient-to-r from-[#0c0c0e] via-[#0c0c0e]/85 md:via-[#0c0c0e]/60 to-transparent"
        />
        
        {/* Name Overlay beside Profile Picture */}
        <div className="absolute inset-y-0 right-0 z-20 hidden md:flex flex-col items-center justify-center w-[38%] pointer-events-none">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.5, ease }}
            className="flex flex-col items-center text-center p-8 w-full"
          >
            <span className="text-[clamp(1rem,1.4vw,1.8rem)] tracking-[0.6em] uppercase text-amber-400 font-bold mb-8 drop-shadow-md">Creative Director</span>
            <h2 className="text-[clamp(4rem,10.5vw,11rem)] font-display font-black tracking-[0.08em] text-white leading-[0.78] drop-shadow-[0_15px_45px_rgba(0,0,0,0.6)] flex flex-col items-center select-none w-full">
              <span className="block">NANG</span>
              <span className="block my-[-0.08em]">KHAN</span>
              <span className="block">KIM</span>
            </h2>
            <div className="mt-10 w-24 h-1 bg-amber-400/80 rounded-full shadow-[0_0_15px_rgba(251,191,36,0.5)]" />
          </motion.div>
        </div>

        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-40 pointer-events-none bg-gradient-to-t from-[#0c0c0e]/90 to-transparent"
        />

        <div className="relative z-10 flex items-start justify-between p-6 md:p-10">
          <div className="flex flex-col gap-4">
            {status && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease }}
                className="inline-flex items-center gap-2 text-[11px] tracking-[0.18em] uppercase text-white/80"
              >
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                </span>
                {status}
              </motion.div>
            )}

            {/* Mobile-only name display */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="md:hidden flex flex-col mt-6 items-center w-full"
            >
              <h2 className="text-[clamp(3.5rem,18vw,6.5rem)] font-display font-black tracking-[0.08em] text-white leading-[0.78] drop-shadow-2xl flex flex-col items-center">
                <span>NANG</span>
                <span>KHAN</span>
                <span>KIM</span>
              </h2>
              <div className="mt-4 w-12 h-0.5 bg-amber-400/80 rounded-full" />
              <span className="text-[11px] tracking-[0.4em] uppercase text-amber-400 font-bold mt-4">Creative Director</span>
            </motion.div>
          </div>

          {cvUrl && (
            <a
              href={cvUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-amber-400 text-neutral-900 px-4 py-2 text-[12px] font-semibold tracking-tight shadow-lg shadow-amber-500/20 hover:bg-amber-300 transition-colors"
            >
              <Download size={14} />
              {t("home_download_cv") || "Download CV"}
            </a>
          )}
        </div>

        <div className="relative z-10 flex-1 flex flex-col justify-end px-6 md:px-12 pb-28 md:pb-32">
          {role && (
            <div className="overflow-hidden mb-3">
              <motion.p
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="text-amber-400 text-[13px] md:text-[15px] tracking-[0.04em] font-medium block"
              >
                {role}
              </motion.p>
            </div>
          )}

          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.1, ease }}
            className="font-display font-bold leading-[0.88] tracking-[-0.04em] text-[clamp(2.4rem,9vw,8rem)]"
          >
            <div className="overflow-hidden">
              <motion.span 
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="block"
              >
                {line1}
              </motion.span>
            </div>
            {line2 && (
              <div className="overflow-hidden mt-[-0.1em]">
                <motion.span 
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  transition={{ duration: 0.9, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="block"
                >
                  {line2}
                </motion.span>
              </div>
            )}
          </motion.h1>

          {description && (
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease }}
              className="mt-6 max-w-md text-white/70 text-sm md:text-base leading-relaxed"
            >
              {description}
            </motion.p>
          )}

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease }}
            className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-3 max-w-2xl text-[13px] text-white/85"
          >
            {email && (
              <a
                href={`mailto:${email}`}
                className="flex items-center gap-3 hover:text-amber-300 transition-colors"
              >
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-amber-400/15 text-amber-400">
                  <Mail size={13} />
                </span>
                <span className="truncate">{email}</span>
              </a>
            )}
            {insta && (
              <a
                href={insta}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 hover:text-amber-300 transition-colors"
              >
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-amber-400/15 text-amber-400">
                  <Linkedin size={13} />
                </span>
                <span className="truncate">{insta.replace(/^https?:\/\//, "")}</span>
              </a>
            )}
            {phone && (
              <a
                href={`tel:${phone}`}
                className="flex items-center gap-3 hover:text-amber-300 transition-colors"
              >
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-amber-400/15 text-amber-400">
                  <PhoneIcon size={13} />
                </span>
                <span>{phone}</span>
              </a>
            )}
            {address && (
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-amber-400/15 text-amber-400">
                  <MapPin size={13} />
                </span>
                <span className="truncate">{address}</span>
              </div>
            )}
          </motion.div>
        </div>

        <motion.nav
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4, ease }}
          className="absolute left-1/2 -translate-x-1/2 bottom-5 md:bottom-8 z-10 flex items-center gap-1 rounded-full bg-white/10 backdrop-blur-xl border border-white/15 p-1 shadow-2xl"
        >
          {navItems.map((it, i) => (
            <Link
              key={it.label}
              to={it.to}
              className={`group inline-flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-full text-[12px] tracking-tight transition-colors ${
                i === 0
                  ? "bg-white text-neutral-900 font-medium"
                  : "text-white/85 hover:text-white hover:bg-white/10"
              }`}
            >
              <it.icon size={13} />
              <span className="hidden sm:inline">{it.label}</span>
            </Link>
          ))}
        </motion.nav>
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
          <SectionLabel text={t("home_expertise") || "Expertise"} />
          <FadeUp>
            <h2 className="font-display text-[clamp(2rem,5vw,4.5rem)] leading-[1.05] text-foreground">
              We design spaces that <span className="text-primary italic">resonate</span> with their environment and purpose.
            </h2>
          </FadeUp>
        </div>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-border/20 border border-border/20">
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
            <SectionLabel text={t("home_selected_work") || "Selected Work"} />
            <FadeUp>
              <h2 className="font-display text-[clamp(2.4rem,6vw,5.5rem)] leading-[0.95] text-foreground tracking-tighter">
                Architecture that tells a <span className="text-primary italic">story</span>.
              </h2>
            </FadeUp>
          </div>
          <FadeUp delay={0.2}>
            <MagneticButton strength={0.15}>
              <Link to="/portfolio" className="group inline-flex items-center gap-3 text-sm tracking-[0.2em] uppercase text-foreground py-2 border-b border-foreground/10 hover:border-primary transition-colors">
                {t("home_view_all_projects") || "View all projects"}
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
                    <ProgressiveImage
                      src={project.thumbnail_url || undefined}
                      alt={project.title}
                      aspectRatio="4 / 5"
                      className="transition-transform duration-[1200ms] ease-out group-hover:scale-[1.05]"
                      wrapperClassName="size-full"
                    />
                    <div className="absolute inset-0 bg-foreground/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="absolute bottom-6 right-6 h-12 w-12 rounded-full bg-background/95 backdrop-blur shadow-xl items-center justify-center hidden md:flex translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                      <ArrowUpRight size={18} className="text-foreground" />
                    </div>
                  </div>
                </ImageReveal>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-[10px] tracking-[0.25em] uppercase text-primary font-bold">
                      {project.category}
                    </span>
                    <span className="h-px w-8 bg-border" />
                  </div>
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
            <SectionLabel text={t("home_narrative") || "The Narrative"} />
            <FadeUp>
              <h2 className="font-display text-[clamp(2.4rem,5.5vw,5.5rem)] leading-[0.95] text-foreground mb-10 tracking-tighter">
                Crafting timeless environments that <span className="text-primary italic">inspire</span> human connection.
              </h2>
            </FadeUp>
            <FadeUp delay={0.2}>
              <div className="space-y-6 text-muted-foreground leading-relaxed max-w-xl text-lg font-light">
                <p>
                  {aboutMe?.short_bio || "We are a contemporary architecture studio based on the principles of minimalism, sustainability, and tectonic integrity."}
                </p>
                <p className="text-base">
                  Every project is a unique response to its context, driven by a rigorous design process that balances aesthetics with functional pragmatism.
                </p>
              </div>
            </FadeUp>
            <FadeUp delay={0.4} className="mt-12">
              <MagneticButton strength={0.2}>
                <Link to="/about" className="inline-flex items-center gap-4 bg-foreground text-background px-10 h-14 tracking-[0.2em] text-[11px] uppercase font-bold hover:bg-primary transition-colors">
                  {t("home_learn_more") || "Learn more about us"}
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

