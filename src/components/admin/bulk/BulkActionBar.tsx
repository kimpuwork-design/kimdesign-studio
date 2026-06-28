import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BulkAction {
  label: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  onClick: () => void;
  /** Visual variant. Destructive = red, primary = accent, default = neutral. */
  variant?: "default" | "primary" | "destructive";
  /** Disable while a long-running op is in flight. */
  disabled?: boolean;
}

interface BulkActionBarProps {
  count: number;
  onClear: () => void;
  actions: BulkAction[];
  /** Optional label override, e.g. "leads". Defaults to "items". */
  noun?: string;
}

/**
 * Sticky bottom action bar that appears when at least one row is selected.
 * Designed to be rendered once per page; reads `count` to mount / unmount.
 */
export function BulkActionBar({ count, onClear, actions, noun = "items" }: BulkActionBarProps) {
  const show = count > 0;
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 32, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 32, opacity: 0 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-4"
        >
          <div
            role="toolbar"
            aria-label="Bulk actions"
            className={cn(
              "pointer-events-auto flex max-w-[min(720px,calc(100vw-2rem))] items-center gap-2",
              "rounded-2xl border border-portal-border/60 bg-portal-surface/95 px-3 py-2",
              "shadow-2xl shadow-black/40 backdrop-blur-xl",
            )}
          >
            <button
              onClick={onClear}
              className="rounded-lg p-1.5 text-portal-text-muted hover:bg-portal-bg hover:text-portal-text transition-colors"
              title="Clear selection"
              aria-label="Clear selection"
            >
              <X size={14} />
            </button>
            <span className="text-xs font-medium text-portal-text whitespace-nowrap">
              {count} {noun} selected
            </span>
            <div className="mx-1 h-5 w-px bg-portal-border/60" aria-hidden />
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
              {actions.map((a) => {
                const Icon = a.icon;
                const base =
                  "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-colors whitespace-nowrap disabled:opacity-50 disabled:pointer-events-none";
                const variant =
                  a.variant === "destructive"
                    ? "text-destructive hover:bg-destructive/15"
                    : a.variant === "primary"
                      ? "text-portal-accent hover:bg-portal-accent/15"
                      : "text-portal-text hover:bg-portal-bg";
                return (
                  <button
                    key={a.label}
                    onClick={a.onClick}
                    disabled={a.disabled}
                    className={cn(base, variant)}
                  >
                    {Icon && <Icon size={13} />}
                    {a.label}
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
