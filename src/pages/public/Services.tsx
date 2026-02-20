import { PublicNav } from "@/components/PublicNav";
import { Camera, Film, Star, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const services = [
  { icon: Camera, title: "Photography", price: "From $800", desc: "Brand, editorial, and event photography tailored to your vision." },
  { icon: Film, title: "Film & Video", price: "From $2,400", desc: "Cinematic production for commercials, docs, and social content." },
  { icon: Star, title: "Creative Direction", price: "From $1,200", desc: "End-to-end concept and strategy for your visual identity." },
  { icon: Palette, title: "Retouching", price: "From $200", desc: "Professional post-production and color grading." },
];

export default function Services() {
  return (
    <div className="bg-background">
      <PublicNav />
      <div className="container py-16">
        <h1 className="font-display text-5xl font-bold mb-2">Services</h1>
        <p className="text-muted-foreground mb-12">Every project is built from scratch, just for you.</p>
        <div className="grid gap-6 md:grid-cols-2">
          {services.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.title} className="rounded-xl border border-border bg-card p-8 hover:border-primary/40 transition-colors">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Icon size={22} className="text-primary" />
                </div>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-display text-2xl font-semibold">{s.title}</h3>
                    <p className="mt-2 text-muted-foreground">{s.desc}</p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-primary">{s.price}</span>
                </div>
                <Button variant="outline" className="mt-6" size="sm" asChild>
                  <Link to="/contact">Enquire</Link>
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
