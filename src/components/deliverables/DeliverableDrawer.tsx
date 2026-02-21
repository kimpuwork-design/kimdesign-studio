import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getSignedUrl } from "@/lib/files";
import { writeAuditLog } from "@/lib/audit";
import { DeliverableStatusBadge } from "./DeliverableStatusBadge";
import { FileIcon } from "@/components/files/FileIcon";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  X, Download, CheckCircle, XCircle, Clock, Loader2,
  MessageSquare, User,
} from "lucide-react";

export interface Deliverable {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  status: string;
  submitted_at: string | null;
  reviewed_at: string | null;
  client_feedback: string | null;
  created_at: string;
  file_id: string;
  created_by: string;
  reviewer_id: string | null;
  file?: {
    original_name: string;
    extension: string | null;
    size_bytes: number;
    storage_path: string;
  };
  creator?: { full_name: string | null };
}

interface DeliverableEvent {
  id: string;
  event_type: string;
  note: string | null;
  created_at: string;
  actor?: { full_name: string | null };
}

interface Props {
  deliverable: Deliverable;
  role: "CLIENT" | "STAFF" | "ADMIN";
  onClose: () => void;
  onUpdated: () => void;
}

const EVENT_ICONS: Record<string, React.ReactNode> = {
  created:   <Clock size={13} className="text-portal-text-muted" />,
  submitted: <Clock size={13} className="text-yellow-500" />,
  approved:  <CheckCircle size={13} className="text-green-500" />,
  rejected:  <XCircle size={13} className="text-destructive" />,
  comment:   <MessageSquare size={13} className="text-portal-text-muted" />,
};

export function DeliverableDrawer({ deliverable: initialDeliverable, role, onClose, onUpdated }: Props) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [deliverable, setDeliverable] = useState(initialDeliverable);
  const [events, setEvents] = useState<DeliverableEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [feedback, setFeedback] = useState("");
  const [actioning, setActioning] = useState<"approve" | "reject" | null>(null);
  const [downloading, setDownloading] = useState(false);

  const fetchEvents = async () => {
    const { data } = await supabase
      .from("deliverable_events")
      .select("*, actor:actor_id(full_name)")
      .eq("deliverable_id", deliverable.id)
      .order("created_at", { ascending: true });
    setEvents((data as unknown as DeliverableEvent[]) ?? []);
    setLoadingEvents(false);
  };

  useEffect(() => { fetchEvents(); }, [deliverable.id]);

  const handleDownload = async () => {
    if (!deliverable.file) return;
    setDownloading(true);
    const url = await getSignedUrl(deliverable.file.storage_path);
    setDownloading(false);
    if (!url) { toast({ title: "Download failed", variant: "destructive" }); return; }
    const a = document.createElement("a");
    a.href = url; a.download = deliverable.file.original_name; a.target = "_blank"; a.click();
  };

  const handleAction = async (action: "approve" | "reject") => {
    if (action === "reject" && !feedback.trim()) {
      toast({ title: "Feedback required for rejection", variant: "destructive" }); return;
    }
    if (!profile) return;
    setActioning(action);
    const newStatus = action === "approve" ? "approved" : "rejected";

    const { error } = await supabase.from("deliverables").update({
      status: newStatus,
      reviewed_at: new Date().toISOString(),
      reviewer_id: profile.id,
      client_feedback: feedback.trim() || null,
    }).eq("id", deliverable.id);

    if (error) {
      toast({ title: "Action failed", description: error.message, variant: "destructive" });
      setActioning(null); return;
    }

    // Insert event
    await supabase.from("deliverable_events").insert({
      deliverable_id: deliverable.id,
      actor_id: profile.id,
      event_type: newStatus,
      note: feedback.trim() || null,
    });

    // Audit log
    await writeAuditLog({
      actor_id: profile.id,
      action: `deliverable_${newStatus}`,
      entity_type: "deliverable",
      entity_id: deliverable.id,
      metadata: { project_id: deliverable.project_id },
    });

    toast({ title: `Deliverable ${newStatus}` });
    setActioning(null);
    setFeedback("");
    setDeliverable((d) => ({ ...d, status: newStatus, reviewed_at: new Date().toISOString(), reviewer_id: profile.id, client_feedback: feedback.trim() || null }));
    fetchEvents();
    onUpdated();
  };

  const isClient = role === "CLIENT";
  const canAct = isClient && deliverable.status === "submitted";

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      {/* Drawer */}
      <div className="w-full max-w-lg bg-portal-surface shadow-2xl border-l border-portal-border flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 p-5 border-b border-portal-border">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <DeliverableStatusBadge status={deliverable.status} />
            </div>
            <h2 className="font-display text-lg font-bold text-portal-text leading-snug">{deliverable.title}</h2>
            {deliverable.description && (
              <p className="mt-1.5 text-sm text-portal-text-muted leading-relaxed">{deliverable.description}</p>
            )}
          </div>
          <button onClick={onClose} className="shrink-0 rounded-lg p-1.5 text-portal-text-muted hover:text-portal-text hover:bg-portal-border transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* File */}
          {deliverable.file && (
            <div className="rounded-xl border border-portal-border bg-portal-bg p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-portal-text-muted mb-3">Attached File</p>
              <div className="flex items-center gap-3">
                <FileIcon ext={deliverable.file.extension ?? ""} size={20} className="text-portal-text-muted shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-portal-text truncate">{deliverable.file.original_name}</p>
                </div>
                {!isClient && (
                  <button
                    onClick={handleDownload}
                    disabled={downloading}
                    className="flex items-center gap-1.5 rounded-lg bg-portal-accent/10 px-3 py-1.5 text-xs font-semibold text-portal-accent hover:bg-portal-accent/20 transition-colors disabled:opacity-50"
                  >
                    {downloading ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
                    Download
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-lg border border-portal-border bg-portal-bg px-3 py-2">
              <p className="text-portal-text-muted mb-0.5">Submitted by</p>
              <p className="font-medium text-portal-text">{deliverable.creator?.full_name ?? "—"}</p>
            </div>
            <div className="rounded-lg border border-portal-border bg-portal-bg px-3 py-2">
              <p className="text-portal-text-muted mb-0.5">Submitted at</p>
              <p className="font-medium text-portal-text">
                {deliverable.submitted_at ? new Date(deliverable.submitted_at).toLocaleDateString() : "—"}
              </p>
            </div>
            {deliverable.reviewed_at && (
              <div className="rounded-lg border border-portal-border bg-portal-bg px-3 py-2 col-span-2">
                <p className="text-portal-text-muted mb-0.5">Reviewed at</p>
                <p className="font-medium text-portal-text">{new Date(deliverable.reviewed_at).toLocaleDateString()}</p>
              </div>
            )}
          </div>

          {/* Client feedback shown on rejection */}
          {deliverable.client_feedback && deliverable.status === "rejected" && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-destructive mb-2">Client Feedback</p>
              <p className="text-sm text-portal-text leading-relaxed">{deliverable.client_feedback}</p>
            </div>
          )}
          {deliverable.client_feedback && deliverable.status === "approved" && (
            <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-green-500 mb-2">Client Note</p>
              <p className="text-sm text-portal-text leading-relaxed">{deliverable.client_feedback}</p>
            </div>
          )}

          {/* History */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-portal-text-muted mb-3">History</p>
            {loadingEvents ? (
              <div className="flex items-center gap-2 py-4 text-portal-text-muted text-xs">
                <Loader2 size={14} className="animate-spin" /> Loading...
              </div>
            ) : events.length === 0 ? (
              <p className="text-xs text-portal-text-muted">No events yet.</p>
            ) : (
              <div className="relative space-y-0">
                {events.map((ev, i) => (
                  <div key={ev.id} className="flex gap-3 pb-4 relative">
                    {i < events.length - 1 && (
                      <div className="absolute left-[11px] top-6 bottom-0 w-px bg-portal-border" />
                    )}
                    <div className="shrink-0 mt-0.5 h-6 w-6 rounded-full border border-portal-border bg-portal-bg flex items-center justify-center">
                      {EVENT_ICONS[ev.event_type] ?? <User size={13} className="text-portal-text-muted" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-portal-text capitalize">{ev.event_type}</span>
                        <span className="text-xs text-portal-text-muted">·</span>
                        <span className="text-xs text-portal-text-muted">{ev.actor?.full_name ?? "Unknown"}</span>
                        <span className="text-xs text-portal-text-muted ml-auto">
                          {new Date(ev.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {ev.note && <p className="mt-1 text-xs text-portal-text-muted leading-relaxed">{ev.note}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Client action footer */}
        {canAct && (
          <div className="border-t border-portal-border p-5 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-portal-text-muted">Your Review</p>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Add feedback (required for rejection, optional for approval)..."
              rows={3}
              className="w-full rounded-lg border border-portal-border bg-portal-bg px-3 py-2 text-sm text-portal-text placeholder:text-portal-text-muted resize-none focus:outline-none focus:ring-2 focus:ring-portal-accent/50"
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => handleAction("reject")}
                disabled={!!actioning}
              >
                {actioning === "reject" ? <Loader2 size={14} className="animate-spin mr-1.5" /> : <XCircle size={14} className="mr-1.5" />}
                Reject
              </Button>
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                onClick={() => handleAction("approve")}
                disabled={!!actioning}
              >
                {actioning === "approve" ? <Loader2 size={14} className="animate-spin mr-1.5" /> : <CheckCircle size={14} className="mr-1.5" />}
                Approve
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
