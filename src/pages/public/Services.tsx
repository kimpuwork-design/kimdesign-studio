import { PublicNav } from "@/components/PublicNav";
import { PublicFooter } from "@/components/PublicFooter";
import { Building2, Ruler, Leaf, PenTool, FileText, Lightbulb, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useSiteContent } from "@/hooks/useSiteContent";
import { useSEO } from "@/hooks/useSEO";
import { useTranslation } from "@/i18n/LanguageContext";
import { FadeUp, StaggerContainer, StaggerItem } from "@/components/motion/MotionWrappers";
import { SectionLabel } from "@/components/SectionLabel";

const ICON_MAP: Record<string, any> = { Building2, Ruler, Leaf, PenTool, FileText, Lightbulb };

export default function Services() {
  const { content } = useSiteContent("services_full", "services_page", "process");
  const { t } = useTranslation();
  useSEO({ title: t("seo_services_title"), description: t("seo_services_description") });

  const services: any[] = content.services_full ?? [];
  const page = content.services_page ?? {};
  const process: any[] = content.process ?? [];

  return (
    <div className="bg-background min-h-screen">
      <PublicNav />

      <main id="main-content">
        {/* Hero */}
        <section className="container py-16 md:py-28">
          <div className="max-w-3xl">
            <div className="h-px w-12 bg-primary mb-8" />
            <SectionLabel text={page.hero_subtitle ?? "Services"} />
            <h1 className="font-display text-[clamp(2.1rem,6.5vw,5.5rem)] leading-[0.95] text-foreground">
              {page.hero_title_line1 ?? "Every project,"}
              <span className="block text-primary">{page.hero_title_line2 ?? "built from scratch."}</span>
            </h1>
            {page.hero_description && (
              <p className="mt-8 text-base md:text-lg text-muted-foreground font-light leading-[1.85] max-w-xl">
                {page.hero_description}
              </p>
            )}
          </div>
        </section>

        {/* Services grid */}
        {services.length > 0 && (
          <section className="border-t border-border/30 py-20 md:py-28">
            <div className="container">
              <StaggerContainer className="grid gap-px grid-cols-1 md:grid-cols-2 bg-border/20 border border-border/20" staggerDelay={0.08}>
                {services.map((service: any, i: number) => {
                  const Icon = ICON_MAP[service.icon] ?? Building2;
                  return (
                    <StaggerItem key={service.title ?? i}>
                      <div className="bg-background p-10 md:p-14 h-full group hover:bg-card transition-colors duration-500">
                        <div className="flex items-center gap-4 mb-8">
                          <span className="font-display text-5xl text-border/30">{String(i + 1).padStart(2, "0")}</span>
                          <Icon size={20} className="text-primary" />
                        </div>
                        {service.stage && (
                          <p className="text-[9px] tracking-[0.3em] uppercase text-primary/60 mb-3 font-mono-label">{service.stage}</p>
                        )}
                        <h2 className="font-display text-2xl md:text-3xl text-foreground mb-4">{service.title}</h2>
                        <p className="text-sm text-muted-foreground leading-[1.9]">{service.desc}</p>
                      </div>
                    </StaggerItem>
                  );
                })}
              </StaggerContainer>
            </div>
          </section>
        )}

        {/* Process */}
        {process.length > 0 && (
          <section className="border-t border-border/30 py-20 md:py-28 bg-muted/10">
            <div className="container">
              <div className="mb-12 md:mb-16 max-w-2xl">
                <SectionLabel text={t("services_our_process")} />
                <h2 className="font-display text-3xl md:text-5xl text-foreground leading-[1.1]">How we work</h2>
              </div>
              <div className="max-w-3xl border-t border-border/30">
                {process.map((step: any, i: number) => (
                  <FadeUp key={step.n ?? i}>
                    <div className="grid grid-cols-12 gap-4 md:gap-8 py-8 border-b border-border/30">
                      <span className="col-span-2 font-display text-3xl md:text-4xl text-border/50">{step.n}</span>
                      <div className="col-span-10">
                        <h3 className="font-display text-xl md:text-2xl text-foreground">{step.title}</h3>
                        <p className="mt-3 text-sm text-muted-foreground leading-[1.9] max-w-lg">{step.desc}</p>
                      </div>
                    </div>
                  </FadeUp>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="border-t border-border/30">
          <div className="container py-20 md:py-28">
            <div className="max-w-2xl">
              <h2 className="font-display text-3xl md:text-5xl text-foreground leading-[1.05]">
                {page.cta_title ?? t("services_ready_discuss")}
              </h2>
              {page.cta_description && (
                <p className="mt-5 text-muted-foreground text-base font-light leading-[1.8]">{page.cta_description}</p>
              )}
              <Button className="mt-9 rounded-none px-10 h-12 tracking-[0.15em] text-xs uppercase" asChild>
                <Link to="/contact">{t("services_start_conversation")} <ArrowRight size={14} className="ml-3" /></Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
