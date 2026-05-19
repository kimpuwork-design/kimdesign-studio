import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

const ease = [0.22, 1, 0.36, 1] as [number, number, number, number];

const contentVariants = {
  initial: { opacity: 0, y: 16 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease, delay: 0.4 },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.2, ease },
  },
};

export function PageTransition({ children }: { children: ReactNode }) {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        variants={contentVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
