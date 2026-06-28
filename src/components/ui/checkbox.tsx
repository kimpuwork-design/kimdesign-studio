import * as React from "react";
import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

type CheckedState = boolean | "indeterminate";

export interface CheckboxProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  checked?: CheckedState;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

/**
 * Lightweight uncontrolled-or-controlled checkbox styled to the portal theme.
 * Drop-in replacement for the shadcn checkbox; supports the "indeterminate"
 * visual state used by bulk-action tables.
 */
export const Checkbox = React.forwardRef<HTMLButtonElement, CheckboxProps>(
  ({ className, checked, defaultChecked, onCheckedChange, disabled, ...rest }, ref) => {
    const [internal, setInternal] = React.useState<boolean>(!!defaultChecked);
    const isControlled = checked !== undefined;
    const value: CheckedState = isControlled ? (checked as CheckedState) : internal;
    const isOn = value === true;
    const isIndeterminate = value === "indeterminate";

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      rest.onClick?.(e);
      if (e.defaultPrevented || disabled) return;
      const next = !(isOn || isIndeterminate);
      if (!isControlled) setInternal(next);
      onCheckedChange?.(next);
    };

    return (
      <button
        type="button"
        role="checkbox"
        aria-checked={isIndeterminate ? "mixed" : isOn}
        data-state={isOn ? "checked" : isIndeterminate ? "indeterminate" : "unchecked"}
        ref={ref}
        disabled={disabled}
        onClick={handleClick}
        className={cn(
          "inline-flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
          "border-portal-border/70 bg-portal-bg/40 text-portal-accent-foreground",
          "hover:border-portal-accent/60",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-portal-accent/40",
          "disabled:cursor-not-allowed disabled:opacity-50",
          (isOn || isIndeterminate) && "border-portal-accent bg-portal-accent",
          className,
        )}
        {...rest}
      >
        {isIndeterminate ? (
          <Minus size={12} strokeWidth={3} />
        ) : isOn ? (
          <Check size={12} strokeWidth={3} />
        ) : null}
      </button>
    );
  },
);
Checkbox.displayName = "Checkbox";
