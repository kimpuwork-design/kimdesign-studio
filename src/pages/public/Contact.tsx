import { PublicNav } from "@/components/PublicNav";
import { PublicFooter } from "@/components/PublicFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { Mail, Phone, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().trim().email("Please enter a valid email address").max(255),
  phone: z.string().trim().max(30).optional(),
  message: z.string().trim().min(20, "Message must be at least 20 characters").max(2000),
});

const PROJECT_TYPES = ["New Build", "Renovation", "Interior Architecture", "Landscape", "Planning Advice", "Other"];

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "", projectType: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const set = (field: string, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    const result = contactSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as string;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    const messageWithType = form.projectType
      ? `[Project Type: ${form.projectType}]\n\n${result.data.message}`
      : result.data.message;

    const { error } = await supabase.from("leads").insert([{
      name: result.data.name,
      email: result.data.email,
      phone: result.data.phone || null,
      message: messageWithType,
    }]);

    setSubmitting(false);
    if (error) {
      setServerError("Something went wrong. Please try again.");
      return;
    }
    setSubmitted(true);
  };

  return (
    <div className="bg-background">
      <PublicNav />

      {/* Hero */}
      <section className="container py-20 md:py-28">
        <div className="max-w-2xl">
          <p className="text-xs font-medium tracking-[0.25em] uppercase text-primary mb-4">Contact</p>
          <h1 className="font-display text-[clamp(2.5rem,6vw,5.5rem)] font-light leading-tight text-foreground">
            Let's start a<br /><em className="not-italic font-semibold">conversation.</em>
          </h1>
          <p className="mt-6 text-muted-foreground font-light leading-relaxed">
            We welcome enquiries from private clients, developers, institutions, and fellow collaborators. All projects, large or small, begin with a conversation.
          </p>
        </div>
      </section>

      <section className="border-t border-border">
        <div className="container py-16 grid gap-16 md:grid-cols-[1fr_2fr]">

          {/* Info */}
          <div className="space-y-8">
            <div>
              <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-4">Studio</p>
              <div className="space-y-5">
                {[
                  { icon: MapPin, label: "London (HQ)", value: "12 Clifton Gardens, London W9 1DT" },
                  { icon: MapPin, label: "Copenhagen", value: "Nørre Voldgade 80, 1358 Copenhagen" },
                  { icon: Mail, label: "Email", value: "studio@forma.com" },
                  { icon: Phone, label: "Phone", value: "+44 20 7946 0123" },
                ].map((c) => {
                  const Icon = c.icon;
                  return (
                    <div key={c.label} className="flex items-start gap-3">
                      <Icon size={15} className="text-primary mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground tracking-wide">{c.label}</p>
                        <p className="text-sm text-foreground mt-0.5">{c.value}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="border-t border-border pt-8">
              <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-3">Hours</p>
              <p className="text-sm text-muted-foreground">Monday – Friday, 9:00 – 18:00</p>
              <p className="text-sm text-muted-foreground">We respond to all enquiries within two working days.</p>
            </div>
          </div>

          {/* Form */}
          <div>
            {submitted ? (
              <div className="border border-border p-12 text-center">
                <div className="text-3xl mb-5">✦</div>
                <h3 className="font-display text-2xl font-light text-foreground">Thank you for reaching out.</h3>
                <p className="mt-3 text-muted-foreground text-sm">We'll be in touch within two working days.</p>
                <Button
                  variant="outline"
                  className="mt-8 rounded-none tracking-wide"
                  onClick={() => { setSubmitted(false); setForm({ name: "", email: "", phone: "", message: "", projectType: "" }); }}
                >
                  Send Another Enquiry
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-xs tracking-wide uppercase text-muted-foreground">Full Name *</Label>
                    <Input id="name" placeholder="Your name" value={form.name} onChange={(e) => set("name", e.target.value)} className="rounded-none" />
                    {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-xs tracking-wide uppercase text-muted-foreground">Email *</Label>
                    <Input id="email" type="email" placeholder="you@example.com" value={form.email} onChange={(e) => set("email", e.target.value)} className="rounded-none" />
                    {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                  </div>
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="phone" className="text-xs tracking-wide uppercase text-muted-foreground">Phone <span className="normal-case text-muted-foreground">(optional)</span></Label>
                    <Input id="phone" placeholder="+44 000 0000 000" value={form.phone} onChange={(e) => set("phone", e.target.value)} className="rounded-none" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs tracking-wide uppercase text-muted-foreground">Project Type</Label>
                    <select
                      value={form.projectType}
                      onChange={(e) => set("projectType", e.target.value)}
                      className="w-full rounded-none border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                      <option value="">Select a type…</option>
                      {PROJECT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="message" className="text-xs tracking-wide uppercase text-muted-foreground">Tell us about your project *</Label>
                  <Textarea
                    id="message"
                    placeholder="Describe your project, site, timeline, and any other relevant context…"
                    rows={7}
                    value={form.message}
                    onChange={(e) => set("message", e.target.value)}
                    className="rounded-none resize-none"
                  />
                  {errors.message && <p className="text-xs text-destructive">{errors.message}</p>}
                </div>
                {serverError && <p className="rounded-none bg-destructive/10 px-3 py-2 text-sm text-destructive">{serverError}</p>}
                <Button type="submit" className="rounded-none px-10 tracking-wide w-full sm:w-auto" disabled={submitting}>
                  {submitting ? "Sending…" : "Submit Enquiry"}
                </Button>
              </form>
            )}
          </div>
        </div>
      </section>
      <PublicFooter />
    </div>
  );
}
