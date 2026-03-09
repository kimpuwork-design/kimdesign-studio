import { useEffect, useState } from "react";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { ArrowUp } from "lucide-react";

export function BackToTop() {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const { scrollYProgress } = useScroll();

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    setVisible(v > 0.1);
    setProgress(v);
  });

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const size = 44;
  const sw = 1.5;
  const r = (size - sw) / 2;
  const c = 2 * Math.PI * r;

  return (
    <motion.button
      onClick={scrollToTop}
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{
        opacity: visible ? 1 : 0,
        scale: visible ? 1 : 0.6,
      }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="fixed bottom-8 right-8 z-50"
      style={{ pointerEvents: visible ? "auto" : "none" }}
      aria-label="Back to top"
    >
      <svg width={size} height={size} className="absolute top-0 left-0 -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--border) / 0.3)" strokeWidth={sw} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke="hsl(var(--primary))" strokeWidth={sw} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c - c * progress}
          style={{ transition: "stroke-dashoffset 0.1s linear" }}
        />
      </svg>
      <div className="h-[44px] w-[44px] flex items-center justify-center bg-background/80 backdrop-blur-sm border border-border/30 hover:bg-foreground hover:text-background transition-all duration-300" style={{ borderRadius: "50%" }}>
        <ArrowUp size={14} />
      </div>
    </motion.button>
  );
}
