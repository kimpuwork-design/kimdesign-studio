import { PublicNav } from "@/components/PublicNav";
import { PublicFooter } from "@/components/PublicFooter";
import { Building2, Ruler, Leaf, PenTool, FileText, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useSiteContent } from "@/hooks/useSiteContent";

const ICON_MAP: Record<string, any> = { Building2, Ruler, Leaf, PenTool, FileText, Lightbulb };

export default function Services() {
  const { content } = useSiteContent("services_full", "services_page", "process");

  const services: any[] = content.services_full ?? [];
  const page = content.services_page ?? {};
  const process: any[] = content.process ?? [];

  return (
    <div className="bg-background">
      <PublicNav />

      {/* Hero */}
      <section className="container py-20 md:py-28">
        <div className="max-w-2xl">
          <p className="text-xs font-medium tracking-[0.25em] uppercase text-primary mb-4">{page.hero_subtitle ?? "Services"}</p>
          <h1 className="font-display text-[clamp(2.5rem,6vw,5.5rem)] font-light leading-tight text-foreground">
            {page.hero_title_line1 ?? "Every project,"}<br />
            <em className="not-italic font-semibold">{page.hero_title_line2 ?? "built from scratch."}</em>
          </h1>
          <p className="mt-6 text-muted-foreground font-light leading-relaxed">
            {page.hero_description ?? ""}
          </p>
        </div>
      </section>

      {/* Services grid */}
      {services.length > 0 && (
        <section className="border-t border-border">
          <div className="container py-16">
            <div className="grid gap-px border border-border bg-border md:grid-cols-2 lg:grid-cols-3">
              {services.map((s: any) => {
                const Icon = ICON_MAP[s.icon] ?? Building2;
                return (
                  <div key={s.title} className="bg-background p-8 hover:bg-secondary/30 transition-colors group">
                    <Icon size={22} className="text-primary mb-5" />
                    <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-2">{s.stage}</p>
                    <h3 className="font-display text-2xl font-medium text-foreground mb-3">{s.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-6">{s.desc}</p>
                    <Button variant="outline" className="rounded-none text-xs tracking-wide" size="sm" asChild>
                      <Link to="/contact">Enquire</Link>
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Process */}
      {process.length > 0 && (
        <section className="border-t border-border bg-secondary/30 py-20">
          <div className="container">
            <p className="text-xs font-medium tracking-[0.25em] uppercase text-primary mb-12">Our Process</p>
            <div className="grid gap-10 md:grid-cols-4">
              {process.map((step: any) => (
                <div key={step.n} className="border-t-2 border-primary/30 pt-6">
                  <span className="font-display text-4xl font-light text-primary/40">{step.n}</span>
                  <h3 className="font-display text-xl font-medium text-foreground mt-3 mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="container py-20 text-center">
        <h2 className="font-display text-4xl font-light text-foreground mb-4">{page.cta_title ?? "Ready to discuss your project?"}</h2>
        <p className="text-muted-foreground mb-8">{page.cta_description ?? ""}</p>
        <Button className="rounded-none px-10 tracking-wide" size="lg" asChild>
          <Link to="/contact">Start a Conversation</Link>
        </Button>
      </section>
      <PublicFooter />
    </div>
  );
}
