import { ReactNode, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { KMonogramLogo } from "@/components/KMonogramLogo";

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
  const [showCurtain, setShowCurtain] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  useEffect(() => {
    // Skip the curtain on first mount (PageLoader handles that)
    if (isFirstLoad) {
      setIsFirstLoad(false);
      return;
    }
    setShowCurtain(true);
    const timer = setTimeout(() => setShowCurtain(false), 700);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    <>
      {/* Branded curtain overlay with K logo */}
      <AnimatePresence>
        {showCurtain && (
          <motion.div
            key={`curtain-${location.pathname}`}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-foreground"
            initial={{ clipPath: "inset(0 0 100% 0)" }}
            animate={{
              clipPath: "inset(0 0 0% 0)",
              transition: { duration: 0.4, ease },
            }}
            exit={{
              clipPath: "inset(100% 0 0 0)",
              transition: { duration: 0.4, ease, delay: 0.15 },
            }}
          >
            {/* Centered K logo */}
            <motion.div
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3, delay: 0.15, ease }}
            >
              <KMonogramLogo size={40} className="rounded-md" />
            </motion.div>
          </motion.div>
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
