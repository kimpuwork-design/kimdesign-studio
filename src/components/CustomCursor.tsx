import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring, AnimatePresence } from "framer-motion";

export function CustomCursor() {
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  const [hovered, setHovered] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [label, setLabel] = useState("");
  const labelRef = useRef("");

  const x = useSpring(cursorX, { damping: 28, stiffness: 350, mass: 0.4 });
  const y = useSpring(cursorY, { damping: 28, stiffness: 350, mass: 0.4 });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (coarse || reduce) return;
    setEnabled(true);

    let raf = 0;
    let nx = 0, ny = 0;
    const move = (e: MouseEvent) => {
      nx = e.clientX; ny = e.clientY;
      if (!raf) {
        raf = requestAnimationFrame(() => {
          cursorX.set(nx); cursorY.set(ny);
          raf = 0;
        });
      }
    };

    // Event delegation — single listener, no re-attaching, no observer
    const findHover = (t: EventTarget | null): HTMLElement | null => {
      let el = t as HTMLElement | null;
      while (el && el !== document.body) {
        if (el.matches?.("a, button, [data-cursor-hover]")) return el;
        el = el.parentElement;
      }
      return null;
    };

    const over = (e: MouseEvent) => {
      const el = findHover(e.target);
      if (el) {
        setHovered(true);
        const lab = el.dataset.cursorLabel || "";
        if (lab !== labelRef.current) { labelRef.current = lab; setLabel(lab); }
      }
    };
    const out = (e: MouseEvent) => {
      const el = findHover(e.target);
      const next = findHover(e.relatedTarget);
      if (el && el !== next) {
        setHovered(false);
        if (labelRef.current) { labelRef.current = ""; setLabel(""); }
      }
    };

    const enter = () => setHidden(false);
    const leave = () => setHidden(true);

    window.addEventListener("mousemove", move, { passive: true });
    document.addEventListener("mouseover", over);
    document.addEventListener("mouseout", out);
    document.documentElement.addEventListener("mouseenter", enter);
    document.documentElement.addEventListener("mouseleave", leave);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", move);
      document.removeEventListener("mouseover", over);
      document.removeEventListener("mouseout", out);
      document.documentElement.removeEventListener("mouseenter", enter);
      document.documentElement.removeEventListener("mouseleave", leave);
    };
  }, [cursorX, cursorY]);

  if (!enabled) return null;
  const hasLabel = label.length > 0;

  return (
    <motion.div
      className="fixed top-0 left-0 z-[9999] pointer-events-none mix-blend-difference"
      style={{ x, y, translateX: "-50%", translateY: "-50%" }}
    >
      <motion.div
        animate={{
          width: hasLabel ? 80 : hovered ? 44 : 8,
          height: hasLabel ? 80 : hovered ? 44 : 8,
          opacity: hidden ? 0 : 1,
        }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
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
  );
}
