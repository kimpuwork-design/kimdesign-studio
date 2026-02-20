import { Link } from "react-router-dom";
import { Mail, Instagram } from "lucide-react";
import { useSettings } from "@/hooks/useSettings";

const NAV_LINKS = [
  { label: "Projects", href: "/portfolio" },
  { label: "Services", href: "/services" },
  { label: "Studio", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export function PublicFooter() {
  const { settings } = useSettings();
  const studioName = settings?.studio_name ?? "FORMA";
  const tagline = settings?.tagline ?? "Architecture that endures";
  const email = settings?.contact_email ?? "studio@forma.com";
  const instagram = settings?.instagram_url;

  return (
    <footer className="border-t border-border bg-secondary/30 py-12">
      <div className="container">
        <div className="flex flex-col md:flex-row items-start justify-between gap-10">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="font-display text-lg font-semibold">{studioName}</span>
              <span className="h-px w-5 bg-primary" />
              <span className="text-xs tracking-[0.2em] uppercase text-muted-foreground">Architecture</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">{tagline}</p>
            <div className="flex items-center gap-4 mt-5">
              {email && (
                <a href={`mailto:${email}`} className="text-muted-foreground hover:text-foreground transition-colors">
                  <Mail size={15} />
                </a>
              )}
              {instagram && (
                <a href={instagram} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                  <Instagram size={15} />
                </a>
              )}
            </div>
          </div>
          <nav className="flex gap-12">
            <div>
              <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-muted-foreground mb-4">Navigate</p>
              {NAV_LINKS.map((l) => (
                <Link
                  key={l.href}
                  to={l.href}
                  className="block text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </nav>
        </div>
        <div className="mt-10 pt-6 border-t border-border flex flex-col md:flex-row gap-2 justify-between">
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} {studioName} Architecture. All rights reserved.</p>
          <p className="text-xs text-muted-foreground">London · New York · Copenhagen</p>
        </div>
      </div>
    </footer>
  );
}
