interface MarqueeProps {
  items: string[];
  separator?: string;
  speed?: number;
  className?: string;
}

/**
 * Lightweight marquee — pure CSS animation, respects prefers-reduced-motion.
 * No JS scroll listener, no framer-motion springs, no continuous re-renders.
 */
export function Marquee({ items, separator = "·", speed = 30, className = "" }: MarqueeProps) {
  const text = items.join(` ${separator} `) + ` ${separator} `;
  const duration = Math.max(20, (items.length * speed) / 10);

  return (
    <div className={`overflow-hidden whitespace-nowrap ${className}`}>
      <div
        className="inline-block motion-safe:animate-[marquee_linear_infinite] will-change-transform"
        style={{ animationDuration: `${duration}s` }}
      >
        <span className="inline-block pr-8">{text}</span>
        <span className="inline-block pr-8" aria-hidden>{text}</span>
      </div>
    </div>
  );
}
