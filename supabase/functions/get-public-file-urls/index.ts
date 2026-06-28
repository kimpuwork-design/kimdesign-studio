import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_IDS = 80;
const EXPIRES_IN = 300; // 5 minutes — long enough for a page session

/**
 * Batch public signed-URL endpoint. Accepts up to MAX_IDS file_asset_ids
 * and returns a map { [id]: signedUrl } for files whose project is public.
 * One round-trip replaces N calls of get-public-file-url.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { file_asset_ids } = await req.json();
    if (!Array.isArray(file_asset_ids) || file_asset_ids.length === 0) {
      return json({ error: "file_asset_ids[] required" }, 400);
    }
    const ids = file_asset_ids
      .filter((s) => typeof s === "string" && uuidRegex.test(s))
      .slice(0, MAX_IDS);
    if (ids.length === 0) return json({ urls: {} }, 200);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceRoleKey);

    // Fetch only files that belong to PUBLIC projects.
    const { data: rows, error } = await admin
      .from("file_assets")
      .select("id, storage_path, projects!inner(is_public)")
      .in("id", ids)
      .eq("is_deleted", false)
      .eq("projects.is_public", true);

    if (error || !rows) return json({ error: "Lookup failed" }, 500);

    const pathById = new Map<string, string>();
    rows.forEach((r) => pathById.set(r.id, r.storage_path));
    const paths = Array.from(pathById.values());
    if (paths.length === 0) return json({ urls: {} }, 200);

    // One bucket call signs every path.
    const { data: signed, error: signedErr } = await admin.storage
      .from("project-files")
      .createSignedUrls(paths, EXPIRES_IN);
    if (signedErr || !signed) return json({ error: "Signing failed" }, 500);

    const urlByPath = new Map<string, string>();
    signed.forEach((s) => { if (s.path && s.signedUrl) urlByPath.set(s.path, s.signedUrl); });

    const urls: Record<string, string> = {};
    pathById.forEach((path, id) => {
      const u = urlByPath.get(path);
      if (u) urls[id] = u;
    });

    return json({ urls, expiresIn: EXPIRES_IN }, 200);
  } catch (err) {
    console.error("Batch public file URL error:", err);
    return json({ error: "Internal server error" }, 500);
  }
});

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
