interface Props {
  status: string;
  className?: string;
}

const QUOTE_COLORS: Record<string, string> = {
  draft: "bg-portal-border/60 text-portal-text-muted",
  sent: "bg-[#1a365d]/15 text-[#1a365d]",
  accepted: "bg-green-500/15 text-green-500",
  rejected: "bg-destructive/15 text-destructive",
};

const INVOICE_COLORS: Record<string, string> = {
  draft: "bg-portal-border/60 text-portal-text-muted",
  sent: "bg-yellow-400/15 text-yellow-400",
  paid: "bg-green-500/15 text-green-500",
  void: "bg-portal-border/60 text-portal-text-muted line-through",
};

export function BillingStatusBadge({ status, className = "" }: Props) {
  const color = QUOTE_COLORS[status] ?? INVOICE_COLORS[status] ?? "bg-portal-border/60 text-portal-text-muted";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${color} ${className}`}>
      {status}
    </span>
  );
}
