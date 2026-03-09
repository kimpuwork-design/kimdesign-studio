import { motion } from "framer-motion";

interface AnimatedDividerProps {
  className?: string;
  delay?: number;
}

const ease = [0.22, 1, 0.36, 1] as [number, number, number, number];

export function AnimatedDivider({ className = "", delay = 0 }: AnimatedDividerProps) {
  return (
    <div className={`overflow-hidden ${className}`}>
      <motion.div
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 1.2, delay, ease }}
        style={{ transformOrigin: "left" }}
        className="h-px bg-border/40"
      />
    </div>
  );
}
