import { useEffect, useRef, useState, useCallback } from "react";
import { motion, useMotionValue, useSpring, AnimatePresence } from "framer-motion";

const TRAIL_COUNT = 5;

export function CustomCursor() {
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  const [hovered, setHovered] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [label, setLabel] = useState("");
  const [trail, setTrail] = useState<{ x: number; y: number; id: number }[]>([]);
  const trailId = useRef(0);
  const lastTrailPos = useRef({ x: 0, y: 0 });

  const springConfig = { damping: 25, stiffness: 300, mass: 0.5 };
  const x = useSpring(cursorX, springConfig);
  const y = useSpring(cursorY, springConfig);

  const addTrailDot = useCallback((cx: number, cy: number) => {
    const dx = cx - lastTrailPos.current.x;
    const dy = cy - lastTrailPos.current.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 20) return; // Only add dots when moving fast enough
    lastTrailPos.current = { x: cx, y: cy };
    trailId.current += 1;
    setTrail((prev) => [...prev.slice(-TRAIL_COUNT), { x: cx, y: cy, id: trailId.current }]);
  }, []);

  useEffect(() => {
    const mql = window.matchMedia("(pointer: coarse)");
    setIsMobile(mql.matches);
    if (mql.matches) return;

    const move = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
      addTrailDot(e.clientX, e.clientY);
    };

    const enter = () => setHidden(false);
    const leave = () => setHidden(true);

    const addHoverListeners = () => {
      document.querySelectorAll("a, button, [data-cursor-hover]").forEach((el) => {
        el.addEventListener("mouseenter", () => {
          setHovered(true);
          const cursorLabel = (el as HTMLElement).dataset.cursorLabel;
          setLabel(cursorLabel || "");
        });
        el.addEventListener("mouseleave", () => {
          setHovered(false);
          setLabel("");
        });
      });
    };

    window.addEventListener("mousemove", move);
    document.addEventListener("mouseenter", enter);
    document.addEventListener("mouseleave", leave);

    addHoverListeners();
    const observer = new MutationObserver(addHoverListeners);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener("mousemove", move);
      document.removeEventListener("mouseenter", enter);
      document.removeEventListener("mouseleave", leave);
      observer.disconnect();
    };
  }, [cursorX, cursorY, addTrailDot]);

  // Auto-remove trail dots
  useEffect(() => {
    if (trail.length === 0) return;
    const timer = setTimeout(() => {
      setTrail((prev) => prev.slice(1));
    }, 300);
    return () => clearTimeout(timer);
  }, [trail]);

  if (isMobile) return null;

  const hasLabel = label.length > 0;

  return (
    <>
      {/* Trail dots */}
      <AnimatePresence>
        {trail.map((dot, i) => (
          <motion.div
            key={dot.id}
            initial={{ opacity: 0.4, scale: 1 }}
            animate={{ opacity: 0, scale: 0.3 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="fixed top-0 left-0 z-[9998] pointer-events-none mix-blend-difference"
            style={{ x: dot.x, y: dot.y, translateX: "-50%", translateY: "-50%" }}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-white/60" />
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Main cursor */}
      <motion.div
        className="fixed top-0 left-0 z-[9999] pointer-events-none mix-blend-difference"
        style={{ x, y, translateX: "-50%", translateY: "-50%" }}
      >
        <motion.div
          animate={{
            width: hasLabel ? 80 : hovered ? 48 : 8,
            height: hasLabel ? 80 : hovered ? 48 : 8,
            opacity: hidden ? 0 : 1,
          }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-full bg-white flex items-center justify-center"
        >
          <AnimatePresence>
            {hasLabel && (
              <motion.span
                key={label}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.15 }}
                className="text-[9px] font-medium tracking-[0.15em] uppercase text-black select-none"
              >
                {label}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </>
  );
}
