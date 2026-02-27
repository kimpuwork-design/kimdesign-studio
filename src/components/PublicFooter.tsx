import { Link } from "react-router-dom";
import { Mail, Instagram } from "lucide-react";
import { useSettings } from "@/hooks/useSettings";
import { KMonogramLogo } from "@/components/KMonogramLogo";
import { useTranslation } from "@/i18n/LanguageContext";

const NAV_KEYS = [
  { key: "nav_projects", href: "/portfolio" },
  { key: "nav_services", href: "/services" },
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
    <footer className="relative border-t border-border/50 backdrop-blur-xl bg-background/60 py-12">
      {/* Top border glow */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

      <div className="container">
        <div className="flex flex-col md:flex-row items-start justify-between gap-10">
          <div>
            <div className="flex items-center gap-3 mb-4">
              {logoUrl && logoUrl !== "/logo-placeholder.png" ? (
                <div className="h-8 w-8 rounded-lg overflow-hidden flex-shrink-0">
                  <img src={logoUrl} alt={studioName} className="h-full w-full object-contain" />
                </div>
              ) : (
                <KMonogramLogo size={32} className="rounded-lg flex-shrink-0" />
              )}
              <span className="font-display text-lg font-semibold text-foreground">{studioName}</span>
              <span className="h-px w-5 bg-primary" />
              <span className="text-xs tracking-[0.2em] uppercase text-muted-foreground">{t("footer_architecture")}</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">{tagline}</p>
            <div className="flex items-center gap-3 mt-5">
              {email && (
                <a href={`mailto:${email}`} className="rounded-full p-2 bg-secondary/50 backdrop-blur-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-200">
                  <Mail size={15} />
                </a>
              )}
              {instagram && (
                <a href={instagram} target="_blank" rel="noreferrer" className="rounded-full p-2 bg-secondary/50 backdrop-blur-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-200">
                  <Instagram size={15} />
                </a>
              )}
            </div>
          </div>
          <nav className="flex gap-12">
            <div>
              <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-muted-foreground mb-4">{t("footer_navigate")}</p>
              {NAV_KEYS.map((l) => (
                <Link
                  key={l.href}
                  to={l.href}
                  className="block text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
                >
                  {t(l.key)}
                </Link>
              ))}
            </div>
          </nav>
        </div>
        <div className="mt-10 pt-6 border-t border-border/50 flex flex-col md:flex-row gap-2 justify-between">
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} {studioName} {t("footer_architecture")}. {t("footer_rights")}</p>
          <p className="text-xs text-muted-foreground">Yangon · Mandalay · Myanmar</p>
        </div>
      </div>
    </footer>
  );
}
