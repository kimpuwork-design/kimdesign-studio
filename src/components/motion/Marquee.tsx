import { motion } from "framer-motion";

interface MarqueeProps {
  items: string[];
  separator?: string;
  speed?: number;
  className?: string;
}

export function Marquee({ items, separator = "·", speed = 30, className = "" }: MarqueeProps) {
  const text = items.join(` ${separator} `) + ` ${separator} `;
  // Duplicate for seamless loop
  const content = `${text}${text}`;

  return (
    <div className={`overflow-hidden whitespace-nowrap ${className}`}>
      <motion.div
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: items.length * speed / 10, repeat: Infinity, ease: "linear" }}
        className="inline-block"
      >
        <span className="inline-block">{content}</span>
      </motion.div>
    </div>
  );
}
