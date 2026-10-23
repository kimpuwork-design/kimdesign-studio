import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog, CommandInput, CommandList, CommandEmpty,
  CommandGroup, CommandItem, CommandSeparator,
} from "@/components/ui/command";
import { useAdminSearch, type AdminSearchHit } from "@/hooks/useAdminSearch";
import {
  LayoutDashboard, BarChart3, Activity, Users, UserCog, Briefcase,
  PackageOpen, FileArchive, Receipt, FileText, Settings, ShieldCheck,
  ScrollText, Image as ImageIcon, Plus, Eye, ArrowRight,
} from "lucide-react";

type Variant = "admin" | "staff" | "client";

const STATIC_ROUTES: Record<Variant, { label: string; href: string; icon: any; group: string }[]> = {
  admin: [
    { group: "Navigate", label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { group: "Navigate", label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
    { group: "Navigate", label: "Activity Timeline", href: "/admin/activity", icon: Activity },
    { group: "Navigate", label: "Leads", href: "/admin/leads", icon: Users },
    { group: "Navigate", label: "Clients", href: "/admin/clients", icon: UserCog },
    { group: "Navigate", label: "Projects", href: "/admin/projects", icon: Briefcase },
    { group: "Navigate", label: "Portfolio", href: "/admin/portfolio", icon: ImageIcon },
    { group: "Navigate", label: "Deliverables", href: "/admin/deliverables", icon: PackageOpen },
    { group: "Navigate", label: "Files", href: "/admin/files", icon: FileArchive },
    { group: "Navigate", label: "Quotes", href: "/admin/quotes", icon: Receipt },
    { group: "Navigate", label: "Invoices", href: "/admin/invoices", icon: FileText },
    { group: "Navigate", label: "Site Content", href: "/admin/site-content", icon: FileText },
    { group: "Navigate", label: "Team", href: "/admin/team", icon: ShieldCheck },
    { group: "Navigate", label: "Audit Logs", href: "/admin/audit-logs", icon: ScrollText },
    { group: "Navigate", label: "Settings", href: "/admin/settings", icon: Settings },
    { group: "Create", label: "New Project", href: "/admin/projects?new=1", icon: Plus },
    { group: "External", label: "Open Public Website", href: "/", icon: Eye },
    { group: "External", label: "Open Portfolio Page", href: "/portfolio", icon: Eye },
  ],
  staff: [
    { group: "Navigate", label: "Dashboard", href: "/staff", icon: LayoutDashboard },
    { group: "Navigate", label: "Projects", href: "/staff/projects", icon: Briefcase },
    { group: "Navigate", label: "Notifications", href: "/staff/notifications", icon: Activity },
  ],
  client: [
    { group: "Navigate", label: "Dashboard", href: "/app", icon: LayoutDashboard },
  ],
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variant: Variant;
}

export function CommandPalette({ open, onOpenChange, variant }: Props) {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const { hits, loading, error } = useAdminSearch(q, open && variant === "admin");

  // Reset query when closed
  useEffect(() => { if (!open) setQ(""); }, [open]);

  const routes = STATIC_ROUTES[variant];
  const grouped = useMemo(() => {
    const map = new Map<string, typeof routes>();
    routes.forEach((r) => {
      const arr = map.get(r.group) || [];
      arr.push(r);
      map.set(r.group, arr);
    });
    return [...map.entries()];
  }, [routes]);

  const go = (href: string) => {
    onOpenChange(false);
    if (href.startsWith("/") && (href === "/" || href.startsWith("/portfolio") || href.startsWith("/about") || href.startsWith("/contact") || href.startsWith("/services") || href.startsWith("/blog"))) {
      // public route — same tab
      navigate(href);
    } else {
      navigate(href);
    }
  };

  const iconFor = (k: AdminSearchHit["kind"]) => {
    if (k === "client") return UserCog;
    if (k === "project") return Briefcase;
    if (k === "lead") return Users;
    return ImageIcon;
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        value={q}
        onValueChange={setQ}
        placeholder="Search clients, projects, leads, or jump to…"
      />
      <CommandList aria-busy={loading}>
        {(loading || error) && <div role="status" className="px-4 py-3 text-sm text-muted-foreground">{error || "Searching…"}</div>}
        <CommandEmpty>
          {loading || error ? null : q.trim().length >= 2 ? "No matches." : "Type to search…"}
        </CommandEmpty>

        {hits.length > 0 && (
          <>
            <CommandGroup heading="Results">
              {hits.map((h) => {
                const Icon = iconFor(h.kind);
                return (
                  <CommandItem key={h.id} value={`${h.kind}-${h.label}-${h.id}`} keywords={[q.trim()]} onSelect={() => go(h.href)} className="gap-2">
                    <Icon className="h-4 w-4 opacity-70" />
                    <span className="flex-1 truncate">{h.label}</span>
                    {h.sub && <span className="ml-2 text-[10px] uppercase tracking-wider opacity-50">{h.sub}</span>}
                    <ArrowRight className="ml-2 h-3 w-3 opacity-40" />
                  </CommandItem>
                );
              })}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {grouped.map(([group, items], gi) => (
          <div key={group}>
            <CommandGroup heading={group}>
              {items.map((r) => {
                const Icon = r.icon;
                return (
                  <CommandItem key={r.href} value={`${group}-${r.label}`} onSelect={() => go(r.href)}>
                    <Icon className="mr-2 h-4 w-4 opacity-70" />
                    <span className="flex-1">{r.label}</span>
                    <span className="text-[10px] opacity-40 font-mono">{r.href}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
            {gi < grouped.length - 1 && <CommandSeparator />}
          </div>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
