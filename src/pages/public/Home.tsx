import { useEffect, useState } from "react";
import { PublicNav } from "@/components/PublicNav";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PortfolioItem } from "@/lib/portfolio";
import { useSettings } from "@/hooks/useSettings";
import { ArrowRight, Building2, Ruler, Leaf, PenTool, MapPin, Calendar, Mail, Instagram, Award, GraduationCap, Globe } from "lucide-react";
import profileImg from "@/assets/profile-placeholder.jpg";

const SERVICES = [
  { icon: Building2, title: "Architectural Design", desc: "Bespoke residential and commercial architecture rooted in context, craft, and lasting material quality." },
  { icon: Ruler, title: "Interior Architecture", desc: "Thoughtfully designed interiors that balance spatial logic with sensory richness." },
  { icon: Leaf, title: "Landscape & Urbanism", desc: "Site-responsive landscape strategies that connect buildings to their natural and urban surroundings." },
  { icon: PenTool, title: "Planning & Feasibility", desc: "Expert guidance through concept, planning permission, and technical coordination." },
];

const TESTIMONIALS = [
  { name: "Elara Fontaine", role: "Private Client, London", text: "FORMA transformed our vision into a home that feels both extraordinary and deeply liveable. Every detail was considered." },
  { name: "Thomas Rein", role: "Director, Rein Properties", text: "Their ability to balance commercial objectives with genuine architectural ambition is rare and invaluable." },
  { name: "Sophia Lund", role: "Cultural Foundation", text: "The building they designed for us has become a landmark. It belongs to its place as if it was always there." },
];

export default function Home() {
  const { settings } = useSettings();
  const [featured, setFeatured] = useState<PortfolioItem[]>([]);

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
  const tagline = settings?.tagline ?? "Architecture that endures";
  const email = settings?.contact_email ?? "studio@forma.com";
  const instagram = settings?.instagram_url;

  return (
    <div className="bg-background">
      <PublicNav />

      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center">
        <div className="container py-24 md:py-36">
          <div className="max-w-4xl">
            <p className="mb-6 text-xs font-medium tracking-[0.25em] uppercase text-primary">
              Architecture · Interiors · Urbanism
            </p>
            <h1 className="font-display text-[clamp(3rem,8vw,7rem)] font-light leading-[1.02] text-foreground">
              Building spaces<br />
              <em className="not-italic font-semibold text-primary">that endure.</em>
            </h1>
            <p className="mt-8 text-lg font-light text-muted-foreground max-w-lg leading-relaxed">
              We are a London-based architecture studio practising at the intersection of material culture, place, and human experience.
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
        {/* Decorative line */}
        <div className="absolute bottom-12 right-12 hidden lg:flex flex-col items-center gap-3">
          <div className="h-20 w-px bg-border" />
          <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground rotate-90 origin-center translate-x-6">Est. 2008</p>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border bg-secondary/40 py-14">
        <div className="container grid grid-cols-2 gap-8 md:grid-cols-4">
          {[
            { label: "Projects Completed", value: "120+" },
            { label: "Awards & Nominations", value: "24" },
            { label: "Countries", value: "11" },
            { label: "Years of Practice", value: "16" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="font-display text-5xl font-light text-foreground">{s.value}</p>
              <p className="mt-2 text-xs tracking-[0.12em] uppercase text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── ABOUT ME ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-background">
        {/* Thin vertical rule */}
        <div className="absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-border lg:block" />

        <div className="container grid lg:grid-cols-2 min-h-[85vh]">

          {/* Left — Image panel */}
          <div className="relative flex items-stretch">
            <div className="relative w-full overflow-hidden">
              {/* large offset number */}
              <span className="absolute -left-4 top-10 font-display text-[9rem] font-light leading-none text-secondary select-none pointer-events-none z-0">01</span>

              {/* photo */}
              <div className="relative z-10 mt-16 mb-0 lg:mt-0 h-[520px] lg:h-full">
                <img
                  src={profileImg}
                  alt="Principal Architect"
                  className="h-full w-full object-cover object-center"
                />
                {/* Floating credential card */}
                <div className="absolute bottom-8 -right-0 lg:-right-8 bg-foreground text-background px-6 py-5 max-w-[220px] shadow-2xl">
                  <p className="text-[10px] tracking-[0.25em] uppercase text-background/50 mb-2">Credentials</p>
                  <div className="space-y-2">
                    {[
                      { icon: GraduationCap, text: "M.Arch, Bartlett UCL" },
                      { icon: Award, text: "RIBA Chartered Architect" },
                      { icon: Globe, text: "16 Years of Practice" },
                    ].map((c) => {
                      const Icon = c.icon;
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

          {/* Right — Text panel */}
          <div className="flex flex-col justify-center py-20 lg:pl-16 xl:pl-24">
            {/* Label */}
            <div className="flex items-center gap-4 mb-10">
              <div className="h-px w-10 bg-primary" />
              <p className="text-[10px] tracking-[0.3em] uppercase text-primary font-medium">Principal Architect</p>
            </div>

            {/* Name */}
            <h2 className="font-display text-[clamp(2.8rem,5vw,5rem)] font-light leading-[1.05] text-foreground mb-2">
              Elena<br />
              <span className="font-semibold italic">Markov.</span>
            </h2>

            {/* Divider with year */}
            <div className="flex items-center gap-4 my-8">
              <div className="h-px max-w-[60px] w-full bg-border" />
              <span className="text-xs tracking-[0.2em] text-muted-foreground">Est. 2008</span>
            </div>

            {/* Bio */}
            <div className="space-y-4 max-w-md">
              <p className="text-base font-light leading-relaxed text-foreground">
                I founded FORMA on the belief that great architecture must be deeply rooted in its place, built with material honesty, and scaled to human experience.
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                After training at the Bartlett and working with Zaha Hadid Architects and Snøhetta, I returned to London to build a practice that could take time with each project — treating every commission as a conversation between site, brief, and craft.
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                My work spans private houses, cultural institutions, and urban strategies across 11 countries, recognised by the RIBA, the Civic Trust, and the AJ Awards.
              </p>
            </div>

            {/* CTA buttons */}
            <div className="mt-10 flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <Button asChild className="rounded-none px-8 tracking-wide">
                <Link to="/about">Full Profile <ArrowRight size={14} className="ml-2" /></Link>
              </Button>
              <Button variant="ghost" asChild className="rounded-none px-0 tracking-wide text-muted-foreground hover:text-foreground">
                <Link to="/contact">Work Together →</Link>
              </Button>
            </div>

            {/* Quote */}
            <div className="mt-14 pt-10 border-t border-border">
              <blockquote className="font-display text-xl font-light italic text-muted-foreground leading-relaxed">
                "Architecture should feel inevitable — as if it could not have been any other way."
              </blockquote>
            </div>
          </div>

        </div>
      </section>
      {/* ── END ABOUT ME ────────────────────────────────────── */}

      {/* Featured Projects */}

      {featured.length > 0 && (
        <section className="container py-24">
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
      <section className="border-t border-border bg-secondary/30 py-24">
        <div className="container">
          <div className="mb-14">
            <p className="text-xs font-medium tracking-[0.25em] uppercase text-primary mb-3">Disciplines</p>
            <h2 className="font-display text-5xl font-light text-foreground">What We Do</h2>
          </div>
          <div className="grid gap-px border border-border bg-border md:grid-cols-2 lg:grid-cols-4">
            {SERVICES.map((s) => {
              const Icon = s.icon;
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

      {/* Testimonials */}
      <section className="container py-24">
        <div className="mb-14">
          <p className="text-xs font-medium tracking-[0.25em] uppercase text-primary mb-3">Recognition</p>
          <h2 className="font-display text-5xl font-light text-foreground">Client Voices</h2>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
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

      {/* CTA */}
      <section className="border-t border-border">
        <div className="container py-24">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="font-display text-5xl md:text-6xl font-light text-foreground">
              Let's build something<br /><em className="not-italic font-semibold text-primary">remarkable.</em>
            </h2>
            <p className="mt-6 text-muted-foreground">Every great building begins with a conversation.</p>
            <Button className="mt-8 rounded-none px-10 tracking-wide" size="lg" asChild>
              <Link to="/contact">Begin a Project <ArrowRight size={15} className="ml-2" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-secondary/30 py-12">
        <div className="container">
          <div className="flex flex-col md:flex-row items-start justify-between gap-10">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="font-display text-lg font-semibold">{studioName}</span>
                <span className="h-px w-5 bg-primary" />
                <span className="text-xs tracking-[0.2em] uppercase text-muted-foreground">Architecture</span>
              </div>
              <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">{tagline}</p>
              <div className="flex items-center gap-4 mt-5">
                {email && (
                  <a href={`mailto:${email}`} className="text-muted-foreground hover:text-foreground transition-colors">
                    <Mail size={15} />
                  </a>
                )}
                {instagram && (
                  <a href={instagram} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                    <Instagram size={15} />
                  </a>
                )}
              </div>
            </div>
            <nav className="flex gap-12">
              <div>
                <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-muted-foreground mb-4">Navigate</p>
                {[
                  { label: "Projects", href: "/portfolio" },
                  { label: "Services", href: "/services" },
                  { label: "Studio", href: "/about" },
                  { label: "Contact", href: "/contact" },
                ].map((l) => (
                  <Link key={l.href} to={l.href} className="block text-sm text-muted-foreground hover:text-foreground transition-colors mb-2">{l.label}</Link>
                ))}
              </div>
            </nav>
          </div>
          <div className="mt-10 pt-6 border-t border-border flex flex-col md:flex-row gap-2 justify-between">
            <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} {studioName} Architecture. All rights reserved.</p>
            <p className="text-xs text-muted-foreground">London · New York · Copenhagen</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
