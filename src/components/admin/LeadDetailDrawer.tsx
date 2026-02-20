import { X, Mail, Phone, MessageSquare, Clock } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { writeAuditLog } from "@/lib/audit";
import { useAuth } from "@/contexts/AuthContext";

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  status: string;
  created_at: string;
}

interface LeadDetailDrawerProps {
  lead: Lead | null;
  onClose: () => void;
  onUpdated: () => void;
}

export function LeadDetailDrawer({ lead, onClose, onUpdated }: LeadDetailDrawerProps) {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);

  if (!lead) return null;

  const updateStatus = async (status: string) => {
    setLoading(true);
    await supabase.from("leads").update({ status }).eq("id", lead.id);
    if (profile) {
      await writeAuditLog({
        actor_id: profile.id,
        action: `lead_status_changed_to_${status}`,
        entity_type: "lead",
        entity_id: lead.id,
        metadata: { name: lead.name, status },
      });
    }
    setLoading(false);
    onUpdated();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative z-10 flex w-full max-w-md flex-col bg-portal-surface border-l border-portal-border overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-portal-border p-6">
          <div>
            <h2 className="font-display text-xl font-bold text-portal-text">{lead.name}</h2>
            <StatusBadge status={lead.status} className="mt-1.5" />
          </div>
          <button onClick={onClose} className="rounded p-1.5 text-portal-text-muted hover:text-portal-text">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 p-6 space-y-5">
          <div className="flex items-center gap-3">
            <Mail size={16} className="text-portal-text-muted shrink-0" />
            <a href={`mailto:${lead.email}`} className="text-portal-accent hover:underline text-sm">{lead.email}</a>
          </div>
          {lead.phone && (
            <div className="flex items-center gap-3">
              <Phone size={16} className="text-portal-text-muted shrink-0" />
              <span className="text-portal-text text-sm">{lead.phone}</span>
            </div>
          )}
          <div className="flex items-center gap-3">
            <Clock size={16} className="text-portal-text-muted shrink-0" />
            <span className="text-portal-text-muted text-sm">{new Date(lead.created_at).toLocaleString()}</span>
          </div>
          <div className="rounded-lg border border-portal-border bg-portal-bg p-4">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare size={14} className="text-portal-text-muted" />
              <span className="text-xs font-semibold uppercase tracking-wider text-portal-text-muted">Message</span>
            </div>
            <p className="text-sm text-portal-text leading-relaxed whitespace-pre-wrap">{lead.message}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="border-t border-portal-border p-6 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-portal-text-muted mb-3">Update Status</p>
          <div className="flex gap-2 flex-wrap">
            {lead.status !== "contacted" && (
              <Button size="sm" disabled={loading} onClick={() => updateStatus("contacted")}
                className="bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 border-yellow-500/30 border">
                Mark Contacted
              </Button>
            )}
            {lead.status !== "archived" && (
              <Button size="sm" variant="outline" disabled={loading} onClick={() => updateStatus("archived")}
                className="border-portal-border text-portal-text-muted hover:bg-portal-bg">
                Archive
              </Button>
            )}
            {lead.status !== "new" && (
              <Button size="sm" variant="outline" disabled={loading} onClick={() => updateStatus("new")}
                className="border-portal-border text-portal-text-muted hover:bg-portal-bg">
                Reset to New
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
