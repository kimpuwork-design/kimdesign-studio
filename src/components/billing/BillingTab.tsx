import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { BillingStatusBadge } from "./BillingStatusBadge";
import { LineItemsEditor, LineItem } from "./LineItemsEditor";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, Check, X, FileText } from "lucide-react";
import { writeAuditLog } from "@/lib/audit";

interface Quote {
  id: string;
  title: string;
  status: string;
  currency: string;
  subtotal: number;
  tax: number;
  total: number;
  notes: string | null;
  created_at: string;
}

interface Invoice {
  id: string;
  invoice_number: string;
  status: string;
  currency: string;
  subtotal: number;
  tax: number;
  total: number;
  notes: string | null;
  issue_date: string;
  due_date: string | null;
  pdf_url: string | null;
  paid_at: string | null;
  created_at: string;
}

interface Props {
  projectId: string;
  role: "CLIENT" | "STAFF" | "ADMIN";
  onCreateQuote?: () => void;
  onCreateInvoice?: () => void;
}

function fmt(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}

function QuoteRow({ quote, role, onRefresh }: { quote: Quote; role: string; onRefresh: () => void }) {
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<LineItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [actioning, setActioning] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    supabase.from("quote_items").select("*").eq("quote_id", quote.id).order("sort_order")
      .then(({ data }) => { setItems((data as unknown as LineItem[]) ?? []); setLoading(false); });
  }, [open, quote.id]);

  const respond = async (status: "accepted" | "rejected") => {
    if (!profile) return;
    setActioning(true);
    await supabase.from("quotes").update({ status }).eq("id", quote.id);
    await writeAuditLog({ actor_id: profile.id, action: `quote_${status}`, entity_type: "quote", entity_id: quote.id });
    setActioning(false);
    onRefresh();
  };

  const sendQuote = async () => {
    if (!profile) return;
    setActioning(true);
    await supabase.from("quotes").update({ status: "sent" }).eq("id", quote.id);
    await writeAuditLog({ actor_id: profile.id, action: "quote_sent", entity_type: "quote", entity_id: quote.id });
    setActioning(false);
    onRefresh();
  };

  return (
    <div className="rounded-xl border border-portal-border bg-portal-surface overflow-hidden">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-portal-border/10 transition-colors text-left">
        {open ? <ChevronDown size={14} className="text-portal-text-muted shrink-0" /> : <ChevronRight size={14} className="text-portal-text-muted shrink-0" />}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-portal-text">{quote.title}</p>
          <p className="text-xs text-portal-text-muted">{new Date(quote.created_at).toLocaleDateString()}</p>
        </div>
        <BillingStatusBadge status={quote.status} />
        <span className="text-sm font-semibold text-portal-text ml-2">{fmt(quote.total, quote.currency)}</span>
      </button>

      {open && (
        <div className="border-t border-portal-border px-4 py-4 space-y-4">
          {loading ? (
            <div className="h-8 flex items-center justify-center">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-portal-accent border-t-transparent" />
            </div>
          ) : (
            <LineItemsEditor items={items} onChange={() => {}} currency={quote.currency} readOnly />
          )}

          <div className="rounded-lg border border-portal-border bg-portal-bg p-3 space-y-1 text-sm">
            <div className="flex justify-between text-portal-text-muted"><span>Subtotal</span><span>{fmt(quote.subtotal, quote.currency)}</span></div>
            <div className="flex justify-between text-portal-text-muted"><span>Tax</span><span>{fmt(quote.tax, quote.currency)}</span></div>
            <div className="flex justify-between font-bold text-portal-text border-t border-portal-border pt-1.5">
              <span>Total</span><span>{fmt(quote.total, quote.currency)}</span>
            </div>
          </div>

          {quote.notes && (
            <p className="text-xs text-portal-text-muted italic border-l-2 border-portal-accent/40 pl-3">{quote.notes}</p>
          )}

          <div className="flex flex-wrap gap-2 pt-1">
            {role === "CLIENT" && quote.status === "sent" && (
              <>
                <Button size="sm" className="bg-[hsl(142,76%,36%)] hover:bg-[hsl(142,76%,30%)] text-white"
                  onClick={() => respond("accepted")} disabled={actioning}>
                  <Check size={13} className="mr-1.5" />Accept Quote
                </Button>

                <Button size="sm" variant="outline" className="border-destructive text-destructive hover:bg-destructive/10"
                  onClick={() => respond("rejected")} disabled={actioning}>
                  <X size={13} className="mr-1.5" />Reject
                </Button>
              </>
            )}
            {(role === "STAFF" || role === "ADMIN") && quote.status === "draft" && (
              <Button size="sm" onClick={sendQuote} disabled={actioning}>
                Send to Client
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function InvoiceRow({ invoice, role, onRefresh }: { invoice: Invoice; role: string; onRefresh: () => void }) {
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<LineItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [actioning, setActioning] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    supabase.from("invoice_items").select("*").eq("invoice_id", invoice.id).order("sort_order")
      .then(({ data }) => { setItems((data as unknown as LineItem[]) ?? []); setLoading(false); });
  }, [open, invoice.id]);

  const markPaid = async () => {
    if (!profile) return;
    setActioning(true);
    await supabase.from("invoices").update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", invoice.id);
    await writeAuditLog({ actor_id: profile.id, action: "invoice_paid", entity_type: "invoice", entity_id: invoice.id });
    setActioning(false);
    onRefresh();
  };

  const voidInvoice = async () => {
    if (!profile) return;
    if (!confirm("Void this invoice?")) return;
    setActioning(true);
    await supabase.from("invoices").update({ status: "void" }).eq("id", invoice.id);
    await writeAuditLog({ actor_id: profile.id, action: "invoice_void", entity_type: "invoice", entity_id: invoice.id });
    setActioning(false);
    onRefresh();
  };

  const sendInvoice = async () => {
    if (!profile) return;
    setActioning(true);
    await supabase.from("invoices").update({ status: "sent" }).eq("id", invoice.id);
    await writeAuditLog({ actor_id: profile.id, action: "invoice_sent", entity_type: "invoice", entity_id: invoice.id });
    setActioning(false);
    onRefresh();
  };

  const generatePdf = async () => {
    setActioning(true);
    const { data } = await supabase.functions.invoke("generate-invoice-pdf", {
      body: { invoice_id: invoice.id },
    });
    if (data?.url) window.open(data.url, "_blank");
    else alert("PDF generation failed. Check logs.");
    setActioning(false);
  };


  const downloadPdf = async () => {
    if (!invoice.pdf_url) return;
    const { data } = await supabase.storage.from("invoice-pdfs").createSignedUrl(invoice.pdf_url, 300);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  };

  const isOverdue = invoice.due_date && invoice.status === "sent" && new Date(invoice.due_date) < new Date();

  return (
    <div className={`rounded-xl border overflow-hidden ${isOverdue ? "border-destructive/40" : "border-portal-border"} bg-portal-surface`}>
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-portal-border/10 transition-colors text-left">
        {open ? <ChevronDown size={14} className="text-portal-text-muted shrink-0" /> : <ChevronRight size={14} className="text-portal-text-muted shrink-0" />}
        <FileText size={14} className="text-portal-text-muted shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-portal-text">{invoice.invoice_number}</p>
          <p className="text-xs text-portal-text-muted">
            Issued {new Date(invoice.issue_date).toLocaleDateString()}
            {invoice.due_date && ` · Due ${new Date(invoice.due_date).toLocaleDateString()}`}
            {isOverdue && <span className="text-destructive font-semibold ml-1">OVERDUE</span>}
          </p>
        </div>
        <BillingStatusBadge status={invoice.status} />
        <span className="text-sm font-semibold text-portal-text ml-2">{fmt(invoice.total, invoice.currency)}</span>
      </button>

      {open && (
        <div className="border-t border-portal-border px-4 py-4 space-y-4">
          {loading ? (
            <div className="h-8 flex items-center justify-center">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-portal-accent border-t-transparent" />
            </div>
          ) : (
            <LineItemsEditor items={items} onChange={() => {}} currency={invoice.currency} readOnly />
          )}

          <div className="rounded-lg border border-portal-border bg-portal-bg p-3 space-y-1 text-sm">
            <div className="flex justify-between text-portal-text-muted"><span>Subtotal</span><span>{fmt(invoice.subtotal, invoice.currency)}</span></div>
            <div className="flex justify-between text-portal-text-muted"><span>Tax</span><span>{fmt(invoice.tax, invoice.currency)}</span></div>
            <div className="flex justify-between font-bold text-portal-text border-t border-portal-border pt-1.5">
              <span>Total</span><span>{fmt(invoice.total, invoice.currency)}</span>
            </div>
          </div>

          {invoice.notes && (
            <p className="text-xs text-portal-text-muted italic border-l-2 border-portal-accent/40 pl-3">{invoice.notes}</p>
          )}

          {invoice.paid_at && (
            <p className="text-xs text-[hsl(142,76%,45%)]">Paid on {new Date(invoice.paid_at).toLocaleDateString()}</p>
          )}

          <div className="flex flex-wrap gap-2 pt-1">
            {invoice.pdf_url && (
              <Button size="sm" variant="outline" className="border-portal-border" onClick={downloadPdf}>
                Download PDF
              </Button>
            )}
            {(role === "STAFF" || role === "ADMIN") && (
              <Button size="sm" variant="outline" className="border-portal-border" onClick={generatePdf} disabled={actioning}>
                Generate PDF
              </Button>
            )}
            {(role === "STAFF" || role === "ADMIN") && invoice.status === "draft" && (
              <Button size="sm" onClick={sendInvoice} disabled={actioning}>Send to Client</Button>
            )}
            {role === "ADMIN" && invoice.status === "sent" && (
              <Button size="sm" className="bg-[hsl(142,76%,36%)] hover:bg-[hsl(142,76%,30%)] text-white" onClick={markPaid} disabled={actioning}>
                <Check size={13} className="mr-1.5" />Mark as Paid
              </Button>
            )}
            {role === "ADMIN" && invoice.status !== "void" && invoice.status !== "paid" && (
              <Button size="sm" variant="outline" className="border-destructive text-destructive hover:bg-destructive/10"
                onClick={voidInvoice} disabled={actioning}>
                Void
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


export function BillingTab({ projectId, role, onCreateQuote, onCreateInvoice }: Props) {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [{ data: q }, { data: i }] = await Promise.all([
      supabase.from("quotes").select("*").eq("project_id", projectId).order("created_at", { ascending: false }),
      supabase.from("invoices").select("*").eq("project_id", projectId).order("created_at", { ascending: false }),
    ]);
    setQuotes((q as unknown as Quote[]) ?? []);
    setInvoices((i as unknown as Invoice[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [projectId]);

  if (loading) return (
    <div className="flex items-center justify-center py-12">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-portal-accent border-t-transparent" />
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Quotes */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-semibold text-portal-text">Quotes ({quotes.length})</h2>
          {(role === "STAFF" || role === "ADMIN") && onCreateQuote && (
            <Button size="sm" onClick={onCreateQuote}>+ New Quote</Button>
          )}
        </div>
        {quotes.length === 0 ? (
          <div className="rounded-xl border border-dashed border-portal-border p-8 text-center">
            <p className="text-sm text-portal-text-muted">No quotes yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {quotes.map(q => <QuoteRow key={q.id} quote={q} role={role} onRefresh={load} />)}
          </div>
        )}
      </div>

      {/* Invoices */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-semibold text-portal-text">Invoices ({invoices.length})</h2>
          {(role === "STAFF" || role === "ADMIN") && onCreateInvoice && (
            <Button size="sm" onClick={onCreateInvoice}>+ New Invoice</Button>
          )}
        </div>
        {invoices.length === 0 ? (
          <div className="rounded-xl border border-dashed border-portal-border p-8 text-center">
            <p className="text-sm text-portal-text-muted">No invoices yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {invoices.map(i => <InvoiceRow key={i.id} invoice={i} role={role} onRefresh={load} />)}
          </div>
        )}
      </div>
    </div>
  );
}
