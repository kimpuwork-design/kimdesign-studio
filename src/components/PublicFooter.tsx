import { Link } from "react-router-dom";
import { Mail, Instagram } from "lucide-react";
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
  const instagram = settings?.instagram_url;

  return (
    <footer className="relative border-t border-border/50 backdrop-blur-xl bg-background/60 py-10 md:py-12">
      {/* Top border glow */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

      <div className="container">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between md:gap-10">
          <div className="max-w-xs">
            <div className="flex items-center gap-2.5 mb-3">
              {logoUrl && logoUrl !== "/logo-placeholder.png" ? (
                <div className="h-7 w-7 md:h-8 md:w-8 rounded-lg overflow-hidden flex-shrink-0">
                  <img src={logoUrl} alt={studioName} className="h-full w-full object-contain" />
                </div>
              ) : (
                <KMonogramLogo size={28} className="rounded-lg flex-shrink-0 md:w-8 md:h-8" />
              )}
              <span className="font-display text-base md:text-lg font-semibold text-foreground">{studioName}</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{tagline}</p>
            <div className="flex items-center gap-2.5 mt-4">
              {email && (
                <a href={`mailto:${email}`} className="rounded-full p-2 bg-secondary/50 backdrop-blur-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-200">
                  <Mail size={14} />
                </a>
              )}
              {instagram && (
                <a href={instagram} target="_blank" rel="noreferrer" className="rounded-full p-2 bg-secondary/50 backdrop-blur-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-200">
                  <Instagram size={14} />
                </a>
              )}
            </div>
          </div>

          {/* Nav links - horizontal on mobile, vertical on desktop */}
          <nav>
            <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-muted-foreground mb-3 md:mb-4">{t("footer_navigate")}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 md:flex-col md:gap-y-2">
              {NAV_KEYS.map((l) => (
                <Link
                  key={l.href}
                  to={l.href}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t(l.key)}
                </Link>
              ))}
            </div>
          </nav>
        </div>

        <div className="mt-8 md:mt-10 pt-5 md:pt-6 border-t border-border/50 flex flex-col gap-1.5 md:flex-row md:gap-2 md:justify-between">
          <p className="text-[11px] md:text-xs text-muted-foreground">© {new Date().getFullYear()} {studioName} {t("footer_architecture")}. {t("footer_rights")}</p>
          <p className="text-[11px] md:text-xs text-muted-foreground">Yangon · Mandalay · Myanmar</p>
        </div>
      </div>
    </footer>
  );
}
