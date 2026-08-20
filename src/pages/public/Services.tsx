import { PublicNav } from "@/components/PublicNav";
import { PublicFooter } from "@/components/PublicFooter";
import { Building2, Ruler, Leaf, PenTool, FileText, Lightbulb, ArrowRight, ChevronDown, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useSiteContent } from "@/hooks/useSiteContent";
import { useSEO } from "@/hooks/useSEO";

import { useTranslation } from "@/i18n/LanguageContext";
import { FadeUp, StaggerContainer, StaggerItem, LineDraw } from "@/components/motion/MotionWrappers";
import { SectionLabel } from "@/components/SectionLabel";
import { MagneticButton } from "@/components/MagneticButton";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { useState, useRef, useEffect } from "react";

const ICON_MAP: Record<string, any> = { Building2, Ruler, Leaf, PenTool, FileText, Lightbulb };
const luxuryEase = [0.22, 1, 0.36, 1] as const;

/* ── Horizontal Service Showcase ── */
function HorizontalShowcase({ services }: { services: any[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end end"] });
  const x = useTransform(scrollYProgress, [0, 1], ["0%", `-${(services.length - 1) * 100}%`]);

  useEffect(() => {
    const unsubscribe = scrollYProgress.on("change", (latest) => {
      setActiveIndex(Math.min(Math.round(latest * (services.length - 1)), services.length - 1));
    });
    return unsubscribe;
  }, [scrollYProgress, services.length]);

  return (
    <section ref={containerRef} className="relative" style={{ height: `${services.length * 100}vh` }}>
      <div className="sticky top-0 h-screen overflow-hidden">
        <div className="absolute top-1/2 left-8 -translate-y-1/2 z-20 hidden lg:flex flex-col gap-3">
          {services.map((_, i) => (
            <motion.div key={i} className="relative" animate={{ opacity: i === activeIndex ? 1 : 0.3 }} transition={{ duration: 0.3 }}>
              <div className={`h-[2px] transition-all duration-500 ${i === activeIndex ? "w-10 bg-primary" : "w-6 bg-border"}`} />
              {i === activeIndex && (
                <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  className="absolute left-14 top-1/2 -translate-y-1/2 text-[10px] tracking-[0.2em] uppercase text-primary whitespace-nowrap font-mono-label">
                  {String(i + 1).padStart(2, '0')} / {String(services.length).padStart(2, '0')}
                </motion.span>
              )}
            </motion.div>
          ))}
        </div>

        <motion.div style={{ x }} className="flex h-full">
          {services.map((service, i) => {
            const Icon = ICON_MAP[service.icon] ?? Building2;
            return (
              <div key={service.title} className="min-w-full h-full flex items-center">
                <div className="container">
                  <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                    <div className="max-w-xl">
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: activeIndex === i ? 1 : 0.3 }} transition={{ duration: 0.5 }}>
                        <div className="flex items-center gap-4 mb-8">
                          <span className="font-display text-7xl md:text-8xl text-border/20">{String(i + 1).padStart(2, '0')}</span>
                          <motion.div whileHover={{ scale: 1.15, rotate: -5 }} transition={{ duration: 0.3 }}>
                            <Icon size={24} className="text-primary" />
                          </motion.div>
                        </div>
                        <p className="text-[9px] tracking-[0.3em] uppercase text-primary/60 mb-3 font-mono-label">{service.stage}</p>
                        <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-foreground mb-6 leading-[0.95]">{service.title}</h2>
                        <p className="text-muted-foreground leading-[1.9] text-base mb-8">{service.desc}</p>
                        <MagneticButton strength={0.15}>
                          <Link to="/contact"
                            className="inline-flex items-center gap-3 text-sm tracking-[0.15em] uppercase text-foreground hover:text-primary transition-colors group">
                            Enquire about this service
                            <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                          </Link>
                        </MagneticButton>
                      </motion.div>
                    </div>
                    <div className="hidden lg:block relative">
                      <motion.div initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: activeIndex === i ? 1 : 0, scale: activeIndex === i ? 1 : 0.9 }}
                        transition={{ duration: 0.6, ease: luxuryEase }} className="aspect-square relative">
                        <div className="absolute inset-8 border border-primary/10" />
                        <div className="absolute inset-12 border border-primary/5" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Icon size={120} className="text-primary/10" strokeWidth={0.5} />
                        </div>
                        <div className="absolute top-0 left-0 w-8 h-8 border-t border-l border-primary/30" />
                        <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-primary/30" />
                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b border-l border-primary/30" />
                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b border-r border-primary/30" />
                      </motion.div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </motion.div>

        <motion.div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          animate={{ opacity: activeIndex === services.length - 1 ? 0 : 1 }}>
          <span className="text-[8px] tracking-[0.3em] uppercase text-muted-foreground/40 font-mono-label">Scroll</span>
          <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
            <ChevronDown size={16} className="text-muted-foreground/40" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

/* ── Interactive Process Accordion ── */
function ProcessAccordion({ steps }: { steps: any[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  return (
    <div className="max-w-3xl mx-auto">
      {steps.map((step: any, i: number) => {
        const isOpen = openIndex === i;
        return (
          <motion.div key={step.n} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.08, ease: luxuryEase }}>
            <button onClick={() => setOpenIndex(isOpen ? null : i)}
              className="w-full flex items-center gap-6 md:gap-10 py-7 md:py-8 border-b border-border/30 text-left group cursor-pointer">
              <span className={`font-display text-4xl md:text-5xl transition-colors duration-500 shrink-0 w-[70px] ${isOpen ? "text-primary" : "text-border/40 group-hover:text-primary/30"}`}>
                {step.n}
              </span>
              <h3 className={`font-display text-xl md:text-2xl flex-1 transition-colors duration-300 ${isOpen ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"}`}>
                {step.title}
              </h3>
              <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.3, ease: luxuryEase }}>
                <ChevronDown size={18} className="text-muted-foreground" />
              </motion.div>
            </button>
            <AnimatePresence>
              {isOpen && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.4, ease: luxuryEase }} className="overflow-hidden">
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
  const { content } = useSiteContent("services_full", "services_page", "process");
  const { t } = useTranslation();
  useSEO({ title: t("seo_services_title"), description: t("seo_services_description") });

  const services: any[] = content.services_full ?? [];
  const page = content.services_page ?? {};
  const process: any[] = content.process ?? [];

  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.5], [0, 80]);
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.97]);

  return (
    <div className="bg-background relative overflow-x-hidden">
      <PublicNav />

      {/* ── Cinematic Hero ── */}
      <div ref={heroRef} className="relative overflow-hidden min-h-[44vh] md:min-h-[58vh] flex items-center pt-14 md:pt-20">
        <div className="absolute inset-0 pointer-events-none overflow-hidden hidden md:block">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1, duration: 1 }}>
            <motion.div animate={{ y: [0, -20, 0], rotate: [0, 3, 0] }} transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-[10%] right-[5%] w-[180px] h-[180px] border border-primary/[0.05]" />
            <motion.div animate={{ y: [0, 12, 0] }} transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
              className="absolute bottom-[15%] left-[4%] w-[100px] h-[100px] border border-primary/[0.04] rounded-full" />
            <motion.div animate={{ scaleY: [0.5, 1, 0.5] }} transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-[15%] left-[7%] w-px h-[160px] bg-gradient-to-b from-transparent via-primary/[0.06] to-transparent"
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
              <SectionLabel text={page.hero_subtitle ?? "Services"} />
              <h1 className="font-display text-[clamp(2.1rem,7.5vw,7.5rem)] leading-[0.95] md:leading-[0.92] text-foreground">
                <div className="overflow-hidden">
                  <motion.div
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                    className="block"
                  >
                    {page.hero_title_line1 ?? "Every project,"}
                  </motion.div>
                </div>
                <div className="overflow-hidden mt-1 md:mt-2">
                  <motion.div
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    transition={{ duration: 0.9, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                    className="text-primary hero-shimmer-text block"
                  >
                    {page.hero_title_line2 ?? "built from scratch."}
                  </motion.div>
                </div>
              </h1>
              <FadeUp delay={0.3}>
                <p className="mt-8 text-base md:text-lg text-muted-foreground font-light leading-[1.85] max-w-lg">{page.hero_description ?? ""}</p>
              </FadeUp>
            </div>
          </section>
        </motion.div>
      </div>


      {/* ── Services Showcase ── */}
      {services.length > 0 && services.length > 2 && (
        <section className="border-t border-border/30 relative z-10">
          <HorizontalShowcase services={services} />
        </section>
      )}

      {/* ── Services Grid Fallback ── */}
      {services.length > 0 && services.length <= 2 && (
        <section className="border-t border-border/30 py-24 md:py-36 relative z-10">
          <div className="container">
            <StaggerContainer className="grid gap-px grid-cols-1 md:grid-cols-2" staggerDelay={0.1}>
              {services.map((service: any, i: number) => {
                const Icon = ICON_MAP[service.icon] ?? Building2;
                return (
                  <StaggerItem key={service.title}>
                    <div className="bg-background border border-border/20 p-10 md:p-14 h-full group hover:bg-card transition-colors duration-500 relative overflow-hidden">
                      <div className="absolute top-0 left-0 right-0 h-px bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-700 origin-left" />
                      <div className="flex items-center gap-4 mb-8">
                        <span className="font-display text-5xl text-border/30 group-hover:text-primary/20 transition-colors">{String(i + 1).padStart(2, '0')}</span>
                        <Icon size={20} className="text-primary" />
                      </div>
                      <h3 className="font-display text-2xl md:text-3xl text-foreground mb-4 group-hover:text-primary transition-colors duration-300">{service.title}</h3>
                      <p className="text-sm text-muted-foreground leading-[1.9]">{service.desc}</p>
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
        <section className="border-t border-border/30 py-24 md:py-36 relative z-10 bg-muted/10">
          <div className="container">
            <div className="text-center mb-16 md:mb-20">
              <SectionLabel text={t("services_our_process")} className="justify-center" />
              <FadeUp>
                <h2 className="font-display text-3xl md:text-5xl text-foreground leading-[1.1]">How we work</h2>
              </FadeUp>
              <FadeUp delay={0.15}>
                <p className="mt-4 text-sm text-muted-foreground max-w-md mx-auto leading-[1.8]">A proven methodology refined over years of practice.</p>
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
              <SectionLabel text="Next Step" className="justify-center" />
              <h2 className="font-display text-4xl md:text-6xl lg:text-7xl text-foreground leading-[1.05]">
                {page.cta_title ?? t("services_ready_discuss")}
              </h2>
              <p className="mt-6 text-muted-foreground text-lg font-light leading-[1.8]">{page.cta_description ?? ""}</p>
              <MagneticButton strength={0.2}>
                <Button className="mt-10 rounded-none px-12 h-14 tracking-[0.15em] text-sm uppercase" size="lg" asChild>
                  <Link to="/contact">{t("services_start_conversation")} <ArrowRight size={14} className="ml-3" /></Link>
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
