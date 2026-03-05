import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

export function PageTransition({ children }: { children: ReactNode }) {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
        animate={{ 
          opacity: 1, 
          y: 0, 
          filter: "blur(0px)",
        }}
        exit={{ 
          opacity: 0, 
          y: -6, 
          filter: "blur(2px)",
        }}
        transition={{ 
          duration: 0.5, 
          ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
