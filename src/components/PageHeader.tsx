import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, action, className }: PageHeaderProps) {
  return (
    <div className={cn("mb-8 flex items-center justify-between gap-4", className)}>
      <div>
        <h1 className="font-display text-2xl font-bold text-portal-text tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-portal-text-muted">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
