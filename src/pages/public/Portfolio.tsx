import { PublicNav } from "@/components/PublicNav";
import { Grid3X3 } from "lucide-react";

export default function Portfolio() {
  return (
    <div className="bg-background">
      <PublicNav />
      <div className="container py-16">
        <h1 className="font-display text-5xl font-bold mb-2">Portfolio</h1>
        <p className="text-muted-foreground mb-12">A selection of our finest work</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[4/3] rounded-xl border border-border bg-secondary/50 flex items-center justify-center hover:border-primary/40 transition-colors cursor-pointer"
            >
              <Grid3X3 size={32} className="text-muted-foreground/40" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
