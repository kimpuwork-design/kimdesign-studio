import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { KMonogramLogo } from "@/components/KMonogramLogo";

const ease = [0.22, 1, 0.36, 1] as [number, number, number, number];

export function PageLoader() {
  const [visible, setVisible] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const duration = 700;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      // Ease-out quartic for smooth deceleration
      const eased = 1 - Math.pow(1 - p, 4);
      setProgress(Math.round(eased * 100));
      if (p < 1) {
        requestAnimationFrame(tick);
      } else {
        setTimeout(() => setVisible(false), 120);
      }
    };
    requestAnimationFrame(tick);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="loader"
          exit={{ opacity: 0, transition: { duration: 0.25, ease } }}
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-foreground"
        >
          {/* Logo with draw animation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease }}
          >
            <KMonogramLogo size={56} className="rounded-lg" animated />
          </motion.div>

          {/* Studio name — letter stagger */}
          <div className="mt-8 overflow-hidden">
            <motion.p
              initial={{ y: "100%" }}
              animate={{ y: "0%" }}
              transition={{ duration: 0.6, delay: 0.5, ease }}
              className="font-display text-lg tracking-[0.25em] text-background/80"
            >
              KIM DESIGN STUDIO
            </motion.p>
          </div>

          {/* Progress bar */}
          <div className="mt-10 w-[120px] relative">
            <div className="h-px bg-background/10 w-full" />
            <motion.div
              className="h-px bg-background/60 absolute top-0 left-0"
              style={{ width: `${progress}%` }}
              transition={{ duration: 0.05 }}
            />
          </div>

          {/* Percentage counter */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="mt-4 text-[11px] tracking-[0.2em] text-background/30 tabular-nums font-mono"
          >
            {progress}%
          </motion.p>

          {/* Corner details */}
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="absolute bottom-8 left-8 text-[9px] tracking-[0.3em] uppercase text-background/15"
          >
            Architecture · Design
          </motion.span>
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="absolute bottom-8 right-8 text-[9px] tracking-[0.3em] uppercase text-background/15"
          >
            Yangon, Myanmar
          </motion.span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
