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
import { useSiteContent } from "@/hooks/useSiteContent";
import { useSEO } from "@/hooks/useSEO";
import { FloatingChatButton } from "@/components/FloatingChatButton";
import { useTranslation } from "@/i18n/LanguageContext";

const contactSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().trim().email("Please enter a valid email address").max(255),
  phone: z.string().trim().max(30).optional(),
  message: z.string().trim().min(20, "Message must be at least 20 characters").max(2000),
});

export default function Contact() {
  useSEO({ title: "Contact", description: "Get in touch with KIM DESIGN STUDIO for architecture and design projects" });
  const { content } = useSiteContent("contact_info");
  const info = content.contact_info ?? {};
  const { t } = useTranslation();

  const locations: any[] = info.locations ?? [];
  const projectTypes: string[] = info.project_types ?? [];

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
    if (error) { setServerError("Something went wrong. Please try again."); return; }
    setSubmitted(true);
  };

  const contactDetails: { icon: any; label: string; value: string }[] = [
    ...locations.map((l: any) => ({ icon: MapPin, label: l.label, value: l.value })),
    ...(info.email ? [{ icon: Mail, label: "Email", value: info.email }] : []),
    ...(info.phone ? [{ icon: Phone, label: "Phone", value: info.phone }] : []),
  ];

  return (
    <div className="bg-background relative">
      <PublicNav />

      {/* Ambient orbs */}
      <div className="fixed top-1/3 -left-40 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[150px] pointer-events-none" />
      <div className="fixed bottom-1/4 -right-40 w-[400px] h-[400px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

      {/* Hero */}
      <section className="container py-20 md:py-28 relative z-10">
        <div className="max-w-2xl">
          <p className="text-xs font-medium tracking-[0.25em] uppercase text-primary mb-4">{t("contact_title")}</p>
          <h1 className="font-display text-[clamp(2.5rem,6vw,5.5rem)] font-light leading-tight text-foreground">
            {t("contact_lets_start")}<br /><em className="not-italic font-semibold">{t("contact_conversation")}</em>
          </h1>
          <p className="mt-6 text-muted-foreground font-light leading-relaxed">
            {info.hero_description ?? "We welcome enquiries from private clients, developers, institutions, and fellow collaborators."}
          </p>
        </div>
      </section>

      <section className="border-t border-border/50 relative z-10">
        <div className="container py-16 grid gap-16 md:grid-cols-[1fr_2fr]">
          {/* Info */}
          <div className="space-y-8">
            <div>
              <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-4">{t("contact_studio_label")}</p>
              <div className="space-y-5">
                {contactDetails.map((c) => {
                  const Icon = c.icon;
                  return (
                    <div key={c.label} className="flex items-start gap-3">
                      <div className="rounded-lg bg-primary/10 p-1.5 mt-0.5">
                        <Icon size={15} className="text-primary shrink-0" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground tracking-wide">{c.label}</p>
                        <p className="text-sm text-foreground mt-0.5">{c.value}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            {(info.hours || info.hours_note) && (
              <div className="border-t border-border/50 pt-8">
                <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-3">{t("contact_hours")}</p>
                {info.hours && <p className="text-sm text-muted-foreground">{info.hours}</p>}
                {info.hours_note && <p className="text-sm text-muted-foreground">{info.hours_note}</p>}
              </div>
            )}
          </div>

          {/* Form */}
          <div>
            {submitted ? (
              <div className="glass-form p-12 text-center">
                <div className="text-3xl mb-5">✦</div>
                <h3 className="font-display text-2xl font-light text-foreground">{t("contact_thank_you")}</h3>
                <p className="mt-3 text-muted-foreground text-sm">{t("contact_in_touch")}</p>
                <Button
                  variant="outline" className="mt-8 rounded-2xl tracking-wide"
                  onClick={() => { setSubmitted(false); setForm({ name: "", email: "", phone: "", message: "", projectType: "" }); }}
                >
                  {t("contact_send_another")}
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="glass-form p-8 space-y-6" noValidate>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-xs tracking-wide uppercase text-muted-foreground">{t("contact_full_name")}</Label>
                    <Input id="name" placeholder="Your name" value={form.name} onChange={(e) => set("name", e.target.value)} className="rounded-xl" />
                    {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-xs tracking-wide uppercase text-muted-foreground">{t("contact_email")}</Label>
                    <Input id="email" type="email" placeholder="you@example.com" value={form.email} onChange={(e) => set("email", e.target.value)} className="rounded-xl" />
                    {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                  </div>
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="phone" className="text-xs tracking-wide uppercase text-muted-foreground">{t("contact_phone")} <span className="normal-case text-muted-foreground">{t("contact_phone_optional")}</span></Label>
                    <Input id="phone" placeholder="+44 000 0000 000" value={form.phone} onChange={(e) => set("phone", e.target.value)} className="rounded-xl" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs tracking-wide uppercase text-muted-foreground">{t("contact_project_type")}</Label>
                    <select
                      value={form.projectType} onChange={(e) => set("projectType", e.target.value)}
                      className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">{t("contact_select_type")}</option>
                      {projectTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="message" className="text-xs tracking-wide uppercase text-muted-foreground">{t("contact_tell_us")}</Label>
                  <Textarea id="message" placeholder="Describe your project…" rows={7} value={form.message}
                    onChange={(e) => set("message", e.target.value)} className="rounded-xl resize-none" />
                  {errors.message && <p className="text-xs text-destructive">{errors.message}</p>}
                </div>
                {serverError && <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">{serverError}</p>}
                <Button type="submit" className="rounded-2xl px-10 tracking-wide w-full sm:w-auto" disabled={submitting}>
                  {submitting ? t("contact_sending") : t("contact_submit")}
                </Button>
              </form>
            )}
          </div>
        </div>
      </section>
      <PublicFooter />
      <FloatingChatButton />
    </div>
  );
}
