import { useEffect, useState, useRef, useCallback, MouseEvent as ReactMouseEvent } from "react";
import { CinematicLightbox } from "@/components/media/CinematicLightbox";
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
  SlideIn, TextReveal, LineDraw, ImageReveal, ParallaxSection
} from "@/components/motion/MotionWrappers";
import { Marquee } from "@/components/motion/Marquee";
import { MagneticButton } from "@/components/MagneticButton";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Building2, Ruler, Leaf, PenTool, MapPin, GraduationCap, Award, Globe, ChevronLeft, ChevronRight, Quote } from "lucide-react";
import profileImg from "@/assets/profile-placeholder.jpg";

const ICON_MAP: Record<string, any> = { Building2, Ruler, Leaf, PenTool, GraduationCap, Award, Globe };
const luxuryEase = [0.22, 1, 0.36, 1] as const;

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
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, delay: index * 0.1, ease: luxuryEase }}
      className="text-center py-10 md:py-16"
    >
      <p className="font-display text-5xl md:text-7xl lg:text-8xl text-foreground leading-none">
        {count}<span className="text-primary">{suffix}</span>
      </p>
      <p className="mt-4 text-[10px] tracking-[0.25em] uppercase text-muted-foreground">
        {label}
      </p>
    </motion.div>
  );
}

/* ─── Testimonials ─── */
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
    const interval = setInterval(() => emblaApi.scrollNext(), 6000);
    return () => clearInterval(interval);
  }, [emblaApi]);

  return (
    <section className="py-24 md:py-36 border-t border-border/30">
      <div className="container">
        <div className="mb-14 md:mb-20 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <FadeUp>
            <p className="text-[10px] tracking-[0.3em] uppercase text-primary mb-4">{t("home_recognition")}</p>
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-foreground leading-[1.1]">{t("home_client_voices")}</h2>
          </FadeUp>
          <FadeUp delay={0.2}>
            <div className="flex items-center gap-3">
              <button onClick={() => emblaApi?.scrollPrev()}
                className="h-12 w-12 border border-border bg-background flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all duration-300">
                <ChevronLeft size={18} />
              </button>
              <button onClick={() => emblaApi?.scrollNext()}
                className="h-12 w-12 border border-border bg-background flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all duration-300">
                <ChevronRight size={18} />
              </button>
            </div>
          </FadeUp>
        </div>

        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex gap-6 md:gap-8">
            {testimonials.map((t: any, i: number) => (
              <div key={t.name} className="flex-[0_0_88%] min-w-0 sm:flex-[0_0_46%] lg:flex-[0_0_33.333%]">
                <div className={`border border-border/40 p-7 md:p-9 h-full flex flex-col transition-all duration-600 ${
                  selectedIndex === i ? "bg-card border-border" : "bg-transparent opacity-40"
                }`}>
                  <Quote size={18} className="text-primary/25 mb-5 shrink-0" />
                  <p className="text-muted-foreground leading-[1.8] text-sm flex-1 italic font-light">{t.text}</p>
                  <div className="mt-8 pt-6 border-t border-border/30 flex items-center gap-3">
                    <div className="h-10 w-10 bg-muted/60 flex items-center justify-center">
                      <span className="font-display text-base text-foreground">{t.name?.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="text-sm text-foreground">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.role}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 mt-12">
          {testimonials.map((_: any, i: number) => (
            <button key={i} onClick={() => emblaApi?.scrollTo(i)}
              className={`h-[2px] transition-all duration-500 ${
                selectedIndex === i ? "w-10 bg-primary" : "w-2 bg-border"
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
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });

  const handleHeroMouse = useCallback((e: ReactMouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    });
  }, []);

  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.5], [0, 60]);
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 1.05]);

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
  const cta = content.cta ?? {};

  const aboutProfileImg = aboutMe.profile_image_url || profileImg;
  const credentials: any[] = aboutMe.credentials ?? [];

  // Get first featured image for hero background
  const heroImage = featured[0]?.cover_image_url;

  return (
    <div className="bg-background relative overflow-x-hidden">
      <ArchitectureBusinessJsonLd />
      <PublicNav />

      {/* ══════════ HERO — Split screen ══════════ */}
      <div ref={heroRef} className="relative">
        <motion.section
          style={{ opacity: heroOpacity, y: heroY }}
          onMouseMove={handleHeroMouse}
          className="min-h-[92vh] md:min-h-[95vh] flex items-center relative"
        >
          {/* Mouse-following radial gradient */}
          <div
            className="absolute inset-0 z-[1] pointer-events-none opacity-30 transition-opacity duration-1000"
            style={{
              background: `radial-gradient(600px circle at ${mousePos.x * 100}% ${mousePos.y * 100}%, hsl(var(--primary) / 0.08), transparent 60%)`,
            }}
          />
          {/* Background image with parallax zoom */}
          {heroImage && (
            <motion.div style={{ scale: heroScale }} className="absolute inset-0 z-0">
              <img src={heroImage} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-background/85 dark:bg-background/90" />
            </motion.div>
          )}
          {/* Film grain overlay */}
          <div className="absolute inset-0 noise-overlay pointer-events-none z-[2]" />

          <div className="container py-20 md:py-32 relative z-10">
            <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
              {/* Left content */}
              <div className="lg:col-span-7">
                <motion.p
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.2, ease: luxuryEase }}
                  className="text-[11px] tracking-[0.35em] uppercase text-primary mb-8 md:mb-10"
                >
                  {hero.badge ?? "Architecture · Interiors · Urbanism"}
                </motion.p>

                <motion.h1
                  initial={{ opacity: 1 }}
                  animate={{ opacity: 1 }}
                  className="font-display text-[clamp(3rem,8vw,7.5rem)] leading-[0.92] text-foreground"
                >
                  <span className="overflow-hidden inline-block">
                    {(hero.title_line1 ?? "Building spaces").split(" ").map((word: string, i: number) => (
                      <motion.span
                        key={i}
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.3 + i * 0.08, ease: luxuryEase }}
                        className="inline-block mr-[0.3em]"
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
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.5 + i * 0.08, ease: luxuryEase }}
                        className="inline-block mr-[0.3em] text-primary"
                      >
                        {word}
                      </motion.span>
                    ))}
                  </span>
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.7, delay: 0.6, ease: luxuryEase }}
                  className="mt-8 md:mt-10 text-lg md:text-xl text-muted-foreground max-w-lg leading-relaxed font-light"
                >
                  {hero.description ?? ""}
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.8, ease: luxuryEase }}
                  className="mt-10 md:mt-14 flex flex-col sm:flex-row gap-4"
                >
                  <MagneticButton strength={0.25}>
                    <Button size="lg" asChild className="rounded-none px-10 h-14 tracking-[0.15em] text-sm uppercase">
                      <Link to="/portfolio">{t("home_view_projects")} <ArrowRight size={14} className="ml-3" /></Link>
                    </Button>
                  </MagneticButton>
                  <MagneticButton strength={0.25}>
                    <Button variant="outline" size="lg" asChild className="rounded-none px-10 h-14 tracking-[0.15em] text-sm uppercase border-foreground/20 hover:bg-foreground hover:text-background transition-all duration-500">
                      <Link to="/contact">{t("home_work_with_us")}</Link>
                    </Button>
                  </MagneticButton>
                </motion.div>
              </div>

              {/* Right — Feature image card */}
              <div className="lg:col-span-5 hidden lg:block">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 1, delay: 0.5, ease: luxuryEase }}
                >
                  {heroImage && (
                    <div className="relative group">
                      <div className="aspect-[3/4] overflow-hidden">
                        <img src={heroImage} alt="Featured project" className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-[1200ms]" />
                      </div>
                      {featured[0] && (
                        <Link to={`/portfolio/${featured[0].slug}`} className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-foreground/80 to-transparent">
                          <p className="text-[10px] tracking-[0.2em] uppercase text-background/60 mb-1">{featured[0].category}</p>
                          <p className="font-display text-xl text-background">{featured[0].title}</p>
                        </Link>
                      )}
                    </div>
                  )}
                </motion.div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="text-[9px] tracking-[0.3em] uppercase text-muted-foreground/50">Scroll</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="w-px h-8 bg-gradient-to-b from-muted-foreground/40 to-transparent"
          />
        </motion.div>
      </div>

      {/* ══════════ MARQUEE TICKER ══════════ */}
      <div className="border-t border-b border-border/30 py-5 md:py-6 overflow-hidden">
        <Marquee
          items={["Architecture", "Interior Design", "Urban Planning", "Landscape", "Sustainability", "Heritage", "Residential", "Commercial"]}
          separator="—"
          speed={40}
          className="font-display text-xl md:text-2xl lg:text-3xl text-muted-foreground/25 select-none"
        />
      </div>

      {/* ══════════ ABOUT / INTRO ══════════ */}
      <section className="border-t border-border/30">
        <div className="container py-24 md:py-36">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-start">
            <SlideIn direction="left">
              <div className="relative">
                <ImageReveal>
                  <div className="aspect-[3/4] overflow-hidden relative">
                    <motion.img
                      src={aboutProfileImg}
                      alt={aboutMe.title_prefix ?? "Principal Architect"}
                      className="h-full w-full object-cover object-center"
                      initial={{ scale: 1.1 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.4, ease: luxuryEase }}
                    />
                  </div>
                </ImageReveal>
                {credentials.length > 0 && (
                  <FadeUp delay={0.4}>
                    <div className="mt-6 border-t border-border/40 pt-6">
                      <p className="text-[9px] tracking-[0.35em] uppercase text-muted-foreground mb-4">{t("home_credentials")}</p>
                      <div className="space-y-2.5">
                        {credentials.map((c: any) => {
                          const Icon = ICON_MAP[c.icon] ?? Award;
                          return (
                            <div key={c.text} className="flex items-center gap-3">
                              <Icon size={11} className="text-primary shrink-0" />
                              <span className="text-xs text-muted-foreground">{c.text}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </FadeUp>
                )}
              </div>
            </SlideIn>

            <div className="lg:pt-12">
              <FadeUp>
                <p className="text-[10px] tracking-[0.35em] uppercase text-primary mb-8">{aboutMe.title_prefix ?? "Principal Architect"}</p>
              </FadeUp>
              <TextReveal>
                <h2 className="font-display text-[clamp(2.8rem,5vw,5.5rem)] leading-[1] text-foreground">
                  {aboutMe.name_first ?? "Elena"}<br />
                  <span className="text-primary">{aboutMe.name_last ?? "Markov"}</span>
                </h2>
              </TextReveal>
              <FadeUp delay={0.3}>
                <div className="flex items-center gap-5 my-10 md:my-14">
                  <LineDraw className="h-px w-16 bg-primary/30" delay={0.5} />
                  <span className="text-xs tracking-[0.25em] text-muted-foreground">Est. {aboutMe.est_year ?? "2008"}</span>
                </div>
              </FadeUp>
              <FadeUp delay={0.4}>
                <div className="space-y-6 max-w-md">
                  <p className="text-base leading-[1.9] text-foreground/75">{aboutMe.bio_main ?? ""}</p>
                  <p className="text-sm leading-[1.85] text-muted-foreground">{aboutMe.bio_secondary ?? ""}</p>
                </div>
              </FadeUp>
              <FadeUp delay={0.5}>
                <div className="mt-12 flex flex-col sm:flex-row items-start gap-4">
                  <Button asChild className="rounded-none px-8 h-12 tracking-[0.15em] text-sm uppercase">
                    <Link to="/about">{t("home_full_profile")} <ArrowRight size={14} className="ml-2" /></Link>
                  </Button>
                  <Button variant="ghost" asChild className="rounded-none px-8 h-12 tracking-[0.12em] text-sm text-muted-foreground hover:text-foreground">
                    <Link to="/contact">{t("home_work_together")}</Link>
                  </Button>
                </div>
              </FadeUp>
              {aboutMe.quote && (
                <FadeUp delay={0.6}>
                  <blockquote className="mt-20 pt-10 border-t border-border/30">
                    <p className="font-display text-2xl md:text-3xl text-muted-foreground leading-[1.4] italic">
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
        <section className="border-t border-border/30">
          <div className="container">
            <div className="grid grid-cols-2 md:grid-cols-4">
              {stats.map((s: any, i: number) => (
                <div key={s.label} className={i < stats.length - 1 ? "border-r border-border/30" : ""}>
                  <AnimatedStat value={s.value} suffix={s.suffix} label={s.label} index={i} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══════════ FEATURED PROJECTS — Horizontal scroll cinematic ══════════ */}
      {featured.length > 0 && (
        <section className="border-t border-border/30">
          <div className="container pt-24 md:pt-36 pb-8 md:pb-12">
            <div className="flex items-end justify-between mb-12 md:mb-16">
              <FadeUp>
                <p className="text-[10px] tracking-[0.35em] uppercase text-primary mb-4">{t("home_selected_work")}</p>
                <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-foreground leading-[1.1]">{t("home_featured_work")}</h2>
              </FadeUp>
              <FadeUp delay={0.2}>
                <Link to="/portfolio" className="hidden md:flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group">
                  {t("home_view_all")}
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </FadeUp>
            </div>
          </div>

          {/* Horizontal scroll container */}
          <div className="overflow-x-auto scrollbar-none pb-16 md:pb-24">
            <div className="flex gap-5 md:gap-6 px-[max(1.25rem,calc((100vw-1280px)/2+2rem))]">
              {featured.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: 60 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.8, delay: i * 0.1, ease: luxuryEase }}
                  className="flex-shrink-0 w-[85vw] sm:w-[60vw] md:w-[45vw] lg:w-[35vw] group cursor-pointer"
                  onClick={() => item.cover_image_url && setLightboxIdx(i)}
                  data-cursor-hover
                >
                  <div className="relative overflow-hidden aspect-[3/4] md:aspect-[4/5]">
                    {item.cover_image_url && (
                      <img src={item.cover_image_url} alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-[1200ms] ease-out" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500" />

                    {/* Index number */}
                    <span className="absolute top-6 left-6 font-display text-6xl md:text-7xl text-background/20 leading-none select-none">
                      {String(i + 1).padStart(2, '0')}
                    </span>

                    {/* Bottom info */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                      <div className="flex items-center gap-3 mb-3 text-[10px] text-background/50 tracking-[0.15em] uppercase">
                        {item.category && <span>{item.category}</span>}
                        {item.year && <span>— {item.year}</span>}
                      </div>
                      <Link to={`/portfolio/${item.slug}`} onClick={(e) => e.stopPropagation()}
                        className="font-display text-2xl md:text-3xl lg:text-4xl text-background leading-tight block group-hover:translate-y-0 translate-y-1 transition-transform duration-500">
                        {item.title}
                      </Link>
                      {item.location && (
                        <p className="flex items-center gap-1.5 mt-3 text-xs text-background/40">
                          <MapPin size={10} />{item.location}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="container pb-12 md:hidden">
            <FadeUp delay={0.2}>
              <div className="text-center">
                <Button variant="outline" asChild className="rounded-none tracking-[0.1em] uppercase text-xs">
                  <Link to="/portfolio">{t("home_all_projects")}</Link>
                </Button>
              </div>
            </FadeUp>
          </div>
        </section>
      )}

      {/* ══════════ SERVICES ══════════ */}
      {servicesHome.length > 0 && (
        <section className="border-t border-border/30 bg-muted/20">
          <div className="container py-24 md:py-36">
            <FadeUp>
              <p className="text-[10px] tracking-[0.35em] uppercase text-primary mb-4">{t("home_disciplines")}</p>
              <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-foreground leading-[1.1] mb-16 md:mb-20">{t("home_what_we_do")}</h2>
            </FadeUp>

            <StaggerContainer className="grid gap-px grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" staggerDelay={0.08}>
              {servicesHome.map((s: any, i: number) => {
                const Icon = ICON_MAP[s.icon] ?? Building2;
                return (
                  <StaggerItem key={s.title}>
                    <div className="bg-background p-8 md:p-10 group hover:bg-card transition-colors duration-500 h-full border border-border/20">
                      <span className="font-display text-4xl text-border/40 group-hover:text-primary/30 transition-colors duration-500 block mb-6">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <Icon size={20} className="text-primary mb-6" />
                      <h3 className="font-display text-xl md:text-2xl text-foreground mb-4 leading-tight">{s.title}</h3>
                      <p className="text-sm text-muted-foreground leading-[1.8]">{s.desc}</p>
                    </div>
                  </StaggerItem>
                );
              })}
            </StaggerContainer>
          </div>
        </section>
      )}

      {/* ══════════ TESTIMONIALS ══════════ */}
      {testimonials.length > 0 && (
        <TestimonialsCarousel testimonials={testimonials} t={t} />
      )}

      {/* ══════════ AWARDS ══════════ */}
      {awards.length > 0 && (
        <section className="border-t border-border/30">
          <div className="container py-24 md:py-36">
            <FadeUp>
              <div className="text-center mb-16 md:mb-20">
                <p className="text-[10px] tracking-[0.35em] uppercase text-primary mb-4">{t("home_awards_recognition")}</p>
                <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-foreground leading-[1.1]">{t("home_honored_work")}</h2>
              </div>
            </FadeUp>

            <StaggerContainer className="divide-y divide-border/30 max-w-3xl mx-auto" staggerDelay={0.06}>
              {awards.map((a: any) => (
                <StaggerItem key={a.year + a.title}>
                  <div className="flex items-start gap-6 md:gap-10 py-7 md:py-9 group">
                    <span className="font-display text-3xl md:text-4xl text-primary/40 shrink-0 w-[80px]">{a.year}</span>
                    <div className="flex-1">
                      <h3 className="font-display text-lg md:text-xl text-foreground leading-snug group-hover:text-primary transition-colors duration-300">
                        {a.title}
                      </h3>
                      <p className="text-xs tracking-[0.15em] text-muted-foreground uppercase mt-2">{a.org}</p>
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>
      )}

      {/* CTA is now part of the footer */}

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
