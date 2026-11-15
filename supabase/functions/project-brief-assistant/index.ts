import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createOpenAI } from "npm:@ai-sdk/openai@2";
import { streamText, Output, jsonSchema } from "npm:ai@5";
import { createLovableAiGatewayRunIdFetch, getLovableAiGatewayRunId } from "../_shared/run-id.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version, x-lovable-aig-run-id",
  "Access-Control-Expose-Headers": "X-Lovable-AIG-Run-ID",
};

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1";
const MODEL = "openai/gpt-6-astra";
const LANG_NAMES: Record<string, string> = { en: "English", my: "Burmese (Myanmar)", zo: "Zomi (Tedim Chin)" };

type Brief = {
  recommended_service: string;
  reason: string;
  brief_title: string;
  summary: string;
  scope: string[];
  deliverables: string[];
  questions: string[];
  next_step: string;
};

const briefSchema = jsonSchema<Brief>({
  type: "object",
  additionalProperties: false,
  required: ["recommended_service", "reason", "brief_title", "summary", "scope", "deliverables", "questions", "next_step"],
  properties: {
    recommended_service: { type: "string" },
    reason: { type: "string" },
    brief_title: { type: "string" },
    summary: { type: "string" },
    scope: { type: "array", items: { type: "string" } },
    deliverables: { type: "array", items: { type: "string" } },
    questions: { type: "array", items: { type: "string" } },
    next_step: { type: "string" },
  },
});

function json(body: unknown, status = 200, extra?: HeadersInit) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, ...(extra as Record<string, string>), "Content-Type": "application/json" },
  });
}

const clip = (s: unknown, n: number) => String(s ?? "").trim().slice(0, n);
const list = (a: unknown, max: number) =>
  (Array.isArray(a) ? a : []).map((x) => clip(x, 300)).filter(Boolean).slice(0, max);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let needs = "";
  let language = "en";
  try {
    const body = await req.json();
    needs = typeof body?.needs === "string" ? body.needs.trim() : "";
    language = typeof body?.language === "string" && LANG_NAMES[body.language] ? body.language : "en";
  } catch {
    return json({ error: "invalid_request" }, 400);
  }
  if (needs.length < 20 || needs.length > 2000) return json({ error: "needs_length" }, 400);

  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) return json({ error: "not_configured" }, 500);

  // Load the studio's real service list so recommendations match what is offered.
  let services: { title: string; desc?: string }[] = [];
  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data } = await supabase.from("site_content").select("content").eq("section", "services_full").maybeSingle();
    if (Array.isArray(data?.content)) {
      services = data!.content
        .filter((s: any) => s?.title)
        .map((s: any) => ({ title: clip(s.title, 120), desc: clip(s.desc, 400) }));
    }
  } catch (e) {
    console.error("services load failed", e);
  }
  const serviceText = services.length
    ? services.map((s, i) => `${i + 1}. ${s.title}${s.desc ? ` — ${s.desc}` : ""}`).join("\n")
    : "Architectural design, interior design, planning & permissions, technical drawings, sustainable design consultation.";

  const instructions = `You are the project intake assistant for an architecture and interior design studio based in Myanmar.
A website visitor describes their design project. Recommend the single best-fitting service from the studio's service list below and write a concise, professional project brief.

Studio services:
${serviceText}

Rules:
- recommended_service must be copied exactly from the service list titles${services.length ? "" : " (or a short service name)"}.
- reason: 1-2 sentences explaining why it fits.
- brief_title: short descriptive title (max 8 words).
- summary: 2-4 sentences restating the project goals, site/space, style and constraints the visitor mentioned. Never invent budgets, sizes or dates they did not give.
- scope: 3-6 short bullet items of design work involved.
- deliverables: 3-5 short bullet items the client would receive.
- questions: 2-4 short clarifying questions the studio should ask next (things missing from the description).
- next_step: one sentence inviting them to send the brief to the studio.
- Write every field in ${LANG_NAMES[language]}. Keep the service title as written in the list.
- If the text is not about a design/building project, still respond politely: set recommended_service to the closest service and use questions to ask what they need.`;

  const runIdFetch = createLovableAiGatewayRunIdFetch(getLovableAiGatewayRunId(req));
  const provider = createOpenAI({
    baseURL: GATEWAY_URL,
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runIdFetch.fetch,
  });

  let gatewayError: { status?: number; message?: string } | null = null;
  try {
    const result = streamText({
      model: provider.responses(MODEL),
      system: instructions,
      messages: [{ role: "user", content: needs }],
      experimental_output: Output.object({ schema: briefSchema }),
      abortSignal: req.signal,
      providerOptions: {
        openai: {
          store: false,
          forceReasoning: true,
          reasoningEffort: "low",
          reasoningSummary: "auto",
          include: ["reasoning.encrypted_content"],
        },
      },
      onError: ({ error }: any) => {
        gatewayError = { status: error?.statusCode, message: error?.responseBody ?? error?.message };
      },
    });

    const text = await result.text;
    let parsed: Brief;
    try {
      parsed = JSON.parse(text);
    } catch {
      if (gatewayError) throw gatewayError;
      throw new Error("no_brief");
    }

    const runId = runIdFetch.getRunId();
    return json(
      {
        brief: {
          recommended_service: clip(parsed.recommended_service, 120),
          reason: clip(parsed.reason, 600),
          brief_title: clip(parsed.brief_title, 120),
          summary: clip(parsed.summary, 1200),
          scope: list(parsed.scope, 6),
          deliverables: list(parsed.deliverables, 5),
          questions: list(parsed.questions, 4),
          next_step: clip(parsed.next_step, 300),
        },
      },
      200,
      runId ? { "X-Lovable-AIG-Run-ID": runId } : undefined,
    );
  } catch (err: any) {
    if (err?.name === "AbortError") return json({ error: "aborted" }, 499);
    const status = err?.statusCode ?? err?.status ?? (gatewayError as any)?.status;
    console.error("brief assistant failed", status, err?.responseBody ?? err?.message ?? err);
    if (status === 429) return json({ error: "rate_limited" }, 429);
    if (status === 402) return json({ error: "credits" }, 402);
    if (status === 403) return json({ error: "unavailable" }, 403);
    return json({ error: "failed" }, 502);
  }
});
