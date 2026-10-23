import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface AdminSearchHit {
  id: string;
  label: string;
  sub?: string;
  href: string;
  kind: "client" | "project" | "lead";
}

export function useAdminSearch(query: string, enabled: boolean) {
  const [hits, setHits] = useState<AdminSearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const term = query.trim();
    const controller = new AbortController();
    let active = true;
    setHits([]);
    setError(null);
    setLoading(enabled && term.length >= 2);
    if (!enabled || term.length < 2) return () => { active = false; };

    const timer = setTimeout(async () => {
      try {
        // Treat user input as literal text, including wildcards and OR punctuation.
        const like = `%${term.replace(/[\\%_]/g, "\\$&")}%`;
        const quotedLike = `"${like.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
        const [clients, projects, leads] = await Promise.all([
          supabase.from("profiles").select("id, full_name").eq("role", "CLIENT").ilike("full_name", like).limit(5).abortSignal(controller.signal),
          supabase.from("projects").select("id, title, status").ilike("title", like).limit(6).abortSignal(controller.signal),
          supabase.from("leads").select("id, name, email, status").or(`name.ilike.${quotedLike},email.ilike.${quotedLike}`).limit(5).abortSignal(controller.signal),
        ]);
        if (!active) return;
        if (clients.error || projects.error || leads.error) throw new Error("Search failed");
        const results: AdminSearchHit[] = [];
        (clients.data ?? []).forEach(c => results.push({ id: `c-${c.id}`, label: c.full_name || "(no name)", href: "/admin/clients", kind: "client" }));
        (projects.data ?? []).forEach(p => results.push({ id: `p-${p.id}`, label: p.title, sub: p.status, href: `/admin/projects/${p.id}`, kind: "project" }));
        (leads.data ?? []).forEach(l => results.push({ id: `l-${l.id}`, label: l.name || l.email, sub: l.status, href: "/admin/leads", kind: "lead" }));
        setHits(results);
      } catch {
        if (active) setError("Search couldn't load. Check your connection and try again.");
      } finally {
        if (active) setLoading(false);
      }
    }, 180);

    return () => {
      active = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, enabled]);

  return { hits, loading, error };
}