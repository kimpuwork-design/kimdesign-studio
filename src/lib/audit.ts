import { supabase } from "@/integrations/supabase/client";

interface AuditEntry {
  actor_id: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  metadata?: Record<string, string | number | boolean | null | undefined>;
}

export async function writeAuditLog(entry: AuditEntry) {
  const payload = {
    actor_id: entry.actor_id,
    action: entry.action,
    entity_type: entry.entity_type,
    ...(entry.entity_id ? { entity_id: entry.entity_id } : {}),
    ...(entry.metadata ? { metadata: entry.metadata as Record<string, string> } : {}),
  };
  const { error } = await supabase.from("audit_logs").insert([payload]);
  if (error) {
    console.error("Audit log write failed:", error.message);
  }
}
