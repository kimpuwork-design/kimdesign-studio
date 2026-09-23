import { PublicNav } from "@/components/PublicNav";
import { PublicFooter } from "@/components/PublicFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState, useRef } from "react";
import { Mail, Phone, MapPin, ArrowRight, CheckCircle2, Clock, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import { useSiteContent } from "@/hooks/useSiteContent";
import { useSEO } from "@/hooks/useSEO";

import { useTranslation } from "@/i18n/LanguageContext";
import { FadeUp, SlideIn, FadeIn, LineDraw } from "@/components/motion/MotionWrappers";
import { SectionLabel } from "@/components/SectionLabel";
import { motion } from "framer-motion";

const contactSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().trim().email("Please enter a valid email address").max(255),
  phone: z.string().trim().max(30).optional(),
  message: z.string().trim().min(20, "Message must be at least 20 characters").max(2000),
});

export default function Contact() {
  const { content } = useSiteContent("contact_info");
  const { t } = useTranslation();
  useSEO({ title: t("seo_contact_title"), description: t("seo_contact_description") });

  const info = content.contact_info ?? {};
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

  const lastSubmitRef = useRef<number>(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    const now = Date.now();
    if (now - lastSubmitRef.current < 30_000) { setServerError("Please wait before submitting again."); return; }
    const result = contactSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => { fieldErrors[err.path[0] as string] = err.message; });
      setErrors(fieldErrors);
      return;
    }
    lastSubmitRef.current = now;
    setSubmitting(true);
    const messageWithType = form.projectType ? `[Project Type: ${form.projectType}]\n\n${result.data.message}` : result.data.message;
    const { error } = await supabase.from("leads").insert([{
      name: result.data.name, email: result.data.email, phone: result.data.phone || null, message: messageWithType,
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
      <section className="container pt-16 md:pt-28 pb-8 md:pb-14">
        <div className="max-w-3xl">
          <div className="h-px w-12 bg-primary mb-8" />
          <SectionLabel text={t("contact_title")} />
          <h1 className="font-display text-[clamp(2.1rem,6.5vw,5.5rem)] leading-[0.95] text-foreground">
            {t("contact_lets_start") || "Let's start a"}
            <span className="block text-primary">{t("contact_conversation") || "conversation."}</span>
          </h1>
          <FadeUp delay={0.15}>
            <p className="mt-8 text-base md:text-lg text-muted-foreground font-light leading-[1.85] max-w-lg">
              {info.hero_description ?? "We welcome enquiries from private clients, developers, institutions, and fellow collaborators."}
            </p>
          </FadeUp>
        </div>
      </section>


      {/* ── Contact Content ── */}
      <section className="border-t border-border/30 relative z-10">
        <div className="container py-24 md:py-36 grid gap-16 md:gap-24 grid-cols-1 md:grid-cols-[1fr_2fr]">
          {/* Info sidebar */}
          <SlideIn direction="left">
            <div className="space-y-10">
              <div>
                <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground/60 mb-6 font-mono-label">{t("contact_studio_label")}</p>
                <div className="space-y-6">
                  {contactDetails.map((c) => {
                    const Icon = c.icon;
                    return (
                      <motion.div
                        key={c.label}
                        className="flex items-start gap-4 group cursor-default"
                        whileHover={{ x: 4 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="h-8 w-8 border border-border/30 flex items-center justify-center shrink-0 group-hover:border-primary/30 group-hover:bg-primary/5 transition-all duration-300">
                          <Icon size={14} className="text-primary" />
                        </div>
                        <div>
                          <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-0.5 font-mono-label">{c.label}</p>
                          <p className="text-sm text-foreground">{c.value}</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
              {(info.hours || info.hours_note) && (
                <div className="border-t border-border/30 pt-8">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock size={12} className="text-primary/60" />
                    <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground/60 font-mono-label">{t("contact_hours")}</p>
                  </div>
                  {info.hours && <p className="text-sm text-muted-foreground">{info.hours}</p>}
                  {info.hours_note && <p className="text-sm text-muted-foreground mt-1">{info.hours_note}</p>}
                </div>
              )}
              <div className="border-t border-border/30 pt-8">
                <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground/60 mb-3 font-mono-label">Response time</p>
                <p className="text-sm text-muted-foreground">We typically respond within 24–48 hours.</p>
              </div>
            </div>
          </SlideIn>

          {/* Form */}
          <SlideIn direction="right" delay={0.1}>
            <div>
              {submitted ? (
                <FadeIn>
                  <div className="border border-border/30 p-12 md:p-16 text-center bg-card/30" role="status" aria-live="polite">
                    <motion.div initial={{ scale: 0, rotate: -10 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 200, damping: 15 }}>
                      <CheckCircle2 size={40} className="text-primary mx-auto mb-6" aria-hidden="true" />
                    </motion.div>
                    <h3 className="font-display text-3xl text-foreground">{t("contact_thank_you")}</h3>
                    <p className="mt-3 text-muted-foreground text-sm font-light leading-[1.8]">{t("contact_in_touch")}</p>
                    <Button variant="outline"
                      className="mt-8 rounded-none tracking-[0.12em] text-xs uppercase px-8 h-11 border-foreground/20 hover:bg-foreground hover:text-background transition-colors"
                      onClick={() => { setSubmitted(false); setForm({ name: "", email: "", phone: "", message: "", projectType: "" }); }}>
                      {t("contact_send_another")}
                    </Button>
                  </div>
                </FadeIn>
              ) : (
                <form onSubmit={handleSubmit} className="border border-border/30 p-6 md:p-10 space-y-6 bg-card/20" noValidate aria-describedby={serverError ? "contact-form-error" : undefined}>
                  <div className="flex items-center gap-3 mb-2">
                    <Send size={14} className="text-primary/40" aria-hidden="true" />
                    <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground/50 font-mono-label">Send us a message</p>
                  </div>
                  <LineDraw className="h-px w-full bg-border/30 mb-4" />

                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2 group/field">
                      <Label htmlFor="name" className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground group-focus-within/field:text-primary transition-colors duration-300">{t("contact_full_name")}</Label>
                      <div className="relative">
                        <Input id="name" placeholder="Your name" value={form.name} onChange={(e) => set("name", e.target.value)}
                          required autoComplete="name"
                          aria-invalid={!!errors.name}
                          aria-describedby={errors.name ? "name-error" : undefined}
                          className="rounded-none border-border/40 bg-transparent focus:border-transparent h-11 peer" />
                        <div className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-primary scale-x-0 peer-focus:scale-x-100 transition-transform duration-500 origin-left" aria-hidden="true" />
                      </div>
                      {errors.name && <motion.p id="name-error" role="alert" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-destructive">{errors.name}</motion.p>}
                    </div>
                    <div className="space-y-2 group/field">
                      <Label htmlFor="email" className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground group-focus-within/field:text-primary transition-colors duration-300">{t("contact_email")}</Label>
                      <div className="relative">
                        <Input id="email" type="email" placeholder="you@example.com" value={form.email} onChange={(e) => set("email", e.target.value)}
                          required autoComplete="email"
                          aria-invalid={!!errors.email}
                          aria-describedby={errors.email ? "email-error" : undefined}
                          className="rounded-none border-border/40 bg-transparent focus:border-transparent h-11 peer" />
                        <div className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-primary scale-x-0 peer-focus:scale-x-100 transition-transform duration-500 origin-left" aria-hidden="true" />
                      </div>
                      {errors.email && <motion.p id="email-error" role="alert" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-destructive">{errors.email}</motion.p>}
                    </div>
                  </div>
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2 group/field">
                      <Label htmlFor="phone" className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground group-focus-within/field:text-primary transition-colors duration-300">{t("contact_phone")} <span className="normal-case text-muted-foreground/50">{t("contact_phone_optional")}</span></Label>
                      <div className="relative">
                        <Input id="phone" type="tel" placeholder="+95 000 000 0000" value={form.phone} onChange={(e) => set("phone", e.target.value)}
                          autoComplete="tel"
                          className="rounded-none border-border/40 bg-transparent focus:border-transparent h-11 peer" />
                        <div className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-primary scale-x-0 peer-focus:scale-x-100 transition-transform duration-500 origin-left" aria-hidden="true" />
                      </div>
                    </div>
                    <div className="space-y-2 group/field">
                      <Label htmlFor="projectType" className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground group-focus-within/field:text-primary transition-colors duration-300">{t("contact_project_type")}</Label>
                      <div className="relative">
                        <select id="projectType" value={form.projectType} onChange={(e) => set("projectType", e.target.value)}
                          className="w-full border border-border/40 bg-transparent px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-transparent h-11 peer">
                          <option value="">{t("contact_select_type")}</option>
                          {projectTypes.map((pt) => <option key={pt} value={pt}>{pt}</option>)}
                        </select>
                        <div className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-primary scale-x-0 peer-focus:scale-x-100 transition-transform duration-500 origin-left" aria-hidden="true" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2 group/field">
                    <Label htmlFor="message" className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground group-focus-within/field:text-primary transition-colors duration-300">{t("contact_tell_us")}</Label>
                    <div className="relative">
                      <Textarea id="message" placeholder="Describe your project…" rows={7} value={form.message}
                        required
                        aria-invalid={!!errors.message}
                        aria-describedby={errors.message ? "message-error" : undefined}
                        onChange={(e) => set("message", e.target.value)} className="rounded-none resize-none border-border/40 bg-transparent focus:border-transparent peer" />
                      <div className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-primary scale-x-0 peer-focus:scale-x-100 transition-transform duration-500 origin-left" aria-hidden="true" />
                    </div>
                    {errors.message && <motion.p id="message-error" role="alert" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-destructive">{errors.message}</motion.p>}
                  </div>
                  {serverError && <motion.p id="contact-form-error" role="alert" aria-live="assertive" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-destructive/10 px-4 py-3 text-sm text-destructive">{serverError}</motion.p>}
                  <div className="flex items-center justify-between pt-2">
                    <p className="text-[10px] text-muted-foreground/40 font-mono-label hidden sm:block">All fields except phone are required</p>
                    <Button type="submit" className="rounded-none px-10 h-12 tracking-[0.15em] text-sm uppercase" disabled={submitting}>
                      {submitting ? t("contact_sending") : t("contact_submit")}
                      {!submitting && <ArrowRight size={14} className="ml-3" aria-hidden="true" />}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </SlideIn>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
