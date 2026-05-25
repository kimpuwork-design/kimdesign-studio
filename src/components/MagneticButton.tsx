import type { ReactNode } from "react";

interface MagneticButtonProps {
  children: ReactNode;
  className?: string;
  strength?: number;
  as?: "button" | "div";
  onClick?: () => void;
}

/**
 * Lightweight wrapper — magnetic mouse-tracking removed for performance.
 * Preserves API; renders an inline-block with optional click handler.
 */
export function MagneticButton({ children, className = "", onClick }: MagneticButtonProps) {
  return (
    <div onClick={onClick} className={className} style={{ display: "inline-block" }}>
      {children}
    </div>
  );
}
