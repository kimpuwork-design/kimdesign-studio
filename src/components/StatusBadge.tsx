import { cn } from "@/lib/utils";

type Status = string;

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  // Lead statuses
  new:        { label: "New",        className: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  contacted:  { label: "Contacted",  className: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" },
  archived:   { label: "Archived",   className: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30" },
  // Project statuses
  inquiry:    { label: "Inquiry",    className: "bg-purple-500/15 text-purple-400 border-purple-500/30" },
  active:     { label: "Active",     className: "bg-green-500/15 text-green-400 border-green-500/30" },
  review:     { label: "Review",     className: "bg-orange-500/15 text-orange-400 border-orange-500/30" },
  delivered:  { label: "Delivered",  className: "bg-teal-500/15 text-teal-400 border-teal-500/30" },
};

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    className: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
