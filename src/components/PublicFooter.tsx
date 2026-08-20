import { Link } from "react-router-dom";
import { Mail, Instagram, Phone, MapPin, ArrowRight, ArrowUpRight } from "lucide-react";
import { useSettings } from "@/hooks/useSettings";
import { KMonogramLogo } from "@/components/KMonogramLogo";
import { useTranslation } from "@/i18n/LanguageContext";
import { motion, useScroll, useTransform } from "framer-motion";
import { FadeUp, TextReveal } from "@/components/motion/MotionWrappers";
import { MagneticButton } from "@/components/MagneticButton";
import { useRef, useCallback } from "react";

const NAV_KEYS = [
  { key: "nav_projects", href: "/portfolio" },
  { key: "nav_services", href: "/services" },
  { key: "nav_studio", href: "/about" },
  { key: "nav_contact", href: "/contact" },
];

const ease = [0.22, 1, 0.36, 1] as [number, number, number, number];

function FooterCTA({ t }: { t: (k: string) => string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "center center"]
  });
  const textScale = useTransform(scrollYProgress, [0, 0.5, 1], [0.85, 0.95, 1]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.3], [0, 1]);

  return (
    <section ref={ref} className="relative overflow-hidden min-h-[60vh] flex items-center justify-center">
      <div className="absolute inset-0 bg-foreground/[0.015]" />
      
      <motion.div style={{ scale: textScale, opacity: textOpacity }} className="container py-24 md:py-40 relative z-10">
        <TextReveal>
          <p className="text-[9px] tracking-[0.4em] uppercase text-primary mb-5 md:mb-7 text-center font-mono-label">
            {t("footer_cta_title") !== "footer_cta_title" ? t("footer_cta_title") : "Start a conversation"}
          </p>
        </TextReveal>
        <TextReveal delay={0.1}>
          <h2 className="font-display text-[clamp(2.5rem,9vw,8rem)] leading-[0.9] text-foreground text-center">
            Let's build
          </h2>
        </TextReveal>
        <TextReveal delay={0.2}>
          <h2 className="font-display text-[clamp(2.5rem,9vw,8rem)] leading-[0.9] text-center hero-shimmer-text inline-block w-full">
            together.
          </h2>
        </TextReveal>
        <FadeUp delay={0.4}>
          <div className="flex justify-center mt-10 md:mt-14">
            <MagneticButton strength={0.2}>
              <Link to="/contact"
                className="group inline-flex items-center gap-3 border border-foreground/15 px-10 md:px-14 py-4 md:py-5 text-[11px] tracking-[0.2em] uppercase font-medium text-foreground hover:bg-foreground hover:text-background transition-all duration-500">
                {t("footer_get_in_touch") !== "footer_get_in_touch" ? t("footer_get_in_touch") : "Get in Touch"}
                <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform duration-300" />
              </Link>
            </MagneticButton>
          </div>
        </FadeUp>
      </motion.div>
    </section>
  );
}

export function PublicFooter() {
  const { settings } = useSettings();
  const { t } = useTranslation();
  const studioName = settings?.studio_name ?? "KIM DESIGN STUDIO";
  const logoUrl = settings?.logo_url || "/logo-placeholder.png";
  const tagline = settings?.tagline ?? "Architecture that endures";
  const email = settings?.contact_email ?? "studio@forma.com";
  const phone = settings?.phone;
  const address = settings?.address;
  const instagram = settings?.instagram_url;
  const facebook = settings?.facebook_url;
  const behance = settings?.behance_url;

  return (
    <footer className="border-t border-border/40 bg-background">
      <FooterCTA t={t} />

      {/* Main footer */}
      <div className="border-t border-border/30">
        <div className="container py-14 md:py-20">
          <div className="grid gap-10 grid-cols-2 md:grid-cols-4">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                {logoUrl && logoUrl !== "/logo-placeholder.png" ? (
                  <div className="h-7 w-7 overflow-hidden flex-shrink-0">
                    <img src={logoUrl} alt={studioName} className="h-full w-full object-contain" />
                  </div>
                ) : (
                  <KMonogramLogo size={26} className="rounded-sm flex-shrink-0" />
                )}
                <span className="font-display text-[15px] text-foreground font-medium">{studioName}</span>
              </div>
              <p className="text-[13px] text-muted-foreground leading-relaxed max-w-[240px]">{tagline}</p>
              <div className="flex items-center gap-1.5 mt-6">
                {[
                  email ? { href: `mailto:${email}`, label: "Email", icon: Mail } : null,
                  instagram ? { href: instagram, label: "Instagram", icon: Instagram } : null,
                  facebook ? { href: facebook, label: "Facebook", icon: ArrowUpRight } : null,
                  behance ? { href: behance, label: "Behance", icon: ArrowUpRight } : null,
                ].filter(Boolean).map((item, i) => {
                  const Icon = item!.icon;
                  return (
                    <motion.a
                      key={item!.label}
                      href={item!.href}
                      target={item!.href.startsWith("mailto") ? undefined : "_blank"}
                      rel="noreferrer"
                      initial={{ opacity: 0, y: 8 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3, delay: 0.1 + i * 0.05, ease }}
                      whileHover={{ y: -2, borderColor: "hsl(var(--foreground) / 0.4)" }}
                      className="h-9 w-9 border border-border/40 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={item!.label}
                    >
                      <Icon size={13} />
                    </motion.a>
                  );
                })}
              </div>
            </div>

            {/* Navigation */}
            <div>
              <p className="text-[9px] tracking-[0.35em] uppercase text-muted-foreground/50 mb-5 font-mono-label">{t("footer_navigate")}</p>
              <nav className="flex flex-col gap-2.5">
                {NAV_KEYS.map((l, i) => (
                  <motion.div
                    key={l.href}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.05, ease }}
                  >
                    <Link to={l.href} className="text-[13px] text-muted-foreground hover:text-foreground transition-colors w-fit link-underline inline-block">
                      {t(l.key)}
                    </Link>
                  </motion.div>
                ))}
              </nav>
            </div>

            {/* Contact */}
            <div>
              <p className="text-[9px] tracking-[0.35em] uppercase text-muted-foreground/50 mb-5 font-mono-label">
                {t("footer_contact") !== "footer_contact" ? t("footer_contact") : "Contact"}
              </p>
              <div className="space-y-3">
                {email && (
                  <a href={`mailto:${email}`} className="flex items-start gap-2 text-[13px] text-muted-foreground hover:text-foreground transition-colors">
                    <Mail size={12} className="mt-0.5 shrink-0" />
                    <span className="break-all">{email}</span>
                  </a>
                )}
                {phone && (
                  <a href={`tel:${phone}`} className="flex items-start gap-2 text-[13px] text-muted-foreground hover:text-foreground transition-colors">
                    <Phone size={12} className="mt-0.5 shrink-0" />
                    <span>{phone}</span>
                  </a>
                )}
                {address && (
                  <div className="flex items-start gap-2 text-[13px] text-muted-foreground">
                    <MapPin size={12} className="mt-0.5 shrink-0" />
                    <span>{address}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-border/25">
        <div className="container py-5 flex flex-col gap-2 md:flex-row md:justify-between md:items-center">
          <p className="text-[11px] text-muted-foreground/60 font-mono-label">
            © {new Date().getFullYear()} {studioName}. {t("footer_rights")}
          </p>
          <p className="text-[10px] text-muted-foreground/30 font-mono-label whitespace-pre-line text-right max-w-xs mt-4 md:mt-0">
            {"'''Do not make any visual modifications. The phrases I write are commands to understand what I want, not to be written down. Understand their content well, then execute what is required.'''\n                                        \n                                            \n                                            v"}
          </p>
          <span className="text-[11px] text-muted-foreground/40 font-mono-label tracking-wider">Yangon · Mandalay · Myanmar</span>
        </div>
      </div>
    </footer>
  );
}
