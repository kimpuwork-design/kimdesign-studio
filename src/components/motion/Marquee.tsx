import { useRef } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";

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

  const { scrollY } = useScroll();
  // Map scroll velocity to skew for a dynamic feel
  const scrollVelocity = useTransform(scrollY, (latest) => latest);
  const skewX = useSpring(
    useTransform(scrollVelocity, [0, 1], [0, 0]),
    { stiffness: 100, damping: 30 }
  );

  // Track scroll direction for velocity effect
  const lastScroll = useRef(0);
  const skewRef = useRef(0);

  // Use a simpler approach: CSS animation + scroll-driven skew
  return (
    <div ref={ref} className={`overflow-hidden whitespace-nowrap ${className}`}>
      <motion.div
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: items.length * speed / 10, repeat: Infinity, ease: "linear" }}
        style={{ skewX }}
        className="inline-block"
        onUpdate={() => {
          const current = window.scrollY;
          const diff = current - lastScroll.current;
          skewRef.current = Math.max(-3, Math.min(3, diff * 0.15));
          skewX.set(skewRef.current);
          lastScroll.current = current;
        }}
      >
        <span className="inline-block">{content}</span>
      </motion.div>
    </div>
  );
}
