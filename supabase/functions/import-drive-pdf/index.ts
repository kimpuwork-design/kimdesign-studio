import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MAX_PDF_BYTES = 150 * 1024 * 1024; // 150 MB

function extractDriveFileId(input: string): string | null {
  const url = input.trim();
  // /file/d/{id}/...
  const m1 = url.match(/\/file\/d\/([A-Za-z0-9_-]{20,})/);
  if (m1) return m1[1];
  // ?id={id} or &id={id}
  const m2 = url.match(/[?&]id=([A-Za-z0-9_-]{20,})/);
  if (m2) return m2[1];
  // /d/{id}
  const m3 = url.match(/\/d\/([A-Za-z0-9_-]{20,})/);
  if (m3) return m3[1];
  // raw id
  if (/^[A-Za-z0-9_-]{20,}$/.test(url)) return url;
  return null;
}

async function getDrivePdfResponse(fileId: string): Promise<Response> {
  const base = `https://drive.usercontent.google.com/download?id=${fileId}&export=download`;
  let res = await fetch(base, { redirect: "follow" });
  let ctype = res.headers.get("content-type") ?? "";

  // Large files trigger an HTML "virus scan" confirmation page — parse and retry with confirm token
  if (ctype.includes("text/html")) {
    const html = await res.text();
    const confirm = html.match(/name="confirm"\s+value="([^"]+)"/)?.[1]
      || html.match(/confirm=([0-9A-Za-z_-]+)/)?.[1];
    const uuid = html.match(/name="uuid"\s+value="([^"]+)"/)?.[1];
    if (confirm) {
      const params = new URLSearchParams({ id: fileId, export: "download", confirm });
      if (uuid) params.set("uuid", uuid);
      res = await fetch(`https://drive.usercontent.google.com/download?${params}`, { redirect: "follow" });
      ctype = res.headers.get("content-type") ?? "";
    }
  }

  if (!res.ok) {
    throw new Error(
      `Drive download failed (${res.status}). Make sure the link sharing is set to "Anyone with the link".`
    );
  }
  if (ctype.includes("text/html")) {
    throw new Error(
      "Drive returned an HTML page instead of the PDF. Make sure the file is shared as 'Anyone with the link'."
    );
  }
  const contentLength = Number(res.headers.get("content-length") ?? "0");
  if (contentLength > MAX_PDF_BYTES) {
    throw new Error(
      `PDF is ${(contentLength / 1024 / 1024).toFixed(1)} MB. Maximum allowed is ${MAX_PDF_BYTES / 1024 / 1024} MB.`
    );
  }
  return res;
}

async function clearPreviousPdfImports(admin: ReturnType<typeof createClient>, projectId: string) {
  const prefix = `pdf-pages/${projectId}/`;
  const { data: existing } = await admin
    .from("portfolio_gallery")
    .select("id, image_url")
    .eq("project_id", projectId);
  const toDelete = (existing ?? []).filter((r) => String(r.image_url).includes(prefix));
  if (toDelete.length > 0) {
    await admin
      .from("portfolio_gallery")
      .delete()
      .in("id", toDelete.map((r) => r.id));
  }

  try {
    const root = `pdf-pages/${projectId}`;
    const { data: folders } = await admin.storage.from("portfolio").list(root, { limit: 1000 });
    const paths: string[] = [];
    for (const folder of folders ?? []) {
      const folderPath = `${root}/${folder.name}`;
      const { data: files } = await admin.storage.from("portfolio").list(folderPath, { limit: 1000 });
      for (const file of files ?? []) paths.push(`${folderPath}/${file.name}`);
    }
    if (paths.length > 0) await admin.storage.from("portfolio").remove(paths);
  } catch (_) {
    // Best-effort cleanup only.
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1) Auth: require ADMIN or STAFF
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsErr } = await userClient.auth.getClaims(token);
    if (claimsErr || !claims?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claims.claims.sub as string;

    const admin = createClient(supabaseUrl, serviceRole);

    const { data: profile } = await admin
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();
    if (!profile || !["ADMIN", "STAFF"].includes(profile.role)) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2) Parse + validate input
    const body = await req.json().catch(() => null);
    const projectId = body?.project_id;
    const driveUrl = body?.drive_url;
    const replace = body?.replace === true;

    if (typeof projectId !== "string" || !/^[0-9a-f-]{36}$/i.test(projectId)) {
      return new Response(JSON.stringify({ error: "Invalid project_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (typeof driveUrl !== "string" || driveUrl.length > 2000) {
      return new Response(JSON.stringify({ error: "Invalid drive_url" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const fileId = extractDriveFileId(driveUrl);
    if (!fileId) {
      return new Response(
        JSON.stringify({
          error:
            "Could not find a Google Drive file ID in that URL. Use a link that looks like https://drive.google.com/file/d/FILE_ID/view",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify project exists
    const { data: proj, error: projErr } = await admin
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .maybeSingle();
    if (projErr || !proj) {
      return new Response(JSON.stringify({ error: "Project not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (replace) await clearPreviousPdfImports(admin, projectId);

    // Stream the PDF back to the browser. Rendering happens client-side to avoid Edge memory limits.
    const pdfResponse = await getDrivePdfResponse(fileId);
    return new Response(pdfResponse.body, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/pdf",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("import-drive-pdf error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
