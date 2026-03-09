import { ReactNode, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

const curtainVariants = {
  initial: { scaleY: 0 },
  animate: {
    scaleY: 1,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    scaleY: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: 0.1 },
  },
};

const ease = [0.22, 1, 0.36, 1] as [number, number, number, number];

const contentVariants = {
  initial: { opacity: 0, y: 16 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease, delay: 0.35 },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.25, ease },
  },
};

export function PageTransition({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [showCurtain, setShowCurtain] = useState(false);

  useEffect(() => {
    setShowCurtain(true);
    const timer = setTimeout(() => setShowCurtain(false), 600);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    <>
      {/* Dark curtain overlay */}
      <AnimatePresence>
        {showCurtain && (
          <motion.div
            key={`curtain-${location.pathname}`}
            initial={{ scaleY: 0 }}
            animate={{
              scaleY: 1,
              transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
            }}
            exit={{
              scaleY: 0,
              transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
            }}
            style={{ transformOrigin: "top" }}
            className="fixed inset-0 z-[100] bg-foreground"
          />
        )}
      </AnimatePresence>

      {/* Page content */}
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
    </>
  );
}
