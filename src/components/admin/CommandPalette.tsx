import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog, CommandInput, CommandList, CommandEmpty,
  CommandGroup, CommandItem, CommandSeparator,
} from "@/components/ui/command";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard, BarChart3, Activity, Users, UserCog, Briefcase,
  PackageOpen, FileArchive, Receipt, FileText, Settings, ShieldCheck,
  ScrollText, Image as ImageIcon, Plus, Eye, ArrowRight,
} from "lucide-react";

type Variant = "admin" | "staff" | "client";

interface Hit {
  id: string;
  label: string;
  sub?: string;
  href: string;
  kind: "client" | "project" | "lead" | "portfolio";
}

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
    { group: "Create", label: "New Portfolio Item", href: "/admin/portfolio/new", icon: Plus },
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
  const [hits, setHits] = useState<Hit[]>([]);
  const [loading, setLoading] = useState(false);
  const latestTermRef = useRef("");

  // Reset query when closed
  useEffect(() => { if (!open) setQ(""); }, [open]);

  // Debounced live search across clients/projects/leads/portfolio (admin only)
  useEffect(() => {
    if (variant !== "admin") { setHits([]); return; }
    if (!q.trim() || q.length < 2) { setHits([]); setLoading(false); return; }
    const term = q.trim();
    latestTermRef.current = term;
    const handle = setTimeout(async () => {
      setLoading(true);
      const like = `%${term}%`;
      const [clients, projects, leads, portfolio] = await Promise.all([
        supabase.from("profiles").select("id, full_name").eq("role", "CLIENT").ilike("full_name", like).limit(5),
        supabase.from("projects").select("id, title, status").ilike("title", like).limit(6),
        supabase.from("leads").select("id, name, email, status").or(`name.ilike.${like},email.ilike.${like}`).limit(5),
        supabase.from("portfolio_items").select("id, title, category").ilike("title", like).limit(5),
      ]);
      // Guard against stale results overwriting newer searches.
      if (latestTermRef.current !== term) return;
      const out: Hit[] = [];
      (clients.data || []).forEach((c: any) =>
        out.push({ id: `c-${c.id}`, label: c.full_name || "(no name)", href: `/admin/clients`, kind: "client" }));
      (projects.data || []).forEach((p: any) =>
        out.push({ id: `p-${p.id}`, label: p.title, sub: p.status, href: `/admin/projects/${p.id}`, kind: "project" }));
      (leads.data || []).forEach((l: any) =>
        out.push({ id: `l-${l.id}`, label: l.name || l.email, sub: l.status, href: `/admin/leads`, kind: "lead" }));
      (portfolio.data || []).forEach((p: any) =>
        out.push({ id: `pf-${p.id}`, label: p.title, sub: p.category || "portfolio", href: `/admin/portfolio/${p.id}`, kind: "portfolio" }));
      setHits(out);
      setLoading(false);
    }, 180);
    return () => clearTimeout(handle);
  }, [q, variant]);

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

  const iconFor = (k: Hit["kind"]) => {
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
      <CommandList>
        <CommandEmpty>
          {loading ? "Searching…" : q.length >= 2 ? "No matches." : "Type to search…"}
        </CommandEmpty>

        {hits.length > 0 && (
          <>
            <CommandGroup heading="Results">
              {hits.map((h) => {
                const Icon = iconFor(h.kind);
                return (
                  <CommandItem key={h.id} value={`${h.kind}-${h.label}-${h.id}`} onSelect={() => go(h.href)}>
                    <Icon className="mr-2 h-4 w-4 opacity-70" />
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
