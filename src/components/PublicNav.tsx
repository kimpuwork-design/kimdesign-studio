import { Link } from "react-router-dom";
import { Menu, X, Sun, Moon } from "lucide-react";
import { useState } from "react";
import { useTheme } from "next-themes";

const navLinks = [
  { label: "Projects", href: "/portfolio" },
  { label: "Services", href: "/services" },
  { label: "Studio", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export function PublicNav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <span className="font-display text-xl font-semibold tracking-tight text-foreground">FORMA</span>
          <span className="h-px w-6 bg-primary" />
          <span className="text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground">Architecture</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              to={l.href}
              className="text-xs font-medium tracking-[0.12em] uppercase text-muted-foreground transition-colors hover:text-foreground"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {/* Dark/Light toggle */}
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="rounded p-2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <button
            className="rounded p-2 md:hidden text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-border bg-background px-4 py-4 md:hidden">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              to={l.href}
              className="block py-3 text-xs font-medium tracking-[0.12em] uppercase text-muted-foreground"
              onClick={() => setMobileOpen(false)}
            >
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
