import { PublicNav } from "@/components/PublicNav";
import { PublicFooter } from "@/components/PublicFooter";
import { Building2, Ruler, Leaf, PenTool, FileText, Lightbulb, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useSiteContent } from "@/hooks/useSiteContent";
import { useSEO } from "@/hooks/useSEO";
import { FloatingChatButton } from "@/components/FloatingChatButton";
import { useTranslation } from "@/i18n/LanguageContext";
import { FadeUp, StaggerContainer, StaggerItem, TextReveal, LineDraw } from "@/components/motion/MotionWrappers";
import { TextScramble } from "@/components/TextScramble";
import { motion } from "framer-motion";

const ICON_MAP: Record<string, any> = { Building2, Ruler, Leaf, PenTool, FileText, Lightbulb };
const luxuryEase = [0.22, 1, 0.36, 1] as const;

export default function Services() {
  useSEO({ title: "Services", description: "Architecture, interior design, and planning services by KIM DESIGN STUDIO" });
  const { content } = useSiteContent("services_full", "services_page", "process");
  const { t } = useTranslation();

  const services: any[] = content.services_full ?? [];
  const page = content.services_page ?? {};
  const process: any[] = content.process ?? [];

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
            <TextScramble text={page.hero_subtitle ?? "Services"} delay={0.3} />
          </motion.p>
          <TextReveal>
            <h1 className="font-display text-[clamp(2.5rem,7vw,7rem)] leading-[0.95] text-foreground">
              {page.hero_title_line1 ?? "Every project,"}
              <br />
              <span className="text-primary">{page.hero_title_line2 ?? "built from scratch."}</span>
            </h1>
          </TextReveal>
          <FadeUp delay={0.3}>
            <p className="mt-8 text-lg text-muted-foreground font-light leading-relaxed max-w-lg">
              {page.hero_description ?? ""}
            </p>
          </FadeUp>
        </div>
      </section>

      {/* ── Services Grid ── */}
      {services.length > 0 && (
        <section className="border-t border-border/30 relative z-10">
          <div className="container py-24 md:py-36">
            <StaggerContainer className="grid gap-px sm:grid-cols-2 lg:grid-cols-3" staggerDelay={0.08}>
              {services.map((s: any, i: number) => {
                const Icon = ICON_MAP[s.icon] ?? Building2;
                return (
                  <StaggerItem key={s.title}>
                    <div className="group bg-background border border-border/20 p-8 md:p-10 hover:bg-card transition-colors duration-500 h-full flex flex-col">
                      <div className="flex items-start justify-between mb-6">
                        <span className="font-display text-4xl text-border/40 group-hover:text-primary/30 transition-colors duration-500">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <Icon size={20} className="text-primary mt-2" />
                      </div>
                      <p className="text-[9px] tracking-[0.25em] uppercase text-muted-foreground mb-2">{s.stage}</p>
                      <h3 className="font-display text-xl md:text-2xl text-foreground mb-3 leading-tight">{s.title}</h3>
                      <p className="text-sm text-muted-foreground leading-[1.8] flex-1 mb-6">{s.desc}</p>
                      <Button variant="outline" className="rounded-none text-xs tracking-[0.12em] uppercase px-6 h-10 border-foreground/15 hover:bg-foreground hover:text-background transition-all duration-500 w-fit" size="sm" asChild>
                        <Link to="/contact">{t("services_enquire")}</Link>
                      </Button>
                    </div>
                  </StaggerItem>
                );
              })}
            </StaggerContainer>
          </div>
        </section>
      )}

      {/* ── Process ── */}
      {process.length > 0 && (
        <section className="border-t border-border/30 py-24 md:py-36 relative z-10">
          <div className="container">
            <FadeUp>
              <p className="text-[10px] tracking-[0.35em] uppercase text-primary mb-4">{t("services_our_process")}</p>
              <h2 className="font-display text-3xl md:text-5xl text-foreground leading-[1.1] mb-16 md:mb-20">
                How we work
              </h2>
            </FadeUp>
            <StaggerContainer className="grid gap-px grid-cols-1 sm:grid-cols-2 md:grid-cols-4" staggerDelay={0.1}>
              {process.map((step: any) => (
                <StaggerItem key={step.n}>
                  <div className="border border-border/20 bg-background p-8 md:p-10 h-full group hover:bg-card transition-colors duration-500">
                    <span className="font-display text-5xl text-primary/25 group-hover:text-primary/40 transition-colors duration-500 block mb-4">{step.n}</span>
                    <LineDraw className="h-px w-12 bg-primary/20 mb-6" delay={0.3} />
                    <h3 className="font-display text-lg md:text-xl text-foreground mb-2">{step.title}</h3>
                    <p className="text-sm text-muted-foreground leading-[1.8]">{step.desc}</p>
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
              <h2 className="font-display text-4xl md:text-6xl lg:text-7xl text-foreground leading-[1.05]">
                {page.cta_title ?? t("services_ready_discuss")}
              </h2>
              <p className="mt-6 text-muted-foreground text-lg font-light">{page.cta_description ?? ""}</p>
              <Button className="mt-10 rounded-none px-12 h-14 tracking-[0.15em] text-sm uppercase" size="lg" asChild>
                <Link to="/contact">{t("services_start_conversation")} <ArrowRight size={14} className="ml-3" /></Link>
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
