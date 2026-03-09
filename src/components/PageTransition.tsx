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

/* ─── Morphing Text Animation ─── */
function MorphingText({ text }: { text: string }) {
  const letters = text.split("");
  
  return (
    <div className="flex gap-[0.05em] overflow-hidden">
      {letters.map((letter, i) => (
        <motion.span
          key={i}
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: "0%", opacity: 1 }}
          exit={{ y: "-100%", opacity: 0 }}
          transition={{
            duration: 0.4,
            delay: 0.2 + i * 0.02,
            ease,
          }}
          className="inline-block"
        >
          {letter === " " ? "\u00A0" : letter}
        </motion.span>
      ))}
    </div>
  );
}

export function PageTransition({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [showCurtain, setShowCurtain] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  // Extract page name from pathname
  const pageName = location.pathname === "/" 
    ? "Home" 
    : location.pathname.split("/")[1]?.charAt(0).toUpperCase() + location.pathname.split("/")[1]?.slice(1) || "";

  useEffect(() => {
    // Skip the curtain on first mount (PageLoader handles that)
    if (isFirstLoad) {
      setIsFirstLoad(false);
      return;
    }
    setShowCurtain(true);
    const timer = setTimeout(() => setShowCurtain(false), 800);
    return () => clearTimeout(timer);
  }, [location.pathname, isFirstLoad]);

  return (
    <>
      {/* Branded curtain overlay with morphing text */}
      <AnimatePresence>
        {showCurtain && (
          <motion.div
            key={`curtain-${location.pathname}`}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-foreground overflow-hidden"
            initial={{ clipPath: "inset(0 0 100% 0)" }}
            animate={{
              clipPath: "inset(0 0 0% 0)",
              transition: { duration: 0.4, ease },
            }}
            exit={{
              clipPath: "inset(100% 0 0 0)",
              transition: { duration: 0.4, ease, delay: 0.2 },
            }}
          >
            {/* Radial gradient pulse */}
            <motion.div
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.3, 0] }}
              transition={{ duration: 0.8, ease }}
              style={{
                background: "radial-gradient(circle at center, hsl(var(--primary) / 0.1), transparent 60%)",
              }}
            />
            
            {/* Logo with scale morph */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 1.2, rotate: 10 }}
              transition={{ duration: 0.5, ease }}
              className="mb-6"
            >
              <KMonogramLogo size={40} className="rounded-md" />
            </motion.div>
            
            {/* Morphing page name */}
            {pageName && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, delay: 0.15 }}
                className="font-display text-2xl text-background tracking-[0.15em] uppercase"
              >
                <MorphingText text={pageName} />
              </motion.div>
            )}
            
            {/* Decorative line */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              exit={{ scaleX: 0 }}
              transition={{ duration: 0.5, delay: 0.2, ease }}
              className="absolute bottom-0 left-0 right-0 h-px bg-background/20"
              style={{ transformOrigin: "left" }}
            />
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
