import { cn } from "@/lib/utils";

type Status = string;

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  new:        { label: "New",        className: "bg-[#1a365d]/10 text-[#1a365d] border-[#1a365d]/20 shadow-[0_0_6px_rgba(26,54,93,0.15)]" },
  contacted:  { label: "Contacted",  className: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20 shadow-[0_0_6px_rgba(234,179,8,0.15)]" },
  archived:   { label: "Archived",   className: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20" },
  inquiry:    { label: "Inquiry",    className: "bg-purple-500/10 text-purple-400 border-purple-500/20 shadow-[0_0_6px_rgba(168,85,247,0.15)]" },
  active:     { label: "Active",     className: "bg-green-500/10 text-green-400 border-green-500/20 shadow-[0_0_6px_rgba(34,197,94,0.15)]" },
  review:     { label: "Review",     className: "bg-orange-500/10 text-orange-400 border-orange-500/20 shadow-[0_0_6px_rgba(249,115,22,0.15)]" },
  delivered:  { label: "Delivered",  className: "bg-teal-500/10 text-teal-400 border-teal-500/20 shadow-[0_0_6px_rgba(20,184,166,0.15)]" },
};

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    className: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold backdrop-blur-sm",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
