import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  /** Compact = smaller paddings for in-card use. */
  compact?: boolean;
}

/**
 * Consistent empty-state used across admin tables, lists, and pages.
 * Animated, brand-styled, and accessible.
 */
export function EmptyState({ icon: Icon, title, description, action, className, compact }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "py-10 px-6" : "py-16 px-8",
        className,
      )}
    >
      <div
        className={cn(
          "relative mb-4 flex items-center justify-center rounded-2xl",
          "bg-portal-accent/10 ring-1 ring-portal-accent/20",
          compact ? "h-12 w-12" : "h-16 w-16",
        )}
      >
        <Icon
          className="text-portal-accent"
          size={compact ? 22 : 28}
          strokeWidth={1.5}
          aria-hidden
        />
        <span className="absolute inset-0 rounded-2xl bg-portal-accent/5 blur-xl" aria-hidden />
      </div>
      <p className={cn("font-display font-semibold text-portal-text", compact ? "text-sm" : "text-base")}>
        {title}
      </p>
      {description && (
        <p className={cn("mt-1.5 max-w-sm text-portal-text-muted", compact ? "text-xs" : "text-sm")}>
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </motion.div>
  );
}
