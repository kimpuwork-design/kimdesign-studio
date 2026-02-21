import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import { Briefcase, Users, TrendingUp, Search, Settings, LayoutDashboard, FileText } from "lucide-react";

interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  href: string;
  type: "project" | "client" | "lead" | "page";
}

const staticPages: SearchResult[] = [
  { id: "dash", title: "Dashboard", href: "/admin", type: "page" },
  { id: "leads", title: "Leads", href: "/admin/leads", type: "page" },
  { id: "clients", title: "Clients", href: "/admin/clients", type: "page" },
  { id: "projects", title: "Projects", href: "/admin/projects", type: "page" },
  { id: "invoices", title: "Invoices", href: "/admin/invoices", type: "page" },
  { id: "quotes", title: "Quotes", href: "/admin/quotes", type: "page" },
  { id: "settings", title: "Settings", href: "/admin/settings", type: "page" },
  { id: "team", title: "Team", href: "/admin/team", type: "page" },
  { id: "portfolio", title: "Portfolio", href: "/admin/portfolio", type: "page" },
  { id: "files", title: "Files", href: "/admin/files", type: "page" },
  { id: "audit", title: "Audit Logs", href: "/admin/audit-logs", type: "page" },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [results, setResults] = useState<SearchResult[]>([]);
  const [query, setQuery] = useState("");

  // Only show for admin users
  const isAdmin = profile?.role === "ADMIN";

  // Keyboard shortcut
  useEffect(() => {
    if (!isAdmin) return;
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isAdmin]);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    const term = `%${q}%`;

    const [projectsRes, clientsRes, leadsRes] = await Promise.all([
      supabase.from("projects").select("id, title, status").ilike("title", term).limit(5),
      supabase.from("profiles").select("id, full_name, company").eq("role", "CLIENT").or(`full_name.ilike.${term},company.ilike.${term}`).limit(5),
      supabase.from("leads").select("id, name, email").or(`name.ilike.${term},email.ilike.${term}`).limit(5),
    ]);

    const items: SearchResult[] = [
      ...(projectsRes.data ?? []).map((p) => ({
        id: p.id, title: p.title, subtitle: p.status, href: `/admin/projects/${p.id}`, type: "project" as const,
      })),
      ...(clientsRes.data ?? []).map((c) => ({
        id: c.id, title: c.full_name ?? "Unnamed", subtitle: c.company ?? undefined, href: "/admin/clients", type: "client" as const,
      })),
      ...(leadsRes.data ?? []).map((l) => ({
        id: l.id, title: l.name, subtitle: l.email, href: "/admin/leads", type: "lead" as const,
      })),
    ];
    setResults(items);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => search(query), 200);
    return () => clearTimeout(t);
  }, [query, search]);

  if (!isAdmin) return null;

  const iconMap = { project: Briefcase, client: Users, lead: TrendingUp, page: LayoutDashboard };

  const handleSelect = (href: string) => {
    setOpen(false);
    setQuery("");
    navigate(href);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search projects, clients, leads…" value={query} onValueChange={setQuery} />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {results.length > 0 && (
          <CommandGroup heading="Search Results">
            {results.map((r) => {
              const Icon = iconMap[r.type];
              return (
                <CommandItem key={r.id} onSelect={() => handleSelect(r.href)}>
                  <Icon className="mr-2 h-4 w-4 text-muted-foreground" />
                  <div>
                    <span>{r.title}</span>
                    {r.subtitle && <span className="ml-2 text-xs text-muted-foreground">{r.subtitle}</span>}
                  </div>
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}

        <CommandSeparator />

        <CommandGroup heading="Pages">
          {staticPages.filter(p => !query || p.title.toLowerCase().includes(query.toLowerCase())).map((p) => (
            <CommandItem key={p.id} onSelect={() => handleSelect(p.href)}>
              <LayoutDashboard className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>{p.title}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
