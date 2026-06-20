import { createClient } from "npm:@supabase/supabase-js@2";
// @ts-ignore — mupdf has no Deno-friendly types but works via npm specifier
import * as mupdf from "npm:mupdf@1.3.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MAX_PDF_BYTES = 150 * 1024 * 1024; // 150 MB
const MAX_PAGES = 40;
const RENDER_SCALE = 1.1; // ~100 DPI — keep memory low for big PDFs
const JPEG_QUALITY = 78;

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

async function downloadDrivePdf(fileId: string): Promise<Uint8Array> {
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
  const buf = new Uint8Array(await res.arrayBuffer());
  if (buf.length > MAX_PDF_BYTES) {
    throw new Error(
      `PDF is ${(buf.length / 1024 / 1024).toFixed(1)} MB. Maximum allowed is ${MAX_PDF_BYTES / 1024 / 1024} MB.`
    );
  }
  // Basic sanity check
  if (buf.length < 5 || String.fromCharCode(...buf.slice(0, 4)) !== "%PDF") {
    throw new Error("Downloaded file is not a valid PDF.");
  }
  return buf;
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

    // 3) Download PDF
    const pdfBytes = await downloadDrivePdf(fileId);

    // 4) Render with mupdf
    const doc = mupdf.Document.openDocument(pdfBytes, "application/pdf");
    const totalPages: number = doc.countPages();
    if (totalPages < 1) {
      throw new Error("PDF has no pages.");
    }
    const pagesToRender = Math.min(totalPages, MAX_PAGES);

    // Optional cleanup of previous import for this project (only PDF-imported rows)
    if (replace) {
      // Delete previous gallery rows whose image_url is in our pdf-pages folder for this project
      const prefix = `pdf-pages/${projectId}/`;
      const { data: existing } = await admin
        .from("portfolio_gallery")
        .select("id, image_url")
        .eq("project_id", projectId);
      const toDelete = (existing ?? []).filter((r) => r.image_url.includes(prefix));
      if (toDelete.length > 0) {
        await admin
          .from("portfolio_gallery")
          .delete()
          .in("id", toDelete.map((r) => r.id));
      }
      // Best-effort storage cleanup (list + remove)
      try {
        const { data: files } = await admin.storage.from("portfolio").list(prefix.replace(/\/$/, ""), { limit: 1000 });
        if (files && files.length > 0) {
          await admin.storage.from("portfolio").remove(files.map((f) => `${prefix}${f.name}`));
        }
      } catch (_) {
        // ignore
      }
    }

    // Existing max sort_order
    const { data: lastRows } = await admin
      .from("portfolio_gallery")
      .select("sort_order")
      .eq("project_id", projectId)
      .order("sort_order", { ascending: false })
      .limit(1);
    const baseOrder =
      lastRows && lastRows.length > 0 ? (lastRows[0].sort_order ?? 0) + 1 : 0;

    const importId = crypto.randomUUID().slice(0, 8);
    const insertedIds: string[] = [];
    const matrix = mupdf.Matrix.scale(RENDER_SCALE, RENDER_SCALE);

    for (let i = 0; i < pagesToRender; i++) {
      const page = doc.loadPage(i);
      const pixmap = page.toPixmap(matrix, mupdf.ColorSpace.DeviceRGB, false, true);
      const pngBytes: Uint8Array = pixmap.asPNG();
      pixmap.destroy?.();
      page.destroy?.();

      const pageNum = String(i + 1).padStart(3, "0");
      const path = `pdf-pages/${projectId}/${importId}/page-${pageNum}.png`;

      const { error: upErr } = await admin.storage
        .from("portfolio")
        .upload(path, pngBytes, {
          contentType: "image/png",
          upsert: true,
          cacheControl: "31536000",
        });
      if (upErr) {
        console.error("upload error", path, upErr.message);
        throw new Error(`Upload failed on page ${i + 1}: ${upErr.message}`);
      }

      const { data: pub } = admin.storage.from("portfolio").getPublicUrl(path);
      const publicUrl = pub.publicUrl;

      const { data: inserted, error: insErr } = await admin
        .from("portfolio_gallery")
        .insert({
          project_id: projectId,
          image_url: publicUrl,
          sort_order: baseOrder + i,
          caption: `Page ${i + 1}`,
        })
        .select("id")
        .single();
      if (insErr) {
        console.error("insert error", insErr.message);
        throw new Error(`Database insert failed on page ${i + 1}: ${insErr.message}`);
      }
      insertedIds.push(inserted!.id);
    }

    doc.destroy?.();

    return new Response(
      JSON.stringify({
        success: true,
        imported: insertedIds.length,
        total_pages: totalPages,
        truncated: totalPages > MAX_PAGES,
        gallery_ids: insertedIds,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("import-drive-pdf error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
