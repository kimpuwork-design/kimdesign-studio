import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, action, className }: PageHeaderProps) {
  return (
    <div className={cn("mb-8 flex items-start justify-between gap-4", className)}>
      <div>
        <h1 className="font-display text-3xl font-bold gradient-text">{title}</h1>
        {subtitle && <p className="mt-1 text-portal-text-muted">{subtitle}</p>}
        <div className="mt-2 h-0.5 w-12 bg-gradient-to-r from-portal-accent to-transparent rounded-full" />
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
