import { useEffect, useState, useRef, useCallback } from "react";
import { PublicNav } from "@/components/PublicNav";
import { PublicFooter } from "@/components/PublicFooter";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PortfolioItem } from "@/lib/portfolio";
import { useSettings } from "@/hooks/useSettings";
import { useSiteContent } from "@/hooks/useSiteContent";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { ArrowRight, Building2, Ruler, Leaf, PenTool, MapPin, Calendar, GraduationCap, Award, Globe } from "lucide-react";
import profileImg from "@/assets/profile-placeholder.jpg";

const ICON_MAP: Record<string, any> = { Building2, Ruler, Leaf, PenTool, GraduationCap, Award, Globe };

function useCountUp(target: number, duration = 1800) {
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
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [start]);
  return (
    <div ref={ref} className="text-center">
      <p className="font-display text-5xl font-light text-foreground">{count}{suffix}</p>
      <p className="mt-2 text-xs tracking-[0.12em] uppercase text-muted-foreground">{label}</p>
    </div>
  );
}

export default function Home() {
  const { settings } = useSettings();
  const { content, loading: contentLoading } = useSiteContent(
    "about_me", "hero", "stats", "services_home", "testimonials", "awards", "cta"
  );
  const [featured, setFeatured] = useState<PortfolioItem[]>([]);

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

  const studioName = settings?.studio_name ?? "FORMA";

  // Dynamic content with fallbacks
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
    <div className="bg-background">
      <PublicNav />

      {/* ── ABOUT ME ─────────────────────────────────────────── */}
      <section ref={refAbout} className="reveal relative overflow-hidden bg-background">
        <div className="absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-border lg:block" />
        <div className="container grid lg:grid-cols-2 min-h-[85vh]">
          <div className="relative flex items-stretch">
            <div className="relative w-full overflow-hidden">
              <span className="absolute -left-4 top-10 font-display text-[9rem] font-light leading-none text-secondary select-none pointer-events-none z-0">01</span>
              <div className="relative z-10 mt-16 mb-0 lg:mt-0 h-[520px] lg:h-full">
                <img src={aboutProfileImg} alt={aboutMe.title_prefix ?? "Principal Architect"} className="h-full w-full object-cover object-center" />
                <div className="absolute bottom-8 -right-0 lg:-right-8 bg-foreground text-background px-6 py-5 max-w-[220px] shadow-2xl">
                  <p className="text-[10px] tracking-[0.25em] uppercase text-background/50 mb-2">Credentials</p>
                  <div className="space-y-2">
                    {credentials.map((c: any) => {
                      const Icon = ICON_MAP[c.icon] ?? Award;
                      return (
                        <div key={c.text} className="flex items-center gap-2">
                          <Icon size={11} className="text-primary shrink-0" />
                          <span className="text-xs text-background/80">{c.text}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col justify-center py-20 lg:pl-16 xl:pl-24">
            <div className="flex items-center gap-4 mb-10">
              <div className="h-px w-10 bg-primary" />
              <p className="text-[10px] tracking-[0.3em] uppercase text-primary font-medium">{aboutMe.title_prefix ?? "Principal Architect"}</p>
            </div>
            <h2 className="font-display text-[clamp(2.8rem,5vw,5rem)] font-light leading-[1.05] text-foreground mb-2">
              {aboutMe.name_first ?? "Elena"}<br />
              <span className="font-semibold italic">{aboutMe.name_last ?? "Markov"}.</span>
            </h2>
            <div className="flex items-center gap-4 my-8">
              <div className="h-px max-w-[60px] w-full bg-border" />
              <span className="text-xs tracking-[0.2em] text-muted-foreground">Est. {aboutMe.est_year ?? "2008"}</span>
            </div>
            <div className="space-y-4 max-w-md">
              <p className="text-base font-light leading-relaxed text-foreground">{aboutMe.bio_main ?? ""}</p>
              <p className="text-sm leading-relaxed text-muted-foreground">{aboutMe.bio_secondary ?? ""}</p>
              <p className="text-sm leading-relaxed text-muted-foreground">{aboutMe.bio_tertiary ?? ""}</p>
            </div>
            <div className="mt-10 flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <Button asChild className="rounded-none px-8 tracking-wide">
                <Link to="/about">Full Profile <ArrowRight size={14} className="ml-2" /></Link>
              </Button>
              <Button variant="ghost" asChild className="rounded-none px-0 tracking-wide text-muted-foreground hover:text-foreground">
                <Link to="/contact">Work Together →</Link>
              </Button>
            </div>
            {aboutMe.quote && (
              <div className="mt-14 pt-10 border-t border-border">
                <blockquote className="font-display text-xl font-light italic text-muted-foreground leading-relaxed">
                  "{aboutMe.quote}"
                </blockquote>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Hero */}
      <section ref={refHero} className="reveal relative min-h-[90vh] flex items-center">
        <div className="container py-24 md:py-36">
          <div className="max-w-4xl">
            <p className="mb-6 text-xs font-medium tracking-[0.25em] uppercase text-primary">
              {hero.badge ?? "Architecture · Interiors · Urbanism"}
            </p>
            <h1 className="font-display text-[clamp(3rem,8vw,7rem)] font-light leading-[1.02] text-foreground">
              {hero.title_line1 ?? "Building spaces"}<br />
              <em className="not-italic font-semibold text-primary">{hero.title_line2 ?? "that endure."}</em>
            </h1>
            <p className="mt-8 text-lg font-light text-muted-foreground max-w-lg leading-relaxed">
              {hero.description ?? ""}
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Button size="lg" asChild className="rounded-none px-8 tracking-wide">
                <Link to="/portfolio">View Projects <ArrowRight size={15} className="ml-2" /></Link>
              </Button>
              <Button variant="outline" size="lg" asChild className="rounded-none px-8 tracking-wide">
                <Link to="/contact">Work With Us</Link>
              </Button>
            </div>
          </div>
        </div>
        <div className="absolute bottom-12 right-12 hidden lg:flex flex-col items-center gap-3">
          <div className="h-20 w-px bg-border" />
          <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground rotate-90 origin-center translate-x-6">Est. {aboutMe.est_year ?? "2008"}</p>
        </div>
      </section>

      {/* Stats */}
      {stats.length > 0 && (
        <section ref={refStats} className="reveal border-y border-border bg-secondary/40 py-14">
          <div className="container grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((s: any) => (
              <AnimatedStat key={s.label} value={s.value} suffix={s.suffix} label={s.label} />
            ))}
          </div>
        </section>
      )}

      {/* Featured Projects */}
      {featured.length > 0 && (
        <section ref={refFeatured} className="reveal container py-24">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="text-xs font-medium tracking-[0.25em] uppercase text-primary mb-3">Selected Work</p>
              <h2 className="font-display text-5xl font-light text-foreground">Recent Projects</h2>
            </div>
            <Link to="/portfolio" className="hidden md:flex items-center gap-1.5 text-xs tracking-[0.12em] uppercase text-muted-foreground hover:text-foreground transition-colors">
              All Projects <ArrowRight size={12} />
            </Link>
          </div>
          <div className="grid gap-1 md:grid-cols-3">
            {featured.map((item, i) => (
              <Link key={item.id} to={`/portfolio/${item.slug}`}
                className="group block relative overflow-hidden bg-secondary/50">
                <div className={`overflow-hidden ${i === 0 ? "aspect-[3/4]" : "aspect-square"}`}>
                  {item.cover_image_url ? (
                    <img src={item.cover_image_url} alt={item.title} loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-700" />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <Building2 size={40} className="text-muted-foreground/30" />
                    </div>
                  )}
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-foreground/80 to-transparent">
                  <h3 className="font-display text-xl font-light text-background">{item.title}</h3>
                  <div className="flex items-center gap-3 mt-1 text-xs text-background/70">
                    {item.category && <span className="tracking-wide">{item.category}</span>}
                    {item.location && <span className="flex items-center gap-1"><MapPin size={9} />{item.location}</span>}
                    {item.year && <span>{item.year}</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-6 text-center md:hidden">
            <Button variant="outline" asChild className="rounded-none"><Link to="/portfolio">All Projects</Link></Button>
          </div>
        </section>
      )}

      {/* Services */}
      {servicesHome.length > 0 && (
        <section ref={refServices} className="reveal border-t border-border bg-secondary/30 py-24">
          <div className="container">
            <div className="mb-14">
              <p className="text-xs font-medium tracking-[0.25em] uppercase text-primary mb-3">Disciplines</p>
              <h2 className="font-display text-5xl font-light text-foreground">What We Do</h2>
            </div>
            <div className="grid gap-px border border-border bg-border md:grid-cols-2 lg:grid-cols-4">
              {servicesHome.map((s: any) => {
                const Icon = ICON_MAP[s.icon] ?? Building2;
                return (
                  <div key={s.title} className="bg-background p-8 hover:bg-secondary/40 transition-colors group">
                    <Icon size={22} className="text-primary mb-5" />
                    <h3 className="font-display text-xl font-medium text-foreground mb-3">{s.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials */}
      {testimonials.length > 0 && (
        <section ref={refTestimonials} className="reveal container py-24">
          <div className="mb-14">
            <p className="text-xs font-medium tracking-[0.25em] uppercase text-primary mb-3">Recognition</p>
            <h2 className="font-display text-5xl font-light text-foreground">Client Voices</h2>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {testimonials.map((t: any) => (
              <div key={t.name} className="border-t border-border pt-8">
                <p className="font-display text-5xl font-light text-primary/40 mb-3">"</p>
                <p className="text-muted-foreground leading-relaxed text-sm">{t.text}</p>
                <div className="mt-6">
                  <p className="text-sm font-semibold text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground tracking-wide mt-0.5">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Awards */}
      {awards.length > 0 && (
        <section ref={refAwards} className="reveal border-t border-border bg-secondary/20 py-20">
          <div className="container">
            <div className="mb-12 flex items-center gap-6">
              <div className="h-px flex-1 bg-border" />
              <p className="text-xs font-medium tracking-[0.3em] uppercase text-primary shrink-0">Awards & Recognition</p>
              <div className="h-px flex-1 bg-border" />
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
              {awards.map((a: any, i: number) => (
                <div key={a.year + a.title}
                  className={`reveal reveal-delay-${Math.min(i + 1, 4)} border-l-2 border-primary/30 pl-5 py-2 hover:border-primary transition-colors`}>
                  <span className="font-display text-3xl font-light text-primary/50">{a.year}</span>
                  <h3 className="font-display text-base font-medium text-foreground mt-1 leading-tight">{a.title}</h3>
                  <p className="text-[11px] tracking-wide text-muted-foreground mt-1 uppercase">{a.org}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section ref={refCta} className="reveal border-t border-border">
        <div className="container py-24">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="font-display text-5xl md:text-6xl font-light text-foreground">
              {cta.title_line1 ?? "Let's build something"}<br />
              <em className="not-italic font-semibold text-primary">{cta.title_line2 ?? "remarkable."}</em>
            </h2>
            <p className="mt-6 text-muted-foreground">{cta.subtitle ?? "Every great building begins with a conversation."}</p>
            <Button className="mt-8 rounded-none px-10 tracking-wide" size="lg" asChild>
              <Link to="/contact">Begin Your Project <ArrowRight size={15} className="ml-2" /></Link>
            </Button>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
