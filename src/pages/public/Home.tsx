import { useEffect, useState, useRef, useCallback } from "react";
import { CinematicLightbox, LightboxImage } from "@/components/media/CinematicLightbox";
import useEmblaCarousel from "embla-carousel-react";
import { PublicNav } from "@/components/PublicNav";
import { PublicFooter } from "@/components/PublicFooter";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PortfolioItem } from "@/lib/portfolio";
import { useSettings } from "@/hooks/useSettings";
import { useSiteContent } from "@/hooks/useSiteContent";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useSEO } from "@/hooks/useSEO";
import { FloatingChatButton } from "@/components/FloatingChatButton";
import { useTranslation } from "@/i18n/LanguageContext";
import { ArchitectureBusinessJsonLd } from "@/components/JsonLd";
import { ArrowRight, Building2, Ruler, Leaf, PenTool, MapPin, Calendar, GraduationCap, Award, Globe, ChevronLeft, ChevronRight, Quote } from "lucide-react";
import profileImg from "@/assets/profile-placeholder.jpg";

const ICON_MAP: Record<string, any> = { Building2, Ruler, Leaf, PenTool, GraduationCap, Award, Globe };

function useCountUp(target: number, duration = 2000) {
  const [count, setCount] = useState(0);
  const started = useRef(false);
  const start = useCallback(() => {
    if (started.current) return;
    started.current = true;
    const startTime = performance.now();
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(ease * target));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);
  return { count, start };
}

function AnimatedStat({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const { count, start } = useCountUp(value);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { start(); observer.unobserve(el); } },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [start]);

  return (
    <div ref={ref} className="text-center py-8 md:py-12">
      <p className="font-display text-5xl md:text-6xl lg:text-7xl font-light text-foreground tracking-tight leading-none">
        {count}<span className="text-primary">{suffix}</span>
      </p>
      <p className="mt-3 text-xs tracking-[0.2em] uppercase text-muted-foreground font-medium">
        {label}
      </p>
    </div>
  );
}

function TestimonialsCarousel({ testimonials, sectionRef, t }: { testimonials: any[]; sectionRef: React.RefObject<HTMLElement>; t: (k: string) => string }) {
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
    <section ref={sectionRef} className="reveal py-20 md:py-32">
      <div className="container">
        <div className="mb-12 md:mb-20 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <p className="text-xs tracking-[0.25em] uppercase text-primary mb-4">{t("home_recognition")}</p>
            <h2 className="font-display text-3xl md:text-5xl lg:text-6xl text-foreground">{t("home_client_voices")}</h2>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => emblaApi?.scrollPrev()}
              className="h-11 w-11 rounded-full border border-border bg-background flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all">
              <ChevronLeft size={18} />
            </button>
            <button onClick={() => emblaApi?.scrollNext()}
              className="h-11 w-11 rounded-full border border-border bg-background flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex gap-6 md:gap-8">
            {testimonials.map((t: any, i: number) => (
              <div key={t.name} className="flex-[0_0_85%] min-w-0 sm:flex-[0_0_48%] lg:flex-[0_0_33.333%]">
                <div className={`border border-border/50 rounded-lg p-6 md:p-8 h-full flex flex-col transition-all duration-500 ${
                  selectedIndex === i ? "bg-card" : "bg-transparent opacity-50"
                }`}>
                  <Quote size={20} className="text-primary/30 mb-4 shrink-0" />
                  <p className="text-muted-foreground leading-relaxed text-sm flex-1 italic">{t.text}</p>
                  <div className="mt-6 pt-6 border-t border-border/30 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                      <span className="font-display text-base text-foreground">{t.name?.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.role}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 mt-10">
          {testimonials.map((_: any, i: number) => (
            <button key={i} onClick={() => emblaApi?.scrollTo(i)}
              className={`h-1.5 rounded-full transition-all duration-400 ${
                selectedIndex === i ? "w-8 bg-primary" : "w-1.5 bg-border"
              }`} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const { settings } = useSettings();
  const { t } = useTranslation();
  const { content, loading: contentLoading } = useSiteContent(
    "about_me", "hero", "stats", "services_home", "testimonials", "awards", "cta"
  );
  const [featured, setFeatured] = useState<PortfolioItem[]>([]);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const refAbout = useScrollReveal();
  const refHero = useScrollReveal();
  const refStats = useScrollReveal();
  const refFeatured = useScrollReveal();
  const refServices = useScrollReveal();
  const refTestimonials = useScrollReveal();
  const refAwards = useScrollReveal();
  const refCta = useScrollReveal();

  useEffect(() => {
    supabase
      .from("portfolio_items")
      .select("id, slug, title, cover_image_url, category, location, year, summary, tags, is_featured, is_published, created_at, updated_at, content")
      .eq("is_published", true)
      .eq("is_featured", true)
      .order("created_at", { ascending: false })
      .limit(3)
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

  return (
    <div className="bg-background relative overflow-x-hidden">
      <ArchitectureBusinessJsonLd />
      <PublicNav />

      {/* ── ABOUT / INTRO ── */}
      <section ref={refAbout} className="reveal">
        <div className="container py-16 md:py-28">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Image */}
            <div className="relative">
              <div className="aspect-[3/4] overflow-hidden rounded-sm">
                <img src={aboutProfileImg} alt={aboutMe.title_prefix ?? "Principal Architect"} 
                  className="h-full w-full object-cover object-center" />
              </div>
              {/* Credentials overlay */}
              {credentials.length > 0 && (
                <div className="absolute bottom-6 left-6 right-6 bg-background/90 backdrop-blur-sm border border-border/50 rounded-sm p-5">
                  <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-3">{t("home_credentials")}</p>
                  <div className="space-y-2">
                    {credentials.map((c: any) => {
                      const Icon = ICON_MAP[c.icon] ?? Award;
                      return (
                        <div key={c.text} className="flex items-center gap-2.5">
                          <Icon size={11} className="text-primary shrink-0" />
                          <span className="text-xs text-foreground/70">{c.text}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="lg:pl-4">
              <p className="text-xs tracking-[0.3em] uppercase text-primary mb-6">{aboutMe.title_prefix ?? "Principal Architect"}</p>
              <h2 className="font-display text-[clamp(2.5rem,5vw,5rem)] leading-[1.05] text-foreground">
                {aboutMe.name_first ?? "Elena"}<br />
                <span className="text-primary">{aboutMe.name_last ?? "Markov"}</span>
              </h2>
              <div className="flex items-center gap-4 my-10">
                <div className="h-px w-12 bg-primary/40" />
                <span className="text-xs tracking-[0.2em] text-muted-foreground">Est. {aboutMe.est_year ?? "2008"}</span>
              </div>
              <div className="space-y-5 max-w-lg">
                <p className="text-base leading-relaxed text-foreground/80">{aboutMe.bio_main ?? ""}</p>
                <p className="text-sm leading-relaxed text-muted-foreground">{aboutMe.bio_secondary ?? ""}</p>
              </div>
              <div className="mt-10 flex flex-col sm:flex-row items-start gap-4">
                <Button asChild className="rounded-sm px-8 h-12 tracking-wider text-sm">
                  <Link to="/about">{t("home_full_profile")} <ArrowRight size={14} className="ml-2" /></Link>
                </Button>
                <Button variant="ghost" asChild className="rounded-sm px-8 h-12 tracking-wider text-sm text-muted-foreground hover:text-foreground">
                  <Link to="/contact">{t("home_work_together")}</Link>
                </Button>
              </div>
              {aboutMe.quote && (
                <blockquote className="mt-16 pt-8 border-t border-border/50">
                  <p className="font-display text-xl md:text-2xl text-muted-foreground leading-relaxed italic">
                    "{aboutMe.quote}"
                  </p>
                </blockquote>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── HERO STATEMENT ── */}
      <section ref={refHero} className="reveal border-t border-border/40">
        <div className="container py-20 md:py-36">
          <div className="max-w-4xl">
            <p className="text-xs tracking-[0.3em] uppercase text-primary mb-8">
              {hero.badge ?? "Architecture · Interiors · Urbanism"}
            </p>
            <h1 className="font-display text-[clamp(3rem,8vw,7rem)] leading-[1.02] text-foreground">
              {hero.title_line1 ?? "Building spaces"}<br />
              <span className="text-primary">{hero.title_line2 ?? "that endure."}</span>
            </h1>
            <p className="mt-8 text-lg text-muted-foreground max-w-lg leading-relaxed">
              {hero.description ?? ""}
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Button size="lg" asChild className="rounded-sm px-8 h-13 tracking-wider text-sm">
                <Link to="/portfolio">{t("home_view_projects")} <ArrowRight size={14} className="ml-2" /></Link>
              </Button>
              <Button variant="outline" size="lg" asChild className="rounded-sm px-8 h-13 tracking-wider text-sm border-border hover:bg-muted">
                <Link to="/contact">{t("home_work_with_us")}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      {stats.length > 0 && (
        <section ref={refStats} className="reveal border-t border-border/40">
          <div className="container">
            <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-border/40">
              {stats.map((s: any) => (
                <AnimatedStat key={s.label} value={s.value} suffix={s.suffix} label={s.label} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── FEATURED PROJECTS ── */}
      {featured.length > 0 && (
        <section ref={refFeatured} className="reveal border-t border-border/40">
          <div className="container py-20 md:py-32">
            <div className="flex items-end justify-between mb-12 md:mb-16">
              <div>
                <p className="text-xs tracking-[0.3em] uppercase text-primary mb-4">{t("home_selected_work")}</p>
                <h2 className="font-display text-3xl md:text-5xl lg:text-6xl text-foreground">{t("home_featured_work")}</h2>
              </div>
              <Link to="/portfolio" className="hidden md:flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                {t("home_view_all")} <ArrowRight size={14} />
              </Link>
            </div>

            <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-3">
              {featured.map((item, i) => (
                <div key={item.id} className="group relative overflow-hidden cursor-pointer rounded-sm"
                  onClick={() => item.cover_image_url && setLightboxIdx(i)}>
                  <div className={`overflow-hidden ${i === 0 ? "aspect-[3/4]" : "aspect-[4/5]"}`}>
                    {item.cover_image_url ? (
                      <img src={item.cover_image_url} alt={item.title} loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-[1000ms]" />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <Building2 size={32} className="text-muted-foreground/20" />
                      </div>
                    )}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500">
                    <Link to={`/portfolio/${item.slug}`} onClick={(e) => e.stopPropagation()}
                      className="font-display text-2xl text-white hover:underline underline-offset-4">
                      {item.title}
                    </Link>
                    <div className="flex items-center gap-3 mt-2 text-xs text-white/60">
                      {item.category && <span>{item.category}</span>}
                      {item.location && <span className="flex items-center gap-1"><MapPin size={10} />{item.location}</span>}
                      {item.year && <span>{item.year}</span>}
                    </div>
                  </div>
                  {/* Always-visible minimal info */}
                  <div className="mt-4">
                    <h3 className="font-display text-lg text-foreground">{item.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{item.category}{item.year ? ` · ${item.year}` : ''}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 text-center md:hidden">
              <Button variant="outline" asChild className="rounded-sm">
                <Link to="/portfolio">{t("home_all_projects")}</Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* ── SERVICES ── */}
      {servicesHome.length > 0 && (
        <section ref={refServices} className="reveal border-t border-border/40">
          <div className="container py-20 md:py-32">
            <div className="mb-12 md:mb-16">
              <p className="text-xs tracking-[0.3em] uppercase text-primary mb-4">{t("home_disciplines")}</p>
              <h2 className="font-display text-3xl md:text-5xl lg:text-6xl text-foreground">{t("home_what_we_do")}</h2>
            </div>
            <div className="grid gap-px bg-border/40 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border border-border/40">
              {servicesHome.map((s: any) => {
                const Icon = ICON_MAP[s.icon] ?? Building2;
                return (
                  <div key={s.title} className="bg-background p-6 md:p-8 group hover:bg-muted/30 transition-colors duration-300">
                    <Icon size={20} className="text-primary mb-5" />
                    <h3 className="font-display text-xl text-foreground mb-3">{s.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── TESTIMONIALS ── */}
      {testimonials.length > 0 && (
        <TestimonialsCarousel testimonials={testimonials} sectionRef={refTestimonials} t={t} />
      )}

      {/* ── AWARDS ── */}
      {awards.length > 0 && (
        <section ref={refAwards} className="reveal border-t border-border/40">
          <div className="container py-20 md:py-32">
            <div className="mb-12 md:mb-16 text-center">
              <p className="text-xs tracking-[0.3em] uppercase text-primary mb-4">{t("home_awards_recognition")}</p>
              <h2 className="font-display text-3xl md:text-5xl lg:text-6xl text-foreground">{t("home_honored_work")}</h2>
            </div>

            <div className="grid gap-px bg-border/40 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 border border-border/40">
              {awards.map((a: any) => (
                <div key={a.year + a.title} className="bg-background p-6 md:p-8 group hover:bg-muted/30 transition-colors duration-300">
                  <span className="font-display text-3xl text-primary/60 mb-4 block">{a.year}</span>
                  <h3 className="font-display text-lg text-foreground leading-snug mb-3 group-hover:text-primary transition-colors duration-300">
                    {a.title}
                  </h3>
                  <p className="text-xs tracking-[0.15em] text-muted-foreground uppercase">{a.org}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA ── */}
      <section ref={refCta} className="reveal border-t border-border/40">
        <div className="container py-24 md:py-40">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-display text-4xl md:text-5xl lg:text-7xl text-foreground leading-tight">
              {cta.title_line1 ?? "Let's build something"}<br />
              <span className="text-primary">{cta.title_line2 ?? "remarkable."}</span>
            </h2>
            <p className="mt-6 text-muted-foreground text-lg">{cta.subtitle ?? "Every great building begins with a conversation."}</p>
            <Button className="mt-10 rounded-sm px-10 h-13 tracking-wider text-sm" size="lg" asChild>
              <Link to="/contact">{t("home_begin_project")} <ArrowRight size={14} className="ml-2" /></Link>
            </Button>
          </div>
        </div>
      </section>

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