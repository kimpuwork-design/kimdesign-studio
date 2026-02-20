import { useEffect, useState } from "react";
import { PublicNav } from "@/components/PublicNav";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PortfolioItem } from "@/lib/portfolio";
import { useSettings } from "@/hooks/useSettings";
import {
  ArrowRight, Camera, Film, Star, Palette, MapPin, Calendar,
  Instagram, Facebook, Mail, Phone,
} from "lucide-react";

const SERVICES = [
  { icon: Camera, title: "Photography", desc: "Brand, editorial, and event photography that captures the essence of your story." },
  { icon: Film, title: "Film & Video", desc: "Cinematic production for commercials, documentaries, and social content." },
  { icon: Star, title: "Creative Direction", desc: "Strategy, styling, and concept development for your visual identity." },
  { icon: Palette, title: "Retouching", desc: "Professional post-production and color grading." },
];

const TESTIMONIALS = [
  { name: "Sarah K.", role: "Brand Director", text: "Working with them was transformative. Every frame told our story perfectly." },
  { name: "James L.", role: "CEO, Luxe Hospitality", text: "The attention to detail and creative vision exceeded our highest expectations." },
  { name: "Ana M.", role: "Interior Architect", text: "They captured the soul of our spaces in a way I didn't think was possible." },
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
      .limit(4)
      .then(({ data }) => setFeatured((data as unknown as PortfolioItem[]) ?? []));
  }, []);

  const studioName = settings?.studio_name ?? "Studio";
  const tagline = settings?.tagline ?? "We create visual stories that matter";
  const email = settings?.contact_email ?? "hello@studio.com";
  const instagram = settings?.instagram_url;
  const behance = settings?.behance_url;

  return (
    <div className="bg-background">
      <PublicNav />

      {/* Hero */}
      <section className="container py-24 md:py-36">
        <div className="max-w-3xl">
          {settings?.logo_url ? (
            <img src={settings.logo_url} alt={studioName} className="h-10 mb-8 object-contain" />
          ) : (
            <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-primary">
              {studioName}
            </p>
          )}
          <h1 className="font-display text-5xl font-bold leading-tight text-foreground md:text-7xl">
            {tagline.split(" ").map((word, i, arr) =>
              i === arr.length - 2 || i === arr.length - 1 ? (
                <span key={i} className="text-primary">{word} </span>
              ) : (
                <span key={i}>{word} </span>
              )
            )}
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-xl">
            Photography, film, and creative direction for brands that refuse to be ordinary.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Button size="lg" asChild>
              <Link to="/portfolio">View Our Work <ArrowRight size={16} className="ml-2" /></Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/contact">Start a Project</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border bg-secondary/30 py-12">
        <div className="container grid grid-cols-2 gap-8 md:grid-cols-4">
          {[
            { label: "Projects Delivered", value: "200+" },
            { label: "Happy Clients", value: "80+" },
            { label: "Years Experience", value: "10+" },
            { label: "Awards Won", value: "15" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="font-display text-4xl font-bold text-foreground">{s.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Portfolio */}
      {featured.length > 0 && (
        <section className="container py-20">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-2">Our Work</p>
              <h2 className="font-display text-4xl font-bold text-foreground">Featured Projects</h2>
            </div>
            <Link to="/portfolio" className="hidden md:flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
              View All <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((item) => (
              <Link key={item.id} to={`/portfolio/${item.slug}`}
                className="group block rounded-2xl overflow-hidden border border-border bg-card hover:border-primary/40 transition-all hover:-translate-y-1 hover:shadow-xl">
                <div className="aspect-[3/4] overflow-hidden bg-secondary/50">
                  {item.cover_image_url ? (
                    <img src={item.cover_image_url} alt={item.title} loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : <div className="w-full h-full" />}
                </div>
                <div className="p-4">
                  <h3 className="font-display font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">{item.title}</h3>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                    {item.category && <span>{item.category}</span>}
                    {item.year && <span className="flex items-center gap-0.5"><Calendar size={10} />{item.year}</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-8 text-center md:hidden">
            <Button variant="outline" asChild><Link to="/portfolio">View All Projects</Link></Button>
          </div>
        </section>
      )}

      {/* Services */}
      <section className="container py-20 border-t border-border">
        <div className="mb-12">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-2">What We Do</p>
          <h2 className="font-display text-4xl font-bold text-foreground">Services</h2>
          <p className="mt-3 text-muted-foreground">Crafted with precision, delivered with passion.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {SERVICES.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.title} className="rounded-xl border border-border bg-card p-6 hover:border-primary/40 transition-colors group">
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Icon size={20} className="text-primary" />
                </div>
                <h3 className="font-display text-xl font-semibold text-foreground">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Testimonials */}
      <section className="border-y border-border bg-secondary/20 py-20">
        <div className="container">
          <div className="mb-12 text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-2">Client Love</p>
            <h2 className="font-display text-4xl font-bold text-foreground">What They Say</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="rounded-2xl border border-border bg-card p-6">
                <p className="text-4xl text-primary mb-4">"</p>
                <p className="text-muted-foreground leading-relaxed italic">"{t.text}"</p>
                <div className="mt-5 pt-5 border-t border-border">
                  <p className="font-semibold text-foreground text-sm">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container py-24">
        <div className="rounded-3xl bg-foreground px-8 py-16 md:py-20 text-center relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="font-display text-4xl md:text-5xl font-bold text-background">Ready to create something great?</h2>
            <p className="mt-4 text-background/70 text-lg">Let's talk about your next project.</p>
            <Button className="mt-8 bg-primary text-primary-foreground hover:bg-primary/90" size="lg" asChild>
              <Link to="/contact">Get in Touch <ArrowRight size={16} className="ml-2" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="container">
          <div className="flex flex-col md:flex-row items-start justify-between gap-8">
            <div>
              {settings?.logo_url ? (
                <img src={settings.logo_url} alt={studioName} className="h-8 mb-3 object-contain" />
              ) : (
                <div className="flex items-center gap-2 mb-3">
                  <span className="font-display text-xl font-bold">{studioName}</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                </div>
              )}
              <p className="text-sm text-muted-foreground max-w-xs">{tagline}</p>
              <div className="flex items-center gap-3 mt-4">
                {email && (
                  <a href={`mailto:${email}`} className="text-muted-foreground hover:text-foreground transition-colors">
                    <Mail size={16} />
                  </a>
                )}
                {instagram && (
                  <a href={instagram} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                    <Instagram size={16} />
                  </a>
                )}
                {behance && (
                  <a href={behance} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M7.799 5.698c.589 0 1.12.051 1.606.156.482.102.895.273 1.243.512.344.239.612.553.804.941.187.387.28.863.28 1.425 0 .612-.138 1.12-.412 1.543-.277.42-.677.768-1.201 1.035.713.205 1.243.569 1.597 1.09.35.522.525 1.148.525 1.875 0 .612-.119 1.131-.359 1.563-.237.432-.563.78-.966 1.044-.406.265-.867.459-1.387.58-.518.12-1.049.181-1.584.181H1V5.698h6.799zm-.339 4.861c.475 0 .86-.113 1.157-.337.297-.225.446-.586.446-1.082 0-.27-.05-.497-.148-.671-.099-.175-.232-.314-.402-.418-.168-.106-.362-.179-.584-.222-.221-.042-.455-.063-.703-.063H3.601v2.793h3.859zm.189 5.084c.267 0 .521-.025.76-.074.241-.052.453-.135.637-.249.185-.115.332-.268.44-.461.11-.193.165-.445.165-.751 0-.596-.168-1.024-.503-1.288-.336-.265-.783-.396-1.343-.396H3.601v3.219h4.048zm9.166-8.637c.639 0 1.219.108 1.743.321.524.216.973.525 1.346.929.372.403.66.895.859 1.469.199.576.298 1.224.298 1.943 0 .089-.002.183-.007.277-.004.095-.01.183-.016.268H13.61c.046.719.283 1.259.713 1.618.428.359.955.539 1.576.539.471 0 .875-.107 1.21-.318.336-.212.574-.451.715-.716h2.439c-.387 1.115-.987 1.928-1.797 2.436-.808.508-1.793.762-2.958.762-.806 0-1.537-.131-2.189-.393-.652-.263-1.209-.635-1.67-1.116-.46-.48-.817-1.058-1.07-1.733-.25-.676-.376-1.424-.376-2.246 0-.79.131-1.52.389-2.193.259-.672.621-1.25 1.085-1.733.463-.483 1.015-.859 1.654-1.131.639-.271 1.346-.403 2.121-.403zm3.432 3.543c-.046-.598-.268-1.086-.664-1.463-.396-.376-.912-.563-1.551-.563-.362 0-.675.062-.941.184-.267.121-.493.282-.678.48-.186.199-.333.431-.44.697-.107.265-.163.55-.165.865h4.439v-.2zm-9.598-6.05h5.627v1.494h-5.627V4.499z"/></svg>
                  </a>
                )}
              </div>
            </div>
            <nav className="flex gap-12">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Navigation</p>
                {[
                  { label: "Portfolio", href: "/portfolio" },
                  { label: "Services", href: "/services" },
                  { label: "About", href: "/about" },
                  { label: "Contact", href: "/contact" },
                ].map((l) => (
                  <Link key={l.href} to={l.href} className="block text-sm text-muted-foreground hover:text-foreground transition-colors mb-2">{l.label}</Link>
                ))}
              </div>
            </nav>
          </div>
          <div className="mt-10 pt-6 border-t border-border">
            <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} {studioName}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
