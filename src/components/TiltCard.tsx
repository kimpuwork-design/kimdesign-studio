import { ReactNode } from "react";

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  tiltStrength?: number;
  glareEnabled?: boolean;
}

/**
 * Lightweight TiltCard — original 3D tilt removed for performance.
 * Keeps the same API and a subtle CSS hover lift instead.
 */
export function TiltCard({ children, className = "" }: TiltCardProps) {
  return (
    <div className={`transition-transform duration-500 ease-out hover:-translate-y-0.5 ${className}`}>
      {children}
    </div>
  );
}
