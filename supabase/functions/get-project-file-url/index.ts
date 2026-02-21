import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1) Authenticate caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // User client (respects RLS)
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify JWT
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const userId = claimsData.claims.sub as string;

    // 2) Parse input
    const body = await req.json();
    const { file_asset_id, storage_path } = body;

    if (!file_asset_id && !storage_path) {
      return new Response(
        JSON.stringify({ error: "file_asset_id or storage_path required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3) Lookup file_assets row (using user client so RLS applies)
    let query = userClient.from("file_assets").select("id, project_id, storage_path, is_deleted");

    if (file_asset_id) {
      query = query.eq("id", file_asset_id);
    } else {
      query = query.eq("storage_path", storage_path);
    }

    const { data: fileRow, error: fileError } = await query.maybeSingle();

    if (fileError || !fileRow) {
      return new Response(
        JSON.stringify({ error: "File not found or access denied" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (fileRow.is_deleted) {
      return new Response(
        JSON.stringify({ error: "File has been deleted" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4) Verify project access via DB function (double-check beyond RLS)
    const { data: hasAccess, error: accessError } = await userClient.rpc(
      "user_has_project_access",
      { _project_id: fileRow.project_id, _user_id: userId }
    );

    if (accessError || !hasAccess) {
      return new Response(
        JSON.stringify({ error: "Access denied to this project" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5) Generate signed URL using service role (bypasses storage RLS)
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const expiresIn = 300; // 5 minutes

    const { data: signedData, error: signedError } = await adminClient.storage
      .from("project-files")
      .createSignedUrl(fileRow.storage_path, expiresIn);

    if (signedError || !signedData?.signedUrl) {
      console.error("Signed URL error:", signedError);
      return new Response(
        JSON.stringify({ error: "Failed to generate signed URL" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 6) Return signed URL
    return new Response(
      JSON.stringify({
        signedUrl: signedData.signedUrl,
        expiresIn,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
