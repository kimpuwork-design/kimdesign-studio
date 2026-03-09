import { useEffect, useState } from "react";
import { motion, useScroll, useSpring } from "framer-motion";
import { ArrowUp } from "lucide-react";

export function BackToTop() {
  const [visible, setVisible] = useState(false);
  const { scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  useEffect(() => {
    const unsub = scrollYProgress.on("change", (v) => {
      setVisible(v > 0.15);
    });
    return unsub;
  }, [scrollYProgress]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // SVG circle parameters
  const size = 44;
  const strokeWidth = 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <motion.button
      onClick={scrollToTop}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{
        opacity: visible ? 1 : 0,
        scale: visible ? 1 : 0.8,
        pointerEvents: visible ? "auto" as const : "none" as const,
      }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="fixed bottom-8 right-8 z-50"
      aria-label="Back to top"
    >
      <div className="relative flex items-center justify-center">
        {/* Progress ring */}
        <svg width={size} height={size} className="absolute -rotate-90">
          {/* Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth={strokeWidth}
          />
          {/* Progress */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            style={{
              strokeDashoffset: smoothProgress.get()
                ? undefined
                : circumference,
            }}
            initial={{ strokeDashoffset: circumference }}
          />
          {/* Use a motion value listener approach */}
        </svg>
        {/* Inner button */}
        <div className="h-9 w-9 bg-background border border-border/50 flex items-center justify-center hover:bg-foreground hover:text-background hover:border-foreground transition-all duration-300">
          <ArrowUp size={14} />
        </div>
      </div>
      {/* Animated progress via effect */}
      <ProgressCircle progress={smoothProgress} size={size} radius={radius} circumference={circumference} strokeWidth={strokeWidth} />
    </motion.button>
  );
}

/* Separate component to subscribe to motion value */
function ProgressCircle({
  progress,
  size,
  radius,
  circumference,
  strokeWidth,
}: {
  progress: ReturnType<typeof useSpring>;
  size: number;
  radius: number;
  circumference: number;
  strokeWidth: number;
}) {
  return (
    <svg width={size} height={size} className="absolute top-0 left-0 -rotate-90 pointer-events-none">
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        style={{
          strokeDashoffset: progress.get() !== undefined
            ? `calc(${circumference} - ${circumference} * var(--prog, 0))`
            : circumference,
        }}
      />
    </svg>
  );
}
