import { PublicNav } from "@/components/PublicNav";
import { PublicFooter } from "@/components/PublicFooter";
import { Building2, Ruler, Leaf, PenTool, FileText, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useSiteContent } from "@/hooks/useSiteContent";
import { useSEO } from "@/hooks/useSEO";
import { FloatingChatButton } from "@/components/FloatingChatButton";
import { useTranslation } from "@/i18n/LanguageContext";
import { FadeUp, StaggerContainer, StaggerItem, HoverCard } from "@/components/motion/MotionWrappers";

const ICON_MAP: Record<string, any> = { Building2, Ruler, Leaf, PenTool, FileText, Lightbulb };

export default function Services() {
  useSEO({ title: "Services", description: "Architecture, interior design, and planning services by KIM DESIGN STUDIO" });
  const { content } = useSiteContent("services_full", "services_page", "process");
  const { t } = useTranslation();

  const services: any[] = content.services_full ?? [];
  const page = content.services_page ?? {};
  const process: any[] = content.process ?? [];

  return (
    <div className="bg-background relative">
      <PublicNav />

      {/* Ambient orbs */}
      <div className="fixed top-1/4 -right-40 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[150px] pointer-events-none" />
      <div className="fixed bottom-1/3 -left-40 w-[400px] h-[400px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

      {/* Hero */}
      <section className="container py-12 md:py-20 lg:py-28 relative z-10">
        <div className="max-w-2xl">
          <FadeUp>
            <p className="text-[10px] md:text-xs font-medium tracking-[0.25em] uppercase text-primary mb-3 md:mb-4">{page.hero_subtitle ?? "Services"}</p>
          </FadeUp>
          <FadeUp delay={0.1}>
            <h1 className="font-display text-[clamp(1.75rem,5vw,5.5rem)] font-light leading-[1.1] text-foreground">
              {page.hero_title_line1 ?? "Every project,"}<br />
              <em className="not-italic font-semibold">{page.hero_title_line2 ?? "built from scratch."}</em>
            </h1>
          </FadeUp>
          <FadeUp delay={0.2}>
            <p className="mt-4 md:mt-6 text-sm md:text-base text-muted-foreground font-light leading-relaxed">
              {page.hero_description ?? ""}
            </p>
          </FadeUp>
        </div>
      </section>

      {/* Services grid */}
      {services.length > 0 && (
        <section className="border-t border-border/50 relative z-10">
          <div className="container py-10 md:py-16">
            <StaggerContainer className="grid gap-3 md:gap-4 sm:grid-cols-2 lg:grid-cols-3" staggerDelay={0.08}>
              {services.map((s: any) => {
                const Icon = ICON_MAP[s.icon] ?? Building2;
                return (
                  <StaggerItem key={s.title}>
                    <HoverCard>
                      <div className="group rounded-2xl border border-border/50 bg-background/60 backdrop-blur-sm p-5 md:p-8 hover:border-primary/30 hover:shadow-[0_0_20px_rgba(var(--primary),0.05)] transition-all duration-300 h-full">
                        <div className="rounded-xl bg-primary/10 p-2 md:p-2.5 w-fit mb-3 md:mb-5">
                          <Icon size={18} className="md:w-[22px] md:h-[22px] text-primary" />
                        </div>
                        <p className="text-[9px] md:text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-1.5 md:mb-2">{s.stage}</p>
                        <h3 className="font-display text-lg md:text-2xl font-medium text-foreground mb-2 md:mb-3">{s.title}</h3>
                        <p className="text-xs md:text-sm text-muted-foreground leading-relaxed mb-4 md:mb-6">{s.desc}</p>
                        <Button variant="outline" className="rounded-2xl text-xs tracking-wide" size="sm" asChild>
                          <Link to="/contact">{t("services_enquire")}</Link>
                        </Button>
                      </div>
                    </HoverCard>
                  </StaggerItem>
                );
              })}
            </StaggerContainer>
          </div>
        </section>
      )}

      {/* Process */}
      {process.length > 0 && (
        <section className="border-t border-border/50 py-12 md:py-20 relative z-10">
          <div className="container">
            <FadeUp>
              <p className="text-[10px] md:text-xs font-medium tracking-[0.25em] uppercase text-primary mb-8 md:mb-12">{t("services_our_process")}</p>
            </FadeUp>
            <StaggerContainer className="grid gap-3 md:gap-6 grid-cols-2 md:grid-cols-4" staggerDelay={0.12}>
              {process.map((step: any) => (
                <StaggerItem key={step.n}>
                  <HoverCard>
                    <div className="rounded-2xl border border-border/50 bg-background/60 backdrop-blur-sm p-4 md:p-6 hover:border-primary/30 transition-all duration-300 h-full">
                      <span className="font-display text-2xl md:text-4xl font-light text-primary/40">{step.n}</span>
                      <h3 className="font-display text-base md:text-xl font-medium text-foreground mt-2 md:mt-3 mb-1.5 md:mb-2">{step.title}</h3>
                      <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                    </div>
                  </HoverCard>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="container py-12 md:py-20 text-center relative z-10">
        <FadeUp>
          <h2 className="font-display text-2xl md:text-4xl font-light text-foreground mb-3 md:mb-4">{page.cta_title ?? t("services_ready_discuss")}</h2>
          <p className="text-sm md:text-base text-muted-foreground mb-6 md:mb-8">{page.cta_description ?? ""}</p>
          <Button className="rounded-2xl px-8 md:px-10 tracking-wide" size="lg" asChild>
            <Link to="/contact">{t("services_start_conversation")}</Link>
          </Button>
        </FadeUp>
      </section>
      <PublicFooter />
      <FloatingChatButton />
    </div>
  );
}
