import { Link, useLocation } from "react-router-dom";
import { Menu, X, Sun, Moon, ArrowRight, Accessibility } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { useSettings } from "@/hooks/useSettings";
import { KMonogramLogo } from "@/components/KMonogramLogo";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useTranslation } from "@/i18n/LanguageContext";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NAV_KEYS = [
  { key: "nav_projects", href: "/portfolio" },
  { key: "nav_services", href: "/services" },
  { key: "nav_studio", href: "/about" },
  { key: "nav_contact", href: "/contact" },
];

const ease = [0.22, 1, 0.36, 1] as [number, number, number, number];

export function PublicNav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [navHidden, setNavHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { theme, setTheme } = useTheme();
  const { settings } = useSettings();
  const { t } = useTranslation();
  const { reduceMotion, setReduceMotion } = useAccessibility();
  const location = useLocation();
  const studioName = settings?.studio_name ?? "KIM DESIGN STUDIO";
  const logoUrl = settings?.logo_url || "/logo-placeholder.png";

  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 40);
  });

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-500 ${scrolled ? "glass-nav shadow-sm" : "bg-transparent"}`}
    >
      <div className={`container flex items-center justify-between transition-all duration-500 ${scrolled ? "h-12 md:h-14" : "h-14 md:h-[72px]"}`}>
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 md:gap-2.5 group shrink min-w-0">
          {logoUrl && logoUrl !== "/logo-placeholder.png" ? (
            <div className="h-7 w-7 md:h-8 md:w-8 overflow-hidden flex items-center justify-center shrink-0">
              <img src={logoUrl} alt={studioName} className="h-full w-full object-contain" />
            </div>
          ) : (
            <KMonogramLogo size={26} className="rounded-sm shrink-0" animated />
          )}
          <span className="font-display text-[13px] md:text-base text-foreground tracking-tight font-medium truncate">{studioName}</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-0 md:flex">
          {NAV_KEYS.map((l) => {
            const isActive = location.pathname === l.href || location.pathname.startsWith(l.href + "/");
            return (
              <Link key={l.href} to={l.href}
                className={`relative px-4 lg:px-5 py-2 text-[12.5px] tracking-[0.06em] uppercase font-medium transition-colors duration-300 ${
                  isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}>
                {t(l.key)}
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute bottom-0 left-3 right-3 h-[1.5px] bg-primary"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-0.5">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="inline-flex items-center justify-center min-h-11 min-w-11 rounded-md text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                aria-label="Accessibility settings"
              >
                <Accessibility size={15} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Accessibility</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={reduceMotion}
                onCheckedChange={setReduceMotion}
              >
                Reduce motion
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <LanguageToggle />
          <button onClick={() => {
              document.documentElement.classList.add("theme-transitioning");
              setTheme(theme === "dark" ? "light" : "dark");
              setTimeout(() => document.documentElement.classList.remove("theme-transitioning"), 600);
            }}
            className="inline-flex items-center justify-center min-h-11 min-w-11 rounded-md text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}>
            <AnimatePresence mode="wait" initial={false}>
              {theme === "dark" ? (
                <motion.div key="sun" initial={{ opacity: 0, rotate: -90, scale: 0.5 }} animate={{ opacity: 1, rotate: 0, scale: 1 }} exit={{ opacity: 0, rotate: 90, scale: 0.5 }} transition={{ duration: 0.2 }}>
                  <Sun size={15} aria-hidden="true" />
                </motion.div>
              ) : (
                <motion.div key="moon" initial={{ opacity: 0, rotate: 90, scale: 0.5 }} animate={{ opacity: 1, rotate: 0, scale: 1 }} exit={{ opacity: 0, rotate: -90, scale: 0.5 }} transition={{ duration: 0.2 }}>
                  <Moon size={15} aria-hidden="true" />
                </motion.div>
              )}
            </AnimatePresence>
          </button>
          <button
            className="inline-flex items-center justify-center min-h-11 min-w-11 md:hidden rounded-md text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav-panel"
          >
            <AnimatePresence mode="wait" initial={false}>
              {mobileOpen ? (
                <motion.div key="close" initial={{ opacity: 0, rotate: -90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: 90 }} transition={{ duration: 0.2 }}>
                  <X size={20} aria-hidden="true" />
                </motion.div>
              ) : (
                <motion.div key="menu" initial={{ opacity: 0, rotate: 90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: -90 }} transition={{ duration: 0.2 }}>
                  <Menu size={20} aria-hidden="true" />
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
            transition={{ duration: 0.5, ease }}
            className="fixed inset-x-0 top-0 bottom-0 z-40 bg-foreground md:hidden overflow-y-auto"
            id="mobile-nav-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Main navigation"
          >
            <div className="container pt-24 pb-10 flex flex-col h-full">
              <nav className="flex-1 space-y-0">
                {NAV_KEYS.map((l, i) => {
                  const isActive = location.pathname === l.href || location.pathname.startsWith(l.href + "/");
                  return (
                    <motion.div key={l.href}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.12 + i * 0.05, duration: 0.5, ease }}>
                      <Link to={l.href}
                        className={`flex items-center justify-between py-5 border-b border-background/10 transition-colors ${
                          isActive ? "text-background" : "text-background/50 hover:text-background/80"
                        }`}
                        onClick={() => setMobileOpen(false)}>
                        <span className="font-display text-3xl sm:text-4xl">{t(l.key)}</span>
                        <ArrowRight size={16} className={`transition-all duration-300 ${isActive ? "text-primary-foreground opacity-100" : "opacity-0"}`} />
                      </Link>
                    </motion.div>
                  );
                })}
              </nav>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45, duration: 0.4 }}
                className="pt-8 pb-safe mt-auto space-y-6">
                <Link to="/contact" onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center gap-2 w-full py-4 bg-primary text-primary-foreground text-[11px] tracking-[0.2em] uppercase font-medium">
                  {t("nav_contact")} <ArrowRight size={12} />
                </Link>
                <p className="text-center text-[9px] tracking-[0.35em] uppercase text-background/15 font-mono-label">
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
