import { PublicNav } from "@/components/PublicNav";
import { PublicFooter } from "@/components/PublicFooter";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useSiteContent } from "@/hooks/useSiteContent";
import { useSEO } from "@/hooks/useSEO";
import { FloatingChatButton } from "@/components/FloatingChatButton";
import { useTranslation } from "@/i18n/LanguageContext";
import { FadeUp, StaggerContainer, StaggerItem, SlideIn, ImageReveal } from "@/components/motion/MotionWrappers";
import { SectionLabel } from "@/components/SectionLabel";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

const luxuryEase = [0.22, 1, 0.36, 1] as const;

export default function About() {
  useSEO({ title: "About", description: "Learn about our architecture studio, values, and team" });
  const { content } = useSiteContent("about_page", "values", "team");
  const { t } = useTranslation();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.5], [0, 80]);

  const page = content.about_page ?? {};
  const values: any[] = content.values ?? [];
  const team: any[] = content.team ?? [];
  const storyParagraphs: string[] = page.story_paragraphs ?? [];

  return (
    <div className="bg-background relative overflow-x-hidden">
      <PublicNav />

      {/* ── Cinematic Hero ── */}
      <div ref={heroRef} className="relative overflow-hidden">
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

        <motion.div style={{ opacity: heroOpacity, y: heroY }} className="relative z-10">
          <section className="container py-20 md:py-32 lg:py-40">
            <div className="max-w-4xl">
              <SectionLabel text={page.hero_subtitle ?? t("about_the_studio")} />
              <h1 className="font-display text-[clamp(2.5rem,7vw,7rem)] leading-[0.95] text-foreground">
                {(page.hero_title_line1 ?? "Architecture as a").split(" ").map((word: string, i: number) => (
                  <motion.span key={i} initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.3 + i * 0.08, ease: luxuryEase }}
                    className="inline-block mr-[0.3em]">{word}</motion.span>
                ))}
                <br />
                <span className="text-primary hero-shimmer-text">
                  {(page.hero_title_line2 ?? "long conversation.").split(" ").map((word: string, i: number) => (
                    <motion.span key={`l2-${i}`} initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.7, delay: 0.6 + i * 0.08, ease: luxuryEase }}
                      className="inline-block mr-[0.3em]">{word}</motion.span>
                  ))}
                </span>
              </h1>
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
                  <Button variant="outline" className="rounded-none tracking-[0.12em] text-xs uppercase px-8 h-11 border-foreground/20 hover:bg-foreground hover:text-background transition-all duration-500" asChild>
                    <Link to="/contact">{t("about_get_in_touch")} <ArrowRight size={12} className="ml-2" /></Link>
                  </Button>
                </div>
              </div>
            </SlideIn>
          </div>
        </section>
      )}

      {/* ── Values ── */}
      {values.length > 0 && (
        <section className="border-t border-border/30 py-24 md:py-36 relative z-10">
          <div className="container">
            <div>
              <SectionLabel text={t("about_principles")} />
              <FadeUp>
                <h2 className="font-display text-3xl md:text-5xl text-foreground leading-[1.1] mb-16 md:mb-20">What guides us</h2>
              </FadeUp>
            </div>
            <StaggerContainer className="grid gap-px grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" staggerDelay={0.08}>
              {values.map((v: any, i: number) => (
                <StaggerItem key={v.title}>
                  <div className="bg-background border border-border/20 p-8 md:p-10 h-full group hover:bg-card transition-colors duration-500">
                    <span className="font-display text-3xl text-border/40 group-hover:text-primary/30 transition-colors duration-500 block mb-6">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <h3 className="font-display text-xl md:text-2xl text-foreground mb-3 leading-tight">{v.title}</h3>
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
            <div>
              <SectionLabel text={t("about_people")} />
              <FadeUp>
                <h2 className="font-display text-3xl md:text-5xl text-foreground leading-[1.1] mb-16 md:mb-20">Our team</h2>
              </FadeUp>
            </div>
            <StaggerContainer className="grid gap-6 md:gap-8 grid-cols-1 sm:grid-cols-2 md:grid-cols-3" staggerDelay={0.1}>
              {team.map((p: any) => (
                <StaggerItem key={p.name}>
                  <div className="group">
                    <ImageReveal>
                      <div className="overflow-hidden aspect-[3/4]">
                        {p.image_url ? (
                          <img src={p.image_url} alt={p.name} className="h-full w-full object-cover group-hover:scale-[1.03] transition-transform duration-[900ms]" />
                        ) : (
                          <div className="h-full w-full bg-muted/30" />
                        )}
                      </div>
                    </ImageReveal>
                    <div className="mt-5">
                      <h3 className="font-display text-xl text-foreground">{p.name}</h3>
                      <p className="text-[10px] tracking-[0.2em] text-primary uppercase mt-1 mb-3">{p.role}</p>
                      <p className="text-sm text-muted-foreground leading-[1.7]">{p.bio}</p>
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>
      )}

      {/* ── CTA ── */}
      <section className="border-t border-border/30 relative z-10">
        <div className="container py-32 md:py-48">
          <FadeUp>
            <div className="max-w-3xl mx-auto text-center">
              <SectionLabel text="Collaborate" className="justify-center" />
              <h2 className="font-display text-4xl md:text-6xl lg:text-7xl text-foreground leading-[1.05]">
                {page.cta_title ?? "Let's build something meaningful."}
              </h2>
              <p className="mt-6 text-muted-foreground text-lg font-light">{page.cta_description ?? "We're always open to new conversations and collaborations."}</p>
              <Button className="mt-10 rounded-none px-12 h-14 tracking-[0.15em] text-sm uppercase" size="lg" asChild>
                <Link to="/contact">{t("about_get_in_touch")} <ArrowRight size={14} className="ml-3" /></Link>
              </Button>
            </div>
          </FadeUp>
        </div>
      </section>

      <PublicFooter />
      <FloatingChatButton />
    </div>
  );
}
