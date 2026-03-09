import { motion } from "framer-motion";

interface SectionLabelProps {
  text: string;
  className?: string;
  delay?: number;
}

const ease = [0.22, 1, 0.36, 1] as [number, number, number, number];

export function SectionLabel({ text, className = "", delay = 0 }: SectionLabelProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay, ease }}
      className={`flex items-center gap-4 mb-8 ${className}`}
    >
      <motion.div
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: delay + 0.1, ease }}
        style={{ transformOrigin: "left" }}
        className="h-px w-10 bg-primary"
      />
      <span className="text-[10px] tracking-[0.35em] uppercase text-primary">
        {text}
      </span>
    </motion.div>
  );
}
