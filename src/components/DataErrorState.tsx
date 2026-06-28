import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function DataErrorState({
  title = "Couldn't load data",
  message = "Something went wrong while loading this view. Please try again.",
  onRetry,
  className = "",
}: Props) {
  return (
    <div
      role="alert"
      className={`flex flex-col items-center justify-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-6 py-10 text-center ${className}`}
    >
      <AlertTriangle className="h-6 w-6 text-destructive" />
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground max-w-sm">{message}</p>
      </div>
      {onRetry && (
        <Button size="sm" variant="outline" onClick={onRetry} className="mt-2">
          <RefreshCw className="mr-2 h-3.5 w-3.5" />
          Try again
        </Button>
      )}
    </div>
  );
}
