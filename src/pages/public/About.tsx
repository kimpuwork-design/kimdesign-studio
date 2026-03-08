import { PublicNav } from "@/components/PublicNav";
import { PublicFooter } from "@/components/PublicFooter";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useSiteContent } from "@/hooks/useSiteContent";
import { useSEO } from "@/hooks/useSEO";
import { FloatingChatButton } from "@/components/FloatingChatButton";
import { useTranslation } from "@/i18n/LanguageContext";
import { FadeUp, FadeIn, StaggerContainer, StaggerItem, HoverCard, SlideIn } from "@/components/motion/MotionWrappers";

export default function About() {
  useSEO({ title: "About", description: "Learn about our architecture studio, values, and team" });
  const { content } = useSiteContent("about_page", "values", "team");
  const { t } = useTranslation();

  const page = content.about_page ?? {};
  const values: any[] = content.values ?? [];
  const team: any[] = content.team ?? [];
  const storyParagraphs: string[] = page.story_paragraphs ?? [];

  return (
    <div className="bg-background relative">
      <PublicNav />

      {/* Ambient orbs */}
      <div className="fixed top-1/3 -left-40 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[150px] pointer-events-none" />
      <div className="fixed bottom-1/4 -right-40 w-[400px] h-[400px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

      {/* Hero */}
      <section className="container py-12 md:py-20 lg:py-28 relative z-10">
        <div className="max-w-3xl">
          <FadeUp>
            <p className="text-[10px] md:text-xs font-medium tracking-[0.25em] uppercase text-primary mb-3 md:mb-4">{page.hero_subtitle ?? t("about_the_studio")}</p>
          </FadeUp>
          <FadeUp delay={0.1}>
            <h1 className="font-display text-[clamp(1.75rem,5vw,5.5rem)] font-light leading-[1.1] text-foreground">
              {page.hero_title_line1 ?? "Architecture as a"}<br />
              <em className="not-italic font-semibold">{page.hero_title_line2 ?? "long conversation."}</em>
            </h1>
          </FadeUp>
        </div>
      </section>

      {/* Story */}
      {storyParagraphs.length > 0 && (
        <section className="border-t border-border/50 relative z-10">
          <div className="container grid gap-8 md:gap-16 py-12 md:py-20 grid-cols-1 md:grid-cols-2">
            <SlideIn direction="left">
              <div className="space-y-4 md:space-y-6 text-muted-foreground leading-relaxed text-sm md:text-base">
                {storyParagraphs.slice(0, Math.ceil(storyParagraphs.length / 2)).map((p, i) => (
                  <p key={i} className={i === 0 ? "text-base md:text-lg font-light text-foreground" : ""}>{p}</p>
                ))}
              </div>
            </SlideIn>
            <SlideIn direction="right" delay={0.15}>
              <div className="space-y-4 md:space-y-6 text-muted-foreground leading-relaxed text-sm md:text-base">
                {storyParagraphs.slice(Math.ceil(storyParagraphs.length / 2)).map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
                <Button variant="outline" className="rounded-2xl mt-4" asChild>
                  <Link to="/contact">{t("about_get_in_touch")} <ArrowRight size={14} className="ml-2" /></Link>
                </Button>
              </div>
            </SlideIn>
          </div>
        </section>
      )}

      {/* Values */}
      {values.length > 0 && (
        <section className="border-t border-border/50 py-12 md:py-20 relative z-10">
          <div className="container">
            <FadeUp>
              <p className="text-[10px] md:text-xs font-medium tracking-[0.25em] uppercase text-primary mb-6 md:mb-10">{t("about_principles")}</p>
            </FadeUp>
            <StaggerContainer className="grid gap-3 md:gap-4 grid-cols-2 lg:grid-cols-4">
              {values.map((v: any) => (
                <StaggerItem key={v.title}>
                  <HoverCard>
                    <div className="glass-card-public glass-glow-ring p-5 md:p-8 h-full">
                      <h3 className="font-display text-base md:text-xl font-medium text-foreground mb-2 md:mb-3">{v.title}</h3>
                      <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
                    </div>
                  </HoverCard>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>
      )}

      {/* Team */}
      {team.length > 0 && (
        <section className="container py-12 md:py-20 relative z-10">
          <FadeUp>
            <p className="text-[10px] md:text-xs font-medium tracking-[0.25em] uppercase text-primary mb-6 md:mb-10">{t("about_people")}</p>
          </FadeUp>
          <StaggerContainer className="grid gap-3 md:gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
            {team.map((p: any) => (
              <StaggerItem key={p.name}>
                <HoverCard>
                  <div className="group glass-card-public overflow-hidden glass-glow-ring">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} className="h-36 md:h-48 w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="h-36 md:h-48 bg-secondary/60" />
                    )}
                    <div className="p-4 md:p-6">
                      <h3 className="font-display text-base md:text-xl font-medium text-foreground">{p.name}</h3>
                      <p className="text-[10px] md:text-xs tracking-wide text-primary mt-0.5 md:mt-1 mb-2 md:mb-3 uppercase">{p.role}</p>
                      <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">{p.bio}</p>
                    </div>
                  </div>
                </HoverCard>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </section>
      )}

      <PublicFooter />
      <FloatingChatButton />
    </div>
  );
}
