import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Loader2, ArrowRight, RotateCcw, CheckCircle2, HelpCircle, Package } from "lucide-react";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "@/i18n/LanguageContext";
import { SectionLabel } from "@/components/SectionLabel";
import type { Language } from "@/i18n/types";

export type ProjectBrief = {
  recommended_service: string;
  reason: string;
  brief_title: string;
  summary: string;
  scope: string[];
  deliverables: string[];
  questions: string[];
  next_step: string;
};

const MIN = 20;
const MAX = 2000;

const COPY: Record<Language, Record<string, string>> = {
  en: {
    label: "AI Project Brief",
    title: "Not sure which service you need?",
    intro: "Describe your project in your own words — the space, location, style and what you hope for. Our AI assistant suggests the right service and drafts a project brief you can send to the studio.",
    field: "Your project needs",
    placeholder: "e.g. I want to build a 2-storey family house in Yangon on a 40×60 ft plot, modern tropical style with 4 bedrooms…",
    submit: "Get my brief",
    loading: "Preparing your brief… this can take up to 30 seconds.",
    tooShort: `Please write at least ${MIN} characters so we can understand your project.`,
    service: "Recommended service",
    scope: "Scope of work",
    deliverables: "What you'd receive",
    questions: "Questions we'd ask next",
    send: "Send this brief to the studio",
    again: "Start over",
    note: "AI-generated suggestion — the studio will confirm details with you.",
    err_failed: "We couldn't prepare your brief right now. Please try again in a moment.",
    err_rate_limited: "Many people are using the assistant right now. Please wait a minute and try again.",
    err_credits: "The assistant is temporarily unavailable. You can still contact the studio directly.",
    err_unavailable: "The assistant is temporarily unavailable. You can still contact the studio directly.",
  },
  my: {
    label: "AI ပရောဂျက်အကျဉ်းချုပ်",
    title: "ဘယ်ဝန်ဆောင်မှု လိုအပ်လဲ မသေချာဘူးလား?",
    intro: "သင့်ပရောဂျက်အကြောင်း — နေရာ၊ တည်နေရာ၊ ပုံစံနဲ့ လိုချင်တာတွေကို ကိုယ့်စကားနဲ့ ရေးပါ။ AI က သင့်တော်တဲ့ဝန်ဆောင်မှုကို အကြံပြုပြီး စတူဒီယိုကို ပို့နိုင်မယ့် ပရောဂျက်အကျဉ်းချုပ် ရေးပေးပါမယ်။",
    field: "သင့်ပရောဂျက် လိုအပ်ချက်များ",
    placeholder: "ဥပမာ - ရန်ကုန်မှာ ၄၀×၆၀ ပေ မြေကွက်ပေါ် အိပ်ခန်း ၄ ခန်းပါ ခေတ်မီ နှစ်ထပ်အိမ် ဆောက်ချင်ပါတယ်…",
    submit: "အကျဉ်းချုပ် ရယူမယ်",
    loading: "အကျဉ်းချုပ် ပြင်ဆင်နေပါတယ်… စက္ကန့် ၃၀ ခန့် ကြာနိုင်ပါတယ်။",
    tooShort: `သင့်ပရောဂျက်ကို နားလည်နိုင်အောင် အနည်းဆုံး စာလုံး ${MIN} လုံး ရေးပေးပါ။`,
    service: "အကြံပြု ဝန်ဆောင်မှု",
    scope: "လုပ်ငန်းအတိုင်းအတာ",
    deliverables: "သင်ရရှိမယ့်အရာများ",
    questions: "နောက်ထပ် မေးမယ့်မေးခွန်းများ",
    send: "ဒီအကျဉ်းချုပ်ကို စတူဒီယိုသို့ ပို့မယ်",
    again: "ပြန်စမယ်",
    note: "AI အကြံပြုချက်ဖြစ်ပါတယ် — အသေးစိတ်ကို စတူဒီယိုက သင်နဲ့ အတည်ပြုပါမယ်။",
    err_failed: "အခု အကျဉ်းချုပ် မပြင်ဆင်နိုင်သေးပါ။ ခဏနေ ပြန်ကြိုးစားပါ။",
    err_rate_limited: "အသုံးပြုသူ များနေပါတယ်။ တစ်မိနစ်လောက်စောင့်ပြီး ပြန်ကြိုးစားပါ။",
    err_credits: "AI ကို ယာယီ အသုံးမပြုနိုင်ပါ။ စတူဒီယိုကို တိုက်ရိုက် ဆက်သွယ်နိုင်ပါတယ်။",
    err_unavailable: "AI ကို ယာယီ အသုံးမပြုနိုင်ပါ။ စတူဒီယိုကို တိုက်ရိုက် ဆက်သွယ်နိုင်ပါတယ်။",
  },
  zo: {
    label: "AI Project Brief",
    title: "Service bang na kisam hiam na theih kei maw?",
    intro: "Na project tawh kisai — mun, place, style le na deih te na kammal tawh gelh in. AI in na kisap service genkhia in studio-ah na khak theih ding project brief a gelh sak ding hi.",
    field: "Na project kisapna te",
    placeholder: "Entehna: Yangon ah 40×60 ft lei tungah innbu 4 pai, nihthuah inn lam ka ut hi…",
    submit: "Ka brief la ning",
    loading: "Na brief bawl lai hi… second 30 bang a sau thei hi.",
    tooShort: `Na project ka theihsiam theih nadingin laimal ${MIN} tal gelh in.`,
    service: "Genkhiat service",
    scope: "Nasep tawh kisai",
    deliverables: "Na ngah ding te",
    questions: "Kong dot zel ding te",
    send: "Hih brief studio-ah khak ning",
    again: "Kipan kik ning",
    note: "AI genkhiatna hi — studio in a kicing in nangma tawh kikum ding hi.",
    err_failed: "Tu in na brief bawl thei nai lo hi. Tomkal khit ciangin sin kik in.",
    err_rate_limited: "Mi tampi in zang lai uh hi. Minute khat ngak in sin kik in.",
    err_credits: "Assistant zat theih nai lo hi. Studio tawh a tangtakin kizopna nei thei hi.",
    err_unavailable: "Assistant zat theih nai lo hi. Studio tawh a tangtakin kizopna nei thei hi.",
  },
};

export function briefToMessage(brief: ProjectBrief, needs: string) {
  const lines = [
    `${brief.brief_title}`,
    "",
    brief.summary,
    "",
    `Recommended service: ${brief.recommended_service}`,
    ...(brief.scope.length ? ["", "Scope:", ...brief.scope.map((s) => `• ${s}`)] : []),
    "",
    "Original description:",
    needs,
  ];
  return lines.join("\n").slice(0, MAX);
}

export function ProjectBriefAssistant() {
  const { language } = useTranslation();
  const c = COPY[language] ?? COPY.en;
  const navigate = useNavigate();
  const [needs, setNeeds] = useState("");
  const [brief, setBrief] = useState<ProjectBrief | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    const text = needs.trim();
    if (text.length < MIN) { setError(c.tooShort); return; }
    setError(null);
    setLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("project-brief-assistant", {
        body: { needs: text.slice(0, MAX), language },
      });
      if (fnError) {
        let code = "failed";
        if (fnError instanceof FunctionsHttpError) {
          try { code = (await fnError.context.json())?.error ?? "failed"; } catch { /* keep default */ }
        }
        if (code === "needs_length") { setError(c.tooShort); return; }
        setError(c[`err_${code}`] ?? c.err_failed);
        return;
      }
      if (!data?.brief) { setError(c.err_failed); return; }
      setBrief(data.brief as ProjectBrief);
      requestAnimationFrame(() => resultRef.current?.focus());
    } catch {
      setError(c.err_failed);
    } finally {
      setLoading(false);
    }
  };

  const sendToStudio = () => {
    if (!brief) return;
    navigate("/contact", { state: { briefMessage: briefToMessage(brief, needs.trim()), projectType: brief.recommended_service } });
  };

  return (
    <section className="border-t border-border/30 py-16 md:py-24" aria-labelledby="brief-assistant-title">
      <div className="container">
        <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-5">
            <SectionLabel text={c.label} />
            <h2 id="brief-assistant-title" className="font-display text-3xl md:text-5xl text-foreground leading-[1.05]">{c.title}</h2>
            <p className="mt-5 text-muted-foreground text-base font-light leading-[1.8] max-w-md">{c.intro}</p>
          </div>

          <div className="lg:col-span-7">
            {!brief ? (
              <form onSubmit={submit} className="liquid-glass rounded-[2rem] p-6 md:p-8 space-y-5" noValidate>
                <div className="space-y-2">
                  <Label htmlFor="brief-needs" className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground">{c.field}</Label>
                  <Textarea
                    id="brief-needs"
                    rows={6}
                    maxLength={MAX}
                    value={needs}
                    disabled={loading}
                    placeholder={c.placeholder}
                    aria-invalid={!!error}
                    aria-describedby={error ? "brief-error" : "brief-count"}
                    onChange={(e) => { setNeeds(e.target.value); if (error) setError(null); }}
                    className="rounded-2xl resize-none border-foreground/10 bg-background/50"
                  />
                  <p id="brief-count" className="text-right text-[11px] text-muted-foreground/70 tabular-nums">{needs.length}/{MAX}</p>
                </div>
                {error && <p id="brief-error" role="alert" className="text-sm text-destructive">{error}</p>}
                {loading && <p role="status" className="text-sm text-muted-foreground">{c.loading}</p>}
                <Button type="submit" disabled={loading} className="rounded-full px-8 h-12 tracking-[0.12em] text-xs uppercase w-full sm:w-auto">
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> : <Sparkles className="mr-2 h-4 w-4" aria-hidden />}
                  {c.submit}
                </Button>
              </form>
            ) : (
              <div ref={resultRef} tabIndex={-1} className="liquid-glass rounded-[2rem] p-6 md:p-8 space-y-6 outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-live="polite">
                <div>
                  <p className="text-[10px] tracking-[0.25em] uppercase text-primary font-mono-label">{c.service}</p>
                  <p className="mt-2 font-display text-2xl md:text-3xl text-foreground">{brief.recommended_service}</p>
                  <p className="mt-2 text-sm text-muted-foreground leading-[1.8]">{brief.reason}</p>
                </div>
                <div className="border-t border-border/40 pt-5">
                  <h3 className="font-display text-xl text-foreground">{brief.brief_title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-[1.9]">{brief.summary}</p>
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <BriefList icon={CheckCircle2} title={c.scope} items={brief.scope} />
                  <BriefList icon={Package} title={c.deliverables} items={brief.deliverables} />
                </div>
                {brief.questions.length > 0 && <BriefList icon={HelpCircle} title={c.questions} items={brief.questions} />}
                {brief.next_step && <p className="text-sm text-foreground/80">{brief.next_step}</p>}
                <div className="flex flex-col sm:flex-row gap-3 pt-1">
                  <Button onClick={sendToStudio} className="rounded-full px-8 h-12 tracking-[0.12em] text-xs uppercase">
                    {c.send} <ArrowRight size={14} className="ml-2" aria-hidden />
                  </Button>
                  <Button variant="outline" onClick={() => setBrief(null)} className="rounded-full px-6 h-12 text-xs uppercase tracking-[0.12em]">
                    <RotateCcw size={14} className="mr-2" aria-hidden /> {c.again}
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground/70">{c.note}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function BriefList({ icon: Icon, title, items }: { icon: typeof CheckCircle2; title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div>
      <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-3">{title}</p>
      <ul className="space-y-2">
        {items.map((it, i) => (
          <li key={i} className="flex gap-2 text-sm text-foreground/85 leading-[1.7]">
            <Icon size={15} className="mt-1 shrink-0 text-primary" aria-hidden />
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
