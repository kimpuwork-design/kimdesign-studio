import { Link, useLocation } from "react-router-dom";
import { Menu, X, Sun, Moon, ArrowRight } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { useSettings } from "@/hooks/useSettings";
import { KMonogramLogo } from "@/components/KMonogramLogo";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useTranslation } from "@/i18n/LanguageContext";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";

const NAV_KEYS = [
  { key: "nav_projects", href: "/portfolio" },
  { key: "nav_services", href: "/services" },
  { key: "nav_blog", href: "/blog" },
  { key: "nav_studio", href: "/about" },
  { key: "nav_contact", href: "/contact" },
];

export function PublicNav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [navHidden, setNavHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { theme, setTheme } = useTheme();
  const { settings } = useSettings();
  const { t } = useTranslation();
  const location = useLocation();
  const studioName = settings?.studio_name ?? "KIM DESIGN STUDIO";
  const logoUrl = settings?.logo_url || "/logo-placeholder.png";

  const { scrollY } = useScroll();
  const lastScrollY = useRef(0);

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 50);
    const diff = latest - lastScrollY.current;
    if (latest < 100) {
      setNavHidden(false);
    } else if (diff > 5) {
      setNavHidden(true);
    } else if (diff < -5) {
      setNavHidden(false);
    }
    lastScrollY.current = latest;
  });

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  return (
    <motion.header
      animate={{ y: navHidden && !mobileOpen ? "-100%" : "0%" }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={`sticky top-0 z-50 transition-all duration-500 ${scrolled ? "glass-nav shadow-sm" : "bg-transparent"}`}
    >
      <div className={`container flex items-center justify-between transition-all duration-500 ${scrolled ? "h-14 md:h-14" : "h-16 md:h-[72px]"}`}>
        <Link to="/" className="flex items-center gap-2.5 group shrink-0">
          {logoUrl && logoUrl !== "/logo-placeholder.png" ? (
            <div className="h-8 w-8 overflow-hidden flex items-center justify-center">
              <img src={logoUrl} alt={studioName} className="h-full w-full object-contain" />
            </div>
          ) : (
            <KMonogramLogo size={30} className="rounded-sm" animated />
          )}
          <span className="font-display text-base md:text-lg text-foreground tracking-tight">{studioName}</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-0 md:flex">
          {NAV_KEYS.map((l) => {
            const isActive = location.pathname === l.href || location.pathname.startsWith(l.href + "/");
            return (
              <Link key={l.href} to={l.href}
                className={`relative px-5 py-2 text-[13px] tracking-[0.04em] transition-colors duration-300 ${
                  isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}>
                {t(l.key)}
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute bottom-0 left-2 right-2 h-[1.5px] bg-primary"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-1">
          <LanguageToggle />
          <button onClick={() => {
              document.documentElement.classList.add("theme-transitioning");
              setTheme(theme === "dark" ? "light" : "dark");
              setTimeout(() => document.documentElement.classList.remove("theme-transitioning"), 600);
            }}
            className="p-2.5 text-muted-foreground hover:text-foreground transition-colors" aria-label="Toggle theme">
            <AnimatePresence mode="wait" initial={false}>
              {theme === "dark" ? (
                <motion.div key="sun" initial={{ opacity: 0, rotate: -90, scale: 0.5 }} animate={{ opacity: 1, rotate: 0, scale: 1 }} exit={{ opacity: 0, rotate: 90, scale: 0.5 }} transition={{ duration: 0.25 }}>
                  <Sun size={16} />
                </motion.div>
              ) : (
                <motion.div key="moon" initial={{ opacity: 0, rotate: 90, scale: 0.5 }} animate={{ opacity: 1, rotate: 0, scale: 1 }} exit={{ opacity: 0, rotate: -90, scale: 0.5 }} transition={{ duration: 0.25 }}>
                  <Moon size={16} />
                </motion.div>
              )}
            </AnimatePresence>
          </button>
          <button className="p-2 md:hidden text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
            <AnimatePresence mode="wait" initial={false}>
              {mobileOpen ? (
                <motion.div key="close" initial={{ opacity: 0, rotate: -90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: 90 }} transition={{ duration: 0.2 }}>
                  <X size={20} />
                </motion.div>
              ) : (
                <motion.div key="menu" initial={{ opacity: 0, rotate: 90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: -90 }} transition={{ duration: 0.2 }}>
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
            initial={{ clipPath: "inset(0 0 100% 0)" }}
            animate={{ clipPath: "inset(0 0 0% 0)" }}
            exit={{ clipPath: "inset(0 0 100% 0)" }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-x-0 top-0 bottom-0 z-40 bg-foreground md:hidden overflow-y-auto"
          >
            <div className="container pt-24 pb-10 flex flex-col h-full">
              <nav className="flex-1 space-y-0">
                {NAV_KEYS.map((l, i) => {
                  const isActive = location.pathname === l.href || location.pathname.startsWith(l.href + "/");
                  return (
                    <motion.div key={l.href}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 + i * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
                      <Link to={l.href}
                        className={`flex items-center justify-between py-5 border-b border-background/10 transition-colors ${
                          isActive ? "text-background" : "text-background/50 hover:text-background/80"
                        }`}
                        onClick={() => setMobileOpen(false)}>
                        <span className="font-display text-3xl sm:text-4xl">{t(l.key)}</span>
                        <ArrowRight size={18} className={`transition-all duration-300 ${isActive ? "text-primary-foreground opacity-100" : "opacity-0"}`} />
                      </Link>
                    </motion.div>
                  );
                })}
              </nav>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.4 }}
                className="pt-8 pb-safe mt-auto space-y-6">
                <Link to="/contact" onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center gap-2 w-full py-4 bg-primary text-primary-foreground text-sm tracking-[0.15em] uppercase">
                  {t("nav_contact")} <ArrowRight size={14} />
                </Link>
                <p className="text-center text-[10px] tracking-[0.3em] uppercase text-background/20">
                  {studioName}
                </p>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
