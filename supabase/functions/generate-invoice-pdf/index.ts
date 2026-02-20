import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Verify the user is ADMIN or STAFF
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (!profile || !["ADMIN", "STAFF"].includes(profile.role)) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { invoice_id } = await req.json();
    if (!invoice_id) {
      return new Response(JSON.stringify({ error: "invoice_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch invoice + items
    const { data: invoice } = await supabase
      .from("invoices")
      .select("*, projects(title, client_id, profiles(full_name, company))")
      .eq("id", invoice_id)
      .single();

    if (!invoice) {
      return new Response(JSON.stringify({ error: "Invoice not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: items } = await supabase
      .from("invoice_items")
      .select("*")
      .eq("invoice_id", invoice_id)
      .order("sort_order");

    // Fetch settings
    const { data: settings } = await supabase.from("settings").select("*").single();

    const fmt = (n: number, c: string) =>
      new Intl.NumberFormat("en-US", { style: "currency", currency: c }).format(n);

    const project = invoice.projects as any;
    const client = project?.profiles as any;
    const studio = settings as any;

    // Build HTML PDF content
    const itemRows = (items ?? []).map((item: any) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${item.description}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">${item.qty}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">${fmt(item.unit_price, invoice.currency)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:600;">${fmt(item.line_total, invoice.currency)}</td>
      </tr>
    `).join("");

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Invoice ${invoice.invoice_number}</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #111827; margin: 0; padding: 40px; background: #fff; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
  .studio-name { font-size: 24px; font-weight: 800; color: #111827; }
  .invoice-label { font-size: 32px; font-weight: 800; color: #6366f1; }
  .invoice-number { font-size: 14px; color: #6b7280; margin-top: 4px; }
  .meta { display: flex; gap: 40px; margin-bottom: 32px; }
  .meta-block h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #9ca3af; margin: 0 0 4px; }
  .meta-block p { font-size: 14px; color: #111827; margin: 0; font-weight: 500; }
  table { width: 100%; border-collapse: collapse; margin-top: 24px; }
  thead tr { background: #f9fafb; }
  th { padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; border-bottom: 2px solid #e5e7eb; }
  th:last-child, th:nth-child(3), th:nth-child(2) { text-align: right; }
  th:nth-child(2) { text-align: center; }
  .totals { margin-top: 24px; display: flex; justify-content: flex-end; }
  .totals-table { width: 280px; }
  .totals-table td { padding: 6px 12px; font-size: 14px; }
  .totals-table .total-row td { font-weight: 800; font-size: 16px; border-top: 2px solid #111827; padding-top: 10px; }
  .notes { margin-top: 32px; padding: 16px; background: #f9fafb; border-radius: 8px; font-size: 13px; color: #6b7280; }
  .footer { margin-top: 48px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; }
  .status-badge { display: inline-block; padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
  .status-sent { background: #fef3c7; color: #b45309; }
  .status-paid { background: #d1fae5; color: #065f46; }
  .status-draft { background: #f3f4f6; color: #6b7280; }
  .status-void { background: #f3f4f6; color: #9ca3af; }
</style>
</head>
<body>
  <div class="header">
    <div>
      ${studio?.logo_url ? `<img src="${studio.logo_url}" style="height:40px;margin-bottom:8px;" />` : ""}
      <div class="studio-name">${studio?.studio_name ?? "Studio"}</div>
      ${studio?.address ? `<div style="font-size:13px;color:#6b7280;margin-top:4px;">${studio.address}</div>` : ""}
      ${studio?.contact_email ? `<div style="font-size:13px;color:#6b7280;">${studio.contact_email}</div>` : ""}
    </div>
    <div style="text-align:right;">
      <div class="invoice-label">INVOICE</div>
      <div class="invoice-number">${invoice.invoice_number}</div>
      <div style="margin-top:12px;">
        <span class="status-badge status-${invoice.status}">${invoice.status}</span>
      </div>
    </div>
  </div>

  <div class="meta">
    <div class="meta-block">
      <h3>Bill To</h3>
      <p>${client?.full_name ?? "Client"}</p>
      ${client?.company ? `<p style="color:#6b7280;">${client.company}</p>` : ""}
    </div>
    <div class="meta-block">
      <h3>Project</h3>
      <p>${project?.title ?? "—"}</p>
    </div>
    <div class="meta-block">
      <h3>Issue Date</h3>
      <p>${new Date(invoice.issue_date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
    </div>
    ${invoice.due_date ? `
    <div class="meta-block">
      <h3>Due Date</h3>
      <p>${new Date(invoice.due_date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
    </div>` : ""}
  </div>

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th>Qty</th>
        <th>Unit Price</th>
        <th>Total</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
    </tbody>
  </table>

  <div class="totals">
    <table class="totals-table">
      <tr>
        <td style="color:#6b7280;">Subtotal</td>
        <td style="text-align:right;">${fmt(invoice.subtotal, invoice.currency)}</td>
      </tr>
      <tr>
        <td style="color:#6b7280;">Tax</td>
        <td style="text-align:right;">${fmt(invoice.tax, invoice.currency)}</td>
      </tr>
      <tr class="total-row">
        <td>Total</td>
        <td style="text-align:right;">${fmt(invoice.total, invoice.currency)}</td>
      </tr>
      ${invoice.paid_at ? `<tr><td colspan="2" style="text-align:right;color:#065f46;font-size:12px;padding-top:6px;">Paid on ${new Date(invoice.paid_at).toLocaleDateString()}</td></tr>` : ""}
    </table>
  </div>

  ${invoice.notes ? `<div class="notes"><strong>Notes:</strong> ${invoice.notes}</div>` : ""}

  <div class="footer">
    <p>Thank you for your business. Please contact us at ${studio?.contact_email ?? ""} with any questions.</p>
  </div>
</body>
</html>`;

    // Store HTML as file (clients can print/save as PDF from browser)
    const encoder = new TextEncoder();
    const htmlBytes = encoder.encode(html);
    const storagePath = `${invoice_id}/${invoice.invoice_number}.html`;

    const { error: uploadError } = await supabase.storage
      .from("invoice-pdfs")
      .upload(storagePath, htmlBytes, {
        contentType: "text/html",
        upsert: true,
      });

    if (uploadError) {
      return new Response(JSON.stringify({ error: uploadError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Save pdf_url to invoice
    await supabase.from("invoices").update({ pdf_url: storagePath }).eq("id", invoice_id);

    // Return signed URL (valid for 5 minutes)
    const { data: signedUrlData } = await supabase.storage
      .from("invoice-pdfs")
      .createSignedUrl(storagePath, 300);

    return new Response(
      JSON.stringify({ success: true, url: signedUrlData?.signedUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
