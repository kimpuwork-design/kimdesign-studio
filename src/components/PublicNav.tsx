import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";

const navLinks = [
  { label: "Portfolio", href: "/portfolio" },
  { label: "Services", href: "/services" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export function PublicNav() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const getPortalLink = () => {
    if (!profile) return "/app";
    if (profile.role === "ADMIN") return "/admin";
    if (profile.role === "STAFF") return "/staff";
    return "/app";
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="font-display text-xl font-bold tracking-tight">Studio</span>
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              to={l.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate(getPortalLink())}>
                Dashboard
              </Button>
              <Button variant="ghost" size="sm" onClick={signOut}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/auth/login">Login</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/auth/register">Get Started</Link>
              </Button>
            </>
          )}
        </div>

        <button
          className="rounded p-2 md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-border bg-background px-4 py-4 md:hidden">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              to={l.href}
              className="block py-2 text-sm font-medium text-muted-foreground"
              onClick={() => setMobileOpen(false)}
            >
              {l.label}
            </Link>
          ))}
          <div className="mt-4 flex flex-col gap-2">
            {user ? (
              <>
                <Button size="sm" onClick={() => { navigate(getPortalLink()); setMobileOpen(false); }}>
                  Dashboard
                </Button>
                <Button variant="ghost" size="sm" onClick={signOut}>Logout</Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild><Link to="/auth/login">Login</Link></Button>
                <Button size="sm" asChild><Link to="/auth/register">Get Started</Link></Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
