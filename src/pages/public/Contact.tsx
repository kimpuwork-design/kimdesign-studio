import { PublicNav } from "@/components/PublicNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { Mail, Phone, MapPin } from "lucide-react";

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="bg-background">
      <PublicNav />
      <div className="container py-16">
        <h1 className="font-display text-5xl font-bold mb-2">Contact</h1>
        <p className="text-muted-foreground mb-12">Let's start a conversation</p>
        <div className="grid gap-12 md:grid-cols-2">
          <div>
            <div className="space-y-6">
              {[
                { icon: Mail, label: "Email", value: "hello@mystudio.com" },
                { icon: Phone, label: "Phone", value: "+1 (555) 000-0000" },
                { icon: MapPin, label: "Location", value: "New York, NY" },
              ].map((c) => {
                const Icon = c.icon;
                return (
                  <div key={c.label} className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Icon size={18} className="text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{c.label}</p>
                      <p className="font-medium">{c.value}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            {submitted ? (
              <div className="py-12 text-center">
                <p className="text-4xl mb-4">🙌</p>
                <h3 className="font-display text-xl font-bold">Message received!</h3>
                <p className="mt-2 text-muted-foreground">We'll be in touch within 24 hours.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" placeholder="Your name" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="your@email.com" required />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="subject">Subject</Label>
                  <Input id="subject" placeholder="What's this about?" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="message">Message</Label>
                  <Textarea id="message" placeholder="Tell us about your project..." rows={5} required />
                </div>
                <Button type="submit" className="w-full">Send Message</Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
