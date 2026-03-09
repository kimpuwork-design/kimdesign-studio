import { PublicNav } from "@/components/PublicNav";
import { PublicFooter } from "@/components/PublicFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { Mail, Phone, MapPin, ArrowRight, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import { useSiteContent } from "@/hooks/useSiteContent";
import { useSEO } from "@/hooks/useSEO";
import { FloatingChatButton } from "@/components/FloatingChatButton";
import { useTranslation } from "@/i18n/LanguageContext";
import { FadeUp, SlideIn, FadeIn, TextReveal } from "@/components/motion/MotionWrappers";
import { MagneticButton } from "@/components/MagneticButton";
import { motion } from "framer-motion";

const luxuryEase = [0.22, 1, 0.36, 1] as const;

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
    <div className="bg-background relative overflow-x-hidden">
      <PublicNav />

      {/* ── Hero ── */}
      <section className="container py-20 md:py-32 lg:py-40 relative z-10">
        <div className="max-w-4xl">
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: luxuryEase }}
            className="text-[10px] tracking-[0.35em] uppercase text-primary mb-8"
          >
            {t("contact_title")}
          </motion.p>
          <TextReveal>
            <h1 className="font-display text-[clamp(2.5rem,7vw,7rem)] leading-[0.95] text-foreground">
              {t("contact_lets_start")}
              <br />
              <span className="text-primary">{t("contact_conversation")}</span>
            </h1>
          </TextReveal>
          <FadeUp delay={0.3}>
            <p className="mt-8 text-lg text-muted-foreground font-light leading-relaxed max-w-lg">
              {info.hero_description ?? "We welcome enquiries from private clients, developers, institutions, and fellow collaborators."}
            </p>
          </FadeUp>
        </div>
      </section>

      {/* ── Contact content ── */}
      <section className="border-t border-border/30 relative z-10">
        <div className="container py-24 md:py-36 grid gap-16 md:gap-24 grid-cols-1 md:grid-cols-[1fr_2fr]">
          {/* Info sidebar */}
          <SlideIn direction="left">
            <div className="space-y-10">
              <div>
                <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground/60 mb-6">{t("contact_studio_label")}</p>
                <div className="space-y-6">
                  {contactDetails.map((c) => {
                    const Icon = c.icon;
                    return (
                      <div key={c.label} className="flex items-start gap-4">
                        <Icon size={16} className="text-primary shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-0.5">{c.label}</p>
                          <p className="text-sm text-foreground">{c.value}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              {(info.hours || info.hours_note) && (
                <div className="border-t border-border/30 pt-8">
                  <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground/60 mb-3">{t("contact_hours")}</p>
                  {info.hours && <p className="text-sm text-muted-foreground">{info.hours}</p>}
                  {info.hours_note && <p className="text-sm text-muted-foreground mt-1">{info.hours_note}</p>}
                </div>
              )}
            </div>
          </SlideIn>

          {/* Form */}
          <SlideIn direction="right" delay={0.1}>
            <div>
              {submitted ? (
                <FadeIn>
                  <div className="border border-border/30 p-12 md:p-16 text-center">
                    <CheckCircle2 size={32} className="text-primary mx-auto mb-6" />
                    <h3 className="font-display text-3xl text-foreground">{t("contact_thank_you")}</h3>
                    <p className="mt-3 text-muted-foreground text-sm font-light">{t("contact_in_touch")}</p>
                    <Button
                      variant="outline" className="mt-8 rounded-none tracking-[0.12em] text-xs uppercase px-8 h-11 border-foreground/20 hover:bg-foreground hover:text-background transition-all duration-500"
                      onClick={() => { setSubmitted(false); setForm({ name: "", email: "", phone: "", message: "", projectType: "" }); }}
                    >
                      {t("contact_send_another")}
                    </Button>
                  </div>
                </FadeIn>
              ) : (
                <form onSubmit={handleSubmit} className="border border-border/30 p-6 md:p-10 space-y-6" noValidate>
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground">{t("contact_full_name")}</Label>
                      <Input id="name" placeholder="Your name" value={form.name} onChange={(e) => set("name", e.target.value)}
                        className="rounded-none border-border/40 bg-transparent focus:border-primary/40 h-11" />
                      {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground">{t("contact_email")}</Label>
                      <Input id="email" type="email" placeholder="you@example.com" value={form.email} onChange={(e) => set("email", e.target.value)}
                        className="rounded-none border-border/40 bg-transparent focus:border-primary/40 h-11" />
                      {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                    </div>
                  </div>
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground">{t("contact_phone")} <span className="normal-case text-muted-foreground/50">{t("contact_phone_optional")}</span></Label>
                      <Input id="phone" placeholder="+95 000 000 0000" value={form.phone} onChange={(e) => set("phone", e.target.value)}
                        className="rounded-none border-border/40 bg-transparent focus:border-primary/40 h-11" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground">{t("contact_project_type")}</Label>
                      <select
                        value={form.projectType} onChange={(e) => set("projectType", e.target.value)}
                        className="w-full border border-border/40 bg-transparent px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/40 h-11"
                      >
                        <option value="">{t("contact_select_type")}</option>
                        {projectTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground">{t("contact_tell_us")}</Label>
                    <Textarea id="message" placeholder="Describe your project…" rows={7} value={form.message}
                      onChange={(e) => set("message", e.target.value)} className="rounded-none resize-none border-border/40 bg-transparent focus:border-primary/40" />
                    {errors.message && <p className="text-xs text-destructive">{errors.message}</p>}
                  </div>
                  {serverError && <p className="bg-destructive/10 px-4 py-3 text-sm text-destructive">{serverError}</p>}
                  <Button type="submit" className="rounded-none px-10 h-12 tracking-[0.15em] text-sm uppercase" disabled={submitting}>
                    {submitting ? t("contact_sending") : t("contact_submit")}
                    {!submitting && <ArrowRight size={14} className="ml-3" />}
                  </Button>
                </form>
              )}
            </div>
          </SlideIn>
        </div>
      </section>

      <PublicFooter />
      <FloatingChatButton />
    </div>
  );
}
