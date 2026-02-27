import { PublicNav } from "@/components/PublicNav";
import { PublicFooter } from "@/components/PublicFooter";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useSiteContent } from "@/hooks/useSiteContent";
import { useSEO } from "@/hooks/useSEO";
import { FloatingChatButton } from "@/components/FloatingChatButton";

export default function About() {
  useSEO({ title: "About", description: "Learn about our architecture studio, values, and team" });
  const { content } = useSiteContent("about_page", "values", "team");

  const page = content.about_page ?? {};
  const values: any[] = content.values ?? [];
  const team: any[] = content.team ?? [];
  const storyParagraphs: string[] = page.story_paragraphs ?? [];

  return (
    <div className="bg-background relative">
      <PublicNav />

      {/* Ambient orbs */}
      <div className="fixed top-1/3 -left-40 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[150px] pointer-events-none" />
      <div className="fixed bottom-1/4 -right-40 w-[400px] h-[400px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

      {/* Hero */}
      <section className="container py-20 md:py-28 relative z-10">
        <div className="max-w-3xl">
          <p className="text-xs font-medium tracking-[0.25em] uppercase text-primary mb-4">{page.hero_subtitle ?? "The Studio"}</p>
          <h1 className="font-display text-[clamp(2.5rem,6vw,5.5rem)] font-light leading-tight text-foreground">
            {page.hero_title_line1 ?? "Architecture as a"}<br />
            <em className="not-italic font-semibold">{page.hero_title_line2 ?? "long conversation."}</em>
          </h1>
        </div>
      </section>

      {/* Story */}
      {storyParagraphs.length > 0 && (
        <section className="border-t border-border/50 relative z-10">
          <div className="container grid gap-16 py-20 md:grid-cols-2">
            <div className="space-y-6 text-muted-foreground leading-relaxed">
              {storyParagraphs.slice(0, Math.ceil(storyParagraphs.length / 2)).map((p, i) => (
                <p key={i} className={i === 0 ? "text-lg font-light text-foreground" : ""}>{p}</p>
              ))}
            </div>
            <div className="space-y-6 text-muted-foreground leading-relaxed">
              {storyParagraphs.slice(Math.ceil(storyParagraphs.length / 2)).map((p, i) => (
                <p key={i}>{p}</p>
              ))}
              <Button variant="outline" className="rounded-2xl mt-4" asChild>
                <Link to="/contact">Get in Touch <ArrowRight size={14} className="ml-2" /></Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Values */}
      {values.length > 0 && (
        <section className="border-t border-border/50 py-20 relative z-10">
          <div className="container">
            <p className="text-xs font-medium tracking-[0.25em] uppercase text-primary mb-10">Principles</p>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {values.map((v: any) => (
                <div key={v.title} className="glass-card-public glass-glow-ring p-8">
                  <h3 className="font-display text-xl font-medium text-foreground mb-3">{v.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Team */}
      {team.length > 0 && (
        <section className="container py-20 relative z-10">
          <p className="text-xs font-medium tracking-[0.25em] uppercase text-primary mb-10">People</p>
          <div className="grid gap-6 md:grid-cols-3">
            {team.map((p: any) => (
              <div key={p.name} className="group glass-card-public overflow-hidden glass-glow-ring">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.name} className="h-48 w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="h-48 bg-secondary/60" />
                )}
                <div className="p-6">
                  <h3 className="font-display text-xl font-medium text-foreground">{p.name}</h3>
                  <p className="text-xs tracking-wide text-primary mt-1 mb-3 uppercase">{p.role}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{p.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <PublicFooter />
      <FloatingChatButton />
    </div>
  );
}
