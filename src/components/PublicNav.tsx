import { Link, useLocation } from "react-router-dom";
import { Menu, X, Sun, Moon, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { useSettings } from "@/hooks/useSettings";
import { KMonogramLogo } from "@/components/KMonogramLogo";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useTranslation } from "@/i18n/LanguageContext";
import { AnimatePresence, motion } from "framer-motion";

const NAV_KEYS = [
  { key: "nav_projects", href: "/portfolio" },
  { key: "nav_services", href: "/services" },
  { key: "nav_blog", href: "/blog" },
  { key: "nav_studio", href: "/about" },
  { key: "nav_contact", href: "/contact" },
];

export function PublicNav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const { settings } = useSettings();
  const { t } = useTranslation();
  const location = useLocation();
  const studioName = settings?.studio_name ?? "KIM DESIGN STUDIO";
  const logoUrl = settings?.logo_url || "/logo-placeholder.png";

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  return (
    <header className="sticky top-0 z-50 glass-nav">
      <div className="container flex h-16 md:h-[72px] items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group shrink-0">
          {logoUrl && logoUrl !== "/logo-placeholder.png" ? (
            <div className="h-8 w-8 overflow-hidden flex items-center justify-center">
              <img src={logoUrl} alt={studioName} className="h-full w-full object-contain" />
            </div>
          ) : (
            <KMonogramLogo size={30} className="rounded-sm" />
          )}
          <span className="font-display text-base md:text-lg text-foreground tracking-tight">{studioName}</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {NAV_KEYS.map((l) => {
            const isActive = location.pathname === l.href || location.pathname.startsWith(l.href + "/");
            return (
              <Link key={l.href} to={l.href}
                className={`px-4 py-2 text-sm transition-colors ${
                  isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}>
                {t(l.key)}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-1">
          <LanguageToggle />
          <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2.5 text-muted-foreground hover:text-foreground transition-colors" aria-label="Toggle theme">
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button className="p-2 md:hidden text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
            <AnimatePresence mode="wait" initial={false}>
              {mobileOpen ? (
                <motion.div key="close" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                  <X size={20} />
                </motion.div>
              ) : (
                <motion.div key="menu" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                  <Menu size={20} />
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </div>
      </div>

      {/* Mobile fullscreen menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 top-16 bottom-0 z-40 bg-background md:hidden overflow-y-auto"
          >
            <div className="container py-8 flex flex-col h-full">
              <nav className="flex-1 space-y-1">
                {NAV_KEYS.map((l, i) => {
                  const isActive = location.pathname === l.href || location.pathname.startsWith(l.href + "/");
                  return (
                    <motion.div key={l.href}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05, duration: 0.3 }}>
                      <Link to={l.href}
                        className={`flex items-center justify-between py-4 px-2 border-b border-border/30 text-base transition-colors ${
                          isActive ? "text-foreground" : "text-muted-foreground"
                        }`}
                        onClick={() => setMobileOpen(false)}>
                        <span>{t(l.key)}</span>
                        <ArrowRight size={14} className="text-muted-foreground/30" />
                      </Link>
                    </motion.div>
                  );
                })}
              </nav>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.3 }}
                className="pt-6 pb-safe mt-auto">
                <Link to="/contact" onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center gap-2 w-full py-3.5 bg-primary text-primary-foreground text-sm tracking-wider rounded-sm">
                  {t("nav_contact")} <ArrowRight size={14} />
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}