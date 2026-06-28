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
import { MagneticButton } from "@/components/MagneticButton";
import { SectionLabel } from "@/components/SectionLabel";
import { motion, useScroll, useTransform } from "framer-motion";

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

  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.5], [0, 60]);
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.97]);

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

      {/* ── Cinematic Hero ── */}
      <div ref={heroRef} className="relative overflow-hidden min-h-[54vh] flex items-center pt-20">
        <div className="absolute inset-0 pointer-events-none overflow-hidden hidden md:block">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8, duration: 1 }}>
            <motion.div animate={{ y: [0, -18, 0], rotate: [0, 4, 0] }} transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-[10%] right-[8%] w-[220px] h-[220px] border border-primary/[0.05]" />
            <motion.div animate={{ y: [0, 14, 0], rotate: [12, 18, 12] }} transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-[25%] right-[12%] w-[160px] h-[160px] border border-primary/[0.04] rotate-12" />
            <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
              className="absolute bottom-[20%] left-[5%] w-[80px] h-[80px] border border-primary/[0.04] rounded-full" />
            <motion.div animate={{ scaleY: [0.4, 1, 0.4] }} transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
              className="absolute bottom-[10%] left-[6%] w-px h-[140px] bg-gradient-to-b from-transparent via-primary/[0.06] to-transparent"
              style={{ transformOrigin: "bottom" }} />
          </motion.div>
        </div>
        <div className="absolute inset-0 noise-overlay pointer-events-none z-[1]" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-[2] pointer-events-none" />

        <motion.div style={{ opacity: heroOpacity, y: heroY, scale: heroScale }} className="relative z-10 w-full">
          <div className="container py-10 md:py-14">
            <div className="max-w-4xl">
              <motion.div initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: "3rem" }} transition={{ duration: 0.8, delay: 0.1, ease: luxuryEase }}
                className="h-px bg-primary mb-8" />
              <SectionLabel text={t("contact_title")} />
              <h1 className="font-display text-[clamp(2.8rem,7.5vw,7.5rem)] leading-[0.92] text-foreground">
                {(t("contact_lets_start") || "Let's start a").split(" ").map((word: string, i: number) => (
                  <motion.span key={i} initial={{ opacity: 0, y: 55, rotateX: -15 }} animate={{ opacity: 1, y: 0, rotateX: 0 }}
                    transition={{ duration: 0.8, delay: 0.3 + i * 0.08, ease: luxuryEase }}
                    className="inline-block mr-[0.25em]">{word}</motion.span>
                ))}
                <br />
                <span className="text-primary hero-shimmer-text">
                  {(t("contact_conversation") || "conversation.").split(" ").map((word: string, i: number) => (
                    <motion.span key={`l2-${i}`} initial={{ opacity: 0, y: 55, rotateX: -15 }} animate={{ opacity: 1, y: 0, rotateX: 0 }}
                      transition={{ duration: 0.8, delay: 0.55 + i * 0.08, ease: luxuryEase }}
                      className="inline-block mr-[0.25em]">{word}</motion.span>
                  ))}
                </span>
              </h1>
              <FadeUp delay={0.3}>
                <p className="mt-8 text-base md:text-lg text-muted-foreground font-light leading-[1.85] max-w-lg">
                  {info.hero_description ?? "We welcome enquiries from private clients, developers, institutions, and fellow collaborators."}
                </p>
              </FadeUp>
            </div>
          </div>
        </motion.div>
      </div>


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
                  <div className="border border-border/30 p-12 md:p-16 text-center bg-card/30">
                    <motion.div initial={{ scale: 0, rotate: -10 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 200, damping: 15 }}>
                      <CheckCircle2 size={40} className="text-primary mx-auto mb-6" />
                    </motion.div>
                    <h3 className="font-display text-3xl text-foreground">{t("contact_thank_you")}</h3>
                    <p className="mt-3 text-muted-foreground text-sm font-light leading-[1.8]">{t("contact_in_touch")}</p>
                    <MagneticButton strength={0.2}>
                      <Button variant="outline"
                        className="mt-8 rounded-none tracking-[0.12em] text-xs uppercase px-8 h-11 border-foreground/20 hover:bg-foreground hover:text-background transition-all duration-500"
                        onClick={() => { setSubmitted(false); setForm({ name: "", email: "", phone: "", message: "", projectType: "" }); }}>
                        {t("contact_send_another")}
                      </Button>
                    </MagneticButton>
                  </div>
                </FadeIn>
              ) : (
                <form onSubmit={handleSubmit} className="border border-border/30 p-6 md:p-10 space-y-6 bg-card/20" noValidate>
                  <div className="flex items-center gap-3 mb-2">
                    <Send size={14} className="text-primary/40" />
                    <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground/50 font-mono-label">Send us a message</p>
                  </div>
                  <LineDraw className="h-px w-full bg-border/30 mb-4" />

                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2 group/field">
                      <Label htmlFor="name" className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground group-focus-within/field:text-primary transition-colors duration-300">{t("contact_full_name")}</Label>
                      <div className="relative">
                        <Input id="name" placeholder="Your name" value={form.name} onChange={(e) => set("name", e.target.value)}
                          className="rounded-none border-border/40 bg-transparent focus:border-transparent h-11 peer" />
                        <div className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-primary scale-x-0 peer-focus:scale-x-100 transition-transform duration-500 origin-left" />
                      </div>
                      {errors.name && <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-destructive">{errors.name}</motion.p>}
                    </div>
                    <div className="space-y-2 group/field">
                      <Label htmlFor="email" className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground group-focus-within/field:text-primary transition-colors duration-300">{t("contact_email")}</Label>
                      <div className="relative">
                        <Input id="email" type="email" placeholder="you@example.com" value={form.email} onChange={(e) => set("email", e.target.value)}
                          className="rounded-none border-border/40 bg-transparent focus:border-transparent h-11 peer" />
                        <div className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-primary scale-x-0 peer-focus:scale-x-100 transition-transform duration-500 origin-left" />
                      </div>
                      {errors.email && <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-destructive">{errors.email}</motion.p>}
                    </div>
                  </div>
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2 group/field">
                      <Label htmlFor="phone" className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground group-focus-within/field:text-primary transition-colors duration-300">{t("contact_phone")} <span className="normal-case text-muted-foreground/50">{t("contact_phone_optional")}</span></Label>
                      <div className="relative">
                        <Input id="phone" placeholder="+95 000 000 0000" value={form.phone} onChange={(e) => set("phone", e.target.value)}
                          className="rounded-none border-border/40 bg-transparent focus:border-transparent h-11 peer" />
                        <div className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-primary scale-x-0 peer-focus:scale-x-100 transition-transform duration-500 origin-left" />
                      </div>
                    </div>
                    <div className="space-y-2 group/field">
                      <Label className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground group-focus-within/field:text-primary transition-colors duration-300">{t("contact_project_type")}</Label>
                      <div className="relative">
                        <select value={form.projectType} onChange={(e) => set("projectType", e.target.value)}
                          className="w-full border border-border/40 bg-transparent px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-transparent h-11 peer">
                          <option value="">{t("contact_select_type")}</option>
                          {projectTypes.map((pt) => <option key={pt} value={pt}>{pt}</option>)}
                        </select>
                        <div className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-primary scale-x-0 peer-focus:scale-x-100 transition-transform duration-500 origin-left" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2 group/field">
                    <Label htmlFor="message" className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground group-focus-within/field:text-primary transition-colors duration-300">{t("contact_tell_us")}</Label>
                    <div className="relative">
                      <Textarea id="message" placeholder="Describe your project…" rows={7} value={form.message}
                        onChange={(e) => set("message", e.target.value)} className="rounded-none resize-none border-border/40 bg-transparent focus:border-transparent peer" />
                      <div className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-primary scale-x-0 peer-focus:scale-x-100 transition-transform duration-500 origin-left" />
                    </div>
                    {errors.message && <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-destructive">{errors.message}</motion.p>}
                  </div>
                  {serverError && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-destructive/10 px-4 py-3 text-sm text-destructive">{serverError}</motion.p>}
                  <div className="flex items-center justify-between pt-2">
                    <p className="text-[10px] text-muted-foreground/40 font-mono-label hidden sm:block">All fields except phone are required</p>
                    <MagneticButton strength={0.2}>
                      <Button type="submit" className="rounded-none px-10 h-12 tracking-[0.15em] text-sm uppercase" disabled={submitting}>
                        {submitting ? t("contact_sending") : t("contact_submit")}
                        {!submitting && <ArrowRight size={14} className="ml-3" />}
                      </Button>
                    </MagneticButton>
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
