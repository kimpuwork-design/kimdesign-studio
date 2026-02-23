import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Public endpoint to get signed URLs for project files visible on
 * public project pages. Only serves files belonging to projects
 * explicitly marked as is_public = true.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { file_asset_id } = body;

    if (!file_asset_id || typeof file_asset_id !== "string") {
      return new Response(
        JSON.stringify({ error: "file_asset_id required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate UUID format to prevent enumeration
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(file_asset_id)) {
      return new Response(
        JSON.stringify({ error: "Invalid file_asset_id format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Lookup file - only non-deleted files from PUBLIC projects
    const { data: fileRow, error: fileError } = await adminClient
      .from("file_assets")
      .select("id, storage_path, is_deleted, project_id, projects!inner(is_public)")
      .eq("id", file_asset_id)
      .eq("is_deleted", false)
      .eq("projects.is_public", true)
      .maybeSingle();

    if (fileError || !fileRow) {
      return new Response(
        JSON.stringify({ error: "File not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate short-lived signed URL (60 seconds for public view)
    const expiresIn = 60;
    const { data: signedData, error: signedError } = await adminClient.storage
      .from("project-files")
      .createSignedUrl(fileRow.storage_path, expiresIn);

    if (signedError || !signedData?.signedUrl) {
      return new Response(
        JSON.stringify({ error: "Failed to generate URL" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ signedUrl: signedData.signedUrl, expiresIn }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Public file URL error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
