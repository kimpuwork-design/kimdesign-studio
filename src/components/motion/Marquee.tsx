import { useRef, useEffect } from "react";
import { motion, useScroll, useSpring, useMotionValue } from "framer-motion";

interface MarqueeProps {
  items: string[];
  separator?: string;
  speed?: number;
  className?: string;
}

export function Marquee({ items, separator = "·", speed = 30, className = "" }: MarqueeProps) {
  const ref = useRef<HTMLDivElement>(null);
  const text = items.join(` ${separator} `) + ` ${separator} `;
  const content = `${text}${text}`;

  const rawSkew = useMotionValue(0);
  const skewX = useSpring(rawSkew, { stiffness: 120, damping: 25 });

  const lastScrollY = useRef(0);
  const rafId = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const current = window.scrollY;
      const delta = current - lastScrollY.current;
      // Clamp skew between -4 and 4 degrees based on scroll velocity
      const target = Math.max(-4, Math.min(4, delta * 0.2));
      rawSkew.set(target);
      lastScrollY.current = current;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [rawSkew]);

  return (
    <div ref={ref} className={`overflow-hidden whitespace-nowrap ${className}`}>
      <motion.div
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: items.length * speed / 10, repeat: Infinity, ease: "linear" }}
        style={{ skewX }}
        className="inline-block will-change-transform"
      >
        <span className="inline-block">{content}</span>
      </motion.div>
    </div>
  );
}
