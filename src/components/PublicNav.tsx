import { Link } from "react-router-dom";
import { Menu, X, Sun, Moon } from "lucide-react";
import { useState } from "react";
import { useTheme } from "next-themes";
import { useSettings } from "@/hooks/useSettings";
import { KMonogramLogo } from "@/components/KMonogramLogo";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useTranslation } from "@/i18n/LanguageContext";

const NAV_KEYS = [
  { key: "nav_projects", href: "/portfolio" },
  { key: "nav_services", href: "/services" },
  { key: "nav_studio", href: "/about" },
  { key: "nav_contact", href: "/contact" },
];

export function PublicNav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const { settings } = useSettings();
  const { t } = useTranslation();
  const studioName = settings?.studio_name ?? "KIM DESIGN STUDIO";
  const logoUrl = settings?.logo_url || "/logo-placeholder.png";

  return (
    <header className="sticky top-0 z-50 glass-nav">
      <div className="container flex h-18 items-center justify-between py-4">
        <Link to="/" className="flex items-center gap-3 group">
          {logoUrl && logoUrl !== "/logo-placeholder.png" ? (
            <div className="h-9 w-9 rounded-xl overflow-hidden flex items-center justify-center shadow-lg group-hover:shadow-primary/20 transition-shadow">
              <img src={logoUrl} alt={studioName} className="h-full w-full object-contain" />
            </div>
          ) : (
            <KMonogramLogo size={36} className="shadow-lg rounded-xl group-hover:shadow-primary/20 transition-shadow" />
          )}
          <div>
            <span className="font-display text-base font-bold tracking-tight text-foreground">{studioName}</span>
            <span className="block text-[9px] font-medium tracking-[0.2em] uppercase text-muted-foreground">Design Studio</span>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {NAV_KEYS.map((l) => (
            <Link
              key={l.href}
              to={l.href}
              className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground transition-all hover:text-foreground hover:bg-secondary/60"
            >
              {t(l.key)}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <LanguageToggle />
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="rounded-xl p-2.5 text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <button
            className="rounded-xl p-2.5 md:hidden text-muted-foreground hover:text-foreground transition-all"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-border/40 bg-background/80 backdrop-blur-xl px-4 py-4 md:hidden animate-fade-in">
          {NAV_KEYS.map((l) => (
            <Link
              key={l.href}
              to={l.href}
              className="block py-3 px-4 rounded-xl text-sm font-medium text-muted-foreground hover:bg-secondary/60 hover:text-foreground transition-all"
              onClick={() => setMobileOpen(false)}
            >
              {t(l.key)}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
