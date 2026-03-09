import { PublicNav } from "@/components/PublicNav";
import { PublicFooter } from "@/components/PublicFooter";
import { Building2, Ruler, Leaf, PenTool, FileText, Lightbulb, ArrowRight, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useSiteContent } from "@/hooks/useSiteContent";
import { useSEO } from "@/hooks/useSEO";
import { FloatingChatButton } from "@/components/FloatingChatButton";
import { useTranslation } from "@/i18n/LanguageContext";
import { FadeUp, StaggerContainer, StaggerItem, TextReveal, LineDraw } from "@/components/motion/MotionWrappers";
import { TextScramble } from "@/components/TextScramble";
import { SectionLabel } from "@/components/SectionLabel";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

const ICON_MAP: Record<string, any> = { Building2, Ruler, Leaf, PenTool, FileText, Lightbulb };
const luxuryEase = [0.22, 1, 0.36, 1] as const;

/* ── Interactive Process Accordion ── */
function ProcessAccordion({ steps }: { steps: any[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="max-w-3xl mx-auto">
      {steps.map((step: any, i: number) => {
        const isOpen = openIndex === i;
        return (
          <motion.div
            key={step.n}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.08, ease: luxuryEase }}
          >
            <button
              onClick={() => setOpenIndex(isOpen ? null : i)}
              className="w-full flex items-center gap-6 md:gap-10 py-7 md:py-8 border-b border-border/30 text-left group cursor-pointer"
            >
              <span className={`font-display text-4xl md:text-5xl transition-colors duration-500 shrink-0 w-[70px] ${
                isOpen ? "text-primary" : "text-border/40 group-hover:text-primary/30"
              }`}>
                {step.n}
              </span>
              <h3 className={`font-display text-xl md:text-2xl flex-1 transition-colors duration-300 ${
                isOpen ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
              }`}>
                {step.title}
              </h3>
              <motion.div
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.3, ease: luxuryEase }}
              >
                <ChevronDown size={18} className="text-muted-foreground" />
              </motion.div>
            </button>
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.4, ease: luxuryEase }}
                  className="overflow-hidden"
                >
                  <div className="pl-[calc(70px+1.5rem)] md:pl-[calc(70px+2.5rem)] pb-8 pt-2">
                    <LineDraw className="h-px w-16 bg-primary/20 mb-4" />
                    <p className="text-sm text-muted-foreground leading-[1.9] max-w-lg">{step.desc}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}

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
          <h1 className="font-display text-[clamp(2.5rem,7vw,7rem)] leading-[0.95] text-foreground">
            {(page.hero_title_line1 ?? "Every project,").split(" ").map((word: string, i: number) => (
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
            <br />
            <span className="text-primary hero-shimmer-text">
              {(page.hero_title_line2 ?? "built from scratch.").split(" ").map((word: string, i: number) => (
                <motion.span
                  key={`l2-${i}`}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.5 + i * 0.08, ease: luxuryEase }}
                  className="inline-block mr-[0.3em]"
                >
                  {word}
                </motion.span>
              ))}
            </span>
          </h1>
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
                    <div className="group relative bg-background border border-border/20 p-8 md:p-10 hover:bg-card transition-all duration-500 h-full flex flex-col overflow-hidden">
                      {/* Animated gradient border on hover */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
                        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
                      </div>
                      {/* Background number */}
                      <span className="absolute -right-2 -top-4 font-display text-[100px] leading-none text-border/[0.05] group-hover:text-primary/[0.05] transition-colors duration-700 select-none pointer-events-none">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <div className="relative z-10 flex-1 flex flex-col">
                        <div className="flex items-start justify-between mb-6">
                          <span className="font-display text-4xl text-border/40 group-hover:text-primary/30 transition-colors duration-500">
                            {String(i + 1).padStart(2, '0')}
                          </span>
                          <motion.div
                            whileHover={{ scale: 1.15, rotate: -5 }}
                            transition={{ duration: 0.4, ease: luxuryEase }}
                            className="inline-block"
                          >
                            <Icon size={20} className="text-primary mt-2" />
                          </motion.div>
                        </div>
                        <p className="text-[9px] tracking-[0.25em] uppercase text-muted-foreground mb-2">{s.stage}</p>
                        <h3 className="font-display text-xl md:text-2xl text-foreground mb-3 leading-tight group-hover:text-primary transition-colors duration-300">{s.title}</h3>
                        <p className="text-sm text-muted-foreground leading-[1.8] flex-1 mb-6">{s.desc}</p>
                        <div className="flex items-center gap-2 text-xs text-primary/0 group-hover:text-primary transition-all duration-500 translate-y-2 group-hover:translate-y-0">
                          <Link to="/contact" className="tracking-[0.15em] uppercase">Enquire</Link>
                          <ArrowRight size={12} />
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

      {/* ── Process — Interactive Accordion ── */}
      {process.length > 0 && (
        <section className="border-t border-border/30 py-24 md:py-36 relative z-10">
          <div className="container">
            <div className="text-center mb-16 md:mb-20">
              <SectionLabel text={t("services_our_process")} className="justify-center" />
              <FadeUp>
                <h2 className="font-display text-3xl md:text-5xl text-foreground leading-[1.1]">
                  How we work
                </h2>
              </FadeUp>
            </div>
            <ProcessAccordion steps={process} />
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
