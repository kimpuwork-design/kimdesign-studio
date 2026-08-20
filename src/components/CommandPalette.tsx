import { useEffect, useState, useCallback, useMemo } from "react";
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
import { 
  Briefcase, Users, TrendingUp, Search, Settings, 
  LayoutDashboard, FileText, ArrowRight, UserCircle 
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  image?: string | null;
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
  const [loading, setLoading] = useState(false);

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
    setLoading(true);
    const term = `%${q}%`;

    const [projectsRes, clientsRes, leadsRes] = await Promise.all([
      supabase.from("projects").select("id, title, status, thumbnail_url").ilike("title", term).limit(5),
      supabase.from("profiles").select("id, full_name, company, avatar_url").eq("role", "CLIENT").or(`full_name.ilike.${term},company.ilike.${term}`).limit(5),
      supabase.from("leads").select("id, name, email").or(`name.ilike.${term},email.ilike.${term}`).limit(5),
    ]);

    const items: SearchResult[] = [
      ...(projectsRes.data ?? []).map((p) => ({
        id: p.id, 
        title: p.title, 
        subtitle: p.status, 
        image: p.thumbnail_url,
        href: `/admin/projects/${p.id}`, 
        type: "project" as const,
      })),
      ...(clientsRes.data ?? []).map((c) => ({
        id: c.id, 
        title: c.full_name ?? "Unnamed", 
        subtitle: c.company ?? undefined, 
        image: c.avatar_url,
        href: "/admin/clients", 
        type: "client" as const,
      })),
      ...(leadsRes.data ?? []).map((l) => ({
        id: l.id, 
        title: l.name, 
        subtitle: l.email, 
        href: "/admin/leads", 
        type: "lead" as const,
      })),
    ];
    setResults(items);
    setLoading(false);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => search(query), 200);
    return () => clearTimeout(t);
  }, [query, search]);

  const filteredPages = useMemo(() => {
    if (!query) return staticPages;
    return staticPages.filter(p => p.title.toLowerCase().includes(query.toLowerCase()));
  }, [query]);

  if (!isAdmin) return null;

  const iconMap = { 
    project: Briefcase, 
    client: Users, 
    lead: TrendingUp, 
    page: LayoutDashboard 
  };

  const handleSelect = (href: string) => {
    setOpen(false);
    setQuery("");
    navigate(href);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search projects, clients, leads or pages..." value={query} onValueChange={setQuery} />
      <CommandList className="scrollbar-none">
        <CommandEmpty>
          {loading ? (
            <div className="flex items-center justify-center py-6 gap-2 text-muted-foreground animate-pulse">
              <Search className="h-4 w-4" />
              <span>Searching context...</span>
            </div>
          ) : (
            "No matches found."
          )}
        </CommandEmpty>

        {results.length > 0 && (
          <CommandGroup heading="Recent Discoveries">
            {results.map((r) => {
              const Icon = iconMap[r.type];
              return (
                <CommandItem 
                  key={r.id} 
                  onSelect={() => handleSelect(r.href)}
                  className="group flex items-center gap-3 px-4 py-3"
                >
                  <div className="relative h-9 w-9 overflow-hidden rounded-lg bg-muted/50 border border-border/40 shrink-0">
                    {r.image ? (
                      <img src={r.image} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col min-w-0">
                    <span className="font-medium text-sm truncate">{r.title}</span>
                    {r.subtitle && <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium truncate">{r.subtitle}</span>}
                  </div>
                  <ArrowRight className="h-3 w-3 opacity-0 -translate-x-2 transition-all group-hover:opacity-40 group-hover:translate-x-0" />
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}

        {results.length > 0 && filteredPages.length > 0 && <CommandSeparator />}

        {filteredPages.length > 0 && (
          <CommandGroup heading="System Navigation">
            {filteredPages.map((p) => (
              <CommandItem 
                key={p.id} 
                onSelect={() => handleSelect(p.href)}
                className="group flex items-center gap-3 px-4 py-2"
              >
                <div className="h-4 w-4 flex items-center justify-center">
                  <LayoutDashboard className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <span className="flex-1 text-sm">{p.title}</span>
                <span className="text-[10px] font-mono text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity">
                  {p.href}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}