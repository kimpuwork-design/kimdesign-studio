import { PublicNav } from "@/components/PublicNav";
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

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
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
    const { error } = await supabase.from("leads").insert([{
      name: result.data.name,
      email: result.data.email,
      phone: result.data.phone || null,
      message: result.data.message,
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
      <div className="container py-16">
        <h1 className="font-display text-5xl font-bold mb-2">Contact</h1>
        <p className="text-muted-foreground mb-12">Let's start a conversation</p>

        <div className="grid gap-12 md:grid-cols-2">
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

          <div className="rounded-xl border border-border bg-card p-6">
            {submitted ? (
              <div className="py-12 text-center">
                <p className="text-4xl mb-4">🙌</p>
                <h3 className="font-display text-xl font-bold">Message received!</h3>
                <p className="mt-2 text-muted-foreground">We'll be in touch within 24 hours.</p>
                <Button variant="outline" className="mt-6" onClick={() => { setSubmitted(false); setForm({ name: "", email: "", phone: "", message: "" }); }}>
                  Send another
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Name *</Label>
                    <Input id="name" placeholder="Your name" value={form.name} onChange={(e) => set("name", e.target.value)} />
                    {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email *</Label>
                    <Input id="email" type="email" placeholder="your@email.com" value={form.email} onChange={(e) => set("email", e.target.value)} />
                    {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Phone <span className="text-muted-foreground text-xs">(optional)</span></Label>
                  <Input id="phone" placeholder="+1 (555) 000-0000" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="message">Message *</Label>
                  <Textarea id="message" placeholder="Tell us about your project… (min. 20 characters)" rows={5} value={form.message} onChange={(e) => set("message", e.target.value)} />
                  {errors.message && <p className="text-xs text-destructive">{errors.message}</p>}
                </div>
                {serverError && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{serverError}</p>}
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? "Sending…" : "Send Message"}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
