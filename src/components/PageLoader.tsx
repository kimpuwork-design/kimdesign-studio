import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { KMonogramLogo } from "@/components/KMonogramLogo";

const luxuryEase = [0.22, 1, 0.36, 1] as const;

export function PageLoader() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 1800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="loader"
          exit={{ opacity: 0, transition: { duration: 0.6, ease: luxuryEase } }}
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-background"
        >
          {/* Logo reveal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: luxuryEase }}
          >
            <KMonogramLogo size={48} className="rounded-sm" />
          </motion.div>

          {/* Studio name */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6, ease: luxuryEase }}
            className="mt-6 font-display text-lg tracking-[0.15em] text-foreground"
          >
            KIM DESIGN STUDIO
          </motion.p>

          {/* Loading line */}
          <motion.div
            className="mt-8 h-px bg-primary/30 overflow-hidden"
            initial={{ width: 0 }}
            animate={{ width: 120 }}
            transition={{ delay: 0.2, duration: 1.4, ease: luxuryEase }}
          >
            <motion.div
              className="h-full bg-primary"
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{ duration: 1.2, ease: luxuryEase, repeat: 1 }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
