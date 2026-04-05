import { useEffect, useState, useRef, useCallback, MouseEvent as ReactMouseEvent } from "react";
import { CinematicLightbox } from "@/components/media/CinematicLightbox";
import { Hero3D } from "@/components/Hero3D";
import useEmblaCarousel from "embla-carousel-react";
import { PublicNav } from "@/components/PublicNav";
import { PublicFooter } from "@/components/PublicFooter";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PortfolioItem } from "@/lib/portfolio";
import { useSettings } from "@/hooks/useSettings";
import { useSiteContent } from "@/hooks/useSiteContent";
import { useSEO } from "@/hooks/useSEO";
import { FloatingChatButton } from "@/components/FloatingChatButton";
import { useTranslation } from "@/i18n/LanguageContext";
import { ArchitectureBusinessJsonLd } from "@/components/JsonLd";
import {
  FadeUp, FadeIn, StaggerContainer, StaggerItem,
  SlideIn, TextReveal, LineDraw, ImageReveal
} from "@/components/motion/MotionWrappers";
import { Marquee } from "@/components/motion/Marquee";
import { MagneticButton } from "@/components/MagneticButton";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Building2, Ruler, Leaf, PenTool, MapPin, GraduationCap, Award, Globe, ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { SectionLabel } from "@/components/SectionLabel";
import { LiveClock } from "@/components/LiveClock";
import { AnimatedDivider } from "@/components/AnimatedDivider";
import { TiltCard } from "@/components/TiltCard";
import profileImg from "@/assets/profile-placeholder.jpg";

const ICON_MAP: Record<string, any> = { Building2, Ruler, Leaf, PenTool, GraduationCap, Award, Globe };
const luxuryEase = [0.22, 1, 0.36, 1] as const;

/* ─── Featured Projects Scroll ─── */
function FeaturedScrollSection({ featured, setLightboxIdx }: { featured: PortfolioItem[]; setLightboxIdx: (i: number) => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    setScrollProgress(maxScroll > 0 ? el.scrollLeft / maxScroll : 0);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  return (
    <>
      <div ref={scrollRef} className="overflow-x-auto scrollbar-none pb-14 md:pb-20" onScroll={handleScroll}>
        <div className="flex gap-4 md:gap-5 px-[max(1.25rem,calc((100vw-1280px)/2+2rem))]">
          {featured.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: 60 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.8, delay: i * 0.08, ease: luxuryEase }}
              className="flex-shrink-0 w-[82vw] sm:w-[58vw] md:w-[42vw] lg:w-[33vw] group cursor-pointer"
              onClick={() => item.cover_image_url && setLightboxIdx(i)}
              data-cursor-hover
              data-cursor-label="Explore"
            >
              <TiltCard tiltStrength={5} className="relative">
                <div className="relative overflow-hidden aspect-[3/4] md:aspect-[4/5]">
                  {item.cover_image_url && (
                    <img src={item.cover_image_url} alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-[1200ms] ease-out" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-foreground/5 to-transparent opacity-70 group-hover:opacity-85 transition-opacity duration-500" />
                  <span className="absolute top-5 left-5 font-mono-label text-[10px] tracking-[0.2em] text-background/30 select-none">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="absolute bottom-0 left-0 right-0 p-5 md:p-7">
                    <div className="flex items-center gap-2 mb-2 text-[9px] text-background/45 tracking-[0.15em] uppercase font-mono-label">
                      {item.category && <span>{item.category}</span>}
                      {item.year && <span>— {item.year}</span>}
                    </div>
                    <Link to={`/portfolio/${item.slug}`} onClick={(e) => e.stopPropagation()}
                      className="font-display text-xl md:text-2xl lg:text-3xl text-background leading-tight block group-hover:translate-y-0 translate-y-0.5 transition-transform duration-500">
                      {item.title}
                    </Link>
                    {item.location && (
                      <p className="flex items-center gap-1 mt-2 text-[11px] text-background/35">
                        <MapPin size={9} />{item.location}
                      </p>
                    )}
                  </div>
                </div>
              </TiltCard>
            </motion.div>
          ))}
        </div>
      </div>
      {/* Progress */}
      <div className="container pb-4">
        <div className="flex items-center gap-4">
          <span className="text-[9px] tracking-[0.3em] uppercase text-muted-foreground/35 shrink-0 font-mono-label tabular-nums">
            {String(Math.round(scrollProgress * (featured.length - 1)) + 1).padStart(2, '0')}
            <span className="mx-1 text-border/40">/</span>
            {String(featured.length).padStart(2, '0')}
          </span>
          <div className="flex-1 h-px bg-border/25 relative overflow-hidden">
            <motion.div
              className="absolute top-0 left-0 h-full bg-primary/60"
              style={{ width: `${Math.max(5, scrollProgress * 100)}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>
        </div>
      </div>
    </>
  );
}

/* ─── Animated Counter ─── */
function useCountUp(target: number, duration = 2200) {
  const [count, setCount] = useState(0);
  const started = useRef(false);
  const start = useCallback(() => {
    if (started.current) return;
    started.current = true;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - t0) / duration, 1);
      setCount(Math.round((1 - Math.pow(1 - p, 4)) * target));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);
  return { count, start };
}

function AnimatedStat({ value, suffix, label, index }: { value: number; suffix: string; label: string; index: number }) {
  const { count, start } = useCountUp(value);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { start(); obs.unobserve(el); } }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [start]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 25 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, delay: index * 0.08, ease: luxuryEase }}
      className="text-center py-10 md:py-14"
    >
      <p className="font-display text-5xl md:text-6xl lg:text-7xl text-foreground leading-none">
        {count}<span className="text-primary/70">{suffix}</span>
      </p>
      <p className="mt-3 text-[9px] tracking-[0.3em] uppercase text-muted-foreground/60 font-mono-label">
        {label}
      </p>
    </motion.div>
  );
}

/* ─── Testimonials Carousel ─── */
function TestimonialsCarousel({ testimonials, t }: { testimonials: any[]; t: (k: string) => string }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "center" });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    return () => { emblaApi.off("select", onSelect); };
  }, [emblaApi, onSelect]);

  useEffect(() => {
    if (!emblaApi) return;
    const interval = setInterval(() => emblaApi.scrollNext(), 7000);
    return () => clearInterval(interval);
  }, [emblaApi]);

  return (
    <section className="py-24 md:py-32 border-t border-border/25">
      <div className="container">
        <div className="mb-12 md:mb-16 flex flex-col md:flex-row md:items-end md:justify-between gap-5">
          <div>
            <SectionLabel text={t("home_recognition")} />
            <FadeUp>
              <h2 className="font-display text-3xl md:text-4xl lg:text-5xl text-foreground leading-[1.1]">{t("home_client_voices")}</h2>
            </FadeUp>
          </div>
          <FadeUp delay={0.2}>
            <div className="flex items-center gap-3">
              <span className="font-mono-label text-sm text-muted-foreground/50 tabular-nums">
                {String(selectedIndex + 1).padStart(2, '0')}
                <span className="mx-1 text-border/30">/</span>
                <span className="text-muted-foreground/30">{String(testimonials.length).padStart(2, '0')}</span>
              </span>
              <div className="flex items-center gap-1.5">
                <button onClick={() => emblaApi?.scrollPrev()}
                  className="h-10 w-10 border border-border/40 bg-background flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-all duration-300">
                  <ChevronLeft size={15} />
                </button>
                <button onClick={() => emblaApi?.scrollNext()}
                  className="h-10 w-10 border border-border/40 bg-background flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-all duration-300">
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          </FadeUp>
        </div>

        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex gap-5 md:gap-6">
            {testimonials.map((testimonial: any, i: number) => (
              <div key={testimonial.name} className="flex-[0_0_88%] min-w-0 sm:flex-[0_0_46%] lg:flex-[0_0_33.333%]">
                <div className={`border border-border/30 p-6 md:p-8 h-full flex flex-col transition-all duration-500 ${
                  selectedIndex === i ? "bg-card" : "bg-transparent opacity-40"
                }`}>
                  <Quote size={16} className="text-primary/20 mb-4 shrink-0" />
                  <p className="text-muted-foreground leading-[1.85] text-[13px] flex-1 italic font-light">
                    {testimonial.text}
                  </p>
                  <div className="mt-6 pt-5 border-t border-border/20 flex items-center gap-3">
                    <div className="h-9 w-9 bg-muted/50 flex items-center justify-center">
                      <span className="font-display text-sm text-foreground">{testimonial.name?.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="text-[13px] text-foreground font-medium">{testimonial.name}</p>
                      <p className="text-[11px] text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center gap-1.5 mt-10">
          {testimonials.map((_: any, i: number) => (
            <button key={i} onClick={() => emblaApi?.scrollTo(i)}
              className={`h-[1.5px] transition-all duration-500 ${
                selectedIndex === i ? "w-8 bg-primary" : "w-1.5 bg-border/60"
              }`} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Main Component ─── */
export default function Home() {
  const { settings } = useSettings();
  const { t } = useTranslation();
  const { content } = useSiteContent("about_me", "hero", "stats", "services_home", "testimonials", "awards", "cta");
  const [featured, setFeatured] = useState<PortfolioItem[]>([]);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.5], [0, 50]);

  useEffect(() => {
    supabase
      .from("portfolio_items")
      .select("id, slug, title, cover_image_url, category, location, year, summary, tags, is_featured, is_published, created_at, updated_at, content")
      .eq("is_published", true)
      .eq("is_featured", true)
      .order("created_at", { ascending: false })
      .limit(4)
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

      {/* ══════════ 3D HERO ══════════ */}
      <div ref={heroRef} className="relative" id="hero">
        <motion.section
          style={{ opacity: heroOpacity, y: heroY }}
          className="min-h-screen flex items-end relative overflow-hidden"
        >
          {/* 3D Canvas background */}
          <Hero3D />

          {/* Cinematic overlays */}
          <div className="absolute inset-0 noise-overlay pointer-events-none z-[2]" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent z-[3] pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/60 via-transparent to-transparent z-[3] pointer-events-none" />

          {/* Side accent line */}
          <motion.div
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ duration: 1.2, delay: 0.5, ease: luxuryEase }}
            className="absolute left-6 md:left-10 top-[15%] bottom-[15%] w-px bg-gradient-to-b from-transparent via-primary/20 to-transparent z-[4] origin-top hidden md:block"
          />

          {/* Content overlay — bottom-aligned cinematic layout */}
          <div className="container relative z-10 pb-28 md:pb-36 pt-20">
            <div className="grid md:grid-cols-[1fr,auto] gap-10 md:gap-20 items-end">
              <div className="max-w-3xl">
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "3rem" }}
                  transition={{ duration: 0.8, delay: 0.15, ease: luxuryEase }}
                  className="h-px bg-primary mb-7 md:mb-9"
                />

                <motion.p
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.2, ease: luxuryEase }}
                  className="text-[10px] tracking-[0.4em] uppercase text-primary mb-5 md:mb-7 font-mono-label"
                >
                  {hero.badge ?? "Architecture · Interiors · Urbanism"}
                </motion.p>

                <motion.h1 className="font-display text-[clamp(3rem,8vw,7.5rem)] leading-[0.88] text-foreground">
                  <span className="overflow-hidden inline-block">
                    {(hero.title_line1 ?? "Building spaces").split(" ").map((word: string, i: number) => (
                      <motion.span
                        key={i}
                        initial={{ opacity: 0, y: 55, rotateX: -15 }}
                        animate={{ opacity: 1, y: 0, rotateX: 0 }}
                        transition={{ duration: 0.8, delay: 0.3 + i * 0.08, ease: luxuryEase }}
                        className="inline-block mr-[0.25em]"
                      >
                        {word}
                      </motion.span>
                    ))}
                  </span>
                  <br />
                  <span className="overflow-hidden inline-block">
                    {(hero.title_line2 ?? "that endure.").split(" ").map((word: string, i: number) => (
                      <motion.span
                        key={`l2-${i}`}
                        initial={{ opacity: 0, y: 55, rotateX: -15 }}
                        animate={{ opacity: 1, y: 0, rotateX: 0 }}
                        transition={{ duration: 0.8, delay: 0.5 + i * 0.08, ease: luxuryEase }}
                        className="inline-block mr-[0.25em] hero-shimmer-text"
                      >
                        {word}
                      </motion.span>
                    ))}
                  </span>
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.7, ease: luxuryEase }}
                  className="mt-7 md:mt-9 text-[15px] md:text-base text-muted-foreground max-w-md leading-[1.85] font-light"
                >
                  {hero.description ?? ""}
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.9, ease: luxuryEase }}
                  className="mt-10 md:mt-14 flex flex-col sm:flex-row gap-3"
                >
                  <MagneticButton strength={0.2}>
                    <Button size="lg" asChild className="rounded-none px-10 h-13 tracking-[0.15em] text-[11px] uppercase font-medium">
                      <Link to="/portfolio">{t("home_view_projects")} <ArrowRight size={13} className="ml-2.5" /></Link>
                    </Button>
                  </MagneticButton>
                  <MagneticButton strength={0.2}>
                    <Button variant="outline" size="lg" asChild className="rounded-none px-10 h-13 tracking-[0.15em] text-[11px] uppercase font-medium border-foreground/15 hover:bg-foreground hover:text-background transition-all duration-500">
                      <Link to="/contact">{t("home_work_with_us")}</Link>
                    </Button>
                  </MagneticButton>
                </motion.div>
              </div>

              {/* Right side vertical info strip */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2, duration: 0.6 }}
                className="hidden md:flex flex-col items-end gap-12 text-right pb-4"
              >
                <div>
                  <p className="text-[8px] tracking-[0.4em] uppercase text-muted-foreground/30 font-mono-label mb-1">Location</p>
                  <p className="text-[11px] text-muted-foreground/60 font-mono-label">Yangon, Myanmar</p>
                </div>
                <div>
                  <p className="text-[8px] tracking-[0.4em] uppercase text-muted-foreground/30 font-mono-label mb-1">Established</p>
                  <p className="text-[11px] text-muted-foreground/60 font-mono-label">{aboutMe.est_year ?? "2008"}</p>
                </div>
                <LiveClock />
              </motion.div>
            </div>
          </div>
        </motion.section>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4, duration: 0.5 }}
            className="flex flex-col items-center gap-3"
          >
            <span className="text-[7px] tracking-[0.4em] uppercase text-muted-foreground/30 font-mono-label">Scroll</span>
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="w-px h-8 bg-gradient-to-b from-primary/30 to-transparent"
            />
          </motion.div>
        </div>
      </div>

      {/* ══════════ MARQUEE ══════════ */}
      <AnimatedDivider />
      <div className="border-b border-border/25 py-4 md:py-5 overflow-hidden">
        <Marquee
          items={["Architecture", "Interior Design", "Urban Planning", "Landscape", "Sustainability", "Heritage", "Residential", "Commercial"]}
          separator="—"
          speed={40}
          className="font-display text-lg md:text-xl lg:text-2xl text-muted-foreground/20 select-none"
        />
      </div>

      {/* ══════════ ABOUT ══════════ */}
      <section id="about" className="border-t border-border/25">
        <div className="container py-20 md:py-32">
          <div className="grid lg:grid-cols-2 gap-14 lg:gap-20 items-start">
            <SlideIn direction="left">
              <div className="relative">
                <ImageReveal>
                  <div className="aspect-[3/4] overflow-hidden relative">
                    <motion.img
                      src={aboutProfileImg}
                      alt={aboutMe.title_prefix ?? "Principal Architect"}
                      className="h-full w-full object-cover object-center"
                      initial={{ scale: 1.08 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.4, ease: luxuryEase }}
                    />
                    <motion.div
                      initial={{ opacity: 0, x: 15 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.7, delay: 0.8, ease: luxuryEase }}
                      className="absolute top-5 right-5 backdrop-blur-md bg-foreground/70 text-background px-3.5 py-2 hidden md:block"
                    >
                      <p className="text-[8px] tracking-[0.3em] uppercase text-background/45 font-mono-label">{t("home_credentials")}</p>
                      <p className="font-display text-base leading-tight mt-0.5">{aboutMe.est_year ? `Since ${aboutMe.est_year}` : "Since 2008"}</p>
                    </motion.div>
                  </div>
                </ImageReveal>
                {credentials.length > 0 && (
                  <FadeUp delay={0.4}>
                    <div className="mt-5 border-t border-border/30 pt-5">
                      <p className="text-[8px] tracking-[0.4em] uppercase text-muted-foreground/60 mb-3 font-mono-label">{t("home_credentials")}</p>
                      <div className="space-y-2">
                        {credentials.map((c: any) => {
                          const Icon = ICON_MAP[c.icon] ?? Award;
                          return (
                            <div key={c.text} className="flex items-center gap-2.5">
                              <Icon size={10} className="text-primary/70 shrink-0" />
                              <span className="text-[12px] text-muted-foreground">{c.text}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </FadeUp>
                )}
              </div>
            </SlideIn>

            <div className="lg:pt-8">
              <FadeUp>
                <p className="text-[9px] tracking-[0.4em] uppercase text-primary mb-6 font-mono-label">{aboutMe.title_prefix ?? "Principal Architect"}</p>
              </FadeUp>
              <TextReveal>
                <h2 className="font-display text-[clamp(2.5rem,4.5vw,5rem)] leading-[1] text-foreground">
                  {aboutMe.name_first ?? "Elena"}<br />
                  <span className="text-primary">{aboutMe.name_last ?? "Markov"}</span>
                </h2>
              </TextReveal>
              <FadeUp delay={0.3}>
                <div className="flex items-center gap-4 my-8 md:my-12">
                  <LineDraw className="h-px w-14 bg-primary/25" delay={0.5} />
                  <span className="text-[11px] tracking-[0.2em] text-muted-foreground/50 font-mono-label">Est. {aboutMe.est_year ?? "2008"}</span>
                </div>
              </FadeUp>
              <FadeUp delay={0.4}>
                <div className="space-y-5 max-w-md">
                  <p className="text-[15px] leading-[1.9] text-foreground/70">{aboutMe.bio_main ?? ""}</p>
                  <p className="text-[13px] leading-[1.85] text-muted-foreground">{aboutMe.bio_secondary ?? ""}</p>
                </div>
              </FadeUp>
              <FadeUp delay={0.5}>
                <div className="mt-10 flex flex-col sm:flex-row items-start gap-3">
                  <Button asChild className="rounded-none px-7 h-11 tracking-[0.15em] text-[11px] uppercase font-medium">
                    <Link to="/about">{t("home_full_profile")} <ArrowRight size={12} className="ml-2" /></Link>
                  </Button>
                  <Button variant="ghost" asChild className="rounded-none px-7 h-11 tracking-[0.12em] text-[11px] text-muted-foreground hover:text-foreground">
                    <Link to="/contact">{t("home_work_together")}</Link>
                  </Button>
                </div>
              </FadeUp>
              {aboutMe.quote && (
                <FadeUp delay={0.6}>
                  <blockquote className="mt-16 pt-8 border-t border-border/25">
                    <p className="font-display text-xl md:text-2xl text-muted-foreground/70 leading-[1.4] italic">
                      "{aboutMe.quote}"
                    </p>
                  </blockquote>
                </FadeUp>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ STATS ══════════ */}
      {stats.length > 0 && (
        <section id="stats" className="border-t border-border/25">
          <div className="container">
            <div className="grid grid-cols-2 md:grid-cols-4">
              {stats.map((s: any, i: number) => (
                <div
                  key={s.label}
                  className={`group relative ${i < stats.length - 1 ? "border-r border-border/20" : ""} hover:bg-card/40 transition-colors duration-500`}
                >
                  <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-700 origin-left" />
                  <AnimatedStat value={s.value} suffix={s.suffix} label={s.label} index={i} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══════════ FEATURED PROJECTS ══════════ */}
      {featured.length > 0 && (
        <section id="projects" className="border-t border-border/25">
          <div className="container pt-20 md:pt-32 pb-6 md:pb-10">
            <div className="flex items-end justify-between mb-10 md:mb-14">
              <div>
                <SectionLabel text={t("home_selected_work")} />
                <FadeUp>
                  <h2 className="font-display text-3xl md:text-4xl lg:text-5xl text-foreground leading-[1.1]">{t("home_featured_work")}</h2>
                </FadeUp>
              </div>
              <FadeUp delay={0.2}>
                <Link to="/portfolio" className="hidden md:flex items-center gap-2 text-[12px] text-muted-foreground hover:text-foreground transition-colors group tracking-[0.05em]">
                  {t("home_view_all")}
                  <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </FadeUp>
            </div>
          </div>

          <FeaturedScrollSection featured={featured} setLightboxIdx={setLightboxIdx} />

          <div className="container pb-10 md:hidden">
            <FadeUp delay={0.2}>
              <div className="text-center">
                <Button variant="outline" asChild className="rounded-none tracking-[0.12em] uppercase text-[10px] font-medium">
                  <Link to="/portfolio">{t("home_all_projects")}</Link>
                </Button>
              </div>
            </FadeUp>
          </div>
        </section>
      )}

      {/* ══════════ SERVICES ══════════ */}
      {servicesHome.length > 0 && (
        <section id="services" className="border-t border-border/25 bg-muted/15">
          <div className="container py-20 md:py-32">
            <SectionLabel text={t("home_disciplines")} />
            <FadeUp>
              <h2 className="font-display text-3xl md:text-4xl lg:text-5xl text-foreground leading-[1.1] mb-14 md:mb-18">{t("home_what_we_do")}</h2>
            </FadeUp>

            <StaggerContainer className="grid gap-px grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" staggerDelay={0.06}>
              {servicesHome.map((s: any, i: number) => {
                const Icon = ICON_MAP[s.icon] ?? Building2;
                return (
                  <StaggerItem key={s.title}>
                    <div className="relative bg-background p-7 md:p-8 group hover:bg-card transition-all duration-500 h-full border border-border/15 overflow-hidden">
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
                        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                      </div>
                      <span className="absolute -right-2 -top-4 font-display text-[100px] leading-none text-border/[0.04] group-hover:text-primary/[0.05] transition-colors duration-700 select-none pointer-events-none">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <div className="relative z-10">
                        <motion.div
                          whileHover={{ scale: 1.1, rotate: -3 }}
                          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                          className="inline-block mb-5"
                        >
                          <Icon size={20} className="text-primary" />
                        </motion.div>
                        <h3 className="font-display text-lg md:text-xl text-foreground mb-3 leading-tight group-hover:text-primary transition-colors duration-300">{s.title}</h3>
                        <p className="text-[13px] text-muted-foreground leading-[1.8]">{s.desc}</p>
                        <div className="mt-5 flex items-center gap-2 text-[10px] text-primary/0 group-hover:text-primary transition-all duration-500 translate-y-2 group-hover:translate-y-0 tracking-[0.15em] uppercase font-mono-label">
                          <span>Learn more</span>
                          <ArrowRight size={10} />
                        </div>
                      </div>
                    </div>
                  </StaggerItem>
                );
              })}
            </StaggerContainer>
          </div>
        </section>
      )}

      {/* ══════════ TESTIMONIALS ══════════ */}
      <div id="testimonials" />
      {testimonials.length > 0 && (
        <TestimonialsCarousel testimonials={testimonials} t={t} />
      )}

      {/* ══════════ AWARDS ══════════ */}
      {awards.length > 0 && (
        <section id="awards" className="border-t border-border/25">
          <div className="container py-20 md:py-32">
            <div className="text-center mb-14 md:mb-18">
              <SectionLabel text={t("home_awards_recognition")} className="justify-center" />
              <FadeUp>
                <h2 className="font-display text-3xl md:text-4xl lg:text-5xl text-foreground leading-[1.1]">{t("home_honored_work")}</h2>
              </FadeUp>
            </div>

            <StaggerContainer className="max-w-3xl mx-auto" staggerDelay={0.05}>
              {awards.map((a: any) => (
                <StaggerItem key={a.year + a.title}>
                  <div className="flex items-start gap-5 md:gap-8 py-6 md:py-7 group border-b border-border/25 last:border-b-0 cursor-default">
                    <span className="font-mono-label text-sm text-primary/35 group-hover:text-primary/60 transition-colors duration-500 shrink-0 w-[60px] tabular-nums">{a.year}</span>
                    <div className="flex-1">
                      <h3 className="font-display text-base md:text-lg text-foreground leading-snug group-hover:text-primary transition-colors duration-300">
                        {a.title}
                      </h3>
                      <p className="text-[10px] tracking-[0.15em] text-muted-foreground/60 uppercase mt-1.5 font-mono-label">{a.org}</p>
                    </div>
                    <ArrowRight size={14} className="text-transparent group-hover:text-primary transition-all duration-500 group-hover:translate-x-1 mt-0.5 shrink-0" />
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>
      )}

      <PublicFooter />
      <FloatingChatButton />

      {lightboxIdx !== null && (
        <CinematicLightbox
          images={featured.filter(f => f.cover_image_url).map(f => ({
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
