import { motion } from "framer-motion";

const ease = [0.22, 1, 0.36, 1] as [number, number, number, number];

export function KMonogramLogo({ size = 36, className = "", animated = false }: { size?: number; className?: string; animated?: boolean }) {
  const pathD = "M38 30V90M38 60L72 30M54 52L80 90";
  // Approximate total path length for the K strokes
  const pathLength = 200;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <motion.rect
        width="120"
        height="120"
        rx="24"
        fill="hsl(var(--primary))"
        initial={animated ? { opacity: 0, scale: 0.8 } : false}
        animate={animated ? { opacity: 1, scale: 1 } : undefined}
        transition={{ duration: 0.5, ease }}
      />
      {animated ? (
        <motion.path
          d={pathD}
          stroke="hsl(var(--primary-foreground))"
          strokeWidth="10"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{
            pathLength: { duration: 1.2, delay: 0.3, ease },
            opacity: { duration: 0.3, delay: 0.3 },
          }}
        />
      ) : (
        <path
          d={pathD}
          stroke="hsl(var(--primary-foreground))"
          strokeWidth="10"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}
