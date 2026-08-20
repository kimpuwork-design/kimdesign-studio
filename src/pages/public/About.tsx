import { PublicNav } from "@/components/PublicNav";
import { PublicFooter } from "@/components/PublicFooter";
import { ArrowRight, Award, Users, Clock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useSiteContent } from "@/hooks/useSiteContent";
import { useSEO } from "@/hooks/useSEO";

import { useTranslation } from "@/i18n/LanguageContext";
import { FadeUp, StaggerContainer, StaggerItem, SlideIn, ImageReveal, LineDraw } from "@/components/motion/MotionWrappers";
import { SectionLabel } from "@/components/SectionLabel";
import { MagneticButton } from "@/components/MagneticButton";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState, useEffect, useCallback } from "react";

const luxuryEase = [0.22, 1, 0.36, 1] as const;

/* ── Parallax Image ── */
function ParallaxImage({ src, alt }: { src: string; alt: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-8%", "8%"]);

  return (
    <div ref={ref} className="overflow-hidden aspect-[3/4] relative">
      <motion.img src={src} alt={alt} style={{ y }}
        className="h-[116%] w-full object-cover object-center absolute top-0 left-0" />
    </div>
  );
}

/* ── Counter ── */
function useCountUp(target: number, duration = 2000) {
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

function AnimatedNumber({ value, suffix = "", label }: { value: number; suffix?: string; label: string }) {
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
    <div ref={ref} className="text-center">
      <p className="font-display text-4xl md:text-5xl text-foreground">{count}<span className="text-primary/60">{suffix}</span></p>
      <p className="mt-2 text-[9px] tracking-[0.3em] uppercase text-muted-foreground/50 font-mono-label">{label}</p>
    </div>
  );
}

export default function About() {
  const { t } = useTranslation();
  useSEO({ title: t("seo_about_title"), description: t("seo_about_description") });
  const { content } = useSiteContent("about_page", "values", "team");
  const { t } = useTranslation();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.5], [0, 80]);
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.97]);

  const page = content.about_page ?? {};
  const values: any[] = content.values ?? [];
  const team: any[] = content.team ?? [];
  const storyParagraphs: string[] = page.story_paragraphs ?? [];

  return (
    <div className="bg-background relative overflow-x-hidden">
      <PublicNav />

      {/* ── Cinematic Hero ── */}
      <div ref={heroRef} className="relative overflow-hidden min-h-[44vh] md:min-h-[58vh] flex items-center pt-14 md:pt-20">
        <div className="absolute inset-0 pointer-events-none overflow-hidden hidden md:block">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1, duration: 1 }}>
            <motion.div animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }} transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-[12%] right-[6%] w-[200px] h-[200px] border border-primary/[0.05]" />
            <motion.div animate={{ y: [0, 15, 0], rotate: [15, 20, 15] }} transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-[30%] right-[10%] w-[120px] h-[120px] border border-primary/[0.04] rotate-[15deg]" />
            <motion.div animate={{ y: [0, -12, 0] }} transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
              className="absolute bottom-[15%] left-[4%] w-[90px] h-[90px] border border-primary/[0.04] rounded-full" />
            <motion.div animate={{ scaleY: [0.5, 1, 0.5] }} transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-[8%] left-[8%] w-px h-[180px] bg-gradient-to-b from-transparent via-primary/[0.06] to-transparent"
              style={{ transformOrigin: "top" }} />
          </motion.div>
        </div>
        <div className="absolute inset-0 noise-overlay pointer-events-none z-[1]" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-[2] pointer-events-none" />

        <motion.div style={{ opacity: heroOpacity, y: heroY, scale: heroScale }} className="relative z-10 w-full">
          <section className="container py-6 md:py-14">
            <div className="max-w-4xl">
              <motion.div initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: "3rem" }} transition={{ duration: 0.8, delay: 0.1, ease: luxuryEase }}
                className="h-px bg-primary mb-8" />
              <SectionLabel text={page.hero_subtitle ?? t("about_the_studio")} />
              <h1 className="font-display text-[clamp(2.1rem,7.5vw,7.5rem)] leading-[0.95] md:leading-[0.92] text-foreground">
                {(page.hero_title_line1 ?? "Architecture as a").split(" ").map((word: string, i: number) => (
                  <motion.span key={i} initial={{ opacity: 0, y: 55, rotateX: -15 }} animate={{ opacity: 1, y: 0, rotateX: 0 }}
                    transition={{ duration: 0.8, delay: 0.3 + i * 0.08, ease: luxuryEase }}
                    className="inline-block mr-[0.25em]">{word}</motion.span>
                ))}
                <br />
                <span className="text-primary hero-shimmer-text">
                  {(page.hero_title_line2 ?? "long conversation.").split(" ").map((word: string, i: number) => (
                    <motion.span key={`l2-${i}`} initial={{ opacity: 0, y: 55, rotateX: -15 }} animate={{ opacity: 1, y: 0, rotateX: 0 }}
                      transition={{ duration: 0.8, delay: 0.55 + i * 0.08, ease: luxuryEase }}
                      className="inline-block mr-[0.25em]">{word}</motion.span>
                  ))}
                </span>
              </h1>
              <FadeUp delay={0.5}>
                <p className="mt-8 text-base md:text-lg text-muted-foreground font-light leading-[1.85] max-w-lg">
                  {page.hero_description ?? "A studio dedicated to creating spaces that inspire, endure, and transform."}
                </p>
              </FadeUp>
            </div>
          </section>
        </motion.div>
      </div>


      {/* ── Story ── */}
      {storyParagraphs.length > 0 && (
        <section className="border-t border-border/30 relative z-10">
          <div className="container grid gap-12 md:gap-20 py-24 md:py-36 grid-cols-1 md:grid-cols-2">
            <SlideIn direction="left">
              <div className="space-y-6 text-muted-foreground leading-[1.85]">
                {storyParagraphs.slice(0, Math.ceil(storyParagraphs.length / 2)).map((p, i) => (
                  <p key={i} className={i === 0 ? "text-lg font-light text-foreground/80 leading-[1.9]" : "text-sm"}>{p}</p>
                ))}
              </div>
            </SlideIn>
            <SlideIn direction="right" delay={0.15}>
              <div className="space-y-6 text-muted-foreground leading-[1.85] text-sm">
                {storyParagraphs.slice(Math.ceil(storyParagraphs.length / 2)).map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
                <div className="pt-4">
                  <MagneticButton strength={0.2}>
                    <Button variant="outline" className="rounded-none tracking-[0.12em] text-xs uppercase px-8 h-11 border-foreground/20 hover:bg-foreground hover:text-background transition-all duration-500" asChild>
                      <Link to="/contact">{t("about_get_in_touch")} <ArrowRight size={12} className="ml-2" /></Link>
                    </Button>
                  </MagneticButton>
                </div>
              </div>
            </SlideIn>
          </div>
        </section>
      )}

      {/* ── Values ── */}
      {values.length > 0 && (
        <section className="border-t border-border/30 py-24 md:py-36 relative z-10 bg-muted/10">
          <div className="container">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-16 md:mb-20">
              <div>
                <SectionLabel text={t("about_principles")} />
                <FadeUp>
                  <h2 className="font-display text-3xl md:text-5xl text-foreground leading-[1.1]">What guides us</h2>
                </FadeUp>
              </div>
              <FadeUp delay={0.2}>
                <p className="text-sm text-muted-foreground max-w-sm leading-[1.8]">Core principles that shape every decision, design, and detail in our work.</p>
              </FadeUp>
            </div>
            <StaggerContainer className="grid gap-px grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" staggerDelay={0.08}>
              {values.map((v: any, i: number) => (
                <StaggerItem key={v.title}>
                  <div className="bg-background border border-border/20 p-8 md:p-10 h-full group hover:bg-card transition-all duration-500 relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-px bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-700 origin-left" />
                    <span className="font-display text-3xl text-border/40 group-hover:text-primary/30 transition-colors duration-500 block mb-6">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <h3 className="font-display text-xl md:text-2xl text-foreground mb-3 leading-tight group-hover:text-primary transition-colors duration-300">{v.title}</h3>
                    <p className="text-sm text-muted-foreground leading-[1.8]">{v.desc}</p>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>
      )}

      {/* ── Team ── */}
      {team.length > 0 && (
        <section className="border-t border-border/30 py-24 md:py-36 relative z-10">
          <div className="container">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-16 md:mb-20">
              <div>
                <SectionLabel text={t("about_people")} />
                <FadeUp>
                  <h2 className="font-display text-3xl md:text-5xl text-foreground leading-[1.1]">Our team</h2>
                </FadeUp>
              </div>
              <FadeUp delay={0.2}>
                <p className="text-sm text-muted-foreground max-w-xs leading-[1.8]">The creative minds behind every project.</p>
              </FadeUp>
            </div>
            <StaggerContainer className="grid gap-6 md:gap-8 grid-cols-1 sm:grid-cols-2 md:grid-cols-3" staggerDelay={0.1}>
              {team.map((p: any) => (
                <StaggerItem key={p.name}>
                  <div className="group" data-cursor-hover data-cursor-label="View">
                    <ImageReveal>
                      <div className="overflow-hidden aspect-[3/4] relative">
                        {p.image_url ? (
                          <img src={p.image_url} alt={p.name} className="h-full w-full object-cover group-hover:scale-[1.04] transition-transform [transition-duration:1000ms] ease-out" />
                        ) : (
                          <div className="h-full w-full bg-muted/30 flex items-center justify-center">
                            <Users size={40} className="text-muted-foreground/15" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-foreground/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      </div>
                    </ImageReveal>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: 0.3, ease: luxuryEase }}
                      className="mt-5"
                    >
                      <h3 className="font-display text-xl text-foreground group-hover:text-primary transition-colors duration-300">{p.name}</h3>
                      <p className="text-[10px] tracking-[0.2em] text-primary uppercase mt-1 mb-3 font-mono-label">{p.role}</p>
                      <p className="text-sm text-muted-foreground leading-[1.7]">{p.bio}</p>
                    </motion.div>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>
      )}

      {/* ── CTA ── */}
      <section className="border-t border-border/30 relative z-10 bg-muted/10">
        <div className="container py-32 md:py-48">
          <FadeUp>
            <div className="max-w-3xl mx-auto text-center">
              <SectionLabel text="Collaborate" className="justify-center" />
              <h2 className="font-display text-4xl md:text-6xl lg:text-7xl text-foreground leading-[1.05]">
                {page.cta_title ?? "Let's build something meaningful."}
              </h2>
              <p className="mt-6 text-muted-foreground text-lg font-light leading-[1.8]">{page.cta_description ?? "We're always open to new conversations and collaborations."}</p>
              <MagneticButton strength={0.2}>
                <Button className="mt-10 rounded-none px-12 h-14 tracking-[0.15em] text-sm uppercase" size="lg" asChild>
                  <Link to="/contact">{t("about_get_in_touch")} <ArrowRight size={14} className="ml-3" /></Link>
                </Button>
              </MagneticButton>
            </div>
          </FadeUp>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
