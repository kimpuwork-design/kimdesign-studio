import { Link } from "react-router-dom";
import { Mail, Instagram, Phone, MapPin, ArrowRight, ArrowUpRight } from "lucide-react";
import { useSettings } from "@/hooks/useSettings";
import { KMonogramLogo } from "@/components/KMonogramLogo";
import { useTranslation } from "@/i18n/LanguageContext";

const NAV_KEYS = [
  { key: "nav_projects", href: "/portfolio" },
  { key: "nav_services", href: "/services" },
  { key: "nav_blog", href: "/blog" },
  { key: "nav_studio", href: "/about" },
  { key: "nav_contact", href: "/contact" },
];

const LEGAL_LINKS = [
  { label: "Privacy Policy", href: "#" },
  { label: "Terms of Service", href: "#" },
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
    <footer className="relative border-t border-border/50 bg-background">
      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

      {/* Newsletter / CTA band */}
      <div className="border-b border-border/30">
        <div className="container py-10 md:py-14 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="max-w-md">
            <h3 className="font-display text-xl md:text-2xl font-bold text-foreground tracking-tight">
              {t("footer_cta_title") !== "footer_cta_title" ? t("footer_cta_title") : "Ready to start your project?"}
            </h3>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {t("footer_cta_desc") !== "footer_cta_desc" ? t("footer_cta_desc") : "Let's discuss how we can bring your vision to life."}
            </p>
          </div>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 text-sm font-medium tracking-wide text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:bg-primary/90 transition-all shrink-0 w-fit"
          >
            {t("footer_get_in_touch") !== "footer_get_in_touch" ? t("footer_get_in_touch") : "Get in Touch"}
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* Main footer grid */}
      <div className="container py-10 md:py-14">
        <div className="grid gap-8 md:gap-10 grid-cols-2 md:grid-cols-4">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5 mb-3">
              {logoUrl && logoUrl !== "/logo-placeholder.png" ? (
                <div className="h-8 w-8 rounded-xl overflow-hidden flex-shrink-0 shadow-sm">
                  <img src={logoUrl} alt={studioName} className="h-full w-full object-contain" />
                </div>
              ) : (
                <KMonogramLogo size={32} className="rounded-xl flex-shrink-0 shadow-sm" />
              )}
              <span className="font-display text-base font-bold text-foreground tracking-tight">{studioName}</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-[240px]">{tagline}</p>

            {/* Social icons */}
            <div className="flex items-center gap-2 mt-5">
              {email && (
                <a href={`mailto:${email}`} className="rounded-xl p-2 bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary transition-all" aria-label="Email">
                  <Mail size={15} />
                </a>
              )}
              {instagram && (
                <a href={instagram} target="_blank" rel="noreferrer" className="rounded-xl p-2 bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary transition-all" aria-label="Instagram">
                  <Instagram size={15} />
                </a>
              )}
              {facebook && (
                <a href={facebook} target="_blank" rel="noreferrer" className="rounded-xl p-2 bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary transition-all" aria-label="Facebook">
                  <ArrowUpRight size={15} />
                </a>
              )}
              {behance && (
                <a href={behance} target="_blank" rel="noreferrer" className="rounded-xl p-2 bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary transition-all" aria-label="Behance">
                  <ArrowUpRight size={15} />
                </a>
              )}
            </div>
          </div>

          {/* Navigation */}
          <div>
            <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-muted-foreground/70 mb-4">{t("footer_navigate")}</p>
            <nav className="flex flex-col gap-2.5">
              {NAV_KEYS.map((l) => (
                <Link key={l.href} to={l.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors w-fit">
                  {t(l.key)}
                </Link>
              ))}
            </nav>
          </div>

          {/* Contact info */}
          <div>
            <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-muted-foreground/70 mb-4">
              {t("footer_contact") !== "footer_contact" ? t("footer_contact") : "Contact"}
            </p>
            <div className="space-y-3">
              {email && (
                <a href={`mailto:${email}`} className="flex items-start gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group">
                  <Mail size={13} className="mt-0.5 shrink-0 group-hover:text-primary transition-colors" />
                  <span className="break-all">{email}</span>
                </a>
              )}
              {phone && (
                <a href={`tel:${phone}`} className="flex items-start gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group">
                  <Phone size={13} className="mt-0.5 shrink-0 group-hover:text-primary transition-colors" />
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

      {/* Bottom bar */}
      <div className="border-t border-border/30">
        <div className="container py-5 md:py-6 flex flex-col gap-3 md:flex-row md:justify-between md:items-center">
          <p className="text-[11px] md:text-xs text-muted-foreground">
            © {new Date().getFullYear()} {studioName}. {t("footer_rights")}
          </p>
          <div className="flex items-center gap-4 md:gap-6">
            <span className="text-[11px] md:text-xs text-muted-foreground/60">Yangon · Mandalay · Myanmar</span>
            {LEGAL_LINKS.map((link) => (
              <a key={link.label} href={link.href} className="text-[11px] md:text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors hidden md:inline">
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
