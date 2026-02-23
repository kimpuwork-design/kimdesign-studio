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
import { ArrowRight, Building2, Ruler, Leaf, PenTool, MapPin, Calendar, GraduationCap, Award, Globe, Sparkles } from "lucide-react";
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
    <div ref={ref} className="glass-card-public glass-glow-ring text-center p-6">
      <p className="font-display text-5xl font-bold text-foreground tracking-tight">{count}{suffix}</p>
      <p className="mt-2 text-xs tracking-[0.15em] uppercase text-muted-foreground font-medium">{label}</p>
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
    <div className="bg-background relative overflow-hidden">
      {/* Ambient orbs */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-0 left-1/4 h-[500px] w-[500px] rounded-full bg-primary/[0.04] blur-[120px] animate-float" />
        <div className="absolute bottom-1/4 right-0 h-[400px] w-[400px] rounded-full bg-primary/[0.03] blur-[100px] animate-float-delayed" />
      </div>

      <PublicNav />

      {/* ── ABOUT ME ── */}
      <section ref={refAbout} className="reveal relative overflow-hidden bg-background">
        <div className="container grid lg:grid-cols-2 min-h-[85vh] gap-8">
          <div className="relative flex items-stretch">
            <div className="relative w-full overflow-hidden rounded-3xl mt-8 mb-8 lg:mt-0 lg:mb-0">
              <div className="relative z-10 h-[520px] lg:h-full">
                <img src={aboutProfileImg} alt={aboutMe.title_prefix ?? "Principal Architect"} className="h-full w-full object-cover object-center rounded-3xl" />
                {/* Gradient overlay on image */}
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent rounded-3xl" />
                <div className="absolute bottom-6 left-6 right-6 glass-card-public px-6 py-5">
                  <p className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground mb-3 font-medium">Credentials</p>
                  <div className="space-y-2">
                    {credentials.map((c: any) => {
                      const Icon = ICON_MAP[c.icon] ?? Award;
                      return (
                        <div key={c.text} className="flex items-center gap-2.5">
                          <Icon size={12} className="text-primary shrink-0" />
                          <span className="text-xs text-foreground/80">{c.text}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col justify-center py-20 lg:pl-12 xl:pl-20">
            <div className="flex items-center gap-3 mb-10">
              <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <Sparkles size={14} className="text-primary" />
              </div>
              <p className="text-xs tracking-[0.2em] uppercase text-primary font-semibold">{aboutMe.title_prefix ?? "Principal Architect"}</p>
            </div>
            <h2 className="font-display text-[clamp(2.5rem,5vw,4.5rem)] font-bold leading-[1.05] text-foreground mb-2 tracking-tight">
              {aboutMe.name_first ?? "Elena"}<br />
              <span className="text-primary">{aboutMe.name_last ?? "Markov"}.</span>
            </h2>
            <div className="flex items-center gap-4 my-8">
              <div className="h-px max-w-[60px] w-full bg-border" />
              <span className="text-xs tracking-[0.2em] text-muted-foreground font-medium">Est. {aboutMe.est_year ?? "2008"}</span>
            </div>
            <div className="space-y-4 max-w-md">
              <p className="text-base font-light leading-relaxed text-foreground/90">{aboutMe.bio_main ?? ""}</p>
              <p className="text-sm leading-relaxed text-muted-foreground">{aboutMe.bio_secondary ?? ""}</p>
              <p className="text-sm leading-relaxed text-muted-foreground">{aboutMe.bio_tertiary ?? ""}</p>
            </div>
            <div className="mt-10 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Button asChild className="rounded-2xl px-8 tracking-wide shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-shadow">
                <Link to="/about">Full Profile <ArrowRight size={14} className="ml-2" /></Link>
              </Button>
              <Button variant="ghost" asChild className="rounded-2xl px-8 tracking-wide text-muted-foreground hover:text-foreground">
                <Link to="/contact">Work Together →</Link>
              </Button>
            </div>
            {aboutMe.quote && (
              <div className="mt-14 pt-10 border-t border-border/50">
                <blockquote className="font-display text-xl font-medium text-muted-foreground leading-relaxed italic">
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
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-4 py-2 mb-8">
              <Sparkles size={12} className="text-primary" />
              <p className="text-xs font-semibold tracking-[0.15em] uppercase text-primary">
                {hero.badge ?? "Architecture · Interiors · Urbanism"}
              </p>
            </div>
            <h1 className="font-display text-[clamp(3rem,8vw,6.5rem)] font-bold leading-[1.02] text-foreground tracking-tight">
              {hero.title_line1 ?? "Building spaces"}<br />
              <span className="text-primary">{hero.title_line2 ?? "that endure."}</span>
            </h1>
            <p className="mt-8 text-lg font-light text-muted-foreground max-w-lg leading-relaxed">
              {hero.description ?? ""}
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Button size="lg" asChild className="rounded-2xl px-8 tracking-wide shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-shadow text-base h-13">
                <Link to="/portfolio">View Projects <ArrowRight size={16} className="ml-2" /></Link>
              </Button>
              <Button variant="outline" size="lg" asChild className="rounded-2xl px-8 tracking-wide text-base h-13 border-border/50 hover:bg-secondary/60">
                <Link to="/contact">Work With Us</Link>
              </Button>
            </div>
          </div>
        </div>
        {/* Decorative grid */}
        <div className="absolute top-0 right-0 w-1/3 h-full opacity-[0.03] pointer-events-none">
          <div className="h-full w-full" style={{ backgroundImage: 'radial-gradient(circle, hsl(var(--foreground)) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        </div>
      </section>

      {/* Stats */}
      {stats.length > 0 && (
        <section ref={refStats} className="reveal py-16">
          <div className="container grid grid-cols-2 gap-4 md:grid-cols-4">
            {stats.map((s: any) => (
              <AnimatedStat key={s.label} value={s.value} suffix={s.suffix} label={s.label} />
            ))}
          </div>
        </section>
      )}

      {/* Featured Projects */}
      {featured.length > 0 && (
        <section ref={refFeatured} className="reveal container py-24">
          <div className="flex items-end justify-between mb-14">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-1 w-8 rounded-full bg-primary" />
                <p className="text-xs font-semibold tracking-[0.2em] uppercase text-primary">Selected Work</p>
              </div>
              <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground tracking-tight">Recent Projects</h2>
            </div>
            <Link to="/portfolio" className="hidden md:flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-xl px-4 py-2 hover:bg-secondary/60">
              All Projects <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {featured.map((item, i) => (
              <Link key={item.id} to={`/portfolio/${item.slug}`}
                className="group block relative overflow-hidden rounded-2xl border border-border/30">
                <div className={`overflow-hidden ${i === 0 ? "aspect-[3/4]" : "aspect-square"}`}>
                  {item.cover_image_url ? (
                    <img src={item.cover_image_url} alt={item.title} loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <Building2 size={40} className="text-muted-foreground/30" />
                    </div>
                  )}
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                  <h3 className="font-display text-xl font-bold text-background drop-shadow-lg">{item.title}</h3>
                  <div className="flex items-center gap-3 mt-2 text-xs text-background/70">
                    {item.category && <span className="tracking-wide bg-background/10 backdrop-blur-sm rounded-full px-3 py-1">{item.category}</span>}
                    {item.location && <span className="flex items-center gap-1"><MapPin size={9} />{item.location}</span>}
                    {item.year && <span>{item.year}</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-8 text-center md:hidden">
            <Button variant="outline" asChild className="rounded-2xl"><Link to="/portfolio">All Projects</Link></Button>
          </div>
        </section>
      )}

      {/* Services */}
      {servicesHome.length > 0 && (
        <section ref={refServices} className="reveal py-24">
          <div className="container">
            <div className="mb-14">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-1 w-8 rounded-full bg-primary" />
                <p className="text-xs font-semibold tracking-[0.2em] uppercase text-primary">Disciplines</p>
              </div>
              <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground tracking-tight">What We Do</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {servicesHome.map((s: any) => {
                const Icon = ICON_MAP[s.icon] ?? Building2;
                return (
                  <div key={s.title} className="group glass-card-public glass-glow-ring p-8">
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/15 transition-colors">
                      <Icon size={22} className="text-primary" />
                    </div>
                    <h3 className="font-display text-lg font-semibold text-foreground mb-3">{s.title}</h3>
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
            <div className="flex items-center gap-2 mb-4">
              <div className="h-1 w-8 rounded-full bg-primary" />
              <p className="text-xs font-semibold tracking-[0.2em] uppercase text-primary">Recognition</p>
            </div>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground tracking-tight">Client Voices</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((t: any) => (
              <div key={t.name} className="glass-card-public glass-glow-ring p-8">
                <p className="font-display text-5xl font-bold text-primary/20 mb-4">"</p>
                <p className="text-muted-foreground leading-relaxed text-sm">{t.text}</p>
                <div className="mt-6 pt-6 border-t border-border/30">
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
        <section ref={refAwards} className="reveal py-20">
          <div className="container">
            <div className="mb-12 flex items-center gap-6">
              <div className="h-px flex-1 bg-border/50" />
              <p className="text-xs font-semibold tracking-[0.2em] uppercase text-primary shrink-0">Awards & Recognition</p>
              <div className="h-px flex-1 bg-border/50" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {awards.map((a: any, i: number) => (
                <div key={a.year + a.title}
                  className={`reveal reveal-delay-${Math.min(i + 1, 4)} glass-card-public glass-glow-ring p-6`}>
                  <span className="font-display text-3xl font-bold text-primary/40">{a.year}</span>
                  <h3 className="font-display text-sm font-semibold text-foreground mt-2 leading-tight">{a.title}</h3>
                  <p className="text-[11px] tracking-wide text-muted-foreground mt-1.5 uppercase">{a.org}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section ref={refCta} className="reveal">
        <div className="container py-24">
          <div className="max-w-3xl mx-auto text-center glass-card-public p-16 relative overflow-hidden glass-glow-ring">
            {/* Background glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary/10 rounded-full blur-[80px]" />
            <div className="relative z-10">
              <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground tracking-tight">
                {cta.title_line1 ?? "Let's build something"}<br />
                <span className="text-primary">{cta.title_line2 ?? "remarkable."}</span>
              </h2>
              <p className="mt-6 text-muted-foreground text-lg">{cta.subtitle ?? "Every great building begins with a conversation."}</p>
              <Button className="mt-8 rounded-2xl px-10 tracking-wide shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-shadow h-13 text-base" size="lg" asChild>
                <Link to="/contact">Begin Your Project <ArrowRight size={16} className="ml-2" /></Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
