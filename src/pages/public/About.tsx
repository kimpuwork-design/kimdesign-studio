import { PublicNav } from "@/components/PublicNav";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const TEAM = [
  { name: "Elena Markov", role: "Founding Partner & Lead Architect", bio: "RIBA Part III with 18 years of practice across residential, cultural, and civic typologies. Previously at Zaha Hadid Architects and Snøhetta." },
  { name: "Daniel Osei", role: "Partner, Interior Architecture", bio: "Specialist in material culture and spatial sequencing. MA Interior Architecture from the RCA. Passionate about the meeting point of craft and construction." },
  { name: "Mei-Lin Torres", role: "Associate, Landscape & Urbanism", bio: "Landscape architect and urbanist with deep experience in public realm design across Europe and East Asia." },
];

const VALUES = [
  { title: "Context First", desc: "Every site is a conversation. We listen before we draw." },
  { title: "Material Honesty", desc: "We favour materials that age well and tell the truth about how they're made." },
  { title: "Human Scale", desc: "Great buildings are experienced at human scale — from the city street to the window sill." },
  { title: "Long Practice", desc: "Architecture is slow work. We believe in taking the time to get it right." },
];

export default function About() {
  return (
    <div className="bg-background">
      <PublicNav />

      {/* Hero */}
      <section className="container py-20 md:py-28">
        <div className="max-w-3xl">
          <p className="text-xs font-medium tracking-[0.25em] uppercase text-primary mb-4">The Studio</p>
          <h1 className="font-display text-[clamp(2.5rem,6vw,5.5rem)] font-light leading-tight text-foreground">
            Architecture as a<br /><em className="not-italic font-semibold">long conversation.</em>
          </h1>
        </div>
      </section>

      {/* Story */}
      <section className="border-t border-border">
        <div className="container grid gap-16 py-20 md:grid-cols-2">
          <div className="space-y-6 text-muted-foreground leading-relaxed">
            <p className="text-lg font-light text-foreground">
              FORMA was founded in 2008 with a simple conviction: that architecture should serve people and place, not the other way around.
            </p>
            <p>
              Over sixteen years we have grown into a practice of twelve architects, interior designers, and landscape specialists working across residential, cultural, civic, and commercial typologies.
            </p>
            <p>
              Our process begins with deep listening — to the site, to the brief, and to the people who will inhabit what we make. From there, we work iteratively, testing ideas at every scale until we find solutions that feel both inevitable and surprising.
            </p>
          </div>
          <div className="space-y-6 text-muted-foreground leading-relaxed">
            <p>
              We are based in London with a satellite office in Copenhagen. Our work spans private houses, apartment buildings, cultural institutions, workplaces, and urban master plans across Europe, the Americas, and Asia.
            </p>
            <p>
              We have been recognised with the RIBA National Award, the Civic Trust Award, and the AJ Small Projects Award, among others. But the measure we value most is whether the people who live and work in our buildings feel that the spaces serve them well.
            </p>
            <Button variant="outline" className="rounded-none mt-4" asChild>
              <Link to="/contact">Get in Touch <ArrowRight size={14} className="ml-2" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="border-t border-border bg-secondary/30 py-20">
        <div className="container">
          <p className="text-xs font-medium tracking-[0.25em] uppercase text-primary mb-10">Principles</p>
          <div className="grid gap-px border border-border bg-border md:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((v) => (
              <div key={v.title} className="bg-background p-8">
                <h3 className="font-display text-xl font-medium text-foreground mb-3">{v.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="container py-20">
        <p className="text-xs font-medium tracking-[0.25em] uppercase text-primary mb-10">People</p>
        <div className="grid gap-10 md:grid-cols-3">
          {TEAM.map((p) => (
            <div key={p.name} className="border-t border-border pt-8">
              <div className="mb-4 h-48 bg-secondary/60 rounded-none" />
              <h3 className="font-display text-xl font-medium text-foreground">{p.name}</h3>
              <p className="text-xs tracking-wide text-primary mt-1 mb-3 uppercase">{p.role}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{p.bio}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
