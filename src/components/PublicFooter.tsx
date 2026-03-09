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
      {/* CTA band */}
      <div className="border-b border-border/30">
        <div className="container py-12 md:py-16 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="max-w-md">
            <h3 className="font-display text-2xl md:text-3xl text-foreground">
              {t("footer_cta_title") !== "footer_cta_title" ? t("footer_cta_title") : "Ready to start your project?"}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("footer_cta_desc") !== "footer_cta_desc" ? t("footer_cta_desc") : "Let's discuss how we can bring your vision to life."}
            </p>
          </div>
          <Link to="/contact"
            className="inline-flex items-center gap-2 bg-primary px-6 py-3 text-sm tracking-wider text-primary-foreground hover:bg-primary/90 transition-colors shrink-0 w-fit rounded-sm">
            {t("footer_get_in_touch") !== "footer_get_in_touch" ? t("footer_get_in_touch") : "Get in Touch"}
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* Main footer */}
      <div className="container py-12 md:py-16">
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
                <a href={`mailto:${email}`} className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Email">
                  <Mail size={16} />
                </a>
              )}
              {instagram && (
                <a href={instagram} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Instagram">
                  <Instagram size={16} />
                </a>
              )}
              {facebook && (
                <a href={facebook} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Facebook">
                  <ArrowUpRight size={16} />
                </a>
              )}
              {behance && (
                <a href={behance} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Behance">
                  <ArrowUpRight size={16} />
                </a>
              )}
            </div>
          </div>

          {/* Navigation */}
          <div>
            <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground/60 mb-5">{t("footer_navigate")}</p>
            <nav className="flex flex-col gap-3">
              {NAV_KEYS.map((l) => (
                <Link key={l.href} to={l.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors w-fit">
                  {t(l.key)}
                </Link>
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