import { PublicNav } from "@/components/PublicNav";
import { PublicFooter } from "@/components/PublicFooter";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useSiteContent } from "@/hooks/useSiteContent";
import { useSEO } from "@/hooks/useSEO";
import { FloatingChatButton } from "@/components/FloatingChatButton";
import { useTranslation } from "@/i18n/LanguageContext";
import { FadeUp, StaggerContainer, StaggerItem, SlideIn, TextReveal, LineDraw, ImageReveal } from "@/components/motion/MotionWrappers";
import { motion } from "framer-motion";

const luxuryEase = [0.22, 1, 0.36, 1] as const;

export default function About() {
  useSEO({ title: "About", description: "Learn about our architecture studio, values, and team" });
  const { content } = useSiteContent("about_page", "values", "team");
  const { t } = useTranslation();

  const page = content.about_page ?? {};
  const values: any[] = content.values ?? [];
  const team: any[] = content.team ?? [];
  const storyParagraphs: string[] = page.story_paragraphs ?? [];

  return (
    <div className="bg-background relative overflow-x-hidden">
      <PublicNav />

      {/* ── Hero ── */}
      <section className="container py-20 md:py-32 lg:py-40 relative z-10">
        <div className="max-w-4xl">
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: luxuryEase }}
            className="text-[10px] tracking-[0.35em] uppercase text-primary mb-8"
          >
            {page.hero_subtitle ?? t("about_the_studio")}
          </motion.p>
          <TextReveal>
            <h1 className="font-display text-[clamp(2.5rem,7vw,7rem)] leading-[0.95] text-foreground">
              {page.hero_title_line1 ?? "Architecture as a"}
              <br />
              <span className="text-primary">{page.hero_title_line2 ?? "long conversation."}</span>
            </h1>
          </TextReveal>
        </div>
      </section>

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
            <FadeUp>
              <p className="text-[10px] tracking-[0.35em] uppercase text-primary mb-4">{t("about_principles")}</p>
              <h2 className="font-display text-3xl md:text-5xl text-foreground leading-[1.1] mb-16 md:mb-20">
                What guides us
              </h2>
            </FadeUp>
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
            <FadeUp>
              <p className="text-[10px] tracking-[0.35em] uppercase text-primary mb-4">{t("about_people")}</p>
              <h2 className="font-display text-3xl md:text-5xl text-foreground leading-[1.1] mb-16 md:mb-20">
                Our team
              </h2>
            </FadeUp>
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

      <PublicFooter />
      <FloatingChatButton />
    </div>
  );
}
