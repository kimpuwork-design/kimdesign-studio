import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import { LineItemsEditor, LineItem } from "./LineItemsEditor";
import { writeAuditLog } from "@/lib/audit";

interface Props {
  projectId: string;
  onClose: () => void;
  onSaved: () => void;
}

const CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD"];

export function QuoteModal({ projectId, onClose, onSaved }: Props) {
  const { profile } = useAuth();
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [taxPct, setTaxPct] = useState(0);
  const [items, setItems] = useState<LineItem[]>([
    { description: "", qty: 1, unit_price: 0, line_total: 0, sort_order: 0 },
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const subtotal = items.reduce((s, i) => s + i.line_total, 0);
  const tax = parseFloat((subtotal * taxPct / 100).toFixed(2));
  const total = parseFloat((subtotal + tax).toFixed(2));

  const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency }).format(n);

  const save = async (status: "draft" | "sent") => {
    if (!profile) return;
    if (!title.trim()) { setError("Title is required"); return; }
    if (items.some(i => !i.description.trim())) { setError("All items need a description"); return; }
    setSaving(true);
    setError("");

    const { data: quote, error: qErr } = await supabase.from("quotes").insert({
      project_id: projectId,
      created_by: profile.id,
      title: title.trim(),
      notes: notes.trim() || null,
      currency,
      status,
      subtotal,
      tax,
      total,
    }).select().single();

    if (qErr || !quote) { setError(qErr?.message ?? "Failed to save quote"); setSaving(false); return; }

    const itemRows = items.map((item, idx) => ({
      quote_id: quote.id,
      description: item.description,
      qty: item.qty,
      unit_price: item.unit_price,
      line_total: item.line_total,
      sort_order: idx,
    }));

    const { error: iErr } = await supabase.from("quote_items").insert(itemRows);
    if (iErr) { setError(iErr.message); setSaving(false); return; }

    await writeAuditLog({
      actor_id: profile.id,
      action: status === "sent" ? "quote_sent" : "quote_created",
      entity_type: "quote",
      entity_id: quote.id,
      metadata: { project_id: projectId, title: title.trim() },
    });

    setSaving(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-portal-bg border border-portal-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-portal-border">
          <h2 className="font-display text-lg font-bold text-portal-text">New Quote</h2>
          <button onClick={onClose} className="text-portal-text-muted hover:text-portal-text"><X size={18} /></button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label className="text-portal-text-muted text-xs mb-1">Title *</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Photography Package Q1" className="bg-portal-bg border-portal-border" />
            </div>
            <div>
              <Label className="text-portal-text-muted text-xs mb-1">Currency</Label>
              <select value={currency} onChange={e => setCurrency(e.target.value)}
                className="w-full h-10 rounded-md border border-portal-border bg-portal-bg px-3 text-sm text-portal-text">
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-portal-text-muted text-xs mb-1">Tax %</Label>
              <Input type="number" min={0} max={100} step="0.1" value={taxPct}
                onChange={e => setTaxPct(parseFloat(e.target.value) || 0)}
                className="bg-portal-bg border-portal-border" />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-portal-text-muted text-xs mb-1">Notes (optional)</Label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                className="w-full rounded-md border border-portal-border bg-portal-bg px-3 py-2 text-sm text-portal-text placeholder:text-portal-text-muted resize-none" />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-portal-text mb-3">Line Items</h3>
            <LineItemsEditor items={items} onChange={setItems} currency={currency} />
          </div>

          <div className="rounded-xl border border-portal-border bg-portal-surface p-4 space-y-1.5 text-sm">
            <div className="flex justify-between text-portal-text-muted"><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
            <div className="flex justify-between text-portal-text-muted"><span>Tax ({taxPct}%)</span><span>{fmt(tax)}</span></div>
            <div className="flex justify-between text-portal-text font-bold text-base border-t border-portal-border pt-1.5 mt-1.5">
              <span>Total</span><span>{fmt(total)}</span>
            </div>
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}
        </div>

        <div className="flex items-center justify-end gap-2 p-5 border-t border-portal-border">
          <Button variant="outline" className="border-portal-border" onClick={onClose}>Cancel</Button>
          <Button variant="outline" className="border-portal-border" onClick={() => save("draft")} disabled={saving}>
            Save as Draft
          </Button>
          <Button onClick={() => save("sent")} disabled={saving}>
            {saving ? "Sending…" : "Send to Client"}
          </Button>
        </div>
      </div>
    </div>
  );
}
