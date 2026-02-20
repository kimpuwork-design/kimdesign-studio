const CONFIG: Record<string, { label: string; classes: string }> = {
  draft:     { label: "Draft",     classes: "bg-portal-text-muted/10 text-portal-text-muted" },
  submitted: { label: "Submitted", classes: "bg-yellow-400/15 text-yellow-500" },
  approved:  { label: "Approved",  classes: "bg-green-500/15 text-green-500" },
  rejected:  { label: "Rejected",  classes: "bg-destructive/15 text-destructive" },
};

export function DeliverableStatusBadge({ status }: { status: string }) {
  const cfg = CONFIG[status] ?? { label: status, classes: "bg-portal-border text-portal-text-muted" };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg.classes}`}>
      {cfg.label}
    </span>
  );
}
