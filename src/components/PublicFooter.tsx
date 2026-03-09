import { Link } from "react-router-dom";
import { Mail, Instagram, Phone, MapPin, ArrowRight, ArrowUpRight } from "lucide-react";
import { useSettings } from "@/hooks/useSettings";
import { KMonogramLogo } from "@/components/KMonogramLogo";
import { useTranslation } from "@/i18n/LanguageContext";
import { motion } from "framer-motion";
import { FadeUp, TextReveal } from "@/components/motion/MotionWrappers";
import { MagneticButton } from "@/components/MagneticButton";
import { SectionLabel } from "@/components/SectionLabel";

const NAV_KEYS = [
  { key: "nav_projects", href: "/portfolio" },
  { key: "nav_services", href: "/services" },
  { key: "nav_blog", href: "/blog" },
  { key: "nav_studio", href: "/about" },
  { key: "nav_contact", href: "/contact" },
];

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
    <footer className="border-t border-border/50 bg-background">
      {/* ── Giant typographic CTA ── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/[0.03] rounded-full blur-[150px]" />
        </div>
        <div className="container py-28 md:py-44 relative z-10">
          <TextReveal>
            <p className="text-[10px] tracking-[0.35em] uppercase text-primary mb-6 md:mb-8 text-center">
              {t("footer_cta_title") !== "footer_cta_title" ? t("footer_cta_title") : "Start a conversation"}
            </p>
          </TextReveal>
          <TextReveal delay={0.15}>
            <h2 className="font-display text-[clamp(3rem,10vw,9rem)] leading-[0.9] text-foreground text-center">
              Let's build
            </h2>
          </TextReveal>
          <TextReveal delay={0.3}>
            <h2 className="font-display text-[clamp(3rem,10vw,9rem)] leading-[0.9] text-primary text-center">
              together.
            </h2>
          </TextReveal>
          <FadeUp delay={0.5}>
            <div className="flex justify-center mt-12 md:mt-16">
              <MagneticButton strength={0.2}>
                <Link to="/contact"
                  className="group inline-flex items-center gap-3 border border-foreground/20 px-10 md:px-14 py-4 md:py-5 text-sm tracking-[0.2em] uppercase text-foreground hover:bg-foreground hover:text-background transition-all duration-500">
                  {t("footer_get_in_touch") !== "footer_get_in_touch" ? t("footer_get_in_touch") : "Get in Touch"}
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform duration-300" />
                </Link>
              </MagneticButton>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ── Main footer ── */}
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
                  <KMonogramLogo size={28} className="rounded-sm flex-shrink-0" />
                )}
                <span className="font-display text-base text-foreground">{studioName}</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-[240px]">{tagline}</p>
              <div className="flex items-center gap-3 mt-6">
                {email && (
                  <a href={`mailto:${email}`} className="h-9 w-9 border border-border/40 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all" aria-label="Email">
                    <Mail size={14} />
                  </a>
                )}
                {instagram && (
                  <a href={instagram} target="_blank" rel="noreferrer" className="h-9 w-9 border border-border/40 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all" aria-label="Instagram">
                    <Instagram size={14} />
                  </a>
                )}
                {facebook && (
                  <a href={facebook} target="_blank" rel="noreferrer" className="h-9 w-9 border border-border/40 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all" aria-label="Facebook">
                    <ArrowUpRight size={14} />
                  </a>
                )}
                {behance && (
                  <a href={behance} target="_blank" rel="noreferrer" className="h-9 w-9 border border-border/40 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all" aria-label="Behance">
                    <ArrowUpRight size={14} />
                  </a>
                )}
              </div>
            </div>

            {/* Navigation */}
            <div>
              <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground/60 mb-5">{t("footer_navigate")}</p>
              <nav className="flex flex-col gap-3">
                {NAV_KEYS.map((l, i) => (
                  <motion.div
                    key={l.href}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
                  >
                    <Link to={l.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors w-fit link-underline inline-block">
                      {t(l.key)}
                    </Link>
                  </motion.div>
                ))}
              </nav>
            </div>

            {/* Contact */}
            <div>
              <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground/60 mb-5">
                {t("footer_contact") !== "footer_contact" ? t("footer_contact") : "Contact"}
              </p>
              <div className="space-y-3">
                {email && (
                  <a href={`mailto:${email}`} className="flex items-start gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <Mail size={13} className="mt-0.5 shrink-0" />
                    <span className="break-all">{email}</span>
                  </a>
                )}
                {phone && (
                  <a href={`tel:${phone}`} className="flex items-start gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <Phone size={13} className="mt-0.5 shrink-0" />
                    <span>{phone}</span>
                  </a>
                )}
                {address && (
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <MapPin size={13} className="mt-0.5 shrink-0" />
                    <span>{address}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-border/30">
        <div className="container py-6 flex flex-col gap-3 md:flex-row md:justify-between md:items-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} {studioName}. {t("footer_rights")}
          </p>
          <span className="text-xs text-muted-foreground/50">Yangon · Mandalay · Myanmar</span>
        </div>
      </div>
    </footer>
  );
}
