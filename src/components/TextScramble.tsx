import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

interface TextScrambleProps {
  text: string;
  className?: string;
  delay?: number;
  speed?: number;
  as?: "h1" | "h2" | "h3" | "h4" | "p" | "span";
}

export function TextScramble({
  text,
  className = "",
  delay = 0,
  speed = 40,
  as: Tag = "span",
}: TextScrambleProps) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const [display, setDisplay] = useState(text.replace(/[^\s]/g, " "));
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!inView) return;
    const timer = setTimeout(() => setStarted(true), delay * 1000);
    return () => clearTimeout(timer);
  }, [inView, delay]);

  useEffect(() => {
    if (!started) return;

    const chars = text.split("");
    const resolved = new Array(chars.length).fill(false);
    let frame = 0;

    const interval = setInterval(() => {
      frame++;
      const output = chars.map((char, i) => {
        if (char === " ") return " ";
        if (resolved[i]) return char;
        // Resolve characters progressively
        if (frame > (i + 1) * 2) {
          resolved[i] = true;
          return char;
        }
        return CHARS[Math.floor(Math.random() * CHARS.length)];
      });

      setDisplay(output.join(""));

      if (resolved.every(Boolean)) {
        clearInterval(interval);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [started, text, speed]);

  return (
    <motion.span
      ref={ref as any}
      initial={{ opacity: 0 }}
      animate={inView ? { opacity: 1 } : {}}
      transition={{ duration: 0.3 }}
    >
      <Tag className={className}>{display}</Tag>
    </motion.span>
  );
}
