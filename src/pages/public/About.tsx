import { PublicNav } from "@/components/PublicNav";

export default function About() {
  return (
    <div className="bg-background">
      <PublicNav />
      <div className="container py-16 max-w-3xl">
        <h1 className="font-display text-5xl font-bold mb-2">About</h1>
        <p className="text-muted-foreground mb-12">The story behind the studio</p>
        <div className="prose prose-lg max-w-none">
          <p className="text-lg text-foreground leading-relaxed">
            We are a creative studio founded on the belief that great visuals are the backbone of every powerful brand. 
            Since our founding, we've partnered with brands across fashion, tech, hospitality, and culture to bring their stories to life through photography, film, and creative direction.
          </p>
          <p className="mt-6 text-muted-foreground leading-relaxed">
            Our small but mighty team combines technical mastery with a relentless pursuit of the extraordinary. 
            Every project we take on becomes a canvas for ideas that are bold, intentional, and always human.
          </p>
        </div>
      </div>
    </div>
  );
}
