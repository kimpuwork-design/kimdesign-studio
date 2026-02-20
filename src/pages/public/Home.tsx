import { PublicNav } from "@/components/PublicNav";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Camera, Film, Star } from "lucide-react";

export default function Home() {
  return (
    <div className="bg-background">
      <PublicNav />

      {/* Hero */}
      <section className="container py-24 md:py-32">
        <div className="max-w-3xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-primary">
            Creative Studio
          </p>
          <h1 className="font-display text-5xl font-bold leading-tight text-foreground md:text-7xl">
            We create <span className="text-primary">visual stories</span> that matter
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

      {/* Services Preview */}
      <section className="container py-20">
        <div className="mb-12">
          <h2 className="font-display text-3xl font-bold">What we do</h2>
          <p className="mt-2 text-muted-foreground">Crafted with precision, delivered with passion.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { icon: Camera, title: "Photography", desc: "Brand, editorial, and event photography that captures the essence of your story." },
            { icon: Film, title: "Film & Video", desc: "Cinematic production for commercials, documentaries, and social content." },
            { icon: Star, title: "Creative Direction", desc: "Strategy, styling, and concept development for your visual identity." },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.title} className="rounded-xl border border-border bg-card p-6 hover:border-primary/40 transition-colors">
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Icon size={20} className="text-primary" />
                </div>
                <h3 className="font-display text-xl font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="container py-20">
        <div className="rounded-2xl bg-foreground px-8 py-14 text-center text-background">
          <h2 className="font-display text-4xl font-bold">Ready to create something great?</h2>
          <p className="mt-4 text-background/70">Let's talk about your next project.</p>
          <Button className="mt-8 bg-primary text-primary-foreground hover:bg-primary/90" size="lg" asChild>
            <Link to="/contact">Get in Touch <ArrowRight size={16} className="ml-2" /></Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-border py-8">
        <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold">Studio</span>
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          </div>
          <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} Studio. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
