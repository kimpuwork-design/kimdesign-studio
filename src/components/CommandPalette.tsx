import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { CommandPalette as PortalCommandPalette } from "@/components/admin/CommandPalette";
import { shouldOpenCommandPalette } from "@/lib/keyboard";

// Portal layouts own their palette; only public pages need the global instance.
export function CommandPalette() {
  const { profile } = useAuth();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const inPortal = /^\/(admin|staff|app)(\/|$)/.test(pathname);
  const enabled = profile?.role === "ADMIN" && !inPortal;

  useEffect(() => {
    setOpen(false);
  }, [pathname, enabled]);

  useEffect(() => {
    if (!enabled) return;
    const handler = (event: KeyboardEvent) => {
      if (!shouldOpenCommandPalette(event)) return;
      event.preventDefault();
      setOpen(value => !value);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [enabled]);

  if (!enabled) return null;
  return <PortalCommandPalette open={open} onOpenChange={setOpen} variant="admin" />;
}