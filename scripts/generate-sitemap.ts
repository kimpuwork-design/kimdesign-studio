/**
 * Generates public/sitemap.xml before `vite dev` and `vite build`.
 * Lists static public routes + every published project from the database.
 */
import { writeFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

const BASE_URL = "https://kimdesign-studio.lovable.app";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;

interface Entry {
  path: string;
  lastmod?: string;
  changefreq?:
    | "always"
    | "hourly"
    | "daily"
    | "weekly"
    | "monthly"
    | "yearly"
    | "never";
  priority?: string;
}

const staticEntries: Entry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/portfolio", changefreq: "weekly", priority: "0.9" },
  { path: "/services", changefreq: "monthly", priority: "0.7" },
  { path: "/about", changefreq: "monthly", priority: "0.6" },
  { path: "/contact", changefreq: "monthly", priority: "0.5" },
];

async function fetchProjectEntries(): Promise<Entry[]> {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.warn("[sitemap] Skipping projects — Supabase env vars missing.");
    return [];
  }
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const { data, error } = await supabase
      .from("projects")
      .select("slug, id, updated_at")
      .eq("is_public", true)
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return (data ?? [])
      .filter((p) => p.slug)
      .map((p) => ({
        path: `/portfolio/${p.slug}`,
        lastmod: p.updated_at?.slice(0, 10),
        changefreq: "monthly" as const,
        priority: "0.8",
      }));
  } catch (err) {
    console.warn("[sitemap] Failed to fetch projects:", (err as Error).message);
    return [];
  }
}

function build(entries: Entry[]) {
  const urls = entries.map((e) =>
    [
      `  <url>`,
      `    <loc>${BASE_URL}${e.path}</loc>`,
      e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      `  </url>`,
    ]
      .filter(Boolean)
      .join("\n"),
  );
  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls,
    `</urlset>`,
    "",
  ].join("\n");
}

async function main() {
  const dynamic = await fetchProjectEntries();
  const all = [...staticEntries, ...dynamic];
  writeFileSync(resolve("public/sitemap.xml"), build(all));
  console.log(`[sitemap] wrote ${all.length} entries (${dynamic.length} projects)`);
}

main().catch((err) => {
  console.error("[sitemap] error:", err);
  // Fail soft — never block dev/build.
  writeFileSync(resolve("public/sitemap.xml"), build(staticEntries));
  process.exit(0);
});
