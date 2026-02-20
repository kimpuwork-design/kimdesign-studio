import { PublicNav } from "@/components/PublicNav";
import { PublicFooter } from "@/components/PublicFooter";
import { Building2, Ruler, Leaf, PenTool, FileText, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const services = [
  {
    icon: Building2,
    title: "Architectural Design",
    stage: "RIBA Stages 0–6",
    desc: "Full architectural services from inception through to completion. We lead projects of all scales, from sensitive rural additions to complex urban mixed-use developments, with the same care and attention throughout.",
  },
  {
    icon: Ruler,
    title: "Interior Architecture",
    stage: "Concept to Completion",
    desc: "Interior architectural design that goes beyond surface treatment to rethink spatial layout, material logic, and the quality of light. We work closely with specialist makers and craftspeople to realise interiors of lasting quality.",
  },
  {
    icon: Leaf,
    title: "Landscape & Site",
    stage: "Context & Masterplan",
    desc: "Site-responsive landscape design that extends the architectural idea into the ground and horizon. From private gardens to public squares, we design landscapes that are ecologically generous and beautifully composed.",
  },
  {
    icon: PenTool,
    title: "Planning & Permissions",
    stage: "Pre-Application to Consent",
    desc: "Expert navigation of planning systems across England, Scotland, and Wales. We prepare compelling applications and manage relationships with planning authorities, heritage bodies, and design review panels.",
  },
  {
    icon: FileText,
    title: "Technical Design",
    stage: "RIBA Stages 4–5",
    desc: "Rigorous technical design and specification that ensures our buildings are buildable, durable, and thermally excellent. We coordinate all specialist engineers and consultants through to tender and construction.",
  },
  {
    icon: Lightbulb,
    title: "Design Consultancy",
    stage: "Advisory",
    desc: "Independent design guidance for developers, institutions, and other architects. We offer peer review, design code authorship, design champion roles, and feasibility studies.",
  },
];

const PROCESS = [
  { n: "01", title: "Listen", desc: "A thorough briefing process to understand your needs, aspirations, and the spirit of the place." },
  { n: "02", title: "Research", desc: "Site analysis, precedent study, and technical due diligence before a single line is drawn." },
  { n: "03", title: "Propose", desc: "Iterative design proposals developed collaboratively with you through sketches, models, and drawings." },
  { n: "04", title: "Deliver", desc: "Rigorous technical development, procurement, and construction-phase leadership to realise the design." },
];

export default function Services() {
  return (
    <div className="bg-background">
      <PublicNav />

      {/* Hero */}
      <section className="container py-20 md:py-28">
        <div className="max-w-2xl">
          <p className="text-xs font-medium tracking-[0.25em] uppercase text-primary mb-4">Services</p>
          <h1 className="font-display text-[clamp(2.5rem,6vw,5.5rem)] font-light leading-tight text-foreground">
            Every project,<br /><em className="not-italic font-semibold">built from scratch.</em>
          </h1>
          <p className="mt-6 text-muted-foreground font-light leading-relaxed">
            We offer a complete range of architectural services, tailored to the scale and nature of each commission.
          </p>
        </div>
      </section>

      {/* Services grid */}
      <section className="border-t border-border">
        <div className="container py-16">
          <div className="grid gap-px border border-border bg-border md:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => {
              const Icon = s.icon;
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

      {/* Process */}
      <section className="border-t border-border bg-secondary/30 py-20">
        <div className="container">
          <p className="text-xs font-medium tracking-[0.25em] uppercase text-primary mb-12">Our Process</p>
          <div className="grid gap-10 md:grid-cols-4">
            {PROCESS.map((step) => (
              <div key={step.n} className="border-t-2 border-primary/30 pt-6">
                <span className="font-display text-4xl font-light text-primary/40">{step.n}</span>
                <h3 className="font-display text-xl font-medium text-foreground mt-3 mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container py-20 text-center">
        <h2 className="font-display text-4xl font-light text-foreground mb-4">Ready to discuss your project?</h2>
        <p className="text-muted-foreground mb-8">We welcome enquiries at any stage — from initial curiosity to live brief.</p>
        <Button className="rounded-none px-10 tracking-wide" size="lg" asChild>
          <Link to="/contact">Start a Conversation</Link>
        </Button>
      </section>
      <PublicFooter />
    </div>
  );
}
